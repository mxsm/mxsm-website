---
title: "Java队列"
linkTitle: "Java队列"
weight: 20
date: 2021-02-04
---



### 队列(Queue)

队列（Queue）是一种经常使用的集合。Queue实际上是实现了一个先进先出（FIFO：First In First Out）的有序表。它和List的区别在于，List可以在任意位置添加和删除元素，而Queue只有两个操作：
1. 把元素添加到队列尾部
2. 把队列头部元素取出来

在Java中操作的方法：

| 操作类型 | 抛出Exception | 返回特殊值 |
| -------- | ------------- | ---------- |
| 插入元素 | add(e)        | offer(e)   |
| 删除元素 | remove()      | poll()     |
| 检查元素 | element()     | peek()     |

### 双向队列(Deque)
一个线性 collection，支持在两端插入和移除元素。名称 deque 是“double ended queue（双端队列）”的缩写。顾名思义支持双向元素操作：

| 操作类型 | 抛出Exception(头部)          | 返回特殊值(头部)   | 抛出Exception(尾部) | 返回特殊值(尾部)      |
| -------- | ---------------------------- | ------------------ | ------------------- | --------------------- |
| 插入元素 | push(e)/addFirst(e)          | offerFirst(e)      | add(e)/addLast(e)   | offer(e)/offerLast(e) |
| 删除元素 | remove()/removeFirst()/pop() | poll()/pollFirst() | removeLast()        | pollLast()            |
| 检查元素 | element()/elementFirst()     | peek()/peekFirst() | elementLast()       | peekLast()            |

### 优先队列(PriorityQueue)
PriorityQueue实现了一个优先队列：从队首获取元素时，总是获取优先级最高的元素。PriorityQueue默认按元素比较的顺序排序（必须实现Comparable接口），也可以通过Comparator自定义排序算法（元素就不必实现Comparable接口）

### 阻塞队列(BlockingQueue)

| 操作类型 | 抛出Exception | 返回特殊值 |  阻塞  |         超时         |
| -------- | :-----------: | :--------: | :----: | :------------------: |
| 插入元素 |    add(e)     |  offer(e)  | put(e) | offer(e, time, unit) |
| 删除元素 |   remove()    |   poll()   | take() |   poll(time, unit)   |
| 检查元素 |   element()   |   peek()   |        |                      |

### 阻塞队列的实现
阻塞队列实现分为两大类，有界队列和无界队列：
| 队列名称              | 底层数据结构 | 是否有界   | 备注                                                        |
| --------------------- | ------------ | ---------- | ----------------------------------------------------------- |
| ArrayBlockingQueue    | 数组         | 有界队列   | 初始化需要制定队列的大小                                    |
| LinkedBlockingQueue   | 链表         | 有界队列   | 默认最大值Integer.MAX_VALUE                                 |
| PriorityBlockingQueue | 数组         | 有界队列   | 默认大小为11，最大值Integer.MAX_VALUE - 8                   |
| DelayQueue            | 数组         | 无界队列   | 支持延时                                                    |
| SynchronousQueue      | 数组         | 不存储元素 | 同步的：一个offer必须与一个take与之相对应。负责存放不了元素 |
| LinkedTransferQueue   | 链表         | 无界队列   | 链表的无界阻塞队列                                          |
| LinkedBlockingDeque   | 链表         | 无界队列   | 双端阻塞队列                                                |