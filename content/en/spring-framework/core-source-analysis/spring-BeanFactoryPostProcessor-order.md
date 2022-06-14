---
title: "Spring BeanFactoryPostProcessor执行顺序"
linkTitle: "Spring BeanFactoryPostProcessor执行顺序"
date: 2022-02-01
weight: 202202011126
---

### 1. 前言

在之前的文章《[Spring BeanPostProcessor执行顺序问题](https://blog.ljbmxsm.com/spring-framework/core-source-analysis/spring-beanpostprocessor-order/)》介绍过 **`BeanPostProcessor`** ，  使用Spring框架的人可能会注意到这样一个类 **`BeanFactoryPostProcessor`** 和 **`BeanPostProcessor`**  名称很接近。下面来看一下**`BeanFactoryPostProcessor`** 的作用。

**BeanFactoryPostProcessor：** Spring Bean Factory的前置处理器，允许自定义修改应用上下文的Bean的定义。同时可以调整上下文的底层bean工厂的bean属性值。常用的拓展接口如下：

![常用的拓展接口类](https://raw.githubusercontent.com/mxsm/picture/main/spring/%E5%B8%B8%E7%94%A8%E7%9A%84%E6%8B%93%E5%B1%95%E6%8E%A5%E5%8F%A3%E7%B1%BB.png)

类之间的继承关系如下：

![image-20220201120007663](https://raw.githubusercontent.com/mxsm/picture/main/spring/image-20220201120007663.png)

上面存在两个重要的接口：

- **BeanFactoryPostProcessor**
- **BeanDefinitionRegistryPostProcessor**

接下来着重分析这两个接口的作用

### 2.接口的执行顺序

接下来从 **`BeanFactoryPostProcessor`** 和 **`BeanDefinitionRegistryPostProcessor`** 实现类注入和执行顺序来看。

#### 2.1 接口实现类在哪里注入？

用现在最常用的注解上下文来解析，通过 **AnnotationConfigApplicationContext** 源码发现，属性 **AnnotatedBeanDefinitionReader** 实例化有这样一段代码：

![image-20220201123122834](https://raw.githubusercontent.com/mxsm/picture/main/spring/image-20220201123122834.png)

跟进代码 **AnnotationConfigUtils#registerAnnotationConfigProcessors** 发现

![image-20220201165201280](https://raw.githubusercontent.com/mxsm/picture/main/spring/image-20220201165201280.png)

1. 将 **ConfigurationClassPostProcessor** 类的定义注册到了Spring容器中。

到这里就是 **`BeanFactoryPostProcessor`** 和 **`BeanDefinitionRegistryPostProcessor`**  的接口的实现类注册到Spring容器

#### 2.2 接口的执行顺序

通过 **AnnotationConfigApplicationContext** 源码发现在 refresh 方法中有执行 **BeanFactoryPostProcessor** 。最终调用的是调用了父类的 **`AbstractApplicationContext#refresh`** 方法，在方法中有这样一段代码：

![image-20220201170035512](https://raw.githubusercontent.com/mxsm/picture/main/spring/image-20220201170035512.png)

1. 这里就是执行 **BeanFactoryPostProcessor**

我们看一下里面 **`BeanFactoryPostProcessor`** 和 **`BeanDefinitionRegistryPostProcessor`** 接口的执行顺序，分析源码可以知道是通过 **`PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors`** 来执行，分为以下几个执行部分：

**执行BeanDefinitionRegistryPostProcessor：**

- 从Spring容器中获取**`BeanFactoryPostProcessor`** 和 **`BeanDefinitionRegistryPostProcessor`** 的实现类

  ![image-20220201170822680](https://raw.githubusercontent.com/mxsm/picture/main/spring/image-20220201170822680.png)

  > Tips: 如果是BeanDefinitionRegistryPostProcessor的实现类同时执行BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry方法

- 首先执行 **BeanDefinitionRegistryPostProcessors#postProcessBeanDefinitionRegistry** 实现了 **PriorityOrdered** 接口的

  ![image-20220201173137323](https://raw.githubusercontent.com/mxsm/picture/main/spring/image-20220201173137323.png)

- 然后执行 **BeanDefinitionRegistryPostProcessors#postProcessBeanDefinitionRegistry** 实现了 **Ordered** 接口的

  ![image-20220201173224200](https://raw.githubusercontent.com/mxsm/picture/main/spring/image-20220201173224200.png)

- 在执行剩下的 **BeanDefinitionRegistryPostProcessors#postProcessBeanDefinitionRegistry** 

  ![image-20220201173343336](https://raw.githubusercontent.com/mxsm/picture/main/spring/image-20220201173343336.png)

- 接着执行 **BeanDefinitionRegistryPostProcessor#postProcessBeanFactory** 方法和 **BeanFactoryPostProcessor#postProcessBeanFactory** 方法

  ![image-20220201173753538](https://raw.githubusercontent.com/mxsm/picture/main/spring/image-20220201173753538.png)

**执行BeanFactoryPostProcessor执行：**

- 执行 **BeanFactoryPostProcessor#postProcessBeanFactory** 实现了 **PriorityOrdered** 接口的

  ```java
  sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
  invokeBeanFactoryPostProcessors(priorityOrderedPostProcessors, beanFactory);
  ```

- 执行 **BeanFactoryPostProcessor#postProcessBeanFactory** 实现了 **Ordered** 接口的

  ```java
  List<BeanFactoryPostProcessor> orderedPostProcessors = new ArrayList<>(orderedPostProcessorNames.size());
  for (String postProcessorName : orderedPostProcessorNames) {
  	orderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
  }
  sortPostProcessors(orderedPostProcessors, beanFactory);
  invokeBeanFactoryPostProcessors(orderedPostProcessors, beanFactory);
  ```

- 执行剩下的 **BeanFactoryPostProcessor#postProcessBeanFactory** 

  ```java
  List<BeanFactoryPostProcessor> nonOrderedPostProcessors = new ArrayList<>(nonOrderedPostProcessorNames.size());
  for (String postProcessorName : nonOrderedPostProcessorNames) {
  	nonOrderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
  }
  invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory);
  ```

通过上面的代码分析总结一下 **`BeanFactoryPostProcessor`** 和 **`BeanDefinitionRegistryPostProcessor`**  执行顺序，如下图所示：

![BeanFactoryPostProcessor执行流程图](https://raw.githubusercontent.com/mxsm/picture/main/spring/BeanFactoryPostProcessor%E6%89%A7%E8%A1%8C%E6%B5%81%E7%A8%8B%E5%9B%BE.png)

1. 首先应该执行 **BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry** 方法
2. 然后执行 **BeanDefinitionRegistryPostProcessor#postProcessBeanFactory** 方法
3. 最后执行 **BeanFactoryPostProcessor#postProcessBeanFactory** 方法

> Tips: BeanDefinitionRegistryPostProcessor和BeanFactoryPostProcessor的执行还和PriorityOrdered以及Ordered有关。

### 3. 总结

**`BeanFactoryPostProcessor`** 和 **`BeanDefinitionRegistryPostProcessor`** 可通过Spring原生的实现来做一些用户自定义的拓展，例如 **ConfigurationClassPostProcessor** 可以受到启发我们可以自定义一些配置在类上面的注解，例如自定义和@Component类似的注解。