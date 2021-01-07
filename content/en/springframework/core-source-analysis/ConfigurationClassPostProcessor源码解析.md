---
title: ConfigurationClassPostProcessor源码解析
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之核心类核心代码
  - Spring源码解析之Bean
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之Bean
abbrlink: 4e69d808
date: 2018-04-02 05:25:26
---
### 1. ConfigurationClassPostProcessor
这个类主要用来处理Spring中的配置注解，Spring的配置注解主要包含一下几个：
1. **@Component**
2. **@ComponentScan 和 @ComponentScans**
3. **@Import**
4. **@ImportResource**
5. **@PropertySource**
6. **@Bean**
7. **@Configuration**

以上七个是Spring最常见的配置类注解，下面来分析一下每一个注解在Spring中的实现。
### 2. ConfigurationClassPostProcessor源码分析
**`ConfigurationClassPostProcessor`** 主要是通过 **AnnotationConfigUtils#registerAnnotationConfigProcessors** 方法注入 **`ConfigurationClassPostProcessor`** 的 **`BeanDefinition`** 。下面看一下 **`ConfigurationClassPostProcessor`** 源码

```java
public class ConfigurationClassPostProcessor implements BeanDefinitionRegistryPostProcessor,
		PriorityOrdered, ResourceLoaderAware, BeanClassLoaderAware, EnvironmentAware {
    // 省略里面的代码 这里看一下定义		    
}
```
通过上面可以看到实现了 **BeanDefinitionRegistryPostProcessor** 这个接口。这个接口是Spring中的一个很重要的 **BeanFactoryPostProcessor** 继承。下面具体看一下里面的两个重要的方法：

```java
public class ConfigurationClassPostProcessor implements BeanDefinitionRegistryPostProcessor,
		PriorityOrdered, ResourceLoaderAware, BeanClassLoaderAware, EnvironmentAware {
    
    //BeanDefinitionRegistryPostProcessor的方法实现
    @Override
	public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
		int registryId = System.identityHashCode(registry);
		if (this.registriesPostProcessed.contains(registryId)) {
			throw new IllegalStateException(
					"postProcessBeanDefinitionRegistry already called on this post-processor against " + registry);
		}
		if (this.factoriesPostProcessed.contains(registryId)) {
			throw new IllegalStateException(
					"postProcessBeanFactory already called on this post-processor against " + registry);
		}
		this.registriesPostProcessed.add(registryId);
        //关键性的方法--处理配置Bean定义
		processConfigBeanDefinitions(registry);
	}
	
	//BeanFactoryPostProcessor的方法实现
	@Override
	public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
		int factoryId = System.identityHashCode(beanFactory);
		if (this.factoriesPostProcessed.contains(factoryId)) {
			throw new IllegalStateException(
					"postProcessBeanFactory already called on this post-processor against " + beanFactory);
		}
		this.factoriesPostProcessed.add(factoryId);
		if (!this.registriesPostProcessed.contains(factoryId)) {
		    //关键性的方法
			processConfigBeanDefinitions((BeanDefinitionRegistry) beanFactory);
		}

		enhanceConfigurationClasses(beanFactory);
		beanFactory.addBeanPostProcessor(new ImportAwareBeanPostProcessor(beanFactory));
	}
}
```
下面看一下 **`processConfigBeanDefinitions`** 方法

