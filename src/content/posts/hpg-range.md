---
title: for 和 range 的性能比较
description: 在性能敏感路径上，for 与 range 的差异在哪里？逐一 benchmark 对比索引遍历、值拷贝与指针遍历。
date: 2020-12-01
tags: [golang, 性能, 循环]
book: hpg
status: done
---

## 1. 三种遍历方式

对切片遍历，常见有三种写法：

```go
// 1. 经典 for 索引
for i := 0; i < n; i++ {
	_ = s[i]
}

// 2. range 索引
for i := range s {
	_ = s[i]
}

// 3. range 值拷贝
for _, v := range s {
	_ = v
}
```

## 2. 值拷贝的开销

`range` 的 `v` 是每个元素的**拷贝**。对大型结构体而言，每次迭代都会复制一份，开销不容忽视。

```go
type Big struct {
	Data [32]byte
}

func RangeValue(items []Big) {
	for _, it := range items {   // 每次都拷贝 32 字节
		_ = it
	}
}

func RangePointer(items []Big) {
	for i := range items {
		_ = items[i]
	}
}
```

:::tip[结论]
- 遍历索引或指针，避免不必要的值拷贝
- 对小型标量类型，值拷贝与索引差异可忽略
- 编译器有时能优化掉无副作用的拷贝，但不要依赖它
:::

## 小结

- 优先 `for i := range` 或 `for i` 索引访问
- 结构体元素较大时，避免 `range` 值拷贝
- 用 benchmark 验证，而非凭直觉
