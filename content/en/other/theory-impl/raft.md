---
title: "分布式一致性算法Raft-理论篇"
linkTitle: "分布式一致性算法Raft-理论篇"
date: 2022-07-29
weight: 202207292213
---

### 1. 什么是Raft？

[Raft](https://raft.github.io/)其实是一种分布式一致性算法(分布式共识算法)。核心还是和Paxos差不多但是更加便于理解和实现，Raft算法模块化的拆分以及相比Paxos更加简化的设计。实现Raft协议更加的简单，理解Raft算法也更加的容易(这一点可以参照[Raft算法的论文](https://raft.github.io/raft.pdf)给出来的报告)。主要拆分成了多个模块：

- **领导人选举(Leader selection)：** Raft集群启动，或者当存在的Leader节点发生故障，触发 `Leader selection` 。选举出来新的Leader
- **日志复制(Log replication)：** Leader必须从客户端接收日志条目(Log entry),然后复制的其他的节点。同时强制要求其他节点日志必须和Leader日志一致
- **MemberShip变更：** 在不停机整个Raft集群的情况做到变更集群的配置，替换宕机的机器或者改变复制集群。
- **Snapshot：** 快照功能是为了实现日志的压缩

#### 1.1 强Leader

1. 系统中必须存在且同一时刻只能有一个 leader，只有 leader 可以接受 clients 发过来的请求（读写请求，可优化）
2. Leader负责主动和所有的Follower进行通讯，负责分发Log Entry给Follower，同时统计Follower返回的ACK。
3. Leader通过向所有的Follower发送heartbeat维持Leader的地位

![Strong Leader](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/Strong%20Leader.png)

#### 1.2 复制状态机

一致性算法是从复制状态机的背景下提出的：

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE1.png)


1. Client向Leader发送append Log entry请求
2. Leader先写本地Log,然后将Log复制到所有的Follower
3. Leader收到多数Follower的应答(大于1/2),然后将Log entry对应的操作应用到状态机
4. Client收到Leader处理log entry结果

### 2.Raft的基本概念

#### 2.1Raft的三种角色以及角色相互变动

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE4.png)




将上面的图转换一下：

![Raft role change](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/Raft%20role%20change.png)

1. Follower：完全被动，不能发送任何请求，只接受并响应来自 leader 和 candidate 的 message，每个节点启动后的初始状态一定是 follower。**具体实现不一定要是Follower,可以是Candidate这个看具体情况。**
2. Leader：处理所有来自Client请求，以及复制 log 到所有 followers。正常情况下所有的读写请求都经过Leader,但是这样会导致Leader的压力很大。同样这里也有优化的空间
3. Candidate：用来竞选一个新 leader （candidate 由 follower 触发超时而来）

> 服务器状态。跟随者只响应来自其他服务器的请求。如果跟随者接收不到消息，那么他就会变成候选人并发起一次选举。获得集群中大多数选票的候选人将成为领导人。在一个任期内，领导人一直都会是领导人，直到自己宕机了。

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE5.png)


- Raft 把时间分割成任意长度的**任期（Term）**, 任期值按时间轴单调递增
- 每一个任期的开始都是 leader 选举，选举成功之后，leader 在任期内管理整个集群。也就是 **election+normal operation**
- 每个任期最多一个Leader,也有可能没有Leader,如上图的 **Term t3**

#### 2.2 服务节点状态

**所有服务节点的持久性状态 (在响应 RPC 请求之前，已经更新到了稳定的存储设备)：**

| 参数            | 解释                                                         |
| --------------- | ------------------------------------------------------------ |
| **currentTerm** | 服务器已知最新的任期（在服务器首次启动时初始化为0，单调递增） |
| **votedFor**    | 当前任期内收到选票的 candidateId，如果没有投给任何候选人 则为空 |
| **log[]**       | 日志条目；每个条目包含了用于状态机的命令，以及领导人接收到该条目时的任期（初始索引为1） |

**所有服务节点的易失性状态：**

| 参数        | 解释                                                         |
| ----------- | ------------------------------------------------------------ |
| commitIndex | 已知已提交的最高的日志条目的索引（初始值为0，单调递增）      |
| lastApplied | 已经被应用到状态机的最高的日志条目的索引（初始值为0，单调递增） |

**Leader上的易失性状态 (选举后已经重新初始化)：**

