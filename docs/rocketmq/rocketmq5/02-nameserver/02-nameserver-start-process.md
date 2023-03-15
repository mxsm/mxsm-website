---
title: "RocketMQ5.0 NameServer启动流程"
linkTitle: "RocketMQ5.0 NameServer启动流程"
date: 2022-12-25
weight: 202212251701
---

## 1. NameServer 启动

**org.apache.rocketmq.namesrv.NamesrvStartup **的Main函数是启动的入口。

```java
    public static void main(String[] args) {
        main0(args);
        controllerManagerMain();
    }
    public static NamesrvController main0(String[] args) {
        try {
            parseCommandlineAndConfigFile(args);
            NamesrvController controller = createAndStartNamesrvController();
            return controller;
        } catch (Throwable e) {
            e.printStackTrace();
            System.exit(-1);
        }

        return null;
    }

    public static ControllerManager controllerManagerMain() {
        try {
            if (namesrvConfig.isEnableControllerInNamesrv()) {
                return createAndStartControllerManager();
            }
        } catch (Throwable e) {
            e.printStackTrace();
            System.exit(-1);
        }
        return null;
    }
```
启动分成了两块：

1. NameServer启动
2. Controller启动(5.0为自动自主切换新增的一个模块，内嵌NameServer的时候会启动)

:::tip 
本篇文章只分析NameServer的启动，Controller的启动在后续的文章中进行分析
::: 
### 1.1 命令行参数解析
NameServer启动之前需要先对命令行参数进行解析，将命令行参数解析为NameServer启动需要的参数配置。主要的命令行参数有两个

| 命令 | 说明 |
| --- | --- |
| -c | 设置配置文件文件位置 |
| -p | 打印配置的参数 |

**-c **命令行参数设置配置文件位置，然后将配置文件中的参数值解析设置为配置类的属性值，涉及到的配置有如下几个：

- NamesrvConfig
- NettyServerConfig
- NettyClientConfig
- ControllerConfig(只有当Controller内嵌NameServer的时候才起作用)
```java
namesrvConfig = new NamesrvConfig();
nettyServerConfig = new NettyServerConfig();
nettyClientConfig = new NettyClientConfig();
nettyServerConfig.setListenPort(9876);
controllerConfig = new ControllerConfig();
if (commandLine.hasOption('c')) {
    String file = commandLine.getOptionValue('c');
    if (file != null) {
        InputStream in = new BufferedInputStream(Files.newInputStream(Paths.get(file)));
        properties = new Properties();
        properties.load(in);
        MixAll.properties2Object(properties, namesrvConfig);
        MixAll.properties2Object(properties, nettyServerConfig);
        MixAll.properties2Object(properties, nettyClientConfig);
        MixAll.properties2Object(properties, controllerConfig);

        namesrvConfig.setConfigStorePath(file);

        System.out.printf("load config properties file OK, %s%n", file);
        in.close();
    }
}
```
:::tip 
更多的参数设置修改可以参照源码中NamesrvConfig、NettyServerConfig、NettyClientConfig、ControllerConfig中的类属性。
::: 
### 1.2 创建NamesrvController
根据NamesrvController的构造函数创建了三个重要的管理类实例：

1. KVConfigManager
2. BrokerHousekeepingService
3. RouteInfoManager

**KVConfigManager**
KV的持久化、序列化和反序列化处理
**BrokerHousekeepingService**
处理客户端和NameServer的连接逻辑，这里的客户端包括：生产者、消费者，以及Broker
**RouteInfoManager**
路由管理，主要管理Broker的元数据，Topic的元数据信息
### 1.3 初始化NamesrvController
```java
    public static NamesrvController start(final NamesrvController controller) throws Exception {

        if (null == controller) {
            throw new IllegalArgumentException("NamesrvController is null");
        }

        boolean initResult = controller.initialize();
        if (!initResult) {
            controller.shutdown();
            System.exit(-3);
        }

        Runtime.getRuntime().addShutdownHook(new ShutdownHookThread(log, (Callable<Void>) () -> {
            controller.shutdown();
            return null;
        }));

        controller.start();

        return controller;
    }
```
首先调用NamesrvController#initialize进行初始化，我们看一下初始化做了什么事情。
```java
    public boolean initialize() {
        loadConfig();
        initiateNetworkComponents();
        initiateThreadExecutors();
        registerProcessor();
        startScheduleService();
        initiateSslContext();
        initiateRpcHooks();
        return true;
    }
```
#### 1.3.1 loadConfig

