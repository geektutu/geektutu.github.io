---
title: "A Gentle Introduction to Go"
description: >-
  Learn Go (Golang) with a single article — installation, basic types
  (strings, ints, arrays, slices, maps), control flow (if, for, for-range,
  switch), composite types (structs, interfaces, methods), concurrency
  (goroutines, channels, sync), error handling (panic, error), Go Modules
  and how to write unit tests.
date: '2019-08-06 01:00:00'
tags:
  - Go
book: history
status: done
draft: false
cover: ../../posts/history/quick-golang/golang.jpg
---

![A Gentle Introduction to Go](../../posts/history/quick-golang/golang.jpg)

> Go, also known as Golang, is a statically and strongly typed, compiled programming language developed at Google, with built-in concurrency and garbage collection. — [Go - wikipedia.org](https://en.wikipedia.org/wiki/Go_(programming_language))

## 1 Installing Go

Download the latest version from the [official download page at golang.org](https://golang.org/dl/) — currently 1.13.6. If you can't access it, you can download it from **studygolang.com/dl** instead.

On Linux, you can install it quickly as follows:

```bash
$ wget https://studygolang.com/dl/golang/go1.13.6.linux-amd64.tar.gz
$ tar -zxvf go1.13.6.linux-amd64.tar.gz
$ sudo mv go /usr/local/

$ go version
go version go1.13.6 linux/amd64
```

Starting from `Go 1.11`, Go provides the [Go Modules](https://github.com/golang/go/wiki/Modules) mechanism. It is recommended to set the following environment variables so that third-party packages are downloaded through a China-based mirror, avoiding the problem of the official site being blocked.

```bash
$ go env -w GOPROXY=https://goproxy.cn,direct
```

Or set the environment variable in `~/.profile`:

```bash
export GOPROXY=https://goproxy.cn
```

## 2 Hello World

Create a new file `main.go` with the following content:

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello World!")
}
```

Run `go run main.go` or `go run .` and you will see:

```bash
$ go run .
Hello World!
```

> If Go Modules is forcibly enabled, i.e. the environment variable GO111MODULE=on is set, you need to initialize the module first with `go mod init hello`.
> Otherwise you will get the error: `go: cannot find main module; see 'go help modules'`

That's our first Go program done. Now let's walk through it line by line:

- package main: declares the package that main.go belongs to. In Go, code is organized into packages. Generally, one folder is one package, and a package can expose types or methods for other packages to use.
- import "fmt": fmt is a standard library package of Go, used for standard input and output.
- func main: the main function is the entry point of the whole program, and the package containing it must also be named `main`.
- fmt.Println("Hello World!"): calls the Println method of the fmt package, printing "Hello World!".

go run main.go is actually two steps:

- go build main.go: compiles the program into a binary executable
- ./main: runs the program

## 3 Variables and Built-in Types

### 3.1 Variables

Go is statically typed: the type of a variable must be clear when it is declared. One notable difference from other languages is that in Go, the type comes after the variable name. For example, in Java you would declare an integer as `int a = 1`, while in Go you write:

```go
var a int // defaults to 0 if no value is assigned
var a int = 1 // assign a value at declaration
var a = 1 // assign a value at declaration
```

In `var a = 1`, since 1 is of type int, a is automatically determined to be an int when the value is assigned, so the type name can be omitted. There is also an even shorter way to write this:

```go
a := 1
msg := "Hello World!"
```

### 3.2 Simple Types

Null value: nil

Integer types: int (depends on the operating system), int8, int16, int32, int64, uint8, uint16, ...

Floating-point types: float32, float64

Byte type: byte (equivalent to uint8)

String type: string

Boolean type: bool (true or false)

```go
var a int8 = 10
var c1 byte = 'a'
var b float32 = 12.2
var msg = "Hello World"
ok := false
```

### 3.3 Strings

Strings in Go are UTF-8 encoded. The advantage of UTF-8 is that if the text is mostly English, each character takes 1 byte — the same as ASCII — which saves a lot of space, while a Chinese character usually takes 3 bytes. Strings containing Chinese are handled a bit differently from strings made up of pure ASCII.

Let's look at an example:

```go
package main

import (
	"fmt"
	"reflect"
)
func main() {
    str1 := "Golang"
    str2 := "Go语言"
    fmt.Println(reflect.TypeOf(str2[2]).Kind()) // uint8
    fmt.Println(str1[2], string(str1[2]))       // 108 l
    fmt.Printf("%d %c\n", str2[2], str2[2])     // 232 è
    fmt.Println("len(str2):", len(str2))        // len(str2): 8
}
```

- reflect.TypeOf().Kind() tells you the type of a variable. As you can see, a string is stored as a byte array; its elements are of type uint8 and take 1 byte each. When printing, you need to convert the value with string(), otherwise you get the raw byte value.
- Because strings are stored as byte arrays, `str2[2]` does not equal `语` (the first character of 语言). And the length of str2, `len(str2)`, is not 4 but 8 (Go takes 2 bytes, 语言 takes 6 bytes).

The right way to handle this is to convert the string to a rune array:

```go
str2 := "Go语言"
runeArr := []rune(str2)
fmt.Println(reflect.TypeOf(runeArr[2]).Kind()) // int32
fmt.Println(runeArr[2], string(runeArr[2]))    // 35821 语
fmt.Println("len(runeArr):", len(runeArr))     // len(runeArr): 4
```

After converting to `[]rune`, every character in the string is represented as an int32 no matter how many bytes it occupies, so Chinese characters are handled correctly.

### 3.4 Arrays and Slices

Declaring arrays:

```go
var arr [5]int     // one-dimensional
var arr2 [5][5]int // two-dimensional
```

Initializing at declaration:

```go
var arr = [5]int{1, 2, 3, 4, 5}
// or arr := [5]int{1, 2, 3, 4, 5}
```

Indexing/modifying arrays with `[]`:

```go
arr := [5]int{1, 2, 3, 4, 5}
for i := 0; i < len(arr); i++ {
	arr[i] += 100
}
fmt.Println(arr)  // [101 102 103 104 105]
```

The length of an array cannot change. To concatenate two arrays or get a sub-array, you need slices. A slice is an abstraction over an array and uses an array as its underlying structure. A slice consists of three components: capacity, length and a pointer to the underlying array. Slices can be extended at any time.

Declaring slices:

```go
slice1 := make([]float32, 0) // a slice of length 0
slice2 := make([]float32, 3, 5) // [0 0 0] a slice of length 3 and capacity 5
fmt.Println(len(slice2), cap(slice2)) // 3 5

```

Using slices:

```go
// append elements; the capacity of a slice grows automatically as needed
slice2 = append(slice2, 1, 2, 3, 4) // [0, 0, 0, 1, 2, 3, 4]
fmt.Println(len(slice2), cap(slice2)) // 7 12
// sub-slices [start, end)
sub1 := slice2[3:] // [1 2 3 4]
sub2 := slice2[:3] // [0 0 0]
sub3 := slice2[1:4] // [0 0 1]
// concatenate slices
combined := append(sub1, sub2...) // [1, 2, 3, 4, 0, 0, 0]
```

- When declaring a slice, you can set its capacity to pre-allocate space. In practice, if the capacity is not enough, the slice's capacity grows automatically.
- `sub2...` is slice unpacking: it spreads the slice into N individual elements.

### 3.5 Maps (key-value pairs)

A map is similar to Java's HashMap or Python's dict — a data structure that stores key-value pairs. Its usage is almost identical to that of other languages.

```go
// declaration only
m1 := make(map[string]int)
// initialize at declaration
m2 := map[string]string{
	"Sam": "Male",
	"Alice": "Female",
}
// assign/update
m1["Tom"] = 18
```

### 3.6 Pointers

A pointer is the address of a value. Use `*` when defining the type, and use `&` on an existing variable to get its address.

```go
str := "Golang"
var p *string = &str // p is a pointer to str
*p = "Hello"
fmt.Println(str) // Hello — after modifying *p, str's value changed too
```

In general, pointers are used when passing arguments to functions, or when defining new methods on a type. In Go, arguments are passed by value. Without a pointer, the function makes a copy of the argument, and modifying the parameter does not affect the variable outside. If the argument is a pointer, changes made inside the function do affect the outside variable.

For example:

```go
func add(num int) {
	num += 1
}

func realAdd(num *int) {
	*num += 1
}

func main() {
	num := 100
	add(num)
	fmt.Println(num)  // 100 — num is unchanged

	realAdd(&num)
	fmt.Println(num)  // 101 — passed by pointer, num was modified
}
```

## 4 Control Flow (if, for, switch)

### 4.1 The if else statement

```go
age := 18
if age < 18 {
	fmt.Printf("Kid")
} else {
	fmt.Printf("Adult")
}

// can be shortened to:
if age := 18; age < 18 {
	fmt.Printf("Kid")
} else {
	fmt.Printf("Adult")
}
```

### 4.2 switch

```go
type Gender int8
const (
	MALE   Gender = 1
	FEMALE Gender = 2
)

gender := MALE

switch gender {
case FEMALE:
	fmt.Println("female")
case MALE:
	fmt.Println("male")
default:
	fmt.Println("unknown")
}
// male
```

- Here, the `type` keyword defines a new type, Gender.
- `const` defines the two constants MALE and FEMALE. Go has no enum; constants are the usual way to emulate one.
- Unlike other languages, Go's switch does not need break: once a case matches, execution stops after that case's body by default. If you want execution to continue downward, use fallthrough, for example:

```go
switch gender {
case FEMALE:
	fmt.Println("female")
	fallthrough
case MALE:
	fmt.Println("male")
	fallthrough
default:
	fmt.Println("unknown")
}
// output
// male
// unknown
```

### 4.3 for loops

A simple summation example. break and continue work just like in other languages.

```go
sum := 0
for i := 0; i < 10; i++ {
	if sum > 50 {
		break
	}
	sum += i
}
```

Use for range to iterate over arrays (arr), slices (slice) and maps (map):

```go
nums := []int{10, 20, 30, 40}
for i, num := range nums {
	fmt.Println(i, num)
}
// 0 10
// 1 20
// 2 30
// 3 40
m2 := map[string]string{
	"Sam":   "Male",
	"Alice": "Female",
}

for key, value := range m2 {
	fmt.Println(key, value)
}
// Sam Male
// Alice Female
```

## 5 Functions

### 5.1 Parameters and Return Values

A typical function definition looks like this, using the `func` keyword. A function can take multiple parameters and can also return multiple values. In particular, `func main()` in `package main` is, by convention, the entry point of an executable program.

```go
func funcName(param1 Type1, param2 Type2, ...) (return1 Type3, ...) {
    // body
}
```

For example, addition of two numbers (one return value) and division (multiple return values):

```go

func add(num1 int, num2 int) int {
	return num1 + num2
}

func div(num1 int, num2 int) (int, int) {
	return num1 / num2, num1 % num2
}
func main() {
	quo, rem := div(100, 17)
	fmt.Println(quo, rem)     // 5 15
	fmt.Println(add(100, 17)) // 117
}
```

Return values can also be named, which simplifies return. For example, the add function can be rewritten as:

```go
func add(num1 int, num2 int) (ans int) {
	ans = num1 + num2
	return
}
```

### 5.2 Error Handling

If something goes wrong inside a function that it cannot handle itself, it can return the problem to the caller. For example, when we call the standard library function `os.Open` to read a file, `os.Open` returns two values: a `*File` and an `error`. If the call succeeds, error is nil; if it fails, for instance because the file does not exist, error tells you the exact problem.

```go
import (
	"fmt"
	"os"
)

func main() {
	_, err := os.Open("filename.txt")
	if err != nil {
		fmt.Println(err)
	}
}

// open filename.txt: no such file or directory
```

You can return custom errors with `errors.New`:

```go
import (
	"errors"
	"fmt"
)

func hello(name string) error {
	if len(name) == 0 {
		return errors.New("error: name is null")
	}
	fmt.Println("Hello,", name)
	return nil
}

func main() {
	if err := hello(""); err != nil {
		fmt.Println(err)
	}
}
// error: name is null
```

An error is usually a foreseeable failure, but unforeseeable problems can also occur, such as an out-of-range array index. This kind of error can make the program exit abnormally; in Go it is called a panic.

```go
func get(index int) int {
	arr := [3]int{2, 3, 4}
	return arr[index]
}

func main() {
	fmt.Println(get(5))
	fmt.Println("finished")
}
```

```bash
$ go run .
panic: runtime error: index out of range [5] with length 3
goroutine 1 [running]:
exit status 2
```

Languages such as Python and Java have a `try...catch` mechanism: all kinds of exceptions are caught in `try`, and the handling behavior is defined in `catch`. Go provides a similar mechanism with `defer` and `recover`.

```go
func get(index int) (ret int) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Some error happened!", r)
			ret = -1
		}
	}()
	arr := [3]int{2, 3, 4}
	return arr[index]
}

