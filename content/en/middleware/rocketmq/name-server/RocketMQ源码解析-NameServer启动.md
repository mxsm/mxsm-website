---
title: RocketMQ源码解析-NameServer启动
categories:
  - MQ
  - RocketMQ
  - NameServer
tags:
  - MQ
  - RocketMQ
  - NameServer源码解析
  - NameServer工作机制
abbrlink: ed397a06
date: 2020-03-11 00:00:00
---

> 以下源码基于Rocket MQ 4.7.0

### NameServer

NameServer是一个非常简单的Topic路由注册中心，其角色类似Dubbo中的zookeeper，支持Broker的动态注册与发现。主要包括两个功能：

- Broker管理，NameServer接受Broker集群的注册信息并且保存下来作为路由信息的基本数据。然后提供心跳检测机制，检查Broker是否还存活(代码中通过定时扫描BrokerLiveInfo的信息来管理)；
- 路由信息管理，每个NameServer将保存关于Broker集群的整个路由信息和用于客户端查询的队列信息。然后Producer和Conumser通过NameServer就可以知道整个Broker集群的路由信息，从而进行消息的投递和消费。

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/NameServer%E7%9A%84%E5%8A%9F%E8%83%BD.png?raw=true)

NameServer通常也是集群的方式部署，各实例间相互不进行信息通讯。Broker是向每一台NameServer注册自己的路由信息，所以每一个NameServer实例上面都保存一份完整的路由信息。当某个NameServer因某种原因下线了，Broker仍然可以向其它NameServer同步其路由信息，Producer,Consumer仍然可以动态感知Broker的路由的信息。

> NameServer各个实例之间互不通讯

### 源码分析

#### Remoting通信类结构

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/RemotingService.png?raw=true)

#### NameServer 启动

**org.apache.rocketmq.namesrv.NamesrvStartup** 是NameServer的启动类

```java
    public static void main(String[] args) {
        main0(args);
    }

     public static NamesrvController main0(String[] args) {

        try {
            NamesrvController controller = createNamesrvController(args);
            start(controller);
            String tip = "The Name Server boot success. serializeType=" + RemotingCommand.getSerializeTypeConfigInThisServer();
            log.info(tip);
            System.out.printf("%s%n", tip);
            return controller;
        } catch (Throwable e) {
            e.printStackTrace();
            System.exit(-1);
        }

        return null;
    }
```

通过 **`createNamesrvController`** 创建 **`NamesrvController`** 

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/createNamesrvController.png?raw=true)

NameServer 启动时首先判断是否传入了命令行参数。从代码可以看到有两个参数：

- -c可以指定 NameServer 的配置文件，如果不指定，则使用默认值
- -p 打印 NameServer 的配置参数信息。打印完参数后退出进程

下面就是打印的配置参数

```shell
22:06:51.794 [main] INFO  RocketmqNamesrvConsole - rocketmqHome=D:\dev\gitproject\rocketmq\distribution
22:06:51.857 [main] INFO  RocketmqNamesrvConsole - kvConfigPath=C:\Users\mxsm\namesrv\kvConfig.json
22:06:51.858 [main] INFO  RocketmqNamesrvConsole - configStorePath=C:\Users\mxsm\namesrv\namesrv.properties
22:06:51.858 [main] INFO  RocketmqNamesrvConsole - productEnvName=center
22:06:51.859 [main] INFO  RocketmqNamesrvConsole - clusterTest=false
22:06:51.859 [main] INFO  RocketmqNamesrvConsole - orderMessageEnable=false
22:06:51.860 [main] INFO  RocketmqNamesrvConsole - listenPort=9876
22:06:51.862 [main] INFO  RocketmqNamesrvConsole - serverWorkerThreads=8
22:06:51.864 [main] INFO  RocketmqNamesrvConsole - serverCallbackExecutorThreads=0
22:06:51.864 [main] INFO  RocketmqNamesrvConsole - serverSelectorThreads=3
22:06:51.864 [main] INFO  RocketmqNamesrvConsole - serverOnewaySemaphoreValue=256
22:06:51.865 [main] INFO  RocketmqNamesrvConsole - serverAsyncSemaphoreValue=64
22:06:51.865 [main] INFO  RocketmqNamesrvConsole - serverChannelMaxIdleTimeSeconds=120
22:06:51.865 [main] INFO  RocketmqNamesrvConsole - serverSocketSndBufSize=65535
22:06:51.865 [main] INFO  RocketmqNamesrvConsole - serverSocketRcvBufSize=65535
22:06:51.865 [main] INFO  RocketmqNamesrvConsole - serverPooledByteBufAllocatorEnable=true
22:06:51.865 [main] INFO  RocketmqNamesrvConsole - useEpollNativeSelector=false
```

