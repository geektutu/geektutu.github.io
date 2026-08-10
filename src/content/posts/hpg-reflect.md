---
title: Go Reflect 提高反射性能
description: 反射在 Go 中开销不小，通过缓存 Type、避免反复调用 FieldByName 等技巧可以显著降低反射成本。
date: 2020-12-06
tags: [golang, 性能, 反射]
book: hpg
status: done
---

## 1. 反射为什么慢

Go 的反射通过 `reflect.Value` 在运行时进行类型与字段的动态解析，相比静态编译的调用，多出了大量的类型判断与装箱拆箱。

```go
func reflectCall(v reflect.Value) {
	if v.Kind() != reflect.Struct {
		return
	}
	_ = v.FieldByName("Name")
}
```

## 2. 缓存反射结果

反复调用 `FieldByName` 需要每次遍历字段名表。可以先把解析出的字段缓存起来。

```go
var fieldsCache sync.Map

func getField(t reflect.Type) (reflect.StructField, bool) {
	if f, ok := fieldsCache.Load(t); ok {
		return f.(reflect.StructField), true
	}
	f, ok := t.FieldByName("Name")
	if ok {
		fieldsCache.Store(t, f)
	}
	return f, ok
}
```

:::warn[注意]
`FieldByIndex` 比 `FieldByName` 更快，因为按索引查找省去了名字匹配。
:::

## 3. 少用反射

如果调用方明确知道类型，用接口 + 类型断言往往比反射更高效。反射应作为通用库的最后手段。

## 小结

- 反射慢在运行时类型解析与装箱
- 缓存 `Type` / `Field` 结果能明显提速
- 能类型断言就别反射
