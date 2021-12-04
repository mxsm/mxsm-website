---
title: "Spring AOP 源码解析"
linkTitle: "Spring AOP 源码解析"
date: 2021-12-01
weight: 202112011717

---

> Spring framework版本 5.3.x

### 1. 基本概念

AOP 是面向切面｜面向方面编程的简称，Aspect-Oriented Programming。 Aspect 是一种模块化机制，是用来描述分散在对象，类，函数中的横切关注点。

-  **基础**： 待增强对象或者目标对象
-  **切面**： 包含对基础的增强应用
-  **配置**： 可以看成一种编织，通过在AOP体系中提供这个配置环境，将基础和切面结合起来，从而完成切面对目标对象的编织实现
-  **Advice（通知）**： 定义在连接点做什么，为切面增强提供织入接口。在Spring AOP 中，它主要描述Spring AOP 围绕方法调用而注入的切面行为。
-  **Pointcut（切点）**：决定Advice通知应该作用于哪个连接点，也就是说通过Pointcut来定义需要增强的方法集合。
-  **Advisor（通知器）**：完成对目标方法的切面增强设计（advice）和关注点的设计以后，需要一个对象把它们结合起来，完成这个作用的就是Advisor（通知器）。通过Advisor ，可以定义应该使用那个通知并在哪个关注点使用它。