下面的代码就是在 **`createNamesrvController`**  中创建 **`NamesrvController`**

```java
final NamesrvController controller = new NamesrvController(namesrvConfig, nettyServerConfig);

// remember all configs to prevent discard
controller.getConfiguration().registerConfig(properties);
```

#### NamesrvController初始化

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/NamesrvControllerStart.png?raw=true)

**`NamesrvStartup.start`** 主要初始化NamesrvController和启动

1. 调用NamesrvController.initialize方法初始化
2. 调用NamesrvController.start方法启动

> 在上图的代码中可以看到还注册了Hook，如果使用kill -9 的方式杀死进程就不会执行Hook中的代码

#### NamesrvController.initialize

```java
    public boolean initialize() {
		//从${user.home}/namesrv/kvConfig.json加载配置NameServer的配置
        this.kvConfigManager.load();  //1
		
        //创建Netty Server
        this.remotingServer = new NettyRemotingServer(this.nettyServerConfig, this.brokerHousekeepingService); //2
		//创建一个固定线程池
        this.remotingExecutor =
            Executors.newFixedThreadPool(nettyServerConfig.getServerWorkerThreads(), new ThreadFactoryImpl("RemotingExecutorThread_"));//3
        
		////注册NameServer服务接受请求的处理类
        this.registerProcessor(); //4
		
        //定时清理失效的Broker
        this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {

            @Override
            public void run() {
                NamesrvController.this.routeInfoManager.scanNotActiveBroker();
            }
        }, 5, 10, TimeUnit.SECONDS);  //5

        //定时打印NameServer配置
        this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {

            @Override
            public void run() {
                NamesrvController.this.kvConfigManager.printAllPeriodically();
            }
        }, 1, 10, TimeUnit.MINUTES); //6

        //7
        if (TlsSystemConfig.tlsMode != TlsMode.DISABLED) {
          //................
        }

        return true;
    }
```

1. 从${user.home}/namesrv/kvConfig.json加载配置NameServer的配置

2. 创建NettyServer来提供服务

3. 创建NettyServer执行使用的线程池

4. 给NettyServer注入请求处理器

5. 创建一个定时清理超时的 Broker 定时任务

   每十秒钟扫描一下Broker的窗台，删除2分钟没有更新状态的Broker,关闭对应的Netty的Channel

   ```java
       public void scanNotActiveBroker() {
           Iterator<Entry<String, BrokerLiveInfo>> it = this.brokerLiveTable.entrySet().iterator();
           while (it.hasNext()) {
               Entry<String, BrokerLiveInfo> next = it.next();
               long last = next.getValue().getLastUpdateTimestamp();
               if ((last + BROKER_CHANNEL_EXPIRED_TIME) < System.currentTimeMillis()) {
                   //关闭Channel
                   RemotingUtil.closeChannel(next.getValue().getChannel());
                   it.remove();
                   log.warn("The broker channel expired, {} {}ms", next.getKey(), BROKER_CHANNEL_EXPIRED_TIME);
                   this.onChannelDestroy(next.getKey(), next.getValue().getChannel());
               }
           }
       }
   ```

6. 创建一个打印 NameServer 配置的定时任务

   每隔10分钟打印一次NameServer的配置参数。即KVConfigManager.configTable变量的内容。

7. SSL的启用

#### NamesrvController.registerProcessor

```java
//注册接收请求的类
private void registerProcessor() {
        if (namesrvConfig.isClusterTest()) {

            this.remotingServer.registerDefaultProcessor(new ClusterTestRequestProcessor(this, namesrvConfig.getProductEnvName()),
                this.remotingExecutor);
        } else {

            this.remotingServer.registerDefaultProcessor(new DefaultRequestProcessor(this), this.remotingExecutor);
        }
    }
```

默认注入的请求类 **`DefaultRequestProcessor`** 。

