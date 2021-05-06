---
title: BeanPostProcessor讲解
date: 2019-11-26
weight: 5
---
> Spring Framework版本 5.3.4

### 1. BeanPostProcessor是干什么的？

BeanPostProcessor接口作用是：如果我们需要在Spring容器完成Bean的实例化、配置和其他的初始化前后添加一些自己的逻辑处理，我们就可以定义一个或者多个BeanPostProcessor接口的实现，然后注册到容器中。(类似于拦截器和过滤器)。  
BeanPostProcessor分为三大类如下图：
![图](https://github.com/mxsm/picture/blob/main/spring/BeanPostProcessor%E5%88%86%E7%B1%BB.png?raw=true)  

- 实例化
- 初始化
- 销毁



> Bean实例化会执行 **InstantiationAwareBeanPostProcessor** 、 **SmartInstantiationAwareBeanPostProcessor** 这两类处理器，Bean实例化后每个bean就会通过 **BeanPostProcessor** 、 **MergedBeanDefinitionPostProcessor** 实现的类的处理。Bean销毁会通过 **DestructionAwareBeanPostProcessor** 处理器。

Spring Bean的实例化图解：

![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/bean%E5%AE%9E%E4%BE%8B%E5%8C%96%E8%BF%87%E7%A8%8B.png?raw=true)

在检查完 **Aware** 接口后，就开始调用 **BeanPostProcessor** 进行前置处理后后置处理。下面来看一下Spring中的几类继承：

- AOP相关的

  ![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/BeanPostProcessor-aop.png?raw=true)

- bean 和 context相关的

  ![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/BeanPostProcessor-core.png?raw=true)

- Spring Boot相关的实现

  ![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/BeanPostProcessor-springboot.png?raw=true)

  

BeanPostProcessor是在Bean实例化后，在自定义初始化方法前后执行。

### 2. BeanPostProcessor

处理器定义了Bean **`初始化`** 前后执行的方法。

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

> 代码示例地址：https://github.com/mxsm/spring-sample/tree/master/spring-beanPostProcessor

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

### 3. **InstantiationAwareBeanPostProcessor** 

该处理器定义了Bean **`实例化`** 前后执行的方法。

```java
public interface InstantiationAwareBeanPostProcessor extends BeanPostProcessor {
    //实例化之前
	@Nullable
	default Object postProcessBeforeInstantiation(Class<?> beanClass, String beanName) throws BeansException { 
        //这里可以自定义代理类
		return null;
	}

    //实例化后-但是执行在初始化之前
	default boolean postProcessAfterInstantiation(Object bean, String beanName) throws BeansException {
		return true;
	}

    //处理bean的Properties值
	@Nullable
	default PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName)
			throws BeansException {

		return null;
	}

}
```



### 4.DestructionAwareBeanPostProcessor

该处理器了销毁Bean之前的操作。

```java
public interface DestructionAwareBeanPostProcessor extends BeanPostProcessor {

	//bean销毁之前
	void postProcessBeforeDestruction(Object bean, String beanName) throws BeansException;

	//bean是否需要销毁
	default boolean requiresDestruction(Object bean) {
		return true;
	}

}

```



### 5. 看一下Spring自身的实现

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



### 6. BeanPostProcessor Spring源码分析

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

通过该方法将 **`BeanPostProcessor`** 的以上几种实现类都注册到Spring中。

然后在生成Bean的时候去执行， **`AbstractAutowireCapableBeanFactory.createBean`** 创建Bean

```java
	protected Object createBean(String beanName, RootBeanDefinition mbd, @Nullable Object[] args)
			throws BeanCreationException {
        	
        	//省略代码
        
        	try {
			// 执行实例化之前方法.
			Object bean = resolveBeforeInstantiation(beanName, mbdToUse);
			if (bean != null) {
				return bean;
			}          
            //省略代码    
		}
    }
	protected Object resolveBeforeInstantiation(String beanName, RootBeanDefinition mbd) {
		Object bean = null;
		if (!Boolean.FALSE.equals(mbd.beforeInstantiationResolved)) {
			
			if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
				Class<?> targetType = determineTargetType(beanName, mbd);
				if (targetType != null) {
                    //执行InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation(实例化之前方法)
					bean = applyBeanPostProcessorsBeforeInstantiation(targetType, beanName);
					if (bean != null) {
                        //执行InstantiationAwareBeanPostProcessor#postProcessAfterInitialization(初始化后的方法)
						bean = applyBeanPostProcessorsAfterInitialization(bean, beanName);
					}
				}
			}
			mbd.beforeInstantiationResolved = (bean != null);
		}
		return bean;
	}
```

通过代码可以知道 **`resolveBeforeInstantiation`** 方法执行实例化之前的方法。如果实例化之前的方法返回了对应Bean那么直接执行初始化后的方法。实例化 **`InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation`** 方法执行返回Bean为空就调用  **`AbstractAutowireCapableBeanFactory#doCreateBean`** 方法。在这个方法里面有如下几个重要的方法：

- **AbstractAutowireCapableBeanFactory#applyMergedBeanDefinitionPostProcessors** 方法

  执行 **`MergedBeanDefinitionPostProcessor#postProcessMergedBeanDefinition`** 方法

- **AbstractAutowireCapableBeanFactory#populateBean** 方法

  执行 **`InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation`** 方法，如果前面方法返回true，执行 **`InstantiationAwareBeanPostProcessor#postProcessProperties`** 方法

- **AbstractAutowireCapableBeanFactory#initializeBean** 方法

  执行 **`BeanPostProcessor#postProcessBeforeInitialization`** 方法，然后执行 **`AbstractAutowireCapableBeanFactory#invokeInitMethods`** 方法(包括实现了InitializingBean接口的方法或者有注解@PostConstruct的方法)，然后执行 **`BeanPostProcessor#postProcessAfterInitialization`**

![图](https://github.com/mxsm/picture/blob/main/spring/BeanPostProcessor%E7%BB%A7%E6%89%BF%E6%96%B9%E6%B3%95%E6%89%A7%E8%A1%8C%E7%9A%84%E6%B5%81%E7%A8%8B.png?raw=true)

### 7. 总结

**BeanPostProcessor 主要用来处理Bean内部的注解。比如Spring自己实现的@Autowired、@Value， @EJB，@WebServiceRef，@PostConstruct，@PreDestroy等**

> 1.  自定义类似于@Value，@Autowired的注解，主要用于Java类变量或者方法上的注解
> 2. 主要用于处理Bean内部的注解实现，主要是变量或者方法上面的注解



参考文档：

- https://cloud.tencent.com/developer/article/1409273

