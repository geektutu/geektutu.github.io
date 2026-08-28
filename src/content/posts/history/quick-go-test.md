---
title: Go Test 单元测试简明教程
description: >-
  本文介绍了Go语言(golang) 如何写单元测试(unit tests)，详细介绍了标准库 testing 的使用。包括子测试(subtests)，帮助函数(helpers)，setup 和 teardown
  机制，网络测试(Network, http) 和基准测试(benchmark)
date: '2020-02-10 23:00:00'
tags:
  - Go
book: history
status: done
draft: false
cover: quick-go-test/go_test.jpg
---

![golang test](quick-go-test/go_test.jpg)

## 1 如何写好单元测试

单元测试(Unit Tests, UT) 是一个优秀项目不可或缺的一部分，特别是在一些频繁变动和多人合作开发的项目中尤为重要。你或多或少都会有因为自己的提交，导致应用挂掉或服务宕机的经历。如果这个时候你的修改导致测试用例失败，你再重新审视自己的修改，发现之前的修改还有一些特殊场景没有包含，恭喜你减少了一次上库失误。也会有这样的情况，项目很大，启动环境很复杂，你优化了一个函数的性能，或是添加了某个新的特性，如果部署在正式环境上之后再进行测试，成本太高。对于这种场景，几个小小的测试用例或许就能够覆盖大部分的测试场景。而且在开发过程中，效率最高的莫过于所见即所得了，单元测试也能够帮助你做到这一点，试想一下，假如你一口气写完一千行代码，debug 的过程也不会轻松，如果在这个过程中，对于一些逻辑较为复杂的函数，同时添加一些测试用例，即时确保正确性，最后集成的时候，会是另外一番体验。

如何写好单元测试呢？

首先，学会写测试用例。比如如何测试单个函数/方法；比如如何做基准测试；比如如何写出简洁精炼的测试代码；再比如遇到数据库访问等的方法调用时，如何 `mock`。

然后，写可测试的代码。`高内聚，低耦合`是软件工程的原则，同样，对测试而言，函数/方法写法不同，测试难度也是不一样的。职责单一，参数类型简单，与其他函数耦合度低的函数往往更容易测试。我们经常会说，“这种代码没法测试”，这种时候，就得思考函数的写法可不可以改得更好一些。为了代码可测试而重构是值得的。

接下来将介绍如何使用 Go 语言的标准库 `testing` 进行单元测试。


## 2 一个简单例子

Go 语言推荐测试文件和源代码文件放在一块，测试文件以 `_test.go` 结尾。比如，当前 package 有 `calc.go` 一个文件，我们想测试 `calc.go` 中的 `Add` 和 `Mul` 函数，那么应该新建 `calc_test.go` 作为测试文件。

```bash
example/
   |--calc.go
   |--calc_test.go
```

假如 `calc.go` 的代码如下：

```go
package main

func Add(a int, b int) int {
    return a + b
}

func Mul(a int, b int) int {
    return a * b
}
```

那么 `calc_test.go` 中的测试用例可以这么写：

```go
package main

import "testing"

func TestAdd(t *testing.T) {
	if ans := Add(1, 2); ans != 3 {
		t.Errorf("1 + 2 expected be 3, but %d got", ans)
	}

	if ans := Add(-10, -20); ans != -30 {
		t.Errorf("-10 + -20 expected be -30, but %d got", ans)
	}
}
```

- 测试用例名称一般命名为 `Test` 加上待测试的方法名。
- 测试用的参数有且只有一个，在这里是 `t *testing.T`。
- 基准测试(benchmark)的参数是 `*testing.B`，TestMain 的参数是 `*testing.M` 类型。

运行 `go test`，该 package 下所有的测试用例都会被执行。

```bash
$ go test
ok      example 0.009s
```

或 `go test -v`，`-v` 参数会显示每个用例的测试结果，另外 `-cover` 参数可以查看覆盖率。

```bash
$ go test -v
=== RUN   TestAdd
--- PASS: TestAdd (0.00s)
=== RUN   TestMul
--- PASS: TestMul (0.00s)
PASS
ok      example 0.007s
```

如果只想运行其中的一个用例，例如 `TestAdd`，可以用 `-run` 参数指定，该参数支持通配符 `*`，和部分正则表达式，例如 `^`、`$`。

```bash
$ go test -run TestAdd -v
=== RUN   TestAdd
--- PASS: TestAdd (0.00s)
PASS
ok      example 0.007s
```


## 3 子测试(Subtests)

子测试是 Go 语言内置支持的，可以在某个测试用例中，根据测试场景使用 `t.Run`创建不同的子测试用例：

```go
// calc_test.go

func TestMul(t *testing.T) {
	t.Run("pos", func(t *testing.T) {
		if Mul(2, 3) != 6 {
			t.Fatal("fail")
		}

	})
	t.Run("neg", func(t *testing.T) {
		if Mul(2, -3) != -6 {
			t.Fatal("fail")
		}
	})
}
```

