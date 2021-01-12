---
title: Mysql的组合索引和最左匹配原则
categories:
  - 数据库
  - MYSQL
  - mysql
tags:
  - 数据库
  - MYSQL
  - mysql
abbrlink: 244a560f
date: 2019-01-26 22:54:20
---
### 1. 什么时候创建组合索引

当我们的where查询存在多个条件查询的时候，我们需要对查询的列创建组合索引

### 2. 组合索引相比每个字段索引的好处

- **减少开销**

  比如对col1、col2、col3创建组合索引，相当于创建了（col1）、（col1，col2）、（col1，col2，col3）3个索引。

- **覆盖索引**

  通过组合索引直接查出来。假如查询SELECT col1, col2, col3 FROM 表名，由于查询的字段存在索引页中，那么可以从索引中直接获取，而不需要回表查询。

- **效率高**

  **`对col1、col2、col3三列分别创建索引，MySQL只会选择辨识度高的一列作为索引`** 。假设有100w的数据，一个索引筛选出10%的数据，那么可以筛选出10w的数据；对于组合索引而言，可以筛选出100w*10%*10%*10%=1000条数据

#### 对于查询及存在组合索引有存在单一索引数据库如何处理？

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

