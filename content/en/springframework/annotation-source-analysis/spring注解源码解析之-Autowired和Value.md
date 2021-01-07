---
title: spring注解源码解析之-Autowired和Value
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之注解
  - Spring注解源码解析之配置类注解
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之注解
abbrlink: 3212314f
date: 2019-05-14 01:38:32
---
### 1. @Autowired和@Value注解--Spring5.2.X

首先来看一下这两个注解的源码

```java
@Target({ElementType.CONSTRUCTOR, ElementType.METHOD, ElementType.PARAMETER, ElementType.FIELD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Autowired {
	boolean required() default true;
}

@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Value {
	String value();
}

```

从上面的源码可以看出来两个注解都可以用于 **`方法、参数、变量、注解类型`** 。**`@Autowired`** 还能用于构造函数。通过这个类使用的地方可以看出来，主要用于类的内部。所以主要是通过 **`BeanPostProcessor`** 来处理这两个注解。

### 2. 注解处理类AutowiredAnnotationBeanPostProcessor源码解析

首先看 ***`AutowiredAnnotationBeanPostProcessor`*** 是如何注入到上下文中的。通过代码发现主要是有 **`AnnotationConfigUtils#registerAnnotationConfigProcessors`** 注入到上下文中的。看一下源码

```java
	public static Set<BeanDefinitionHolder> registerAnnotationConfigProcessors(
			BeanDefinitionRegistry registry, @Nullable Object source) {

		DefaultListableBeanFactory beanFactory = unwrapDefaultListableBeanFactory(registry);
		if (beanFactory != null) {
		//省略代码

        //注入AutowiredAnnotationBeanPostProcessor类的定义
		if (!registry.containsBeanDefinition(AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition(AutowiredAnnotationBeanPostProcessor.class);
			def.setSource(source);
			beanDefs.add(registerPostProcessor(registry, def, AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME));
		}
        }
		//省略代码

		return beanDefs;
	}
```

下面来看一下 **`AutowiredAnnotationBeanPostProcessor`** 源码：

```java
public class AutowiredAnnotationBeanPostProcessor extends InstantiationAwareBeanPostProcessorAdapter
		implements MergedBeanDefinitionPostProcessor, PriorityOrdered, BeanFactoryAware {
    
    //省略代码
}
```

**`AutowiredAnnotationBeanPostProcessor`** 继承了 **`InstantiationAwareBeanPostProcessorAdapter`** 类（这个类是BeanPostProcessor的实现）。然后还实现了其他的三个接口。

首先来看一下这个类的构造函数：

```java
	public AutowiredAnnotationBeanPostProcessor() {
		this.autowiredAnnotationTypes.add(Autowired.class);
		this.autowiredAnnotationTypes.add(Value.class);
		try {
			this.autowiredAnnotationTypes.add((Class<? extends Annotation>)
					ClassUtils.forName("javax.inject.Inject", AutowiredAnnotationBeanPostProcessor.class.getClassLoader()));
			logger.trace("JSR-330 'javax.inject.Inject' annotation found and supported for autowiring");
		}
		catch (ClassNotFoundException ex) {
			// JSR-330 API not available - simply skip.
		}
	}
```

从这个构造函数可以看出来主要处理  **@Autowired、@Value、javax.inject.Inject** 。 第三个是javax。这就是对 JSR-330 标准的支持。通过调用 **`postProcessProperties`** 方法来处理以上的三个注解

```java
	@Override
	public PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName) {
		InjectionMetadata metadata = findAutowiringMetadata(beanName, bean.getClass(), pvs);
		try {
			metadata.inject(bean, beanName, pvs);
		}
		catch (BeanCreationException ex) {
			throw ex;
		}
		catch (Throwable ex) {
			throw new BeanCreationException(beanName, "Injection of autowired dependencies failed", ex);
		}
		return pvs;
	}
```

主要是通过 **`findAutowiringMetadata`** 方法来获取自动注入元数据。以及通过 **`InjectionMetadata#inject`** 方法来注入元数据。

