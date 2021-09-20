---
title: mysql索引3-索引匹配和SQL优化
date: 2021-09-12
weight: 202109122213
---

- [1. 索引匹配](#1-索引匹配)
	- [1.1 全值匹配](#11-全值匹配)
	- [1.2 匹配最左前缀](#12-匹配最左前缀)
	- [1.3 匹配列前缀](#13-匹配列前缀)
	- [1.4 匹配范围值](#14-匹配范围值)
	- [1.5 精确匹配某一列并且范围匹配另一列](#15-精确匹配某一列并且范围匹配另一列)
	- [1.6 只访问索引的查询(覆盖索引)](#16-只访问索引的查询覆盖索引)
- [2. SQL优化](#2-sql优化)
	- [2.1 对字段建立适当的索引](#21-对字段建立适当的索引)

通过前面对索引类型，以及索引对数据的组织方式等了解，本章节来说说索引的匹配和SQL的优化(索引方面的)。

> 下面用到的例子的数据库来自mysql官网的例子下载地址:[官网的数据库](https://dev.mysql.com/doc/index-other.html)

### 1. 索引匹配

![](https://github.com/mxsm/picture/blob/main/mysql/%E7%B4%A2%E5%BC%95%E7%9A%84%E5%8C%B9%E9%85%8D%E6%96%B9%E5%BC%8F.png?raw=true)

索引匹配这里大致分为了以上六种。下面通过例子一一来讲解。

city表中 Name和CountryCode组成组合索引。

#### 1.1 全值匹配

```sql
SELECT * FROM city WHERE `Name`='Kabul' AND CountryCode = 'AFG'
```

![](https://github.com/mxsm/picture/blob/main/mysql/%E5%85%A8%E5%80%BC%E5%8C%B9%E9%85%8D.png?raw=true)

#### 1.2 匹配最左前缀

```sql
SELECT * FROM city WHERE `Name`='Kabul' AND District = 'Kabol';
SELECT * FROM city WHERE  CountryCode = 'AFG' AND District = 'Kabol';
```

![](https://github.com/mxsm/picture/blob/main/mysql/%E5%8C%B9%E9%85%8D%E6%9C%80%E5%B7%A6%E5%89%8D%E7%BC%80.png?raw=true)

#### 1.3 匹配列前缀

```sql
select * from city where District like 'Ov%';
select * from city where District like '%Ov%';
```

![](https://github.com/mxsm/picture/blob/main/mysql/%E5%8C%B9%E9%85%8D%E5%88%97%E5%89%8D%E7%BC%80.png?raw=true)

#### 1.4 匹配范围值

```sql
select Population from city where Population > 201843;
```

![](https://github.com/mxsm/picture/blob/main/mysql/%E8%8C%83%E5%9B%B4%E5%8C%B9%E9%85%8D.png?raw=true)

#### 1.5 精确匹配某一列并且范围匹配另一列

```sql
select * from city where Name = 'Breda' and CountryCode > 'NLD';
```

![](https://github.com/mxsm/picture/blob/main/mysql/%E7%B2%BE%E7%A1%AE%E5%8C%B9%E9%85%8D%E6%9F%90%E4%B8%80%E5%88%97%E5%B9%B6%E4%B8%94%E8%8C%83%E5%9B%B4%E5%8C%B9%E9%85%8D%E5%8F%A6%E4%B8%80%E5%88%97.png?raw=true)

#### 1.6 只访问索引的查询(覆盖索引)

```sql
select Name,CountryCode,District,Population from city where Name = 'Breda' and CountryCode = 'NLD';
```

![](https://github.com/mxsm/picture/blob/main/mysql/%E5%8F%AA%E8%AE%BF%E9%97%AE%E7%B4%A2%E5%BC%95%E7%9A%84%E6%9F%A5%E8%AF%A2-%E8%A6%86%E7%9B%96%E7%B4%A2%E5%BC%95.png?raw=true)

### 2. SQL优化

sql优化意义是获取相同的数据能够用最小的时间。SQL的优化有很多方面，例如提高硬件的处理能力。在同一个SQL下硬件处理能力越强的你们SQL也就越快。比如网络的延迟等等。我们这边的SQL主要考虑的是通过优化SQL本身和建立适当的索引来降低查询所需要的时间。

- 对字段建立适当的索引

  这里说的是建立适当的索引。不是索引越多越好。根据实际情况建立适当的索引。在建立索引的过程中也会有技巧。

- 建表的字段

  一般对于建表的字段来说，根据业务需求建立对应的字段大小。等等

- SQL本身的优化

  何为SQL本身的优化，例如业务需要表A中的a、b 、c三个字段。在查询的就应该根据条件返回这三个字段。而不是返回全部的字段。这样全部返回增加网络的负担。同样也增加了数据库的负担。 很可能导致一些索引使用不了。

下面就一一来说明在日常工作中的一些索引的优化(后续还会进行补充)

#### 2.1 对字段建立适当的索引