---
title: "Netty源码解析-解码器(Decoder)是如何工作"
linkTitle: "Netty源码解析-解码器(Decoder)是如何工作"
date: 2022-03-16
weight: 202203161601

---

### 1. 解码器(Decoder)概述

以类似流的方式将Bytes从一个ByteBuf中通过解码器转换成另一种消息类型

![Decoder解码](https://raw.githubusercontent.com/mxsm/picture/main/netty/decoder/Decoder%E8%A7%A3%E7%A0%81.png)

Netty中的解码器就是`ChannelInboundHandlerAdapter`的一个实现。主要是将网络中的bytes数据解码成用户需要的消息类型。

> TIps: 解码器不能使用@Sharable修饰，解码器只能单独为一个Channel进行解码，如果为多个进行解码会导致数据混乱

### 2.解码器(Decoder)如何工作

解码器的重要一个类就是`ByteToMessageDecoder` ，该类继承了`ChannelInboundHandlerAdapter` 。所以从本质上来说解码器其实就是 `ChannelInboundHandler` 。既然是`ChannelInboundHandler` 数据读取就在`ChannelInboundHandler#channelRead`方法里面：

![image-20220320144205350](https://raw.githubusercontent.com/mxsm/picture/main/netty/decoder/image-20220320144205350.png)

> Tips: 这里为什么会有一个if else的分支，原因在于如果开发者ByteToMessageDecoder设置在ServerBootstrap的ServerSocketChannel的handler，那么Object的对象类型就是SocketChannel，走的就是else分支，如果是设置在ServerBootstrap的childHandler那么那么Object的对象类型就是ByteBuf，走的就是if分支。 这里我只需要关注if分支即可

![解码器具体处理流程](https://raw.githubusercontent.com/mxsm/picture/main/netty/decoder/%E8%A7%A3%E7%A0%81%E5%99%A8%E5%85%B7%E4%BD%93%E5%A4%84%E7%90%86%E6%B5%81%E7%A8%8B.png)

#### 2.1 累加器Cumulator

`ByteToMessageDecoder` 类中有一个Cumulator接口：

```java
public abstract class ByteToMessageDecoder extends ChannelInboundHandlerAdapter {
        public interface Cumulator {
        /**
         * Cumulate the given {@link ByteBuf}s and return the {@link ByteBuf} that holds the cumulated bytes.
         * The implementation is responsible to correctly handle the life-cycle of the given {@link ByteBuf}s and so
         * call {@link ByteBuf#release()} if a {@link ByteBuf} is fully consumed.
         */
        ByteBuf cumulate(ByteBufAllocator alloc, ByteBuf cumulation, ByteBuf in);
    }
}
```

作用：累加传入的Byte数据，同时也是为了解决粘包和半包的问题。

假设我们每次解码成的数据都要是：ABCD,由于存在粘包和半包的情况，累加器会进行如下操作(以半包为例)：

![累加器的工作原理](https://raw.githubusercontent.com/mxsm/picture/main/netty/decoder/%E7%B4%AF%E5%8A%A0%E5%99%A8%E7%9A%84%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86.png)

第一次传入并不会解码出需要的Message,会将数据存入ByteToMessageDecoder的cumulation变量，第二次传入数据会将解码器的之前数据和传入的数据进行合并，cumulation中的数据就变成了如上图所示，然后进行解码就解码出了所需要的Message。然后清空cumulation中已经解码了的数据。



#### 2.2 解码器工作解析

![解码器的整个工作流程图](https://raw.githubusercontent.com/mxsm/picture/main/netty/decoder/%E8%A7%A3%E7%A0%81%E5%99%A8%E7%9A%84%E6%95%B4%E4%B8%AA%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%A8%8B%E5%9B%BE.png)

从网络中读取的bytes数组，首先经过ByteToMessageDecoder累加器处理：

![image-20220320155201164](https://raw.githubusercontent.com/mxsm/picture/main/netty/decoder/image-20220320155201164.png)

如上图1所示：累加器处理传入的数据和前一次处理剩下的数据合并到一起，然后调用解码：

![image-20220320155451061](https://raw.githubusercontent.com/mxsm/picture/main/netty/decoder/image-20220320155451061.png)

①变量是用来保存解码后的消息，②就是调用解码方法**`ByteToMessageDecoder#decode`** ：

![image-20220320155713635](https://raw.githubusercontent.com/mxsm/picture/main/netty/decoder/image-20220320155713635.png)

**`ByteToMessageDecoder#decode`** 是一个抽象方法，所以具体看解码器的实现，例如：

- RedisDecoder
- XmlDecoder

等等一些Netty实现的解码器。解码出来的结构化对象，保存在**`List<Object>`**中。当前的ChannelHandler解码完成后触发后续的ChannelHandler

![image-20220320160046448](https://raw.githubusercontent.com/mxsm/picture/main/netty/decoder/image-20220320160046448.png)

后续ChannelHandler的channelRead方法中传入的值就是解码后的Message类型，如下图ByteToMessageDecoder#fireChannelRead静态方法：

![image-20220320160201318](https://raw.githubusercontent.com/mxsm/picture/main/netty/decoder/image-20220320160201318.png)

> Tips: 
>
> - 传入的Bytefuf如何不够解码成需要类型的Message，这些bytes会被累加器保存在ByteToMessageDecoder的私有变量ByteBuf cumulation中
> - 解码多出来的同样也会被bytes会被累加器保存在ByteToMessageDecoder的私有变量ByteBuf cumulation中
> - 累加器的作用就是用来解决粘包和半包的问题。

### 3.总结

解码器的关键就是累加器，累加器的作用就是解决了数据的粘包和半包问题。数据不够解析成对应的Message将数据保存下来，等待后续的数据传入进行合并再次进行解码，当一次传入的数据过多但是又不能够完整的解析成多个(大于1)消息，将解析后的剩下的数据保存下来，等待后续的数据传入然后进行累加。这样就实现了整个解码的过程。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