- 之前的例子测试失败时使用 `t.Error/t.Errorf`，这个例子中使用 `t.Fatal/t.Fatalf`，区别在于前者遇错不停，还会继续执行其他的测试用例，后者遇错即停。

运行某个测试用例的子测试：

```bash
$ go test -run TestMul/pos -v
=== RUN   TestMul
=== RUN   TestMul/pos
--- PASS: TestMul (0.00s)
    --- PASS: TestMul/pos (0.00s)
PASS
ok      example 0.008s
```

对于多个子测试的场景，更推荐如下的写法(table-driven tests)：

```go
//  calc_test.go
func TestMul(t *testing.T) {
	cases := []struct {
		Name           string
		A, B, Expected int
	}{
		{"pos", 2, 3, 6},
		{"neg", 2, -3, -6},
		{"zero", 2, 0, 0},
	}

	for _, c := range cases {
		t.Run(c.Name, func(t *testing.T) {
			if ans := Mul(c.A, c.B); ans != c.Expected {
				t.Fatalf("%d * %d expected %d, but %d got",
					c.A, c.B, c.Expected, ans)
			}
		})
	}
}
```

所有用例的数据组织在切片 `cases` 中，看起来就像一张表，借助循环创建子测试。这样写的好处有：

- 新增用例非常简单，只需给 cases 新增一条测试数据即可。
- 测试代码可读性好，直观地能够看到每个子测试的参数和期待的返回值。
- 用例失败时，报错信息的格式比较统一，测试报告易于阅读。


如果数据量较大，或是一些二进制数据，推荐使用相对路径从文件中读取。

## 4 帮助函数(helpers)

对一些重复的逻辑，抽取出来作为公共的帮助函数(helpers)，可以增加测试代码的可读性和可维护性。 借助帮助函数，可以让测试用例的主逻辑看起来更清晰。

例如，我们可以将创建子测试的逻辑抽取出来：

```go
// calc_test.go
package main

import "testing"

type calcCase struct{ A, B, Expected int }

func createMulTestCase(t *testing.T, c *calcCase) {
	// t.Helper()
	if ans := Mul(c.A, c.B); ans != c.Expected {
		t.Fatalf("%d * %d expected %d, but %d got",
			c.A, c.B, c.Expected, ans)
	}

}

func TestMul(t *testing.T) {
	createMulTestCase(t, &calcCase{2, 3, 6})
	createMulTestCase(t, &calcCase{2, -3, -6})
	createMulTestCase(t, &calcCase{2, 0, 1}) // wrong case
}
```

在这里，我们故意创建了一个错误的测试用例，运行 `go test`，用例失败，会报告错误发生的文件和行号信息：

```bash
$ go test
--- FAIL: TestMul (0.00s)
    calc_test.go:11: 2 * 0 expected 1, but 0 got
FAIL
exit status 1
FAIL    example 0.007s
```

可以看到，错误发生在第11行，也就是帮助函数 `createMulTestCase` 内部。18, 19, 20行都调用了该方法，我们第一时间并不能够确定是哪一行发生了错误。有些帮助函数还可能在不同的函数中被调用，报错信息都在同一处，不方便问题定位。因此，Go 语言在 1.9 版本中引入了 `t.Helper()`，用于标注该函数是帮助函数，报错时将输出帮助函数调用者的信息，而不是帮助函数的内部信息。

修改 `createMulTestCase`，调用 `t.Helper()`

```go
func createMulTestCase(c *calcCase, t *testing.T) {
    t.Helper()
	t.Run(c.Name, func(t *testing.T) {
		if ans := Mul(c.A, c.B); ans != c.Expected {
			t.Fatalf("%d * %d expected %d, but %d got",
				c.A, c.B, c.Expected, ans)
		}
	})
}
```

运行 `go test`，报错信息如下，可以非常清晰地知道，错误发生在第 20 行。

```bash
$ go test
--- FAIL: TestMul (0.00s)
    calc_test.go:20: 2 * 0 expected 1, but 0 got
FAIL
exit status 1
FAIL    example 0.006s
```

关于 `helper` 函数的 2 个建议：
 
- 不要返回错误， 帮助函数内部直接使用 `t.Error` 或 `t.Fatal` 即可，在用例主逻辑中不会因为太多的错误处理代码，影响可读性。
- 调用 `t.Helper()` 让报错信息更准确，有助于定位。


## 5 setup 和 teardown

如果在同一个测试文件中，每一个测试用例运行前后的逻辑是相同的，一般会写在 setup 和 teardown 函数中。例如执行前需要实例化待测试的对象，如果这个对象比较复杂，很适合将这一部分逻辑提取出来；执行后，可能会做一些资源回收类的工作，例如关闭网络连接，释放文件等。标准库 `testing` 提供了这样的机制：

```go
func setup() {
	fmt.Println("Before all tests")
}

func teardown() {
	fmt.Println("After all tests")
}

func Test1(t *testing.T) {
	fmt.Println("I'm test1")
}

func Test2(t *testing.T) {
	fmt.Println("I'm test2")
}

func TestMain(m *testing.M) {
	setup()
	code := m.Run()
	teardown()
	os.Exit(code)
}

```

- 在这个测试文件中，包含有2个测试用例，`Test1` 和 `Test2`。
- 如果测试文件中包含函数 `TestMain`，那么生成的测试将调用 TestMain(m)，而不是直接运行测试。
- 调用 `m.Run()` 触发所有测试用例的执行，并使用 `os.Exit()` 处理返回的状态码，如果不为0，说明有用例失败。
- 因此可以在调用 `m.Run()` 前后做一些额外的准备(setup)和回收(teardown)工作。

执行 `go test`，将会输出

```bash
$ go test
Before all tests
I'm test1
I'm test2
PASS
After all tests
ok      example 0.006s
```

## 6 网络测试(Network)

### 6.1 TCP/HTTP

假设需要测试某个 API 接口的 handler 能够正常工作，例如 helloHandler 

```go
func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("hello world"))
}
```

那我们可以创建真实的网络连接进行测试：

```go
// test code
import (
	"io/ioutil"
	"net"
	"net/http"
	"testing"
)

func handleError(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatal("failed", err)
	}
}

func TestConn(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	handleError(t, err)
	defer ln.Close()

	http.HandleFunc("/hello", helloHandler)
	go http.Serve(ln, nil)

	resp, err := http.Get("http://" + ln.Addr().String() + "/hello")
	handleError(t, err)

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	handleError(t, err)

	if string(body) != "hello world" {
		t.Fatal("expected hello world, but got", string(body))
	}
}
```

- `net.Listen("tcp", "127.0.0.1:0")`：监听一个未被占用的端口，并返回 Listener。
- 调用 `http.Serve(ln, nil)` 启动 http 服务。
- 使用 `http.Get` 发起一个 Get 请求，检查返回值是否正确。
- 尽量不对 `http` 和 `net` 库使用 mock，这样可以覆盖较为真实的场景。

### 6.2 httptest

针对 http 开发的场景，使用标准库 `net/http/httptest` 进行测试更为高效。

上述的测试用例改写如下：

```go
// test code
import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestConn(t *testing.T) {
	req := httptest.NewRequest("GET", "http://example.com/foo", nil)
	w := httptest.NewRecorder()
	helloHandler(w, req)
	bytes, _ := ioutil.ReadAll(w.Result().Body)

	if string(bytes) != "hello world" {
		t.Fatal("expected hello world, but got", string(bytes))
	}
}
```

使用 httptest 模拟请求对象(req)和响应对象(w)，达到了相同的目的。

## 7 Benchmark 基准测试

基准测试用例的定义如下：

```go
func BenchmarkName(b *testing.B){
    // ...
}
```

- 函数名必须以 `Benchmark` 开头，后面一般跟待测试的函数名
- 参数为 `b *testing.B`。
- 执行基准测试时，需要添加 `-bench` 参数。

例如：

```go
func BenchmarkHello(b *testing.B) {
    for i := 0; i < b.N; i++ {
        fmt.Sprintf("hello")
    }
}
```

```bash
$ go test -benchmem -bench .
...
BenchmarkHello-16   15991854   71.6 ns/op   5 B/op   1 allocs/op
...
```

基准测试报告每一列值对应的含义如下：

```go
type BenchmarkResult struct {
    N         int           // 迭代次数
    T         time.Duration // 基准测试花费的时间
    Bytes     int64         // 一次迭代处理的字节数
    MemAllocs uint64        // 总的分配内存的次数
    MemBytes  uint64        // 总的分配内存的字节数
}
```

如果在运行前基准测试需要一些耗时的配置，则可以使用 `b.ResetTimer()` 先重置定时器，例如：

```go
func BenchmarkHello(b *testing.B) {
    ... // 耗时操作
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        fmt.Sprintf("hello")
    }
}
```

使用 `RunParallel` 测试并发性能

```go
func BenchmarkParallel(b *testing.B) {
	templ := template.Must(template.New("test").Parse("Hello, {{.}}!"))
	b.RunParallel(func(pb *testing.PB) {
		var buf bytes.Buffer
		for pb.Next() {
			// 所有 goroutine 一起，循环一共执行 b.N 次
			buf.Reset()
			templ.Execute(&buf, "World")
		}
	})
}
```

```bash
$ go test -benchmem -bench .
...
BenchmarkParallel-16   3325430     375 ns/op   272 B/op   8 allocs/op
...
```

## 附 参考

- [Go Mock (gomock) 简明教程](https://geektutu.com/post/quick-gomock.html)
- [testing - golang.org](https://golang.org/pkg/testing/)
- [Advanced Testing in Go - sourcegraph.com](https://about.sourcegraph.com/go/advanced-testing-in-go)
