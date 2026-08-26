---
title: Pandas 数据处理(一) - DataFrame 与 Series
description: DataFrame和Series是pandas中最常见的2种数据结构。DataFrame可以理解为Excel中的一张表，Series可以理解为一张Excel表的一行或一列数据。
date: '2018-03-20 10:51:24'
tags:
  - Pandas
book: history
status: done
draft: false
cover: /post/pandas-dataframe-series/pandas.gif
---

本文示例基于 Version 0.21.0

DataFrame和Series是pandas中最常见的2种数据结构。DataFrame可以理解为Excel中的一张表，Series可以理解为一张Excel表的一行或一列数据。

## 一、Series

Series可以理解为一维数组，它和一维数组的区别，在于Series具有索引。

### 1. 创建Series

- 默认索引

```python
money_series = pd.Series([200, 300, 10, 5], name="money") # 未设置索引的情况下，自动从0开始生成
"""
0    200
1    300
2     10
3      5
Name: money, dtype: int64
"""
money_series[0] # 根据索引获取具体的值，
# 200
money_series = money_series.sort_values() # 根据值进行排序，排序后索引与值对应关系不变
"""
3      5
2     10
0    200
1    300
Name: money, dtype: int64
"""
money_series[0] # 根据索引获取具体的值，0对应的依旧是200，等价于 money_series.loc[0]
# 200
money_series.iloc[0] # 根据序号获取具体的值
# 5
```

- 自定义索引

```python
money_series = pd.Series([200, 300, 10, 5], index=['d', 'c', 'b', 'a'], name='money') 
"""
d    200
c    300
b     10
a      5
Name: money, dtype: int64
"""
money_series.index # 查看索引
# Index(['d', 'c', 'b', 'a'], dtype='object')
money_series['a'] # 根据索引获取具体的值
# 5
money_series = money_series.sort_index() # 根据索引排序
"""
a      5
b     10
c    300
d    200
Name: money, dtype: int64
"""
money_series.iloc[-1] # 取最后一个值
# 200
```

### 2. 切片与取值

- 根据索引

```python
money_series = pd.Series({'d': 200, 'c': 300, 'b': 10, 'a': 5}, name='money')
"""
a    200
b    300
c     10
d      5
Name: money, dtype: int64
"""
money_series.loc['a'] # 等价于 money_series['a']
# 200
money_series.loc['c':'a':-1] # 从c取到 a，倒序
"""
c     10
b    300
a    200
Name: money, dtype: int64
"""
money_series.loc[['d', 'a']] # d, a的值，等价于 money_series[['d', 'a']]
"""
d      5
a    200
"""
```

- 根据序号

```python
money_series.iloc[0]
# 200
money_series.iloc[1:3] # 根据序号取值，不包含结束，等价于 money_series[1:3]
"""
b    300
c     10
Name: money, dtype: int64
"""
money_series.iloc[[3, 0]] # 取第三个值和第一个值
"""
d      5
a    200
Name: money, dtype: int64
"""
```

- 根据条件

```python
money_series[money_series > 50] # 选取大于50的值
"""
c    300
d    200
Name: money, dtype: int64
"""
money_series[lambda x: x ** 2 > 50] # 选取值平方大于50的值
"""
b     10
c    300
d    200
Name: money, dtype: int64
"""
```

## 二、DataFrame

### 1. 创建DataFrame

- 从字典中创建

```python
# 字典值等长
# 不指定 index
df = pd.DataFrame({'单价': [100, 200, 30], '数量': [3, 3, 10]}) 
"""
    单价  数量
0  100   3
1  200   3
2   30  10
"""

# 指定 index
df = pd.DataFrame({'单价': [100, 200, 30], '数量': [3, 3, 10]}, index=['T001', 'T002', 'T003']) 
"""
       单价  数量
T001  100   3
T002  200   3
T003   30  10
"""
```

- 通过Series创建

```python
price_series = pd.Series([100, 200, 30], index=['T001', 'T002', 'T005'])
quantity_series = pd.Series([3, 3, 10, 2], index=['T001', 'T002', 'T003', 'T004'])
df = pd.DataFrame({'单价': price_series, '数量': quantity_series})
# 数据中不含有对应元素，则置为NaN
"""
         单价    数量
T001  100.0   3.0
T002  200.0   3.0
T003    NaN  10.0
T004    NaN   2.0
T005   30.0   NaN
"""
```

- 从Excel文件中读取，demo.dat

```python
df = pd.read_excel("path/demo.xlsx", sheetname=0)
# 指定 sheetname
df = pd.read_excel("path/demo.xlsx", sheetname='销售记录')
```

- 从普通文本中读取

```
编号|日期|单价|数量
T001|2018-03-02 12:34:05|100|3
T002|2018-03-02 13:04:05|200|3
T003|2018-03-03 18:12:31|30|10
T004|2018-03-04 20:34:05|400|2
T005|2018-03-02 20:34:05|500|1
```

