---
title: Go2 新特性简明教程
description: >-
  GO 2 (golang 2) 的变化和新特性，与Go1相比Go2的变化。GO2草案，GO2设计草案。包管理机制(package)、错误处理(Error handling)，错误值(Error
  values)和泛型(Generics)。GO语言的历史。difference between GO 2 and GO 1.
date: '2019-08-15 23:59:10'
tags:
  - Go
book: history
status: done
draft: false
cover: /post/quick-go2/go2.jpg
---

![quick-go2](/post/quick-go2/go2.jpg)

图片引用自`udemy.com`

## Go 的演进

Go语言/golang 诞生于2007年，经过12年的发展，Go逐渐成为了云计算领域新一代的开发语言。Go语言在牺牲很少性能的情况下，语法简洁，功能强大。我是Python的重度用户，在学习Go时，却有一种在学习Python的感觉。并非语法相似，而是Go语言作为一门编译型语言，竟然能够像Python一样，少量的代码就能够完成尽可能多的事情。Go语言仿佛是C和Python的结合体。

Go是如何火起来的呢？我觉得有几个主要的原因，除了语言本身性能好，语法简单，易上手外。Go语言原生支持`Goroutine`和`Channel`，极大地降低了并发和异步编程的复杂度。对于服务端编程，并发和异步尤其重要，相比之下，C++，Java等语言的并发和异步控制逻辑过于复杂。另外，杀手级应用`Docker`的出现起到了很大的推动作用。

Go语言也有很多令人诟病的地方，例如包管理机制，Go直到v1.6才默认开启了vendor机制，vendor机制非常简陋，简单说就是在项目目录下增加一个vendor文件夹，里面放第三方依赖。vendor机制是没有版本概念的，而且不能解决vendor目录嵌套的问题以及同名包函数冲突问题。后来社区涌现了大量的包管理工具，仅官方推荐的包管理工具就有15种之多，应用比较广泛的，如dep、govendor。直到v1.11，官方增加了Go modules机制，才算较为完整地解决了包管理的问题。

Go2 可以说是Go语言一个非常重要的里程碑，Go1 目前虽然已经到了1.12版本，事实上每一个版本很少涉及语法层面的变化，而且每个版本都是向前兼容的。较大的改动如下：

- Go1.2 切片操作

```go
var a = make([]int, 10)
var b = a[i:j:k]
```

- Go1.4 for语言加强

```go
// <= 1.3
for i, v := range x {
    // ...
}

for i := range x {
    // ...
}

// 1.4 新增
var times [5][0]int

for i := 0; i < len(times); i++ {
    // ...
}

for _ = range times {
    // ...
}
```

- Go1.9 类型别名

```go
type T1 = T2
```

## Go 2 设计草案

为了进一步完善Go语言，提供更好的体验。Go语言社区目前发布了三类重要的设计草案，分别是`错误处理(Error handling)`、`错误值(Error values)`、`泛型(Generics)`，这几个草案代表了社区重点关注的完善方向，但并不代表最终的实现。

### 错误处理(Error Handling)

Go1 的错误处理机制非常简单，通过返回值的方式，强迫调用者对错误进行处理，这种设计导致会在代码中写大量的`if`判断。例如：

```go
func CopyFile(src, dst string) {
	r := os.Open(src)
	defer r.Close()

	w := os.Create(dst)
	io.Copy(w, r)
	w.Close()
}
```

IO操作容易引发错误，文件打开失败，创建失败，拷贝失败等都会产生错误。如果要对这个函数进行完整的错误处理，代码将变成这样：

```go
func CopyFile(src, dst string) error {
	r, err := os.Open(src)
	if err != nil {
		return err
	}
	defer r.Close()

	w, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer w.Close()

	if _, err := io.Copy(w, r); err != nil {
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}
}
```

看似逻辑清晰，但不够优雅，充斥了大量重复的逻辑。这是Go错误处理机制的缺陷。同时，因为错误处理机制的繁琐，很多开发者在开发应用时，很少去检查并处理错误，程序的健壮性得不到保证。

