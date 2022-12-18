---
title: RocketMQ源码解析-消费模式消费进度加载源码解析
date: 2021-06-14
weight: 202106102132
---

> 以下源码基于RocketMQ 4.8.0

MQ的消费模式通过之前的分析可以知道有两种：

- 集群消费模式(CLUSTERING)
- 广播消费模式(BROADCASTING)

两种不同类型的消费模式当中有区别，下面通过源码来说明：

### 1. 从何处加载消费进度？

从之前的分析可以知道，Consumer通过调用：

```java
consumer.start();
```

在启动后会加载消费进度 **`DefaultMQPushConsumerImpl#start`** 代码片段：

```java
 if (this.defaultMQPushConsumer.getOffsetStore() != null) {
     this.offsetStore = this.defaultMQPushConsumer.getOffsetStore();
 } else {
     switch (this.defaultMQPushConsumer.getMessageModel()) {
         case BROADCASTING:
             this.offsetStore = new LocalFileOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
             break;
         case CLUSTERING:
             this.offsetStore = new RemoteBrokerOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
             break;
         default:
             break;
     }
     this.defaultMQPushConsumer.setOffsetStore(this.offsetStore);
 }
 this.offsetStore.load();
```

代码可以看出：

- BROADCASTING的消费模式消费进度的持久化由LocalFileOffsetStore实现
- CLUSTERING的消费模式消费进度的持久化由RemoteBrokerOffsetStore实现

两者都实现了 **`OffsetStore`** 接口，该接口提供了例如：加载消费进度、持久化消费进度、更新消费进度等功能：

```java
public interface OffsetStore {
    void load() throws MQClientException;

    void updateOffset(final MessageQueue mq, final long offset, final boolean increaseOnly);

    long readOffset(final MessageQueue mq, final ReadOffsetType type);

    void persistAll(final Set<MessageQueue> mqs);

    void persist(final MessageQueue mq);

    void removeOffset(MessageQueue mq);

    Map<MessageQueue, Long> cloneOffsetTable(String topic);

    void updateConsumeOffsetToBroker(MessageQueue mq, long offset, boolean isOneway) throws RemotingException,
        MQBrokerException, InterruptedException, MQClientException;
}

```

通过上面的分析可以看出来，是通过调用 OffsetStore#load方法来加载消费进度。

**RemoteBrokerOffsetStore#load** 的实现：

```java
public class RemoteBrokerOffsetStore implements OffsetStore {
    private final static InternalLogger log = ClientLogger.getLog();
    private final MQClientInstance mQClientFactory;
    private final String groupName;
    private ConcurrentMap<MessageQueue, AtomicLong> offsetTable =
        new ConcurrentHashMap<MessageQueue, AtomicLong>();

    public RemoteBrokerOffsetStore(MQClientInstance mQClientFactory, String groupName) {
        this.mQClientFactory = mQClientFactory;
        this.groupName = groupName;
    }

    @Override
    public void load() {
        
        //空实现？
        
    }
	//省略部分代码
}
```

> RemoteBrokerOffsetStore发现是空实现，原因是因为集群消费的消费进度保存在Broker端

**LocalFileOffsetStore#load** 实现：

```java
public class LocalFileOffsetStore implements OffsetStore {
    public final static String LOCAL_OFFSET_STORE_DIR = System.getProperty(
        "rocketmq.client.localOffsetStoreDir",
        System.getProperty("user.home") + File.separator + ".rocketmq_offsets");
    private final static InternalLogger log = ClientLogger.getLog();
    private final MQClientInstance mQClientFactory;
    private final String groupName;
    private final String storePath;
    private ConcurrentMap<MessageQueue, AtomicLong> offsetTable =
        new ConcurrentHashMap<MessageQueue, AtomicLong>();

    @Override
    public void load() throws MQClientException {
        OffsetSerializeWrapper offsetSerializeWrapper = this.readLocalOffset();
        if (offsetSerializeWrapper != null && offsetSerializeWrapper.getOffsetTable() != null) {
            offsetTable.putAll(offsetSerializeWrapper.getOffsetTable());

            for (MessageQueue mq : offsetSerializeWrapper.getOffsetTable().keySet()) {
                AtomicLong offset = offsetSerializeWrapper.getOffsetTable().get(mq);
                log.info("load consumer's offset, {} {} {}",
                    this.groupName,
                    mq,
                    offset.get());
            }
        }
    }
    //省略其他代码
}
```

通过 LocalFileOffsetStore#load实现可以看出来，广播消费是在本地加载消费进度，消费进度保存在消费者本地。

