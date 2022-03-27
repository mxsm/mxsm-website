---
title: "Netty答疑解惑-Netty组件之间的关系"
linkTitle: "Netty答疑解惑-Netty组件之间的关系"
date: 2022-03-22
weight: 202203222044
---

Netty中组件有很多，在前的介绍了很多重要的组件例如： **`Bytebuf、EventLoopGroup、Channel`** 等等。组件之间有着关联关系，下面就来讲一下组件之间的关系。首先看一下Netty的线程模型：

![线程模型](https://github.com/mxsm/document/blob/master/image/netty/NettyServer%E5%A4%84%E7%90%86%E8%BF%9E%E6%8E%A5%E7%9A%84%E7%A4%BA%E6%84%8F%E5%9B%BE.png?raw=true)

通过线程模型来说明一下组件之间的关系。

### 1. EventLoop和EventLoopGroup

![EventLoop和EventLoopGroup之间的关系](https://raw.githubusercontent.com/mxsm/picture/main/netty/EventLoop%E5%92%8CEventLoopGroup%E4%B9%8B%E9%97%B4%E7%9A%84%E5%85%B3%E7%B3%BB.png)

EventLoopGroup和EventLoop是一个一对多的关系，从代码层面看：

```java
public interface EventLoop extends OrderedEventExecutor, EventLoopGroup {
    @Override
    EventLoopGroup parent();
}
```

EventLoop是EventLoopGroup的子类。也相当于是EventLoopGroup。

### 2. Channel、ChannelPipeline、ChannelHandler、ChannelHandlerContext

通过源码研究可以知道（以NioServerSocketChannel为例子），Channel创建的时候会同时创建ChannelPipeline 这里可以知道，Channel和ChannelPipeline是一一对应的关系。ChannelPipeline 内部维护了一个ChannelHandler的双向链表，同时这个双向链表继承了ChannelHandlerContext和ChannelHandler。当你往

ChannelPipeline 添加ChannelHandler的时候，首先是包装成ChannelHandlerContext，然后添加到上下文中。关系图如下：

![关系图](https://raw.githubusercontent.com/mxsm/picture/main/netty/%E5%85%B3%E7%B3%BB%E5%9B%BE.png)

上图说明了Channel、ChannelPipeline、ChannelHandler、ChannelHandlerContext四者之间的关系。

> Tips:ChannelHandler如果是单例，ChannelHandler与ChannelPipeline是1对多的关系

- Channel和ChannelPipeline是一对一的关系，Channel创建的时候绑定ChannelPipeline
- ChannelPipeline中有多个ChannelHandler，这里包括ChannelInboundHandler和ChannelOutboundHandler以及双工类型的处理器。
- ChannelHandlerContext和ChannelHandler是一对一的关系。ChannelHandler注册到ChannelPipeline的时候会包装成ChannelHandlerContext。
- ChannelPipeline中维护的双向链表是ChannelHandlerContext。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

