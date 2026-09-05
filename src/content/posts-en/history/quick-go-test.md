---
title: "Go Test: Unit Testing in Go"
description: >-
  How to write unit tests in Go with the standard library testing package:
  subtests, table-driven tests, helper functions, setup and teardown,
  network/HTTP testing and benchmarks.
date: '2020-02-10 23:00:00'
tags:
  - Go
book: history
status: done
draft: false
cover: ../../posts/history/quick-go-test/go_test.jpg
---

![golang test](../../posts/history/quick-go-test/go_test.jpg)

## 1 How to write good unit tests

Unit tests (UTs) are an indispensable part of any good project, and they matter even more in projects that change frequently or are developed collaboratively. You have probably experienced, more than once, your own commit bringing down an application or a service. If at that moment your change causes a test case to fail, you go back and review it, and discover that some special cases were not covered before — congratulations, you have just avoided one such mistake. There is another common scenario: the project is large and the startup environment is complex, you have optimized the performance of a function or added a new feature, and testing it only after deploying to production would be far too costly. In situations like these, a few small test cases may be enough to cover most of the test scenarios. Moreover, during development, nothing is more efficient than instant feedback, and unit tests help you get exactly that. Imagine writing a thousand lines of code in one go — debugging will not be easy. But if, along the way, you also add test cases for the functions with more complex logic to verify correctness immediately, the final integration will be a whole different experience.

So how do you write good unit tests?

First, learn to write test cases: how to test a single function/method, how to run benchmarks, how to write concise test code, and how to `mock` calls to things like database access.

Then, write testable code. `High cohesion, low coupling` is a software engineering principle, and testing is no exception: functions/methods written differently are also of different difficulty to test. Functions with a single responsibility, simple parameter types and low coupling to other functions are usually easier to test. We often say "this code cannot be tested" — at moments like that, think about whether the function could be written better. Refactoring code for testability is worth it.

The rest of this article explains how to do unit testing with Go's standard library `testing` package.


## 2 A simple example

Go recommends keeping test files together with the source files, with test files ending in `_test.go`. For example, if the current package contains one file `calc.go` and we want to test the `Add` and `Mul` functions in `calc.go`, we should create `calc_test.go` as the test file.

```bash
example/
   |--calc.go
   |--calc_test.go
```

Suppose the code of `calc.go` is as follows:

```go
package main

func Add(a int, b int) int {
    return a + b
}

func Mul(a int, b int) int {
    return a * b
}
```

Then the test cases in `calc_test.go` can be written as follows:

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

- Test case names are conventionally `Test` followed by the name of the method under test.
- The test function takes exactly one parameter, here `t *testing.T`.
- A benchmark takes a `*testing.B` parameter, and TestMain takes a `*testing.M` parameter.

Run `go test`, and all test cases in the package will be executed.

```bash
$ go test
ok      example 0.009s
```

Or `go test -v`; the `-v` flag shows the result of each case, and the `-cover` flag shows coverage.

```bash
$ go test -v
=== RUN   TestAdd
--- PASS: TestAdd (0.00s)
=== RUN   TestMul
--- PASS: TestMul (0.00s)
PASS
ok      example 0.007s
```

If you only want to run one of the cases, for example `TestAdd`, use the `-run` flag to specify it. This flag supports the wildcard `*` and partial regular expressions such as `^` and `$`.

```bash
$ go test -run TestAdd -v
=== RUN   TestAdd
--- PASS: TestAdd (0.00s)
PASS
ok      example 0.007s
```


## 3 Subtests

Subtests are built into Go. Within a test case, you can use `t.Run` to create different subtests for different test scenarios:

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

- The earlier examples used `t.Error/t.Errorf` when a test failed, while this example uses `t.Fatal/t.Fatalf`. The difference is that the former does not stop on an error and keeps executing the remaining test cases, while the latter stops immediately on error.

To run a specific subtest of a test case:

```bash
$ go test -run TestMul/pos -v
=== RUN   TestMul
=== RUN   TestMul/pos
--- PASS: TestMul (0.00s)
    --- PASS: TestMul/pos (0.00s)
PASS
ok      example 0.008s
```

For scenarios with multiple subtests, the following style (table-driven tests) is recommended:

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

All the test data is organized in the slice `cases`, which looks like a table, and subtests are created with a loop. The benefits of this style are:

- Adding a case is very easy — just add one more entry of test data to cases.
- The test code is readable: you can see at a glance the inputs and expected result of each subtest.
- When a case fails, the error messages have a consistent format, making the test report easy to read.


If the data set is large, or contains binary data, it is recommended to read it from a file using a relative path.

## 4 Helper functions

Extracting repeated logic into shared helper functions improves the readability and maintainability of test code. With helper functions, the main logic of a test case also reads more clearly.

