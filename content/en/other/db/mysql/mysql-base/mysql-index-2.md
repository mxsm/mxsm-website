---
title: mysql索引2-索引分类
date: 2021-09-05
weight: 202108291427
---

> mysql 版本为8.0版本

在mysql的使用中，索引是一个少不了的话题，经常会听到很多关于索引的名称。比如全文索引，唯一索引等等。五花八门，下面我们就来对这些索引进行一一的说明。图如下：

![](https://github.com/mxsm/picture/blob/main/mysql/mysql%E7%B4%A2%E5%BC%95%E5%88%86%E7%B1%BB.png?raw=true)

### 1. 主键索引

mysql中Innodb存储引擎来说，一张表只能有一个主键索引。

> rowId MySQL的InnoDB引擎默认采用索引组织表

### 2. 辅助索引

什么叫辅助索引？主键意外的索引就叫辅助索引。这里包含了我们平时说的唯一索引，组合索引，普通索引。

![](https://github.com/mxsm/picture/blob/main/mysql/mysql%E7%B4%A2%E5%BC%95%E5%88%86%E7%B1%BB1.png?raw=true)

#### 2.1 普通索引

