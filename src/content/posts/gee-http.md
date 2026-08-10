---
title: 第一天：HTTP 服务器骨架
description: 从零实现一个最简 Web 框架的第一步——用标准库搭建 HTTP 服务器骨架。
date: 2021-06-01
tags: [golang, web, 框架]
book: gee
status: done
---

## 1. 标准库的 net/http

Go 标准库 `net/http` 已经提供了足够强大的 HTTP 处理能力，我们的框架在其上封装。

```go
package main

import (
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello Gee"))
	})
	http.ListenAndServe(":9999", nil)
}
```

## 2. 封装成 Handler

为了后续支持路由与中间件，我们定义自己的 `HandlerFunc` 与 `Engine`：

```go
type HandlerFunc func(w http.ResponseWriter, r *http.Request)

type Engine struct {
	router map[string]HandlerFunc
}

func (e *Engine) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	key := r.Method + "-" + r.URL.Path
	if handler, ok := e.router[key]; ok {
		handler(w, r)
	}
}

func (e *Engine) Run(addr string) error {
	return http.ListenAndServe(addr, e)
}
```

:::note[关键点]
`Engine` 实现了 `http.Handler` 接口，其 `ServeHTTP` 是我们所有请求的入口——后续的路由、中间件都在这里展开。
:::

## 小结

- 框架本质是 `http.Handler` 的封装
- 用 `method-path` 作为路由键
