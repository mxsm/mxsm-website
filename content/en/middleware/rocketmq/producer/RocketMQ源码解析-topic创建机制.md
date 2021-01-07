---
title: RocketMQ源码解析-topic创建机制
categories:
  - MQ
  - RocketMQ
  - producer
tags:
  - MQ
  - RocketMQ
  - producer
  - topic创建
abbrlink: c63ffe4a
date: 2020-03-25 00:00:00
---



> 以下源码基于Rocket MQ 4.7.0

### 1 RocketMQ Topic创建机制

RocketMQ Topic创建机制分为两种：一种自动创建，一种手动创建。可以通过设置broker的配置文件来禁用或者允许自动创建。默认是开启的允许自动创建
> autoCreateTopicEnable=true/false

下面会结合源码来深度分析一下自动创建和手动创建的过程。
### 2 自动Topic
默认情况下，topic不用手动创建，当producer进行消息发送时，会从nameserver拉取topic的路由信息，如果topic的路由信息不存在，那么会默认拉取broker启动时默认创建好名为“TBW102”的Topic,这定义在org.apache.rocketmq.common.MixAll类中

```javaMixAll
// Will be created at broker when isAutoCreateTopicEnable
 public static final String AUTO_CREATE_TOPIC_KEY_TOPIC = "TBW102"; 
```
自动创建开关是下BrokerConfig类中有一个私有变量：

```java
    @ImportantField
    private boolean autoCreateTopicEnable = true;
```
这变量可以通过配置文件配置来进行修改，代码中的默认值为true，所以在默认的情况下Rocket MQ是会自动创建Topic的。  
在Broker启动，会调用TopicConfigManager的构造方法，在构造方法中定义了一系列RocketMQ系统内置的一些系统Topic（这里只关注一下TBW102）:

```java
        {
            // MixAll.AUTO_CREATE_TOPIC_KEY_TOPIC
            if (this.brokerController.getBrokerConfig().isAutoCreateTopicEnable()) {
                String topic = MixAll.AUTO_CREATE_TOPIC_KEY_TOPIC;
                TopicConfig topicConfig = new TopicConfig(topic);
                this.systemTopicList.add(topic);
                topicConfig.setReadQueueNums(this.brokerController.getBrokerConfig()
                    .getDefaultTopicQueueNums()); //8
                topicConfig.setWriteQueueNums(this.brokerController.getBrokerConfig()
                    .getDefaultTopicQueueNums()); //8
                int perm = PermName.PERM_INHERIT | PermName.PERM_READ | PermName.PERM_WRITE;
                topicConfig.setPerm(perm);
                this.topicConfigTable.put(topicConfig.getTopicName(), topicConfig);
            }
        }
```
这里有 **`this.brokerController.getBrokerConfig().isAutoCreateTopicEnable()`** 这样一段代码，在开启允许自动创建的时候，会把当前Topic的信息存入topicConfigTable变量中。然后通过发送定期发送心跳包把Topic和Broker的信息发送到NameServer的RouteInfoManager中进行保存。在BrokerController中定义了这样的一个定时任务来执行这个心跳包的发送：

```java
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {

            @Override
            public void run() {
                try {
                    BrokerController.this.registerBrokerAll(true, false, brokerConfig.isForceRegister());
                } catch (Throwable e) {
                    log.error("registerBrokerAll Exception", e);
                }
            }
        }, 1000 * 10, Math.max(10000, Math.min(brokerConfig.getRegisterNameServerPeriod(), 60000)), TimeUnit.MILLISECONDS);

```
这里就说明了如何把每个Broker的系统自定义的Topic注册到NameServer。接下来看在发送过程中如何从NameServer获取Topic的路由信息：
DefaultMQProducerImpl.sendDefaultImpl

```java
private SendResult sendDefaultImpl(
        Message msg,
        final CommunicationMode communicationMode,
        final SendCallback sendCallback,
        final long timeout
    ) throws MQClientException, RemotingException, MQBrokerException, InterruptedException {
        
        //省略代码
        
        //获取路由信息
        TopicPublishInfo topicPublishInfo = this.tryToFindTopicPublishInfo(msg.getTopic());
        
    }
```
通过DefaultMQProducerImpl.tryToFindTopicPublishInfo方法获取Topic的路由信息。

