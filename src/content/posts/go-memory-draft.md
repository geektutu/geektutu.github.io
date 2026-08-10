---
title: Go 内存管理浅析（草稿）
description: 一篇尚未完成的草稿文章，用于演示书稿看板的草稿状态。
date: 2025-01-01
tags: [golang, 内存]
draft: true
status: draft
---

本文为草稿示例，处于 `draft` 状态，不会出现在公开页面，仅书稿看板可见。

## 1. 计划内容

- 内存分配器（mcache / mcentral / mheap）
- 垃圾回收三色标记
- 逃逸分析
