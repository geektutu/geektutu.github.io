---
title: 切片(slice)性能及陷阱
description: 理解切片的底层结构、扩容机制与常见性能陷阱，避免误用带来的额外拷贝与内存泄漏。
date: 2020-11-30
updated: 2024-12-01
tags: [golang, 性能, 切片]
book: hpg
status: done
---

## 1. 切片的底层结构

切片在 Go 中是一个三元组：指向底层数组的指针、长度 `len` 与容量 `cap`。

```go
type slice struct {
	array unsafe.Pointer
	len   int
	cap   int
}
```

因为切片只是对底层数组的引用，多个切片可以共享同一块底层数组，这正是许多性能问题的根源。

## 2. 扩容机制

当追加元素超出 `cap` 时，切片会触发扩容。Go 采用"翻倍 + 渐进"的策略：

```go
// 小于 1024 时翻倍，大于后按 1.25 倍增长
if old.len < 1024 {
	newcap = doublecap
} else {
	for 0 < newcap && newcap < cap {
		newcap += newcap / 4
	}
}
```

:::note[扩容带来的开销]
扩容会分配新的底层数组并把旧元素全部拷贝过去。若能预知长度，应尽量用 `make([]T, 0, n)` 预分配容量，避免反复扩容。
:::

## 3. 常见陷阱

### 3.1 共享底层数组

```go
a := []int{1, 2, 3, 4, 5}
b := a[1:3]          // b 与 a 共享底层数组
b[0] = 100
fmt.Println(a)       // [1 100 3 4 5]，a 也被修改
```

### 3.2 大切片截断导致内存泄漏

```go
big := make([]byte, 1<<30)   // 1GB
small := big[0:1024]         // 只想保留 1KB
big = nil                    // big 置空，但底层数组仍被 small 引用
```

截断后若不再需要大切片，应使用 `copy` 生成独立的小切片，以释放内存。

## 小结

- 切片是底层数组的引用，`len`/`cap` 语义要理清
- 预分配容量可显著减少扩容拷贝
- 注意共享底层数组与截断导致的内存泄漏