为了解决这个问题，Go2 发布了一个设计草案供社区讨论，Go2将会完善错误处理机制，错误处理的语法将会简洁很多。

这个提案引入了`handle err`和`check`关键字，上面的函数可以简化成：

```go
func CopyFile(src, dst string) error {
    handle err {
		return fmt.Errorf("copy %s %s: %v", src, dst, err)
	}
	r := check os.Open(src)
	defer r.Close()

	w := check os.Create(dst)
	check io.Copy(w, r)
	check w.Close()
}
```

为什么不使用被Java、Python等语言采用的`try`关键字呢？比如写成：

```go
data := try parseHexdump(string(hex))
```

上面的写法看似和谐，但`try`关键字直接应用在 error values 时，可读性就没那么好了：

```go
data, err := parseHexdump(string(hex))
if err == ErrBadHex {
	... special handling ...
}
try err
```

很明显，在这种场景下，`check err`显然比`try err`更有意义。

### 错误值(Error values)

同样由于错误处理机制设计得较为简陋，Go语言对`Error values`支持有限。任何值，只要实现了`error`接口，都是错误类型。由于缺少细粒度的设计，在各种库当中，判断是否产生错误以及产生了哪类错误的方式多种多样，例如`io.EOF`，`os.IsNotExist`，`err.Error()`等，。另外，Go语言目前没有机制追溯到完整的错误链条。例如，

```go
func funcB() error {
    if v, err := funcA(); if err != nil {
        return fmt.Errorf("connect to db: %v", err)
    }
}
func funcC() error {
    v, err := funcB()
    if err != nil {
	    return fmt.Errorf("write users database: %v", err)
    }
}
```

`funcC`返回的错误信息是：

```bash
write users database: connect to db: open /etc/xx.conf: permission denied
```

每一层，用额外的字符串对错误进行封装，是目前最常用的方法，除了通过字符串解析，很难还原出完整的错误链条。

为了解决Error values缺少标准的问题，有2个提案，分别针对`Error inspection`和`Error formatting`。

- 针对 Error inspection ，为error定义了一个可选的接口`Unwrap`，用来返回错误链上的下一个错误。

```go
package errors

type Wrapper interface {
	Unwrap() error
}
```

例如，

```go
// WriteError 实现 Unwrap 接口
func (e *WriteError) Unwrap() error { return e.Err }
```

- 针对 Error format，定义了一个可选的接口`Format`，用来返回错误信息。

```go
package errors

type Formatter interface {
	Format(p Printer) (next error)
}
```

例如，

```go
func (e *WriteError) Format(p errors.Printer) (next error) {
	p.Printf("write %s database", e.Database)
	if p.Detail() {
		p.Printf("more detail here")
	}
	return e.Err
}
```

### 泛型(Generics)

Go语言当前可使用`inferface{}`，允许函数参数和返回值是任何类型的值。但这过于灵活，很多时候需要在获取参数后使用类型断言，进而决定下一步的处理。对比C++/Java的标准容器，Go语言在泛型方面有很大不足，因此针对泛型的提案即希望弥补这方面的不足。提案希望能够支持以下功能：

```go
type List(type T) []T
// 返回map的键
func Keys(type K, V)(m map[K]V) []K
// 去重过滤
func Uniq(<-chan T) <-chan T
// 合并
func Merge(chans ...<-chan T) <-chan T
// 使用自定义排序函数排序
func SortSlice(data []T, less func(x, y T) bool)
```

例如，我们需要返回一个map对象中所有的键，而希望这个键的类型可以是任意类型。

```go
var ints List(int)
keysA := Keys(int, string)(map[int]string{1:"one", 2: "two"})
keysB := Keys(string, string)(map[string]string{"name":"geektutu", "age": "twenty"})
// [1, 2]
```

> 参考：[Go2 wiki - Github](https://github.com/golang/go/wiki/Go2)

## Go 2 新特性

Go2还未正式发布，发布后更新
