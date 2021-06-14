---
title: RocketMQ源码解析-Broker 消息Tag过滤
date: 2021-06-12
weight: 202106120858
---

> RocketMQ源码版本4.8.0

### 1. 消息TagCode生成

通过 **ReputMessageService** 服务获取commitlog数据。然后通过 **`CommitLog#checkMessageAndReturnSize`** 生成tagCode:

```java
public DispatchRequest checkMessageAndReturnSize(java.nio.ByteBuffer byteBuffer, final boolean checkCRC,
        final boolean readBody) {
         if (propertiesLength > 0) {
        byteBuffer.get(bytesContent, 0, propertiesLength);
        String properties = new String(bytesContent, 0, propertiesLength, MessageDecoder.CHARSET_UTF8);
        propertiesMap = MessageDecoder.string2messageProperties(properties);

        keys = propertiesMap.get(MessageConst.PROPERTY_KEYS);

        uniqKey = propertiesMap.get(MessageConst.PROPERTY_UNIQ_CLIENT_MESSAGE_ID_KEYIDX);

        String tags = propertiesMap.get(MessageConst.PROPERTY_TAGS);
        if (tags != null && tags.length() > 0) {
            //生成TagCode
            tagsCode = MessageExtBrokerInner.tagsString2tagsCode(MessageExt.parseTopicFilterType(sysFlag), tags);
        }
        {
            String t = propertiesMap.get(MessageConst.PROPERTY_DELAY_TIME_LEVEL);
            if (TopicValidator.RMQ_SYS_SCHEDULE_TOPIC.equals(topic) && t != null) {
                int delayLevel = Integer.parseInt(t);

                if (delayLevel > this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel()) {
                    delayLevel = this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel();
                }

                if (delayLevel > 0) {
                    tagsCode = this.defaultMessageStore.getScheduleMessageService().computeDeliverTimestamp(delayLevel,
                        storeTimestamp);
                }
            }
        }
    }

 }

public class MessageExtBrokerInner extends MessageExt {
     public static long tagsString2tagsCode(final TopicFilterType filter, final String tags) {
        if (null == tags || tags.length() == 0) { return 0; }

        return tags.hashCode();
    }
}
```

- DispatchRequest将tag转化为tagCode
- DispatchRequest用于consumeQueue的存储，通过CommitLogDispatcherBuildConsumeQueue保存了tagsCode

### 2. 消费者订阅主题和Tags

Consumer端在订阅消息时除了指定Topic还可以指定TAG，如果一个消息有多个TAG，可以用 **||** 分隔。其中，Consumer端会将这个订阅请求构建成一个 SubscriptionData，发送一个Pull消息的请求给Broker端，看一下消费者代码的实现：

```java
public static SubscriptionData buildSubscriptionData(final String consumerGroup, String topic,
    String subString) throws Exception {
    SubscriptionData subscriptionData = new SubscriptionData();
    subscriptionData.setTopic(topic);
    subscriptionData.setSubString(subString);

    if (null == subString || subString.equals(SubscriptionData.SUB_ALL) || subString.length() == 0) {
        subscriptionData.setSubString(SubscriptionData.SUB_ALL);
    } else {
        String[] tags = subString.split("\\|\\|");
        if (tags.length > 0) {
            for (String tag : tags) {
                if (tag.length() > 0) {
                    String trimString = tag.trim();
                    if (trimString.length() > 0) {
                        subscriptionData.getTagsSet().add(trimString);
                        //获取tagCode其实就是hashCode
                        subscriptionData.getCodeSet().add(trimString.hashCode());
                    }
                }
            }
        } else {
            throw new Exception("subString split error");
        }
    }
    return subscriptionData;
}
```

### 3. Broker Tag过滤

Broker从CommitLog读取存储消息数据之前，会用消费者发送的SubscriptionData构建一个MessageFilter过滤器。然后传给MessageStore。然后通过MessageStore从 ConsumeQueue读取到一条记录后，会用它记录的消息tag hash(tagCode)值去做过滤，由于在服务端只是根据hashcode进行判断，无法精确对tag原始字符串进行过滤，故在消息消费端拉取到消息后，还需要对消息的原始tag字符串进行比对，如果不同，则丢弃该消息，不进行消息消费。