#### 1.3.2 initiateNetworkComponents
```java
private void initiateNetworkComponents() {
    this.remotingServer = new NettyRemotingServer(this.nettyServerConfig, this.brokerHousekeepingService);
    this.remotingClient = new NettyRemotingClient(this.nettyClientConfig);
}
```
创建NameServer的网络服务，以及NameServer的客户端。
#### 1.3.3 initiateThreadExecutors
```java
private void initiateThreadExecutors() {
	this.defaultThreadPoolQueue = new LinkedBlockingQueue<>(this.namesrvConfig.getDefaultThreadPoolQueueCapacity());
	this.defaultExecutor = new ThreadPoolExecutor(this.namesrvConfig.getDefaultThreadPoolNums(), this.namesrvConfig.getDefaultThreadPoolNums(), 1000 * 60, TimeUnit.MILLISECONDS, this.defaultThreadPoolQueue, new ThreadFactoryImpl("RemotingExecutorThread_")) {
		@Override
		protected <T> RunnableFuture<T> newTaskFor(final Runnable runnable, final T value) {
			return new FutureTaskExt<>(runnable, value);
		}
	};

	this.clientRequestThreadPoolQueue = new LinkedBlockingQueue<>(this.namesrvConfig.getClientRequestThreadPoolQueueCapacity());
	this.clientRequestExecutor = new ThreadPoolExecutor(this.namesrvConfig.getClientRequestThreadPoolNums(), this.namesrvConfig.getClientRequestThreadPoolNums(), 1000 * 60, TimeUnit.MILLISECONDS, this.clientRequestThreadPoolQueue, new ThreadFactoryImpl("ClientRequestExecutorThread_")) {
		@Override
		protected <T> RunnableFuture<T> newTaskFor(final Runnable runnable, final T value) {
			return new FutureTaskExt<>(runnable, value);
		}
	};
}
```
这里初始化了两个线程池：

- clientRequestExecutor线程池处理客户端(生产者和消费者)获取Topic的路由信息(RequestCode.GET_ROUTEINFO_BY_TOPIC)
- defaultExecutor线程池处理除了RequestCode.GET_ROUTEINFO_BY_TOPIC以外的请求。

:::tip 
在5.0版本后多了一个clientRequestExecutor线程池，主要是因为增加NameServer的可用性，即使defaultExecutor不能正常工作出现宕机的情况，客户端仍然可以获取Topic的路由信息而进行的线程池的隔离。
具体可以参照[[RIP-29]](https://github.com/apache/rocketmq/wiki/RIP-29-Optimize-RocketMQ-NameServer)
::: 
#### 1.3.4  registerProcessor
```java
private void registerProcessor() {
    if (namesrvConfig.isClusterTest()) {

        this.remotingServer.registerDefaultProcessor(new ClusterTestRequestProcessor(this, namesrvConfig.getProductEnvName()), this.defaultExecutor);
    } else {
        // Support get route info only temporarily
        ClientRequestProcessor clientRequestProcessor = new ClientRequestProcessor(this);
        this.remotingServer.registerProcessor(RequestCode.GET_ROUTEINFO_BY_TOPIC, clientRequestProcessor, this.clientRequestExecutor);

        this.remotingServer.registerDefaultProcessor(new DefaultRequestProcessor(this), this.defaultExecutor);
    }
}
```
将线程池和处理器绑定。
#### 1.3.5 startScheduleService
```java
private void startScheduleService() {
    this.scanExecutorService.scheduleAtFixedRate(NamesrvController.this.routeInfoManager::scanNotActiveBroker,
        5, this.namesrvConfig.getScanNotActiveBrokerInterval(), TimeUnit.MILLISECONDS);

    this.scheduledExecutorService.scheduleAtFixedRate(NamesrvController.this.kvConfigManager::printAllPeriodically,
        1, 10, TimeUnit.MINUTES);

    this.scheduledExecutorService.scheduleAtFixedRate(() -> {
        try {
            NamesrvController.this.printWaterMark();
        } catch (Throwable e) {
            LOGGER.error("printWaterMark error.", e);
        }
    }, 10, 1, TimeUnit.SECONDS);
}
```
启动三个定时任务，两个是打印的的定时任务没有业务逻辑，只有scanNotActiveBroker定时任务的作用：默认每5秒扫描一次Broker是否过期。
#### 1.3.5 initiateSslContext
初始化SsL
#### 1.3.6 initiateRpcHooks
```java
private void initiateRpcHooks() {
    this.remotingServer.registerRPCHook(new ZoneRouteRPCHook());
}
```
目前只注册了一个ZoneRouteRPCHook，主要用于区域路由。
### 1.4 启动NamesrvController
```java
public void start() throws Exception {
    this.remotingServer.start();

    // In test scenarios where it is up to OS to pick up an available port, set the listening port back to config
    if (0 == nettyServerConfig.getListenPort()) {
        nettyServerConfig.setListenPort(this.remotingServer.localListenPort());
    }

    this.remotingClient.updateNameServerAddressList(Collections.singletonList(NetworkUtil.getLocalAddress()
        + ":" + nettyServerConfig.getListenPort()));
    this.remotingClient.start();

    if (this.fileWatchService != null) {
        this.fileWatchService.start();
    }

    this.routeInfoManager.start();
}
```
启动NameServer的Netty对外的服务和客户端服务，在文件监控服务不为空的情况下启动服务。
路由管理服务启动： 主要是启动了批量注销服务。
