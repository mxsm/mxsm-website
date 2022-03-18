---
title: "Netty源码解析-累加器(Cumulator)处理粘包半包问题"
linkTitle: "Netty源码解析-累加器(Cumulator)处理粘包半包问题"
date: 2022-03-17
weight: 202203172230
---

### 1.前言

Netty将网络中的bytes数据转换成对应的消息数据，这个在Netty中叫做解码过程。在基于流的传输(如TCP/IP)中，接收到的数据存储在套接字接收缓冲区中。不幸的是，基于流的传输的缓冲区不是包队列，而是字节队列。这意味着，即使您将两个消息作为两个独立的包发送，操作系统也不会将它们视为两个消息，而只是将它们视为一串字节。因此，不能保证您所读的内容与远程同行所写的内容完全一致。而Netty中的累加器就是为了解决这个问题。我们将从一下几个方面结合来分析

![Netty累加器](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/Netty%E7%B4%AF%E5%8A%A0%E5%99%A8.png)

### 2.什么是粘包、半包

**粘包：比如发送方应该发送ABC、DEF,接收方期望接收到的是ABC、DEF。但是由于粘包可能接收到的是ABCDEF**

![粘包示意图](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/%E7%B2%98%E5%8C%85%E7%A4%BA%E6%84%8F%E5%9B%BE.png)

**半包：比如发送方应该发送ABCDEF,接收方期望接收到的是ABCDEF。但是由于存在半包的情况可能接收到的是ABC、DEF**

![半包示意图](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/%E5%8D%8A%E5%8C%85%E7%A4%BA%E6%84%8F%E5%9B%BE.png)

### 3.如何导致粘包、半包

应用A发送消息给应用B的过程：

1. 应用A把流数据发送到TCP发送缓冲区。
2. TCP发送缓冲区把数据发送到达B服务器TCP接收缓冲区。
3. 应用B从TCP接收缓冲区读取流数据。

![TCP半包、粘包产生的原因](https://raw.githubusercontent.com/mxsm/picture/main/netty/channelhandler/TCP%E5%8D%8A%E5%8C%85%E3%80%81%E7%B2%98%E5%8C%85%E4%BA%A7%E7%94%9F%E7%9A%84%E5%8E%9F%E5%9B%A0.png)

**粘包的原因:**

- 发送方每次写入数据 < Socket缓冲区大小
- 接收方读取Socket缓冲区数据不够及时

**半包的原因：**

- 发送方每次写入数据 > Socket缓冲区大小
- 发送的数据大于协议的 MTU (Maximum Transmission Unit，最大传输单元)，因此必须拆包

### 4.解码器中的累加器如何解决粘包半包

对于Netty解码器来说，粘包表示bytes转换成一个需要的消息Message后还会有省下的bytes。而半包就是bytes不够解码成Message。需要将当前的存下来等待新的数据配合上次读取的进行解码。而Netty的解码器中的累加器就是实现这个功能。

```java
    public interface Cumulator {
        /**
         * Cumulate the given {@link ByteBuf}s and return the {@link ByteBuf} that holds the cumulated bytes.
         * The implementation is responsible to correctly handle the life-cycle of the given {@link ByteBuf}s and so
         * call {@link ByteBuf#release()} if a {@link ByteBuf} is fully consumed.
         */
        ByteBuf cumulate(ByteBufAllocator alloc, ByteBuf cumulation, ByteBuf in);
    }
```

> Tips: Cumulator是 ByteToMessageDecoder的内部接口。

Netty中`Cumulator` 有两个实现：

- MERGE_CUMULATOR(默认)

  采用的是内存复制，如果累加的ByteBuf比输入的ByteBuf小，那就需要扩容，再复制输入的ByteBuf到类的Byteful中。

- COMPOSITE_CUMULATOR

  使用CompositeByteBuf，通过将bytebuf添加到CompositeByteBuf来累积bytebuf，因此尽可能不进行内存复制

累加的ByteBuf作为解码器的变量。这个就保存了没有被解码的bytes。然后后续传入的bytes就合并到累加的ByteBuf上面。然后根据拆包的规范，例如按照固定长度。那就读取固定的长度的bytes。不够就再次等待累加。

### 5. 总结

Netty巧妙的运用累加器将未解码的ByteBuf保存到解码器的ByteBuf变量。后续进入的ByteBuf和已经累加的进行合并然后再次进行解码。如此往复就完成了。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