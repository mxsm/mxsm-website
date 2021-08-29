---
title: Explain执行计划
date: 2021-08-27
weight: 202108272202
---

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
- eq_ref
- ref
- fulltext
- ref_or_null
- index_merge
- unique_subquery
- index_subquery
- range
- index
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