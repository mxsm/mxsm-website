---
title: "Rocketmq消息结构"
linkTitle: "Rocketmq消息结构"
sidebar_position: 202301202119
---

## 1. Message

```java jxs title="Message"
public class Message implements Serializable {
    private static final long serialVersionUID = 8445773977080406428L;

    private String topic;
    private int flag;
    private Map<String, String> properties;
    private byte[] body;
    private String transactionId;

}
```

发送一个MQ的消息包含了哪些数据，这个必须知道.

1. 主题(topic): 用来标记这个消息属于那个topic,这个也是必须要的。主题和消息是1对多的关系。
2. 消息体(body): 消息内容，来承载消息的具体数据
3. flag标记位
4. transactionId是用于发送事务消息存储事务消息ID
5. 其他的属性存放在properties中，这里包含Message ID等一些其他的属性都可以存放在这里。

## 2. Message ID生成

Message在发送到Broker之前会在客户端生产者创建一个Message ID然后发送到Broker, Broker在保存到本地的时候也会床架一个Message ID 同时会在发送成功后返回给到客户端。

### 2.1 客户端生成MessageID的时机和机制

生产者发送消息的基本流程：
![生产者发送消息的基本流程](https://raw.githubusercontent.com/mxsm/picture/main/rocketmq5/client/producer%E7%94%9F%E4%BA%A7%E8%80%85%E5%8F%91%E9%80%81%E6%B6%88%E6%81%AF%E7%9A%84%E5%9F%BA%E6%9C%AC%E6%B5%81%E7%A8%8B.png)

#### 2.1.1 客户端生产MessageID时机

客户端生成MessageId需要分为两种来说：

- 单个消息生成MessageId时机
- 批量消息生成MessageId的时机

对于单个消息生成MessageID是在DefaultMQProducerImpl#sendKernelImpl方法中生成

```java jxs title="DefaultMQProducerImpl"
if (!(msg instanceof MessageBatch)) {
   MessageClientIDSetter.setUniqID(msg);
}

```

而批量消息是在调用批量消息发送方法的时候就把批量消息的MessageID已经保存了DefaultMQProducer#send

```java jxs title="DefaultMQProducer"
    @Override
    public SendResult send(
        Collection<Message> msgs) throws MQClientException, RemotingException, MQBrokerException, InterruptedException {
        return this.defaultMQProducerImpl.send(batch(msgs));
    }
    private MessageBatch batch(Collection<Message> msgs) throws MQClientException {
        MessageBatch msgBatch;
        try {
            msgBatch = MessageBatch.generateFromList(msgs);
            for (Message message : msgBatch) {
                Validators.checkMessage(message, this);
                MessageClientIDSetter.setUniqID(message);
                message.setTopic(withNamespace(message.getTopic()));
            }
            MessageClientIDSetter.setUniqID(msgBatch);
            msgBatch.setBody(msgBatch.encode());
        } catch (Exception e) {
            throw new MQClientException("Failed to initiate the MessageBatch", e);
        }
        msgBatch.setTopic(withNamespace(msgBatch.getTopic()));
        return msgBatch;
    }
```

#### 2.1.2 客户端生成MessageID机制

生成的代码如下：

```java jxs title="MessageClientIDSetter"
public static String createUniqID() {
    char[] sb = new char[LEN * 2];
    System.arraycopy(FIX_STRING, 0, sb, 0, FIX_STRING.length);
    long current = System.currentTimeMillis();
    if (current >= nextStartTime) {
        setStartTime(current);
    }
    int diff = (int)(current - startTime);
    if (diff < 0 && diff > -1000_000) {
        // may cause by NTP
        diff = 0;
    }
    int pos = FIX_STRING.length;
    UtilAll.writeInt(sb, pos, diff);
    pos += 8;
    UtilAll.writeShort(sb, pos, COUNTER.getAndIncrement());
    return new String(sb);
}
```

在客户端生成message id主要包含了以下几个部分：

1. 前缀部分主要包含了：客户端的IP地址，JVM的PID，MessageClientIDSetter的ClassLoader的HashCode
2. 当前时间和客户端启动的时间差
3. 自增序列号

### 2.2 Broker端生成MessageID的时机和机制

#### 2.2.1 生成消息ID的时机

生产者发送消息时会带上发送给Broker的code：SEND_MESSAGE，Broker收到该消息时会使用SendMessageProcessor的sendMessage方法来处理发送消息流程，即发送消息。所以Broker生成消息ID时机在Broker存储消息到本地时。

#### 2.2.2 生成消息ID机制

```java jxs title="MessageDecoder"
public static String createMessageId(final ByteBuffer input, final ByteBuffer addr, final long offset) {
    input.flip();
    int msgIDLength = addr.limit() == 8 ? 16 : 28;
    input.limit(msgIDLength);

    input.put(addr);
    input.putLong(offset);

    return UtilAll.bytes2string(input.array());
}
```