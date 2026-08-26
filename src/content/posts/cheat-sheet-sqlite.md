---
title: SQLite 常用命令
description: >-
  SQLite
  常见的使用命令。包括数据库的安装与连接，表(table)的创建(create)与删除(delete)，记录的插入(insert)删除(delete)查询(select)改(update)，以及事务(transaction)等操作。
date: '2020-03-02 23:51:24'
tags:
  - Cheat Sheet
book: history
status: done
draft: false
cover: /post/cheat-sheet-sqlite/sqlite.jpg
---

## SQLite 命令

<section class="col-sm-6">

### 安装/连接

```bash
> apt-get install sqlite3 # ubuntu
> sqlite3 -version # 查看版本
3.22.0 ...
> sqlite3 gee.db # 连接数据库，不存在新建
sqlite> .help # 帮助文档
.archive ...      xxx
.auth ON|OFF      xxx
.backup ?DB? FILE xxx
...
```
</section>

<section class="col-sm-6">

### 数据库操作

```bash
> .help # 显示帮助文档
...
> .databases # 显示数据库名称及对应文件
main: /tmp/gee.db
> .output FILE # 将输出定向到 FILE
> .show # 显示已经设置的值
> .dump # 以 SQL 格式 dump 数据库
> .dump users # dump 某张表
> .backup FILE # 备份数据库到文件
> .quit       # 退出
```

</section>

<section class="col-sm-6">

### 表操作

```bash
> .table # 查看所有的表
users books
> .schema users # 显示CREATE语句
CREATE TABLE users(name text PRIMARY KEY, age integer);
> .import FILE TABLE # 将文件的数据导入到表中。
> .head ON  # 查询时显示列名称
> select * from users
name|age
Tom|18
Jack|20
```
</section>

<section class="col-sm-6">

### 输出模式

```bash
> .mode csv # 设置输出模式为 csv
> select * from users
name,age
Tom,18
Jack,20
> .mode insert # 设置输出模式为 insert
> select * from users
INSERT INTO "table"(name,age) VALUES('Tom',18);
INSERT INTO "table"(name,age) VALUES('Jack',20);
```

.mode 支持 csv, column, html, insert, line, list, tabs, tcl 等 8 种模式。

</section>




## SQL 语句

<section class="col-sm-6">

### 创建表

```sql
CREATE TABLE tab_name (
   col1 col1_type PRIMARY KEY,
   col2 INTEGER AUTOINCREMENT,,
   col3 col3_type NOT NULL,
   .....
   colN colN_type,
);

/* 常用类型：
TEXT 字符串, CHAR(100) 固长字符串
INTEGER 整型, BIGINT 长整型, REAL 实数, 
BOOL 布尔值
BLOB 二进制
DATETIME 时间 
*/
```

`PRIMARY KEY` 标记主键，`NOT NULL`标记非空。`AUTOINCREMENT` 自增，只能用于整型。
</section>

<section class="col-sm-6">

### 删除/更新表

```sql
-- 删除表
DROP TABLE tab_name;
-- 新增列
ALTER TABLE ADD COLUMNS col_name col_type;

-- 重命名表
ALTER TABLE old_tab RENAME TO new_tab

-- 重命名列名(3.25.0+)
ALTER TABLE tab_name RENAME COLUMN old_col TO new_col
```
</section>

<section class="col-sm-6">

### 新增记录

```sql
-- 单条
INSERT INTO tab_name VALUES (xx, xx)
-- 指定列名
INSERT INTO tab_name (col1, col3) VALUES (xx, xx)
-- 多条
INSERT INTO tab_name (col1, col2, col3) VALUES
    (xx, xx, xx),
    ...
    (xx, xx, xx);
```
</section>

<section class="col-sm-6">

### 查询记录

```sql
-- 所有列
SELECT * FROM tab_name;
-- 去除重复
SELECT DISTINCT col1 FROM tab_name;
-- 统计个数
SELECT COUNT(*) FROM tab_name
-- 指定列
SELECT col1, col2 FROM table_name;
-- 带查询条件 >、<、=、LIKE、NOT、AND、OR 等
SELECT * FROM table_name WHERE col2 >= 18;
SELECT * FROM table_name
    WHERE col2 >= 18 AND col1 LIKE %stu%;
-- 限制数量
SELECT * FROM table_name LIMIT 1;
-- GROUP BY
SELECT col1, count(*) FROM tab_name
    WHERE [ conditions ]
    GROUP BY col1
-- Having
SELECT col1, count(*) FROM tab_name
    WHERE [ conditions ]
    GROUP BY col1
    HAVING [ conditions ]
-- 排序, DESC 降序，ASC 升序
SELECT * FROM table_name ORDER BY col2 DESC;
```
</section>

<section class="col-sm-6">

### 删除/更新记录

```sql
-- 删除满足条件的记录
DELETE FROM tab_name WHERE condition;
-- 更新记录
UPDATE tab_name SET col1=value1, col2=value2
-- 更新满足条件的记录
UPDATE tab_name
    SET col1=value1, col2=value2
    WHERE [ conditions ]
```
</section>

<section class="col-sm-6">

### 事务(Transaction)

```sql
-- 提交
BEGIN;
INSERT INTO ...
...
COMMIT; 
-- 回滚
BEGIN;
...
ROLLBACK;
```

事务具有原子性（Atomicity）、一致性（Consistency)、隔离性（Isolation）、持久性（Durability）四个标准属性，缩写为 `ACID`。

</section>
