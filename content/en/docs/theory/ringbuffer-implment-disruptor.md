---
title: "Disruptor-高性能队列"
linkTitle: "Disruptor-高性能队列"
date: 2022-05-28
weight: 202205281022
---

笔者在之前的文章中介绍过 **`RingBuffer`** 的一些理论知识和自己动手实现了一个简单的 **`RingBuffer`** 。而 [**`Disruptor`**](https://github.com/LMAX-Exchange/disruptor) 就实现了一个高性能的 RingBuffer。下面对这个项目进行分析和一些简单的使用。用来解决笔者写的一个分布式ID生成器 [**rain**](https://github.com/mxsm/rain) 中雪花算法利用RingBuffer的缓存问题免得自己造轮子。

### 1. 背景

Disruptor是英国外汇交易公司LMAX开发的一个高性能队列，研发的初衷是解决内存队列的延迟问题（在性能测试中发现竟然与I/O操作处于同样的数量级）。基于Disruptor开发的系统单线程能支撑每秒600万订单，2010年在QCon演讲后，获得了业界关注。2011年，企业应用软件专家Martin Fowler专门撰写长文介绍。同年它还获得了Oracle官方的Duke大奖。

目前包括有Apache Storm、Camel、Log4j2在内的多个知名的项目使用了Disruptor，这也同时说明了Disruptor的高可用和高质量。

### 2. Disruptor介绍

Disruptor 是一个提供并发环形缓冲区数据结构的库。它旨在在异步事件处理架构中提供低延迟、高吞吐量的工作队列。**`本质上还是一个队列`** 

#### 2.1 核心概念

- **Ring Buffer**：Ring Buffer 通常被认为是 Disruptor 的主要方面。但是，从 3.0 开始，Ring Buffer 只负责存储和更新`Event`通过 Disruptor 的数据。对于一些高级用例，它甚至可以完全由用户替换。
- **Sequence**：Disruptor 使用`Sequence`s 作为识别特定组件在哪里的一种手段。每个消费者（事件处理器）`Sequence`都像 Disruptor 本身一样维护一个。大多数并发代码依赖于这些序列值的移动，因此`Sequence`支持许多当前的特性`AtomicLong`。事实上，两者之间唯一真正的区别是`Sequence`包含额外的功能来防止`Sequence`s 和其他值之间的错误共享。
- **Sequencer**：Sequencer 是 Disruptor 的真正核心。该接口的两种实现（单生产者、多生产者）实现了所有并发算法，以在生产者和消费者之间快速、正确地传递数据。
- **Sequence Barrier**：Sequencer 生成一个 Sequence Barrier，其中包含对`Sequence`从 Sequencer 发布的 main 和`Sequence`任何依赖消费者的 s 的引用。它包含确定是否有任何事件可供消费者处理的逻辑。
- **Wait Strategy**：等待策略决定了消费者将如何等待生产者将事件放入 Disruptor。有关可选无锁的部分提供了更多详细信息。
- **Event**：从生产者传递给消费者的数据单位。事件没有特定的代码表示，因为它完全由用户定义。
- **Event Processor**：用于处理来自 Disruptor 的事件的主事件循环，并拥有消费者序列的所有权。有一个称为 BatchEventProcessor 的表示，它包含事件循环的有效实现，并将回调到 EventHandler 接口的使用提供的实现。
- **Event Handler**：由用户实现的接口，代表 Disruptor 的消费者。
- **Producer**：这是调用 Disruptor 入队`Event`的用户代码。这个概念在代码中也没有表示。

示意图如下：

![disruptor-models](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/disruptor-models.png)

### 3. 示例

maven依赖引入：

```xml
<dependency>
  <groupId>com.lmax</groupId>
  <artifactId>disruptor</artifactId>
  <version>4.0.0.RC1</version>
</dependency>
```

#### 3.1 消费和生产

```java
/**
 * @author mxsm
 * @date 2022/5/28 10:58
 * @Since 1.0.0
 */
public class UidEvent {

    private long value;

    public void set(long value) {
        this.value = value;
    }
}
```

然后构造一个EventFactory：

```java
/**
 * @author mxsm
 * @date 2022/5/28 11:00
 * @Since 1.0.0
 */
public class UidEventFactory implements EventFactory<UidEvent> {

    @Override
    public UidEvent newInstance() {
        return new UidEvent();
    }
}

```

定义一个消息处理器：

```java
/**
 * @author mxsm
 * @date 2022/5/28 14:55
 * @Since 1.0.0
 */
public class UidEventHandler implements EventHandler<UidEvent> {

    @Override
    public void onEvent(UidEvent event, long sequence, boolean endOfBatch) {
        System.out.println(event.getValue());
    }
}
```

编写一个启动类：

```java
public class UidEventMain {
    public static void main(String[] args) throws Exception
    {
        int bufferSize = 1024;

        Disruptor<UidEvent> disruptor =
            new Disruptor<>(UidEvent::new, bufferSize, DaemonThreadFactory.INSTANCE);

        disruptor.handleEventsWith(new UidEventHandler());
        disruptor.start();


        RingBuffer<UidEvent> ringBuffer = disruptor.getRingBuffer();
        ByteBuffer bb = ByteBuffer.allocate(8);
        for (long l = 0; ; l++)
        {
            bb.putLong(0, l);
            ringBuffer.publishEvent((event, sequence, buffer) -> event.set(buffer.getLong(0)), bb);
            Thread.sleep(1000);
        }
    }
}
```

运行结果：

![disruptor-test](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/disruptor-test.gif)

### 3. disruptor性能测试

多生产者和单生产者的性能对比(图片来自官网)：

![image-20220528150517075](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220528150517075.png)

在官网还对比了**java.util.concurrent.ArrayBlockingQueue** 和 **Disruptor** 的性能。 生产者和消费模式如下图（图来自官网）：

![image-20220528151059964](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220528151059964.png)



两者对比图：

![image-20220528151227252](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220528151227252.png)

从上图可以看出来**Disruptor** 的性能比 **ABQ** 高出一个数量级。

延迟表现：

![image-20220528151450918](https://raw.githubusercontent.com/mxsm/picture/main/docs/theory/image-20220528151450918.png)

从官网和使用了**Disruptor** 的项目都提供了很大的性能提升。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！

参考文档：

- https://lmax-exchange.github.io/disruptor/user-guide/index.html
- https://logging.apache.org/log4j/2.x/manual/async.html
- https://lmax-exchange.github.io/disruptor/disruptor.html
- https://lmax-exchange.github.io/disruptor/
