---
title: "RocketMQ Topic如何创建"
sidebar_position: 202301300928
description: 分析RocketMQ Topic创建流程以及如何同步到NameServer
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 1. 概述

主题是 Apache RocketMQ 中消息传输和存储的顶层容器，用于标识同一类业务逻辑的消息。同时主题也分为两大类：

- Rocketmq内置主题：例如**`TBW102`** ，系统主题前缀 **`rmq_sys_`** 。
- 用户自定义主题：此类主题也是开发过程中用的最多的，在发送消息之前首先创建消息对应的主题。

:::info 说明

更多内置主题参照 [TopicValidator](https://github.com/apache/rocketmq/blob/develop/common/src/main/java/org/apache/rocketmq/common/topic/TopicValidator.java) 或者Rocketmq Dashboard

:::

## 2. RocketMQ内置主题创建

Rocketmq内置主题是如何创建的？首先发现当MQ整个环境启动后MQ的内置Topic已经创建。所以猜测MQ是在启动的时候自动创建了内置Topic。

BrokerController构造函数中存在一段代码：

```java jsx title="BrokerController"
public BrokerController(
        final BrokerConfig brokerConfig,
        final NettyServerConfig nettyServerConfig,
        final NettyClientConfig nettyClientConfig,
        final MessageStoreConfig messageStoreConfig
    ){
    //省略其他代码
    this.topicConfigManager = messageStoreConfig.isEnableLmq() ? new LmqTopicConfigManager(this) : new TopicConfigManager(this);
}
```

通过源码发现**`LmqTopicConfigManager`** 继承了 **`TopicConfigManager`** 。在**`TopicConfigManager`** 构造函数中：

```java jsx title="TopicConfigManager"
public TopicConfigManager(BrokerController brokerController) {
    this.brokerController = brokerController;
    {
        String topic = TopicValidator.RMQ_SYS_SELF_TEST_TOPIC;
        TopicConfig topicConfig = new TopicConfig(topic);
        TopicValidator.addSystemTopic(topic);
        topicConfig.setReadQueueNums(1);
        topicConfig.setWriteQueueNums(1);
        this.topicConfigTable.put(topicConfig.getTopicName(), topicConfig);
    }
    //省略部分代码
}
```

从代码中可以发现通过自动构建 `TopicConfig` 然后存入 **`topicConfigTable`** 缓存。这里自动构建。

:::info 说明

RocketMQ内置主题在Broker启动的时候创建。

:::

## 3. 用户自定义主题创建

用自定义主题创建几种方式：

- 通过命令行创建Topic
- 通过RocketMQ控制台创建Topic
- 自动创建Topic

### 3.1 通过命令行创建Topic

命令：

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

例子：

<Tabs>
  <TabItem value="Linux" label="Linux" default>

```shell
$ bin/mqadmin updateTopic -n localhost:9876  -b localhost:10911  -t mxsm
```

  </TabItem>
  <TabItem value="Windows" label="Windows">

```powershell
bin\mqadmin.cmd updateTopic -n localhost:9876  -b localhost:10911  -t mxsm
```

  </TabItem>
</Tabs>

命令行最终调用的是 **`UpdateTopicSubCommand`** 类的实例。然后解析命令行参数构造 **`TopicConfig`**

```java jsx title="UpdateTopicSubCommand#execute"
@Override
public void execute(final CommandLine commandLine, final Options options,
    RPCHook rpcHook) throws SubCommandException {
    DefaultMQAdminExt defaultMQAdminExt = new DefaultMQAdminExt(rpcHook);
    defaultMQAdminExt.setInstanceName(Long.toString(System.currentTimeMillis()));
	//省略部分代码
    try {
        TopicConfig topicConfig = new TopicConfig();
        topicConfig.setReadQueueNums(8);
        topicConfig.setWriteQueueNums(8);
        topicConfig.setTopicName(commandLine.getOptionValue('t').trim());


        // readQueueNums
        if (commandLine.hasOption('r')) {
            topicConfig.setReadQueueNums(Integer.parseInt(commandLine.getOptionValue('r').trim()));
        }

        // writeQueueNums
        if (commandLine.hasOption('w')) {
            topicConfig.setWriteQueueNums(Integer.parseInt(commandLine.getOptionValue('w').trim()));
        }

        topicConfig.setOrder(isOrder);

        if (commandLine.hasOption('b')) {
            String addr = commandLine.getOptionValue('b').trim();

            defaultMQAdminExt.start();
            defaultMQAdminExt.createAndUpdateTopicConfig(addr, topicConfig);

            if (isOrder) {
                String brokerName = CommandUtil.fetchBrokerNameByAddr(defaultMQAdminExt, addr);
                String orderConf = brokerName + ":" + topicConfig.getWriteQueueNums();
                defaultMQAdminExt.createOrUpdateOrderConf(topicConfig.getTopicName(), orderConf, false);
            }
            return;

        } else if (commandLine.hasOption('c')) {
            String clusterName = commandLine.getOptionValue('c').trim();

            defaultMQAdminExt.start();

            Set<String> masterSet =
                CommandUtil.fetchMasterAddrByClusterName(defaultMQAdminExt, clusterName);
            for (String addr : masterSet) {
                defaultMQAdminExt.createAndUpdateTopicConfig(addr, topicConfig);
             
            }
			//省略部分代码
            return;
        }
		
    } catch (Exception e) {
       //省略代码
    } finally {
        defaultMQAdminExt.shutdown();
    }
}
```

将构建的**`TopicConfig`** 通过请求发送给对应的Broker。 通过代码可以知道Broker地址有两种方式获取：

1. 通过命令行参数**-b** 来指定
2. 通过命令行参数**-c** 指定创建的Topic的Broker集群名称，然后通过集群名称从NameServer获取集群中所有的Broker地址。

:::info

**-b** 和 **-c** 同时存在的情况下，**-b** 参数优先于**-c** 参数

:::

发送一个请求编码为 **`RequestCode.UPDATE_AND_CREATE_TOPIC`** 的请求到指定的Broker。**AdminBrokerProcessor** 根据请求编码处理。

```java jxs title="AdminBrokerProcessor#updateAndCreateTopic"
private synchronized RemotingCommand updateAndCreateTopic(ChannelHandlerContext ctx,
    RemotingCommand request) throws RemotingCommandException {
    final RemotingCommand response = RemotingCommand.createResponseCommand(null);
    if (validateSlave(response)) {
        return response;
    }
    final CreateTopicRequestHeader requestHeader =
        (CreateTopicRequestHeader) request.decodeCommandCustomHeader(CreateTopicRequestHeader.class);

    String topic = requestHeader.getTopic();
	//校验主题包括：长度、是否为空、以及是否符合如下格式：^[%|a-zA-Z0-9_-]+$
    TopicValidator.ValidateTopicResult result = TopicValidator.validateTopic(topic);
    if (!result.isValid()) {
        response.setCode(ResponseCode.SYSTEM_ERROR);
        response.setRemark(result.getRemark());
        return response;
    }
    if (brokerController.getBrokerConfig().isValidateSystemTopicWhenUpdateTopic()) {
        //校验是否为系统Topic或者包含某些前缀的
        if (TopicValidator.isSystemTopic(topic)) {
            response.setCode(ResponseCode.SYSTEM_ERROR);
            response.setRemark("The topic[" + topic + "] is conflict with system topic.");
            return response;
        }
    }
	//构建TopicConfig
    TopicConfig topicConfig = new TopicConfig(topic);
    topicConfig.setReadQueueNums(requestHeader.getReadQueueNums());
    topicConfig.setWriteQueueNums(requestHeader.getWriteQueueNums());
    topicConfig.setTopicFilterType(requestHeader.getTopicFilterTypeEnum());
    topicConfig.setPerm(requestHeader.getPerm());
    topicConfig.setTopicSysFlag(requestHeader.getTopicSysFlag() == null ? 0 : requestHeader.getTopicSysFlag());
    String attributesModification = requestHeader.getAttributes();
    topicConfig.setAttributes(AttributeParser.parseToMap(attributesModification));

    try {
        //更新主题-存在更新不存在就添加
        this.brokerController.getTopicConfigManager().updateTopicConfig(topicConfig);
        this.brokerController.registerIncrementBrokerData(topicConfig, this.brokerController.getTopicConfigManager().getDataVersion());
        response.setCode(ResponseCode.SUCCESS);
    } catch (Exception e) {
        LOGGER.error("Update / create topic failed for [{}]", request, e);
        response.setCode(ResponseCode.SYSTEM_ERROR);
        response.setRemark(e.getMessage());
    }
    return response;
}
```

**TopicConfigManager#updateTopicConfig** 负责处理请求过来的数据：

```java jsx title="TopicConfigManager#updateTopicConfig"
    public void updateTopicConfig(final TopicConfig topicConfig) {
        checkNotNull(topicConfig, "topicConfig shouldn't be null");

        Map<String, String> newAttributes = request(topicConfig);
        Map<String, String> currentAttributes = current(topicConfig.getTopicName());
		
        //属性的增删处理
        Map<String, String> finalAttributes = alterCurrentAttributes(
            this.topicConfigTable.get(topicConfig.getTopicName()) == null,
            ImmutableMap.copyOf(currentAttributes),
            ImmutableMap.copyOf(newAttributes));

        topicConfig.setAttributes(finalAttributes);

        TopicConfig old = this.topicConfigTable.put(topicConfig.getTopicName(), topicConfig);
        if (old != null) {
            log.info("update topic config, old:[{}] new:[{}]", old, topicConfig);
        } else {
            log.info("create new topic [{}]", topicConfig);
        }

        long stateMachineVersion = brokerController.getMessageStore() != null ? brokerController.getMessageStore().getStateMachineVersion() : 0;
        dataVersion.nextVersion(stateMachineVersion);
		//持久化主题到Broker本地
        this.persist(topicConfig.getTopicName(), topicConfig);
    }
```

上述方法 **`TopicConfigManager#updateTopicConfig`** 主要做了三件事：

- **属性处理：这里包括新增属性、删除属性**

- **主题存入缓存**

- **持久化主题数据到Broker本地**

  持久化到本地的数据格式：

  ```json
  {
  	"dataVersion":{
  		"counter":1,
  		"stateVersion":0,
  		"timestamp":1670616895921
  	},
  	"topicConfigTable":{
  		"RMQ_SYS_TRANS_OP_HALF_TOPIC":{
  			"attributes":{},
  			"order":false,
  			"perm":6,
  			"readQueueNums":1,
  			"topicFilterType":"SINGLE_TAG",
  			"topicName":"RMQ_SYS_TRANS_OP_HALF_TOPIC",
  			"topicSysFlag":0,
  			"writeQueueNums":1
  		},
  		"TBW102":{
  			"attributes":{},
  			"order":false,
  			"perm":7,
  			"readQueueNums":8,
  			"topicFilterType":"SINGLE_TAG",
  			"topicName":"TBW102",
  			"topicSysFlag":0,
  			"writeQueueNums":8
  		}
  	}
  }
  ```

完成Broker处理后，调用 **`BrokerController#registerIncrementBrokerData`** 注册到NameServer。

::: tip 说明

Broker创建后的Topic是通过发送Broker注册请求`RequestCode.REGISTER_BROKER` ，同时将Topic的信息发送到NameServer。

:::

### 3.2 通过RocketMQ控制台创建Topic

命令行创建和通过RocketMQ控制台创建Topic底层实现一致，而通过RocketMQ控制台创建Topic是通过界面填写Topic的数据。后续的流程和命令行创建是一样的。

### 3.3 自动创建Topic

自动创建Topic是我们在发送消息的时候无需预先创建Topic,那么到底是如何自动创建Topic的呢？

在前文中提到过一个RocketMQ的内置Topic: **TBW102**

#### 3.3.1 开启自动创建Topic开关

如果想要能够自动创建Topic首先需要开启Broker的配置

```properties
autoCreateTopicEnable = true
```

MQ默认开启。

:::tip

官方建议生产环境自动创建Topic开关关闭

:::

#### 3.3.2 TBW102何时获取

首先明确的一点就是消息发送的Topic一定需要存在，而 **TBW102** 是自动创建主题的关键。通过跟踪发送消息发现如下代码：

```java jxs title="DefaultMQProducerImpl#tryToFindTopicPublishInfo"
private TopicPublishInfo tryToFindTopicPublishInfo(final String topic) {
    TopicPublishInfo topicPublishInfo = this.topicPublishInfoTable.get(topic);
    if (null == topicPublishInfo || !topicPublishInfo.ok()) {
        this.topicPublishInfoTable.putIfAbsent(topic, new TopicPublishInfo());
        this.mQClientFactory.updateTopicRouteInfoFromNameServer(topic);
        topicPublishInfo = this.topicPublishInfoTable.get(topic);
    }
	//省略部分代码
}
```

从缓存中获取topic的数据，此时肯定是null。 此时就会创建一个默认的TopicPublishInfo实例对象存入缓存形成映射关系。然后去NameServer更新这个Topic的缓存。通过分析源码可以发现在没有实现创建Topic的情况下会去拉取 **`TBW102`** 这个RocketMQ内置的主题。

```java jxs title="MQClientInstance#updateTopicRouteInfoFromNameServer"
public boolean updateTopicRouteInfoFromNameServer(final String topic, boolean isDefault,
    DefaultMQProducer defaultMQProducer) {
	//下面省略了部分代码
    if (this.lockNamesrv.tryLock(LOCK_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS)) {
        try {
            TopicRouteData topicRouteData;
            if (isDefault && defaultMQProducer != null) {
                //获取TBW102的数据信息
                topicRouteData = this.mQClientAPIImpl.getDefaultTopicRouteInfoFromNameServer(defaultMQProducer.getCreateTopicKey(),
                    clientConfig.getMqClientApiTimeout());
                if (topicRouteData != null) {
                    for (QueueData data : topicRouteData.getQueueDatas()) {
                        int queueNums = Math.min(defaultMQProducer.getDefaultTopicQueueNums(), data.getReadQueueNums());
                        data.setReadQueueNums(queueNums);
                        data.setWriteQueueNums(queueNums);
                    }
                }
            }

        } catch (MQClientException e) {

        } catch (RemotingException e) {

        } finally {
            this.lockNamesrv.unlock();
        }
    }
    return false;
}
```

获取到 **`TWB102`** 的数据后会将数据更新到我们创建的Topic的本地缓存映射关系中。

#### 3.3.3 Broker在接收消息同时创建Topic

在Broker接收到了Producer发送的MQ消息的时候，首先会对消息进行校验是调用 **AbstractSendMessageProcessor#msgCheck** 进行校验，主要校验的有以下几个：

- Broker是否有写的权限
- 校验是不是内置的Topic，主要缓存在TopicValidator.SYSTEM_TOPIC_SET
- 不允许发送消息的一些Topic，主要保存在TopicValidator.NOT_ALLOWED_SEND_TOPIC_SET缓存中