```java
    private TopicPublishInfo tryToFindTopicPublishInfo(final String topic) {
        
        TopicPublishInfo topicPublishInfo = this.topicPublishInfoTable.get(topic);
        //第一次从缓存中获取--肯定没有因为还没创建
        if (null == topicPublishInfo || !topicPublishInfo.ok()) {
            this.topicPublishInfoTable.putIfAbsent(topic, new TopicPublishInfo());
            //从NameServer获取--也是没有，因为没有创建
            this.mQClientFactory.updateTopicRouteInfoFromNameServer(topic);
            topicPublishInfo = this.topicPublishInfoTable.get(topic);
        }

        if (topicPublishInfo.isHaveTopicRouterInfo() || topicPublishInfo.ok()) {
            return topicPublishInfo;
        } else {
            //第二次从这里获取
            this.mQClientFactory.updateTopicRouteInfoFromNameServer(topic, true, this.defaultMQProducer);
            topicPublishInfo = this.topicPublishInfoTable.get(topic);
            return topicPublishInfo;
        }
    }
```
下面来看一下 **`MQClientInstance.updateTopicRouteInfoFromNameServer`** 的方法:

```java
 public boolean updateTopicRouteInfoFromNameServer(final String topic, boolean isDefault,
        DefaultMQProducer defaultMQProducer) {
            
    //省略代码
    
    
    if (isDefault && defaultMQProducer != null) {
            //使用默认的TBW102 Topic获取数据
            topicRouteData = this.mQClientAPIImpl.getDefaultTopicRouteInfoFromNameServer(defaultMQProducer.getCreateTopicKey(),
                            1000 * 3);
                if (topicRouteData != null) {
                    for (QueueData data : topicRouteData.getQueueDatas()) {
                                int queueNums = Math.min(defaultMQProducer.getDefaultTopicQueueNums(), data.getReadQueueNums());
                                data.setReadQueueNums(queueNums);
                                data.setWriteQueueNums(queueNums);
                            }
                        }
                    } else {
                        //这是正常的
                        topicRouteData = this.mQClientAPIImpl.getTopicRouteInfoFromNameServer(topic, 1000 * 3);
                    }
      //省略代码      
    }
```
如果isDefault=true并且defaultMQProducer不为空，从nameserver中获取默认路由信息，此时会获取所有已开启自动创建开关的broker的默认“TBW102”topic路由信息，并保存默认的topic消息队列数量。
> 这里会比较一下配在在 DefaultMQProducer.defaultTopicQueueNums中的默认值和TBW102中的值哪个更小。


```java
 if (topicRouteData != null) {
        TopicRouteData old = this.topicRouteTable.get(topic);
        boolean changed = topicRouteDataIsChange(old, topicRouteData);
        if (!changed) {
            changed = this.isNeedUpdateTopicRouteInfo(topic);
        } else {
            log.info("the topic[{}] route info changed, old[{}] ,new[{}]", topic, old, topicRouteData);
        }
 }
```
判断获取默认的是否存在，如果存在把当前的Topic的信息更新。也就是把TBW102 Topic的数据更新为自动创建的数据。

```
 if (changed) {
    TopicRouteData cloneTopicRouteData = topicRouteData.cloneTopicRouteData();

    for (BrokerData bd : topicRouteData.getBrokerDatas()) {
        this.brokerAddrTable.put(bd.getBrokerName(), bd.getBrokerAddrs());
    }

    // Update Pub info
    {
        TopicPublishInfo publishInfo = topicRouteData2TopicPublishInfo(topic, topicRouteData);
        publishInfo.setHaveTopicRouterInfo(true);
        Iterator<Entry<String, MQProducerInner>> it = this.producerTable.entrySet().iterator();
        while (it.hasNext()) {
            Entry<String, MQProducerInner> entry = it.next();
            MQProducerInner impl = entry.getValue();
            if (impl != null) {
                impl.updateTopicPublishInfo(topic, publishInfo);
            }
        }
    }
    	// Update sub info
    {
        Set<MessageQueue> subscribeInfo = topicRouteData2TopicSubscribeInfo(topic, topicRouteData);
        Iterator<Entry<String, MQConsumerInner>> it = this.consumerTable.entrySet().iterator();
        while (it.hasNext()) {
            Entry<String, MQConsumerInner> entry = it.next();
            MQConsumerInner impl = entry.getValue();
            if (impl != null) {
                impl.updateTopicSubscribeInfo(topic, subscribeInfo);
            }
        }
    }
    log.info("topicRouteTable.put. Topic = {}, TopicRouteData[{}]", topic, cloneTopicRouteData);
    this.topicRouteTable.put(topic, cloneTopicRouteData);
    return true;
}
```
更新本地的缓存。这样TBW102 Topic的负载和一些默认的路由信息就会被自己创建的Topic使用。这里就是整个自动创建的过程.  
总结一下就是：通过使用系统内部的一个TBW102的Topic的配置来自动创建当前用户的要创建的自定义Topic。