```java
	private InjectionMetadata findAutowiringMetadata(String beanName, Class<?> clazz, @Nullable PropertyValues pvs) {
		// Fall back to class name as cache key, for backwards compatibility with custom callers.
		String cacheKey = (StringUtils.hasLength(beanName) ? beanName : clazz.getName());
		// 从缓存中获取注入元数据
		InjectionMetadata metadata = this.injectionMetadataCache.get(cacheKey);
		//判断是否需要刷新
        if (InjectionMetadata.needsRefresh(metadata, clazz)) {
			synchronized (this.injectionMetadataCache) {
				metadata = this.injectionMetadataCache.get(cacheKey);
				if (InjectionMetadata.needsRefresh(metadata, clazz)) {
					if (metadata != null) {
						metadata.clear(pvs);
					}
                    //创建注入元数据
					metadata = buildAutowiringMetadata(clazz);
                    //缓存注入元数据
					this.injectionMetadataCache.put(cacheKey, metadata);
				}
			}
		}
		return metadata;
	}
```

源代码可以看出来主要是有两个方法：

- **InjectionMetadata.needsRefresh**

  判断从缓存中获取的注入元数据是否需要刷新：

  ```java
  	public static boolean needsRefresh(@Nullable InjectionMetadata metadata, Class<?> clazz) {
  		return (metadata == null || metadata.targetClass != clazz);
  	}
  ```

- **buildAutowiringMetadata**

  创建自动注入的元数据

下面来看一下 **`buildAutowiringMetadata`** 的源码是如何创建自动注入元数据的。

```java
private InjectionMetadata buildAutowiringMetadata(final Class<?> clazz) {
		//判断是否包含 @Autowired @Value 或者@Inject注解
       if (!AnnotationUtils.isCandidateClass(clazz, this.autowiredAnnotationTypes)) {
			return InjectionMetadata.EMPTY;
		}

		List<InjectionMetadata.InjectedElement> elements = new ArrayList<>();
		Class<?> targetClass = clazz;

		do {
			final List<InjectionMetadata.InjectedElement> currElements = new ArrayList<>();
			//通过反射获取targetClass
			ReflectionUtils.doWithLocalFields(targetClass, field -> {
				MergedAnnotation<?> ann = findAutowiredAnnotation(field);
				if (ann != null) {
					if (Modifier.isStatic(field.getModifiers())) {
						if (logger.isInfoEnabled()) {
							logger.info("Autowired annotation is not supported on static fields: " + field);
						}
						return;
					}
					boolean required = determineRequiredStatus(ann);
					currElements.add(new AutowiredFieldElement(field, required));
				}
			});

			ReflectionUtils.doWithLocalMethods(targetClass, method -> {
				Method bridgedMethod = BridgeMethodResolver.findBridgedMethod(method);
				if (!BridgeMethodResolver.isVisibilityBridgeMethodPair(method, bridgedMethod)) {
					return;
				}
				MergedAnnotation<?> ann = findAutowiredAnnotation(bridgedMethod);
				if (ann != null && method.equals(ClassUtils.getMostSpecificMethod(method, clazz))) {
					if (Modifier.isStatic(method.getModifiers())) {
						if (logger.isInfoEnabled()) {
							logger.info("Autowired annotation is not supported on static methods: " + method);
						}
						return;
					}
					if (method.getParameterCount() == 0) {
						if (logger.isInfoEnabled()) {
							logger.info("Autowired annotation should only be used on methods with parameters: " +
									method);
						}
					}
					boolean required = determineRequiredStatus(ann);
					PropertyDescriptor pd = BeanUtils.findPropertyForMethod(bridgedMethod, clazz);
					currElements.add(new AutowiredMethodElement(method, required, pd));
				}
			});

			elements.addAll(0, currElements);
			targetClass = targetClass.getSuperclass();
		}
		while (targetClass != null && targetClass != Object.class);

		return InjectionMetadata.forElements(elements, clazz);
	}
```

