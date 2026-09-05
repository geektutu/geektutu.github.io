---
title: "Gin in a Nutshell"
description: >-
  A quick-start tutorial for the Gin web framework: installing Go and
  setting up the environment, hot reload, routing and route groups, HTML
  templates, and middleware.
date: '2019-08-07 20:10:10'
tags:
  - Go
book: history
status: done
draft: false
cover: ../../posts/history/quick-go-gin/gin.jpg
---

![Gin](../../posts/history/quick-go-gin/gin.jpg)

Keywords: **Gin tutorial** **Gin documentation** **Go web framework** **Go environment setup**

## Introduction to Gin

> Gin is a HTTP web framework written in Go (Golang). It features a Martini-like API with much better performance -- up to 40 times faster. If you need smashing performance, get yourself some Gin.

Gin is an HTTP web framework written in Go (Golang), with a clean API and excellent performance. As of version _1.4.0_, the entire project, tests included, is only 14K lines, of which about 9K are test code — meaning the framework's source code is only about 5K lines.

```bash
$ find . -name "*_test.go" | xargs cat | wc -l
8657
$ find . -name "*.go" | xargs cat | wc -l
14115
```

#### Gin Features

- **Fast**: routing does not use reflection, it is based on a radix tree, and memory usage is low.

- **Middleware**: HTTP requests can be processed by a chain of middleware first, such as Logger, Authorization, GZIP, and so on. This is very similar to NodeJs's `Koa` framework. The middleware mechanism also greatly improves the framework's extensibility.

- **Crash handling**: the service stays available and won't go down. Gin can catch panics and recover from them, and it offers a very convenient mechanism for handling errors that occur while processing HTTP requests.

- **JSON**: Gin can parse and validate the JSON in a request. This feature is especially useful for `Restful API` development.

- **Route groups**: for example, group the APIs that require authorization and those that don't, or group APIs by version. Groups can be nested without any performance penalty.

- **Built-in rendering**: native support for rendering JSON, XML and HTML.

## Installing Go & Gin

> If you're a beginner, I recommend reading [A Gentle Introduction to Go](/en/post/quick-golang.html) first.
> That article covers Go's basic types, structs, unit testing, concurrency, dependency management and more. For Go 1.13 and above, follow the installation method recommended there.

- Install Go (Ubuntu)

```bash
$ sudo apt-get install golang-go
$ go version
# go version go1.6.2 linux/amd64
```

The version that ships with Ubuntu is too old; to install a newer version, use the following commands.

```
$ sudo add-apt-repository ppa:gophers/archive
$ sudo apt-get update
$ sudo apt-get install golang-1.11-go
```

By default it is installed to /usr/lib/go-1.11, so you need to manually add `/usr/lib/go-1.11/bin` to your PATH. Add the following line to .bashrc, then run `source ~/.bashrc`

```bash
export PATH=$PATH:/usr/lib/go-1.11/bin
```

