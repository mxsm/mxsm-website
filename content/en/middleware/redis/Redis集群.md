---
title: Redis集群
categories:
  - 缓存技术
  - Redis
tags:
  - 缓存技术
  - Redis
abbrlink: 37cf2cfd
date: 2019-03-29 09:57:03
---
### Redis集群的介绍

Redis 集群是一个提供在**多个Redis间节点间共享数据**的程序集。

Redis集群并不支持处理多个keys的命令,因为这需要在不同的节点间移动数据,从而达不到像Redis那样的性能,在高负载的情况下可能会导致不可预料的错误.

Redis 集群通过分区来提供**一定程度的可用性**,在实际环境中当某个节点宕机或者不可达的情况下继续处理命令. Redis 集群的优势:

- 自动分割数据到不同的节点上。
- 整个集群的部分节点失败或者不可达的情况下能够继续处理命令。

### Redis集群数据分片

Redis 集群没有使用一致性hash, 而是引入了 **哈希槽**的概念。

Redis 集群有16384个哈希槽,每个key通过CRC16校验后对16384取模来决定放置哪个槽.集群的每个节点负责一部分hash槽,举个例子,比如当前集群有3个节点,那么:

- 节点 A 包含 0 到 5500号哈希槽.
- 节点 B 包含5501 到 11000 号哈希槽.
- 节点 C 包含11001 到 16384号哈希槽.

这种结构很容易添加或者删除节点. 比如如果我想新添加个节点D, 我需要从节点 A, B, C中得部分槽到D上. 如果我想移除节点A,需要将A中的槽移到B和C节点上,然后将没有任何槽的A节点从集群中移除即可. 由于从一个节点将哈希槽移动到另一个节点并不会停止服务,所以无论添加删除或者改变某个节点的哈希槽的数量都不会造成集群不可用的状态.

整理一下集群数据存放的步骤：

```
1 对key进行CRC16的算法校验获得一个整形
2 对整数进行对16384取模。
3 放入对应的机器上面
```

![集群图解](https://github.com/mxsm/document/blob/master/image/cache/rediscluster.png?raw=true)

- 所有的节点彼此间互联(`PING`-`PONG`机制)，内部使用二进制协议优化传输速度和带宽。
- 节点的`fail`是通过集群中超过半数的节点检测失效时才生效。(集群中超过半数以上的节点对该节点没有回复)
- 客户端与`redis`节点直连,不需要中间`proxy`层.客户端不需要连接集群所有节点,连接集群中任何一个可用节点即可。
- `redis-cluster`把所有的物理节点映射到[`0-16383`]`slot`上,`cluster` 负责维护`node`<->`slot`<->`value`

#### Redis-cluster投票容错：

![图解](https://github.com/mxsm/document/blob/master/image/cache/redisfailcluster.png?raw=true)

**投票的过程原理：** 集群中所有的master参与，如果半数以上的master节点与要被检测的master通讯超时(cluster-node-timeout),认为当前master节点挂了。

**什么时候整个集群不可用？**

- 集群任意master挂掉且当前没有slave.集群进入fail状态。也可以理解为16K哈希筒不完整的情况。
- 如果超过一半以上的master挂掉，不论是否有slave，集群进入fail状态。



### 主从复制

**复制的机制**

- **master和slave正常连接情况下：** master会发送一些列命令流来保持对slave的更新。以便将master自身数据集的改变复制到给slave。
- **master和slave断开之后(网络问题，主从意识连接超时)：** slave重新连接上master并会尝试部分同步。
- **不能进行部分同步的时候，slave会请求全量同步**

#### Redis 复制的非常重要的事实

- master和slave之间使用的异步复制
- master和slave是一个一对多的关系
- slave 可以接受其他 slave 的连接。
- Redis 复制在 master 侧是非阻塞的。
- 复制在 slave 侧大部分也是非阻塞的。
- 复制既可以被用在可伸缩性，以便只读查询可以有多个 slave 进行
- 可以使用复制来避免 master 将全部数据集写入磁盘造成的开销

#### Redis复制的工作原理

1. slave连接master的时候，会使用**PSYNC**命令发送slave纪录的旧的master replication  ID 和 slave至今处理的偏移量。
2. master发送给slave所需的增量部分
3. 如果是master缓冲区没有足够的命令积压或者slave引用了不知道的历史纪录。进行全量同步

#### 全量同步

- master 开启一个后台保存进程，以便于生产一个 RDB 文件，同时它开始缓冲所有从客户端接收到的新的写入命令(产生RDB文件的时候发生客户端的操作，保证数据的一致性问题)
-  master 将数据集文件传输给 slave
- slave接受master发送过来的数据。
- slave载入rdb文件