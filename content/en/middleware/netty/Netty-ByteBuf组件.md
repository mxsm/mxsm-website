---
title: Netty-ByteBuf组件
categories:
  - Netty
tags:
  - Netty
abbrlink: 7217df8b
date: 2018-07-25 22:55:13
---
### ByteBuf --- netty的数据容器

网络通信涉及到字节序列的移动。高效易用的数据结构必不可少。

#### ByteBuf如何工作

**`ByteBuf`** 的布局结构和状态图：

![图解](https://github.com/mxsm/document/blob/master/image/netty/bytebuf%E7%BB%93%E6%9E%84%E5%9B%BE.png?raw=true)

**`ByteBuf`** **维护了两个不同的索引**:

- **readerIndex：** 用于读取
- **writerIndex：** 用于写入

当 **readerIndex：** >  **writerIndex** 的时候就会出现越界的异常。

名称已 **`read`** 和 **`write`** 开头的 **`ByteBuf`** 方法， 将会推进对应的索引。而以 **`get`** 和 **`set`** 开头的则不会。 **`ByteBuf`** 默认真的最大容量为  **`Integer.MAX_VALUE`** 

### ByteBuf 的使用模式

#### 1. 堆缓冲区

最常用的一种模式， **堆缓冲区** 。 **`ByteBuf`** 将数据存放在 **JVM** 的堆空间中。这种模式被叫做 **支撑数组。** 在没有使用池化的情况下提供 **快速分配和释放。** 

####  2. 直接缓冲区

JVM 实现通过本地调用来分配内存 ，内存不是分配在JVM的堆中。

**优点：** 内存分配在JVM的堆外，不受JVM的垃圾收集器的管控。有利于网络数据的传输。

**缺点：** 相对于JVM堆的缓冲区分配和释放比较昂贵

#### 3. 复合缓冲区

第三种也是最后一种模式使用的是复合缓冲区， 它为多个 ByteBuf 提供一个聚合视图。 在这里你可以根据需要添加或者删除 ByteBuf 实例，这是一个 JDK 的 ByteBuffer 实现完全缺失的特性。Netty 通过一个 ByteBuf 子类——CompositeByteBuf——实现了这个模式， 它提供了一个将多个缓冲区表示为单个合并缓冲区的虚拟表示 。

### ByteBuf字节级操作

- **随机访问索引**

- **顺序访问索引**

  下图显示了 **`ByteBuf`** 是如何被两个索引划分成为三个区域的：

  ![图解](https://github.com/mxsm/document/blob/master/image/netty/bytebuf%E8%A2%AB%E5%88%92%E5%88%86%E4%B8%BA%E4%B8%89%E4%B8%AA%E5%8C%BA%E5%9F%9F.png?raw=true)

- **可丢弃字节**

   如上图中标记为可丢弃字节的分段包含了已经被读过的字节。通过调用  **`discardReadBytes()`** 方法， 可以丢弃它们并回收空间。这个分段的初始大小为 0，存储在 readerIndex 中，会随着 read 操作的执行而增加（ get*操作不会移动 readerIndex）。但是这个可以丢弃并不是字节把已经读的字段的字节不要了，而是把尚未读的字节数移到最开始。(这样做可能会导致内存复制)

  ![图解](https://github.com/mxsm/document/blob/master/image/netty/bytebuf%E4%B8%A2%E5%BC%83%E5%B7%B2%E8%AF%BB%E5%AD%97%E6%AE%B5.png?raw=true)

- **可读字节**

- **可写字节**

- **索引管理**

  通过调用  **`markReaderIndex()`** 、  **`markWriterIndex()`** 、  **`resetWriterIndex()`** 和 **`resetReaderIndex()`** 来标记和重置  **`ByteBuf`** 的 **`readerIndex`** 和 **`writerIndex`**  。

  也可以通过调用 **`readerIndex(int)`** 或者 **`writerIndex(int)`** 来将索引移动到指定位置。 试图将任何一个索引设置到一个无效的位置都将导致一个 **`IndexOutOfBoundsException`** 。 

  ![图解](https://github.com/mxsm/document/blob/master/image/netty/bytebufclear%E8%B0%83%E7%94%A8%E4%B9%8B%E5%89%8D.png?raw=true)

  可以通过调用 clear()方法来将 readerIndex 和 writerIndex 都设置为 0。注意， **这并不会清除内存中的内容。(内容还依然存并不是全部清空数据)**

  ![图解](https://github.com/mxsm/document/blob/master/image/netty/bytebufclear%E8%B0%83%E7%94%A8%E5%90%8E.png?raw=true)

- **查找操作**

- **派生缓冲区**



