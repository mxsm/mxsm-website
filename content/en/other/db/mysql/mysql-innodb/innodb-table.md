---
title: InnoDB表
date: 2021-03-22
weight: 202103222059
---

### 1. 索引组织表
在InnoDB存储引擎中，表都是根据主键顺序组织存放的，这种方式的表称为索引组织表。索引在InnoDB中每张表都有主键，如果没有显式的定义主键，InnoDB会按照如下的方式选择或创建主键：
- 判断是否有非空的唯一索引，有该列就是为主键  
  主键根据的是定义索引的顺序，而不是建表时候字段的顺序。
- 不满足上述条件，InnoDB自动创建一个6字节大小的指针。

> 说明: _rowid可以显示表的主键，这只是对单列的主键有效，对于多列组成主键就无效了。

### 2. InnoDB逻辑存储结构
从逻辑结构来看所有的逻辑都被存放在一个空间中，称为表空间(tablespace)。表空间由如下组成：
- 段(segment)
- 区(extent)
- 页(page)或者称为块(block)

![组成图示](https://github.com/mxsm/picture/blob/main/mysql/innodbtablestruct.png?raw=true)

#### 2.1 表空间
表空间可以看做为InnoDB存储引擎逻辑结构的最高层，所有的数据都放在表空间中。
#### 2.2 段
段的分类：
- 数据段
- 索引段
- 回滚段

由于InnoDB存储引擎表是索引组织的，因此数据即索引，索引即数据。那么数据段即为B+树的叶子节点，索引段即为B+树的非叶子节点。

#### 2.3 区
区是由联想页组成的空间。在任何情况下每个去的掉线都是1M。为了保证区中页的连续性，InnoDB存储引擎一次从磁盘申请多个区。默认情况下页的大小为16K,一个区就有64个连续的页。
> 页可以通过KEY_BLOCK_SIZE来设置大小

#### 2.4 页
页是InnoDB磁盘管理的最小单位，默认每个也的大小为16KB。页的常见类型：
- 数据页
- undo页
- 系统页
- 事务数据页
- 插入缓冲位图页
- 插入缓冲空闲列表页
- 未压缩的二进制大对象页
- 压缩的二进制大对象页

#### 2.5 行
InnoDB存储引擎是面向列，也就是数据是按行进行存放。每个页存放的行记录也是有硬性定义的，最多允许存放16K/2-200行的记录。

![图](https://github.com/mxsm/picture/blob/main/mysql/%E6%9F%A5%E7%9C%8B%E8%A1%A8%E7%9A%84%E7%8A%B6%E6%80%81.png?raw=true)