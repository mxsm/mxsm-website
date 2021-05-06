---
title: "LockSupport用法和原理"
linkTitle: "LockSupport用法和原理"
weight: 1
date: 2021-02-15
---

### 1. 前言

在AQS的底层我们了解了整个AQS的内部结构，与其独占式与共享式获取同步状态的实现。但是并没有详细描述线程是如何进行阻塞与唤醒的。我也提到了线程的这些操作都与`LockSupport`工具类有关。现在我们就一起来探讨一下该类的具体实现。

### 2. LockSupport类

**`LockSupport`** 静态方法类，下面阻塞线程和唤醒线程将方法分为两类：

- park-阻塞线程

  | 方法                                     | 说明                                                         |
  | ---------------------------------------- | ------------------------------------------------------------ |
  | park()                                   | 阻塞当前线程，如果调用unpark方法或者当前线程被中断，从能从park()方法中返回 |
  | park(Object blocker)                     | 阻塞当前线程与park()方法一样多了一个Object参数。用来记录导致线程阻塞的阻塞对象，方便进行问题排查 |
  | parkNanos(long nanos)                    | 阻塞当前线程，最长不超过nanos纳秒，增加了超时返回的特性      |
  | parkNanos(Object blocker, long nanos)    | 功能和parkNanos(long nanos)一样入参增加一个Object对象，用来记录导致线程阻塞的阻塞对象，<br />方便进行问题排查 |
  | parkUntil(long deadline)                 | 阻塞当前线程，直到deadline                                   |
  | parkUntil(Object blocker, long deadline) | parkUntil(long deadline)功能一样入参增加一个Object对象，用来记录导致线程阻塞的阻塞对象，<br />方便进行问题排查 |

  > 上面六个方法又可以两两分成一组分成三组：
  >
  > - park() 和 park(Object blocker) --- 无限期阻塞当前线程
  > -  parkNanos(long nanos)和parkNanos(Object blocker, long nanos)  --- 增加最长不超过nanos时间的阻塞
  > - parkUntil(long deadline)和parkUntil(Object blocker, long deadline) -- 增加deadline的时间阻塞

- unpark-唤醒线程

  | 方法                  | 说明                       |
  | --------------------- | -------------------------- |
  | unpark(Thread thread) | 唤醒处于阻塞状态的指定线程 |

### 3. 代码演示

对上面 方法进行代码演示。

#### 3.1 park()

![](https://github.com/mxsm/picture/blob/main/java/concurrencemultithreading/park.gif?raw=true)

#### 3.2 park(Object blocker)

![](https://github.com/mxsm/picture/blob/main/java/concurrencemultithreading/parkObject.gif?raw=true)

#### 3.3 parkNanos(long nanos)

![](https://github.com/mxsm/picture/blob/main/java/concurrencemultithreading/parkNanos.gif?raw=true)

#### 3.4 parkNanos(Object blocker, long nanos)

![](https://github.com/mxsm/picture/blob/main/java/concurrencemultithreading/parkNanosObject.gif?raw=true)

#### 3.5 parkUntil(long deadline)

![](https://github.com/mxsm/picture/blob/main/java/concurrencemultithreading/parkUntil.gif?raw=true)

#### 3.6 parkUntil(Object blocker, long deadline)

![](https://github.com/mxsm/picture/blob/main/java/concurrencemultithreading/parkUntilObject.gif?raw=true)

### 4. 带Object参数和没有的区别

首先看一下代码：

![](https://github.com/mxsm/picture/blob/main/java/concurrencemultithreading/parkdiff.png?raw=true)

然后通过Java命令查看区别

![](https://github.com/mxsm/picture/blob/main/java/concurrencemultithreading/parkConsule.png?raw=true)