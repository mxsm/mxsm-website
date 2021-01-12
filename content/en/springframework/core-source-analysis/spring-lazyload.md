---
title: Spring懒加载源码分析
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之核心类核心代码
  - Spring源码解析之懒加载
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之懒加载
abbrlink: 8f2e07a1
date: 2018-04-19 21:24:37
---
### 1 什么是懒加载
Spring中有一个概念叫做懒加载，那么什么是懒加载？**就是在需要用到的时候加载类**。
### 2 Spring是如何处理懒加载。
对于Spring中的一个bean如何判断是否为懒加载Bean。分为两种情况：  
- **Bean的定义由XML完成**

  ```xml
  <bean id="addressBean" class="com.fh.spring.Address" lazy-init="true" />
  ```

- **Bean的定义由注解完成**

  @Lazy注解，对于类和类的变量值使用了@Lazy注解说明这个是懒加载

### 3 分析@Lazy的实现源码
@Lazy注解主要使用在两个地方：
1. 类上面--配合@Component注解使用
2. 类的私有变量上面--配合@Autowired注解使用

#### 3.1 分析@Lazy在类上

```java

@Component
@Lazy
public class ServiceTest {
 //.......省略其他的代码   
}
```
如上示例代码，@Lazy的位置在ServiceTest上面。在Spring扫描对应的包下面的类，解析未BeanDefinition的时候，对应的BeanDefinition#isLazyInit方法返回为true，说明这个BeanDefinition实现的是懒加载。
那么我看一下在DefaultListableBeanFactory#preInstantiateSingletons方法

```java
public void preInstantiateSingletons() throws BeansException {
    
    //省略了部分代码
    for (String beanName : beanNames) {
			RootBeanDefinition bd = getMergedLocalBeanDefinition(beanName);
			//bd.isLazyInit() 如果是true就执行下面的代码
			if (!bd.isAbstract() && bd.isSingleton() && !bd.isLazyInit()) {
			    //  省略Spring源码中的代码
			}
		}
}
```

通过上面的代码可以知道，在容器启动的时候，加了 **`@Lazy`** 的类不会进行实例化。

#### 3.2 分析@Lazy在类的私有变量上面

**@Lazy** 搭配 **@Autowired** 使用， **@Autowired** 的处理类是 **`AutowiredAnnotationBeanPostProcessor`** 

```java
private class AutowiredFieldElement extends InjectionMetadata.InjectedElement {

		private final boolean required;

		private volatile boolean cached = false;

		@Nullable
		private volatile Object cachedFieldValue;

		public AutowiredFieldElement(Field field, boolean required) {
			super(field, null);
			this.required = required;
		}

		@Override
		protected void inject(Object bean, @Nullable String beanName, @Nullable PropertyValues pvs) throws Throwable {
			Field field = (Field) this.member;
			Object value;
			if (this.cached) {
				value = resolvedCachedArgument(beanName, this.cachedFieldValue);
			}
			else {
				DependencyDescriptor desc = new DependencyDescriptor(field, this.required);
				desc.setContainingClass(bean.getClass());
				Set<String> autowiredBeanNames = new LinkedHashSet<>(1);
				Assert.state(beanFactory != null, "No BeanFactory available");
				TypeConverter typeConverter = beanFactory.getTypeConverter();
				try {
                    //这个方法主要用来处理方法
					value = beanFactory.resolveDependency(desc, beanName, autowiredBeanNames, typeConverter);
				}
				catch (BeansException ex) {
					throw new UnsatisfiedDependencyException(null, beanName, new InjectionPoint(field), ex);
				}
				synchronized (this) {
					if (!this.cached) {
						if (value != null || this.required) {
							this.cachedFieldValue = desc;
							registerDependentBeans(beanName, autowiredBeanNames);
							if (autowiredBeanNames.size() == 1) {
								String autowiredBeanName = autowiredBeanNames.iterator().next();
								if (beanFactory.containsBean(autowiredBeanName) &&
										beanFactory.isTypeMatch(autowiredBeanName, field.getType())) {
									this.cachedFieldValue = new ShortcutDependencyDescriptor(
											desc, autowiredBeanName, field.getType());
								}
							}
						}
						else {
							this.cachedFieldValue = null;
						}
						this.cached = true;
					}
				}
			}
			if (value != null) {
				ReflectionUtils.makeAccessible(field);
				field.set(bean, value);
			}
		}
	}
```

