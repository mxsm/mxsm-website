---
title: mysql索引3-索引匹配和SQL优化
date: 2021-09-12
weight: 202109122213
---

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