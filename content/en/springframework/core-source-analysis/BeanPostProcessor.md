---
title: BeanPostProcessor讲解
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
abbrlink: d507e427
date: 2019-11-26 17:26:17
---
### 1. BeanPostProcessor是干什么的？

BeanPostProcessor接口作用是：如果我们需要在Spring容器完成Bean的实例化、配置和其他的初始化前后添加一些自己的逻辑处理，我们就可以定义一个或者多个BeanPostProcessor接口的实现，然后注册到容器中。(类似于拦截器和过滤器)

> 通俗的讲就是bean实例化后每个bean就会通过 **BeanPostProcessor** 实现的类的处理。

Spring Bean的实例化图解：

![图解](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/SpringBean%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E4%B9%8B%E5%88%9D%E5%A7%8B%E5%8C%96.png?raw=true)

![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/bean%E5%AE%9E%E4%BE%8B%E5%8C%96%E8%BF%87%E7%A8%8B.png?raw=true)

在检查完 **Aware** 接口后，就开始调用 **BeanPostProcessor** 进行前置处理后后置处理。下面来看一下Spring中的几类继承：

- AOP相关的

  ![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/BeanPostProcessor-aop.png?raw=true)

- bean 和 context相关的

  ![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/BeanPostProcessor-core.png?raw=true)

- Spring Boot相关的实现

  ![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/BeanPostProcessor-springboot.png?raw=true)

  

BeanPostProcessor是在Bean实例化后，在自定义初始化方法前后执行。



### 2. BeanPostProcessor代码解析

```java
public interface BeanPostProcessor {

	//自定义初始化方法之前执行
	@Nullable
	default Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}

	//自定义初始化方法之后执行
	@Nullable
	default Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}

}
```

代码演示：

```java
public class MyBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {

        System.out.println( " ----before----- " + beanName);

        return bean;
    }


    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {

        System.out.println( " ----after----- " + beanName);

        return bean;
    }
}
```
```java
public class TestBean {

    private String name;

    public void init(){
        System.out.println("TestBean---init()");
        this.name = "test";
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context
        https://www.springframework.org/schema/context/spring-context.xsd">

    <bean id="testBean" class="com.github.mxsm.bean.TestBean" init-method="init"/>

    <bean class="com.github.mxsm.processor.MyBeanPostProcessor" id="myBeanPostProcessor"/>

</beans>
```

```java
public class ApplicationBoot{
    public static void main( String[] args ) {

        ApplicationContext applicationContext = new ClassPathXmlApplicationContext("application.xml");
        TestBean testBean = applicationContext.getBean(TestBean.class);
        System.out.println(testBean.getName());

    }
}
```



![图示](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/BeanPostProcessor%E4%BB%A3%E7%A0%81%E6%BC%94%E7%A4%BA.png?raw=true)

通过代码可以看出来执行结果。

### 3. 看一下Spring自身的实现

```java
class ApplicationContextAwareProcessor implements BeanPostProcessor {

	private final ConfigurableApplicationContext applicationContext;

	private final StringValueResolver embeddedValueResolver;


	/**
	 * Create a new ApplicationContextAwareProcessor for the given context.
	 */
	public ApplicationContextAwareProcessor(ConfigurableApplicationContext applicationContext) {
		this.applicationContext = applicationContext;
		this.embeddedValueResolver = new EmbeddedValueResolver(applicationContext.getBeanFactory());
	}


	@Override
	@Nullable
	public Object postProcessBeforeInitialization(final Object bean, String beanName) throws BeansException {
		AccessControlContext acc = null;

		if (System.getSecurityManager() != null &&
				(bean instanceof EnvironmentAware || bean instanceof EmbeddedValueResolverAware ||
						bean instanceof ResourceLoaderAware || bean instanceof ApplicationEventPublisherAware ||
						bean instanceof MessageSourceAware || bean instanceof ApplicationContextAware)) {
			acc = this.applicationContext.getBeanFactory().getAccessControlContext();
		}

		if (acc != null) {
			AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
				invokeAwareInterfaces(bean);
				return null;
			}, acc);
		}
		else {
			invokeAwareInterfaces(bean);
		}

		return bean;
	}

	private void invokeAwareInterfaces(Object bean) {
		if (bean instanceof Aware) {
			if (bean instanceof EnvironmentAware) {
				((EnvironmentAware) bean).setEnvironment(this.applicationContext.getEnvironment());
			}
			if (bean instanceof EmbeddedValueResolverAware) {
				((EmbeddedValueResolverAware) bean).setEmbeddedValueResolver(this.embeddedValueResolver);
			}
			if (bean instanceof ResourceLoaderAware) {
				((ResourceLoaderAware) bean).setResourceLoader(this.applicationContext);
			}
			if (bean instanceof ApplicationEventPublisherAware) {
				((ApplicationEventPublisherAware) bean).setApplicationEventPublisher(this.applicationContext);
			}
			if (bean instanceof MessageSourceAware) {
				((MessageSourceAware) bean).setMessageSource(this.applicationContext);
			}
			if (bean instanceof ApplicationContextAware) {
				((ApplicationContextAware) bean).setApplicationContext(this.applicationContext);
			}
		}
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) {
		return bean;
	}

}
```