For example, we can extract the logic for creating subtests:

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

Here we deliberately create a wrong test case. Run `go test`; the case fails and the file and line number where the error occurred are reported:

```bash
$ go test
--- FAIL: TestMul (0.00s)
    calc_test.go:11: 2 * 0 expected 1, but 0 got
FAIL
exit status 1
FAIL    example 0.007s
```

As you can see, the error occurred on line 11, inside the helper function `createMulTestCase`. Lines 18, 19 and 20 all call this method, so we cannot tell right away which line caused the error. Some helper functions may also be called from different functions, with all error messages reported at the same place, which makes it hard to locate the problem. That is why Go 1.9 introduced `t.Helper()`, which marks a function as a helper function: when an error is reported, the caller's information is printed instead of the helper function's internals.

Modify `createMulTestCase` to call `t.Helper()`

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

Run `go test` again; the error message now makes it very clear that the error occurred on line 20.

```bash
$ go test
--- FAIL: TestMul (0.00s)
    calc_test.go:20: 2 * 0 expected 1, but 0 got
FAIL
exit status 1
FAIL    example 0.006s
```

Two suggestions about `helper` functions:
 
- Do not return errors. Just use `t.Error` or `t.Fatal` inside the helper function, so that the main logic of the test case is not cluttered with too much error-handling code.
- Call `t.Helper()` to make error messages more accurate and easier to locate.


## 5 setup and teardown

If, in the same test file, the logic before and after every test case is the same, it usually goes into setup and teardown functions. For example, before execution you may need to instantiate the object under test; if that object is complex, it is a good idea to extract this logic. After execution, you may do some resource cleanup work, such as closing network connections or releasing files. The standard library `testing` provides this mechanism:

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

- This test file contains two test cases, `Test1` and `Test2`.
- If the test file contains the function `TestMain`, the generated test will call TestMain(m) instead of running the tests directly.
- Calling `m.Run()` triggers the execution of all test cases, and `os.Exit()` handles the returned status code; if it is not 0, some case failed.
- So you can do extra setup before calling `m.Run()` and teardown after it.

Run `go test` and the output will be

```bash
$ go test
Before all tests
I'm test1
I'm test2
PASS
After all tests
ok      example 0.006s
```

## 6 Network testing

### 6.1 TCP/HTTP

Suppose we need to test that the handler of an API endpoint works correctly, for example helloHandler

```go
func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("hello world"))
}
```

Then we can create a real network connection for testing:

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

- `net.Listen("tcp", "127.0.0.1:0")`: listen on an unoccupied port and return a Listener.
- Call `http.Serve(ln, nil)` to start the HTTP server.
- Use `http.Get` to send a GET request and check that the response is correct.
- Avoid mocking the `http` and `net` libraries where possible, so that more realistic scenarios are covered.

### 6.2 httptest

For HTTP development scenarios, testing with the standard library `net/http/httptest` is more efficient.

The test case above can be rewritten as:

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

Using httptest to mock the request object (req) and the response object (w) achieves the same goal.

## 7 Benchmarks

A benchmark is defined as follows:

```go
func BenchmarkName(b *testing.B){
    // ...
}
```

- The function name must start with `Benchmark`, usually followed by the name of the function under test
- The parameter is `b *testing.B`.
- Running benchmarks requires the `-bench` flag.

For example:

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

The meaning of each column in the benchmark report is as follows:

```go
type BenchmarkResult struct {
    N         int           // number of iterations
    T         time.Duration // time spent on the benchmark
    Bytes     int64         // bytes processed per iteration
    MemAllocs uint64        // total number of memory allocations
    MemBytes  uint64        // total number of bytes allocated
}
```

If the benchmark needs some time-consuming setup before running, you can reset the timer first with `b.ResetTimer()`, for example:

```go
func BenchmarkHello(b *testing.B) {
    ... // time-consuming operations
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        fmt.Sprintf("hello")
    }
}
```

Use `RunParallel` to test concurrent performance

```go
func BenchmarkParallel(b *testing.B) {
	templ := template.Must(template.New("test").Parse("Hello, {{.}}!"))
	b.RunParallel(func(pb *testing.PB) {
		var buf bytes.Buffer
		for pb.Next() {
			// across all goroutines, the loop runs b.N times in total
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

## Notes

This article is hosted on [GitHub](https://github.com/geektutu/geektutu.github.io) — typo fixes and PRs are welcome. Thanks for reading.

- [A Quick Guide to gomock](/en/post/quick-gomock.html)
- [testing - golang.org](https://golang.org/pkg/testing/)
- [Advanced Testing in Go - sourcegraph.com](https://about.sourcegraph.com/go/advanced-testing-in-go)

> The Chinese original of this article is available at [geektutu.com/post/quick-go-test.html](https://geektutu.com/post/quick-go-test.html).
