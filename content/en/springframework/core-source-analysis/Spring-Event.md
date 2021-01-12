---
title: Spring Event源码解析
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之事件驱动
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之事件驱动
abbrlink: 4fd7c545
date: 2018-04-05 23:51:27
---
### 1. Spring事件机制
事件驱动模型通常也被理解成观察者模式或者发布/订阅模型
#### 1.1 基本概念
Spring的事件驱动模型主要由三部分组成:  
- **事件**

  ApplicationEvent，继承自JDK的EventObject，所有事件将继承它，并通过source得到事件源

- **事件发布者**

  ApplicationEventPublisher(发布)及ApplicationEventMulticaster(广播)接口，使用这个接口，我们的Service就拥有了发布事件的能力。

- **事件订阅者**

  ApplicationListener，继承自JDK的EventListener，所有监听器将继承它
  

### 2. Spring源码分析事件驱动过程

在 **`AbstractApplicationContext#refresh`** 方法中有一个 **`initApplicationEventMulticaster`** 方法来初始化事件的多通道。

```java
	protected void initApplicationEventMulticaster() {
		ConfigurableListableBeanFactory beanFactory = getBeanFactory();
		if (beanFactory.containsLocalBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME)) {
			this.applicationEventMulticaster =
					beanFactory.getBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, ApplicationEventMulticaster.class);
			if (logger.isTraceEnabled()) {
				logger.trace("Using ApplicationEventMulticaster [" + this.applicationEventMulticaster + "]");
			}
		}
		else {
			this.applicationEventMulticaster = new SimpleApplicationEventMulticaster(beanFactory);
			beanFactory.registerSingleton(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, this.applicationEventMulticaster);
			if (logger.isTraceEnabled()) {
				logger.trace("No '" + APPLICATION_EVENT_MULTICASTER_BEAN_NAME + "' bean, using " +
						"[" + this.applicationEventMulticaster.getClass().getSimpleName() + "]");
			}
		}
	}
```

通过上面的代码可以看出来， **`ApplicationEventMulticaster`** 接口在Spring中的一个实现就是  **`SimpleApplicationEventMulticaster`** 。

通过 **`ApplicationContextAwareProcessor`** 来处理 **`ApplicationEventPublisherAware`** 事件发表。在   **`AbstractApplicationContext#prepareBeanFactory`** 方法中有这样一段代码：

```java
beanFactory.registerResolvableDependency(ApplicationEventPublisher.class, this);
```

把 **`ApplicationContext`** 作为 **`ApplicationEventPublisher`** ，因为 **`ApplicationContext`** 的实现类同样也实现了 **`ApplicationEventPublisher`** 接口。

