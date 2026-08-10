---
title: Go 空结构体 struct{} 的使用
description: 零大小的空结构体在 Go 中有着独特用途——作为信号、集合的键值占位，或作为不需要数据的"对象"。
date: 2020-12-25
tags: [golang, 结构体]
book: hpg
status: done
---

## 1. 零大小

空结构体 `struct{}` 不占用任何内存。声明一个空结构体类型的值为零大小。

```go
var s struct{}
fmt.Println(unsafe.Sizeof(s)) // 0
```

## 2. 用作集合

用 `map[string]struct{}` 代替 `map[string]bool` 表示集合，避免浪费 1 个字节的布尔值：

```go
set := make(map[string]struct{})
set["go"] = struct{}{}

if _, ok := set["go"]; ok {
	fmt.Println("exists")
}
```

## 3. 用作信号通道

`chan struct{}` 常用于只传递"事件"而不传递数据的信号：

```go
done := make(chan struct{})
go func() {
	// do work
	close(done)
}()
<-done
```

:::tip[何时用]
当只需要"存在/发生"这一信息、而不关心具体数值时，`struct{}` 是零成本的占位选择。
:::

## 小结

- `struct{}` 零大小，可用于集合与信号
- 语义上表示"无需数据"的占位
