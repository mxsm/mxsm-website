---
title: "Dubbo隐式参数"
linkTitle: "Dubbo隐式参数"
weight: 20
description: "通过 Dubbo 中的 Attachment 在服务消费方和提供方之间隐式传递参数"
date: 2021-02-01
---

> Dubbo版本：2.7.8

### 1. 隐式参数

通过 Dubbo 中的 Attachment 在服务消费方和提供方之间隐式传递参数。

可以通过 `RpcContext` 上的 `setAttachment` 和 `getAttachment` 在服务消费方和提供方之间进行参数的隐式传递。

> **`path`**, **`interface`** ,**`group`** ,**`version`** ,**`dubbo`** ,**`token`** ,**`timeout`** ,**`_TO`** ,**`async`** ,**`dubbo.tag`** ,**`dubbo.force.tag`** 保留字段，请使用其它值。保留字段的代码可以查看 **`ContextFilter`**

![原理图示](https://github.com/mxsm/picture/blob/main/dubbo/context.png?raw=true)

### 2.在服务消费方端设置隐式参数

`setAttachment` 设置的 KV 对，在完成下面一次远程调用会被清空，即多次远程调用要多次设置。

```java
RpcContext.getContext().setAttachment("index", "1"); // 隐式传参，后面的远程调用都会隐式将这些参数发送到服务器端，类似cookie，用于框架集成，不建议常规业务使用
xxxService.xxx(); // 远程调用
// ...
```

### 3. 在服务提供方端获取隐式参数

```java
public class XxxServiceImpl implements XxxService {
 
    public void xxx() {
        // 获取客户端隐式传入的参数，用于框架集成，不建议常规业务使用
        String index = RpcContext.getContext().getAttachment("index"); 
    }
}
```

### 4. RpcContext源码解析

通过 **RpcContext.getContext().setAttachment("index", "1")** 方法来从这里入手分析一下

```java
    public static RpcContext getContext() {
        return LOCAL.get();
    }

    public RpcContext setAttachment(String key, String value) {
        return setObjectAttachment(key, (Object) value);
    }

    @Experimental("Experiment api for supporting Object transmission")
    public RpcContext setObjectAttachment(String key, Object value) {
        if (value == null) {
            attachments.remove(key);
        } else {
            attachments.put(key, value);
        }
        return this;
    }
```

通过上面代码可以看出来从 LOCAL变量中获取RpcContext, 然后设置数据到attachments(Map类型，Key 为String,Value为Object)变量中。这个变量属于RpcContext的私有变量。

在RpcContext中存在两个静态变量：

- LOCAL

  保存请求的RpcContext

- SERVER_LOCAL

  保存响应的RpcContext

**`InternalThreadLocal`** 是Dubbo内部实现的一个本地线程变量保存数据和Java的ThreadLocal有异曲同工之妙。

