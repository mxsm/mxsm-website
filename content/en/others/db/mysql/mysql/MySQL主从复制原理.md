---
title: MySQL主从复制原理
categories:
  - 数据库
  - MYSQL
  - mysql
tags:
  - 数据库
  - MYSQL
  - mysql
abbrlink: 5e46a137
date: 2018-02-16 15:25:29
---
### 1. MySQL的主从形式

- **一主一从**

  ![图](https://github.com/mxsm/document/blob/master/image/database/%E4%B8%80%E4%B8%BB%E4%B8%80%E4%BB%8E.jpg?raw=true)

  

- **一主多从**

  ![图](https://github.com/mxsm/document/blob/master/image/database/%E4%B8%80%E4%B8%BB%E5%A4%9A%E4%BB%8E.jpg?raw=true)

  一主一从和一主多从是最常见的主从架构，实施起来简单并且有效，不仅可以实现HA，而且还能读写分离，进而提升集群的并发能力。

- **多主一从(5.7开始支持)**

  ![图](https://github.com/mxsm/document/blob/master/image/database/%E5%A4%9A%E4%B8%BB%E4%B8%80%E4%BB%8E.jpg?raw=true)

  多主一从可以将多个mysql数据库备份到一台存储性能比较好的服务器上

- **双主复制**

  ![图](https://github.com/mxsm/document/blob/master/image/database/%E5%8F%8C%E4%B8%BB%E5%A4%8D%E5%88%B6.jpg?raw=true)

  双主复制，也就是互做主从复制，每个master既是master，又是另外一台服务器的slave。这样任何一方所做的变更，都会通过复制应用到另外一方的数据库中。

- **级联复制**

  ![图](https://github.com/mxsm/document/blob/master/image/database/%E7%BA%A7%E8%81%94%E5%A4%8D%E5%88%B6.jpg?raw=true)

  级联复制模式下，部分slave的数据同步不连接主节点，而是连接从节点。因为如果主节点有太多的从节点，就会损耗一部分性能用于replication，其它从节点作为二级或者三级与从节点连接，好处：**缓解主节点的压力，并且对数据一致性没有负面影响。**

### 2. 主从复制的原理

![图](https://github.com/mxsm/document/blob/master/image/database/masterslave%E5%8E%9F%E7%90%86%E5%9B%BE.jpg?raw=true)

- 当从节点连接主节点时，主节点会创建一个log dump 线程，用于发送bin-log的内容。在读取bin-log中的操作时，此线程会对主节点上的bin-log加锁，当读取完成，甚至在发动给从节点之前，锁会被释放。
- 当从节点上执行`start slave`命令之后，从节点会创建一个I/O线程用来连接主节点，请求主库中更新的bin-log。I/O线程接收到主节点binlog dump 进程发来的更新之后，保存在本地relay-log中。(这个线程不会对事件进行轮询。如果该线程追赶上了主库，他将进入睡眠状态，知道主库发送信号量通知其有新的事件产生时才会被唤醒)
- SQL线程负责读取relay log中的内容，解析成具体的操作并执行，最终保证主从数据的一致性。

> 1. 在主库上把数据更改记录到二进制日志(Binary Log)中。
> 2. 备库将主库上的日志复制到自己的中继日志(Relay Log)中
> 3. 备库读取中继日志中的实践，将其重放到备库数据之上