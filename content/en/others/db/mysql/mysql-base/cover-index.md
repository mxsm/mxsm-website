---
title: 覆盖索引
categories:
  - 数据库
  - MYSQL
  - mysql
tags:
  - 数据库
  - MYSQL
  - mysql
abbrlink: 9627de3
date: 2018-07-10 15:11:37
---
### 1. 什么是MySQL的覆盖索引

覆盖索引（covering index）指一个查询语句的执行只用从索引中就能够取得，不必从数据表中读取。也可以称之为实现了索引覆盖。

如果索引包含所有满足查询需要的数据的索引成为覆盖索引(Covering Index)，也就是平时所说的不需要回表操作

### 2. 如何判断是否为覆盖索引

使用explain，可以通过输出的extra列来判断，对于一个索引覆盖查询，显示为**using index**,MySQL查询优化器在执行查询前会决定是否有索引覆盖查询

注意：

```
1、覆盖索引也并不适用于任意的索引类型，索引必须存储列的值
2、Hash 和full-text索引不存储值，因此MySQL只能使用B-TREE
3、并且不同的存储引擎实现覆盖索引都是不同的
4、并不是所有的存储引擎都支持它们
5、如果要使用覆盖索引，一定要注意SELECT 列表值取出需要的列，不可以是SELECT *，因为如果将所有字段一起做索引会导致索引文件过大，查询性能下降，不能为了利用覆盖索引而这么做
```





参考：

https://www.jianshu.com/p/77eaad62f974

https://www.cnblogs.com/chenpingzhao/p/4776981.html