#### DefaultRequestProcessor

通过 **`DefaultRequestProcessor.processRequest`** 方法来处理客户端的请求。

```java
@Override
    public RemotingCommand processRequest(ChannelHandlerContext ctx,
        RemotingCommand request) throws RemotingCommandException {

        //打印请求的信息
        if (ctx != null) {
            log.debug("receive request, {} {} {}",
                request.getCode(),
                RemotingHelper.parseChannelRemoteAddr(ctx.channel()),
                request);
        }

        switch (request.getCode()) {
            case RequestCode.PUT_KV_CONFIG:
                return this.putKVConfig(ctx, request);
            case RequestCode.GET_KV_CONFIG:
                return this.getKVConfig(ctx, request);
            case RequestCode.DELETE_KV_CONFIG:
                return this.deleteKVConfig(ctx, request);
            case RequestCode.QUERY_DATA_VERSION:
                return queryBrokerTopicConfig(ctx, request);
            case RequestCode.REGISTER_BROKER:
                Version brokerVersion = MQVersion.value2Version(request.getVersion());
                if (brokerVersion.ordinal() >= MQVersion.Version.V3_0_11.ordinal()) {
                    return this.registerBrokerWithFilterServer(ctx, request);
                } else {
                    return this.registerBroker(ctx, request);
                }
            case RequestCode.UNREGISTER_BROKER:
                return this.unregisterBroker(ctx, request);
            case RequestCode.GET_ROUTEINTO_BY_TOPIC:
                return this.getRouteInfoByTopic(ctx, request);
            case RequestCode.GET_BROKER_CLUSTER_INFO:
                return this.getBrokerClusterInfo(ctx, request);
            case RequestCode.WIPE_WRITE_PERM_OF_BROKER:
                return this.wipeWritePermOfBroker(ctx, request);
            case RequestCode.GET_ALL_TOPIC_LIST_FROM_NAMESERVER:
                return getAllTopicListFromNameserver(ctx, request);
            case RequestCode.DELETE_TOPIC_IN_NAMESRV:
                return deleteTopicInNamesrv(ctx, request);
            case RequestCode.GET_KVLIST_BY_NAMESPACE:
                return this.getKVListByNamespace(ctx, request);
            case RequestCode.GET_TOPICS_BY_CLUSTER:
                return this.getTopicsByCluster(ctx, request);
            case RequestCode.GET_SYSTEM_TOPIC_LIST_FROM_NS:
                return this.getSystemTopicListFromNs(ctx, request);
            case RequestCode.GET_UNIT_TOPIC_LIST:
                return this.getUnitTopicList(ctx, request);
            case RequestCode.GET_HAS_UNIT_SUB_TOPIC_LIST:
                return this.getHasUnitSubTopicList(ctx, request);
            case RequestCode.GET_HAS_UNIT_SUB_UNUNIT_TOPIC_LIST:
                return this.getHasUnitSubUnUnitTopicList(ctx, request);
            case RequestCode.UPDATE_NAMESRV_CONFIG:
                return this.updateConfig(ctx, request);
            case RequestCode.GET_NAMESRV_CONFIG:
                return this.getConfig(ctx, request);
            default:
                break;
        }
        return null;
    }
```

 所有的请求类型定义在 **RequestCode** 中：

