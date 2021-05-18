---
title: MySQL几种索引的区别
date: 2019-07-13
---
### 主键和唯一索引的区别

- 主键是一种约束，唯一索引是一种索引。
- 主键创建后一定包含一个唯一索引，唯一索引并不一定就是主键
- 主键不能为空，唯一索引可以为空
- 主键可以被其他表引用为外键，而唯一索引不能
- 一张表只能创建一个主键，但是可以创建多个唯一索引

**总结一下就是：主键包含唯一索引的功能，但是还有部分增强**

#### 聚集索引和非聚集索引的区别

- **聚集索引**

  ```
  数据行的物理顺序与列值（一般是主键的那一列）的逻辑顺序相同，一个表中只能拥有一个聚集索引
  ```

- **非聚集索引**

  ```
  该索引中索引的逻辑顺序与磁盘上行的物理存储顺序不同，一个表中可以拥有多个非聚集索引
  ```

  
