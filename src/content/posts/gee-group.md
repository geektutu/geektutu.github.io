---
title: 第三天：路由分组与中间件
description: 引入分组（Group）来组织路由，并实现洋葱模型式的中间件执行顺序。
date: 2021-06-03
tags: [golang, web, 中间件]
book: gee
status: wip
---

## 1. 路由分组

分组让带相同前缀的路由共享中间件。`Group` 持有自身前缀与父分组。

```go
type RouterGroup struct {
	prefix      string
	middlewares []HandlerFunc
	engine      *Engine
}

func (g *RouterGroup) Group(prefix string) *RouterGroup {
	engine := g.engine
	ng := &RouterGroup{
		prefix: g.prefix + prefix,
		engine: engine,
	}
	engine.groups = append(engine.groups, ng)
	return ng
}
```

## 2. 中间件的洋葱模型

中间件通过 `Context.Next()` 形成"先入后出"的执行链：

```go
func (c *Context) Next() {
	c.index++
	for c.index < len(c.handlers) {
		c.handlers[c.index](c)
		c.index++
	}
}
```

:::tip[执行顺序]
请求先经过每个中间件的前半段，再进入业务 Handler，最后再返回执行每个中间件的后半段——如同洋葱层层剥开。
:::

## 小结

- 分组提供前缀级的路由与中间件组织
- `Next()` 实现洋葱模型的中间件链

> 本章仍在撰写中，敬请期待后续完善。
