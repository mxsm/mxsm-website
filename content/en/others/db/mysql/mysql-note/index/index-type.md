---
title: 索引的类型
categories:
  - 数据库
  - MYSQL
  - 高性能MySQL读书笔记
  - 索引
tags:
  - 数据库
  - MYSQL
  - 高性能MySQL读书笔记
  - 索引
abbrlink: ea553bd8
date: 2018-07-24 09:26:49
---
**从索引的角度来提高数据库速度**

### 1. 索引的类型

索引的类型多种多样，MySQL索引在**存储层实现**而**不是服务器层实现**。不同的存储引擎索引的工作方式也不一样。

- **B-Tree索引**

  使用**`B-Tre`**e数据结构来存储数据。**`InnoDB`** 则使用的 **`B+Tree`** 来做的实现。**`B-Tree`** 索引的特点：

  - 值都是按顺序存储

    ![图](https://github.com/mxsm/document/blob/master/image/database/%E9%AB%98%E6%80%A7%E8%83%BDMysql%E8%AF%BB%E4%B9%A6%E7%AC%94%E8%AE%B0/%E7%B4%A2%E5%BC%95/BTreeMysql%E5%9B%BE%E8%A7%A3.png?raw=true)

  - 叶子节点指针指向的是被索引的数据(**InnoDB指向的行数据，MyISAM指向的是数据的物理地址**)，而不是其他的叶子节点页

  - B-Tree对索引列是顺序组织存储的。所以适合查找范围的数据(对于Hash索引比较适合精确的查找)

    ```sql
    CREATE TABLE People (
       last_name varchar(50)    not null,
       first_name varchar(50)    not null,
       dob  date  not null,
       gender enum('m', 'f') not null,
       key(last_name, first_name, dob)
    );
    ```

    ![图](https://github.com/mxsm/document/blob/master/image/database/%E9%AB%98%E6%80%A7%E8%83%BDMysql%E8%AF%BB%E4%B9%A6%E7%AC%94%E8%AE%B0/%E7%B4%A2%E5%BC%95/mysqBTree%E7%B4%A2%E5%BC%95%E6%95%B0%E6%8D%AE%E8%AF%B4%E6%98%8E.JPG?raw=true)

    **B-Tree适合全键值、键值范围、键前缀查找，其中键前缀查找只适用于根据最左前缀查找。**

    上述的索引对如下类型查找有效：

    - **全值匹配**

      和索引中所有的列进行匹配

    - **匹配最左前缀**

    - **匹配列前缀**

      比如查找 last_name 为 J开头的  'j%'

    - **匹配范围值**

    - **精确匹配某一列并范围匹配另外一列**

    - **只访问索引的查询--覆盖查询**

    B-Tree索引的限制：

    - **如果不是按照索引的最左端列开始查找，则无法使用索引。**

      也就是必须包含last_name在查询的条件中

    - **不能跳过索引中的列**

      也就是如果包含 last_name 和 date 那只能使用 last_name这个索引

    - **如果查询中有某个列的范围查询，则其右边所有的列都无法使用索引优化查找。**

      ```sql
      where last_name = 'aaaa' and  first_name like 'j%' and job = '2001-02-03'
      ```

      只有前面两个列可以用到索引

    这些索引都和索引的顺序有关。优化的时候需要使用相同的列但是顺序不同的索引来满足不同类型的查询需要。

- **哈希索引**

  hash索引是基于哈希表实现。只有精确匹配索引所有的列查询才有效。

  ```sql
  CREATE TABLE testhash (
     fname VARCHAR(50) NOT NULL,
     lname VARCHAR(50) NOT NULL,
     KEY USING HASH(fname)
  ) ENGINE=MEMORY;
  ```

  假如使用f()哈希函数

  ```
  f('Arjen') = 2323
  
  f('Baron') = 7437
  
  f('Peter') = 8784
  
  f('Vadim') = 2458
  ```

  索引只存储了对应的哈希值，hash索引结构非常紧凑，这让hash索引查找非常快。

  **hash索引使用的限制：**

  - **hash索引只包含哈希值和行指针，而不存储字段值。所以不存在覆盖索引的说法**

  - **hash索引数据并不是按照索引值顺序存储，所以无法用于排序**

  - **hash索引不支持部分索引列匹配查找**

    因为hash索引始终使用的索引的内的全部列进行hash。在数据列（A,B）上建立hash索引，如果只使用A或者B是不能使用索引的。

  - **hash索引只支持等值比较查询，不支持任何范围查询**

    支持 = 、IN()，不支持 where a > 10 

  - **访问hash索引的速度非常快，除非有很大的hash冲突**

  - **如果hash冲突很多的，一些索引维护操作代价也很高**

**B-Tree索引的优点：**

- 索引大大减少了服务器需要扫描的数据数量
- 索引可以帮助服务器避免排序和临时表
- 索引可以将随机I/O变为顺序I/O

> 索引的局限性？
>
> 索引并不总是最好的选择，评判标准：只有当索引帮助存储引擎快速找到纪录的好处大于其他的额外工作的开销(插入重建索引)索引才是有效的。
>
> 对于小表来说，简单的全表扫描更加高效。对于中到大型的表，索引就非常有效。对于特大型表，建立和使用索引的代价随之增长。