---
title: 第二天：前缀树路由
description: 使用前缀树（Trie）实现动态路由，支持通配符 :param 与 *catchall。
date: 2021-06-02
tags: [golang, web, 路由]
book: gee
status: done
---

## 1. 为什么用前缀树

普通 `map` 无法处理 `/user/:id` 这类动态路由。前缀树可以逐段匹配路径，并支持参数捕获。

## 2. 节点结构

```go
type node struct {
	pattern  string
	part     string
	children []*node
	isWild   bool
}

func (n *node) matchChild(part string) *node {
	for _, child := range n.children {
		if child.part == part || child.isWild {
			return child
		}
	}
	return nil
}
```

## 3. 插入与查找

```go
func (n *node) insert(pattern string, parts []string, height int) {
	if len(parts) == height {
		n.pattern = pattern
		return
	}
	part := parts[height]
	child := n.matchChild(part)
	if child == nil {
		child = &node{part: part, isWild: part[0] == ':' || part[0] == '*'}
		n.children = append(n.children, child)
	}
	child.insert(pattern, parts, height+1)
}
```

:::warn[注意]
`*` 通配符只能放在路径最后，用于匹配剩余所有部分。
:::

## 小结

- 前缀树天然支持层级匹配与参数
- `:` 匹配单段，`*` 匹配剩余所有段
