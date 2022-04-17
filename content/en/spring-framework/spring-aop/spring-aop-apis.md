---
title: "Spring AOP Apis"
linkTitle: "Spring AOP Apis"
date: 2021-12-04
weight: 202112042229
---

一起养成写作习惯！这是我参与「掘金日新计划 · 4 月更文挑战」的第12天，[点击查看活动详情](https://juejin.cn/post/7080800226365145118)。

> Spring framework版本 5.3.x

Spring AOP我们用注解比较多，今天我们来看一点不一样的。如何通过API来实现。

### 1.  Pointcut API 

先看一下在Spring框架中的继承关系：

![](https://github.com/mxsm/picture/blob/main/spring/aop/Pointcut%E7%BB%A7%E6%89%BF%E5%9B%BE.png?raw=true)

**`org.springframework.aop.Pointcut`** 核心接口用来通知特定的类和方法：

```java
public interface Pointcut {

    ClassFilter getClassFilter();

    MethodMatcher getMethodMatcher();
}
```

将Pointcut接口分成两个部分，允许重用类和方法匹配部分以及细粒度的组合操作(例如与另一个方法匹配器执行“联合”)。ClassFilter接口用于将切入点限制为一组给定的目标类。

```java
public interface ClassFilter {

    boolean matches(Class clazz);
}
```

MethodMatcher接口通常更重要,接口定义如下：

```java
public interface MethodMatcher {

    boolean matches(Method m, Class<?> targetClass);

    boolean isRuntime();

    boolean matches(Method m, Class<?> targetClass, Object... args);
}
```

Spring提供了有用的切入点超类来帮助您实现自己的切入点。因为静态切入点是最有用的，所以您可能应该子类化StaticMethodMatcherPointcut。这只需要实现一个抽象方法(尽管您可以覆盖其他方法来定制行为)。下面的示例展示了如何创建StaticMethodMatcherPointcut的子类:

```java
public class LogPointcut extends StaticMethodMatcherPointcut{

    @Override
    public boolean matches(Method method, Class<?> targetClass) {
        return AnnotatedElementUtils.hasAnnotation(method, Log.class);
    }
}
```

> Tips: 通常我们自定义切入点的话也是通过继承StaticMethodMatcherPointcut类来实现。
>
> 例子参考github项目：https://github.com/mxsm/mxsm-log4j.git

### 2. Advice API

Advice的继承关系：

![](https://github.com/mxsm/picture/blob/main/spring/aop/Advice%E7%BB%A7%E6%89%BF%E5%9B%BE.png?raw=true)

每一个Advice都是一个Spring Bean。通知实例可以在所有被通知对象之间共享，也可以对每个被通知对象唯一。这对应于每个类或每个实例的通知。

#### 2.1 Spring Advice 类型

![](https://github.com/mxsm/picture/blob/main/spring/aop/Advice%E7%B1%BB%E5%9E%8B.png?raw=true)

advice类型分成上面五类，平时用的比较多的是 **`Intercepter`** 和 **`MethodInterceptor`** 。

### 3. Advisor API

在Spring中，Advisor是一个方面，它只包含一个与切入点表达式关联的通知对象。除了介绍的特殊情况外，任何advisor都可以与任何Advice一起使用。**`org.springframework.aop.support.DefaultPointcutAdvisor`** 是最常用的类在Spring中。

使用`ProxyFactoryBean` 创建AOP代理

参考文档：

- https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop-api











