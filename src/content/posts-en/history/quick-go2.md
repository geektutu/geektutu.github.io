---
title: "A Quick Guide to Go 2"
description: >-
  What changes in Go 2 compared to Go 1: the latest design drafts covering
  packages, error handling, error values and generics, plus a short history
  of the Go language.
date: '2019-08-15 23:59:10'
tags:
  - Go
book: history
status: done
draft: false
cover: ../../posts/history/quick-go2/go2.jpg
---

![quick-go2](../../posts/history/quick-go2/go2.jpg)

Image from `udemy.com`

## The Evolution of Go

Go (golang) was born in 2007. After 12 years of development, Go has gradually become the new-generation language for cloud computing. At the cost of very little performance, Go offers concise syntax and powerful features. I'm a heavy Python user, yet when I learned Go it felt like learning Python again — not because the syntaxes are similar, but because Go, as a compiled language, manages to accomplish as much with as little code as Python. Go feels like a blend of C and Python.

How did Go become so popular? I think there are a few main reasons. Besides good performance and a simple, easy-to-learn syntax, Go has native support for `Goroutine` and `Channel`, which greatly reduces the complexity of concurrent and asynchronous programming. For server-side programming, concurrency and asynchrony are especially important; by comparison, the concurrency and async control logic of languages like C++ and Java is far more convoluted. On top of that, the arrival of the killer app `Docker` gave Go a big push.

Go has its share of criticisms too, such as package management. Go only enabled the vendor mechanism by default in v1.6, and it was extremely primitive: in short, you add a vendor folder under the project directory and put third-party dependencies in it. The vendor mechanism has no concept of versions, and it can neither handle nested vendor directories nor resolve conflicts between packages with the same name. Later, a large number of package management tools emerged from the community — the officially recommended ones alone numbered 15 — with dep and govendor among the more widely used. It wasn't until v1.11, when the official Go modules mechanism was introduced, that package management was considered more or less solved.

Go 2 is a very important milestone for the language. Go 1 has reached version 1.12, yet in practice each release involves few syntax-level changes, and every release is backward compatible. The larger changes so far:

- Go1.2 slice expressions

```go
var a = make([]int, 10)
var b = a[i:j:k]
```

- Go1.4 for loop enhancements

```go
// <= 1.3
for i, v := range x {
    // ...
}

for i := range x {
    // ...
}

// new in 1.4
var times [5][0]int

for i := 0; i < len(times); i++ {
    // ...
}

for _ = range times {
    // ...
}
```

- Go1.9 type aliases

```go
type T1 = T2
```

## Go 2 Design Drafts

To further improve Go and deliver a better experience, the Go community has published three major design drafts: `Error handling`, `Error values`, and `Generics`. These drafts represent the directions the community is focusing on, but they are not final implementations.

### Error Handling

Go 1's error handling is very simple: errors are returned as values, which forces callers to handle them and leads to a lot of `if` checks in the code. For example:

```go
func CopyFile(src, dst string) {
	r := os.Open(src)
	defer r.Close()

	w := os.Create(dst)
	io.Copy(w, r)
	w.Close()
}
```

IO operations are error-prone — a failed open, a failed create, a failed copy all produce errors. With complete error handling, the function turns into:

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

The logic is clear, but it's far from elegant — drowned in repetitive code. That's a flaw of Go's error handling. What's worse, because handling errors is so tedious, many developers rarely check or handle errors when building applications, and the robustness of their programs suffers.

To solve this, Go 2 published a design draft for community discussion. Go 2 will improve the error handling mechanism, and the syntax will become much more concise.

The proposal introduces the `handle err` and `check` keywords, so the function above can be simplified to:

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

Why not use the `try` keyword adopted by languages like Java and Python? Something like:

```go
data := try parseHexdump(string(hex))
```

This looks fine, but once `try` is applied directly to error values, readability drops:

```go
data, err := parseHexdump(string(hex))
if err == ErrBadHex {
	... special handling ...
}
try err
```

Clearly, in this scenario, `check err` makes far more sense than `try err`.

### Error Values

For the same reason — the error handling mechanism was designed rather crudely — Go's support for `Error values` is limited. Any value that implements the `error` interface is an error type. Because fine-grained design is missing, libraries vary widely in how you check whether an error occurred and which one it is: `io.EOF`, `os.IsNotExist`, `err.Error()`, and so on. On top of that, Go currently has no mechanism to trace back the complete chain of errors. For example:

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

The error returned by `funcC` reads:

```bash
write users database: connect to db: open /etc/xx.conf: permission denied
```

Wrapping the error with an extra string at each layer is the most common approach today; apart from parsing strings, there is no way to recover the complete error chain.

To fix the lack of a standard for error values, there are two proposals, targeting `Error inspection` and `Error formatting` respectively.

- For Error inspection, an optional `Unwrap` interface is defined for errors, which returns the next error in the chain.

```go
package errors

type Wrapper interface {
	Unwrap() error
}
```

For example:

```go
// WriteError implements the Unwrap interface
func (e *WriteError) Unwrap() error { return e.Err }
```

- For Error formatting, an optional `Format` interface is defined, which returns the error message.

```go
package errors

type Formatter interface {
	Format(p Printer) (next error)
}
```

For example:

```go
func (e *WriteError) Format(p errors.Printer) (next error) {
	p.Printf("write %s database", e.Database)
	if p.Detail() {
		p.Printf("more detail here")
	}
	return e.Err
}
```

### Generics

Go currently offers `interface{}`, which allows function parameters and return values to hold values of any type. But that is too loose: often you need type assertions on the arguments to decide what to do next. Compared with the standard containers of C++/Java, Go falls well short in generics, and the generics proposal aims to close that gap. The proposal hopes to support the following:

```go
type List(type T) []T
// returns the keys of a map
func Keys(type K, V)(m map[K]V) []K
// deduplication filter
func Uniq(<-chan T) <-chan T
// merging
func Merge(chans ...<-chan T) <-chan T
// sorting with a custom comparison function
func SortSlice(data []T, less func(x, y T) bool)
```

For example, we want to return all the keys of a map, and the key type should be able to be anything.

```go
var ints List(int)
keysA := Keys(int, string)(map[int]string{1:"one", 2: "two"})
keysB := Keys(string, string)(map[string]string{"name":"geektutu", "age": "twenty"})
// [1, 2]
```

> Reference: [Go2 wiki - GitHub](https://github.com/golang/go/wiki/Go2)

## Go 2 New Features

Go 2 has not been officially released yet. This post will be updated after the release.

> The Chinese original of this article is available at [geektutu.com/post/quick-go2.html](https://geektutu.com/post/quick-go2.html).
