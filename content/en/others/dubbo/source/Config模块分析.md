---
title: Config模块分析
categories:
  - RPC
  - Dubbo
  - 源码解析
tags:
  - RPC
  - Dubbo
  - 源码解析
abbrlink: 5333f15d
date: 2019-03-12 14:49:29
---
### 类之间的继承关系

![图解](https://github.com/mxsm/document/blob/master/image/RPC/Dubbo/dubboconfig%E5%85%B3%E7%B3%BB%E5%9B%BE2.7.1%E7%89%88%E6%9C%AC.jpg?raw=true)

从图可以看出配置都是继承 **`AbstractConfig`** 抽象类然后下面大致分成了八个：

- **RegistryConfig**

  注册中心配置类，同时如果有多个注册中心可以声明多个 `<dubbo:registry>` 并且在 `<dubbo:service>` 或 `<dubbo:reference>` 的 `registry` 属性指定使用的注册中心。

- **ProtocalConfig**

  服务提供者协议配置类，同时，如果需要支持多个协议就可以声明多个`<dubbo:protocol>` 标签，并在 `<dubbo:service>` 中通过 `protocol` 属性指定使用的协议。

- **MonitorConfig**

  监控中心配置

- **AbstractMethodConfig**

  后续的继承分为消费者和提供者

- **ConfigCenterConfig**

  配置中心

- **ModuleConfig**

  模块信息配置

- **MetadataReportConfig**

  2.7.1版本新增的下面看一下Dubbo官方给的这个配置的解释说明

  > #### 背景
  >
  > dubbo provider中的服务配置项有接近[30个配置项](http://dubbo.apache.org/en-us/docs/user/references/xml/dubbo-service.html)。 排除注册中心服务治理需要之外，很大一部分配置项是provider自己使用，不需要透传给消费者。这部分数据不需要进入注册中心，而只需要以key-value形式持久化存储。 dubbo consumer中的配置项也有[20+个配置项](http://dubbo.apache.org/en-us/docs/user/references/xml/dubbo-reference.html)。在注册中心之中，服务消费者列表中只需要关注application，version，group，ip，dubbo版本等少量配置，其他配置也可以以key-value形式持久化存储。 这些数据是以服务为维度注册进入注册中心，导致了数据量的膨胀，进而引发注册中心(如zookeeper)的网络开销增大，性能降低。
  > 除了上述配置项的存储之外，dubbo服务元数据信息也需要被存储下来。元数据信息包括服务接口，及接口的方法信息。这些信息将被用于服务mock，服务测试。
  >
  > #### 目标
  >
  > 需要将注册中心原来的数据信息和元数据信息保存到独立的key-value的存储中，这个key-value可以是DB，redis或者其他持久化存储。核心代码中支持了zookeeper，redis(推荐)的默认支持。
  >
  > provider存储内容的格式，参见：org.apache.dubbo.metadata.definition.model.FullServiceDefinition。是该类型gson化之后的存储。 Consumer存储内容，为Map格式。从Consumer端注册到注册中心的URL中的获取参数信息。即通过URL.getParameterMap()获取到的Map，进行gson话之后进行存储。

  [元数据官方介绍](https://dubbo.incubator.apache.org/zh-cn/docs/user/references/metadata/introduction.html)

- **ApplicationConfig**

  应用信息配置