| 参数         | 解释                                                         |
| ------------ | ------------------------------------------------------------ |
| nextIndex[]  | 对于每一台服务器，发送到该服务器的下一个日志条目的索引（初始值为领导人最后的日志条目的索引+1） |
| matchIndex[] | 对于每一台服务器，已知的已经复制到该服务器的最高日志条目的索引（初始值为0，单调递增） |

#### 2.3 Raft中三类RPC

**RequestVote RPC(选举投票)：** 由Candidate发出的用于选举投票Leader的RPC请求

**AppendEntries RPC(追加Log Entry)：** 由领导人调用，用于日志追加。**同时也可以当做心跳使用**。

**InstallSnapshot RPC（安装快照）：** 安装快照的新的 RPC 来发送快照给太落后的跟随者，由Leader发出。

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE2.png)

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE13.png)




#### 2.4 Raft算法特性总结

| 特性             | 解释                                                         |
| ---------------- | ------------------------------------------------------------ |
| 选举安全特性     | 对于一个给定的任期号，最多只会有一个领导人被选举出来         |
| 领导人只附加原则 | 领导人绝对不会删除或者覆盖自己的日志，只会增加               |
| 日志匹配原则     | 如果两个日志在某一相同索引位置日志条目的任期号相同，那么我们就认为这两个日志从头到该索引位置之间的内容完全一致 |
| 领导人完全特性   | 如果某个日志条目在某个任期号中已经被提交，那么这个条目必然出现在更大任期号的所有领导人中 |
| 状态机安全特性   | 如果某一服务器已将给定索引位置的日志条目应用至其状态机中，则其他任何服务器在该索引位置不会应用不同的日志条目 |

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE3.png)




**说明：Raft 在任何时候都保证以上的各个特性**

#### 2.5 安全性说明

- #### **选举限制**

  - 选举的时候新的Leader拥有所有之前任期中已经提交的日志条目,也就是说如果前任Leader接收到日志请求后发生宕机，当前日志还没来得及通过PRC同步到Follower的情况下，整个Raft集群再次重新发起选举的时候。选举出来的Leader就是之前的Leader。因为之前的Leader包含了已经提交的全部日志条目。
  - Raft 通过比较两份日志中最后一条日志条目的索引值和任期号定义谁的日志比较新。如果两份日志最后的条目的任期号不同，那么任期号大的日志更加新。如果两份日志最后的条目任期号相同，那么日志比较长(last index更大)的那个就更加新。

- #### 提交之前任期内的日志条目

  一条已经被存储到大多数节点上的老日志条目，也依然有可能会被未来的领导人覆盖掉。Raft 永远不会通过计算副本数目的方式去提交一个之前任期内的日志条目。只有领导人当前任期里的日志条目通过计算副本数目可以被提交；

  ![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE8.png)


  如图的时间序列展示了为什么领导人无法决定对老任期号的日志条目进行提交。在 (a) 中，S1 是领导人，部分的(跟随者)复制了索引位置 2 的日志条目。在 (b) 中，S1 崩溃了，然后 S5 在任期 3 里通过 S3、S4 和自己的选票赢得选举，然后从客户端接收了一条不一样的日志条目放在了索引 2 处。然后到 (c)，S5 又崩溃了；S1 重新启动，选举成功，开始复制日志。在这时，来自任期 2 的那条日志已经被复制到了集群中的大多数机器上，但是还没有被提交。如果 S1 在 (d) 中又崩溃了，S5 可以重新被选举成功（通过来自 S2，S3 和 S4 的选票），然后覆盖了他们在索引 2 处的日志。反之，如果在崩溃之前，S1 把自己主导的新任期里产生的日志条目复制到了大多数机器上，就如 (e) 中那样，那么在后面任期里面这些新的日志条目就会被提交（因为 S5 就不可能选举成功）。 这样在同一时刻就同时保证了，之前的所有老的日志条目就会被提交。

### 3. Raft功能

#### 3.1 领导人选举（Leader election）

- **触发时机：** Raft服务集群启动、Follower没有定时收到Leader heartbeat、Candidate选举超时都会触发。也就是**选举超时**触发

- **随机选举超时时间：** Raft 算法使用随机选举超时时间的方法来确保很少会发生选票瓜分的情况，就算发生也能很快的解决。为了阻止选票起初就被瓜分，选举超时时间是从一个固定的区间（例如 150-300 毫秒）随机选择。