```java
	public void processConfigBeanDefinitions(BeanDefinitionRegistry registry) {
		List<BeanDefinitionHolder> configCandidates = new ArrayList<>();
		//从Spring容器中获取注册的BeanDefinition名称
		String[] candidateNames = registry.getBeanDefinitionNames();

		for (String beanName : candidateNames) {

			//获取beanName对应的BeanDefinition
			BeanDefinition beanDef = registry.getBeanDefinition(beanName);
			//排除ConfigurationClassPostProcessor
			if (beanDef.getAttribute(ConfigurationClassUtils.CONFIGURATION_CLASS_ATTRIBUTE) != null) {
				if (logger.isDebugEnabled()) {
					logger.debug("Bean definition has already been processed as a configuration class: " + beanDef);
				}
			}
			//判断是否包含Configuration注解然后判断是否包含
			else if (ConfigurationClassUtils.checkConfigurationClassCandidate(beanDef, this.metadataReaderFactory)) {
				configCandidates.add(new BeanDefinitionHolder(beanDef, beanName));
			}
		}
		// 如果没有发现Configuration直接返回
		if (configCandidates.isEmpty()) {
			return;
		}

		// 处理包含了@Order注解
		configCandidates.sort((bd1, bd2) -> {
			int i1 = ConfigurationClassUtils.getOrder(bd1.getBeanDefinition());
			int i2 = ConfigurationClassUtils.getOrder(bd2.getBeanDefinition());
			return Integer.compare(i1, i2);
		});


		SingletonBeanRegistry sbr = null;
		if (registry instanceof SingletonBeanRegistry) {
			sbr = (SingletonBeanRegistry) registry;
			if (!this.localBeanNameGeneratorSet) {
				BeanNameGenerator generator = (BeanNameGenerator) sbr.getSingleton(
						AnnotationConfigUtils.CONFIGURATION_BEAN_NAME_GENERATOR);
				if (generator != null) {
					this.componentScanBeanNameGenerator = generator;
					this.importBeanNameGenerator = generator;
				}
			}
		}

		if (this.environment == null) {
			this.environment = new StandardEnvironment();
		}

		// ConfigurationClassParser解析每一个带有@Configuration注解的类
		ConfigurationClassParser parser = new ConfigurationClassParser(
				this.metadataReaderFactory, this.problemReporter, this.environment,
				this.resourceLoader, this.componentScanBeanNameGenerator, registry);

		Set<BeanDefinitionHolder> candidates = new LinkedHashSet<>(configCandidates);
		Set<ConfigurationClass> alreadyParsed = new HashSet<>(configCandidates.size());
		do {
            //解析包含有Configuration注解的类
			parser.parse(candidates);
			parser.validate();

			Set<ConfigurationClass> configClasses = new LinkedHashSet<>(parser.getConfigurationClasses());
			configClasses.removeAll(alreadyParsed);

			// 读取创建解析后的BeanDefinition到上下文Context中
			if (this.reader == null) {
				this.reader = new ConfigurationClassBeanDefinitionReader(
						registry, this.sourceExtractor, this.resourceLoader, this.environment,
						this.importBeanNameGenerator, parser.getImportRegistry());
			}
			this.reader.loadBeanDefinitions(configClasses);
			alreadyParsed.addAll(configClasses);

			candidates.clear();
			if (registry.getBeanDefinitionCount() > candidateNames.length) {
				String[] newCandidateNames = registry.getBeanDefinitionNames();
				Set<String> oldCandidateNames = new HashSet<>(Arrays.asList(candidateNames));
				Set<String> alreadyParsedClasses = new HashSet<>();
				for (ConfigurationClass configurationClass : alreadyParsed) {
					alreadyParsedClasses.add(configurationClass.getMetadata().getClassName());
				}
				for (String candidateName : newCandidateNames) {
					if (!oldCandidateNames.contains(candidateName)) {
						BeanDefinition bd = registry.getBeanDefinition(candidateName);
						if (ConfigurationClassUtils.checkConfigurationClassCandidate(bd, this.metadataReaderFactory) &&
								!alreadyParsedClasses.contains(bd.getBeanClassName())) {
							candidates.add(new BeanDefinitionHolder(bd, candidateName));
						}
					}
				}
				candidateNames = newCandidateNames;
			}
		}
		while (!candidates.isEmpty());

		//注册ImportRegistry作为一个Bean去支持ImportAware导入@Configuration类
		if (sbr != null && !sbr.containsSingleton(IMPORT_REGISTRY_BEAN_NAME)) {
			sbr.registerSingleton(IMPORT_REGISTRY_BEAN_NAME, parser.getImportRegistry());
		}

		if (this.metadataReaderFactory instanceof CachingMetadataReaderFactory) {
			// Clear cache in externally provided MetadataReaderFactory; this is a no-op
			// for a shared cache since it'll be cleared by the ApplicationContext.
			((CachingMetadataReaderFactory) this.metadataReaderFactory).clearCache();
		}
	}
```
#### 2.1 ConfigurationClassParser对象的分析

***ConfigurationClassParser*** 主要分为几个部分：

- **@Component注解的解析**
- **@PropertySources、@PropertySource 注解的解析**
- **@ComponentScans.class, @ComponentScan.class注解的解析**
- **@Import注解的解析**
- **@ImportResource注解的解析**
- **@Configuration配置类中@Bean注解的解析**

