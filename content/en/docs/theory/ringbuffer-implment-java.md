---
title: "RingBuffer-实践"
linkTitle: "RingBuffer-实践"
date: 2022-05-26
weight: 202205262140
---

在前面的[《RingBuffer-理论篇》](https://juejin.cn/post/7101675006806982670) 文章中讲了RingBuffer的理论知识，下面就根据之前的理论知识来实现一个简单的RingBuffer。后续会将RingBuffer的实现应用到在笔者前一段时间写的一个分布式ID生成器的项目 [**Rain**](https://juejin.cn/post/7101675006806982670)（当前已经完成了第一个版本,有兴趣的可以关注一下），用来处理分布式ID雪花算法的缓存，进一步提高雪花算法的并发。

### 1. RingBuffer Java实现

```java
import java.util.concurrent.atomic.AtomicLong;

/**
 * desc：
 *
 * @author: mxsm
 * @Date: 2022/5/25 10:43
 * @since 1.0.0
 */
public class RingBuffer {

    static final int MAXIMUM_CAPACITY = 1 << 30;

    private int capacity;

    private volatile long writeIndex = -1;

    private AtomicLong readIndex = new AtomicLong(0);

    private long[] data;

    private int mask;

    public RingBuffer(int capacity) {
        this.capacity = ringBufferSizeFor(capacity);
        this.mask = this.capacity - 1;
        this.data = new long[this.capacity];
    }

    public boolean put(long element) {
        long interval = writeIndex - readIndex.get() + 1;
        if (interval >= capacity) {
            return false;
        }
        data[calNextIndex(++writeIndex)] = element;
        return true;
    }

    public long poll() {
        long interval = writeIndex - readIndex.get();
        if (interval < 0) {
            return -1;
        }
        return data[calNextIndex(readIndex.getAndIncrement())];
    }

    /**
     * code fork from HashMap
     *
     * @param cap
     * @return
     */
    static final int ringBufferSizeFor(int cap) {
        int n = -1 >>> Integer.numberOfLeadingZeros(cap - 1);
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
    }

    private final int calNextIndex(long wrIndex) {
        return (int) (wrIndex & mask);
    }

}

```

测试代码：

```java
public class RingBufferTest {

    public static void main(String[] args) {

        RingBuffer ringBuffer = new RingBuffer(1<<4);
        Thread producer = new Thread(new Runnable() {
            @Override
            public void run() {
                for(;;){
                    try {
                        boolean puted = ringBuffer.put(System.currentTimeMillis());
                        TimeUnit.MILLISECONDS.sleep(500);
                        if(!puted){
                            System.out.println("RingBuffer is Full");
                        }
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });
        Thread consumer = new Thread(new Runnable() {
            @Override
            public void run() {
                for(;;){
                    try {
                        long poll = ringBuffer.poll();
                        if(poll <= 0){
                            System.out.println("RingBuffer is Empty");
                        }
                        System.out.println("Poll "+ poll);
                        TimeUnit.MILLISECONDS.sleep(2000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });
        producer.start();
        consumer.start();
    }
}
```

笔者这里，生产的时间间隔小于消费的时间间隔，这样会出现RingBuffer满的情况如下图：

![RingBufferTest](C:\Users\mxsm\Desktop\pic\RingBufferTest.gif)

### 2. 代码说明

1. **writeIndex** 变量为什么是基本类型，因为这里生产者考虑的是单个线程，一个线程专门去生产数据存放到RingBuffer，这样就不存在资源的竞争关系所有无需使用原子类。
2. 循环缓冲区（Ring Buffer）的概念，其实来自于Linux内核（Maybe），是为解决某些特殊情况下的竞争问题提供了一种免锁的方法。如果生产者和消费者都是一个readIndex也可以不使用原子类，使用基本类即可。
3. 数据的数组大小是不是一定要 **`2^n`** , 答案是否定的。之前也说过通过如果是 **`2^n`** 可以通过位运算来获取到index。这样比取模的速度更快。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！

