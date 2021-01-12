---
title: Dubbo容错四大利器之—集群
categories:
  - RPC
  - Dubbo
tags:
  - RPC
  - Dubbo
abbrlink: fa3459b1
date: 2019-05-28 15:38:51
---
### 1. 集群容错

集群容错包含的饿组件：

- **Cluster**
- **Cluster Invoker**
- **Directory**
- **Router**
- **LoadBalance**

来自Dubbo官网的一张集群的组件之间的关系图：

![关系图](http://dubbo.incubator.apache.org/docs/zh-cn/source_code_guide/sources/images/cluster.jpg)

**集群工作的两个阶段：**

- **服务消费者初始化期间**

  集群 **`Cluster`** 实现类为服务消费者创建 **`Cluster Invoker`** 实例，即上图中的 merge 操作。

- **服务消费者进行远程调用**

  **FailoverClusterInvoker** 为例子：

  - 调用 Directory 的 list 方法列举 Invoker 列表
  - 并调用 Router 的 route 方法进行路由，过滤掉不符合路由规则的 Invoker
  - 当 FailoverClusterInvoker 拿到 Directory 返回的 Invoker 列表后，它会通过 LoadBalance 从 Invoker 列表中选择一个 Inovker
  - FailoverClusterInvoker 会将参数传给 LoadBalance 选择出的 Invoker 实例的 invoker 方法，进行真正的远程调用

**Dubbo 主要提供了这样几种容错方式**：

- **Failover Cluster - 失败自动切换**
- **Failfast Cluster - 快速失败**
- **Failsafe Cluster - 失败安全**
- **Failback Cluster - 失败自动恢复**
- **Forking Cluster - 并行调用多个服务提供者**

### 2 代码分析

以 **`FailoverCluster`** 为例子来讲：

```java
public class FailoverCluster implements Cluster {

    public final static String NAME = "failover";

    @Override
    public <T> Invoker<T> join(Directory<T> directory) throws RpcException {
        //创建返回FailoverClusterInvoker 对象就是上图的Merge过程
        return new FailoverClusterInvoker<T>(directory);
    }

}
```

接下来看 **`FailoverClusterInvoker`** 

```java
public class FailoverClusterInvoker<T> extends AbstractClusterInvoker<T> {

    public FailoverClusterInvoker(Directory<T> directory) {
        super(directory);
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Result doInvoke(Invocation invocation, final List<Invoker<T>> invokers, LoadBalance loadbalance) throws RpcException {
        List<Invoker<T>> copyInvokers = invokers;
        //判断是否为空
        checkInvokers(copyInvokers, invocation);
        //获取执行方法的名称
        String methodName = RpcUtils.getMethodName(invocation);
        int len = getUrl().getMethodParameter(methodName, Constants.RETRIES_KEY, Constants.DEFAULT_RETRIES) + 1;
        if (len <= 0) {
            len = 1;
        }
        // retry loop.
        RpcException le = null; // last exception.
        List<Invoker<T>> invoked = new ArrayList<Invoker<T>>(copyInvokers.size());
        Set<String> providers = new HashSet<String>(len);
        for (int i = 0; i < len; i++) {
            if (i > 0) {
                checkWhetherDestroyed();
                copyInvokers = list(invocation);
                checkInvokers(copyInvokers, invocation);
            }
            //根据服务目录 路由  和 负载筛选出 Invoker  ----- 1
            Invoker<T> invoker = select(loadbalance, invocation, copyInvokers, invoked);
            invoked.add(invoker);
            RpcContext.getContext().setInvokers((List) invoked);
            try {
                //执行远程调用  ---- 2
                Result result = invoker.invoke(invocation);
                if (le != null && logger.isWarnEnabled()) {
					//删除了此处的日子打印
                }
                return result;
            } catch (RpcException e) {
                if (e.isBiz()) { // biz exception.
                    throw e;
                }
                le = e;
            } catch (Throwable e) {
                le = new RpcException(e.getMessage(), e);
            } finally {
                providers.add(invoker.getUrl().getAddress());
            }
        }
        throw new RpcException(le.getCode(), "Failed to invoke the method "
                + methodName + " in the service " + getInterface().getName()
                + ". Tried " + len + " times of the providers " + providers
                + " (" + providers.size() + "/" + copyInvokers.size()
                + ") from the registry " + directory.getUrl().getAddress()
                + " on the consumer " + NetUtils.getLocalHost() + " using the dubbo version "
                + Version.getVersion() + ". Last error is: "
                + le.getMessage(), le.getCause() != null ? le.getCause() : le);
    }

}

```

