---
title: "如何优雅有效的记录日志"
linkTitle: "如何优雅有效的记录日志"
date: 2021-11-25
weight: 202111250939

---

操作日志在每一个系统中都普遍存在，系统中都有一套自己记录日志的API与之想配套。而对于不同的系统日志又不近相同。大体可以分为两类：

- 系统日志

  主要用于开发者问题排查和一些信息打印方便调试和问题排查的日志。打印在日志文件中

- 业务日志

  有一定的业务规则，给业务人员进行查看的日志。这一类日志要求简单易懂(可能还设计一些日志的模板，不同类型的业务需要不同的模板)。打印在日志文件同时也需要进行数据库的持久化以便运营人员和关联人员的查看等等。

不管是系统日志还是业务日志，主要的作用就是用来记录操作的信息给需要的人进行查看。今天就来说一下在工作中如何优雅的记录日志。

> Tips：主要讲解业务日志如何记录

![](https://github.com/mxsm/picture/blob/main/java/log/%E4%B8%9A%E5%8A%A1%E6%97%A5%E5%BF%97%E8%AE%B0%E5%BD%95%E6%B5%81%E7%A8%8B%E5%9B%BE.png?raw=true)

### 1. 业务日志如何优雅的记录

针对不同的业务需要记录不同的内容，同时不同业务也有相同的东西。所以需要分析出共性和差异内容。基于自己的工作来看一下如何设计。

#### 1.1 日志需要记录哪些东西

- 操作人(操作用户一般记录ID和名称)
- 操作人终端IP地址(可以用于风控和一些智能推荐)
- 操作终端相关信息(可选根据不同公司和业务需求)
- 操作时间(这个比较重要)
- 操作类型(删除、查询、更新等等--根据需求进行个性化设计)

上面这些都是通用的，绝大多数业务都可以用的到。也基本上相同。但是对于业务操作日志最重要的是把业务的内容记录下来。这里就是我们通常说的业务模板

- 业务模板

  业务模板需要根据不同的业务进行定制，在定制过程中可能还需要进行动态加载等等。例如：**`123用户2021-09-16 10:00 订单创建，订单号：NO.88888888`**在订单信息中可能还包含了用户信息时间以及订单信息等等。这种是比较复杂的业务模板

> 日志模板格式其实还可以自定义如下格式：文件中一行作为一条记录，用分隔符进行分割。在读取的时候回按一行进行读取然后进行分隔符分割，每一个位置固定是一个约定好的内容。(这种格式之前在做游戏服务器日志记录的时候就是采用这种)。
>
> 优点：就是格式固定解析起来方便，也便于后续的数据处理以及表格的呈现。
>
> 缺点：不能直观的表达内容。需要处理加工后才能知道表达什么。

#### 1.2 静态实现方式

##### 1.2.1 [Canal](https://github.com/alibaba/canal)监听数据库操作日志

[Canal](https://github.com/alibaba/canal) 是一款基于 MySQL 数据库增量日志解析，提供增量数据订阅和消费的开源组件，通过采用监听数据库 Binlog 的方式，这样可以从底层知道是哪些数据做了修改，然后根据更改的数据记录操作日志。

优点：对代码没有侵入和业务逻辑完全分离。

缺点：只能记录操作数据库的操作，并且记录的字段只能是表中包含的字段，例如我想记录一下操作人的IP地址就没办法。

##### 1.2.2 Java框架日志记录文件中

```java
log.info("用户登录")
log.info("用户{}，ip地址{}登出“，userId,ip)
```

> Tips：常用的日志Java日志工具:
>
> -  log4j 
> - log4j2
> -  logback

这种记录有几个问题：

**问题1：** 用户ID和ip地址如何获取？

借助 SLF4J 中的 MDC 工具类，把操作人放在日志中，然后在日志中统一打印出来。首先在用户的拦截器中把用户的标识 Put 到 MDC 中：

```java
public class UserInterceptor implements AsyncHandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
        throws Exception {

        //获取到用户标识
        String userId = getUserId(request);
        //把用户 ID 放到 MDC 上下文中
        MDC.put("userId", userId);
        MDC.put("ip", request.getRemoteAddr());
        return AsyncHandlerInterceptor.super.preHandle(request, response, handler);
    }

    private String getUserId(HttpServletRequest request) {
        // 通过 SSO 或者Cookie 或者 Auth信息获取到 当前登陆的用户信息
        return null;
    }
}
```

其次，把 userId,ip格式化到日志中，使用 %X{userId} ,%X{ip}可以取到 MDC 中用户标识。

```xml
<pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level  %X{userId}  %X{ip} %logger{50} - %msg%n</pattern>
```

**问题2：** 如何生成可读性的日志

针对每一个业务在代码中写成对应的日志模板。写到日志文件中。然后通过日志收集工具将日志收集到Elasticsearch或者数据库当中。

#### 1.3 动态日志实现方式

为了解决上面的问题，一般采用AOP的方式记录操作日志和业务逻辑的解耦。下面来看一下：

```java
    @GetMapping("")
    @Log(content = "记录日志")
    public String log(){
        return System.currentTimeMillis()+"";
    }
```

这里记录日志实现的是一个静态，通过AOP的方式来实现的。那么如何实现动态模板，就会涉及到让变量通过占位符的方式解析模板，从而达到通过注解记录操作日志的目的。模板解析的方式有很多种。Java使用者用的最多的框架就是Spring， 这里实现我们也使用SpEL（Spring Expression Language，Spring表达式语言）来实现。

需要实现的功能设想，已最常用的用户在电商网站购买商品创建购买订单为例子：

业务日志模板:  用户[xxx]在[xxxx时间]购买了[xxxx商品]，用户的所使用的终端为[xxxxx,ip地址为]，操作类型:[xxxx]

#### 1.4 模块介绍

![功能模块图](https://github.com/mxsm/picture/blob/main/java/log/%E5%8A%A8%E6%80%81%E6%97%A5%E5%BF%97%E5%8A%9F%E8%83%BD%E6%A8%A1%E5%9D%97.png?raw=true)

主要分为三大功能：

1. **日志AOP拦截模块**

   主要用于处理用户的日志拦截的切入点

2. **日志解析模块**

   提供了对动态模板的解析，生成最终业务需要的模板具体实例数据

3. **日志存储模块**

   存储主要是为了提供给后续使用这个查询

#### 1.5 代码实现模块

从代码的实现上来说主要分成一下几个步骤：

- AOP拦截逻辑
- 日志解析逻辑
  - 模板解析
  - 日志上下文实现
  - 公共字段处理逻辑
  - 自定义函数的处理逻辑
- 日志持久化逻辑
  - 默认持久化
  - 持久化的方式（文件还是数据库），同步还是异步模式
- 项目如何进行集成(Spring start开发)

> 项目github地址：





参考资料:

- https://mp.weixin.qq.com/s/JC51S_bI02npm4CE5NEEow
- https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#expressions