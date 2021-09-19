---
title: mysql索引2-索引分类
date: 2021-09-05
weight: 202109121427
---

> mysql 版本为8.0版本

[TOC]

在mysql的使用中，索引是一个少不了的话题，经常会听到很多关于索引的名称。比如全文索引，唯一索引等等。五花八门，下面我们就来对这些索引进行一一的说明。图如下：

![](https://github.com/mxsm/picture/blob/main/mysql/mysql%E7%B4%A2%E5%BC%95%E5%88%86%E7%B1%BB.png?raw=true)

创建索引的语法([来源mysql官网](https://dev.mysql.com/doc/refman/8.0/en/create-index.html)):

```sql
CREATE [UNIQUE | FULLTEXT | SPATIAL] INDEX index_name
    [index_type]
    ON tbl_name (key_part,...)
    [index_option]
    [algorithm_option | lock_option] ...

key_part: {col_name [(length)] | (expr)} [ASC | DESC]

index_option: {
    KEY_BLOCK_SIZE [=] value
  | index_type
  | WITH PARSER parser_name
  | COMMENT 'string'
  | {VISIBLE | INVISIBLE}
  | ENGINE_ATTRIBUTE [=] 'string'
  | SECONDARY_ENGINE_ATTRIBUTE [=] 'string'
}

index_type:
    USING {BTREE | HASH}

algorithm_option:
    ALGORITHM [=] {DEFAULT | INPLACE | COPY}

lock_option:
    LOCK [=] {DEFAULT | NONE | SHARED | EXCLUSIVE}
```

> Note: create index 不能创建主键

### 1. 主键索引

mysql中Innodb存储引擎来说，一张表只能有一个主键索引。

> rowId MySQL的InnoDB引擎默认采用索引组织表

### 2. 辅助索引

什么叫辅助索引？主键意外的索引就叫辅助索引。这里包含了我们平时说的唯一索引，组合索引，普通索引。

![](https://github.com/mxsm/picture/blob/main/mysql/mysql%E7%B4%A2%E5%BC%95%E5%88%86%E7%B1%BB1.png?raw=true)

```sql
CREATE INDEX part_of_name ON customer (name(10)); --创建普通索引使用的是B+tree
CREATE UNIQUE INDEX part_of_name ON customer (name(10)) USING BTREE; --创建唯一索引
CREATE FULLTEXT INDEX part_of_name ON customer (name(10)) USING BTREE; --创建全文索引
CREATE SPATIAL INDEX part_of_name ON customer (name(10)) USING BTREE; --创建空间索引
ALTER TABLE `world`.`city` ADD FULLTEXT INDEX `CountryCode`(`CountryCode`) USING BTREE; --创建索引

--删除索引

DROP INDEX 索引名称 ON 表名
ALTER TABLE 表名 DROP INDEX 索引名称
```



#### 2.1 普通索引

普通索引就是平时常见创建的索引。可以针对一个列或者多个列进行创建索引。

```mysql
CREATE INDEX part_of_name ON customer (name(10)); //对单个字段建立索引
CREATE INDEX part_of_name ON customer (name(10),age); //对多个字段建立索引
```



#### 2.2 唯一索引

它与前面的"普通索引"类似，不同的就是：索引列的值必须唯一，但允许有空值。如果是组合索引，则列值的组合必须唯一。

```mysql
CREATE UNIQUE INDEX part_of_name ON customer (name(10)) USING BTREE; --创建唯一索引
drop index part_of_name; -- 删除索引
```

#### 2.3 全文索引

全文检索技术是智能信息管理的关键技术之一，其主要目的就是实现对大容量的非结构化数据的快速查找。

```sql
CREATE FULLTEXT INDEX part_of_name ON customer (name(10)) USING BTREE; --创建全文索引
```

#### 2.4 空间索引

InnoDB支持空间索引，通过R树来实现，使得空间搜索变得高效

```mysql
CREATE SPATIAL INDEX part_of_name ON customer (name(10)); --创建空间索引
```

### 3. 聚族索引和非聚族索引

聚族索引和非聚族索引说的是对数据的组织方式。

- 聚族索引：叶子节点存放的是记录的数据
- 非聚族索引：叶子节点存放的是主键的数据

### 4. 覆盖索引

覆盖索引（covering index）指一个查询语句的执行只用从索引中就能够取得，不必从数据表中读取。也可以称之为实现了索引覆盖。如果索引包含所有满足查询需要的数据的索引成为覆盖索引(Covering Index)，也就是平时所说的不需要回表操作。

> 是否需要回表来判断是否为覆盖索引。
>
> 使用explain，可以通过输出的extra列来判断，对于一个索引覆盖查询，显示为**using index**,MySQL查询优化器在执行查询前会决定是否有索引覆盖查询

### 5. 组合索引

所谓的组合索引其实是对索引的列的多少来进行分类的。例如一行的话就是我们经常用到的索引方式。 对于大于1列的索引我们叫做组合索引。

#### 5.1 什么时候创建组合索引

当我们的where查询存在多个条件查询的时候，我们需要对查询的列创建组合索引

#### 5.2 组合索引相比每个字段索引的好处

- **减少开销**

  比如对col1、col2、col3创建组合索引，相当于创建了（col1）、（col1，col2）、（col1，col2，col3）3个索引。

- **覆盖索引**

  通过组合索引直接查出来。假如查询SELECT col1, col2, col3 FROM 表名，由于查询的字段存在索引页中，那么可以从索引中直接获取，而不需要回表查询。

- **效率高**

  *`对col1、col2、col3三列分别创建索引，MySQL只会选择辨识度高的一列作为索引`*  。假设有100w的数据，一个索引筛选出10%的数据，那么可以筛选出10w的数据；对于组合索引而言，可以筛选出100w*10%*10%*10%=1000条数据

#### 5.3 对于查询及存在组合索引有存在单一索引数据库如何处理？

```sql
CREATE TABLE `Student` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `classname` varchar(255) DEFAULT NULL,
  `classNumber` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_index` (`name`,`classname`,`classNumber`) USING BTREE,
  KEY `name_index` (`name`) USING BTREE,
  KEY `classname_index` (`classname`) USING BTREE,
  KEY `classNumber` (`classNumber`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

表中的数据：

![数据](https://github.com/mxsm/document/blob/master/image/database/indexTest.png?raw=true)

![情况1](https://github.com/mxsm/document/blob/master/image/database/select1.png?raw=true)



![情况2](https://github.com/mxsm/document/blob/master/image/database/selection2.png?raw=true)

从上图可以看出：**最左匹配原则和字段的在前和在后面没有关系**

------



![情况2](https://github.com/mxsm/document/blob/master/image/database/selection3.png?raw=true)

![情况2](https://github.com/mxsm/document/blob/master/image/database/selection4.png?raw=true)

从上图可以看出：**在一个字段如果符合最左匹配原则就优先使用最左匹配原则。**

**假设我们创建（col1，col2，col3）这样的一个组合索引，那么相当于对col1列进行排序，也就是我们创建组合索引，以最左边的为准，只要查询条件中带有最左边的列，那么查询就会使用到索引，和字段在where后面的位置无关。**



参考文档：

- https://www.jianshu.com/p/77eaad62f974
- https://www.cnblogs.com/chenpingzhao/p/4776981.html
