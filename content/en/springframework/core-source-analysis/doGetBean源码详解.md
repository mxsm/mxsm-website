---
title: doGetBean源码详解
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之关键代码
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之关键代码
abbrlink: 2500f216
date: 2019-01-25 23:15:10
---
### 1. doGetBean方法源码解析

```java
protected <T> T doGetBean(final String name, @Nullable final Class<T> requiredType,
			@Nullable final Object[] args, boolean typeCheckOnly) throws BeansException {

		/**
		 * 通过name获取BeanName,这里不能使用name作为beanName：
		 * 1. name可能是别名，通过方法转换为具体的实例名称
		 * 2. name可能会以&开头，表明调用者想获取FactoryBean本身，而非FactoryBean创建bean
		 *    FactoryBean 的实现类和其他的 bean 存储方式是一致的，即 <beanName, bean>，
		 *    beanName 中是没有 & 这个字符的。所以我们需要将 name 的首字符 & 移除，这样才能从
		 *    缓存里取到 FactoryBean 实例。
		 *
		 */
		final String beanName = transformedBeanName(name);
		Object bean;

		// 从缓存中获取bean
		Object sharedInstance = getSingleton(beanName);

		/*
		 * 如果 sharedInstance = null，则说明缓存里没有对应的实例，表明这个实例还没创建。
		 *( BeanFactory 并不会在一开始就将所有的单例 bean 实例化好，而是在调用 getBean 获取bean 时再实例化，也就是懒加载)。
		 * getBean 方法有很多重载，比如 getBean(String name, Object... args)，我们在首次获取
		 * 某个 bean 时，可以传入用于初始化 bean 的参数数组（args），BeanFactory 会根据这些参数
		 * 去匹配合适的构造方法构造 bean 实例。当然，如果单例 bean 早已创建好，这里的 args 就没有
		 * 用了，BeanFactory 不会多次实例化单例 bean。
		 */
		if (sharedInstance != null && args == null) {
			if (logger.isTraceEnabled()) {
				if (isSingletonCurrentlyInCreation(beanName)) {
					logger.trace("Returning eagerly cached instance of singleton bean '" + beanName +
							"' that is not fully initialized yet - a consequence of a circular reference");
				}
				else {
					logger.trace("Returning cached instance of singleton bean '" + beanName + "'");
				}
			}

			/*
			 * 如果 sharedInstance 是普通的单例 bean，下面的方法会直接返回。但如果
			 * sharedInstance 是 FactoryBean 类型的，则需调用 getObject 工厂方法获取真正的
			 * bean 实例。如果用户想获取 FactoryBean 本身，这里也不会做特别的处理，直接返回
			 * 即可。毕竟 FactoryBean 的实现类本身也是一种 bean，只不过具有一点特殊的功能而已。
			 */
			bean = getObjectForBeanInstance(sharedInstance, name, beanName, null);
		}

		/*
		 * 如果上面的条件不满足，则表明 sharedInstance 可能为空，此时 beanName 对应的 bean
		 * 实例可能还未创建。这里还存在另一种可能，如果当前容器有父容器，beanName 对应的 bean 实例
		 * 可能是在父容器中被创建了，所以在创建实例前，需要先去父容器里检查一下。
		 */
		else {
			// BeanFactory 不缓存 Prototype 类型的 bean，无法处理该类型 bean 的循环依赖问题
            //判断是否存在循环依赖
			if (isPrototypeCurrentlyInCreation(beanName)) {
				throw new BeanCurrentlyInCreationException(beanName);
			}

			// 如果 sharedInstance = null，则到父容器中查找 bean 实例
			BeanFactory parentBeanFactory = getParentBeanFactory();
			if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
				// Not found -> check parent.
				String nameToLookup = originalBeanName(name);
				if (parentBeanFactory instanceof AbstractBeanFactory) {
					return ((AbstractBeanFactory) parentBeanFactory).doGetBean(
							nameToLookup, requiredType, args, typeCheckOnly);
				}
				else if (args != null) {
					// Delegation to parent with explicit args.
					return (T) parentBeanFactory.getBean(nameToLookup, args);
				}
				else if (requiredType != null) {
					// No args -> delegate to standard getBean method.
					return parentBeanFactory.getBean(nameToLookup, requiredType);
				}
				else {
					return (T) parentBeanFactory.getBean(nameToLookup);
				}
			}

			if (!typeCheckOnly) {
				markBeanAsCreated(beanName);
			}

			try {
				// 合并父 BeanDefinition 与子 BeanDefinition
				final RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
				checkMergedBeanDefinition(mbd, beanName, args);

				// 检查是否有 dependsOn 依赖，如果有则先初始化所依赖的 bean
				String[] dependsOn = mbd.getDependsOn();
				if (dependsOn != null) {
					for (String dep : dependsOn) {

						/*
						 * 检测是否存在 depends-on 循环依赖，若存在则抛异常。比如 A 依赖 B，
						 * B 又依赖 A，他们的配置如下：
						 *   <bean id="beanA" class="BeanA" depends-on="beanB">
						 *   <bean id="beanB" class="BeanB" depends-on="beanA">
						 *
						 * beanA 要求 beanB 在其之前被创建，但 beanB 又要求 beanA 先于它
						 * 创建。这个时候形成了循环，对于 depends-on 循环，Spring 会直接
						 * 抛出异常
						 */

						if (isDependent(beanName, dep)) {
							throw new BeanCreationException(mbd.getResourceDescription(), beanName,
									"Circular depends-on relationship between '" + beanName + "' and '" + dep + "'");
						}
						// 注册依赖记录
						registerDependentBean(dep, beanName);
						try {
							// 加载 depends-on 依赖
							getBean(dep);
						}
						catch (NoSuchBeanDefinitionException ex) {
							throw new BeanCreationException(mbd.getResourceDescription(), beanName,
									"'" + beanName + "' depends on missing bean '" + dep + "'", ex);
						}
					}
				}

				// 创建 bean 实例
				if (mbd.isSingleton()) {

					/*
					 * 这里并没有直接调用 createBean 方法创建 bean 实例，而是通过
					 * getSingleton(String, ObjectFactory) 方法获取 bean 实例。
					 * getSingleton(String, ObjectFactory) 方法会在内部调用
					 * ObjectFactory 的 getObject() 方法创建 bean，并会在创建完成后，
					 * 将 bean 放入缓存中。
					 */

					sharedInstance = getSingleton(beanName, () -> {
						try {
							return createBean(beanName, mbd, args);
						}
						catch (BeansException ex) {
							// Explicitly remove instance from singleton cache: It might have been put there
							// eagerly by the creation process, to allow for circular reference resolution.
							// Also remove any beans that received a temporary reference to the bean.
							destroySingleton(beanName);
							throw ex;
						}
					});
					// 如果 bean 是 FactoryBean 类型，则调用工厂方法获取真正的 bean 实例。否则直接返回 bean 实例
					bean = getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
				}
				// 创建 prototype 类型的 bean 实例
				else if (mbd.isPrototype()) {
					// It's a prototype -> create a new instance.
					Object prototypeInstance = null;
					try {
						beforePrototypeCreation(beanName);
						prototypeInstance = createBean(beanName, mbd, args);
					}
					finally {
						afterPrototypeCreation(beanName);
					}
					bean = getObjectForBeanInstance(prototypeInstance, name, beanName, mbd);
				}
				// 创建其他类型的 bean 实例
				else {
					String scopeName = mbd.getScope();
					final Scope scope = this.scopes.get(scopeName);
					if (scope == null) {
						throw new IllegalStateException("No Scope registered for scope name '" + scopeName + "'");
					}
					try {
						Object scopedInstance = scope.get(beanName, () -> {
							beforePrototypeCreation(beanName);
							try {
								return createBean(beanName, mbd, args);
							}
							finally {
								afterPrototypeCreation(beanName);
							}
						});
						bean = getObjectForBeanInstance(scopedInstance, name, beanName, mbd);
					}
					catch (IllegalStateException ex) {
						throw new BeanCreationException(beanName,
								"Scope '" + scopeName + "' is not active for the current thread; consider " +
								"defining a scoped proxy for this bean if you intend to refer to it from a singleton",
								ex);
					}
				}
			}
			catch (BeansException ex) {
				cleanupAfterBeanCreationFailure(beanName);
				throw ex;
			}
		}

		// Check if required type matches the type of the actual bean instance.
		if (requiredType != null && !requiredType.isInstance(bean)) {
			try {
				T convertedBean = getTypeConverter().convertIfNecessary(bean, requiredType);
				if (convertedBean == null) {
					throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
				}
				return convertedBean;
			}
			catch (TypeMismatchException ex) {
				if (logger.isTraceEnabled()) {
					logger.trace("Failed to convert bean '" + name + "' to required type '" +
							ClassUtils.getQualifiedName(requiredType) + "'", ex);
				}
				throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
			}
		}
		return (T) bean;
	}
```

