---
title: BeanPostProcessor相关接口执行的方法
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之核心类核心代码
  - Spring源码解析之BeanPostProcessor系列
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之核心类
abbrlink: 921c8beb
date: 2019-08-18 18:59:18
---
### 1. BeanPostProcessor相关接口
- **InstantiationAwareBeanPostProcessor**
- **DestructionAwareBeanPostProcessor**
- **MergedBeanDefinitionPostProcessor**
- **SmartInstantiationAwareBeanPostProcessor**

四个继承接口加上 ***`BeanPostProcessor`*** 一共五个接口。看一下这五个接口的方法：

```java
public interface BeanPostProcessor {
	@Nullable
	default Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}
		@Nullable
	default Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}

}
```
**InstantiationAwareBeanPostProcessor** 、 **DestructionAwareBeanPostProcessor**、  **MergedBeanDefinitionPostProcessor** 继承了 **BeanPostProcessor** ：

```java
public interface InstantiationAwareBeanPostProcessor extends BeanPostProcessor {
    @Nullable
	default Object postProcessBeforeInstantiation(Class<?> beanClass, String beanName) throws BeansException {
		return null;
	}
	default boolean postProcessAfterInstantiation(Object bean, String beanName) throws BeansException {
		return true;
	}
	//@since 5.1
	@Nullable
	default PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName)
			throws BeansException {

		return null;
	}
}
```

```java
public interface DestructionAwareBeanPostProcessor extends BeanPostProcessor {
    void postProcessBeforeDestruction(Object bean, String beanName) throws BeansException;

    default boolean requiresDestruction(Object bean) {
		return true;
	}
}
```

```java
public interface MergedBeanDefinitionPostProcessor extends BeanPostProcessor {
	void postProcessMergedBeanDefinition(RootBeanDefinition beanDefinition, Class<?> beanType, String beanName);
	
		default void resetBeanDefinition(String beanName) {
	}
}
```
**SmartInstantiationAwareBeanPostProcessor** 继承了 **InstantiationAwareBeanPostProcessor** 接口。

```java
public interface SmartInstantiationAwareBeanPostProcessor extends InstantiationAwareBeanPostProcessor {
	@Nullable
	default Class<?> predictBeanType(Class<?> beanClass, String beanName) throws BeansException {
		return null;
	}
	@Nullable
	default Constructor<?>[] determineCandidateConstructors(Class<?> beanClass, String beanName)
			throws BeansException {

		return null;
	}
	default Object getEarlyBeanReference(Object bean, String beanName) throws BeansException {
		return bean;
	}
}
```

### 2. BeanPostProcessor相关接口执行顺序
1. InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation
2. MergedBeanDefinitionPostProcessor#postProcessMergedBeanDefinition
3. SmartInstantiationAwareBeanPostProcessor#getEarlyBeanReference
3. InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation
4. InstantiationAwareBeanPostProcessor#postProcessProperties
5. BeanPostProcessor#postProcessBeforeInitialization
6. BeanPostProcessor#postProcessAfterInitialization
7. DestructionAwareBeanPostProcessor#requiresDestruction
8. DestructionAwareBeanPostProcessor#postProcessBeforeDestruction