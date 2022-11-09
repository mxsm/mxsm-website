---
title: "Spring中的拓展原理实战"
linkTitle: "Spring中的拓展原理实战"
date: 2021-01-18
weight: 202101182118
---

### 1. Spring拓展分类

Spring在Java框架中有着不可撼动的地位，只要是Java开发者就没有不用的。对于这样一个优秀的框架可拓展性是必不可少的。这里通过分析Spring的原理然后根据工作中的需要基于Spring的一些常用的拓展：

![Spring中的拓展](https://raw.githubusercontent.com/mxsm/picture/main/spring/custom/Spring%E4%B8%AD%E7%9A%84%E6%8B%93%E5%B1%95.png)

> [Spring官网](https://spring.io/)
>
> [Spring Framework Github](https://github.com/spring-projects/spring-framework)

拓展分类：

- **XML Schema拓展**

  在Spring中有除了比较常见的标签 bean、aop标签以外，还可以通过自定义XSD然后和Spring的拓展接口实现自定义

- **自定义注解**

  首先要明白自定义注解有什么好处：

  - 自定义注解能够通过注解很好的表达我们这个注解表干的事情，例如：@Log这个在Spring中没有这个注解，通过注解我们很好猜到这个是用来记录日志的。在Spring Web中的注解@RestController
  - 能够在Spring的原有的注解上做一些额外的功能

- **AOP拓展**

  对于AOP拓展，Spring中已经有了几个例子：**`@Transactional`** **`@Async`** **`@Cacheable`** ，这几个都是AOP拓展的体现，但是在实际的工作中远远不止这些拓展。例如：日志记录，方法调用时间统计等等

  > Async原理源码分析可以阅读 《[Spring AOP应用之EnableAsync](https://juejin.cn/post/7045587358174937101)》
  >
  > Transactional原理源码分析可以阅读 《[Spring AOP应用之Spring事务管理](https://juejin.cn/post/7040748897915895821)》

- **校验拓展**

  在web项目中，有一类注解像：@NotBlank 这一类注解，这些只是Java本身提供的，Spring给了支持。但是例如判断是不是电子邮件、电话号码等等都需要自定义。(严格意义上来说这只能是Spring对校验的一种支持)

- **其他拓展**

  对一些接口拓展，例如Aware接口拓展等等

### 2. 为什么要拓展(自定义)？

拓展自定义的意义在哪里？从代码可读性上来说能够让使用者更加清楚明白当前的组件是干什么的，从解决问题的角度来说更好的解决每个具体业务的问题。实现个性化定制。

接下来通过一系列文章进行分门别类，从原理到实际编写代码来实现以上的这些拓展。结合工作中的一些实际需求对拓展做一些实现！同时把Spring的拓展进行分门别类。在更新完成Spring拓展的系列后还会继续更新Spring Boot的相关拓展以及源码分析的文章。