从源码分析一下 **`doGetBean`** 的执行流程如下：

1. **转换beanName**

   > 传入的name参数可能是别名，也可能是FactoryBean，索引还需要进行一系列解析

   - 去除FactoryBean的修饰符，也就是如果name=也就是如果name = "&factoryBean"，那么会首先去除&而使name = "factoryBean"
   - 将别名alias转换为最终指向的beanName，比如别名A执行名称为B的bean，而B没有指向任何其他的bean，即为最终的bean，则返回B;但是如果B又指向C，而是C是最终的bean，则返回C。

2. **尝试从缓存中获取原始单例**

   > **这就是Spring的IOC，首先尝试从缓存中加载单例模式**

3. #### 检测是否为FactoryBean并获取Bean以及初始化后处理

   > 在doGetBean方法中频繁出现getObjectForBeanInstance方法，它主要完成对获取的Bean Instance进行检测是否为FactoryBean，如果是FactoryBean则通过工厂方法获取Bean以及初始化后处理

4. #### 创建单例Bean

   > 如果缓存中没有单例Bean的缓存，则需要从头开始创建单例Bean，这主要是重载getSingleton的重载方法来实现单例Bean的加载。

5. #### 原型模式的依赖检查

   > 只有单例模式才会尝试解决循环依赖，如果存在A中有B的属性，B中有A的属性，那么当依赖注入的时候看，就会产生当A还未创建完的时候因为对于B的创建再次返回创建A，造成循环依赖，也就是情况：isPrototypeCurrentlyInCreation(beanName)判断为true

