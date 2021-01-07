---
title: Dubbo Protocol说明
categories:
  - RPC
  - Dubbo
  - 源码解析
tags:
  - RPC
  - Dubbo
  - 源码解析
abbrlink: 25eaa075
date: 2019-11-14 07:08:45
---
### 1.Protocol接口
代码中的注释解释该类是API和SPI的，并且是一个单例模式，线程安全的接口。

```java
@SPI("dubbo")
public interface Protocol {

    //获取协议的默认端口
    int getDefaultPort();

    //服务输出
    @Adaptive
    <T> Exporter<T> export(Invoker<T> invoker) throws RpcException;

    //远程服务引用
    @Adaptive
    <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException;
   
    //协议销毁
    void destroy();

    //获取
    default List<ProtocolServer> getServers() {
        return Collections.emptyList();
    }

}
```
在Dubbo的Protocol接口实现类中有三个比较特殊的三个：
- **ProtocolFilterWrapper**
 
  [对于Filter可以看一下官方的说明](https://dubbo.apache.org/zh-cn/blog/first-dubbo-filter.html)
- **ProtocolListenerWrapper**

  官方对此并没有介绍
- **QosProtocolWrapper**
 
  [官方对于Qos的介绍](http://dubbo.apache.org/zh-cn/blog/introduction-to-dubbo-qos.html)
 
首先这三个类在Dubbo中有一个统称叫做包装类。对于包装类在进行拓展加载的时候会进行特殊处理。[官方对Wrapper类的介绍](http://dubbo.apache.org/zh-cn/blog/introduction-to-dubbo-spi-2.html)

### 2. Protocol如何实例化
从 ***ServiceConfig*** 类的静态属性 ***protocol*** 来进行分析：

```java
public class ServiceConfig<T> extends ServiceConfigBase<T> {

    
     private static final Protocol protocol = ExtensionLoader.getExtensionLoader(Protocol.class).getAdaptiveExtension();
}
```
通过方法可以看出来 ***ExtensionLoader*** 类加载的。看一下 ***ExtensionLoader#getAdaptiveExtension*** 方法：

```java
    public T getAdaptiveExtension() {
        Object instance = cachedAdaptiveInstance.get();
        if (instance == null) {
            if (createAdaptiveInstanceError != null) {
                throw new IllegalStateException("Failed to create adaptive instance: " +
                        createAdaptiveInstanceError.toString(),
                        createAdaptiveInstanceError);
            }

            synchronized (cachedAdaptiveInstance) {
                instance = cachedAdaptiveInstance.get();
                if (instance == null) {
                    try {
                        //这个方法是主要的方法
                        instance = createAdaptiveExtension();
                        cachedAdaptiveInstance.set(instance);
                    } catch (Throwable t) {
                        createAdaptiveInstanceError = t;
                        throw new IllegalStateException("Failed to create adaptive instance: " + t.toString(), t);
                    }
                }
            }
        }

        return (T) instance;
    }
```
通过分析方法 ***getAdaptiveExtension*** 可以发现获取实例是通过 ***createAdaptiveExtension*** 方法。

```java
    private T createAdaptiveExtension() {
        try {
            return injectExtension((T) getAdaptiveExtensionClass().newInstance());
        } catch (Exception e) {
            throw new IllegalStateException("Can't create adaptive extension " + type + ", cause: " + e.getMessage(), e);
        }
    }
```
获取 ***getAdaptiveExtensionClass()*** 来获取类。最后生成Java类。关注一下一个私有方法：

```java
    private T createExtension(String name) {
        Class<?> clazz = getExtensionClasses().get(name);
        if (clazz == null) {
            throw findException(name);
        }
        try {
            T instance = (T) EXTENSION_INSTANCES.get(clazz);
            if (instance == null) {
                EXTENSION_INSTANCES.putIfAbsent(clazz, clazz.newInstance());
                instance = (T) EXTENSION_INSTANCES.get(clazz);
            }
            injectExtension(instance);
            Set<Class<?>> wrapperClasses = cachedWrapperClasses;
            if (CollectionUtils.isNotEmpty(wrapperClasses)) {
                //包装类的处理
                for (Class<?> wrapperClass : wrapperClasses) {
                    instance = injectExtension((T) wrapperClass.getConstructor(type).newInstance(instance));
                }
            }
            initExtension(instance);
            return instance;
        } catch (Throwable t) {
            throw new IllegalStateException("Extension instance (name: " + name + ", class: " +
                    type + ") couldn't be instantiated: " + t.getMessage(), t);
        }
    }
```
上面代码有一段处理Wrapper类。之前已经由链接说明了Dubbo中的包装类的说明(已自身为构造函数的类称为Wrapper类)。  
所以在获取 ***Protocol*** 实现的时候会记载出来 ***Protocol*** 的Wrapper类。也就是上面说的三个主要类。