当前类主要用来处理继承了 **`Aware`** 接口类。然后根据 **`Aware`** 接口的不同实现设置对应的接口对象



### 4. InstantiationAwareBeanPostProcessor接口介绍

```java
public interface InstantiationAwareBeanPostProcessor extends BeanPostProcessor {

	//实例化之前--bean对象还没生成
	@Nullable
	default Object postProcessBeforeInstantiation(Class<?> beanClass, String beanName) throws BeansException {
		return null;
	}


    //实例化之后--bean对象已经生成
	default boolean postProcessAfterInstantiation(Object bean, String beanName) throws BeansException {
		return true;
	}


	@Nullable
	default PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName)
			throws BeansException {

		return null;
	}
}
```

> 代码示例地址：https://github.com/mxsm/spring-sample/tree/master/spring-beanPostProcessor



### 5. BeanPostProcessor Spring源码分析

首先明确一点 **`BeanPostProcessor`**  实现的类都是Spring容器中的一个Bean。在 **`AbstractApplicationContext#refresh`** 是最重要的一个方法：

```java
public void refresh() throws BeansException, IllegalStateException {
		synchronized (this.startupShutdownMonitor) {
				//省了部分代码

			try {
				
				//省了部分代码
				// Register bean processors that intercept bean creation.
				registerBeanPostProcessors(beanFactory);

			  //省了部分代码
			}

			catch (BeansException ex) {
				
			}

			finally {
				//省了部分代码
			}
		}
}
protected void registerBeanPostProcessors(ConfigurableListableBeanFactory beanFactory) {
	//通过PostProcessorRegistrationDelegate类的静态方法处理
    PostProcessorRegistrationDelegate.registerBeanPostProcessors(beanFactory, this);
}
```

下面看一下 **`PostProcessorRegistrationDelegate.registerBeanPostProcessors(beanFactory, this);`** 方法

```java
	public static void registerBeanPostProcessors(
			ConfigurableListableBeanFactory beanFactory, AbstractApplicationContext applicationContext) {

		String[] postProcessorNames = beanFactory.getBeanNamesForType(BeanPostProcessor.class, true, false);

		// Register BeanPostProcessorChecker that logs an info message when
		// a bean is created during BeanPostProcessor instantiation, i.e. when
		// a bean is not eligible for getting processed by all BeanPostProcessors.
		int beanProcessorTargetCount = beanFactory.getBeanPostProcessorCount() + 1 + postProcessorNames.length;
		beanFactory.addBeanPostProcessor(new BeanPostProcessorChecker(beanFactory, beanProcessorTargetCount));

		//处理分为三类：1 PriorityOrdered实现 2 Ordered 第三类就是普通的
		List<BeanPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
		List<BeanPostProcessor> internalPostProcessors = new ArrayList<>();
		List<String> orderedPostProcessorNames = new ArrayList<>();
		List<String> nonOrderedPostProcessorNames = new ArrayList<>();
		for (String ppName : postProcessorNames) {
			if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
				BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
				priorityOrderedPostProcessors.add(pp);
				if (pp instanceof MergedBeanDefinitionPostProcessor) {
					internalPostProcessors.add(pp);
				}
			}
			else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
				orderedPostProcessorNames.add(ppName);
			}
			else {
				nonOrderedPostProcessorNames.add(ppName);
			}
		}

		// 处理PriorityOrdered实现
		sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
		registerBeanPostProcessors(beanFactory, priorityOrderedPostProcessors);

		// 处理 Ordered实现.
		List<BeanPostProcessor> orderedPostProcessors = new ArrayList<>();
		for (String ppName : orderedPostProcessorNames) {
			BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
			orderedPostProcessors.add(pp);
			if (pp instanceof MergedBeanDefinitionPostProcessor) {
				internalPostProcessors.add(pp);
			}
		}
		sortPostProcessors(orderedPostProcessors, beanFactory);
		registerBeanPostProcessors(beanFactory, orderedPostProcessors);

		// 处理正常的
		List<BeanPostProcessor> nonOrderedPostProcessors = new ArrayList<>();
		for (String ppName : nonOrderedPostProcessorNames) {
			BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
			nonOrderedPostProcessors.add(pp);
			if (pp instanceof MergedBeanDefinitionPostProcessor) {
				internalPostProcessors.add(pp);
			}
		}
		registerBeanPostProcessors(beanFactory, nonOrderedPostProcessors);

		//注册MergedBeanDefinitionPostProcessor
		sortPostProcessors(internalPostProcessors, beanFactory);
		registerBeanPostProcessors(beanFactory, internalPostProcessors);

		// Re-register post-processor for detecting inner beans as ApplicationListeners,
		// moving it to the end of the processor chain (for picking up proxies etc).
		beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(applicationContext));
	}
```



### 总结

**BeanPostProcessor 主要用来处理Bean内部的注解。比如Spring自己实现的@Autowired、@Value等**

> 1.  自定义类似于@Value，@Autowired的注解，主要用于Java类变量或者方法上的注解
> 2. 主要用于处理Bean内部的注解实现，主要是变量或者方法上面的注解



https://cloud.tencent.com/developer/article/1409273
