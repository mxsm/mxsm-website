---
title: "NameServer路由删除"
linkTitle: "NameServer路由删除"
date: 2023-01-05
weight: 202301051813
description: NameServer路由删除的过程和原理分析
---

NameServer启动一个扫描Broker是否在线定时任务，每隔5秒钟扫描一次。当判断Broker的上次更新时间超过10S后，就会任务路由过期然后将路由删除与此同时也会关闭连接。

## 1. 路由何时更新
Broker启动同时也会启动一个定时执行注册的定时任务：
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
注册的方法：
```java
public synchronized void registerBrokerAll(final boolean checkOrderConfig, boolean oneway, boolean forceRegister) {

    TopicConfigAndMappingSerializeWrapper topicConfigWrapper = new TopicConfigAndMappingSerializeWrapper();

	//省略构建代码

    if (forceRegister || needRegister(this.brokerConfig.getBrokerClusterName(), /*判断是否需要注册*/
        this.getBrokerAddr(),
        this.brokerConfig.getBrokerName(),
        this.brokerConfig.getBrokerId(),
        this.brokerConfig.getRegisterBrokerTimeoutMills(),
        this.brokerConfig.isInBrokerContainer())) {
        doRegisterBrokerAll(checkOrderConfig, oneway, topicConfigWrapper); //执行注册
    }
}
```
如上述代码，这里包含了两个地方可以更新Broker在NameServer的最新更新时间。

1. **needRegister方法**

在 **_forceRegister=false_** 的情况下，Broker会发送一个**_ RequestCode.QUERY_DATA_VERSION _**请求到NameServer查询回来数据版本，根据数据版本来判断是否需要注册路由到NameServer。在请求在处理的时候同时会更新Broker的最新更新时间。

2. **doRegisterBrokerAll方法**

每一次重新注册Broker的信息到NameServer。此时都会更新Broker的最新的更新时间。
:::tip
定时任务的值在10-60秒之间，配置字段为：registerNameServerPeriod
::: 
## 2. 路由删除触发
路由的删除有两个出发点：

1. NameServer定时扫描brokerLiveTable，检测上次心跳包与当 前系统时间的时间戳，如果时间戳大于120s，则需要移除该Broker信息
2. Broker与NameServer断开链接的情况下，会执行unregisterBroker指令。

不管是何种触发最终都是调用了RouteInfoManager#unRegisterBroker的方法   
### 2.1 NameServer定时任务触发
NameServer启动后同时会启动扫描brokerLiveTable的定时任务：
```java
private void startScheduleService() {
    this.scanExecutorService.scheduleAtFixedRate(NamesrvController.this.routeInfoManager::scanNotActiveBroker,
                                                 5, this.namesrvConfig.getScanNotActiveBrokerInterval(), TimeUnit.MILLISECONDS);
    //省略其他代码
}
```
定时任务调用RouteInfoManager#scanNotActiveBroker方法：
```java
public void scanNotActiveBroker() {
    try {
        log.info("start scanNotActiveBroker");
        for (Entry<BrokerAddrInfo, BrokerLiveInfo> next : this.brokerLiveTable.entrySet()) {
            long last = next.getValue().getLastUpdateTimestamp();
            long timeoutMillis = next.getValue().getHeartbeatTimeoutMillis();
			//判断最后一次更新时间是否超时，如果超时就执行关闭连接和删除路由
            if ((last + timeoutMillis) < System.currentTimeMillis()) {
                RemotingHelper.closeChannel(next.getValue().getChannel());
                log.warn("The broker channel expired, {} {}ms", next.getKey(), timeoutMillis);
                this.onChannelDestroy(next.getKey());
            }
        }
    } catch (Exception e) {
        log.error("scanNotActiveBroker exception", e);
    }
}
```
在RouteInfoManager#onChannelDestroy最终调用的就是RouteInfoManager#scanNotActiveBroker。上面就是定时任务触发的入口
### 2.2 Broker断开连接触发
当Broker断开与NameServer的连接就会触发BrokerHousekeepingService的三个方法：
```java
public class BrokerHousekeepingService implements ChannelEventListener {

    private final NamesrvController namesrvController;

    public BrokerHousekeepingService(NamesrvController namesrvController) {
        this.namesrvController = namesrvController;
    }

    @Override
    public void onChannelConnect(String remoteAddr, Channel channel) {
    }

    @Override
    public void onChannelClose(String remoteAddr, Channel channel) {
        this.namesrvController.getRouteInfoManager().onChannelDestroy(channel);
    }

    @Override
    public void onChannelException(String remoteAddr, Channel channel) {
        this.namesrvController.getRouteInfoManager().onChannelDestroy(channel);
    }

    @Override
    public void onChannelIdle(String remoteAddr, Channel channel) {
        this.namesrvController.getRouteInfoManager().onChannelDestroy(channel);
    }
}
```
这三个方法就是Netty中的Channel的处理方法。调用RouteInfoManager#onChannelDestroy，而onChannelDestroy方法通过构建提交UnRegisterBrokerRequestHeader请求到BatchUnregistrationService最终调用RouteInfoManager#unRegisterBroker来删除路由。

:::note
RocketMQ5.x相比RocketMQ4.x版本，对Broker的注销做了优化加快了注销的速度。具体可以参照[RIP-29](https://github.com/apache/rocketmq/wiki/RIP-29-Optimize-RocketMQ-NameServer)
::: 
## 3. 路由删除源码分析

