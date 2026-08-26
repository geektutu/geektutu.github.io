---
title: Go Context 并发编程简明教程
description: >-
  WaitGroup 和信道(channel)是常见的 2 种并发控制的方式。但是对于复杂的并发场景，Context 上下文是更优雅的控制方式。Context 提供了
  WithCancel(取消)、WithValue(传值)、WithTimeout(超时机制)、WithDeadline(截止时间)等4种并发控制的方式。
date: '2020-04-20 23:30:00'
tags:
  - Go
book: history
status: done
draft: false
cover: /post/quick-go-context/context_sm.jpg
---

## 1 为什么需要 Context

WaitGroup 和信道(channel)是常见的 2 种并发控制的方式。

如果并发启动了多个子协程，需要等待所有的子协程完成任务，WaitGroup 非常适合于这类场景，例如下面的例子：

```go
var wg sync.WaitGroup

func doTask(n int) {
	time.Sleep(time.Duration(n))
	fmt.Printf("Task %d Done\n", n)
	wg.Done()
}

func main() {
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go doTask(i + 1)
	}
	wg.Wait()
	fmt.Println("All Task Done")
}
```

`wg.Wait()` 会等待所有的子协程任务全部完成，所有子协程结束后，才会执行 `wg.Wait()` 后面的代码。

```bash
Task 3 Done
Task 1 Done
Task 2 Done
All Task Done
```

WaitGroup 只是傻傻地等待子协程结束，但是并不能主动通知子协程退出。假如开启了一个定时轮询的子协程，有没有什么办法，通知该子协程退出呢？这种场景下，可以使用 `select+chan` 的机制。

```go
var stop chan bool

func reqTask(name string) {
	for {
		select {
		case <-stop:
			fmt.Println("stop", name)
			return
		default:
			fmt.Println(name, "send request")
			time.Sleep(1 * time.Second)
		}
	}
}

func main() {
	stop = make(chan bool)
	go reqTask("worker1")
	time.Sleep(3 * time.Second)
	stop <- true
	time.Sleep(3 * time.Second)
}
```

子协程使用 for 循环定时轮询，如果 `stop` 信道有值，则退出，否则继续轮询。

```bash
worker1 send request
worker1 send request
worker1 send request
stop worker1
```

更复杂的场景如何做并发控制呢？比如子协程中开启了新的子协程，或者需要同时控制多个子协程。这种场景下，`select+chan`的方式就显得力不从心了。

Go 语言提供了 Context 标准库可以解决这类场景的问题，Context 的作用和它的名字很像，上下文，即子协程的下上文。Context 有两个主要的功能：

- 通知子协程退出（正常退出，超时退出等）；
- 传递必要的参数。

## 2 context.WithCancel

`context.WithCancel()` 创建可取消的 Context 对象，即可以主动通知子协程退出。

### 2.1 控制单个协程

使用 Context 改写上述的例子，效果与 `select+chan` 相同。

```go
func reqTask(ctx context.Context, name string) {
	for {
		select {
		case <-ctx.Done():
			fmt.Println("stop", name)
			return
		default:
			fmt.Println(name, "send request")
			time.Sleep(1 * time.Second)
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	go reqTask(ctx, "worker1")
	time.Sleep(3 * time.Second)
	cancel()
	time.Sleep(3 * time.Second)
}
```

- `context.Backgroud()` 创建根 Context，通常在 main 函数、初始化和测试代码中创建，作为顶层 Context。
- `context.WithCancel(parent)` 创建可取消的子 Context，同时返回函数 `cancel`。
- 在子协程中，使用 select 调用 `<-ctx.Done()` 判断是否需要退出。
- 主协程中，调用 `cancel()` 函数通知子协程退出。

### 2.2 控制多个协程

```go
func main() {
	ctx, cancel := context.WithCancel(context.Background())
	
	go reqTask(ctx, "worker1")
	go reqTask(ctx, "worker2")
	
	time.Sleep(3 * time.Second)
	cancel()
	time.Sleep(3 * time.Second)
}
```

为每个子协程传递相同的上下文 `ctx` 即可，调用 `cancel()` 函数后该 Context 控制的所有子协程都会退出。

```bash
worker1 send request
worker2 send request
worker1 send request
worker2 send request
worker1 send request
worker2 send request
stop worker1
stop worker2
```

## 3 context.WithValue

如果需要往子协程中传递参数，可以使用 `context.WithValue()`。

```go
type Options struct{ Interval time.Duration }

func reqTask(ctx context.Context, name string) {
	for {
		select {
		case <-ctx.Done():
			fmt.Println("stop", name)
			return
		default:
			fmt.Println(name, "send request")
			op := ctx.Value("options").(*Options)
			time.Sleep(op.Interval * time.Second)
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	vCtx := context.WithValue(ctx, "options", &Options{1})

	go reqTask(vCtx, "worker1")
	go reqTask(vCtx, "worker2")

	time.Sleep(3 * time.Second)
	cancel()
	time.Sleep(3 * time.Second)
}
```

- `context.WithValue()` 创建了一个基于 `ctx` 的子 Context，并携带了值 `options`。
- 在子协程中，使用 `ctx.Value("options")` 获取到传递的值，读取/修改该值。

## 4 context.WithTimeout

如果需要控制子协程的执行时间，可以使用 `context.WithTimeout` 创建具有超时通知机制的 Context 对象。

```
func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	go reqTask(ctx, "worker1")
	go reqTask(ctx, "worker2")

	time.Sleep(3 * time.Second)
	fmt.Println("before cancel")
	cancel()
	time.Sleep(3 * time.Second)
}
```

`WithTimeout()`的使用与 `WithCancel()` 类似，多了一个参数，用于设置超时时间。执行结果如下：

```bash
worker2 send request
worker1 send request
worker1 send request
worker2 send request
stop worker2
stop worker1
before cancel
```

因为超时时间设置为 2s，但是 main 函数中，3s 后才会调用 `cancel()`，因此，在调用 `cancel()` 函数前，子协程因为超时已经退出了。

## 5 context.WithDeadline

超时退出可以控制子协程的最长执行时间，那 `context.WithDeadline()` 则可以控制子协程的最迟退出时间。

```go
func reqTask(ctx context.Context, name string) {
	for {
		select {
		case <-ctx.Done():
			fmt.Println("stop", name, ctx.Err())
			return
		default:
			fmt.Println(name, "send request")
			time.Sleep(1 * time.Second)
		}
	}
}

func main() {
	ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(1*time.Second))
	go reqTask(ctx, "worker1")
	go reqTask(ctx, "worker2")

	time.Sleep(3 * time.Second)
	fmt.Println("before cancel")
	cancel()
	time.Sleep(3 * time.Second)
}
```

- `WithDeadline` 用于设置截止时间。在这个例子中，将截止时间设置为1s后，`cancel()` 函数在 3s 后调用，因此子协程将在调用 `cancel()` 函数前结束。
- 在子协程中，可以通过 `ctx.Err()` 获取到子协程退出的错误原因。

运行结果如下：

```bash
worker2 send request
worker1 send request
stop worker2 context deadline exceeded
stop worker1 context deadline exceeded
before cancel
```

可以看到，子协程 `worker1` 和 `worker2` 均是因为截止时间到了而退出。