func main() {
	fmt.Println(get(5))
	fmt.Println("finished")
}
```

```bash
$ go run .
Some error happened! runtime error: index out of range [5] with length 3
-1
finished
```

- In the get function, defer registers the handler function; before the goroutine exits, all deferred tasks are executed. So when a panic is triggered, control is handed over to defer.
- In the deferred logic, recover brings the program back to normal and sets the return value to -1. You could also leave the return value untouched here; in that case it would be set to the default value 0.

## 6 Structs, Methods and Interfaces

### 6.1 Structs and Methods

A struct is similar to a class in other languages: you can define multiple fields on a struct, implement methods for it, instantiate it, and so on. Next, let's define a Student struct, add name and age fields to it, and implement a `hello()` method.

```go
type Student struct {
	name string
	age  int
}

func (stu *Student) hello(person string) string {
	return fmt.Sprintf("hello %s, I am %s", person, stu.name)
}

func main() {
	stu := &Student{
		name: "Tom",
	}
	msg := stu.hello("Jack")
	fmt.Println(msg) // hello Jack, I am Tom
}
```

- Use `Student{field: value, ...}` to create an instance of Student. You don't have to assign every field; fields without an explicit value get their default value — age would be 0, for example.
- The difference between implementing a method and a function is that between `func` and the function name `hello`, you add the receiver name `stu` and its type `*Student`. Through the receiver, you can access the instance's field `name` and its other methods.
- A method is called via `instance.method(arguments)`.

In addition, you can instantiate with `new`:

```go
func main() {
	stu2 := new(Student)
	fmt.Println(stu2.hello("Alice")) // hello Alice, I am  , name has the default value ""
}
```

### 6.2 Interfaces

Generally speaking, an interface defines a set of methods. Interfaces cannot be instantiated, and one type can implement multiple interfaces.

As a simple example, define a `Person` interface with the corresponding methods `getName()` and `getAge()`:

```go
type Person interface {
	getName() string
}

