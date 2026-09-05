---
title: '7 Days, from Scratch in Go: Building the Gee Web Framework'
description: >-
  A 7-day tutorial on implementing a web framework from scratch in Go
  (7 days implement golang web framework from scratch tutorial). Design and
  build a web framework in Go/golang modeled after Gin.
date: '2019-08-11 10:10:10'
tags:
  - Go
book: 7days-golang
status: done
draft: false
cover: ../../posts/7days-golang/gee/gee.jpg
---

![gee](../../posts/7days-golang/gee/gee.jpg)

## Designing a framework

Most of the time, when we need to build a web application, our first instinct is to pick a framework. Frameworks differ widely in design philosophy and features. In Python, for example, `django` is batteries-included while `flask` is small and beautiful. Go is the same — new frameworks keep appearing, such as `Beego`, `Gin` and `Iris`. So why not just use the standard library instead of a framework? Before designing one, we need to answer the question: what core problems does a framework solve for us? Only by understanding that can we figure out which features our framework actually needs.

Let's first look at how the standard library `net/http` handles a request.

```go
func main() {
    http.HandleFunc("/", handler)
    http.HandleFunc("/count", counter)
    log.Fatal(http.ListenAndServe("localhost:8000", nil))
}

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "URL.Path = %q\n", r.URL.Path)
}
```

`net/http` provides the basic building blocks of a web server: listening on a port, mapping static routes, and parsing HTTP messages. Many simple needs in web development are not covered, and have to be implemented by hand:

- Dynamic routing: rules like `hello/:name` or `hello/*`.
- Authentication: no grouping or unified auth mechanism; every handler must implement it.
- Templates: no unified, simplified HTML mechanism.
- ...

Whenever we work directly with a base library and find ourselves writing the same plumbing over and over, that is exactly where a framework earns its value. But not every repetitive task belongs in a framework. Python has a well-known web framework called [`bottle`](https://github.com/bottlepy/bottle) — the whole framework lives in a single file, `bottle.py`, about 4400 lines. It is truly a micro-framework, and understanding the features it provides helps us understand the core capabilities of any framework:

- Routing: mapping requests to functions, with support for dynamic routes such as `/hello/:name`.
- Templates: template rendering via a built-in template engine.
- Utilities: helpers for cookies, headers and so on.
- Plugins: Bottle's own feature set is limited, but it offers a plugin mechanism that can be installed globally or scoped to specific routes.
- ...

## The Gee framework

In this tutorial we will implement a simple web framework in Go, called `Gee` — the first three letters of [`geektutu.com`](https://geektutu.com). The first Go web framework I used was `Gin`. Gin's codebase is 14K lines in total, 9K of which are tests — meaning the actual implementation is only **5K lines**. Gin is a framework I really enjoy; much like Python's `Flask`, it is small and beautiful.

Many of the design decisions in this tutorial, including the source code, are inspired by `Gin`, and you will see Gin's shadow everywhere.

Given the time constraints, and to keep things as clear and concise as possible, many parts of this framework are implemented in a deliberately simple way, while still reflecting the core design principles of a framework. Take the `Router`, for example: although it supports only a limited set of dynamic routing rules, the matching algorithm is implemented with a `Trie tree` for performance — one of the most important metrics of a router.

I hope this tutorial inspires you. If you have any suggestions for Gee, feel free to open [issues on GitHub](https://github.com/geektutu/7days-golang/issues) or send PRs. If you run into any problems while following along, leave a comment at the end of the chapter.

## Contents

> The remaining chapters have not been translated yet; the links below lead to the Chinese originals.

- Day 1: [HTTP basics (the http.Handler interface)](https://geektutu.com/post/gee-day1.html), [Code on GitHub](https://github.com/geektutu/7days-golang/tree/master/gee-web/day1-http-base)
- Day 2: [Context design](https://geektutu.com/post/gee-day2.html), [Code on GitHub](https://github.com/geektutu/7days-golang/tree/master/gee-web/day2-context)
- Day 3: [Trie tree router](https://geektutu.com/post/gee-day3.html), [Code on GitHub](https://github.com/geektutu/7days-golang/tree/master/gee-web/day3-router)
- Day 4: [Group control](https://geektutu.com/post/gee-day4.html), [Code on GitHub](https://github.com/geektutu/7days-golang/tree/master/gee-web/day4-group)
- Day 5: [Middleware](https://geektutu.com/post/gee-day5.html), [Code on GitHub](https://github.com/geektutu/7days-golang/tree/master/gee-web/day5-middleware)
- Day 6: [HTML templates](https://geektutu.com/post/gee-day6.html), [Code on GitHub](https://github.com/geektutu/7days-golang/tree/master/gee-web/day6-template)
- Day 7: [Panic recovery](https://geektutu.com/post/gee-day7.html), [Code on GitHub](https://github.com/geektutu/7days-golang/tree/master/gee-web/day7-panic-recover)

## Further reading

- [A Gentle Introduction to Go](https://geektutu.com/post/quick-golang.html)
- [Go Test: Unit Testing in Go](https://geektutu.com/post/quick-golang.html)
- [Gin in a Nutshell](https://geektutu.com/post/quick-go-gin.html)

> The Chinese original of this chapter is available at [geektutu.com/post/gee.html](https://geektutu.com/post/gee.html).