***ConfigurationClassParser*** 主要是解析 ***@Configuration*** 注解类上或者类里面的这些注解下面来逐一分析。

解析 **`@Configuration`** 主要是通过 **`ConfigurationClassParser`** 对象的parse方法来进行解析

```java
public void parse(Set<BeanDefinitionHolder> configCandidates) {
		for (BeanDefinitionHolder holder : configCandidates) {
			BeanDefinition bd = holder.getBeanDefinition();
			try {
				if (bd instanceof AnnotatedBeanDefinition) {
				    //解析处理AnnotatedBeanDefinition
					parse(((AnnotatedBeanDefinition) bd).getMetadata(), holder.getBeanName());
				}
				else if (bd instanceof AbstractBeanDefinition && ((AbstractBeanDefinition) bd).hasBeanClass()) {
				    //解析处理AbstractBeanDefinition
					parse(((AbstractBeanDefinition) bd).getBeanClass(), holder.getBeanName());
				}
				else {
					parse(bd.getBeanClassName(), holder.getBeanName());
				}
			}
			catch (BeanDefinitionStoreException ex) {
				throw ex;
			}
			catch (Throwable ex) {
				throw new BeanDefinitionStoreException(
						"Failed to parse configuration class [" + bd.getBeanClassName() + "]", ex);
			}
		}
		//处理实现了DeferredImportSelector接口的类
		this.deferredImportSelectorHandler.process();
	}
```

通过上面的代码发现主要是通过调用 parse方法进行接下来的处理

```java
	protected final void parse(@Nullable String className, String beanName) throws IOException {
		Assert.notNull(className, "No bean class name for configuration class bean definition");
		MetadataReader reader = this.metadataReaderFactory.getMetadataReader(className);
		processConfigurationClass(new ConfigurationClass(reader, beanName));
	}

	protected final void parse(Class<?> clazz, String beanName) throws IOException {
		processConfigurationClass(new ConfigurationClass(clazz, beanName));
	}

	protected final void parse(AnnotationMetadata metadata, String beanName) throws IOException {
		processConfigurationClass(new ConfigurationClass(metadata, beanName));
	}
```

parse方法有三个重载的方法，三个重写方法都是调用 **processConfigurationClass** 方法，接下来开始分析一下这个方法：

```java
		protected void processConfigurationClass(ConfigurationClass configClass) throws IOException {
		if (this.conditionEvaluator.shouldSkip(configClass.getMetadata(), ConfigurationPhase.PARSE_CONFIGURATION)) {
			return;
		}

		//判断配置类是否存在
		ConfigurationClass existingClass = this.configurationClasses.get(configClass);
		if (existingClass != null) {

			//判断configClass是Import注解
			if (configClass.isImported()) {
				if (existingClass.isImported()) {
					//已经存在的ConfigurationClass合并新ConfigurationClass的导入者
					existingClass.mergeImportedBy(configClass);
				}
				// 注册过无需再次注册
				return;
			}
			else {
				// 找到显式bean定义，可能替换导入
				// 删除旧的configClass
				this.configurationClasses.remove(configClass);
				this.knownSuperclasses.values().removeIf(configClass::equals);
			}
		}

		// 递归地处理配置类及其父类
		SourceClass sourceClass = asSourceClass(configClass);
		do {
			sourceClass = doProcessConfigurationClass(configClass, sourceClass);
		}
		while (sourceClass != null);
		//保存已经处理过的configClass
		this.configurationClasses.put(configClass, configClass);
	}
```

看一下 **`doProcessConfigurationClass`** 的方法