6. **处理 depends-on 依赖**

7. **创建并缓存 bean**

8. **调用 getObjectForBeanInstance 方法，并按 name 规则返回相应的 bean 实例**

9. **按需转换 bean 类型，并返回转换后的 bean 实例**

### 2. 方法的源码解析

接下来逐步分析每一个方法

#### 2.1 transformedBeanName

**`transformedBeanName(name)`**  **`beanName`** 的转换，之前分析过由于 **`name`** 可能是 **`FactoryBean`** 或者普通的 Bean的别名所以需要转换。

> name可能是FactoryBean或者是beanName的别名，用当前这个方法来进行转换成真正的beanName来进行后续的操作

```java
protected String transformedBeanName(String name) {
	//BeanFactoryUtils.transformedBeanName(name)处理 FactoryBean 类型
    return canonicalName(BeanFactoryUtils.transformedBeanName(name));
}

//FactoryBean转换
public static String transformedBeanName(String name) {
    	//判空
		Assert.notNull(name, "'name' must not be null");
    	//判断是否已 & 开头是否为FactoryBean
		if (!name.startsWith(BeanFactory.FACTORY_BEAN_PREFIX)) {
			return name;
		}
		return transformedBeanNameCache.computeIfAbsent(name, beanName -> {
			do {
				beanName = beanName.substring(BeanFactory.FACTORY_BEAN_PREFIX.length());
			}
			while (beanName.startsWith(BeanFactory.FACTORY_BEAN_PREFIX));
			return beanName;
		});
}

//将别名处理成BeanName
public String canonicalName(String name) {
		String canonicalName = name;
		// Handle aliasing...
		String resolvedName;
		do {
			resolvedName = this.aliasMap.get(canonicalName);
			if (resolvedName != null) {
				canonicalName = resolvedName;
			}
		}
		while (resolvedName != null);
		return canonicalName;
	}

```

从上面可以看出来 **transformedBeanName** 方法主要是用来处理beanName。

#### 2.2 getSingleton(beanName)

**`getSingleton(beanName)`** 主要从缓存中获取bean。

```java
public Object getSingleton(String beanName) {
		return getSingleton(beanName, true);
}

	protected Object getSingleton(String beanName, boolean allowEarlyReference) {
        //从缓存Map中获取
		Object singletonObject = this.singletonObjects.get(beanName);
		if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
			synchronized (this.singletonObjects) {
                //从earlySingletonObjects获取bean
				singletonObject = this.earlySingletonObjects.get(beanName);
				if (singletonObject == null && allowEarlyReference) {
					ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
					if (singletonFactory != null) {
						singletonObject = singletonFactory.getObject();
						this.earlySingletonObjects.put(beanName, singletonObject);
						this.singletonFactories.remove(beanName);
					}
				}
			}
		}
		return singletonObject;
	}
```

#### 2.3 AbstractBeanFactory#getObjectForBeanInstance方法

通过给定的bean实例获取对象，返回的bean为自己或者是FactoryBean创建的对象。

```java
	protected Object getObjectForBeanInstance(
			Object beanInstance, String name, String beanName, @Nullable RootBeanDefinition mbd) {

		//判断name是否为Bean FactoryBean的引用
		if (BeanFactoryUtils.isFactoryDereference(name)) {
			if (beanInstance instanceof NullBean) {
				return beanInstance;
			}
			if (!(beanInstance instanceof FactoryBean)) {
				throw new BeanIsNotAFactoryException(transformedBeanName(name), beanInstance.getClass());
			}
		}

		//现在beanInstance可能是普通的bena或者FactoryBean，如果是普通的Bean直接返回实例
		if (!(beanInstance instanceof FactoryBean) || BeanFactoryUtils.isFactoryDereference(name)) {
			return beanInstance;
		}

		//如果是FactoryBean，使用FactoryBean来创建一个bean实例
		Object object = null;
		if (mbd == null) {
			object = getCachedObjectForFactoryBean(beanName);
		}
		if (object == null) {
			// Return bean instance from factory.
			FactoryBean<?> factory = (FactoryBean<?>) beanInstance;
			// Caches object obtained from FactoryBean if it is a singleton.
			if (mbd == null && containsBeanDefinition(beanName)) {
				mbd = getMergedLocalBeanDefinition(beanName);
			}
			boolean synthetic = (mbd != null && mbd.isSynthetic());
            //这里从FactoryBean中获取创建的Bean
			object = getObjectFromFactoryBean(factory, beanName, !synthetic);
		}
		return object;
	}
```

> FactoryBean创建的Bean的名称FactoryBean本身作为一个Bean在Spring容器中是用是否包含 **`&`** 前缀来区分的。

#### 2.4  创建单例Bean DefaultSingletonBeanRegistry#getSingleton

在bean的创建过程，通过判断 **`scope`** 来判断创建的Bean的类型

```java
				if (mbd.isSingleton()) {
                    //创建单例
					sharedInstance = getSingleton(beanName, () -> {
						try {
							return createBean(beanName, mbd, args);
						}
						catch (BeansException ex) {
							destroySingleton(beanName);
							throw ex;
						}
					});
					bean = getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
				}
```

通过上面可以看出主要是通过调用 **`DefaultSingletonBeanRegistry#getSingleton`** 来创建Bean

