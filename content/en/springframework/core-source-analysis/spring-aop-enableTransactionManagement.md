---
title: @EnableTransactionManagement注解解析来看AOP
date: 2021-04-27
weight: 202104272345
---



> 基于spring 5.3.5版本源码分析

### 1. EnableTransactionManagement注解
EnableXXX类的注解主要依赖于@Import注解进行拓展。

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(TransactionManagementConfigurationSelector.class)
public @interface EnableTransactionManagement {

	boolean proxyTargetClass() default false;

	AdviceMode mode() default AdviceMode.PROXY;

	int order() default Ordered.LOWEST_PRECEDENCE;
}

```
通过代码可以知道，主要的逻辑都是通过 ***TransactionManagementConfigurationSelector*** 来实现的。

### 2. TransactionManagementConfigurationSelector类

```java
public class TransactionManagementConfigurationSelector extends AdviceModeImportSelector<EnableTransactionManagement> {

	@Override
	protected String[] selectImports(AdviceMode adviceMode) {
		switch (adviceMode) {
			case PROXY:
				return new String[] {AutoProxyRegistrar.class.getName(),
						ProxyTransactionManagementConfiguration.class.getName()};
			case ASPECTJ:
				return new String[] {determineTransactionAspectClass()};
			default:
				return null;
		}
	}

	private String determineTransactionAspectClass() {
		return (ClassUtils.isPresent("javax.transaction.Transactional", getClass().getClassLoader()) ?
				TransactionManagementConfigUtils.JTA_TRANSACTION_ASPECT_CONFIGURATION_CLASS_NAME :
				TransactionManagementConfigUtils.TRANSACTION_ASPECT_CONFIGURATION_CLASS_NAME);
	}

}
```
有代码可以看出来该类继承 ***AdviceModeImportSelector*** 类。分为了两种情况根据AdviceMode 
- **AdviceMode.PROXY**  
  这个也是默认情况，主要使用的是JDK代理实现通知
- **AdviceMode.ASPECTJ**  
  使用ASPECTJ来实现通知

### 3. AutoProxyRegistrar类
AutoProxyRegistrar类实现了ImportBeanDefinitionRegistrar接口。通过获取EnableTransactionManagement注解的值来确定使用何种模式以及何种代理来实现Aop.

```java
public class AutoProxyRegistrar implements ImportBeanDefinitionRegistrar {
	@Override
	public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
		boolean candidateFound = false;
		Set<String> annTypes = importingClassMetadata.getAnnotationTypes();
		for (String annType : annTypes) {
			AnnotationAttributes candidate = AnnotationConfigUtils.attributesFor(importingClassMetadata, annType);
			if (candidate == null) {
				continue;
			}
			Object mode = candidate.get("mode");
			Object proxyTargetClass = candidate.get("proxyTargetClass");
			if (mode != null && proxyTargetClass != null && AdviceMode.class == mode.getClass() &&
					Boolean.class == proxyTargetClass.getClass()) {
				candidateFound = true;
				//设置代理创建者AutoProxyCreator
				if (mode == AdviceMode.PROXY) {
					AopConfigUtils.registerAutoProxyCreatorIfNecessary(registry);
					//设置使用代理的方式
					if ((Boolean) proxyTargetClass) {
						AopConfigUtils.forceAutoProxyCreatorToUseClassProxying(registry);
						return;
					}
				}
			}
		}
	}

}
```
- 注入InfrastructureAdvisorAutoProxyCreator到Spring容器

  该类是一个InstantiationAwareBeanPostProcessor实现类。通过postProcessBeforeInstantiation方法或者postProcessAfterInitialization来创建代理。
  
  ```java
  //AbstractAutoProxyCreator#postProcessAfterInitialization
  @Override
	public Object postProcessAfterInitialization(@Nullable Object bean, String beanName) {
		if (bean != null) {
			Object cacheKey = getCacheKey(bean.getClass(), beanName);
			if (this.earlyProxyReferences.remove(cacheKey) != bean) {
				return wrapIfNecessary(bean, beanName, cacheKey);
			}
		}
		return bean;
	}
  ```
  AbstractAutoProxyCreator#wrapIfNecessary用来创建代理对象如果有advice的情况
  
  ```java
    protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {
    	if (StringUtils.hasLength(beanName) && this.targetSourcedBeans.contains(beanName)) {
    		return bean;
    	}
    	if (Boolean.FALSE.equals(this.advisedBeans.get(cacheKey))) {
    		return bean;
    	}
    	if (isInfrastructureClass(bean.getClass()) || shouldSkip(bean.getClass(), beanName)) {
    		this.advisedBeans.put(cacheKey, Boolean.FALSE);
    		return bean;
    	}
    
    	// 获取回调拦截器（AOP核心：代理和回调拦截器）
    	Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null);
    	if (specificInterceptors != DO_NOT_PROXY) {
    		this.advisedBeans.put(cacheKey, Boolean.TRUE);
    		Object proxy = createProxy(
    				bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean));
    		this.proxyTypes.put(cacheKey, proxy.getClass());
    		return proxy;
    	}
    
    	this.advisedBeans.put(cacheKey, Boolean.FALSE);
    	return bean;
  }
  ```

- 设置代理方式，false为jdk代理，true为cglib代理

> 在代理加入了切面的实现

### 4. ProxyTransactionManagementConfiguration类
这个配主要管理配置代理事务
- 创建TransactionAttributeSource对象
- 创建TransactionInterceptor，依赖TransactionAttributeSource
- 创建BeanFactoryTransactionAttributeSourceAdvisor属性通知器。依赖创建TransactionAttributeSource、创建TransactionInterceptor。

#### 4.1 AnnotationTransactionAttributeSource类
方法主要用来解析注解@Transactional。同时还兼容了jta和ejb。Spring的@Transactional解析类 ***SpringTransactionAnnotationParser*** 

> 默认AnnotationTransactionAttributeSource的创建为只能公共方法能够使用@Transactional注解

#### 4.2 TransactionInterceptor类
主要处理@Transactional注解切面，执行方法的处理。

### 5 事务执行逻辑
事务执行分为两步：
1. 代理对象创建
2. 代理对象执行方法

#### 5.1 代理对象创建
在 ***AbstractAutoProxyCreator*** 类继承了 ***SmartInstantiationAwareBeanPostProcessor*** 通过 ***AbstractAutoProxyCreator#postProcessAfterInitialization*** 来创建代理对象。
```java
public Object postProcessAfterInitialization(@Nullable Object bean, String beanName) {
	if (bean != null) {
		Object cacheKey = getCacheKey(bean.getClass(), beanName);
		if (this.earlyProxyReferences.remove(cacheKey) != bean) {
		    //创建代理
			return wrapIfNecessary(bean, beanName, cacheKey);
		}
	}
	return bean;
}

protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {
	
	//省略部分代码

	//获取要代理类是否含有切面-创建代理
	Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null);
	if (specificInterceptors != DO_NOT_PROXY) {
		this.advisedBeans.put(cacheKey, Boolean.TRUE);
		//创建代理
		Object proxy = createProxy(
				bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean));
		this.proxyTypes.put(cacheKey, proxy.getClass());
		return proxy;
	}

	this.advisedBeans.put(cacheKey, Boolean.FALSE);
	return bean;
}
```
通过在代理类中设置切面的数据，然后创建代理类为后续的执行提供切面的功能。

#### 5.2 代理对象执行方法
代理类的执行我们首先要了解代理类是如何创建的。首先来了解一下Spring中AOP代理的类图结构：  
![image](https://github.com/mxsm/picture/blob/main/spring/aopproxy%E7%BB%A7%E6%89%BF%E5%85%B3%E7%B3%BB%E5%9B%BE.png?raw=true)  

```java
public interface AopProxy {

	Object getProxy();

	Object getProxy(@Nullable ClassLoader classLoader);
}

```
这个就是创建代理的接口。下面来看一下实现用CglibAopProxy举例分析，代理创建就是cglib的标准创建方式。然后通过设置类的Callback来将切面结合到里面。看一下代码：

```java
@Override
public Object getProxy(@Nullable ClassLoader classLoader) {

	//省略部分代码
	Enhancer enhancer = createEnhancer();
	if (classLoader != null) {
		enhancer.setClassLoader(classLoader);
		if (classLoader instanceof SmartClassLoader &&
				((SmartClassLoader) classLoader).isClassReloadable(proxySuperClass)) {
			enhancer.setUseCache(false);
		}
	}
	enhancer.setSuperclass(proxySuperClass);
	enhancer.setInterfaces(AopProxyUtils.completeProxiedInterfaces(this.advised));
	enhancer.setNamingPolicy(SpringNamingPolicy.INSTANCE);
	enhancer.setStrategy(new ClassLoaderAwareGeneratorStrategy(classLoader));
	
	//重要方法：获取Callback
	Callback[] callbacks = getCallbacks(rootClass);
	Class<?>[] types = new Class<?>[callbacks.length];
	for (int x = 0; x < types.length; x++) {
		types[x] = callbacks[x].getClass();
	}
	 //设置CallbackFilter
	enhancer.setCallbackFilter(new ProxyCallbackFilter(
			this.advised.getConfigurationOnlyCopy(), this.fixedInterceptorMap, this.fixedInterceptorOffset));
	enhancer.setCallbackTypes(types);
	
	return createProxyClassAndInstance(enhancer, callbacks);
}
```
上面比较重要的一个方法就是 ***getCallbacks*** 方法。主要用来创建代理对象的Callback(这里主要是cglib的MethodInterceptor)：

```java
Callback aopInterceptor = new DynamicAdvisedInterceptor(this.advised);
```
创建了一个动态通知拦截器。 ***DynamicAdvisedInterceptor*** 是 CglibAopProxy 内部静态类。

```java
private static class FixedChainStaticTargetInterceptor implements MethodInterceptor, Serializable {
    //省略代码
    @Override
    @Nullable
    public Object intercept(Object proxy, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {
    
    	//省略了部分无关紧要的代码
    
    	Object oldProxy = null;
    	boolean setProxyContext = false;
    	Object target = null;
    	TargetSource targetSource = this.advised.getTargetSource();
    
    	if (this.advised.exposeProxy) {
    		// Make invocation available if necessary.
    		oldProxy = AopContext.setCurrentProxy(proxy);
    		setProxyContext = true;
    	}
    	// Get as late as possible to minimize the time we "own" the target, in case it comes from a pool...
    	target = targetSource.getTarget();
    	Class<?> targetClass = (target != null ? target.getClass() : null);
    	List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(method, targetClass);
    	Object retVal;
    	// Check whether we only have one InvokerInterceptor: that is,
    	// no real advice, but just reflective invocation of the target.
    	if (chain.isEmpty() && Modifier.isPublic(method.getModifiers())) {
    		//跳过代理直接在线目标类的方法
    		Object[] argsToUse = AopProxyUtils.adaptArgumentsIfNecessary(method, args);
    		retVal = methodProxy.invoke(target, argsToUse);
    	}
    	else {
    		//创建一个cglib方法Invocation去执行
    		retVal = new CglibMethodInvocation(proxy, target, method, args, targetClass, chain, methodProxy).proceed();
    	}
    	retVal = processReturnType(proxy, target, method, retVal);
    	return retVal;
    	
    }
}
```
创建的 **CglibMethodInvocation** 最终是执行了 **ReflectiveMethodInvocation#proceed** 方法：

```java
@Override
@Nullable
public Object proceed() throws Throwable {
	if (this.currentInterceptorIndex == this.interceptorsAndDynamicMethodMatchers.size() - 1) {
		return invokeJoinpoint();
	}

	Object interceptorOrInterceptionAdvice =
			this.interceptorsAndDynamicMethodMatchers.get(++this.currentInterceptorIndex);
	if (interceptorOrInterceptionAdvice instanceof InterceptorAndDynamicMethodMatcher) {
		InterceptorAndDynamicMethodMatcher dm =
				(InterceptorAndDynamicMethodMatcher) interceptorOrInterceptionAdvice;
		Class<?> targetClass = (this.targetClass != null ? this.targetClass : this.method.getDeclaringClass());
		if (dm.methodMatcher.matches(this.method, targetClass, this.arguments)) {
			return dm.interceptor.invoke(this);
		}
		else {
			return proceed();
		}
	}
	else {
	    //执行实现了MethodInterceptor接口的方法
		return ((MethodInterceptor) interceptorOrInterceptionAdvice).invoke(this);
	}
}
```
这里对于@Transactional注解来说 ((MethodInterceptor) interceptorOrInterceptionAdvice).invoke(this) 这行代码里面的 MethodInterceptor实现就是前面在 ***ProxyTransactionManagementConfiguration*** 里面实例化的 ***TransactionInterceptor*** 类。在这个类里面包含了处理整个事务

### 6. 总结

![](https://github.com/mxsm/picture/blob/main/spring/%E4%BA%8B%E5%8A%A1%E4%BB%A3%E7%90%86%E5%88%9B%E5%BB%BA.png?raw=true)