![](https://github.com/mxsm/picture/blob/main/spring/aop/Pointcut,Advice,Advisor%E4%B8%89%E8%80%85%E4%B9%8B%E9%97%B4%E7%9A%84%E5%85%B3%E7%B3%BB.png?raw=true)



### 2. 源码解析

> 源码解析以注解为分析

通过 **`@EnableAspectJAutoProxy`** 注解开开启AOP:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(AspectJAutoProxyRegistrar.class)
public @interface EnableAspectJAutoProxy {

	/**
	 * false:表示使用java代理
	 * true：表示使用cglib代理
	 */
	boolean proxyTargetClass() default false;

	/**
	 * 代理的暴露方式,解决内部调用不能使用代理的场景，默认为false
	 */
	boolean exposeProxy() default false;
}
```

注解使用 **`@Import`** 注解引入了 **`AspectJAutoProxyRegistrar`** 类，接下来跟踪一下 **`AspectJAutoProxyRegistrar`** 类

#### 2.1 AspectJAutoProxyRegistrar源码解析

```java
class AspectJAutoProxyRegistrar implements ImportBeanDefinitionRegistrar {
	@Override
	public void registerBeanDefinitions(
			AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
		
        //注册AnnotationAwareAspectJAutoProxyCreator
		AopConfigUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(registry);
		
        //读取配置的注解EnableAspectJAutoProxy属性
		AnnotationAttributes enableAspectJAutoProxy =
				AnnotationConfigUtils.attributesFor(importingClassMetadata, EnableAspectJAutoProxy.class);
		if (enableAspectJAutoProxy != null) {
			if (enableAspectJAutoProxy.getBoolean("proxyTargetClass")) {
				AopConfigUtils.forceAutoProxyCreatorToUseClassProxying(registry);
			}
			if (enableAspectJAutoProxy.getBoolean("exposeProxy")) {
				AopConfigUtils.forceAutoProxyCreatorToExposeProxy(registry);
			}
		}
	}
}
```

通过源代码发现 **`AspectJAutoProxyRegistrar`** 实现了 **`ImportBeanDefinitionRegistrar`** 接口，在Spring容器启动的时候会调用 **`ImportBeanDefinitionRegistrar#registerBeanDefinitions`** 方法来注入 **`AnnotationAwareAspectJAutoProxyCreator`** 

```java
AopConfigUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(registry);
```

> 注册的Bean名称为:org.springframework.aop.config.internalAutoProxyCreator

最终调用的是 **`AopConfigUtils#registerOrEscalateApcAsRequired`** 方法

```java
@Nullable
private static BeanDefinition registerOrEscalateApcAsRequired(
		Class<?> cls, BeanDefinitionRegistry registry, @Nullable Object source) {

	Assert.notNull(registry, "BeanDefinitionRegistry must not be null");

	if (registry.containsBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME)) {
		BeanDefinition apcDefinition = registry.getBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME);
		if (!cls.getName().equals(apcDefinition.getBeanClassName())) {
			int currentPriority = findPriorityForClass(apcDefinition.getBeanClassName());
			int requiredPriority = findPriorityForClass(cls);
			if (currentPriority < requiredPriority) {
				apcDefinition.setBeanClassName(cls.getName());
			}
		}
		return null;
	}

	RootBeanDefinition beanDefinition = new RootBeanDefinition(cls);
	beanDefinition.setSource(source);
	beanDefinition.getPropertyValues().add("order", Ordered.HIGHEST_PRECEDENCE);
	beanDefinition.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
	registry.registerBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME, beanDefinition);
	return beanDefinition;
}
```

到这里 **`AnnotationAwareAspectJAutoProxyCreator`** 类注册完成。接下来看 **`AnnotationAwareAspectJAutoProxyCreator`** 是如何创建代理类的。

#### 2.2 AnnotationAwareAspectJAutoProxyCreator源码解析

首先看一下类的继承关系：

![](https://github.com/mxsm/picture/blob/main/spring/aop/AnnotationAwareAspectJAutoProxyCreator.png?raw=true)

通过继承关系发现实现了 **`SmartInstantiationAwareBeanPostProcessor，BeanFactoryAware，InstantiationAwareBeanPostProcessor，BeanPostProcessor`**。 下面看一下接口执行的方式：

![](https://github.com/mxsm/picture/blob/main/spring/aop/AOP%E6%89%A7%E8%A1%8C%E6%B5%81%E7%A8%8B%E5%9B%BE.png?raw=true)

**`AbstractAutoProxyCreator`**  重写了 **`BeanPostProcessor#postProcessAfterInitialization方法 和InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation方法`** ,接下来详细分析一下这个两个方法：

##### 2.2.1 AbstractAutoProxyCreator#postProcessBeforeInstantiation

```java
	@Override
	public Object postProcessBeforeInstantiation(Class<?> beanClass, String beanName) {
		//获取bean的key
        Object cacheKey = getCacheKey(beanClass, beanName);
		//判断bean是否已经处理过了，处理了的会放在targetSourcedBeans
		if (!StringUtils.hasLength(beanName) || !this.targetSourcedBeans.contains(beanName)) {
			//判断是否包含了advise
            if (this.advisedBeans.containsKey(cacheKey)) {
				return null;
			}
            //判断类型和是否应该跳过
			if (isInfrastructureClass(beanClass) || shouldSkip(beanClass, beanName)) {
				this.advisedBeans.put(cacheKey, Boolean.FALSE);
				return null;
			}
		}
		
		TargetSource targetSource = getCustomTargetSource(beanClass, beanName);
		if (targetSource != null) {
			if (StringUtils.hasLength(beanName)) {
				this.targetSourcedBeans.add(beanName);
			}
            //获取通知和通知器
			Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(beanClass, beanName, targetSource);
			//创建代理
            Object proxy = createProxy(beanClass, beanName, specificInterceptors, targetSource);
			this.proxyTypes.put(cacheKey, proxy.getClass());
			return proxy;
		}

		return null;
	}
```

##### 2.2.1 AbstractAutoProxyCreator#postProcessAfterInitialization

看一下这个方法的调用链：

![](https://github.com/mxsm/picture/blob/main/spring/aop/AbstractAutoProxyCreator%23postProcessAfterInitialization%E8%B0%83%E7%94%A8%E9%93%BE.png?raw=true)

下面看一下 **`AbstractAutoProxyCreator#postProcessAfterInitialization`** 方法：

```java
@Override
public Object postProcessAfterInitialization(@Nullable Object bean, String beanName) {
	if (bean != null) {
		Object cacheKey = getCacheKey(bean.getClass(), beanName);
		if (this.earlyProxyReferences.remove(cacheKey) != bean) {
            //包装成代理类
			return wrapIfNecessary(bean, beanName, cacheKey);
		}
	}
	return bean;
}
```

主要生成代理类的方法是 `wrapIfNecessary` 下面来看一下具体实现：

```java
protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {
    
   	//创建代理类的前面校验和检测
	if (StringUtils.hasLength(beanName) && this.targetSourcedBeans.contains(beanName)) {
		return bean;
	}
	if (Boolean.FALSE.equals(this.advisedBeans.get(cacheKey))) {
		return bean;
	}
    //判断是否生成代理对象
	if (isInfrastructureClass(bean.getClass()) || shouldSkip(bean.getClass(), beanName)) {
		this.advisedBeans.put(cacheKey, Boolean.FALSE);
		return bean;
	}

	// 获取通知和通知器
	Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null);
	if (specificInterceptors != DO_NOT_PROXY) {
		this.advisedBeans.put(cacheKey, Boolean.TRUE);
        //创建代理对象
		Object proxy = createProxy(
				bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean));
		this.proxyTypes.put(cacheKey, proxy.getClass());
		return proxy;
	}

	this.advisedBeans.put(cacheKey, Boolean.FALSE);
	return bean;
}
```

**`getAdvicesAndAdvisorsForBean`** 方法最终调用的是 **`AbstractAdvisorAutoProxyCreator#getAdvicesAndAdvisorsForBean`** 方法,进一步调用的是**`AbstractAdvisorAutoProxyCreator#findEligibleAdvisors`** 方法：

```java
protected List<Advisor> findEligibleAdvisors(Class<?> beanClass, String beanName) {
    //查找候选的Advisor
	List<Advisor> candidateAdvisors = findCandidateAdvisors();
    //过滤出来可用的
	List<Advisor> eligibleAdvisors = findAdvisorsThatCanApply(candidateAdvisors, beanClass, beanName);
	extendAdvisors(eligibleAdvisors);
	if (!eligibleAdvisors.isEmpty()) {
		eligibleAdvisors = sortAdvisors(eligibleAdvisors);
	}
	return eligibleAdvisors;
}
```

- **findCandidateAdvisors**

  ```java
  #AnnotationAwareAspectJAutoProxyCreator实现类
  @Override
  protected List<Advisor> findCandidateAdvisors() {
  	// 根据父类规则查找所有的Spring advisor
  	List<Advisor> advisors = super.findCandidateAdvisors();
  	
  	if (this.aspectJAdvisorsBuilder != null) {
          //查找所有的Aspect（标注了注解的@Aspect的Bean) 并且解析
  		advisors.addAll(this.aspectJAdvisorsBuilder.buildAspectJAdvisors());
  	}
  	return advisors;
  }
  ```

- **findAdvisorsThatCanApply**

  ```java
  protected List<Advisor> findAdvisorsThatCanApply(
  		List<Advisor> candidateAdvisors, Class<?> beanClass, String beanName) {
  
  	ProxyCreationContext.setCurrentProxiedBeanName(beanName);
  	try {
  		return AopUtils.findAdvisorsThatCanApply(candidateAdvisors, beanClass);
  	}
  	finally {
  		ProxyCreationContext.setCurrentProxiedBeanName(null);
  	}
  }
  ```

到这里这两个方法就分析完成了。当获取到了通知和通知器就开始创建代理对象

##### 2.2.2 AbstractAutoProxyCreator#createProxy创建代理类

```java
protected Object createProxy(Class<?> beanClass, @Nullable String beanName,
		@Nullable Object[] specificInterceptors, TargetSource targetSource) {

	if (this.beanFactory instanceof ConfigurableListableBeanFactory) {
		AutoProxyUtils.exposeTargetClass((ConfigurableListableBeanFactory) this.beanFactory, beanName, beanClass);
	}
	//创建代理工厂
	ProxyFactory proxyFactory = new ProxyFactory();
	proxyFactory.copyFrom(this);

    //判断使用jdk代理还是CGLIB代理
	if (proxyFactory.isProxyTargetClass()) {
		// Explicit handling of JDK proxy targets (for introduction advice scenarios)
		if (Proxy.isProxyClass(beanClass)) {
			// Must allow for introductions; can't just set interfaces to the proxy's interfaces only.
			for (Class<?> ifc : beanClass.getInterfaces()) {
				proxyFactory.addInterface(ifc);
			}
		}
	}
	else {
		// No proxyTargetClass flag enforced, let's apply our default checks...
		if (shouldProxyTargetClass(beanClass, beanName)) {
			proxyFactory.setProxyTargetClass(true);
		}
		else {
			evaluateProxyInterfaces(beanClass, proxyFactory);
		}
	}
	
    //加入通知器
	Advisor[] advisors = buildAdvisors(beanName, specificInterceptors);
	proxyFactory.addAdvisors(advisors);
	proxyFactory.setTargetSource(targetSource);
	customizeProxyFactory(proxyFactory);

	proxyFactory.setFrozen(this.freezeProxy);
	if (advisorsPreFiltered()) {
		proxyFactory.setPreFiltered(true);
	}

	// Use original ClassLoader if bean class not locally loaded in overriding class loader
	ClassLoader classLoader = getProxyClassLoader();
	if (classLoader instanceof SmartClassLoader && classLoader != beanClass.getClassLoader()) {
		classLoader = ((SmartClassLoader) classLoader).getOriginalClassLoader();
	}
    //创建代理对象
	return proxyFactory.getProxy(classLoader);
}
```

### 3. Spring 创建Bean的简易流程

![](https://github.com/mxsm/picture/blob/main/spring/aop/Spring%20Bean%E5%88%9B%E5%BB%BA%E6%B5%81%E7%A8%8B.png?raw=true)

Bean的获取主要是通过BeanFactory获取，但是创建工作主要有BeanPostProcessor完成。代理类的创建就是通过 **AbstractAutoProxyCreator** 类执行实现

postProcessBeforeInstantiation 方法和 postProcessAfterInitialization 方法来对改变创建对象和对对象进行增强实现代理。

### 4. 总结

Spring AOP的整个启动过程：

- 创建 **`BeanFactoryAdvisorRetrievalHelperAdapter`** 类(通知器检索适配器)和 **`BeanFactoryAspectJAdvisorsBuilderAdapter`** 类
- 调用 **`AbstractAutoProxyCreator#postProcessBeforeInstantiation`** 方法查找所有的Advisor和切面，将切面构建成Advisor
- 调用 **`AbstractAutoProxyCreator#postProcessAfterInitialization`** 方法，从缓存取出所有的将所有的增强器，创建代理工厂，并织入增强器，创建代理对象

> Tips: 主要是通过实现 postProcessBeforeInstantiation 和 postProcessAfterInitialization 这两个方法来判断是否创建代理对象和如何创建代理