| RequestCode                        | 说明                                                 |
| ---------------------------------- | ---------------------------------------------------- |
| PUT_KV_CONFIG                      | 向Namesrv追加KV配置                                  |
| GET_KV_CONFIG                      | 从Namesrv获取KV配置                                  |
| DELETE_KV_CONFIG                   | 从Namesrv获取KV配置                                  |
| QUERY_DATA_VERSION                 | 获取版本信息                                         |
| REGISTER_BROKER                    | 注册一个Broker，数据都是持久化的，如果存在则覆盖配置 |
| UNREGISTER_BROKER                  | 卸载一个Broker，数据都是持久化的                     |
| GET_ROUTEINTO_BY_TOPIC             | 根据Topic获取Broker Name、topic配置信息              |
| GET_BROKER_CLUSTER_INFO            | 获取注册到Name Server的所有Broker集群信息            |
| WIPE_WRITE_PERM_OF_BROKER          | 去掉BrokerName的写权限                               |
| GET_ALL_TOPIC_LIST_FROM_NAMESERVER | 从Name Server获取完整Topic列表                       |
| DELETE_TOPIC_IN_NAMESRV            | 从Namesrv删除Topic配置                               |
| GET_KVLIST_BY_NAMESPACE            | 通过NameSpace获取所有的KV List                       |
| GET_TOPICS_BY_CLUSTER              | 获取指定集群下的所有 topic                           |
| GET_SYSTEM_TOPIC_LIST_FROM_NS      | 获取所有系统内置 Topic 列表                          |
| GET_UNIT_TOPIC_LIST                | 单元化相关 topic                                     |
| GET_HAS_UNIT_SUB_TOPIC_LIST        | 获取含有单元化订阅组的 Topic 列表                    |
| GET_HAS_UNIT_SUB_UNUNIT_TOPIC_LIST | 获取含有单元化订阅组的非单元化                       |
| UPDATE_NAMESRV_CONFIG              | 更新Name Server配置                                  |
| GET_NAMESRV_CONFIG                 | 获取Name Server配置                                  |

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/RequestCode.png?raw=true)

> 以上RequestCode分为两类：
>
> 1. 路由信息
> 2. NameServer的配置

#### RouteInfoManager

```java
public class RouteInfoManager {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.NAMESRV_LOGGER_NAME);
    private final static long BROKER_CHANNEL_EXPIRED_TIME = 1000 * 60 * 2;
    private final ReadWriteLock lock = new ReentrantReadWriteLock();
    private final HashMap<String/* topic */, List<QueueData>> topicQueueTable;
    private final HashMap<String/* brokerName */, BrokerData> brokerAddrTable;
    private final HashMap<String/* clusterName */, Set<String/* brokerName */>> clusterAddrTable;
    private final HashMap<String/* brokerAddr */, BrokerLiveInfo> brokerLiveTable;
    private final HashMap<String/* brokerAddr */, List<String>/* Filter Server */> filterServerTable;

}
```

##### topicQueueTable

key：存储的是topic, value:QueueData的列表。QueueData 的集合 size 等于 Topic 对应的 Broker Master 的个数。下面来看一下QueueData数据结构：

```java
public class QueueData implements Comparable<QueueData> {
    private String brokerName;   //broker 名字
    private int readQueueNums;   //可读 queue 数
    private int writeQueueNums;  //可写 queue 数 
    private int perm;  //读写权限
    private int topicSynFlag;  //同步标识
    
    //............
}
```

##### brokerAddrTable

key：broker的名称

value: broker的相关信息

下面来看一下BrokerData数据结构：

```java
public class BrokerData implements Comparable<BrokerData> {
    private String cluster; //集群名称
    private String brokerName;  //broker名称
    //brokerId和broker的地址
    private HashMap<Long/* brokerId */, String/* broker address */> brokerAddrs; 
	
    //............
}
```

##### clusterAddrTable

key存储的是 clusterName 的名称， value 存储的是 brokerName 的集合

##### brokerLiveTable

key 存储的是 brokerAddr(IP:port) 信息，value 存储的是 BrokerLiveInfo 信息，BrokerLiveInfo 中存储了 Broker 的实时状态。

```java
class BrokerLiveInfo {
    private long lastUpdateTimestamp; //最新更新时间
    private DataVersion dataVersion; //数据版本
    private Channel channel;
    private String haServerAddr;
}
```

NamesrvController.initialize() 中有一个schedule定时任务，每个10秒钟定时调用 scanNotActiveBroker() 方法进行扫描不活动的 Broker，并把不活动的 Broker 删除掉，就是判断的 这个 lastUpdateTimestamp 这个数据。如果超过两分钟没有更新lastUpdateTimestamp这个值。就认为当前这个Broker不可用。

##### filterServerTable

key 存储的是 brokerAddr 信息，value 存储的是 Filter Server 信息。Filter Server 是消息的过滤服务器，一个 Broker 可以对应多个 Filter Server。

### NamesrvController.start

```java
    public void start() throws Exception {
        //启动监听服务
        this.remotingServer.start();

        if (this.fileWatchService != null) {
            this.fileWatchService.start();
        }
    }
```

### 总结

通过分析启动流程图如下：

![](https://github.com/mxsm/document/blob/master/image/MQ/RocketMQ/NameServerStartProcess.png?raw=true)