```java
	protected final SourceClass doProcessConfigurationClass(ConfigurationClass configClass, SourceClass sourceClass)
			throws IOException {

		if (configClass.getMetadata().isAnnotated(Component.class.getName())) {
			// 递归处理成员内部内，处理带@Component注解的类
			processMemberClasses(configClass, sourceClass);
		}

		// 处理任何@PropertySource的类
		for (AnnotationAttributes propertySource : AnnotationConfigUtils.attributesForRepeatable(
				sourceClass.getMetadata(), PropertySources.class,
				org.springframework.context.annotation.PropertySource.class)) {
			if (this.environment instanceof ConfigurableEnvironment) {
				//处理属性
				processPropertySource(propertySource);
			}
			else {
				logger.info("Ignoring @PropertySource annotation on [" + sourceClass.getMetadata().getClassName() +
						"]. Reason: Environment must implement ConfigurableEnvironment");
			}
		}

		//处理任何 @ComponentScan的类
		Set<AnnotationAttributes> componentScans = AnnotationConfigUtils.attributesForRepeatable(
				sourceClass.getMetadata(), ComponentScans.class, ComponentScan.class);
		if (!componentScans.isEmpty() &&
				!this.conditionEvaluator.shouldSkip(sourceClass.getMetadata(), ConfigurationPhase.REGISTER_BEAN)) {
			for (AnnotationAttributes componentScan : componentScans) {
				// The config class is annotated with @ComponentScan -> perform the scan immediately
				Set<BeanDefinitionHolder> scannedBeanDefinitions =
						this.componentScanParser.parse(componentScan, sourceClass.getMetadata().getClassName());
				// Check the set of scanned definitions for any further config classes and parse recursively if needed
				for (BeanDefinitionHolder holder : scannedBeanDefinitions) {
					BeanDefinition bdCand = holder.getBeanDefinition().getOriginatingBeanDefinition();
					if (bdCand == null) {
						bdCand = holder.getBeanDefinition();
					}
					if (ConfigurationClassUtils.checkConfigurationClassCandidate(bdCand, this.metadataReaderFactory)) {
						parse(bdCand.getBeanClassName(), holder.getBeanName());
					}
				}
			}
		}

		// 处理任何@Import注解的类
		processImports(configClass, sourceClass, getImports(sourceClass), true);

		//处理任何@ImportResource注解的类
		AnnotationAttributes importResource =
				AnnotationConfigUtils.attributesFor(sourceClass.getMetadata(), ImportResource.class);
		if (importResource != null) {
			String[] resources = importResource.getStringArray("locations");
			Class<? extends BeanDefinitionReader> readerClass = importResource.getClass("reader");
			for (String resource : resources) {
				String resolvedResource = this.environment.resolveRequiredPlaceholders(resource);
				configClass.addImportedResource(resolvedResource, readerClass);
			}
		}


		Set<MethodMetadata> beanMethods = retrieveBeanMethodMetadata(sourceClass);
		for (MethodMetadata methodMetadata : beanMethods) {
			configClass.addBeanMethod(new BeanMethod(methodMetadata, configClass));
		}

		// 处理实现的所有接口中@Bean注解的方法，去上面的处理方法一样，但不是抽象方法，
		// 因为java8中接口有默认方法和其他具体方法，这里只会处理这些方法的@Bean注解
		processInterfaces(configClass, sourceClass);

		// 处理父类
		if (sourceClass.getMetadata().hasSuperClass()) {

			String superclass = sourceClass.getMetadata().getSuperClassName();
			// java包的父类和已经处理过的父类不处理
			if (superclass != null && !superclass.startsWith("java") &&
					!this.knownSuperclasses.containsKey(superclass)) {
				// 标记父类已经处理过
				this.knownSuperclasses.put(superclass, configClass);
				// 返回父类的SourceClass再次进行递归处理
				return sourceClass.getSuperClass();
			}
		}
		// 没有父类处理完成
		return null;
	}
```

##### 2.1.1  @Component注解的处理

```java
//判断@configuration注解的类上面是否包含有@Component注解 
if (configClass.getMetadata().isAnnotated(Component.class.getName())) {
	processMemberClasses(configClass, sourceClass);
}
```

##### 2.1.2 @PropertySources、@PropertySource 注解的解析

```java
		for (AnnotationAttributes propertySource : AnnotationConfigUtils.attributesForRepeatable(
				sourceClass.getMetadata(), PropertySources.class,
				org.springframework.context.annotation.PropertySource.class)) {
			if (this.environment instanceof ConfigurableEnvironment) {
				processPropertySource(propertySource);
			}
			else {
				//省略打印日志
			}
		}
```

##### 2.1.3 @ComponentScans.class, @ComponentScan.class注解的解析