type Student struct {
	name string
	age  int
}

func (stu *Student) getName() string {
	return stu.name
}

type Worker struct {
	name   string
	gender string
}

func (w *Worker) getName() string {
	return w.name
}

func main() {
	var p Person = &Student{
		name: "Tom",
		age:  18,
	}

	fmt.Println(p.getName()) // Tom
}
```

- In Go, you don't need to declare explicitly which interface a type implements; you simply implement the interface's methods.
- After instantiating `Student`, it is converted to the interface type Person.

In the example above, we tried to convert a Student instance to Person inside the main function. If Student does not fully implement Person's methods — for example, if we delete `(*Student).getName()` — the following error appears at compile time:

```bash
 *Student does not implement Person (missing getName method)
```

But deleting `(*Worker).getName()` does not produce an error, because we never use it in the main function. In this situation, how do we make sure a type implements all methods of an interface? A common approach is the check below: if the implementation is incomplete, the compiler reports an error.

```go
var _ Person = (*Student)(nil)
var _ Person = (*Worker)(nil)
```

- nil is converted to the *Student type and then to the Person interface; if the conversion fails, Student does not implement all methods of the Person interface.
- The same applies to Worker.

An instance can be converted to an interface, and an interface can also be converted back to an instance.

```go
func main() {
	var p Person = &Student{
		name: "Tom",
		age:  18,
	}

	stu := p.(*Student) // interface to instance
	fmt.Println(stu.getAge())
}
```

### 6.3 The Empty Interface

If you define an empty interface with no methods at all, that interface can represent any type. For example:

```go
func main() {
	m := make(map[string]interface{})
	m["name"] = "Tom"
	m["age"] = 18
	m["scores"] = [3]int{98, 99, 85}
	fmt.Println(m) // map[age:18 name:Tom scores:[98 99 85]]
}
```

## 7 Concurrent Programming (goroutine)

### 7.1 sync

Go provides two mechanisms, sync and channel, to support concurrency with goroutines.

For example, suppose you want to download N resources concurrently and the goroutines don't need to communicate with each other. Then you can use sync.WaitGroup to wait for all the concurrent goroutines to finish.

```go
import (
	"fmt"
	"sync"
	"time"
)

