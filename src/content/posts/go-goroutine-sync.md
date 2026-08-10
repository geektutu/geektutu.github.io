---
title: Go 并发编程：Goroutine 与 Channel 入门
description: 一篇独立的技术随笔，介绍 goroutine 的轻量调度与 channel 的同步通信方式。
date: 2022-03-15
updated: 2024-06-01
tags: [golang, 并发, 教程]
---

## 1. Goroutine

goroutine 是 Go 运行时管理的轻量级"线程"，启动成本极低，可以用 `go` 关键字启动成千上万个。

```go
func main() {
	go func() {
		fmt.Println("hello goroutine")
	}()
	time.Sleep(10 * time.Millisecond)
}
```

## 2. Channel

channel 用于 goroutine 之间的通信与同步。

```go
ch := make(chan int, 1)
ch <- 42
v := <-ch
fmt.Println(v)
```

:::note[无缓冲 vs 有缓冲]
无缓冲 channel 的发送会阻塞直到对方接收，天然实现同步；有缓冲 channel 提供异步的队列。
:::

## 3. select 多路复用

```go
select {
case v := <-ch1:
	fmt.Println(v)
case <-time.After(1 * time.Second):
	fmt.Println("timeout")
}
```

## 小结

- goroutine 轻量、易用
- channel 是 goroutine 通信的惯用方式
- `select` 实现多 channel 的等待与超时
