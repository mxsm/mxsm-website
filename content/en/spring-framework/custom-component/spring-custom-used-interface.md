---
title: "Spring常用的拓展接口"
linkTitle: "Spring常用的拓展接口"
date: 2021-12-19
weight: 202112192141
---
- Spring框架是一个拓展性很好的框架，在平时的开发中我们也会进行一些拓展。那么来看一下常用的拓展类：

  ![](https://github.com/mxsm/picture/blob/main/spring/Spring%E5%B8%B8%E8%A7%81%E7%9A%84%E6%8B%93%E5%B1%95%E6%8E%A5%E5%8F%A3.png?raw=true)

  这里把拓展接口分成了四大类

  ### 1. 导入类拓展接口

  - ImportAware

    从Spring的源码注释来看`ImportAware`接口是需要和`@Import`一起使用的。通过`@Import`导入的配置类如果实现了`ImportAware`接口就可以获取到导入该配置类接口的数据配置。同时需要搭配 **`@Configuration注解`**

    例如Spring实现的注解**`@ EnableAsync`** 中的 **`ProxyAsyncConfiguration`** 就实现了。

  - ImportSelector，DeferredImportSelector

    动态导入配置类,例如Spring的实现：**`@ EnableAsync`** 

  - ImportBeanDefinitionRegistrar

    可以实现自己的注解管理自己的Bean。例如Spring注解： **`@EnableAspectJAutoProxy`**

  > Tips： 以上的接口都是搭配 @Import、@Configuration使用的。 例如用来实现自定义的Enablexxx功能

  ### 2. AOP相关接口

  对于AOP记住三点就好，Advisor、Advice、Pointcut。所以Spring提供了三个对应的接口来给使用者拓展实现。

  - StaticMethodMatcherPointcut

    切点实现

  - AbstractBeanFactoryPointcutAdvisor

    通知器实现

  - MethodInterceptor

    切面实现

  ### 3. Bean后置处理器接口

  对于Bean的后置处理器接口主要都是实现了 **`BeanPostProcessor`** 接口

  - SmartInstantiationAwareBeanPostProcessor
  - InstantiationAwareBeanPostProcessor
  - DestructionAwareBeanPostProcessor
  - MergedBeanDefinitionPostProcessor

  就是来自定义Bean的管理和对Bean进行功能增强。例如Spring AOP的实现就是实现了 **`SmartInstantiationAwareBeanPostProcessor`** 接口。实现自定义注解就可以使用当前的这些处理器来实现。

  ### 4. Aware类型接口

  aware类型接口比较多，主要的作用就是在继承了相对应的aware接口的Bean里面可以获取到相对应的aware对象。这里平时日常的开发过程中使用的比较多的：

  - ApplicationContextAware
  - BeanNameAware
  - ApplicationEventPublisherAware
  - BeanClassLoaderAware
  - BeanFactoryAware
  - NotificationPublisherAware
  - EnvironmentAware

  其他的在自定义拓展的过程中使用的频率都没用那么的高

  ### 5. 使用小技巧

  对于上面这么多拓展的接口如何使用，下面有一些自己在开发过程中的一些小心得：

  - 参照Spring源码的实现进行拓展，这个准没错。Spring本身实现的源码就是一个很好的例子。例如你要自己开发一个 **`@EnableXXXX`** 的注解功能。那么你可以参照一下Spring源码中实现的  **`@EnableAsync、@EnableTransactionManagement`** 等一些注解来作为参照
  - 参照一些开源系统的Spring支持系列框架，这里面有很多基于Spring的自定义注解实现。这些例子也给自己去拓展平时工作中的注解等做了很好的参考和例子。比如：例如 [Nacos Spring 项目](https://github.com/nacos-group/nacos-spring-project) 