var wg sync.WaitGroup

func download(url string) {
	fmt.Println("start to download", url)
	time.Sleep(time.Second) // simulate a time-consuming operation
	wg.Done()
}

func main() {
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go download("a.com/" + string(i+'0'))
	}
	wg.Wait()
	fmt.Println("Done!")
}
```

- wg.Add(1): adds one to the counter of wg; wg.Done() subtracts one.
- go download(): starts a new goroutine that runs the download function concurrently.
- wg.Wait(): waits for all goroutines to finish.

```bash
$  time go run .
start to download a.com/2
start to download a.com/0
start to download a.com/1
Done!

real    0m1.563s
```

As you can see, a download that takes 3s serially only takes 1s when done concurrently.

### 7.2 channel

```go
var ch = make(chan string, 10) // create a buffered channel of size 10

func download(url string) {
	fmt.Println("start to download", url)
	time.Sleep(time.Second)
	ch <- url // send url to the channel
}

func main() {
	for i := 0; i < 3; i++ {
		go download("a.com/" + string(i+'0'))
	}
	for i := 0; i < 3; i++ {
		msg := <-ch // wait for the channel to return a message.
		fmt.Println("finish", msg)
	}
	fmt.Println("Done!")
}
```

With a channel, you can pass messages between goroutines, blocking until the concurrent goroutines report back.

```bash
$ time go run .
start to download a.com/2
start to download a.com/0
start to download a.com/1
finish a.com/2
finish a.com/1
finish a.com/0
Done!

