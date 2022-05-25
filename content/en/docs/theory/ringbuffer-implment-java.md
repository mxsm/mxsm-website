---
title: "RingBuffer-理论篇"
linkTitle: "RingBuffer-理论篇"
date: 2022-05-24
weight: 202205242140
---

### 1. RingBuffer

RingBuffer(或Circular Buffer)是一个有边界的循环数据结构，用于在两个或多个线程之间缓冲数据。当我们继续写入到循环缓冲区时，它会在到达缓冲区末尾

#### 1.1 RingBuffer如何工作

环形缓冲区是使用一个固定大小的数组来实现的。除了数组还需要注意下面几个：

- 缓冲区中用于插入元素的下一个可用槽
- 缓冲区下一个没有被读取的元素
- 数组的末尾位置环绕到数组开始的位置，如何将数组抽象成环

![Ringbuffer1](https://github.com/mxsm/picture/blob/main/docs/theory/Ringbuffer1.png?raw=true)

首先我们需要知道的是容量——缓冲区的固定最大大小。大小最好是 **`2^n`** ，通过位运算加快定位速度。同时我们需要两个两个单调递增的序列：

- 写序列：初始值为-1，当我们插入一个数据的时候增加1
- 读序列：开始为0，当我们读取一个数据的时候增加1.

如果大小capacity是 **`2^n`** ,我们可以用以下方式映射序列和数组索引：

> index = seq & (capacity-1)

如果是缓冲大小是任意值：

> index = seq % capacity

运算操作将序列绕着边界进行包装，从而在缓冲区中派生出一个槽：

![Ringbuffer1](https://github.com/mxsm/picture/blob/main/docs/theory/RingBuffer2.png?raw=true)

#### 1.2 插入数据

我们来看一下插入一个数据到RingBuffer

```java
ringBuffer[++writer&(capacity-1)] = element
```

首先要将writer增加1，然后在插入数据。因为writer是从 **`-1`** 开始的。

#### 1.3 获取数据

获取一个数据：

```java
element = ringBuffer[reader++&(capacity-1)]
```

#### 1.4 空RingBuffer和满RingBuffer

当我们环绕数组时，我们将开始覆盖缓冲区中的数据。如果缓冲区已满，我们可以选择覆盖最旧的数据，而不管读取器是否已经使用它，或者防止覆盖尚未读取的数据。如果允许覆盖那么无需等待直接覆盖未读的数据，如果不能覆盖我们应该等待(阻塞/繁忙等待)，直到缓冲区有可用的槽。

<img src="https://github.com/mxsm/picture/blob/main/docs/theory/RingBuffer3.png?raw=true" alt="Ringbuffer3" style="zoom: 50%;" />

如果缓冲区的大小等于它的容量，而缓冲区的大小等于未读元素的数量，则缓冲区已满：

```java
size = writerIdex - readerIndex + 1 
size == capacity //如果为true容量满了，否则容量没满
```

如果读队列在写队列的后面，那么RingBuffer就没满，如果是writer和reader都是初始化状态或者两者的index相同说明就是空的状态

![RingBuffer4](https://github.com/mxsm/picture/blob/main/docs/theory/RingBuffer4.png?raw=true)

### 2 优缺点

1. 环形缓冲区是一种高效的FIFO缓冲区。它使用一个固定大小的数组，可以预先分配，并允许高效的内存访问模式。所有的缓冲区操作的时间都是O(1)，包括消耗一个元素，因为它不需要移动元素。
2. 另一方面，确定环缓冲区的正确大小也是至关重要的。例如，如果缓冲区大小不足，读取速度很慢，写操作可能会阻塞很长时间。我们可以使用动态分级，但它需要移动数据，我们将错过上面讨论的大多数优点。所有我们在实现的时候可以通过设置阈值去动态填充已经消耗掉的数据。
3. 通过对缓冲大小的设置为 **`2^n`** 通过位运算能够进一步加快数据的插入和读取。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！

