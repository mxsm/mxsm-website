---
title: Explain执行计划
date: 2021-08-27
weight: 202108272202
---

> 使用的表：
>
> ```sql
> CREATE TABLE `city` (
>   `ID` int NOT NULL AUTO_INCREMENT,
>   `Name` char(35) NOT NULL DEFAULT '',
>   `CountryCode` char(3) NOT NULL DEFAULT '',
>   `District` char(20) NOT NULL DEFAULT '',
>   `Population` int NOT NULL DEFAULT '0',
>   PRIMARY KEY (`ID`),
>   KEY `name_code` (`Name`,`CountryCode`)
> ) ENGINE=InnoDB AUTO_INCREMENT=4080 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
> INSERT INTO `city` VALUES (1,'Kabul','AFG','Kabol',1780000);
> INSERT INTO `city` VALUES (2,'Qandahar','AFG','Qandahar',237500);
> INSERT INTO `city` VALUES (3,'Herat','AFG','Herat',186800);
> INSERT INTO `city` VALUES (4,'Mazar-e-Sharif','AFG','Balkh',127800);
> INSERT INTO `city` VALUES (5,'Amsterdam','NLD','Noord-Holland',731200);
> INSERT INTO `city` VALUES (6,'Rotterdam','NLD','Zuid-Holland',593321);
> INSERT INTO `city` VALUES (7,'Haag','NLD','Zuid-Holland',440900);
> INSERT INTO `city` VALUES (8,'Utrecht','NLD','Utrecht',234323);
> INSERT INTO `city` VALUES (9,'Eindhoven','NLD','Noord-Brabant',201843);
> INSERT INTO `city` VALUES (10,'Tilburg','NLD','Noord-Brabant',193238);
> INSERT INTO `city` VALUES (11,'Groningen','NLD','Groningen',172701);
> INSERT INTO `city` VALUES (12,'Breda','NLD','Noord-Brabant',160398);
> INSERT INTO `city` VALUES (13,'Apeldoorn','NLD','Gelderland',153491);
> INSERT INTO `city` VALUES (14,'Nijmegen','NLD','Gelderland',152463);
> INSERT INTO `city` VALUES (15,'Enschede','NLD','Overijssel',149544);
> INSERT INTO `city` VALUES (16,'Haarlem','NLD','Noord-Holland',148772);
> INSERT INTO `city` VALUES (17,'Almere','NLD','Flevoland',142465);
> INSERT INTO `city` VALUES (18,'Arnhem','NLD','Gelderland',138020);
> INSERT INTO `city` VALUES (19,'Zaanstad','NLD','Noord-Holland',135621);
> INSERT INTO `city` VALUES (20,'´s-Hertogenbosch','NLD','Noord-Brabant',129170);
> INSERT INTO `city` VALUES (21,'Amersfoort','NLD','Utrecht',126270);
> INSERT INTO `city` VALUES (22,'Maastricht','NLD','Limburg',122087);
> ```
>
> 可以去MySQL官网地址下载：https://downloads.mysql.com/docs/world-db.zip

### 1. explain的作用

- 表的加载顺序
- sql的查询类型
- sql查询时候用到的索引
- 表与表之间的关系
- 记录被查询的行数

这些都是对应这explain的查询信息

### 2. explain的信息

| 字段          | JSON名称      | 说明                   |
| ------------- | ------------- | ---------------------- |
| id            | select_id     | SELECT标识符           |
| select_type   | 无            | SELECT类型             |
| table         | table_name    | 表名称                 |
| partitions    | partitions    | 匹配的分区             |
| type          | access_type   | join类型               |
| possible_keys | possible_keys | 可供选择的可能的索引   |
| key           | key           | 实际使用的索引         |
| key_len       | key_len       | 实际选择索引的长度     |
| ref           | ref           | 将列与索引进行比较     |
| rows          | rows          | 预估查询的行数         |
| filtered      | filtered      | 按表条件过滤的行百分比 |
| Extra         | 无            | 附加信息               |



下面我们逐一分析explain的查询字段的信息

### 3. id
id表示查询中执行select子句或者操作表的顺序， **id的值越大，代表优先级越高，越先执行** 。大概会有三种情况。


### 4. select_type

| select_type值        | 说明                                                       |
| -------------------- | ---------------------------------------------------------- |
| SIMPLE               | 简单查询(没有使用union或者子查询)                          |
| PRIMARY              | 查询中若包含任何复杂的子部分,最外层的select被标记为PRIMARY |
| UNION                | UNION中的第二个或后面的SELECT语句                          |
| DEPENDENT UNION      | UNION中的第二个或后面的SELECT语句，取决于外面的查询        |
| UNION RESULT         | UNION的结果                                                |
| SUBQUERY             | 子查询中第一个SELECT语句                                   |
| DEPENDENT SUBQUERY   | 第一个SELECT在子查询中，依赖于外部查询                     |
| DERIVED              | 派生表                                                     |
| DEPENDENT DERIVED    | 派生表依赖于另一个表                                       |
| MATERIALIZED         | 物化子查询                                                 |
| UNCACHEABLE SUBQUERY | 无法缓存结果并且必须为外部查询的每一行重新评估的子查询     |
| UNCACHEABLE UNION    | UNION 属于不可缓存子查询的第二个或以后的选择               |

