---
title: "Java日志系统梳理-图文详解 "
linkTitle: "Java日志系统梳理-图文详解"
date: 2022-07-17
weight: 202207172228
---

### 1. 概述

平时Java开发的时候，会发现各种各样的日志框架在不同的项目中。Log之间的关系如何、如何依赖、作用。通过了解这些让我们能够在工作中更好的排查日志的问题，例如：**日志打印不出来，日志冲突等等相关问题**。 单个项目中集成多个Jar，使用的是不同的日志体系。通过了解日志的依赖关系以及实现原理将日志进行统一输出。同时可以帮助更好的基于现有的日志框架设计项目定制化的日志输出。

### 2. Log发展

**第一步：**

Java没有日志库，打印日志全凭**System.out**和**System.err** 。 这个也是平时开发过程中很多人使用的快捷打印日志的方法。这个是平时开发的过程中使用的比较多。在项目正式发布的时候大多数会删除掉。

**第二步：**

**ceki Gulcü**搞了一个日志框架 log4j(Apache项目)，Apache建议SUN公司引入Log4j但是被拒绝。Log4j使用就在后面很长一段时间内流行起来了。

**第三步：**

SUN公司推出直接的JDK层面的日志标准库JUL（Java Util Logging），笔者没用过，只是在开发一些框架的时候可能会用到这个。这个优点就是JDK集成无需引入其他的Jar包。缺点就是不怎么好用。所以用的人比较少也不流行。

**第四步:**

Apache 推出日志抽象(Logging Facade) **JCL** (Jakarta Commons Logging), 支持运行时动态加载日志实现。例如加载Log4j,然后基于JCL的标准实现日志系统。

**第五步:**

**ceki Gulcü**l离开Apache组织后觉得JCL不好用就重新搞了一套 **Logging Facade** 也就是现在比较流行的 **SL4J** 。同时基于SL4J的日志标准实现了**logback** （logback现在是Spring默认的日志输出）。 这个日志标准也是现在众多项目中使用的日志标准。

### 3. 日志框架类别

通过上面可以看出来日志框架主要分为两类：

- **标准接口类型**

  1. **JCL**:Apache基金会所属的项目，是一套Java日志接口，之前叫Jakarta Commons Logging，后更名为Commons Logging
  2. **SLF4J**:  是一套简易Java日志Facade，**本身并无日志的实现**。（Simple Logging Facade for Java，缩写Slf4j）

  这种也叫作 **`Facade`** ，也就是只提供接口，没有具体实现。开发者可以基于日志标准接口提供的规范自己实现一套。例如 **`SLF4J`** 的实现就有 **`Logback`** 日志框架。

- **底层日志实现框架**

  这一类框架主要基于日志的标准接口规范实现或者就是单纯的实现不依赖任何标准，**Log4j/Log4j2、Logback、JUL** 这四个实现是比较常用的日志实现。有基于日志的标准接口实现例如：Logback基于SLF4J，也有就是单纯的实现例如：JUL。

在项目中使用也以下两种情况：

**第一种：通过引入标准接口和具体的实现来打印记录日志**

<img src="https://raw.githubusercontent.com/mxsm/picture/main/java/log/Java%E5%B8%B8%E7%94%A8%E7%9A%84%E6%97%A5%E5%BF%97%E7%BB%84%E4%BB%B6%E5%85%B3%E7%B3%BB.png" alt="Java常用的日志组件关系" style="zoom:80%;" />

**第二种：直接引入底层的具体实现来打印记录日志**

<img src="https://raw.githubusercontent.com/mxsm/picture/main/java/log/%E7%9B%B4%E6%8E%A5%E6%97%A5%E5%BF%97%E5%AE%9E%E7%8E%B0.png" alt="直接日志实现" style="zoom:80%;" />



### 4. 日志系统依赖关系

日志Facade，通过适配器以及桥接的方式将日志实现全部连接起来。通过图来直观的展示各个日志之间的关系以及日志之前依赖和桥接

![日志标准接口的链接关系图](https://raw.githubusercontent.com/mxsm/picture/main/java/log/%E6%97%A5%E5%BF%97%E6%A0%87%E5%87%86%E6%8E%A5%E5%8F%A3%E7%9A%84%E9%93%BE%E6%8E%A5%E5%85%B3%E7%B3%BB%E5%9B%BE.png)

主要通过适配器和桥接的方式将不同的日志进行连接起来。通过上图的关系可以发现，不同日志框架之间都是可以互相转换的。例如SLF4J和Log4j2是可以通过引入不同的适配或者桥接的Jar包来实现互相转换。通过图上的依赖关系就能很清楚的知道需要引入哪些依赖包。

然后分别看一下现在流行的两个日志框架：Log4j2以及SLF4J

#### 4.1 Log4j2

对于Log4j2需要哪些jar文件，至少需要两个

```xml
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-api</artifactId>
    <version>2.18.0</version>
</dependency>
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-core</artifactId>
    <version>2.18.0</version>
</dependency>
```

如果您的应用程序调用另一个日志记录框架的API，并且您希望将日志记录调用路由到log4j2实现,需要增加如下(图片来源[Log4j2官网](https://logging.apache.org/log4j/2.x/index.html))：

![](https://raw.githubusercontent.com/mxsm/picture/main/java/log/whichjar-2.x.png)

同时可以使用 log4j-to-slf4j 将Log4j2 API路由到SLF4J的实现上面，比如logback日志系统。如下(图片来源[Log4j2官网](https://logging.apache.org/log4j/2.x/index.html))：

![](https://raw.githubusercontent.com/mxsm/picture/main/java/log/whichjar-slf4j-2.x.png)

同时还可以将Log4j桥接到Log4j2. 只需要将 **`Log4j 1.x jar`** 替换成 **`log4j-1.2-api.jar`**。

![图片来源Apache官网](https://raw.githubusercontent.com/mxsm/picture/main/java/log/whichjar-log4j-1.2-api.png)

从上面可以看出来不管你使用的是那种Log API都可以通过桥接或者适配的方式最后由Log4j2实现。同时也可以将 **`Log4j2`** 的API桥接成为 **`SLF4J API`** .与此同时就可以使用SLF4J的底层日志实现来纪录日志。

#### 4.2 SLF4J

**`SLF4J`** 是一个 **`Facade`** , 从2.0.0版本开始，SLF4J绑定被称为提供程序。尽管如此，总体思路还是一样的。SLF4J API版本2.0.0依赖ServiceLoader机制来查找日志记录后端，总的思想图解如下(图片来源[SLF4J官网](https://www.slf4j.org/manual.html))：

![](https://raw.githubusercontent.com/mxsm/picture/main/java/log/concrete-bindings.png)

直接实现的有如下框架：

- [Logback](https://logback.qos.ch/)
- [LogEvents](https://github.com/jhannes/logevents)
- SLF4J Simple
- SLF4J nop

通过桥接适配的方式能够使用大多数的底层日志框架，例如 Log4j、Log4j2等等

### 5. 总结

日志的使用有两种方式：

- 直接使用底层实现的日志框架
- 用日志Facade,然后通过桥接的方式来使用底层的日志框架或者使用实现了日志Facade日志框架

日志框架之前的相互转换主要是通过桥接或者适配的方式来实现。如果一个项目引入了另一个项目但是两个项目使用的日志框架不一样，首先确定要使用哪个底层的日志框架。然后排除另一个不是选中底层的日志框架。加上适当的桥接jar即可

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

参考资料

- https://www.slf4j.org/docs.html
- https://logging.apache.org/log4j/2.x/
- https://logback.qos.ch/
