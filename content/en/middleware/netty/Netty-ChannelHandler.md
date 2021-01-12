---
title: Netty-ChannelHandler组件
categories:
  - Netty
tags:
  - Netty
abbrlink: b8798a09
date: 2018-09-15 20:00:56
---
### Channel的生命周期

| 状态                | 描述                                                         |
| ------------------- | ------------------------------------------------------------ |
| ChannelUnregistered | Channel 已经被创建，但还未注册到 EventLoop                   |
| ChannelRegistered   | Channel 已经被注册到了 EventLoop                             |
| ChannelActive       | Channel 处于活动状态(已经连接到它的远程节点)。它现在可以接收和发送数据了 |
| ChannelInactive     | Channel没有连接到远程节点                                    |

当这些状态发生改变的时候，将会生成对应的事件。这些事件会被转发给 **`ChannelPipeline`**  中的  **`ChannelHandler`**  其可以随后对他们做出响应。

![图解](https://github.com/mxsm/document/blob/master/image/netty/channel%E4%BA%8B%E4%BB%B6%E7%9A%84%E5%8F%98%E5%8C%96.jpg?raw=true)

### ChannelHandler的生命周期

| 类型            | 描述                                                  |
| --------------- | ----------------------------------------------------- |
| handlerAdded    | 当把 ChannelHandler 添加到 ChannelPipeline 中时被调用 |
| handlerRemoved  | 当从 ChannelPipeline 中移除 ChannelHandler 时被调用   |
| exceptionCaught | 当处理过程中在 ChannelPipeline 中有错误产生时被调用   |

**`Netty`** 定义了下面两个重要的 **`ChannelHandler`**  子接口：

- **ChannelInboundHandler** — 处理 **入站** 数据以及各种状态变化
- **ChannelOutboundHandler** — 处理 **出站** 数据并且允许拦截所有的操作

#### ChannelInboundHandler 接口

| 类型                      | 描述                                                         |
| ------------------------- | ------------------------------------------------------------ |
| channelRegistered         | 当 Channel 已经注册到它的 EventLoop 并且能够处理 I/O 时被调用 |
| channelUnregistered       | 当 Channel 从它的 EventLoop 注销并且无法处理任何 I/O 时被调用 |
| channelActive             | 当 Channel 处于活动状态时被调用;Channel 已经连接/绑定并且已经就绪 |
| channelInactive           | 当 Channel 离开活动状态并且不再连接它的远程节点时被调用      |
| channelReadComplete       | 当Channel上的一个读操作完成时被调用                          |
| channelRead               | 当从 Channel 读取数据时被调用                                |
| ChannelWritabilityChanged | 当Channel的可写状态发生改变时被调用。用户可以确保写操作不会完成得太快(以避免发生 OutOfMemoryError)或者可以在 Channel 变为再次可写时恢复写入。可以通过调用Channel的isWritable()方法来检测Channel 的可写性。与可写性相关的阈值可以通过Channel.config().setWriteHighWaterMark()和 Channel.config().setWriteLowWaterMark()方法来设置 |
| userEventTriggered        | 当 ChannelnboundHandler.fireUserEventTriggered()方法被调用时被调用，因为一个 POJO 被传经了 ChannelPipeline |

#### ChannelOutboundHandler 接口

| 类型                                                         | 描述                                                |
| ------------------------------------------------------------ | --------------------------------------------------- |
| bind(ChannelHandlerContext,SocketAddress,ChannelPromise)     | 当请求将 Channel 绑定到本地地址时被调用             |
| connect(ChannelHandlerContext,SocketAddress,SocketAddress,ChannelPromise) | 当请求将 Channel 连接到远程节点时被调用             |
| disconnect(ChannelHandlerContext,ChannelPromise)             | 当请求将 Channel 从远程节点断开时被调用             |
| close(ChannelHandlerContext,ChannelPromise)                  | 当请求关闭 Channel 时被调用                         |
| deregister(ChannelHandlerContext,ChannelPromise)             | 当请求将 Channel 从它的 EventLoop 注销时被调用      |
| read(ChannelHandlerContext)                                  | 当请求从 Channel 读取更多的数据时被调用             |
| flush(ChannelHandlerContext)                                 | 当请求通过 Channel 将入队数据冲刷到远程节点时被调用 |
| write(ChannelHandlerContext,Object,ChannelPromise)           | 当请求通过 Channel 将数据写到远程节点时被调用       |

#### ChannelHandler的适配器

![图解](https://github.com/mxsm/document/blob/master/image/netty/ChannelHandlerAdapter.jpg?raw=true)

#### 资源管理

**泄露级别的检测：**

| 级别     | 描述                                                         |
| -------- | ------------------------------------------------------------ |
| DISABLED | 禁用泄漏检测。只有在详尽的测试之后才应设置为这个值           |
| SIMPLE   | 使用 1%的默认采样率检测并报告任何发现的泄露。这是默认级别，适合绝大部分的情况 |
| ADVANCED | 使用默认的采样率，报告所发现的任何的泄露以及对应的消息被访问的位置 |
| PARANOID | 类似于ADVANCED，但是其将会对每次(对消息的)访问都进行采样。这对性能将会有很大的影响，应该只在调试阶段使用 |

属性表中的值可以通过： **`java -Dio.netty.leakDetectionLevel=ADVANCED`** 来进行设置。

### ChannelPipeline 接口

**`ChannelPipeline`** 是一个拦截流经 **`Channel`** 的入站和出站事件的 **ChannelHandler** 实例链。下图为 **`Netty-4.1.17`** 中给出来的示意图：

![图解](https://github.com/mxsm/document/blob/master/image/netty/ChannelPipelineJDK%E4%B8%AD%E7%A4%BA%E6%84%8F%E5%9B%BE.jpg?raw=true)

每一个新创建的 **`Channel`** 都将会被分配一个新的 **`ChannelPipeline`** 。这项关联是永久性的在整个生命周期当中。 **`Channel`** 既不能附加另外一个  **`ChannelPipeline`** ，也不能分离其当前的。在 **`Netty`** 组件的生命周期中，这一项固定的操作，不需要开发人员的任何干预。

根据事件的起源( **出站还是入站** ) 事件将会被 **`ChannelInboundHandler`** 或 **`ChannelOutboundHandler`**  处理。随后通过调用 **`ChannelHandlerContext`** 实现，它将被转发给同一超类型的下一个 **`ChannelHandler`**  。下图展示了事件如何在 **`ChannelPipeline`** 中传播

![图解](https://github.com/mxsm/document/blob/master/image/netty/ChannelPipeline.jpg?raw=true)

在 **`ChannelPipeline`** 传播事件的时候，他会测试 **`ChannelPipeline`** 的下一个 **`ChannelHandler`** 的类型是否和事件的运动方向相匹配。如果不匹配， **`ChannelPipeline`** 将跳过该 **`ChannelHandler`** 前进到下一个，直到找到和该事件所期望的方向相匹配的为止。 注意： **ChannelHandler 也可以同时实现 ChannelInboundHandler 接口和 ChannelOutboundHandler 接口**  

#### 修改ChannelPipeline

**`ChannelHandler`**  可以通过添加、删除或者替换其他的 **`ChannelHandler`** 来实时地修改 **`ChannelPipeline`** 布局，这就是 **`ChannelHandler`** 最重要的能力之一。

| 名称                                | 描述                                                         |
| ----------------------------------- | ------------------------------------------------------------ |
| addFrist,addBefore,addAfter,addLast | 将一个ChannelHandler添加到ChannelPipeline中                  |
| remove                              | 将一个 ChannelHandler 从 ChannelPipeline 中移除              |
| replace                             | 将 ChannelPipeline 中的一个 ChannelHandler 替换为另一个 ChannelHandler |

添加处理器：

```java
channel.pipeline().
addLast("frameDecoder", new ImMessageFrameDecoder()).
addLast("protoDecoder", new ProtobufDecoder(ImMessageProto.ImMessage.getDefaultInstance())).
addLast("frameEncoder", new ProtobufVarint32LengthFieldPrepender()).
addLast("protoEncoder", new ProtobufEncoder()).
addLast("imHandler", new ImHandler());
```

删除处理器：

```java
 ChannelHandler protoEncoder = ctx.channel().pipeline().remove("protoEncoder");
 ChannelHandler frameEncoder = ctx.channel().pipeline().remove("frameEncoder");
```

#### 事件触发

**`ChannelPipeline`** 的 **API** 公开了用于调用入站和出站操作的附加方法。

**入站操作的方法：**

```
方法：fireChannelRegistered
作用：调用 ChannelPipeline 中下一个 ChannelInboundHandler 的channelRegistered(ChannelHandlerContext)方法
```

```
方法：fireChannelUnregistered
作用：调用 ChannelPipeline 中下一个 ChannelInboundHandler 的 channelUnregistered(ChannelHandlerContext)方法
```

```
方法：fireChannelActive
作用：调用 ChannelPipeline 中下一个 ChannelInboundHandler 的 channelActive(ChannelHandlerContext)方法
```

```
方法：fireChannelInactive
作用：调用 ChannelPipeline 中下一个 ChannelInboundHandler 的channelInactive(ChannelHandlerContext)方法
```

```
方法：fireExceptionCaught
作用：调用 ChannelPipeline 中下一个 ChannelInboundHandler 的exceptionCaught(ChannelHandlerContext, Throwable)方法
```

```
方法：fireUserEventTriggered
作用：调用 ChannelPipeline 中下一个 ChannelInboundHandler 的userEventTriggered(ChannelHandlerContext, Object)方法
```

```
方法：fireChannelRead
作用：调用 ChannelPipeline 中下一个 ChannelInboundHandler 的channelRead(ChannelHandlerContext, Object msg)方法
```

```
方法：fireChannelReadComplete
作用：调用 ChannelPipeline 中下一个 ChannelInboundHandler 的channelReadComplete(ChannelHandlerContext)方法
```

```
方法：firechannelWritabilityChanged
作用：调用 ChannelPipeline 中下一个 ChannelInboundHandler 的  channelWritabilityChanged(ChannelHandlerContext)方法
```

在出站操作这边，处理事件会将导致底层的套接字上发生一系列的动作，

**出站操作：**

```
方法：bind
作用：将 Channel 绑定到一个本地地址，这将调用 ChannelPipeline 中的下一个ChannelOutboundHandler 的 bind(ChannelHandlerContext, SocketAddress, ChannelPromise)方法
```

```
方法：connect
作用：将 Channel 连接到一个远程地址，这将调用 ChannelPipeline 中的下一个ChannelOutboundHandler 的 connect(ChannelHandlerContext, SocketAddress, ChannelPromise)方法
```

```
方法：disconnect
作用：将 Channel 断开连接。这将调用 ChannelPipeline 中的下一个 ChannelOutboundHandler 的 disconnect(ChannelHandlerContext, Channel Promise)方法
```

```
方法：close
作用：将 Channel 关闭。这将调用 ChannelPipeline 中的下一个 ChannelOutboundHandler 的 close(ChannelHandlerContext, ChannelPromise)方法
```

```
方法：deregister
作用：将 Channel 从它先前所分配的 EventExecutor(即 EventLoop)中注销。这将调用 ChannelPipeline 中的下一个 ChannelOutboundHandler 的 deregister(ChannelHandlerContext, ChannelPromise)方法
```

```
方法：flush
作用：冲刷 Channel 所有挂起的写入。这将调用 ChannelPipeline 中的下一个 ChannelOutboundHandler 的 flush(ChannelHandlerContext)方法
```

```
方法：write
作用：将消息写入 Channel。这将调用 ChannelPipeline 中的下一个 ChannelOutboundHandler 的 write(ChannelHandlerContext, Object msg, ChannelPromise)方法。注意:这并不会将消息写入底层的 Socket，而只会将它放入队列中。要将它写入 Socket，需要调用 flush()或者 writeAndFlush()方法
```

```
方法： writeAndFlush
作用： 这是一个先调用write()方法再接着调用flush()方法的便利方法
```

```
方法：read
作用：请求从 Channel 中读取更多的数据。这将调用 ChannelPipeline 中的下一个ChannelOutboundHandler 的 read(ChannelHandlerContext)方法
```

**总结：**

![图解](https://github.com/mxsm/document/blob/master/image/netty/ChannelPipeline%E7%BB%A7%E6%89%BF%E5%9B%BE-netty4-1.17.jpg?raw=true)

- **Channel创建的时候同时会创建ChannelPipeline并且进行绑定**
- **ChannelPipeline 保存了与 Channel 相关联的 ChannelHandler;**
- **ChannelPipeline 可以根据需要，通过添加或者删除 ChannelHandler 来动态地修改**
- **ChannelPipeline 有着丰富的 API 用以被调用，以响应入站和出站事件。**

### ChannelHandlerContext 接口

**`ChannelHandlerContext`** 代表了 **`ChannelHandler`** 和 **`ChannelPipeline`** 之间的关联，每当有 **`ChannelHandler`** 添加到 **`ChannelPipeline`** 中时，都会创建 **`ChannelHandlerContext`** 。**`ChannelHandlerContext`** 的主要功能是管理它所关联的 **`ChannelHandler`** 和在同一个 **`ChannelPipeline`** 中的其他 **`ChannelHandler`** 之间的交互。(**只要有ChannelHandler的添加就会创建ChannelHandlerContext**)

**`ChannelHandlerContext`** 和 **`Channel`** 以及 **`ChannelPipeline`** 有一些相同的方法。这些方法区别在哪。

- 如果调用 **`Channel`** 或者 **`ChannelPipeline`** 上的这些方法，它们将沿着整个 **`ChannelPipeline`** 进行传播。而调用位于 **`ChannelHandlerContext`** 上的相同方法，则将从当前所关联的 **`ChannelHandler`** 开始，并且只会传播给位于该 **`ChannelPipeline`** 中的下一个能够处理该事件的 **`ChannelHandler`** 。(**事件传播的范围不一样**)

使用 **`ChannelHandlerContext`** 的 **API** 的时候牢记以下两点：

- **`ChannelHandlerContext`** 和 **`ChannelHandler`** 之间的关联(绑定)是永远不会改变的，所以缓存对它的引用是安全的。
- 相对于其他类的同名方法，**`ChannelHandlerContext`** 的方法将产生更短的事件流，应该尽可能地利用这个特性来获得最大的性能。 

下面看一下 **`ChannelHandlerContext`** 、 **`Channel`** 和 **`ChannelPipeline`** 的关系图：

![图片](https://github.com/mxsm/document/blob/master/image/netty/context-Channel-pipeline%E4%B8%89%E8%80%85%E5%85%B3%E7%B3%BB%E5%9B%BE.jpg?raw=true)

下面看一下调用Channel 和 ChannelPipeline的方法导致写入事件从尾端到头部地流经 ChannelPipeline示意图：

![图解](https://github.com/mxsm/document/blob/master/image/netty/Channel-ChannelPipeline%E4%BA%8B%E4%BB%B6%E4%BC%A0%E6%92%AD%E5%9B%BE.jpg?raw=true)

**注意：重要的是要注意到，虽然被调用的 Channel 或 ChannelPipeline 上的 write()方法将一直传播事件通**
**过整个 ChannelPipeline，但是在 ChannelHandler 的级别上，事件从一个 ChannelHandler到下一个 ChannelHandler 的移动是由 ChannelHandlerContext 上的调用完成的。**

下面看一下 **`ChannelHandlerContext`** 事件被传播示意图：

![图解](https://github.com/mxsm/document/blob/master/image/netty/ChannelHandlerContext%E8%A7%A6%E5%8F%91%E7%9A%84%E6%93%8D%E4%BD%9C%E6%B5%81%E7%A8%8B%E4%BA%8B%E4%BB%B6%E4%BC%A0%E6%92%AD.jpg?raw=true)

### 总结：

- **Channel的生命周期以及ChannelPipeline的生命周期— 这两个生命周期是同生死**
- **Channel ChannelPipeline 以及 ChannelHandlerContext 事件传播范围**
- **Channel ChannelPipeline 以及 ChannelHandlerContext 三者之间的关系**

