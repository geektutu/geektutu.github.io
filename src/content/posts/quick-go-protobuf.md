---
title: Go Protobuf 简明教程
description: >-
  protobuf 即 Protocol Buffers，是一种轻便高效的结构化数据存储格式，与语言、平台无关，可扩展可序列化。protobuf 性能和效率大幅度优于 JSON、XML 等其他的结构化数据格式。protobuf
  是以二进制方式存储的，占用空间小，但也带来了可读性差的缺点。protobuf 在通信协议和数据存储等领域应用广泛。本文介绍的是 Protocol Buffers 3 (protobuf3, proto3) 的安装和基本语法，以及如何在
  Go 语言使用。
date: '2020-01-11 00:27:00'
tags:
  - Go
book: history
status: done
draft: false
cover: /post/quick-go-protobuf/protocol-buffers.jpg
---

![Golang Protocol Buffers](/post/quick-go-protobuf/go-protobuf.jpg)

## 1 Protocol Buffers 简介

protobuf 即 Protocol Buffers，是一种轻便高效的结构化数据存储格式，与语言、平台无关，可扩展可序列化。protobuf 性能和效率大幅度优于 JSON、XML 等其他的结构化数据格式。protobuf 是以二进制方式存储的，占用空间小，但也带来了可读性差的缺点。protobuf 在通信协议和数据存储等领域应用广泛。例如著名的分布式缓存工具 [Memcached](https://memcached.org/) 的 Go 语言版本[groupcache](https://github.com/golang/groupcache) 就使用了 protobuf 作为其 RPC 数据格式。

Protobuf 在 `.proto` 定义需要处理的结构化数据，可以通过 `protoc` 工具，将 `.proto` 文件转换为 C、C++、Golang、Java、Python 等多种语言的代码，兼容性好，易于使用。

## 2 安装

### 2.1 protoc

从 [Protobuf Releases](https://github.com/protocolbuffers/protobuf/releases) 下载最先版本的发布包安装。如果是 Ubuntu，可以按照如下步骤操作（以3.11.2为例）。

```bash
# 下载安装包
$ wget https://github.com/protocolbuffers/protobuf/releases/download/v3.11.2/protoc-3.11.2-linux-x86_64.zip
# 解压到 /usr/local 目录下
$ sudo 7z x protoc-3.11.2-linux-x86_64.zip -o/usr/local
```

如果不想安装在 /usr/local 目录下，可以解压到其他的其他，并把解压路径下的 bin 目录 加入到环境变量即可。

如果能正常显示版本，则表示安装成功。

```bash
$ protoc --version
libprotoc 3.11.2
```

### 2.2 protoc-gen-go 

我们需要在 Golang 中使用 protobuf，还需要安装 protoc-gen-go，这个工具用来将 `.proto` 文件转换为 Golang 代码。

```bash
go get -u github.com/golang/protobuf/protoc-gen-go
```

protoc-gen-go 将自动安装到 `$GOPATH/bin` 目录下，也需要将这个目录加入到环境变量中。

## 3 定义消息类型

接下来，我们创建一个非常简单的示例，`student.proto`

```go
syntax = "proto3";
package main;

// this is a comment
message Student {
  string name = 1;
  bool male = 2;
  repeated int32 scores = 3;
}
```

在当前目录下执行：

```bash
$ protoc --go_out=. *.proto
$ ls
student.pb.go  student.proto
```

即是，将该目录下的所有的 .proto 文件转换为 Go 代码，我们可以看到该目录下多出了一个 Go 文件 *student.pb.go*。这个文件内部定义了一个结构体 Student，以及相关的方法：

```go
type Student struct {
	Name string `protobuf:"bytes,1,opt,name=name,proto3" json:"name,omitempty"`
	Male bool `protobuf:"varint,2,opt,name=male,proto3" json:"male,omitempty"`
	Scores []int32 `protobuf:"varint,3,rep,packed,name=scores,proto3" json:"scores,omitempty"`
	...
}
```

逐行解读`student.proto`

- protobuf 有2个版本，默认版本是 proto2，如果需要 proto3，则需要在非空非注释第一行使用 `syntax = "proto3"` 标明版本。
- `package`，即包名声明符是可选的，用来防止不同的消息类型有命名冲突。
- 消息类型 使用 `message` 关键字定义，Student 是类型名，name, male, scores 是该类型的 3 个字段，类型分别为 string, bool 和 []int32。字段可以是标量类型，也可以是合成类型。
- 每个字段的修饰符默认是 singular，一般省略不写，`repeated` 表示字段可重复，即用来表示 Go 语言中的数组类型。
- 每个字符 `=`后面的数字称为标识符，每个字段都需要提供一个唯一的标识符。标识符用来在消息的二进制格式中识别各个字段，一旦使用就不能够再改变，标识符的取值范围为 [1, 2^29 - 1] 。
- .proto 文件可以写注释，单行注释 `//`，多行注释 `/* ... */`
- 一个 .proto 文件中可以写多个消息类型，即对应多个结构体(struct)。

接下来，就可以在项目代码中直接使用了，以下是一个非常简单的例子，即证明被序列化的和反序列化后的实例，包含相同的数据。

```go
package main

import (
	"log"

	"github.com/golang/protobuf/proto"
)

func main() {
	test := &Student{
		Name: "geektutu",
		Male:  true,
		Scores: []int32{98, 85, 88},
	}
	data, err := proto.Marshal(test)
	if err != nil {
		log.Fatal("marshaling error: ", err)
	}
	newTest := &Student{}
	err = proto.Unmarshal(data, newTest)
	if err != nil {
		log.Fatal("unmarshaling error: ", err)
	}
	// Now test and newTest contain the same data.
	if test.GetName() != newTest.GetName() {
		log.Fatalf("data mismatch %q != %q", test.GetName(), newTest.GetName())
	}
}
```

- 保留字段(Reserved Field)

更新消息类型时，可能会将某些字段/标识符删除。这些被删掉的字段/标识符可能被重新使用，如果加载老版本的数据时，可能会造成数据冲突，在升级时，可以将这些字段/标识符保留(reserved)，这样就不会被重新使用了，protoc 会检查。

```go
message Foo {
  reserved 2, 15, 9 to 11;
  reserved "foo", "bar";
}
```


## 4 字段类型

### 4.1 标量类型(Scalar)

| proto类型 | go类型 | 备注 | proto类型 | go类型 | 备注 |
|---|---|---|---|---|---|
| double | float64 | | float | float32 ||
| int32 | int32 | | int64 | int64 | |
| uint32 | uint32 |  |uint64 | uint64 | |
| sint32 | int32 | 适合负数 | sint64 | int64 | 适合负数 |
| fixed32 | uint32 | 固长编码，适合大于2^28的值 | fixed64 | uint64 | 固长编码，适合大于2^56的值 |
| sfixed32 | int32 | 固长编码 | sfixed64 | int64 | 固长编码 |
| bool | bool | |string|string| UTF8 编码，长度不超过 2^32 |
| bytes | []byte | 任意字节序列，长度不超过 2^32 |

标量类型如果没有被赋值，则不会被序列化，解析时，会赋予默认值。

- strings：空字符串
- bytes：空序列
- bools：false
- 数值类型：0

### 4.2 枚举(Enumerations)

枚举类型适用于提供一组预定义的值，选择其中一个。例如我们将性别定义为枚举类型。

```go
message Student {
  string name = 1;
  enum Gender {
    FEMALE = 0;
    MALE = 1;
  }
  Gender gender = 2;
  repeated int32 scores = 3;
}
```

- 枚举类型的第一个选项的标识符必须是0，这也是枚举类型的默认值。
- 别名（Alias），允许为不同的枚举值赋予相同的标识符，称之为别名，需要打开`allow_alias`选项。

```go
message EnumAllowAlias {
  enum Status {
    option allow_alias = true;
    UNKOWN = 0;
    STARTED = 1;
    RUNNING = 1;
  }
}
```

### 4.3 使用其他消息类型

`Result`是另一个消息类型，在 SearchReponse 作为一个消息字段类型使用。

```go
message SearchResponse {
  repeated Result results = 1; 
}

message Result {
  string url = 1;
  string title = 2;
  repeated string snippets = 3;
}
```

嵌套写也是支持的：

```go
message SearchResponse {
  message Result {
    string url = 1;
    string title = 2;
    repeated string snippets = 3;
  }
  repeated Result results = 1;
}
```

如果定义在其他文件中，可以导入其他消息类型来使用：

```go
import "myproject/other_protos.proto";
```

### 4.4 任意类型(Any)

Any 可以表示不在 .proto 中定义任意的内置类型。

```go
import "google/protobuf/any.proto";

message ErrorStatus {
  string message = 1;
  repeated google.protobuf.Any details = 2;
}
```

### 4.5 oneof

```go
message SampleMessage {
  oneof test_oneof {
    string name = 4;
    SubMessage sub_message = 9;
  }
}
```

### 4.6 map

```go
message MapRequest {
  map<string, int32> points = 1;
}
```

## 5 定义服务(Services)

如果消息类型是用来远程通信的(Remote Procedure Call, RPC)，可以在 .proto 文件中定义 RPC 服务接口。例如我们定义了一个名为 SearchService 的 RPC 服务，提供了 `Search` 接口，入参是 `SearchRequest` 类型，返回类型是 `SearchResponse`

```go
service SearchService {
  rpc Search (SearchRequest) returns (SearchResponse);
}
```

官方仓库也提供了一个[插件列表](https://github.com/protocolbuffers/protobuf/blob/master/docs/third_party.md)，帮助开发基于 Protocol Buffer 的 RPC 服务。

## 6 protoc 其他参数

命令行使用方法

```bash
protoc --proto_path=IMPORT_PATH --<lang>_out=DST_DIR path/to/file.proto
```

- `--proto_path=IMPORT_PATH`：可以在 .proto 文件中 import 其他的 .proto 文件，proto_path 即用来指定其他 .proto 文件的查找目录。如果没有引入其他的 .proto 文件，该参数可以省略。
- `--<lang>_out=DST_DIR`：指定生成代码的目标文件夹，例如 --go_out=. 即生成 GO 代码在当前文件夹，另外支持 cpp/java/python/ruby/objc/csharp/php 等语言

## 7 推荐风格

- 文件(Files)
    - 文件名使用小写下划线的命名风格，例如 lower_snake_case.proto
    - 每行不超过 80 字符
    - 使用 2 个空格缩进

- 包(Packages)
    - 包名应该和目录结构对应，例如文件在`my/package/`目录下，包名应为 `my.package`

- 消息和字段(Messages & Fields)
    - 消息名使用首字母大写驼峰风格(CamelCase)，例如`message StudentRequest { ... }`
    - 字段名使用小写下划线的风格，例如 `string status_code = 1`
    - 枚举类型，枚举名使用首字母大写驼峰风格，例如 `enum FooBar`，枚举值使用全大写下划线隔开的风格(CAPITALS_WITH_UNDERSCORES )，例如 FOO_DEFAULT=1

- 服务(Services) 
    - RPC 服务名和方法名，均使用首字母大写驼峰风格，例如`service FooService{ rpc GetSomething() }`

## 附：参考

1. [protobuf 代码仓库 - github.com](https://github.com/protocolbuffers/protobuf)
2. [golang protobuf 代码仓库 - github.com](https://github.com/golang/protobuf)
3. [Remote procedure call 远程过程调用 - wikipedia.org](https://en.wikipedia.org/wiki/Remote_procedure_call)
4. [Groupcache Go语言版 memcached - github.com](https://github.com/golang/groupcache)
5. [Language Guide (proto3) 官方指南 - google.com](https://developers.google.com/protocol-buffers/docs/proto3)
6. [Proto Style Guide 代码风格指南 - google.com](https://developers.google.com/protocol-buffers/docs/style)
7. [Protocol Buffer 插件列表 - github.com](https://github.com/protocolbuffers/protobuf/blob/master/docs/third_party.md)
