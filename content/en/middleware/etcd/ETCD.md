---
title: ETCD
categories:
  - 缓存技术
  - ETCD
tags:
  - 缓存技术
  - ETCD
abbrlink: 4cde6830
date: 2019-06-26 01:15:15
---
### ETCD选举Leader过程

**ETCD集群节点的三个状态：**

- **Leader**
- **follower** — 选举过程中的中间状态
- **candidate**

#### ETCD选举

初始状态下，所有的集群节点都是 **`follower`** ，那么leader怎么选呢？每个 **`follower`** 内部都维护了一个**随机**的 **`timer`** 

![图](https://github.com/mxsm/document/blob/master/image/cache/ETCD/etcd%E9%80%89%E4%B8%BE%E5%88%9D%E5%A7%8B%E8%BF%87%E7%A8%8B.jpg?raw=true)

当 **`Timer`** 到期还没节点主动联系它的话，当前节点改变状态由 **`follower`** 变成 **`candidate`** 同时发出投票请求给其他人。有时候会有特殊情况，由于 **`follower`** 内部维护的 **`Timer`** 是随机的可能出现两个或者多个 **`follower`** 变成 **`candidate`** 的情况如下图：

![图](https://github.com/mxsm/document/blob/master/image/cache/ETCD/etcd%E9%80%89%E4%B8%BE%E6%8A%95%E7%A5%A8%E8%BF%87%E7%A8%8B.jpg?raw=true)

图中 **S1** 和 **S3** 都变成了 **`candidate`** 

```
投票的原则：每个follower一轮只能投一次票给一个candidate，
```

对于相同条件的 **`candidate`** ， **`follower`** 采取**先来先投票的策略**。 如果超过半数的 **`follower`** 都认为其中的某一个做领导，那么这样新的 **`leader`** 就产生了。如下图 **S3** 就变成了领导

![图](https://github.com/mxsm/document/blob/master/image/cache/ETCD/etcd%E5%87%BA%E7%8E%B0%E4%B8%A4%E4%B8%AA%E5%80%99%E9%80%89%E8%80%85%E7%9A%84%E8%A7%A3%E5%86%B3%E8%BF%87%E7%A8%8B.jpg?raw=true)

对于没有选上的 **S1** 只能改变节点的状态由 **`candidate`** 变为 **`follower`** 。

选举完成后通过 **S3** Leader定期发送心跳的方式来重置 **`follower`** 自身维护的 **`Timer`**  不以至于 **`Timer`** 到期转变状态。

![图解](https://github.com/mxsm/document/blob/master/image/cache/ETCD/Etcdleader%E7%9A%84%E7%BB%B4%E6%8C%81%E8%BF%87%E7%A8%8B.jpg?raw=true)

就和上面所说的一样如果 **`follower`** 在 **`Timer`** 过期时间内还没收到 **`Leader`** 的心跳。那么 **`follower`** 开始又要进行下一轮 **`Leader`** 的选举了

![图](https://github.com/mxsm/document/blob/master/image/cache/ETCD/leader%E5%87%BA%E9%97%AE%E9%A2%98%E5%86%8D%E4%B8%80%E6%AC%A1%E9%80%89%E4%B8%BE%E8%BF%87%E7%A8%8B.jpg?raw=true)

**`Raft`** 算法的大致原理就是这样。

#### ETCD选举时候产生的问题

每个follower如果在自身的timer到期之后都会变成candidate去参与选举。所以就这个candidate身份而言，是没有特别条件的，每个follower都有机会参选。但是，在分布式的环境里，每个follower节点存储的数据是不一样的，考虑一下下图的情况，在这些节点经历了一些损坏和恢复。此时S4想当leader。

![图](https://github.com/mxsm/document/blob/master/image/cache/ETCD/%E9%80%89%E4%B8%BE%E8%BF%87%E7%A8%8B%E4%B8%AD%E4%B8%8D%E5%90%88%E9%80%82%E7%9A%84%E5%80%99%E9%80%89%E8%80%85%E5%A4%84%E7%90%86.jpg?raw=true)