```java
		public Object getSingleton(String beanName, ObjectFactory<?> singletonFactory) {
		Assert.notNull(beanName, "Bean name must not be null");
		synchronized (this.singletonObjects) {
			//从缓存中获取Bean
			Object singletonObject = this.singletonObjects.get(beanName);
			if (singletonObject == null) {

				beforeSingletonCreation(beanName);
				boolean newSingleton = false;
				boolean recordSuppressedExceptions = (this.suppressedExceptions == null);
				if (recordSuppressedExceptions) {
					this.suppressedExceptions = new LinkedHashSet<>();
				}
				try {
					//创建Bean
					singletonObject = singletonFactory.getObject();
					newSingleton = true;
				}
				catch (IllegalStateException ex) {
					//从缓存中获取
					singletonObject = this.singletonObjects.get(beanName);
					if (singletonObject == null) {
						throw ex;
					}
				}
				catch (BeanCreationException ex) {
					if (recordSuppressedExceptions) {
						for (Exception suppressedException : this.suppressedExceptions) {
							ex.addRelatedCause(suppressedException);
						}
					}
					throw ex;
				}
				finally {
					if (recordSuppressedExceptions) {
						this.suppressedExceptions = null;
					}
					afterSingletonCreation(beanName);
				}
				if (newSingleton) {
					addSingleton(beanName, singletonObject);
				}
			}
			return singletonObject;
		}
	}
```

上面的主要一行代码 **`singletonObject = singletonFactory.getObject();`** 来获取，也就是代码中执行的 **`createBean(beanName, mbd, args)`**  

```java
sharedInstance = getSingleton(beanName, () -> {
						try {
                            //这里才是真正的调用创建Bean
							return createBean(beanName, mbd, args);
						}
						catch (BeansException ex) {
							destroySingleton(beanName);
							throw ex;
						}
					});
```

**`createbean`** 是 **`AbstractBeanFactory`** 类的一个抽象方法，实现看具体的子类。 抽象子类 **`AbstractAutowireCapableBeanFactory`** 对  **`createBean`** 方法进行了实现。

```java
	protected Object createBean(String beanName, RootBeanDefinition mbd, @Nullable Object[] args)
			throws BeanCreationException {


		RootBeanDefinition mbdToUse = mbd;

		//确定并加载bean的class
		Class<?> resolvedClass = resolveBeanClass(mbd, beanName);
		if (resolvedClass != null && !mbd.hasBeanClass() && mbd.getBeanClassName() != null) {
			mbdToUse = new RootBeanDefinition(mbd);
			mbdToUse.setBeanClass(resolvedClass);
		}

		// 准备需要的方法
		try {
			mbdToUse.prepareMethodOverrides();
		}
		catch (BeanDefinitionValidationException ex) {
			throw new BeanDefinitionStoreException(mbdToUse.getResourceDescription(),
					beanName, "Validation of method overrides failed", ex);
		}

		try {
			// 给InstantiationAwareBeanPostProcessor返回一个代理对象而不是真正的对象
			// 这里主要处理的InstantiationAwareBeanPostProcessor，处理对象的实例化
			Object bean = resolveBeforeInstantiation(beanName, mbdToUse);
			if (bean != null) {
				return bean;
			}
		}
		catch (Throwable ex) {
			throw new BeanCreationException(mbdToUse.getResourceDescription(), beanName,
					"BeanPostProcessor before instantiation of bean failed", ex);
		}

		try {
			//创建真正的bean
			Object beanInstance = doCreateBean(beanName, mbdToUse, args);

			return beanInstance;
		}
		catch (BeanCreationException | ImplicitlyAppearedSingletonException ex) {
			throw ex;
		}
		catch (Throwable ex) {
			throw new BeanCreationException(
					mbdToUse.getResourceDescription(), beanName, "Unexpected exception during bean creation", ex);
		}
	}
```

> **Object bean = resolveBeforeInstantiation(beanName, mbdToUse) 上面的这段代码是需要关注的，这个主要用来处理实现了InstantiationAwareBeanPostProcessor接口的类**