- **选举流程：**

  - Follower ---> Candidate（选举超时）
    - Candidate--->Leader：当前节点赢得选举
    - Candidate--->Follower：非赢得选举节点的Candidate节点
    - 选举Term内Candidate没有改变Candidate--->Candidate：没有任何一个Candidate节点赢得选举重新开始下一轮任期的选举

  ![选举流程](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/%E9%80%89%E4%B8%BE%E6%B5%81%E7%A8%8B.png)

- **选举的操作：**

  - 任期(Term)增加1
  - 发送RequestVote RPC请求给Candidate

- **Leader选取原则：**

  - 针对同一个Term,Candidate赢得了多数选举(大于节点1/2)
  - Leader Term 不小于Candidate Term, Candidate承认Leader,角色转换为Follower
  - 在选举的时候选择已提交Log Entry最多的Candidate
  - 在选举中Leader拥有最完整的Log Entry记录

- **安全性：**

  一个 term，最多选出一个 leader，可以没 leader，下一个 term 再选

  <img src="https://raw.githubusercontent.com/mxsm/picture/main/others/theory/Raft%E9%80%89%E4%B8%BE.png" alt="Raft选举"  />

  当一个集群中的节点是偶数个的时候，就有可能在某一轮选举投票过程中不能选举出Leader,因为可能会出现两个节点获得的投票一样。导致重新开始选举。如果没有特殊方式限制，理论上存在每次都出现投票获得情况一样。而奇数节点就能大大减少这种情况。

- 影响选举成功的时参数

  - RTT(Round Trip Time)：网络延时
  - Heartbeat timeout：心跳间隔,目的是让 leader 能够持续发送心跳来阻止 followers 触发选举
  - Election timeout：Leader 与 followers 间通信超时触发选举的时间。Leader和Follower之间网络发生故障
  - MTBF(Meantime Between Failure)：Servers 连续常规故障时间间隔， **`RTT << Heartbeat timeout < Election timeout(ET) << MTBF`**
  - 随机选主触发时间：150-300 毫秒选取。

#### 3.2 日志复制

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/Log%20replication.png)




Leader被选出后负责处理Client的请求， Append Log Entry请求只能通过Leader进行复制转发到Follower。

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE6.png)




**日志格式：** **`logIndex+Term+log body`** ，条日志至少包含三个类型的的数据。**`logIndex+Term`** 确定一条日志。

**Log Replication 特点：**

- 连续性，日志不允许出现断层。都是自然数递增的情况，例如：1、2、3......n。

- 日志特性

  - 如果在不同的日志中的两个条目拥有相同的索引和任期号，那么他们存储了相同的日志
  - 如果在不同的日志中的两个条目拥有相同的索引和任期号，那么他们之前的所有日志条目也全部相同
  - Leader上面的日志一定是有效的(强领导特性)，Follower的日志是否有效需要和Leader进行对比

- Follower日志恢复

  Follower从对比Leader的lastIndex来判断Follower是否需要从Leader复制Log填充，或者truncate Follower 多余的日志。

#### 3.3 Committed Index

- Committed Index`(TermId, LogIndex)`：本质上Log Index一样。都是Log的索引但是指向位置不同。
  - Leader接收日志，先保存到Leader本地持久化。然后复制分发给Follower
  - 日志复制到Followers后，先持久化，并不能马上应用到状态机
  - Leader收到大多数(大于1/2)Follower的返回的时候，Committed Index才能应用到状态机

- Committed Index推进
  - Leader Committed Index推进：根据Leader分发日志Leader收到大多数(大于1/2)Follower的返回的时候，Committed Index才能应用到状态机
  - Follower Committed Index推进：Leader在下一个Append Entry或者 send Heartbeat的时候携带Leader当前Committed Index。然后Follower根据Leader 发送过来的Committed Index。把小于等于Committed Index日志应用到Follower状态机中

#### 3.3 日志压缩(Log Snapshot)

Raft 的日志在正常操作中不断地增长，但是在实际的系统中，日志不能无限制地增长。随着日志不断增长，他会占用越来越多的空间，花费越来越多的时间来重置。如果没有一定的机制去清除日志里积累的陈旧的信息，那么会带来可用性问题。

