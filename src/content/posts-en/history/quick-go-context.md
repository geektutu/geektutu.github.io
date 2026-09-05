---
title: "Go Context: A Quick Guide to Concurrency Control"
description: >-
  WaitGroup and channels are two common ways to control concurrency, but
  for complex scenarios Context is a more elegant mechanism. Context
  provides four control mechanisms: WithCancel, WithValue, WithTimeout and
  WithDeadline.
date: '2020-04-20 23:30:00'
tags:
  - Go
book: history
status: done
draft: false
cover: ../../posts/history/quick-go-context/context_sm.jpg
---

## 1 Why you need Context

WaitGroup and channels are the two most common ways to control concurrency.

If you start multiple goroutines concurrently and need to wait for all of them to finish their tasks, WaitGroup is a great fit for that scenario, for example:

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

`wg.Wait()` waits until all the goroutines have completed their tasks; the code after `wg.Wait()` only runs once every goroutine has finished.

```bash
Task 3 Done
Task 1 Done
Task 2 Done
All Task Done
```

WaitGroup just waits dumbly for goroutines to finish — it cannot proactively tell a goroutine to exit. Suppose you've started a goroutine that polls on a timer; is there a way to tell that goroutine to exit? In this scenario, you can use the `select+chan` mechanism.

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

The goroutine polls on a timer inside a for loop; if the `stop` channel has a value, it exits, otherwise it keeps polling.

```bash
worker1 send request
worker1 send request
worker1 send request
stop worker1
```

How do you control concurrency in more complex scenarios? For example, when a goroutine spawns new goroutines of its own, or when you need to control several goroutines at the same time. In these cases, `select+chan` starts to fall short.

Go's standard Context library solves problems like these. Context lives up to its name — context, that is, the context of the goroutines it spawns. Context has two main functions:

- Notify goroutines to exit (normal exit, exit on timeout, and so on);
- Pass along necessary parameters.

## 2 context.WithCancel

`context.WithCancel()` creates a cancelable Context, i.e. one that can proactively notify goroutines to exit.

### 2.1 Controlling a single goroutine

Rewrite the example above with Context; the behavior is identical to `select+chan`.

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

- `context.Background()` creates the root Context. It is usually created in the main function, in initialization code or in tests, and serves as the top-level Context.
- `context.WithCancel(parent)` creates a cancelable child Context and also returns the `cancel` function.
- In the goroutine, use select on `<-ctx.Done()` to decide whether to exit.
- In the main goroutine, call the `cancel()` function to notify the goroutines to exit.

### 2.2 Controlling multiple goroutines

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

Simply pass the same context `ctx` to each goroutine; once `cancel()` is called, all goroutines controlled by that Context will exit.

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

To pass parameters into goroutines, you can use `context.WithValue()`.

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

- `context.WithValue()` creates a child Context based on `ctx` that carries the value `options`.
- In the goroutine, `ctx.Value("options")` retrieves the passed value, which can then be read/modified.

## 4 context.WithTimeout

To control how long goroutines run, use `context.WithTimeout` to create a Context with a timeout notification mechanism.

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

`WithTimeout()` is used just like `WithCancel()`, with one extra parameter that sets the timeout duration. The output looks like this:

```bash
worker2 send request
worker1 send request
worker1 send request
worker2 send request
stop worker2
stop worker1
before cancel
```

The timeout is set to 2s, but `cancel()` in the main function is only called after 3s, so the goroutines have already exited because of the timeout before `cancel()` is ever called.

## 5 context.WithDeadline

A timeout exit controls the maximum time goroutines can run, whereas `context.WithDeadline()` controls the latest time at which goroutines exit.

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

- `WithDeadline` sets a deadline. In this example, the deadline is set to 1s from now, while the `cancel()` function is called after 3s, so the goroutines finish before `cancel()` is called.
- In the goroutine, `ctx.Err()` returns the reason the goroutine exited.

The output looks like this:

```bash
worker2 send request
worker1 send request
stop worker2 context deadline exceeded
stop worker1 context deadline exceeded
before cancel
```

As you can see, both goroutines, `worker1` and `worker2`, exited because the deadline was reached.

> The Chinese original of this article is available at [geektutu.com/post/quick-go-context.html](https://geektutu.com/post/quick-go-context.html).