Reference: [Golang Ubuntu - Github](https://github.com/golang/go/wiki/Ubuntu)

- Install Go (Mac)

```bash
$ brew install go
$ go version
# go version go1.12.5 darwin/amd64
```

- Set environment variables

Add the GOPATH variable to ~/.bashrc

```bash
export GOPATH=~/go
export PATH=$PATH:$GOPATH/bin
```

After adding them, run `source ~/.bashrc`

- Install some auxiliary tool libraries

Due to network issues, golang.org cannot be accessed directly, but the related libraries have been mirrored to [Golang - Github](https://github.com/golang)

For example, installing go-outline directly fails with a network error, because `golang.org/x/tools` is a dependency of `go-outline`.

```bash
$ go get -u -v github.com/ramya-rao-a/go-outline
github.com/ramya-rao-a/go-outline (download)
Fetching https://golang.org/x/tools/go/buildutil?go-get=1
https fetch failed: Get https://golang.org/x/tools/go/buildutil?go-get=1: 
dial tcp 216.239.37.1:443: i/o timeout
```

So you can install it manually from GitHub first, then install `go-outline` and `goreturns`.

```bash
git clone https://github.com/golang/tools.git $GOPATH/src/golang.org/x/tools
go get -v github.com/ramya-rao-a/go-outline
go get -v github.com/sqs/goreturns
go get -v github.com/rogpeppe/godef
```

Go has a wealth of helper tools. If you use `VSCode`, it will prompt you to install the necessary tools one by one, such as static analysis and autocompletion tools.

- Install Gin

```bash
go get -u -v github.com/gin-gonic/gin
```

`-v`: print the names of the packages being built
`-u`: if the packages already exist, force an update of them and their dependencies

## Your first Gin program

Create a file named `main.go` in an empty folder.

```go
// geektutu.com
// main.go
package main

import "github.com/gin-gonic/gin"

func main() {
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.String(200, "Hello, Geektutu")
	})
	r.Run() // listen and serve on 0.0.0.0:8080
}
```

1. First, we use `gin.Default()` to create an instance — this instance is the WSGI application.
2. Next, we declare a route with `r.Get("/", ...)`, telling Gin which URLs should trigger the function passed in; that function returns the information we want to show in the user's browser.
3. Finally, the `r.Run()` function runs the application on a local server. The default listening port is _8080_; you can pass an argument to change it, for example `r.Run(":9999")` runs on port _9999_.

- Run

```bash
$ go run main.go
[GIN-debug] GET    /                         --> main.main.func1 (3 handlers)
[GIN-debug] Environment variable PORT is undefined. Using port :8080 by default
[GIN-debug] Listening and serving HTTP on :8080
```

- Visit `http://localhost:8080` in your browser

![Hello Gin](../../posts/history/quick-go-gin/hello_gin.jpg)

## Routing

Routing methods include **GET, POST, PUT, PATCH, DELETE** and **OPTIONS**, plus **Any**, which matches requests of any of these types.

#### No parameters

```go
// no parameters
r.GET("/", func(c *gin.Context) {
	c.String(http.StatusOK, "Who are you?")
})
```

```bash
$ curl http://localhost:9999/
Who are you?
```

For `curl` options, refer to `https://man.linuxde.net/curl`

#### Parsing path parameters

Sometimes we need dynamic routes, such as `/user/:name`, where different URLs pass in different names. In `/user/:name/*role`, `*` means the part is optional.

```go
// matches /user/geektutu
r.GET("/user/:name", func(c *gin.Context) {
	name := c.Param("name")
	c.String(http.StatusOK, "Hello %s", name)
})
```

```bash
$ curl http://localhost:9999/user/geektutu
Hello geektutu
```

#### Getting query parameters

```go
// matches users?name=xxx&role=xxx, role is optional
r.GET("/users", func(c *gin.Context) {
	name := c.Query("name")
	role := c.DefaultQuery("role", "teacher")
	c.String(http.StatusOK, "%s is a %s", name, role)
})
```

```bash
$ curl "http://localhost:9999/users?name=Tom&role=student"
Tom is a student
```

#### Getting POST parameters

```go
// POST
r.POST("/form", func(c *gin.Context) {
	username := c.PostForm("username")
	password := c.DefaultPostForm("password", "000000") // a default value can be set

	c.JSON(http.StatusOK, gin.H{
		"username": username,
		"password": password,
	})
})
```

```bash
$ curl http://localhost:9999/form  -X POST -d 'username=geektutu&password=1234'
{"password":"1234","username":"geektutu"}
```

#### Mixing query and POST parameters

```go
// mixing GET and POST
r.POST("/posts", func(c *gin.Context) {
	id := c.Query("id")
	page := c.DefaultQuery("page", "0")
	username := c.PostForm("username")
	password := c.DefaultPostForm("username", "000000") // a default value can be set

	c.JSON(http.StatusOK, gin.H{
		"id":       id,
		"page":     page,
		"username": username,
		"password": password,
	})
})
```

```bash
$ curl "http://localhost:9999/posts?id=9876&page=7"  -X POST -d 'username=geektutu&password=1234'
{"id":"9876","page":"7","password":"1234","username":"geektutu"}
```

#### Map parameters (dictionary parameters)

```go
r.POST("/post", func(c *gin.Context) {
	ids := c.QueryMap("ids")
	names := c.PostFormMap("names")

	c.JSON(http.StatusOK, gin.H{
		"ids":   ids,
		"names": names,
	})
})
```

```bash
$ curl -g "http://localhost:9999/post?ids[Jack]=001&ids[Tom]=002" -X POST -d 'names[a]=Sam&names[b]=David'
{"ids":{"Jack":"001","Tom":"002"},"names":{"a":"Sam","b":"David"}}
```

#### Redirect

```go
r.GET("/redirect", func(c *gin.Context) {
    c.Redirect(http.StatusMovedPermanently, "/index")
})

r.GET("/goindex", func(c *gin.Context) {
	c.Request.URL.Path = "/"
	r.HandleContext(c)
})
```

```bash
$ curl -i http://localhost:9999/redirect
HTTP/1.1 301 Moved Permanently
Content-Type: text/html; charset=utf-8
Location: /
Date: Thu, 08 Aug 2019 17:22:14 GMT
Content-Length: 36

<a href="/">Moved Permanently</a>.

$ curl "http://localhost:9999/goindex"
Who are you?
```

#### Grouping routes

If you have a group of routes that all start with the prefix `/api/v1`, does every route need to include that prefix? The answer is no — route groups solve this problem. Route groups also make access control easier: for example, you can put the routes that require login authentication into the same group to simplify authorization.

```go
// group routes
defaultHandler := func(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"path": c.FullPath(),
	})
}
// group: v1
v1 := r.Group("/v1")
{
	v1.GET("/posts", defaultHandler)
	v1.GET("/series", defaultHandler)
}
// group: v2
v2 := r.Group("/v2")
{
	v2.GET("/posts", defaultHandler)
	v2.GET("/series", defaultHandler)
}
```

```bash
$ curl http://localhost:9999/v1/posts
{"path":"/v1/posts"}
$ curl http://localhost:9999/v2/posts
{"path":"/v2/posts"}
```

## Uploading files

#### Single file

```go
r.POST("/upload1", func(c *gin.Context) {
	file, _ := c.FormFile("file")
	// c.SaveUploadedFile(file, dst)
	c.String(http.StatusOK, "%s uploaded!", file.Filename)
})
```

#### Multiple files

```go
r.POST("/upload2", func(c *gin.Context) {
	// Multipart form
	form, _ := c.MultipartForm()
	files := form.File["upload[]"]

	for _, file := range files {
		log.Println(file.Filename)
		// c.SaveUploadedFile(file, dst)
	}
	c.String(http.StatusOK, "%d files uploaded!", len(files))
})
```

## HTML templates

```go
type student struct {
	Name string
	Age  int8
}

r.LoadHTMLGlob("templates/*")

stu1 := &student{Name: "Geektutu", Age: 20}
stu2 := &student{Name: "Jack", Age: 22}
r.GET("/arr", func(c *gin.Context) {
	c.HTML(http.StatusOK, "arr.tmpl", gin.H{
		"title":  "Gin",
		"stuArr": [2]*student{stu1, stu2},
	})
})
```

```html
<!-- templates/arr.tmpl -->
<html>
<body>
    <p>hello, {{.title}}</p>
    {{range $index, $ele := .stuArr }}
    <p>{{ $index }}: {{ $ele.Name }} is {{ $ele.Age }} years old</p>
    {{ end }}
</body>
</html>
```

```shell
$ curl http://localhost:9999/arr

<html>
<body>
    <p>hello, Gin</p>
    <p>0: Geektutu is 20 years old</p>
    <p>1: Jack is 22 years old</p>
</body>
</html>
```

- By default, Gin uses the Go standard library's template packages `text/template` and `html/template`. The syntax is identical to the standard library's and supports rendering for all kinds of complex scenarios.
- See the official documentation for [text/template](https://golang.org/pkg/text/template/) and [html/template](https://golang.org/pkg/html/template/)

## Middleware

```go
// applies globally
r.Use(gin.Logger())
r.Use(gin.Recovery())

// applies to a single route
r.GET("/benchmark", MyBenchLogger(), benchEndpoint)

// applies to a group
authorized := r.Group("/")
authorized.Use(AuthRequired())
{
	authorized.POST("/login", loginEndpoint)
	authorized.POST("/submit", submitEndpoint)
}
```

How do you write custom middleware?

```go
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		t := time.Now()
		// set a value on the Context instance
		c.Set("geektutu", "1111")
		// before the request
		c.Next()
		// after the request
		latency := time.Since(t)
		log.Print(latency)
	}
}
```

## Debugging with hot reload

Python's `Flask` framework has a _debug_ mode: pass in _debug=True_ at startup and you get hot reload (Hot Reload, Live Reload). Change the source code, save, and the update is triggered automatically — just refresh your browser. No more killing processes and restarting.

Gin doesn't support this natively, but there are many additional libraries that do. For example:

- github.com/codegangsta/gin
- github.com/pilu/fresh

Here we'll use _github.com/pilu/fresh_.

```bash
go get -v -u github.com/pilu/fresh
```

Once it's installed, just replace the `go run main.go` command with `fresh`. Every time you change a source file, the code is recompiled automatically (Auto Compile).

Reference: [github.com/pilu/fresh - Github](https://github.com/gravityblast/fresh)

## Related links

- [Golang Gin - Github](https://github.com/gin-gonic/gin)
- [Gin Web Framework - Official Website](https://gin-gonic.com/)

> The Chinese original of this article is available at [geektutu.com/post/quick-go-gin.html](https://geektutu.com/post/quick-go-gin.html).