real    0m1.528s
```

## 8 Unit Testing

Suppose we want to test the functions in `calc.go` under package main. All we need to do is create a `calc_test.go` file and write the test cases in `calc_test.go`.

```go
// calc.go
package main

func add(num1 int, num2 int) int {
	return num1 + num2
}
```

```go
// calc_test.go
package main

import "testing"

func TestAdd(t *testing.T) {
	if ans := add(1, 2); ans != 3 {
		t.Error("add(1, 2) should be equal to 3")
	}
}
```

Run `go test` and all test cases in the current package run automatically. Add the `-v` flag if you want detailed output.

```bash
$ go test -v
=== RUN   TestAdd
--- PASS: TestAdd (0.00s)
PASS
ok      example 0.040s
```

## 9 Packages and Modules

### 9.1 Package

Generally speaking, a folder can serve as a package, and within the same package, definitions such as variables, types and methods can see each other.

For example, create a file `calc.go` at the same level as `main.go`, defining add and main respectively.

```go
// calc.go
package main

func add(num1 int, num2 int) int {
	return num1 + num2
}
```

```go
// main.go
package main

import "fmt"

func main() {
	fmt.Println(add(3, 5)) // 8
}
```

Running `go run main.go` fails with an error — add is undefined:

```bash
./main.go:6:14: undefined: add
```

Because `go run main.go` compiles only the single file main.go, the command needs to be changed to:

```bash
$ go run main.go calc.go
8
```

or:

```bash
$ go run .
8
```

Go also has the concepts of Public and Private, with package granularity. If the first letter of a type/interface/method/function/field is uppercase, it is Public and visible to other packages; if it is lowercase, it is Private and invisible to other packages.

### 9.2 Modules

[Go Modules](https://github.com/golang/go/wiki/Modules) was introduced after Go 1.11; before Go 1.11, the $GOPATH mechanism was used. Go Modules can be considered a fairly complete dependency management tool. It also supports proxies, so fast third-party package mirrors are available in China as well. Next, let's briefly look at how to use `go mod`. As of version 1.13, Go Modules is still optional: the environment variable GO111MODULE defaults to AUTO. To force dependency management through Go Modules, set GO111MODULE to ON.

In an empty folder, initialize a module:

```bash
$ go mod init example
go: creating new go.mod: module example
```

This generates a `go.mod` file in the current folder; the file records the module's name and the versions of all dependency packages.

Next, create a file `main.go` in the current directory with the following code:

```go
package main

import (
	"fmt"

	"rsc.io/quote"
)

func main() {
	fmt.Println(quote.Hello())  // Ahoy, world!
}
```

Running `go run .` automatically triggers the download of the third-party package `rsc.io/quote`, and the version information is recorded in `go.mod`:

```bash
module example

go 1.13

require rsc.io/quote v3.1.0+incompatible
```

Now, add a sub-package calc in the current directory. The code directory looks like this:

```bash
demo/
   |--calc/
      |--calc.go
   |--main.go
```

Put the following in `calc.go`:

```go
package calc

func Add(num1 int, num2 int) int {
	return num1 + num2
}
```

How do we use the Add function from package calc in package main? Simply `import module-name/subdirectory`. The updated main function looks like this:

```go
package main

import (
	"fmt"
	"example/calc"

	"rsc.io/quote"
)

func main() {
	fmt.Println(quote.Hello())
	fmt.Println(calc.Add(10, 3))
}
```

```bash
$ go run .
Ahoy, world!
13
```

## Notes & references

This article is hosted on [GitHub](https://github.com/geektutu/geektutu.github.io) — typo fixes and PRs are welcome. Thanks for reading.

- [Go official documentation - golang.org](https://golang.org/)
- [goproxy.cn documentation - github.com](https://github.com/goproxy/goproxy.cn/blob/master/README.zh-CN.md)
- [Go Modules - github.com](https://github.com/golang/go/wiki/Modules)

> The Chinese original of this article is available at [geektutu.com/post/quick-golang.html](https://geektutu.com/post/quick-golang.html).