### 手动创建--预先创建
手动创建也叫预先创建，就是在使用Topic之前就创建，可以通过命令行或者通过RocketMQ的管理界面创建Topic。

#### 通过界面控制台创建
>项目地址： https://github.com/apache/rocketmq-externals

![](https://raw.githubusercontent.com/mxsm/document/master/image/MQ/RocketMQ/createTopicByHuman.png)

TopicController主要负责Topic的管理
```java
@RequestMapping(value = "/createOrUpdate.do", method = { RequestMethod.POST})
@ResponseBody
public Object topicCreateOrUpdateRequest(@RequestBody TopicConfigInfo topicCreateOrUpdateRequest) {
    Preconditions.checkArgument(CollectionUtils.isNotEmpty(topicCreateOrUpdateRequest.getBrokerNameList()) || CollectionUtils.isNotEmpty(topicCreateOrUpdateRequest.getClusterNameList()),
            "clusterName or brokerName can not be all blank");
    logger.info("op=look topicCreateOrUpdateRequest={}", JsonUtil.obj2String(topicCreateOrUpdateRequest));
    topicService.createOrUpdate(topicCreateOrUpdateRequest);
    return true;
}
```
然后通过MQAdminExtImpl.createAndUpdateTopicConfig方法来创建：

```java
    @Override
    public void createAndUpdateTopicConfig(String addr, TopicConfig config)
        throws RemotingException, MQBrokerException, InterruptedException, MQClientException {
        MQAdminInstance.threadLocalMQAdminExt().createAndUpdateTopicConfig(addr, config);
    }
```
通过调用DefaultMQAdminExtImpl.createAndUpdateTopicConfig创建Topic

```java
@Override
public void createAndUpdateTopicConfig(String addr, TopicConfig config) throws RemotingException, MQBrokerException,
        InterruptedException, MQClientException {
    this.mqClientInstance.getMQClientAPIImpl().createTopic(addr, this.defaultMQAdminExt.getCreateTopicKey(), config, timeoutMillis);
}
```
最后通过MQClientAPIImpl.createTopic创建Topic

```java
    public void createTopic(final String addr, final String defaultTopic, final TopicConfig topicConfig,
        final long timeoutMillis)
        throws RemotingException, MQBrokerException, InterruptedException, MQClientException {
        CreateTopicRequestHeader requestHeader = new CreateTopicRequestHeader();
        requestHeader.setTopic(topicConfig.getTopicName());
        requestHeader.setDefaultTopic(defaultTopic);
        requestHeader.setReadQueueNums(topicConfig.getReadQueueNums());
        requestHeader.setWriteQueueNums(topicConfig.getWriteQueueNums());
        requestHeader.setPerm(topicConfig.getPerm());
        requestHeader.setTopicFilterType(topicConfig.getTopicFilterType().name());
        requestHeader.setTopicSysFlag(topicConfig.getTopicSysFlag());
        requestHeader.setOrder(topicConfig.isOrder());

        RemotingCommand request = RemotingCommand.createRequestCommand(RequestCode.UPDATE_AND_CREATE_TOPIC, requestHeader);

        RemotingCommand response = this.remotingClient.invokeSync(MixAll.brokerVIPChannel(this.clientConfig.isVipChannelEnabled(), addr),
            request, timeoutMillis);
        assert response != null;
        switch (response.getCode()) {
            case ResponseCode.SUCCESS: {
                return;
            }
            default:
                break;
        }

        throw new MQClientException(response.getCode(), response.getRemark());
    }
```