通过上面的代码可以看出来处理主要分成了两类：

- 处理类的字段上面的注解
- 处理方法上面注解

根据处理的不同的数据创建两个不同的自动注入元素。字段的创建 **`AutowiredFieldElement`**  、 方法上面的注解创建 **`AutowiredMethodElement`** 。

```java
private class AutowiredFieldElement extends InjectionMetadata.InjectedElement {
 //省略代码   
}
private class AutowiredMethodElement extends InjectionMetadata.InjectedElement {
    //省略代码
}
```

以上两个都是内部类。都继承了 **`InjectionMetadata.InjectedElement`**  的接口。根据不同类型创建好以后通过调用：

```java
return InjectionMetadata.forElements(elements, clazz);
```

创建返回数据。也就是调用 **`findAutowiringMetadata`** 方法中的 **`buildAutowiringMetadata`** 方法。在前面分析过

```java
	public void processInjection(Object bean) throws BeanCreationException {
		Class<?> clazz = bean.getClass();
		InjectionMetadata metadata = findAutowiringMetadata(clazz.getName(), clazz, null);
		try {
            //这里就是注入数据。
			metadata.inject(bean, null, null);
		}
		catch (BeanCreationException ex) {
			throw ex;
		}
		catch (Throwable ex) {
			throw new BeanCreationException(
					"Injection of autowired dependencies failed for class [" + clazz + "]", ex);
		}
	}
```
这里可以分一下 ***`InjectionMetadata#inject`*** 方法

```java
	public void inject(Object target, @Nullable String beanName, @Nullable PropertyValues pvs) throws Throwable {
		Collection<InjectedElement> checkedElements = this.checkedElements;
		Collection<InjectedElement> elementsToIterate =
				(checkedElements != null ? checkedElements : this.injectedElements);
		if (!elementsToIterate.isEmpty()) {
			for (InjectedElement element : elementsToIterate) {
				if (logger.isTraceEnabled()) {
					logger.trace("Processing injected element of bean '" + beanName + "': " + element);
				}
				//主要是InjectedElement#inject来处理
				element.inject(target, beanName, pvs);
			}
		}
	}
```
最终是通过调用 ***`InjectedElement#inject`*** 方法来注入。下面来分析一下  **AutowiredFieldElement** 和 **AutowiredMethodElement** 的实现。

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
			//第一次不会进入因为cached默认为false
			if (this.cached) {
				value = resolvedCachedArgument(beanName, this.cachedFieldValue);
			}
			else {
				//创建一个依赖的描述
				DependencyDescriptor desc = new DependencyDescriptor(field, this.required);
				desc.setContainingClass(bean.getClass());
				Set<String> autowiredBeanNames = new LinkedHashSet<>(1);
				Assert.state(beanFactory != null, "No BeanFactory available");
				//获取类型转换器
				TypeConverter typeConverter = beanFactory.getTypeConverter();
				try {
					//获取值
					value = beanFactory.resolveDependency(desc, beanName, autowiredBeanNames, typeConverter);
				}
				catch (BeansException ex) {
					throw new UnsatisfiedDependencyException(null, beanName, new InjectionPoint(field), ex);
				}
				//处理依赖注入的数据
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
			//在Value不为空的情况下通过反射设置值
			if (value != null) {
				ReflectionUtils.makeAccessible(field);
				field.set(bean, value);
			}
		}
	}
```
 ***`AutowiredMethodElement`*** 的实现和 ***`AutowiredFieldElement`*** 实现差不多。

### 3. 自定义拓展
自定义的拓展可以参考一下几个项目：

- [自定义的Nacos的拓展项目地址](https://github.com/mxsm/spring-sample/tree/master/mxsm-nacos)
- [阿里巴巴的Nacos项目Spring拓展](https://github.com/nacos-group/nacos-spring-project)

第一个项目是自己写的，类似于@Value注解。