---
title: 字符串拼接性能及原理
description: 五种常见字符串拼接方式的 benchmark 对比，以及 strings.Builder 高性能背后的内存分配原理。
date: 2020-11-24
updated: 2025-03-10
tags: [golang, 性能, 字符串]
book: hpg
status: done
---

## 1. 字符串高效拼接

在 Go 语言中，字符串（string）是不可变的，拼接字符串事实上是创建了一个新的字符串对象。如果代码中存在大量的字符串拼接，对性能会产生严重的影响。

:::note[什么是不可变？]
字符串在 Go 中是值类型，底层是只读的字节序列。任何"修改"都会生成新的字符串，而不是原地改动。
:::

### 1.1 常见的拼接方式

为了避免编译器优化，我们首先实现一个生成长度为 n 的随机字符串的函数。

```go
const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func randomString(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return string(b)
}
```

然后利用这个函数生成字符串 `str`，然后将 `str` 拼接 N 次。在 Go 语言中，常见的字符串拼接方式有如下 5 种：

- 使用 `+`
- 使用 `fmt.Sprintf`
- 使用 `strings.Builder`
- 使用 `bytes.Buffer`
- 使用 `[]byte`

如果长度是可预知的，那么创建 `[]byte` 时，我们还可以预分配切片的容量（cap）。

```go
func preByteConcat(n int, str string) string {
	buf := make([]byte, 0, n*len(str))
	for i := 0; i < n; i++ {
		buf = append(buf, str...)
	}
	return string(buf)
}
```

`make([]byte, 0, n*len(str))` 第二个参数是长度，第三个参数是容量（cap），切片创建时，将预分配 cap 大小的内存。

### 1.2 benchmark 性能比拼

每个 benchmark 用例中，生成了一个长度为 10 的字符串，并拼接 1w 次。

```text
$ go test -bench="Concat$" -benchmem .

BenchmarkPlusConcat-8      19    56 ms/op    530 MB/op   10026 allocs/op
BenchmarkSprintfConcat-8   10   112 ms/op    835 MB/op   37435 allocs/op
BenchmarkBuilderConcat-8  8901   0.13 ms/op   0.5 MB/op    23 allocs/op
BenchmarkBufferConcat-8   8130   0.14 ms/op   0.4 MB/op    13 allocs/op
BenchmarkByteConcat-8     8984   0.12 ms/op   0.6 MB/op    24 allocs/op
BenchmarkPreByteConcat-8 17379   0.07 ms/op   0.2 MB/op     2 allocs/op
```

:::tip[结论]
使用 `+` 和 `fmt.Sprintf` 的效率最低，与其余方式相比性能相差约 1000 倍。综合易用性和性能，一般推荐使用 `strings.Builder`。
:::

### 1.3 建议

`string.Builder` 也提供了预分配内存的方式 `Grow`：

```go
func builderConcat(n int, str string) string {
	var builder strings.Builder
	builder.Grow(n * len(str))
	for i := 0; i < n; i++ {
		builder.WriteString(str)
	}
	return builder.String()
}
```

## 2 性能背后的原理

### 2.1 比较 strings.Builder 和 `+`

字符串在 Go 语言中是不可变类型，占用内存大小是固定的。当使用 `+` 拼接 2 个字符串时，生成一个新的字符串，需要开辟一段新的空间，大小为原来两个字符串大小之和。假设一个字符串大小为 10 byte，拼接 1w 次，需要申请的内存大小为：

$$10 + 2 \times 10 + 3 \times 10 + \cdots + 10000 \times 10 = 500\ \text{MB}$$

而 `strings.Builder`、`bytes.Buffer`、包括切片 `[]byte` 的内存是按倍数申请的，初始大小为 0，当第一次写入 10 byte 时，申请 16 byte；第二次写入时不够，申请 32 byte，以此类推。

### 2.2 比较 strings.Builder 和 bytes.Buffer

`strings.Builder` 和 `bytes.Buffer` 底层都是 `[]byte` 数组，但 `strings.Builder` 性能比 `bytes.Buffer` 略快约 10%。一个重要的区别在于，`bytes.Buffer` 转化为字符串时重新申请了一块空间，而 `strings.Builder` 直接将底层的 `[]byte` 转换成字符串类型返回。

```go
// bytes.Buffer
func (b *Buffer) String() string {
	return string(b.buf[b.off:])
}

// strings.Builder
func (b *Builder) String() string {
	return *(*string)(unsafe.Pointer(&b.buf))
}
```

:::warn[注意]
`bytes.Buffer` 的注释中特意提到："To build strings more efficiently, see the strings.Builder type."
:::

## 小结

1. 字符串最高效的拼接方式是结合预分配内存 `Grow` 使用 `strings.Builder`
2. 使用 `+` 拼接时，生成新字符串需要开辟新的空间
3. `strings.Builder`、`bytes.Buffer`、`[]byte` 的内存按倍数申请
4. `strings.Builder` 比 `bytes.Buffer` 更快，因为省去了 `[]byte` 到 `string` 的转换
