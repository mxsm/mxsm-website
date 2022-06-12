---
title: "Java并发工具-JCTools简介"
linkTitle: "Java并发工具-JCTools简介"
date: 2022-05-29
weight: 202205291143
---

很早就有人提出了无锁队列的概念，例如：[**Disruptor**](https://github.com/LMAX-Exchange/disruptor)高性能已得到生产的验证，在多个项目中例如Log4j2得到了应用和验证。在研究Netty的 **`HashedWheelTimer`** 看到有使用一个 **`MpscChunkedArrayQueue`** 队列。研究发现是使用了 [**JCTools**](https://github.com/JCTools/JCTools) 的工具。这个工具就是笔者要介绍的，这个工具的目的：旨**在提供一些JDK目前缺少的并发数据结构**

### 1. JCTools介绍

- 并发队列的SPSC/MPSC/SPMC/MPMC变体:
  - SPSC - 单生产者、单消费者 (Wait Free, 有界队列和无界队列)
  - MPSC - 多生产者、单消费者 (锁少, 有界队列和无界队列)
  - SPMC -单生产者、多消费者 (锁少, 有界队列)
  - MPMC - 多生产者、多消费者 (锁少, 有界队列)
- SPSC/MPSC 是Linked Array队列(有界和无界)提供了性能、分配和内存占用之间的平衡
- 基于MPSC/MPMC XAdd的无界链接阵列队列为生产者提供了更低的争用成本(使用XAdd而不是CAS循环)，并将队列块池化以减少分配。

### 2. JCTools使用

添加maven依赖：

```xml
<dependency>
    <groupId>org.jctools</groupId>
    <artifactId>jctools-core</artifactId>
    <version>3.3.0</version>
</dependency>
```

使用例子：

```java
public class SpscTest {

    public static void main(String[] args) throws InterruptedException {

        SpscArrayQueue<Integer> queue = new SpscArrayQueue<>(2);

        Thread producer1 = new Thread(() -> queue.offer(1));
        producer1.start();
        producer1.join();

        Thread producer2 = new Thread(() -> queue.offer(2));
        producer2.start();
        producer2.join();

        Set<Integer> fromQueue = new HashSet<>();
        Thread consumer = new Thread(() -> queue.drain(fromQueue::add));
        consumer.start();
        consumer.join();
        fromQueue.stream().forEach(item-> System.out.println(item));
    }

}
```

运行后输出的打印结果：

```shell
1
2
```

在Netty **`HashedWheelTimer`** 中主要使用的是MPSC队列。

### 3. 性能测试

在JCTools 性能测试使用的JMH。clone JCTools到本地:

```java
git clone https://github.com/JCTools/JCTools.git

cd JCTools

mvn clean package
```

然后进入 **jctools-benchmarks** 目录：

```shell
cd jctools-benchmarks
```

#### 3.1 运行JMH Benchmarks

运行所有的JMH benchmarks：

```shell
java -jar target/microbenchmarks.jar -f <number-of-forks> -wi <number-of-warmup-iterations> -i <number-of-iterations>
```

列出可使用的JMH benchmarks：

```shell
java -jar target/microbenchmarks.jar -l
```

> Tips:其他的例子可以参看https://github.com/JCTools/JCTools/tree/master/jctools-benchmarks

### 4. 总结

对于开发的项目对于性能有较高的追求可以考虑使用JCTools，根据不同生产者和消费者的数量使用不同的队列类型。这样能够最大限度的发挥性能。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！

参考文档：

- https://github.com/JCTools/JCTools/tree/master/jctools-benchmarks