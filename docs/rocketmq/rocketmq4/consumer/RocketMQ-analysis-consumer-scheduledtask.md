---
title: RocketMQ源码解析-消费者定时任务解析
date: 2021-06-13
weight: 202106102131
---

> 以下源码基于RocketMQ 4.8.0

在分析消费者启动消费的时候我们看到了，在本地启动一系列的定时任务。下面就来分析这些定时任务的作用在整个消费的过程中。定时任务启动在 **`MQClientInstance#startScheduledTask`** 方法中。

### 1. 读取Namesrv地址

```java
if (null == this.clientConfig.getNamesrvAddr()) {
    this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {

        @Override
        public void run() {
            try {
                MQClientInstance.this.mQClientAPIImpl.fetchNameServerAddr();
            } catch (Exception e) {
                log.error("ScheduledTask fetchNameServerAddr exception", e);
            }
        }
    }, 1000 * 10, 1000 * 60 * 2, TimeUnit.MILLISECONDS);
}
```

说明: 延迟10秒执行，每两分钟获取一次Namesrv的地址(在NamesrvAddr为空的情况下)

### 2. 从Namesrv更新Topic路由信息

```java
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {

    @Override
    public void run() {
        try {
            MQClientInstance.this.updateTopicRouteInfoFromNameServer();
        } catch (Exception e) {
            log.error("ScheduledTask updateTopicRouteInfoFromNameServer exception", e);
        }
    }
}, 10, this.clientConfig.getPollNameServerInterval(), TimeUnit.MILLISECONDS);
```

说明：默认每30秒更新一次Topic路由信息

### 3. 清除离线Broker和发送心跳给Broker

```java
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        try {
            MQClientInstance.this.cleanOfflineBroker();
            MQClientInstance.this.sendHeartbeatToAllBrokerWithLock();
        } catch (Exception e) {
            log.error("ScheduledTask sendHeartbeatToAllBroker exception", e);
        }
    }
}, 1000, this.clientConfig.getHeartbeatBrokerInterval(), TimeUnit.MILLISECONDS);
```

说明：默认每30秒清除一次离线的Broker,给所有的Broker发送心跳

### 4. 持久化消费进度

```java
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        try {
            MQClientInstance.this.persistAllConsumerOffset();
        } catch (Exception e) {
            log.error("ScheduledTask persistAllConsumerOffset exception", e);
        }
    }
}, 1000 * 10, this.clientConfig.getPersistConsumerOffsetInterval(), TimeUnit.MILLISECONDS);
```

说明：默认每5秒钟持久化一次消费进度。(正常关闭的时候回也会持久化)

### 5. 线程池适配

```java
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        try {
            MQClientInstance.this.adjustThreadPool();
        } catch (Exception e) {
            log.error("ScheduledTask adjustThreadPool exception", e);
        }
    }
}, 1, 1, TimeUnit.MINUTES);
```

说明:每一分钟适配一次
