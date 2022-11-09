---
title: "Spring依赖注入时，什么时候会创建代理类"
linkTitle: "Spring依赖注入时，什么时候会创建代理类"
date: 2021-12-08
weight: 202112081717

---

> 用到的代码地址：https://github.com/mxsm/spring-sample/tree/spring-5.3.x/spring-proxy

### 1. 现象

第一种情况：

![](https://github.com/mxsm/picture/blob/main/spring/aop/proxy1.png?raw=true)

第二种情况：

![](https://github.com/mxsm/picture/blob/main/spring/aop/proxy2.png?raw=true)

第三种情况：

![](https://github.com/mxsm/picture/blob/main/spring/aop/proxy3.png?raw=true)

### 2. 现象说明

第一种是最常见的在普通的Spring应用中，会发现 **`UserService`** 和 **`TeacherService`** 都没有创建代理。这个就是最常见的使用方式。

第二种是使用了 **`@EnableAspectJAutoProxy`** 注解开启了Spring AOP， 发现**`UserService`** 使用的是JDK代理，**`TeacherService`** 使用的是CGLIB代理

第三种是使用了 **`@EnableAspectJAutoProxy(proxyTargetClass = true)`** ，会发现 **`UserService`** 和 **`TeacherService`** 都使用的是CGlib代理

现象总结：在没有开启AOP的情况下是不会创建代理的，在使用了 **`@EnableAspectJAutoProxy`** 默认的情况下接口的代理使用的是JDK代理实现，类的代理使用的CGLIB（jdk不能实现类的代理）。 **`@EnableAspectJAutoProxy(proxyTargetClass = true)`** 强制使用CGLIB代理。

### 3. 源码分析

#### 3.1 上面时候会使用代理类

通过之前的《Spring AOP 源码解析》可以知道，注解方式下的AOP的创建代理类主要的类是： **`AnnotationAwareAspectJAutoProxyCreator`** ，这个类重写了 **`initBeanFactory`** 和 **`findCandidateAdvisors`** 两个方法：

**initBeanFactory方法**：

```java
@Override
protected void initBeanFactory(ConfigurableListableBeanFactory beanFactory) {
	super.initBeanFactory(beanFactory);
	if (this.aspectJAdvisorFactory == null) {
		this.aspectJAdvisorFactory = new ReflectiveAspectJAdvisorFactory(beanFactory);
	}
	this.aspectJAdvisorsBuilder =
			new BeanFactoryAspectJAdvisorsBuilderAdapter(beanFactory, this.aspectJAdvisorFactory);
}
```

功能：

- 新建了ReflectiveAspectJAdvisorFactory

- 新建了BeanFactoryAspectJAdvisorsBuilderAdapter

  用来将包含了 **`@Aspect`** 注解的Bean构建成一个Advisor

**findCandidateAdvisors:**

```java
@Override
protected List<Advisor> findCandidateAdvisors() {
	// Add all the Spring advisors found according to superclass rules.
	List<Advisor> advisors = super.findCandidateAdvisors();
	// Build Advisors for all AspectJ aspects in the bean factory.
	if (this.aspectJAdvisorsBuilder != null) {
		advisors.addAll(this.aspectJAdvisorsBuilder.buildAspectJAdvisors());
	}
	return advisors;
}
```

功能：

- 查找候选的Advisor(实现了Advisor接口的)
- 将 AspectJ的构建成Advisor(@Aspec, @Before等等相关的Aspect的注解解析构建成Advisor)

> Tips: 上面的第二种和第三种就是通过自己定义的Advisor来实现的。没有使用Spring的注解例如：@Transactional (事务管理注解)。如果嫌麻烦也可以用这个注解或者其他的AOP的注解来观察上面的三种情况。

所以从上面的代码就能看出来就能知道是否使用代理就是看是否开启了 Spring AOP， 同时对应的类是否包含Aop需要处理的逻辑。例如上面自定义的 **`@Log`** 注解或者AspectJ的相关注解。

#### 3.2 如何选择JDK代理和Cglib代理

**`@EnableAspectJAutoProxy(proxyTargetClass = true)`** 强制使用Cglib代理。但是默认的情况下是怎么样的，我们还是根据看一下源码来分析一下。在创建代理类的时候在 **`AbstractAutoProxyCreator#createProxy`** 方法：

```java
protected Object createProxy(Class<?> beanClass, @Nullable String beanName,
		@Nullable Object[] specificInterceptors, TargetSource targetSource) {

	if (this.beanFactory instanceof ConfigurableListableBeanFactory) {
		AutoProxyUtils.exposeTargetClass((ConfigurableListableBeanFactory) this.beanFactory, beanName, beanClass);
	}

	ProxyFactory proxyFactory = new ProxyFactory();
	proxyFactory.copyFrom(this);
	//设置强制使用Cglib代理
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
		// 没有proxyTargetClass强制的情况下判断是否使用Cglib代理，这里根据是代理接口还是代理类
		if (shouldProxyTargetClass(beanClass, beanName)) {
			proxyFactory.setProxyTargetClass(true);
		}
		else {
            //评估代理接口
			evaluateProxyInterfaces(beanClass, proxyFactory);
		}
	}

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
    //创建代理类
	return proxyFactory.getProxy(classLoader);
}
```

1. 根据 **`proxyTargetClass`** 标记来判断是否强制使用Cglib来创建代理
2. 如果没有设置 **`proxyTargetClass=true`** 就根据是代理接口还是代理类来动态处理选择代理方式
3. 创建代理类返回

### 4. 总结

- 在没有开启AOP的时候如果不自己定义是不会使用和创建代理类。 也就是使用我们平时使用的不同类实例
- **`@EnableAspectJAutoProxy(proxyTargetClass = true)`** 强制所有的方式都使用Cglib进行代理
- **`@EnableAspectJAutoProxy`** 默认情况下会根据情况来判断是否创建代理类，和用Jdk代理实现还是Cglib实现
