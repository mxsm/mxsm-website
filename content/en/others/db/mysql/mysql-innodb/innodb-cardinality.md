---
title: "mysql引擎InnoDB索引中的cardinality关键字"
linkTitle: "mysql引擎InnoDB索引中的cardinality关键字"
weight: 5
date: 2021-02-25 20:43:00
---

### 什么是Cardinality
cardinality用来统计字段的可选择性。例如：  
类似于姓名字段，表中都不相同的，属于高选择性，适用于添加索引  
类似于性别字段，只有男，女的，属于低选择性，则不适用于添加索引
> 在一定基数下重复少的字段选择性就高，重复数多选择性就低。

### InnoDB存储引擎Cardinality统计
cardinality值消耗是非常大的，InnoDB一般选择在下边两种情况更新cardinality信息：
- 表中数据1/16数据发生变化
- stat_modified_counter>2,000,000,000  

第一种策略为自从上次统计Cardinality信息后，表中1/16的数据已经发生过变化，这个时候需要更新Cardinality信息。  
第二种策略考虑的是，如果对表中某一行数据频繁的进行更新操作，这时表中的数据并没增加，实际发生变化的还是这一行数据。  
InnoDB通过采样的方法，默认InnoDB存储引擎对8个叶子节点( Leaf Page)进行采用。采样的过程如下：
- 取得B+树索引中叶子节点的数量,记为A。
- 随机取得B+树索引中的8个叶子节点。统计每个页不同记录的个数,即为P1,P2,...,P8。
- 根据采样信息给出 Cardinality的预估值: Cardinality=(P1+P2+…+P8)*A/8。


### 怎么查看Cardinality
访问infomation_schema架构下的表tables和statistics时以及执行下面SQL
```sql
show index from 表名;
show table status;
analyze table 表名;
```
会导致InnoDB存储引擎去重新计算索引的Cardinality值。

> 注意：表中的数据量非常大，并且表中存在多个辅助索引的时候，执行上述操作可能会很慢。

![](https://github.com/mxsm/picture/blob/main/mysql/showindexfrom.png?raw=true)

### 添加索引的策略

Cardinality表示的是某个字段的选择性的高低，数值越大选择性越高，数值越小选择性越低。根据建立索引的原理，我们应该尽量选择选择性越高的列(或者组合列)进行索引的建立。

公式： Cardinality/总的数据行数和1做对比，越接近于1越适合建立索引。