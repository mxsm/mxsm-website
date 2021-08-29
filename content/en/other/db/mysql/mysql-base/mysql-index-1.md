---
title: mysql索引(1)
date: 2021-08-29
weight: 202108291427
---

### 1. mysql索引分类

mysql索引主要分为两类：

- 主键索引

  每一张表的主键就是一个索引。mysql中组织数据也是通过该字段。在没有手动指定主键的情况下，mysql会自动生成一列 ***row_id*** 来作为主键。

- 辅助索引

  常用的唯一索引，组合索引，普通的索引都是辅助索引。

> 主键索引和唯一索引的区别：
>
> - 唯一索引可以为空值，主键索引不能
> - mysql一张表只能有一个主键索引，而可以拥有多个唯一索引
> - 主键索引一定是一个唯一索引，而唯一索引不一定是主键索引

### 2. 主键索引的组织数据方式

mysql的数据逻辑组织方式如下图：

![组成图示](https://github.com/mxsm/picture/blob/main/mysql/innodbtablestruct.png?raw=true)

下面看下主键组织数据的情况，也就是主键索引：

![](https://github.com/mxsm/picture/blob/main/mysql/mysql%E4%B8%BB%E9%94%AE%E7%BB%84%E7%BB%87%E6%95%B0%E6%8D%AE.png?raw=true)

B+数组织的是mysql中的页数据。在B+树中的非叶子节点，存储的是主键和页号的指针。对于叶子节点存入的row数据。

> 
