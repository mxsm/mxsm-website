---
title: "Awaitilityr同步异步工具介绍与实战"
linkTitle: "Awaitilityr同步异步工具介绍与实战"
date: 2022-08-24
weight: 202208242333
---

在编写测试用例的时候遇到有异步或者队列处理的时候经常会用到 **`Thread.sleep()`** 等待来进行测试。例如：[DLedger](https://github.com/openmessaging/dledger) 测试选举的过程。当DLedger Leader下线。此时DLedger会重新发起选举，这个选举的过程是需要一定时间。很多时候在测试代码中就会使用 **`Thread.sleep`** 。 由于选举需要的时间多少不确定所以sleep时间就会设置为开发者经验的最大值。这样会造成测试代码会变得很慢。 当然开发者可以通过自己轮询来实现减少时间的消耗。

下面介绍一个处理这个一类问题的工具：[**awaitility**](https://github.com/awaitility/awaitility)

### 1. awaitility入门

Maven：

```xml
<dependency>
      <groupId>org.awaitility</groupId>
      <artifactId>awaitility</artifactId>
      <version>xxxx</version>
      <scope>test</scope>
</dependency>
```

文章编写的时候版本为：**4.2.0**

#### 1.1 静态导入

为了有效地使用Awaitility，建议从Awaitility框架中静态地导入以下方法：

- `org.awaitility.Awaitility.*`

在使用的时候需要搭配Java的时间相关的类以及Junit相关类：

- `java.time.Duration.*`
- `java.util.concurrent.TimeUnit.*`
- `org.junit.Assert.*`

#### 1.1 简单例子

**例子1：**

```java
await().until(newUserIsAdded());
```

等待直到执行newUserIsAdded()返回true. 这个是没有返回值的。

**例子2：**

```java
await().atMost(5, SECONDS).until(newUserWasAdded());
```

最多等待5秒，等待直到执行newUserIsAdded()返回true. 这个是没有返回值的。

**例子3：**

```java
await().until( userRepositorySize(), equalTo(1) );
```

等待直到执行userRepositorySize()返回方法对应的值. 这个是有返回值

更多的例子可以[**参照官网**](https://github.com/awaitility/awaitility/wiki/Usage) 使用例子

### 2. awaitility在RocketMQ中的实战

在RocketMQ的test cases 中有一些使用了 Thread.sleep，接下来我们看看如何使用awaitility进行优化，减少测试用例的执行时间。以ControllerManagerTest测试用例为例子来解决，在代码中可以看到有这样的代码：

![image-20220824233729934](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220824233729934.png)

上图框出来的代码主要的作用是什么呢？等待Broker的Master过期，但是过期的时间我们根据设置的心跳的过期时间来预估时间。所以这里填写的是6秒当然你也可以填写10秒或者更长。

**解决之前的执行时间**：

![QQ截图20220824231856](C:\Users\mxsm\Desktop\pic\QQ截图20220824231856.jpg)

**使用awaitility对代码进行改造重构**：

![image-20220824234043745](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220824234043745.png)

重构后的代码，如上图的红线框出来部分。当然我这里还对其他的进行处理。

> 有兴趣的可以关注一下RocketMQ的这个ISSUE:https://github.com/apache/rocketmq/issues/4873

**使用awaitility重构后的执行时间**：

![QQ截图20220824231713](C:\Users\mxsm\Desktop\pic\QQ截图20220824231713.jpg)

时间有明显的下降。相比之前的下降了5秒左右。

### 3. 总结

- 在测试过程中引入awaitility能够很大程度上方便测试，无需要每次都凭经验去预估时间。并且很多时候这个Thread.sleep的时间不是很好估算。减少了单元测试执行的时间。特别是像RocketMQ这样大型的项目单元测试很多。并且很多都是去测试分布式的，如果使用Thread.sleep会导致整个单元测试的时间很长。
- 无需自己去实现轮询来减少单元测试的时间。

> 我是蚂蚁背大象([GitHub](https://github.com/mxsm)，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