**Snapshot** 是最简单压缩方法。整个系统的状态都以快照的形式写入到稳定的持久化存储中，然后到那个时间点之前的日志全部丢弃。

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE12.png)




 Raft 中快照的基础思想。每个服务器独立地创建快照，只包括已经被提交的日志。主要的工作包括将状态机的状态写入到快照中。Raft 也包含一些少量的元数据到快照中：**最后被包含索引**指的是被快照取代的最后的条目在日志中的索引值（状态机最后应用的日志），**最后被包含的任期**指的是该条目的任期号。保留这些数据是为了支持快照后紧接着的第一个条目的附加日志请求时的一致性检查，因为这个条目需要前一日志条目的索引值和任期号。

快照中包含的元数据：

| 参数              | 解释                             |
| ----------------- | -------------------------------- |
| lastIncludedIndex | 快照中包含的最后日志条目的索引值 |
| lastIncludedTerm  | 快照中包含的最后日志条目的任期号 |

**Install Snapshot（安装快照）RPC：**

由Leader以将快照的分块发送给跟随者。领导人总是按顺序发送分块。

| 参数              | 解释                                |
| ----------------- | ----------------------------------- |
| term              | 领导人的任期号                      |
| leaderId          | 领导人的 ID，以便于跟随者重定向请求 |
| lastIncludedIndex | 快照中包含的最后日志条目的索引值    |
| lastIncludedTerm  | 快照中包含的最后日志条目的任期号    |
| offset            | 分块在快照中的字节偏移量            |
| data[]            | 从偏移量开始的快照分块的原始字节    |
| done              | 如果这是最后一个分块则为 true       |

| 结果 | 解释                                          |
| ---- | --------------------------------------------- |
| term | 当前任期号（currentTerm），便于领导人更新自己 |

**接收者实现**：

1. 如果`term < currentTerm`就立即回复
2. 如果是第一个分块（offset 为 0）就创建一个新的快照
3. 在指定偏移量写入数据
4. 如果 done 是 false，则继续等待更多的数据
5. 保存快照文件，丢弃具有较小索引的任何现有或部分快照
6. 如果现存的日志条目与快照中最后包含的日志条目具有相同的索引值和任期号，则保留其后的日志条目并进行回复
7. 丢弃整个日志
8. 使用快照重置状态机（并加载快照的集群配置）

### 4. Raft集群成员变化

- **成员何时变化**
  - 替换宕机的机器
  - 增加集群机器(扩容)
  - 改变复制级别
- **解决方法**
  - 重启整个Raft集群
  - 实现动态成员关系变化

首先任何集群中的Raft服务直接从旧的配置直接转换到新的配置的方案都是不安全的，不可能做到原子转换所有的集群服务。所以在转换期间整个集群存在划分成两个独立的大多数群体的可能性，需要在保证 **`安全性`** 的前提下完成：**不能在同一 `term` 有多个 `leader`，否则可能存在 `term` 和 `index` 相同但内容不同的 `log entry`。**

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE10.png)



> 集群服务从 3变成了 5 。不幸的是，存在这样的一个时间点，两个不同的领导人在同一个任期里都可以被选举成功。一个是通过旧的配置，一个通过新的配置。

Raft给出的解决方案是：Raft集群先切换到一个过度的配置也叫共同一致（*joint consensus*)，共同一致是新老配置的结合。一旦共同一致已经被提交，那么系统就切换新的配置。

- 日志条目被复制给集群中新、老配置的所有服务。
- 新、旧配置的服务都可以成为领导人。
- 达成一致（针对选举和提交）需要分别在两种配置上获得大多数的支持。

**好处：不影响安全的情况下，集群配置转换的过程依然可以响应客户端请求。**

![](https://raw.githubusercontent.com/mxsm/picture/main/others/theory/raft-%E5%9B%BE11.png)



### 5. Raft的优化

- **Log batch Append：** 日志批量添加，增加Raft的写入速度
- **ReadIndex/Lease Read：** 允许Follower提供读

后续会通过 [DLedger](https://github.com/openmessaging/dledger)项目进行分析，这个项目首先比较简单整体实现起来比较清晰。同时代码量也不是很多理解更加容易。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢
>

参考资料：

- https://raft.github.io/raft.pdf

- https://github.com/maemual/raft-zh_cn/blob/master/raft-zh_cn.md
- https://www.sofastack.tech/projects/sofa-jraft/consistency-raft-jraft/
- https://raft.github.io/
- https://raft.github.io/slides/raftuserstudy2013.p
- https://github.com/openmessaging/dledger

我正在参与掘金技术社区创作者签约计划招募活动，[点击链接报名投稿](https://juejin.cn/post/7112770927082864653)。
