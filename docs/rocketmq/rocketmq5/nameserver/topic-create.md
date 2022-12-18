---
title: 深度解析RocketMQ Topic创建机制
hide_title: false
sidebar_label: 深度解析RocketMQ Topic创建机制
sidebar_position: 202211202240
pagination_label: 深度解析RocketMQ Topic创建机制
description: 深度解析RocketMQ Topic创建机制
---

主题是 Apache RocketMQ 中消息传输和存储的顶层容器，用于标识同一类业务逻辑的消息。 主题的作用主要如下：

- 定义数据的分类隔离： 在 Apache RocketMQ 的方案设计中，建议将不同业务类型的数据拆分到不同的主题中管理，通过主题实现存储的隔离性和订阅隔离性。
- 定义数据的身份和权限： Apache RocketMQ 的消息本身是匿名无身份的，同一分类的消息使用相同的主题来做身份识别和权限管理。

以上是官方给的Topic解释。<br />从日常开发的角度来说Topic就是用来隔离不同业务之间的数据，举个例子：订单业务就可以定义为一个Topic,但是至于是订单新增、删除、状态修改都可以放在订单的Topic里面，对于订单操作等可以用Tag进行过滤区分。

## 1. 创建Topic的方式

![Topic architecture](E:\download\Topic architecture.png)

1. 通过RocketMQ Console的界面进行创建
2. 通过Admin命令进行创建
3. 通过Producer发送消息的时候自动创建(自动创建开关)

## 2.创建Topic的流程

1. 构建Topic的元数据，构建的手段包括RocketMQ console页面、Admin updateTopic命令以及Producer发送信息的自动创建。那么Topic的元数据包含哪些：

```shell
$ bin/mqadmin updateTopic -h

usage: mqadmin updateTopic [-a <arg>] -b <arg> | -c <arg>  [-h] [-n <arg>] [-o <arg>] [-p <arg>] [-r <arg>]
       [-s <arg>] -t <arg> [-u <arg>] [-w <arg>]
 -a,--attributes <arg>       attribute(+a=b,+c=d,-e)
 -b,--brokerAddr <arg>       create topic to which broker
 -c,--clusterName <arg>      create topic to which cluster
 -h,--help                   Print help
 -n,--namesrvAddr <arg>      Name server address list, eg: '192.168.0.1:9876;192.168.0.2:9876'
 -o,--order <arg>            set topic's order(true|false)
 -p,--perm <arg>             set topic's permission(2|4|6), intro[2:W 4:R; 6:RW]
 -r,--readQueueNums <arg>    set read queue nums
 -s,--hasUnitSub <arg>       has unit sub (true|false)
 -t,--topic <arg>            topic name
 -u,--unit <arg>             is unit topic (true|false)
 -w,--writeQueueNums <arg>   set write queue nums
```

2. 将元数据发送给Master Broker， Master Broker对元数据进行持久化
3. Broker Master将数据同步到NameServer进行管理

![Topic create flow](E:\download\Topic create flow.png)

:::tip

RocketMQ Console和Admin Tools底层的实现都是一样的，只是一个是界面另一个是命令行

:::

# 3.自动创建

自动创建首先需要Broker启用配置：

```properties
autoCreateTopicEnable=true
```

自动创建是Producer发送消息到对应的Topic的时候，Topic没有创建。此时发送消息会Broker会自动创建对应的Topic。下面分析一下自动创建流程：

![Automatic Topic create flow](E:\download\Automatic Topic create flow.png)

**本地搜索Topic的信息(DefaultMQProducerImpl#tryToFindTopicPublishInfo)：**

![image-20221120230412992](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221120230412992.png)

如果本地搜索没有对应的Topic的信息，此时首先创建一个空的 **`TopicPublishInfo`** 对象放在本地缓存中。

**从 `NameServer` 获取对应的Topic的信息进行更新。** 然后判断更新后Topic的状态。如果是一个新的Topic这个时候肯定更新也是空的，也就是最终会执行如下的代码：

![image-20221120231050621](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221120231050621.png)

来看一下这个方法 **MQClientInstance#updateTopicRouteInfoFromNameServer** ：

![image-20221120231410939](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221120231410939.png)

if 条件 **`isDefault && defaultMQProducer != null`** 这个是true。上面途中框出来的这段代码就是自动创建Topic的逻辑。这里大家会发现去 **`NameServer`** 查询Topic的信息并不是我们创建的Topic信息，那么这个Topic是什么？ 进入代码 **`defaultMQProducer.getCreateTopicKey()`** 进行查看。参看源码发现是使用了一个叫 **`TBW102`** 的Topic。

**更新本地Topic的信息:**

![image-20221120232110411](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221120232110411.png)

也就是说将 **`TBW102`** Topic的元数据信息更新到了我们需要创建的Topic里面。

:::caution

**`TBW102`**作为自动创建Topic的元数据，将RocketMQ内置的**`TBW102`** 的属性复制给使用者需要创建的Topic。 

自动创建的Topic的核心：复制**`TBW102`** 的属性为已用。

:::

携带

## 4.预先创建

## 5.官方推荐创建方式

## 6.总结