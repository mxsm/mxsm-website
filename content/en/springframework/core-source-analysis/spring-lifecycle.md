---
title: Spring 生命周期
categories:
  - Spring
  - Springframework
  - Spring-core分析
tags:
  - Spring
  - Springframework
  - Spring-core分析
abbrlink: cabc551f
date: 2019-09-13 03:56:10
---
### 1. Spring Bean的生命周期

```flow
st=>start: 加载BeanDefination
circularCondition=>condition: 获取依赖并且判断不是循环依赖
beforeInstantiation=>operation: 实例化之前调用InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation方法
CandidateConstructors=>operation: 调用构造函数自动装配SmartInstantiationAwareBeanPostProcessor#determineCandidateConstructors方法
afterInstantiation=>operation: 调用InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation方法
postProcessProperties=>operation: 调用InstantiationAwareBeanPostProcessor#postProcessProperties方法
instantiateBean=>operation: 实例化完成Bean
mergedBeanDefinitionPostProcessor=>operation: bean定义合并调用MergedBeanDefinitionPostProcessor#postProcessMergedBeanDefinition方法
invokeAwareMethods=>operation: 执行BeanNameAware,BeanClassLoaderAware,BeanFactoryAware的相关方法
BeanPostProcessorBeforeInitialization=>operation: 执行BeanPostProcessor#postProcessBeforeInitialization方法
invokeInitMethods=>operation: 执行初始化方法InitializingBean#afterPropertiesSet(实现了InitializingBean)或者使用了注解PostConstruct或者在xml中定义了Init方法
BeanPostProcessorsAfterInitialization=>operation: 调用初始化后的方法BeanPostProcessor#postProcessAfterInitialization
earlySingletonExposure=>operation: 饥饿加载Bean的属性
registerDisposableBeanIfNecessary=>operation: 继承了DisposableBean和定义了destroy方法来注入
e=>end

st->circularCondition

circularCondition(yes)->beforeInstantiation->CandidateConstructors->afterInstantiation->postProcessProperties->instantiateBean->mergedBeanDefinitionPostProcessor->invokeAwareMethods->BeanPostProcessorBeforeInitialization->invokeInitMethods->BeanPostProcessorsAfterInitialization->earlySingletonExposure->registerDisposableBeanIfNecessary->e

circularCondition(no)->e
```