### 5. table
查询的表名，并不一定是真实存在的表，有别名显示别名，也可能为临时表.

### 6. partitions
查询时匹配到的分区信息，对于非分区表值为NULL，当查询的是分区表时，partitions显示分区表命中的分区情况。

### 7. type
查询使用了何种类型,下面的列表描述了查询join类型，从最好到最差的类型：
- system

- const

  表示查询时命中 `primary key` 主键或者 `unique` 唯一索引，或者被连接的部分是一个常量(`const`)值。这类扫描效率极高，返回数据量少，速度非常快。

  ```mysql
  mysql> explain SELECT id FROM city WHERE id = 10;
  +----+-------------+-------+------------+-------+---------------+---------+---------+-------+------+----------+-------------+
  | id | select_type | table | partitions | type  | possible_keys | key     | key_len | ref   | rows | filtered | Extra       |
  +----+-------------+-------+------------+-------+---------------+---------+---------+-------+------+----------+-------------+
  |  1 | SIMPLE      | city  | NULL       | const | PRIMARY       | PRIMARY | 4       | const |    1 |   100.00 | Using index |
  +----+-------------+-------+------------+-------+---------------+---------+---------+-------+------+----------+-------------+
  1 row in set (0.01 sec)
  
  
  ```

- eq_ref

  查询时命中主键`primary key` 或者 `unique key`索引， `type` 就是 `eq_ref`

- ref

  ```mysql
  mysql> explain SELECT `Name`, CountryCode FROM city WHERE  CountryCode = 'NLD' AND `Name`='Haag';
  +----+-------------+-------+------------+------+---------------+-----------+---------+-------------+------+----------+--------------------------+
  | id | select_type | table | partitions | type | possible_keys | key       | key_len | ref         | rows | filtered | Extra                    |
  +----+-------------+-------+------------+------+---------------+-----------+---------+-------------+------+----------+--------------------------+
  |  1 | SIMPLE      | city  | NULL       | ref  | name_code     | name_code | 152     | const,const |    1 |   100.00 | Using where; Using index |
  +----+-------------+-------+------------+------+---------------+-----------+---------+-------------+------+----------+--------------------------+
  1 row in set (0.02 sec)
  ```

- fulltext

- ref_or_null

- index_merge

- unique_subquery

- index_subquery

- range

  使用索引选择行，仅检索给定范围内的行。简单点说就是针对一个有索引的字段，给定范围检索数据。在`where`语句中使用 `bettween...and`、`<`、`>`、`<=`、`in` 等条件查询 `type` 都是 `range` 。

  ```mysql
  mysql> explain SELECT `Name`, CountryCode FROM city WHERE  id IN (1,2);
  +----+-------------+-------+------------+-------+---------------+---------+---------+------+------+----------+-------------+
  | id | select_type | table | partitions | type  | possible_keys | key     | key_len | ref  | rows | filtered | Extra       |
  +----+-------------+-------+------------+-------+---------------+---------+---------+------+------+----------+-------------+
  |  1 | SIMPLE      | city  | NULL       | range | PRIMARY       | PRIMARY | 4       | NULL |    2 |   100.00 | Using where |
  +----+-------------+-------+------------+-------+---------------+---------+---------+------+------+----------+-------------+
  1 row in set (0.05 sec)
  ```

  对只设置了索引的字段，做范围检索 `type` 才是 `range`

  ```mysql
  mysql> explain SELECT `Name`, CountryCode FROM city WHERE  District IN ('A','B');
  +----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
  | id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra       |
  +----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
  |  1 | SIMPLE      | city  | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 4046 |    20.00 | Using where |
  +----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
  1 row in set (0.07 sec)
  ```

- index

  `index`：`Index` 与`ALL` 其实都是读全表，区别在于`index`是遍历索引树读取，而`ALL`是从硬盘中读取

- ALL

### 8. possible_keys
表示在MySQL中通过哪些索引，能让我们在表中找到想要的记录，一旦查询涉及到的某个字段上存在索引，则索引将被列出，但这个索引并不定一会是最终查询数据时所被用到的索引

### 9. key
key是查询中实际使用到的索引，若没有使用索引，显示为NULL

### 10. key_len
表示查询用到的索引长度（字节数），原则上长度越短越好 
- 单列索引，那么需要将整个索引长度算进去
- 多列索引，不是所有列都能用到，需要计算查询中实际用到的列

### 11. ref
常见的有：const，func，null，字段名.
- 当使用常量等值查询，显示const
- 当关联查询时，会显示相应关联表的关联字段
- 如果查询条件使用了表达式、函数，或者条件列发生内部隐式转换，可能显示为func
- 其他情况null

### 12. rows
以表的统计信息和索引使用情况，估算要找到我们所需的记录，需要读取的行数。 这个数据越小越好，在最小的扫描行数找出需要的记录数最好的

### 13. filtered
该filtered列指示按表条件过滤的表行的估计百分比。最大值为100，这意味着没有发生行过滤。从 100 开始减小的值表示过滤量增加。 rows显示估计的检查行数，rows × filtered显示与下表连接的行数。

### 14. Extra
不适合在其他列中显示的信息，Explain 中的很多额外的信息会在 Extra 字段显示  

> 例如:Using where  



参考文档:

- https://dev.mysql.com/doc/refman/8.0/en/explain-output.html
- https://juejin.cn/post/6844904163969630221