在对于不是实现代理类似通过调用 **`doCreateBean`** 方法来创建对象的：

```java
	protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, final @Nullable Object[] args)
			throws BeanCreationException {

		// 实例化 bean.
		BeanWrapper instanceWrapper = null;
		if (mbd.isSingleton()) {
			instanceWrapper = this.factoryBeanInstanceCache.remove(beanName);
		}
		if (instanceWrapper == null) {
			instanceWrapper = createBeanInstance(beanName, mbd, args);
		}
		final Object bean = instanceWrapper.getWrappedInstance();
		Class<?> beanType = instanceWrapper.getWrappedClass();
		if (beanType != NullBean.class) {
			mbd.resolvedTargetType = beanType;
		}

		// 下面开始处理 Bean实现的 BeanPostProcessor
		synchronized (mbd.postProcessingLock) {
			if (!mbd.postProcessed) {
				try {
					//处理实现了MergedBeanDefinitionPostProcessor接口的
					applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName);
				}
				catch (Throwable ex) {
					throw new BeanCreationException(mbd.getResourceDescription(), beanName,
							"Post-processing of merged bean definition failed", ex);
				}
				mbd.postProcessed = true;
			}
		}

		//循环引用的处理
		boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
				isSingletonCurrentlyInCreation(beanName));
		if (earlySingletonExposure) {
			addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
		}

		// 初始化Bean
		Object exposedObject = bean;
		try {
            //处理InstantiationAwareBeanPostProcessor的postProcessAfterInstantiation
			populateBean(beanName, mbd, instanceWrapper);
			//初始化Bean -- 包含处理 BeanPostProcessor的实现以及init方法
			exposedObject = initializeBean(beanName, exposedObject, mbd);
		}
		catch (Throwable ex) {
			if (ex instanceof BeanCreationException && beanName.equals(((BeanCreationException) ex).getBeanName())) {
				throw (BeanCreationException) ex;
			}
			else {
				throw new BeanCreationException(
						mbd.getResourceDescription(), beanName, "Initialization of bean failed", ex);
			}
		}

		if (earlySingletonExposure) {
			Object earlySingletonReference = getSingleton(beanName, false);
			if (earlySingletonReference != null) {
				if (exposedObject == bean) {
					exposedObject = earlySingletonReference;
				}
				else if (!this.allowRawInjectionDespiteWrapping && hasDependentBean(beanName)) {
					String[] dependentBeans = getDependentBeans(beanName);
					Set<String> actualDependentBeans = new LinkedHashSet<>(dependentBeans.length);
					for (String dependentBean : dependentBeans) {
						if (!removeSingletonIfCreatedForTypeCheckOnly(dependentBean)) {
							actualDependentBeans.add(dependentBean);
						}
					}
					if (!actualDependentBeans.isEmpty()) {
						throw new BeanCurrentlyInCreationException(beanName,
								"Bean with name '" + beanName + "' has been injected into other beans [" +
								StringUtils.collectionToCommaDelimitedString(actualDependentBeans) +
								"] in its raw version as part of a circular reference, but has eventually been " +
								"wrapped. This means that said other beans do not use the final version of the " +
								"bean. This is often the result of over-eager type matching - consider using " +
								"'getBeanNamesOfType' with the 'allowEagerInit' flag turned off, for example.");
					}
				}
			}
		}

		// 处理实现了DisposableBean接口的bean
		try {
			registerDisposableBeanIfNecessary(beanName, bean, mbd);
		}
		catch (BeanDefinitionValidationException ex) {
			throw new BeanCreationException(
					mbd.getResourceDescription(), beanName, "Invalid destruction signature", ex);
		}

		return exposedObject;
	}
```

> **`exposedObject = initializeBean(beanName, exposedObject, mbd)`** 这个方法主要执行了我们实现的 BeanPostProcessor。
>
> BeanPostProcessor的Bean被单独保存对象的私有变量
