---
title: Mysql InnoDB 锁
date: 2021-03-22
weight: 202103222100
---

> 使用的表结构：
>
> ```sql
> CREATE TABLE `city` (
>   `ID` int NOT NULL AUTO_INCREMENT,
>   `Name` char(35) NOT NULL DEFAULT '',
>   `CountryCode` char(3) NOT NULL DEFAULT '',
>   `District` char(20) NOT NULL DEFAULT '',
>   `Population` int NOT NULL DEFAULT '0',
>   PRIMARY KEY (`ID`),
>   KEY `test` (`Name`,`CountryCode`,`District`,`Population`) USING BTREE
> ) ENGINE=InnoDB AUTO_INCREMENT=4080 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
> ```
>



目录：

- [1. 什么是锁](#1. 什么是锁)
- [2. lock与latch](#2-locklatch)
- [3. InnoDB存储引擎中的锁](#3-innodb)
- [4. 共享锁(S)和排他锁(X)](#4-sx)
- [5. 意向锁(Intention Locks)](#5-intention-locks)
- [6. 行锁(Record Locks)](#6-record-locks)
- [7. 间隙锁(Gap Locks)](#7-gap-locks)
- [8. Next-Key 锁](#8-next-key-)
- [9.插入意向锁](#9)
- [10. AUTO-INC 锁](#10-auto-inc-)



### 1. 什么是锁

锁机制用于管理对共享资源的并发访问，提供数据的完整性和一致性。

### 2. lock与latch
- latch  
  闩锁(轻量级的锁)作用对象是并发线程，要求锁定的时间要非常短。持续时间太长则性能就会非常差。在InnoDb中latch又分为两种：mutex(互斥量)和rwlock（读写锁）。作用用来保证并发线程操作临界资源的正确性(没有死锁的检查机制)
- lock  
  lock作用对象是事务，用来锁定数据库中的对象(表、页、行)并且一般lock的对象仅在事务commit或rollback后进行释放(不同的事务隔离级别释放的时间可能不同)，有死锁的检测机制

区别列表：

|          | lock                                                | latch                  |
| -------- | --------------------------------------------------- | ---------------------- |
| 对象     | 事务                                                | 线程                   |
| 保护     | 数据库内容                                          | 内存数据结构           |
| 持续时间 | 整个事务过程                                        | 临界资源               |
| 模式     | 行锁、表锁、意向锁                                  | 读写锁、互斥量         |
| 死锁     | 通过waits-for graph、time out等机制进行死锁检测处理 | 无死锁的检测与处理机制 |
| 存在于   | Lock Mannager的哈希表中                             | 每个数据结构的对象     |


> latch查看命令：show engine innodb mutex;

### 3. InnoDB存储引擎中的锁
在InnoDB中使用的锁：

- **[共享锁和排他锁(S锁、X锁)](#4. 共享锁(S)和排他锁(X))**
- **[意向锁](#5. 意向锁(Intention Locks))**
- **[行锁](#6. 行锁(Record Locks))**
- **[间隙锁](#7. 间隙锁(Gap Locks))**
- **[Next-Key Locks](#8. Next-Key 锁)**
- **[插入意向锁](#9.插入意向锁)**
- **[AUTO-INC 锁](#10. AUTO-INC 锁)**
- **基于空间索引的锁**

### 4. 共享锁(S)和排他锁(X)

InnoDB实现了两种标准的行级锁，共享锁(也叫：S锁)和排他锁(X锁)

- 共享(S)锁允许持有锁的事务读取一行
- 独占(X)锁允许持有锁的事务更新或删除一行

如果事务T1持有一条记录r的S锁，然后，对来自不同事务T2的行r上的锁的请求进行如下处理：

- T2对S锁的请求可以立即被允许。因此，T1和T2都持有r记录上的S锁。
- T2对S锁的请求不能立刻被允许

下面看一下例子：

![](https://github.com/mxsm/picture/blob/main/mysql/%E8%AF%BB%E5%86%99%E9%94%81.gif?raw=true)

如果事务T1持有行r上的独占(X)锁，则某个不同事务T2对行r上任何一种类型的锁的请求都不能立即被批准。相反，事务T2必须等待事务T1释放该行r上的锁。例子说明：

![](https://github.com/mxsm/picture/blob/main/mysql/%E8%AF%BB%E5%86%99%E9%94%811.gif?raw=true)

### 5. 意向锁(Intention Locks)

InnoDB支持多粒度锁，允许行锁和表锁共存。例如，LOCK TABLES…WRITE接受指定表上的排他锁(X锁)。为了实现多粒度级别的锁，InnoDB使用意向锁。意向锁是表级锁，它指示事务以后对表中的一行需要哪种类型的锁(共享或独占)。有两种类型的意向锁:

- 意图共享锁(IS)表示事务打算在表中的各个行上设置共享锁。( SELECT ... FOR SHARE)
- 意图排他锁(IX)表示事务打算在表中的各个行上设置排他锁。( SELECT ... FOR UPDATE)

意向锁的协议如下：

- 事务在获取表中某一行上的共享锁之前，必须首先获取表上的IS锁或更强的锁
- 在事务获得表中某一行上的独占锁之前，它必须首先获得表上的IX锁。

如果锁与现有锁兼容，则将锁授予请求事务，但如果锁与现有锁冲突，则不会授予该事务。事务等待，直到冲突的现有锁被释放。如果一个锁请求与现有的锁冲突，并且由于可能导致死锁而不能授予，则会发生错误。

|      |  X   |  IX  |  S   |  IS  |
| :--: | :--: | :--: | :--: | :--: |
|  X   | 冲突 | 冲突 | 冲突 | 冲突 |
|  IX  | 冲突 | 兼容 | 冲突 | 兼容 |
|  S   | 冲突 | 冲突 | 兼容 | 兼容 |
|  IS  | 冲突 | 兼容 | 兼容 | 兼容 |

除了全表请求（例如，[`LOCK TABLES ... WRITE`](https://dev.mysql.com/doc/refman/8.0/en/lock-tables.html)）之外，意图锁不会阻止任何内容。意图锁的主要目的是表明有人正在锁定一行，或者打算锁定表中的一行。

### 6. 行锁(Record Locks)

记录锁是对索引记录的锁。例如， `SELECT c1 FROM t WHERE c1 = 10 FOR UPDATE;` 可以防止从插入，更新或删除行，其中的值的任何其它交易`t.c1`是 `10`。

记录锁总是锁定索引记录，即使一个表没有定义索引。对于这种情况， `InnoDB`创建一个隐藏的聚集索引并使用该索引进行记录锁定。

### 7. 间隙锁(Gap Locks)

间隙锁是对索引记录之间的间隙的锁，或者是对第一个索引记录之前或最后一个索引记录之后的间隙的锁。例如，`SELECT c1 FROM t WHERE c1 BETWEEN 10 and 20 FOR UPDATE;`阻止其他事务将 的值插入`15`到列中`t.c1`，无论列 中是否已经存在任何此类值，因为该范围内所有现有值之间的间隙被锁定。

间隙可能跨越单个索引值、多个索引值，甚至是空的。

间隙锁是性能和并发性之间权衡的一部分，用于某些事务隔离级别而不是其他级别。

使用唯一索引锁定行以搜索唯一行的语句不需要间隙锁定。（这不包括搜索条件仅包含多列唯一索引的某些列的情况；在这种情况下，确实会发生间隙锁定。）例如，如果该`id`列具有唯一索引，则以下语句仅使用`id`值为 100的行的索引记录锁定，其他会话是否在前面的间隙中插入行无关紧要：

```sql
SELECT * FROM child WHERE id = 100;
```

如果`id`未编入索引或具有非唯一索引，则该语句会锁定前面的间隙。

这里还值得注意的是，不同的事务可以在间隙上持有冲突的锁。例如，事务 A 可以在间隙上持有共享间隙锁（间隙 S 锁），而事务 B 在同一间隙上持有排他间隙锁（间隙 X 锁）。允许冲突间隙锁的原因是，如果从索引中清除记录，则必须合并不同事务在记录上持有的间隙锁。

间隙锁定`InnoDB`是“纯粹的抑制性”，这意味着它们的唯一目的是防止其他事务插入间隙。间隙锁可以共存。一个事务采用的间隙锁不会阻止另一个事务在同一间隙上采用间隙锁。共享和排他间隙锁之间没有区别。它们彼此不冲突，并且执行相同的功能。

可以明确禁用间隙锁定。如果将事务隔离级别更改为 ，则会发生这种情况 [`READ COMMITTED`](https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html#isolevel_read-committed)。在这种情况下，对搜索和索引扫描禁用间隙锁定，仅用于外键约束检查和重复键检查。

使用[`READ COMMITTED`](https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html#isolevel_read-committed)隔离级别还有其他影响 。在 MySQL 评估`WHERE`条件后释放不匹配行的记录锁。对于 `UPDATE`报表，`InnoDB` 做一个“半一致”读，这样它返回的最新提交版本到MySQL使MySQL能够确定该行是否比赛`WHERE` 的条件[`UPDATE`](https://dev.mysql.com/doc/refman/8.0/en/update.html)。

### 8. Next-Key 锁

next-key 锁是索引记录上的记录锁和索引记录之前的间隙上的间隙锁的组合。

### 9.插入意向锁

插入意图锁是一种由[`INSERT`](https://dev.mysql.com/doc/refman/8.0/en/insert.html)行插入之前的操作设置的间隙锁 。此锁表示插入意图，如果插入同一索引间隙的多个事务未插入间隙内的相同位置，则它们无需相互等待。假设存在值为 4 和 7 的索引记录。 分别尝试插入值 5 和 6 的单独事务，在获得插入行的排他锁之前，每个事务都使用插入意向锁锁定 4 和 7 之间的间隙，但不要相互阻塞，因为行是不冲突的。

以下示例演示了在获取插入记录的排他锁之前采用插入意向锁的事务。该示例涉及两个客户端 A 和 B。

客户端 A 创建一个包含两条索引记录（90 和 102）的表，然后启动一个事务，对 ID 大于 100 的索引记录放置排他锁。 排他锁包括记录 102 之前的间隙锁：

```sql
mysql> CREATE TABLE child (id int(11) NOT NULL, PRIMARY KEY(id)) ENGINE=InnoDB;
mysql> INSERT INTO child (id) values (90),(102);

mysql> START TRANSACTION;
mysql> SELECT * FROM child WHERE id > 100 FOR UPDATE;
+-----+
| id  |
+-----+
| 102 |
+-----+
```

客户端 B 开始一个事务以在间隙中插入一条记录。事务在等待获得排他锁时使用插入意向锁。

```sql
mysql> START TRANSACTION;
mysql> INSERT INTO child (id) VALUES (101);
```

用于插入意图锁定事务数据出现类似于在下面 [`SHOW ENGINE INNODB STATUS`](https://dev.mysql.com/doc/refman/8.0/en/show-engine.html)和 [InnoDB的监视器](https://dev.mysql.com/doc/refman/8.0/en/innodb-standard-monitor.html) 输出：

```sql
RECORD LOCKS space id 31 page no 3 n bits 72 index `PRIMARY` of table `test`.`child`
trx id 8731 lock_mode X locks gap before rec insert intention waiting
Record lock, heap no 3 PHYSICAL RECORD: n_fields 3; compact format; info bits 0
 0: len 4; hex 80000066; asc    f;;
 1: len 6; hex 000000002215; asc     " ;;
 2: len 7; hex 9000000172011c; asc     r  ;;...
```

### 10. AUTO-INC 锁

一个`AUTO-INC`锁是通过交易将与表中取得一个特殊的表级锁 `AUTO_INCREMENT`列。在最简单的情况下，如果一个事务正在向表中插入值，则任何其他事务都必须等待自己插入到该表中，以便第一个事务插入的行接收连续的主键值。