---
title: Dubbo容错四大利器之—服务目录
categories:
  - RPC
  - Dubbo
tags:
  - RPC
  - Dubbo
abbrlink: 324f88e2
date: 2019-12-31 17:04:37
---
### 1. 集群容错包含哪些组件？

Dubbo的集群容错包含了四个部分：

- **服务目录Directory**
- **服务路由 Router**
- **集群 Cluster**
- **负载均衡 LoadBalance**

#### 2 什么是服务目录字典？

服务目录存储了一些和**服务提供者** 相关的信息，通过服务目录，消费者可以获取服务提供者的信息。比如IP、端口、服务协议等等。通过这些信息，消费者可以通过Netty等客户端进行远程调用。在一个集群中。服务提供者的信息并不是一成不变的。如果集群新增了一台机器，相应的在服务目录中就要新增一条服务提供者的记录。或者，如果服务提供者的配置修改了，服务目录中的记录也要做相应的更新。

实际上服务目录在获取注册中心的服务配置信息后，会为每条配置信息生成一个 Invoker 对象，并把这个 Invoker 对象存储起来，这个 Invoker 才是服务目录最终持有的对象。Invoker 有什么用呢？看名字就知道了，这是一个具有远程调用功能的对象。讲到这大家应该知道了什么是服务目录了，它可以看做是 Invoker 集合，且这个集合中的元素会随注册中心的变化而进行动态调整。

概括的说：**在每个本地机器上缓存了一份远程注册中心的信息，好处就是注册中心挂了还是能够从本地获取到原有已经注册在注册中心上面的服务。不以至于注册中心宕机导致整个服务不能使用** 

### 3 服务目录字典继承体系

![图](https://github.com/mxsm/document/blob/master/image/RPC/Dubbo/%E6%9C%8D%E7%9B%AE%E5%BD%95%E7%BB%A7%E6%89%BF%E4%BD%93%E7%B3%BB%E5%9B%BE2.7.0.jpg?raw=true)

```java
public interface Directory<T> extends Node {

    Class<T> getInterface();

    /**
     * 列出所有的Invoker
     *
     * @return invokers
     */
    List<Invoker<T>> list(Invocation invocation) throws RpcException;

}
```

**注意**： **RegistryDirectory 实现了 NotifyListener 接口，当注册中心节点信息发生变化后，RegistryDirectory 可以通过此接口方法得到变更信息，并根据变更信息动态调整内部 Invoker 列表。**

### 4 源码分析—2.7.0版本代码

**`AbstractDirectory`**  类的 **`List<Invoker<T>> list(Invocation invocation) throws RpcException;`** 的实现代码

```java
    @Override
    public List<Invoker<T>> list(Invocation invocation) throws RpcException {
        if (destroyed) {
            throw new RpcException("Directory already destroyed .url: " + getUrl());
        }
		//子类的模板方法
        return doList(invocation);
    }
//模板方法由子类实现
protected abstract List<Invoker<T>> doList(Invocation invocation) throws RpcException;
```

#### 4.1 StaticDirectory 子类

废话不多说先上代码

```java
public class StaticDirectory<T> extends AbstractDirectory<T> {
    private static final Logger logger = LoggerFactory.getLogger(StaticDirectory.class);

    private final List<Invoker<T>> invokers;

    //......构造函数省了

    @Override
    public Class<T> getInterface() {
        return invokers.get(0).getInterface();
    }

    @Override
    public boolean isAvailable() {
        if (isDestroyed()) {
            return false;
        }
        for (Invoker<T> invoker : invokers) {
            //一个Invoker这个服务目录字典就可用
            if (invoker.isAvailable()) {
                return true;
            }
        }
        return false;
    }

    @Override
    public void destroy() {
        if (isDestroyed()) {
            return;
        }
        super.destroy();
        for (Invoker<T> invoker : invokers) {
            invoker.destroy();
        }
        invokers.clear();
    }

    public void buildRouterChain() {
        RouterChain<T> routerChain = RouterChain.buildChain(getUrl());
        routerChain.setInvokers(invokers);
        this.setRouterChain(routerChain);
    }

    @Override
    protected List<Invoker<T>> doList(Invocation invocation) throws RpcException {
        List<Invoker<T>> finalInvokers = invokers;
        if (routerChain != null) {
            try {
                //从
                finalInvokers = routerChain.route(getConsumerUrl(), invocation);
            } catch (Throwable t) {
                logger.error("Failed to execute router: " + getUrl() + ", cause: " + t.getMessage(), t);
            }
        }
        return finalInvokers == null ? Collections.emptyList() : finalInvokers;
    }

}
```