```java
		Set<AnnotationAttributes> componentScans = AnnotationConfigUtils.attributesForRepeatable(
				sourceClass.getMetadata(), ComponentScans.class, ComponentScan.class);
		if (!componentScans.isEmpty() &&
				!this.conditionEvaluator.shouldSkip(sourceClass.getMetadata(), ConfigurationPhase.REGISTER_BEAN)) {
			for (AnnotationAttributes componentScan : componentScans) {
				//添加有@ComponentScan注解的类 -> 立刻扫描
				Set<BeanDefinitionHolder> scannedBeanDefinitions =
						this.componentScanParser.parse(componentScan, sourceClass.getMetadata().getClassName());
				//检查已扫描的定义集以获得更多的配置类，并在需要时进行递归解析
				for (BeanDefinitionHolder holder : scannedBeanDefinitions) {
					BeanDefinition bdCand = holder.getBeanDefinition().getOriginatingBeanDefinition();
					if (bdCand == null) {
						bdCand = holder.getBeanDefinition();
					}
                    //判断是否有配置@Configuration，然后递归调用解析
					if (ConfigurationClassUtils.checkConfigurationClassCandidate(bdCand, this.metadataReaderFactory)) {
						parse(bdCand.getBeanClassName(), holder.getBeanName());
					}
				}
			}
		}
```

##### 2.1.4 @Import注解的解析

```java
// Process any @Import annotations
processImports(configClass, sourceClass, getImports(sourceClass), true);

private void processImports(ConfigurationClass configClass, SourceClass currentSourceClass,
			Collection<SourceClass> importCandidates, boolean checkForCircularImports) {

		if (importCandidates.isEmpty()) {
			return;
		}

		if (checkForCircularImports && isChainedImportOnStack(configClass)) {
			this.problemReporter.error(new CircularImportProblem(configClass, this.importStack));
		}
		else {
			this.importStack.push(configClass);
			try {
				for (SourceClass candidate : importCandidates) {
					if (candidate.isAssignable(ImportSelector.class)) {
						// 处理ImportSelector实现类
						Class<?> candidateClass = candidate.loadClass();
						ImportSelector selector = ParserStrategyUtils.instantiateClass(candidateClass, ImportSelector.class,
								this.environment, this.resourceLoader, this.registry);
						if (selector instanceof DeferredImportSelector) {
                            //判断是否为DeferredImportSelector的实现--延迟处理
							this.deferredImportSelectorHandler.handle(configClass, (DeferredImportSelector) selector);
						}
						else {
							String[] importClassNames = selector.selectImports(currentSourceClass.getMetadata());
							Collection<SourceClass> importSourceClasses = asSourceClasses(importClassNames);
							processImports(configClass, currentSourceClass, importSourceClasses, false);
						}
					}
					else if (candidate.isAssignable(ImportBeanDefinitionRegistrar.class)) {
						//ImportBeanDefinitionRegistrar接口实现的的处理
						Class<?> candidateClass = candidate.loadClass();
						ImportBeanDefinitionRegistrar registrar =
								ParserStrategyUtils.instantiateClass(candidateClass, ImportBeanDefinitionRegistrar.class,
										this.environment, this.resourceLoader, this.registry);
						configClass.addImportBeanDefinitionRegistrar(registrar, currentSourceClass.getMetadata());
					}
					else {
						// 当做Config类来处理
						this.importStack.registerImport(
								currentSourceClass.getMetadata(), candidate.getMetadata().getClassName());
						processConfigurationClass(candidate.asConfigClass(configClass));
					}
				}
			}
			catch (BeanDefinitionStoreException ex) {
				throw ex;
			}
			catch (Throwable ex) {
				throw new BeanDefinitionStoreException(
						"Failed to process import candidates for configuration class [" +
						configClass.getMetadata().getClassName() + "]", ex);
			}
			finally {
				this.importStack.pop();
			}
		}
	}
```



##### 2.1.5 @ImportResource注解的解析

```java
		AnnotationAttributes importResource =
				AnnotationConfigUtils.attributesFor(sourceClass.getMetadata(), ImportResource.class);
		if (importResource != null) {
			String[] resources = importResource.getStringArray("locations");
			Class<? extends BeanDefinitionReader> readerClass = importResource.getClass("reader");
			for (String resource : resources) {
				String resolvedResource = this.environment.resolveRequiredPlaceholders(resource);
				configClass.addImportedResource(resolvedResource, readerClass);
			}
		}
```

##### 2.1.6 @Configuration配置类中@Bean注解的解析

```java
Set<MethodMetadata> beanMethods = retrieveBeanMethodMetadata(sourceClass);
for (MethodMetadata methodMetadata : beanMethods) {
	configClass.addBeanMethod(new BeanMethod(methodMetadata, configClass));
}
```