看一下value = beanFactory.resolveDependency(desc, beanName, autowiredBeanNames, typeConverter)这段代码：

```java
	public Object resolveDependency(DependencyDescriptor descriptor, @Nullable String requestingBeanName,
			@Nullable Set<String> autowiredBeanNames, @Nullable TypeConverter typeConverter) throws BeansException {

		descriptor.initParameterNameDiscovery(getParameterNameDiscoverer());
		if (Optional.class == descriptor.getDependencyType()) {
			return createOptionalDependency(descriptor, requestingBeanName);
		}
		else if (ObjectFactory.class == descriptor.getDependencyType() ||
				ObjectProvider.class == descriptor.getDependencyType()) {
			return new DependencyObjectProvider(descriptor, requestingBeanName);
		}
		else if (javaxInjectProviderClass == descriptor.getDependencyType()) {
			return new Jsr330Factory().createDependencyProvider(descriptor, requestingBeanName);
		}
		else {
            //处理包含有@Lazy注解的
			Object result = getAutowireCandidateResolver().getLazyResolutionProxyIfNecessary(
					descriptor, requestingBeanName);
			if (result == null) {
				result = doResolveDependency(descriptor, requestingBeanName, autowiredBeanNames, typeConverter);
			}
			return result;
		}
	}
```

> DefaultListableBeanFactory 默认为 private AutowireCandidateResolver autowireCandidateResolver = new SimpleAutowireCandidateResolver();对于注解类的在AnnotationConfigUtils进行了设置，AnnotationConfigUtils#registerAnnotationConfigProcessors方法中。if (!(beanFactory.getAutowireCandidateResolver() instanceof ContextAnnotationAutowireCandidateResolver)) {   beanFactory.setAutowireCandidateResolver(new ContextAnnotationAutowireCandidateResolver());}进行了设置

分析一下 **`ContextAnnotationAutowireCandidateResolver#getLazyResolutionProxyIfNecessary`** 的方法：

```java
public Object getLazyResolutionProxyIfNecessary(DependencyDescriptor descriptor, @Nullable String beanName) {
    	//判断是否为懒加载
		return (isLazy(descriptor) ? buildLazyResolutionProxy(descriptor, beanName) : null);
	}
```

下面来 **`buildLazyResolutionProxy`** 方法，创建代理类：

```java
protected Object buildLazyResolutionProxy(final DependencyDescriptor descriptor, final @Nullable String beanName) {
		Assert.state(getBeanFactory() instanceof DefaultListableBeanFactory,
				"BeanFactory needs to be a DefaultListableBeanFactory");
		final DefaultListableBeanFactory beanFactory = (DefaultListableBeanFactory) getBeanFactory();
		TargetSource ts = new TargetSource() {
			@Override
			public Class<?> getTargetClass() {
				return descriptor.getDependencyType();
			}
			@Override
			public boolean isStatic() {
				return false;
			}
			@Override
			public Object getTarget() {
				Object target = beanFactory.doResolveDependency(descriptor, beanName, null, null);
				if (target == null) {
					Class<?> type = getTargetClass();
					if (Map.class == type) {
						return Collections.emptyMap();
					}
					else if (List.class == type) {
						return Collections.emptyList();
					}
					else if (Set.class == type || Collection.class == type) {
						return Collections.emptySet();
					}
					throw new NoSuchBeanDefinitionException(descriptor.getResolvableType(),
							"Optional dependency not present for lazy injection point");
				}
				return target;
			}
			@Override
			public void releaseTarget(Object target) {
			}
		};
		ProxyFactory pf = new ProxyFactory();
		pf.setTargetSource(ts);
		Class<?> dependencyType = descriptor.getDependencyType();
		if (dependencyType.isInterface()) {
			pf.addInterface(dependencyType);
		}
		return pf.getProxy(beanFactory.getBeanClassLoader());
	}
```

