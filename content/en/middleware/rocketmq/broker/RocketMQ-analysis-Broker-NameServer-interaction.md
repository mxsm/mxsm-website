---
title: RocketMQ源码解析-Broker与NameServer交互
categories:
  - MQ
  - RocketMQ
  - Broker
tags:
  - MQ
  - RocketMQ
  - Broker源码解析
  - Broker工作机制
  - Broker与NameServer交互
abbrlink: 76a6b47e
date: 2020-03-15 00:00:00

---
> 以下源码基于Rocket MQ 4.7.0

### Broker与NameServer的交互

Broker启动，跟所有的NameServer保持长连接，定时发送心跳包。心跳包中包含当前Broker信息(IP+端口等)以及存储所有Topic信息。注册成功后，NameServer集群中就有Topic跟Broker的映射关系。

> Broker会连接配置在配置文件中的所有NameServer。以同步(sync)通讯的方式和NameServer进行通讯。
>
> 通讯方式：
>
> - 同步(sync)
> - 异步(async)
> - 单向(oneway)

### 客户端的创建

Broker与NameServer进行数据交互主要是通过一个叫做 **`BrokerOuterAPI`** 的类来进行的。那么这个类的实例对象在哪里没创建又在哪里被引用来处理和NameServer的数据交互。

首先来看一下在哪里创建：

```java
public BrokerController(
    final BrokerConfig brokerConfig,
    final NettyServerConfig nettyServerConfig,
    final NettyClientConfig nettyClientConfig,
    final MessageStoreConfig messageStoreConfig
) {
//.....
this.brokerOuterAPI = new BrokerOuterAPI(nettyClientConfig);
    //.....
}
```

上面这段代码是在BrokerController的构造函数里面，没错就在创建BrokerController的时候会在构造函数里面创建BrokerOuterAPI这个类。

接下来看一下这个类在哪里被引用了。首先我们来看一下在BrokerController创建好了以后，最后调用BrokerController.start方法来启动Controller。在启动代码中有这样一段。

```java
//BrokerController.start方法中的一段代码
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

从上面的代码可以看出来是一个以以固定频率执行的定时器，这个定时器执行了BrokerController.registerBrokerAll 方法。

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/registerBrokerAll.png?raw=true)

1. 构造一些Broker topic的信息
2. Broker的元数据信息

通过 **`BrokerController.doRegisterBrokerAll`** 私有方法来处理数据。

```java
    private void doRegisterBrokerAll(boolean checkOrderConfig, boolean oneway,
        TopicConfigSerializeWrapper topicConfigWrapper) {
        //通过brokerOuterAPI注册Broker的信息到NameServer
        List<RegisterBrokerResult> registerBrokerResultList = this.brokerOuterAPI.registerBrokerAll(
            this.brokerConfig.getBrokerClusterName(),
            this.getBrokerAddr(),  //IP:Port
            this.brokerConfig.getBrokerName(),
            this.brokerConfig.getBrokerId(),
            this.getHAServerAddr(),
            topicConfigWrapper,
            this.filterServerManager.buildNewFilterServerList(),
            oneway,
            this.brokerConfig.getRegisterBrokerTimeoutMills(),
            this.brokerConfig.isCompressedRegister());
		//注册结果返回处理
        if (registerBrokerResultList.size() > 0) {
            RegisterBrokerResult registerBrokerResult = registerBrokerResultList.get(0);
            if (registerBrokerResult != null) {
                if (this.updateMasterHAServerAddrPeriodically && registerBrokerResult.getHaServerAddr() != null) {
                    this.messageStore.updateHaMasterAddress(registerBrokerResult.getHaServerAddr());
                }

                this.slaveSynchronize.setMasterAddr(registerBrokerResult.getMasterAddr());

                if (checkOrderConfig) {
                    this.getTopicConfigManager().updateOrderTopicConfig(registerBrokerResult.getKvTable());
                }
            }
        }
    }
```

### Broker端数据的处理

Broker和NameServer的数据处理通过上面可以知道主要是通过 **`BrokerOuterAPI.registerBrokerAll`** 处理。首先通过获取配置在Broker配置文件中的namesrvAddr。

```java
List<String> nameServerAddressList = this.remotingClient.getNameServerAddressList();
```

然后构建 **`RegisterBrokerRequestHeader`** 

```java
 final RegisterBrokerRequestHeader requestHeader = new RegisterBrokerRequestHeader();
            requestHeader.setBrokerAddr(brokerAddr); //broker地址 IP:Port
            requestHeader.setBrokerId(brokerId); // broker id 
            requestHeader.setBrokerName(brokerName); // broker名称
            requestHeader.setClusterName(clusterName); // 集群名称
            requestHeader.setHaServerAddr(haServerAddr); // haServer地址
            requestHeader.setCompressed(compressed); // 是否压缩
```

构造 **`RegisterBrokerBody`**

```java
            RegisterBrokerBody requestBody = new RegisterBrokerBody();
            requestBody.setTopicConfigSerializeWrapper(topicConfigWrapper);
            requestBody.setFilterServerList(filterServerList);
            final byte[] body = requestBody.encode(compressed);
            final int bodyCrc32 = UtilAll.crc32(body);
            requestHeader.setBodyCrc32(bodyCrc32);
```

然后就是发送数据到NameServer

```java
            final CountDownLatch countDownLatch = new CountDownLatch(nameServerAddressList.size());
            for (final String namesrvAddr : nameServerAddressList) {
                brokerOuterExecutor.execute(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            //注册Broker发送数据
                            RegisterBrokerResult result = registerBroker(namesrvAddr,oneway, timeoutMills,requestHeader,body);
                            if (result != null) {
                                registerBrokerResultList.add(result);
                            }

                            log.info("register broker[{}]to name server {} OK", brokerId, namesrvAddr);
                        } catch (Exception e) {
                            log.warn("registerBroker Exception, {}", namesrvAddr, e);
                        } finally {
                            countDownLatch.countDown();
                        }
                    }
                });
            }

            try {
                countDownLatch.await(timeoutMills, TimeUnit.MILLISECONDS);
            } catch (InterruptedException e) {
            }
```

通过调用 **`BrokerOuterAPI.registerBroker`** 方法来注册Broker。

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/registerBroker.png?raw=true)

1. 单向通讯
2. 同步通讯

通过上面可以看到请求的代码是 **`RequestCode.REGISTER_BROKER`** 。