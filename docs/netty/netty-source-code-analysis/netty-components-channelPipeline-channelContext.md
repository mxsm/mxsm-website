---
title: "Netty组件-ChannelHandlerContext和ChannelPipeline"
linkTitle: "Netty组件-ChannelHandlerContext和ChannelPipeline"
date: 2022-03-18
weight: 202203182301
---

Netty的组件中还有两个重要的组件：`ChannelHandlerContext` 和 `ChannelPipeline` ，这两个组件经常搭配一起使用，下面结合源码来讲讲这两个组件如何在Netty中发挥作用的。

### 1. ChannelHandlerContext

`ChannelHandlerContext` 允许 `ChannelHandler` 和 `ChannelHandler` 所在的 `ChannelPipeline` (这个下面进行介绍)以及 `ChannelPipeline` 拥有的其他Handlers进行交互。通知所在 `ChannelPipeline` 中下一个 `ChannelHandler`  ,同时也可以动态修改其所属的 `ChannelPipeline`

- 通知：通知同一个ChannelPipeline中临近的ChannelHandler，通过调用ChannelHandlerContext提供的方法
- 修改ChannelPipeline：可以获取到当前ChannelHandlerContext所属的ChannelPipeline，应用可以在运行时动态的往ChannelPipeline中添加、删除、或者替换ChannelHandler
- 存储一些状态信息

> Tips: 一个ChannelHandler可以拥有多个ChannelHandlerContext,原因在于：一个ChannelHandler可以被添加到多个ChannelPipeline，因此一个单例的ChannelHandler被添加到了多个ChannelPipeline上面就可以被多个ChannelHandlerContext调用。

划重点：

![ChannelHandlerContext划重点](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelPipeline/ChannelHandlerContext%E5%88%92%E9%87%8D%E7%82%B9.png)

### 2.ChannelPipeline

ChannelPipeline是一个ChannelHandlers列表，用于处理或拦截Channel的入站事件和出站操作。ChannelPipeline实现了拦截过滤器模式的高级形式，让用户完全控制如何处理事件，以及管道中的ChannelHandlers如何交互。ChannelPipeline在netty中只有一个实现就是 `DefaultChannelPipeline`

#### 2.1ChannelPipeline创建

当Channel创建的时候ChannelPipeline自动创建。

```java
//AbstractChannel
protected AbstractChannel(Channel parent) {
    this.parent = parent;
    id = newId();
    unsafe = newUnsafe();
    pipeline = newChannelPipeline();
}
protected DefaultChannelPipeline newChannelPipeline() {
    return new DefaultChannelPipeline(this);
}
```

#### 2.2 Event如何在ChannelPipeline流转

Event在ChannelPipeline流转示意图如下：

![ChannelPipeline事件流转](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelPipeline/ChannelPipeline%E4%BA%8B%E4%BB%B6%E6%B5%81%E8%BD%AC.png)

入站事件从下往上执行如上图，入栈事件通常由I/O线程生成入栈数据,入站数据通常是通过实际的输入操作(如SocketChannel.read(ByteBuffer))从远程读取。如果入站事件超出了顶部的入站处理程序，则会将其静默丢弃，或者在需要注意时将其记录下来。

出站事件从上往下处理。出站处理程序通常生成或转换出站流量，比如写请求。如果出站事件超出底部出站处理程序，则由与Channel关联的I/O线程处理。I/O线程通常执行实际的输出操作，例如SocketChannel.write(ByteBuffer)

#### 2.3 ChannelPipeline组织ChannelHandler的方式

![ChannelPipeline中ChannelHandlerdler的组织方式](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelPipeline/ChannelPipeline%E4%B8%ADChannelHandlerdler%E7%9A%84%E7%BB%84%E7%BB%87%E6%96%B9%E5%BC%8F.png)

通过一个双向的ChannelHandlerContext队列来组织ChannelHandler，当ChannelHandler被添加到ChannelPipeline的时候首先会被包装成ChannelHandlerContext。然后插入到链表中。

> Tips: ChannelPipeline是线程安全的，官方还给出了这样的一个建议：如果开发者的业务逻辑全部都是异步或者执行时间非常短就不需要一个特殊的EventLoopGroup
>
> ```java
> pipeline.addLast(group, "handler", new MyBusinessLogicHandler())
> ```

#### 2.4 Event流转ChannelHandler执行的顺序

```java
ChannelPipeline p = ....;
p.addLast("1", new InboundHandlerA()); //实现了ChannelInboundHandler
p.addLast("2", new InboundHandlerB()); //实现了ChannelInboundHandler
p.addLast("3", new OutboundHandlerA()); //实现了ChannelOutboundHandler
p.addLast("4", new OutboundHandlerB()); //实现了ChannelOutboundHandler
p.addLast("5", new InboundOutboundHandlerX()); //实现了ChannelInboundHandler和实现了ChannelOutboundHandler
```

上述代码ChannelPipeline中的ChannelHandler的链表顺序：head&lt;--- 1  &lt;--- 2 &lt;--- 3 &lt;--- 4 &lt;--- 5 &lt;--- tail。

入站的执行顺序： 1、2、5

入站的执行顺序：5、4、3

### 3. 总结

- ChannelPipeline与Channel的关系是一对一的关系，ChannelPipeline是在Channel创建的时候自动创建。
- 当ChannelHandler是单例模式的时候，一个ChannelHandler可以对应多个ChannelPipeline，是一个1对多的关系
- Channel创建时候自动创建ChannelPipeline实现Channel和ChannelPipeline的绑定，然后往ChannelPipeline中绑定ChannelHandler

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢
