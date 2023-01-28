---
title: "NameServer路由注册"
linkTitle: "NameServer路由注册"
date: 2023-01-05
weight: 202301051651
description: NameServer路由注册的过程和原理分析
---

## 1. Broker发起路由注册

在了解路由注册的机制之前首先要知道路由的发起者是谁，在RocketMQ中路由注册主要是由Broker发起。Broker启动，路由注册发起也分为三种：

1. 普通的模式-单个主无备
2. HA模式-有主有备
3. A-HA(AutoSwitch HA)主备自主切换模式-有主有备，主备自动切换
## 2.路由注册的流程
对应上面的三种模式大体上是一样的，只是在A-HA的模式中Broker首先会向Controller注册并且注册成功后再将路由信息注册到Broker。
Broker启动的过程中会往每一个配置的NameServer中发送一个RequestCode.REGISTER_BROKER(注册Broker)的请求。请求中包含了整个Broker的元数据。然后将数据注册到NameServer。
## 3.路由注册流程源码分析
路由注册主要有两个地方：

1. Broker启动过程中注册
2. Broker定时任务调用
### 3.1启动过程中注册
代码入口在 **BrokerController#start **
```java
public void start() throws Exception {

    //省略部分代码
    startBasicService();

    if (!isIsolated && !this.messageStoreConfig.isEnableDLegerCommitLog() && !this.messageStoreConfig.isDuplicationEnable()) {
        changeSpecialServiceStatus(this.brokerConfig.getBrokerId() == MixAll.MASTER_ID);
        this.registerBrokerAll(true, false, true);
    }

 //省略部分代码

}
```
启动Broker分为两种：

1. 正常的情况和HA模式下启动这种模式都是调用了如下的代码入口进行注册：
```java
    if (!isIsolated && !this.messageStoreConfig.isEnableDLegerCommitLog() && !this.messageStoreConfig.isDuplicationEnable()) {
        changeSpecialServiceStatus(this.brokerConfig.getBrokerId() == MixAll.MASTER_ID);
        this.registerBrokerAll(true, false, true);
    }
```

2. A-HA的模式启动，这个首先需要Broker注册到Controller，Controller的逻辑处理成功后就会将Broker注册到Name Server,以BrokerController#start的方法中的startBasicService()作为入口

### 3.2 定时任务更新注册信息
```java
scheduledFutures.add(this.scheduledExecutorService.scheduleAtFixedRate(new AbstractBrokerRunnable(this.getBrokerIdentity()) {
        @Override
        public void run0() {
            try {
                if (System.currentTimeMillis() < shouldStartTime) {
                    BrokerController.LOG.info("Register to namesrv after {}", shouldStartTime);
                    return;
                }
                if (isIsolated) {
                    BrokerController.LOG.info("Skip register for broker is isolated");
                    return;
                }
                BrokerController.this.registerBrokerAll(true, false, brokerConfig.isForceRegister());
            } catch (Throwable e) {
                BrokerController.LOG.error("registerBrokerAll Exception", e);
            }
        }
    }, 1000 * 10, Math.max(10000, Math.min(brokerConfig.getRegisterNameServerPeriod(), 60000)), TimeUnit.MILLISECONDS));
```
Broker启动后会启动一个去更新Broker在NameSrever的路由信息的定时任务。

## 4. Broker路由注册详解
路由最终的发起方法是BrokerController#registerBrokerAll
```java
    public synchronized void registerBrokerAll(final boolean checkOrderConfig, boolean oneway, boolean forceRegister) {

        TopicConfigAndMappingSerializeWrapper topicConfigWrapper = new TopicConfigAndMappingSerializeWrapper();

        topicConfigWrapper.setDataVersion(this.getTopicConfigManager().getDataVersion());
        topicConfigWrapper.setTopicConfigTable(this.getTopicConfigManager().getTopicConfigTable());

        topicConfigWrapper.setTopicQueueMappingInfoMap(this.getTopicQueueMappingManager().getTopicQueueMappingTable().entrySet().stream().map(
            entry -> new AbstractMap.SimpleImmutableEntry<>(entry.getKey(), TopicQueueMappingDetail.cloneAsMappingInfo(entry.getValue()))
        ).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));

        if (!PermName.isWriteable(this.getBrokerConfig().getBrokerPermission())
            || !PermName.isReadable(this.getBrokerConfig().getBrokerPermission())) {
            ConcurrentHashMap<String, TopicConfig> topicConfigTable = new ConcurrentHashMap<>();
            for (TopicConfig topicConfig : topicConfigWrapper.getTopicConfigTable().values()) {
                TopicConfig tmp =
                    new TopicConfig(topicConfig.getTopicName(), topicConfig.getReadQueueNums(), topicConfig.getWriteQueueNums(),
                        topicConfig.getPerm() & this.brokerConfig.getBrokerPermission(), topicConfig.getTopicSysFlag());
                topicConfigTable.put(topicConfig.getTopicName(), tmp);
            }
            topicConfigWrapper.setTopicConfigTable(topicConfigTable);
        }

        if (forceRegister || needRegister(this.brokerConfig.getBrokerClusterName(),
            this.getBrokerAddr(),
            this.brokerConfig.getBrokerName(),
            this.brokerConfig.getBrokerId(),
            this.brokerConfig.getRegisterBrokerTimeoutMills(),
            this.brokerConfig.isInBrokerContainer())) {
            doRegisterBrokerAll(checkOrderConfig, oneway, topicConfigWrapper);
        }
    }
```
Broker将元数据包装成 TopicConfigAndMappingSerializeWrapper 发送到NameServer
