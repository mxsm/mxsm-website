---
title: Dubbo元数据
categories:
  - RPC
  - Dubbo
tags:
  - RPC
  - Dubbo
abbrlink: c66929c2
date: 2019-12-23 16:44:15
---
### 如何使用元数据？

元数据在Dubbo2.7才开始有的。如果在2.7版本中不进行额外的配置就会沿用以前的。zookeeper 中的数据格式仍然会和 Dubbo 2.6 保持一致，这主要是为了保证兼容性，让 Dubbo 2.6 的客户端可以调用 Dubbo 2.7 的服务端。如果整体迁移到 2.7，则可以为注册中心开启简化配置的参数（PS:当时自己在进行查看的过程还在说为什么没用变化难道只是Dubbo把代码写了没用真正的用，结果是没有设置）：

xml中的配置：

```xml
<dubbo:registry address=“zookeeper://127.0.0.1:2181” simplified="true"/>
```

.properties配置：

```properties
dubbo.registry.simplified=true
```

上面的是配置了使用元数据的配置后如何启用元数据。

元数据的配置：

```properties
dubbo.metadata-report.address=zookeeper://127.0.0.1:2181
dubbo.metadata-report.username=xxx        ##非必须
dubbo.metadata-report.password=xxx        ##非必须
dubbo.metadata-report.retry-times=30       ##非必须,default值100
dubbo.metadata-report.retry-period=5000    ##非必须,default值3000
dubbo.metadata-report.cycle-report=false   ##非必须,default值true
```

如果不配置元数据的配置这样就不会使用。

具体的为什么使用元数据和元数据带来了好处Dubbo的官网说明了

[Dubbo元数据说明](https://dubbo.apache.org/zh-cn/docs/user/references/metadata/introduction.html)