```python
df = pd.read_csv('demo.dat', delimiter='|') # csv默认是逗号分隔的，如果不是，需要指定delimiter
"""
     编号                   日期   单价  数量
0  T001  2018-03-02 12:34:05  100   3
1  T002  2018-03-02 13:04:05  200   3
2  T003  2018-03-03 18:12:31   30  10
3  T004  2018-03-04 20:34:05  400   2
4  T005  2018-03-02 20:34:05  500   1
"""

df = pd.read_csv('demo.dat', delimiter='|', index_col='编号') # index_col指定行标签为索引
"""
                       日期   单价  数量
编号                                
T001  2018-03-02 12:34:05  100   3
T002  2018-03-02 13:04:05  200   3
T003  2018-03-03 18:12:31   30  10
T004  2018-03-04 20:34:05  400   2
T005  2018-03-02 20:34:05  500   1
"""
```

### 2. 获取列与行

```python
df['日期'] # -> 返回Series
"""
0    2018-03-02 12:34:05
1    2018-03-02 13:04:05
2    2018-03-03 18:12:31
3    2018-03-04 20:34:05
4    2018-03-02 20:34:05
Name: 日期, dtype: object
"""
df[['单价', '数量']] # -> 返回Series
"""
    单价  数量
0  100   3
1  200   3
2   30  10
3  400   2
4  500   1
"""
df.loc['T001'] # 按行标签获取，返回Series
df.iloc[0] # 按行号获取，返回Series
"""
日期    2018-03-02 12:34:05
单价                    100
数量                      3
Name: T001, dtype: object
"""
df.head(3) # 前三行
df.tail(3) # 后三行
"""
                       日期   单价  数量
编号                                
T003  2018-03-03 18:12:31   30  10
T004  2018-03-04 20:34:05  400   2
T005  2018-03-02 20:34:05  500   1
"""
```

### 3. 修改

- 单价 * 2

```python
df['单价'] *= 2
# apply支持传入修改函数，能处理更复杂的场景
# 等价于， df['单价'] = df.apply(lambda x: x['单价'] * 2, axis=1)

"""
                       日期    单价  数量
编号                                 
T001  2018-03-02 12:34:05   200   3
T002  2018-03-02 13:04:05   400   3
T003  2018-03-03 18:12:31    60  10
T004  2018-03-04 20:34:05   800   2
T005  2018-03-02 20:34:05  1000   1
"""
```

- 编号加上前缀

```python
# 由于编号是索引，所以需要用 df.index去访问
df.index = '2018_' + df.index
"""
                          日期    单价  数量
2018_T001  2018-03-02 12:34:05   200   3
2018_T002  2018-03-02 13:04:05   400   3
2018_T003  2018-03-03 18:12:31    60  10
2018_T004  2018-03-04 20:34:05   800   2
2018_T005  2018-03-02 20:34:05  1000   1
"""
```

- 数量小于3的记录，单价 + 10

```python
def change_price(x):
    if x['数量'] < 3:
        return x['单价'] + 10
    return x['单价']


df['单价'] = df.apply(change_price, axis=1)
"""
                            日期    单价  数量
2018_T001  2018-03-02 12:34:05   200   3
2018_T002  2018-03-02 13:04:05   400   3
2018_T003  2018-03-03 18:12:31    60  10
2018_T004  2018-03-04 20:34:05   810   2
2018_T005  2018-03-02 20:34:05  1010   1
"""
```

- 增加物流公司

```python
df['运费'] = pd.Series({'2018_T001': 10, '2018_T005': 12})
"""
                            日期    单价  数量    运费
2018_T001  2018-03-02 12:34:05   200   3  10.0
2018_T002  2018-03-02 13:04:05   400   3   NaN
2018_T003  2018-03-03 18:12:31    60  10   NaN
2018_T004  2018-03-04 20:34:05   810   2   NaN
2018_T005  2018-03-02 20:34:05  1010   1  12.0
"""
# 缺少信息的部分填充为0
df.fillna(0)
"""
                            日期    单价  数量    运费
2018_T001  2018-03-02 12:34:05   200   3  10.0
2018_T002  2018-03-02 13:04:05   400   3   0.0
2018_T003  2018-03-03 18:12:31    60  10   0.0
2018_T004  2018-03-04 20:34:05   810   2   0.0
2018_T005  2018-03-02 20:34:05  1010   1  12.0
"""
```

### 4. 删除

- 删除日期列（就地删除）

```python
del df['日期']
"""
             单价  数量    运费
2018_T001   200   3  10.0
2018_T002   400   3   NaN
2018_T003    60  10   NaN
2018_T004   810   2   NaN
2018_T005  1010   1  12.0
"""
```

- 删除运费列（返回筛选后的）

```python
new_columns = list(df.columns)
new_columns.remove('运费')
df = df[new_columns]
"""
             单价  数量
2018_T001   200   3
2018_T002   400   3
2018_T003    60  10
2018_T004   810   2
2018_T005  1010   1
"""
```

## 附 推荐

- [一篇文章入门 Python](https://geektutu.com/post/quick-python.html)
