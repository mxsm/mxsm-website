---
title: Spring框架中接口命名的艺术
categories:
  - Spring
  - Spring系列源码的艺术
tags:
  - Spring
  - Spring系列源码的艺术
abbrlink: 3fbcb0f2
date: 2020-05-02 15:45:41
---

在Spring中有对外的拓展接口或者是内部的接口有很多。这些接口命名有一些规律。以后自己的代码也可以参照Spring的接口命名方式来进行命名。

#### ApplicationContext和ConfigurableApplicationContext

这两个接口代表了普通接口和 **`Configurable`** 前缀的接口。带 **`Configurable`** 前缀的表示可以配置，那么可以配置一些什么东西呢？下面来看一下接口的源码：

```java
//	ConfigurableApplicationContext
void setId(String id);

void setParent(@Nullable ApplicationContext parent);

void setEnvironment(ConfigurableEnvironment environment);

void addBeanFactoryPostProcessor(BeanFactoryPostProcessor postProcessor);

void addApplicationListener(ApplicationListener<?> listener);

void addProtocolResolver(ProtocolResolver resolver);
```

 这一类接口增加了可配置的方法但是又不是仅仅局限于增加可配置的方法，如下面的代码

```java
//ConfigurableApplicationContext
void refresh() throws BeansException, IllegalStateException;

void registerShutdownHook();
```

