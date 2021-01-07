---
title: spring注解源码解析之-配置类注解
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
abbrlink: 93ffe81c
date: 2018-03-09 08:21:21
---
### 1. Spring配置类注解
在Spring中的配置类主要包含五个注解：  

- **Component**
- **ComponentScan**
- **Import**
- **ImportResource**
- **Configuration**

### 2. Spring配置类注解源码解析
配置类注解主要是由 ***`ConfigurationClassPostProcessor`*** 来处理。下面看一下源码：

```java
public class ConfigurationClassPostProcessor implements BeanDefinitionRegistryPostProcessor,
		PriorityOrdered, ResourceLoaderAware, BeanClassLoaderAware, EnvironmentAware {
    //省略各种代码		    
}
```
实现了 **BeanDefinitionRegistryPostProcessor** 接口。该接口是 **BeanFactoryPostProcessor** 继承而来。这个接口主要用来处理类上面的注解。

```java
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
        //处理方法
		processConfigBeanDefinitions(registry);
	}

```
通过源码可以看出来主要是通过 ***ConfigurationClassPostProcessor*#processConfigBeanDefinitions** 方法处理。下面来看一下方法 ***processConfigBeanDefinitions*** 源码：

```java
public void processConfigBeanDefinitions(BeanDefinitionRegistry registry) {
    List<BeanDefinitionHolder> configCandidates = new ArrayList<>();
    //获取Bean的定义名称
	String[] candidateNames = registry.getBeanDefinitionNames();
	
	for (String beanName : candidateNames) {
		BeanDefinition beanDef = registry.getBeanDefinition(beanName);
		if (beanDef.getAttribute(ConfigurationClassUtils.CONFIGURATION_CLASS_ATTRIBUTE) != null) {
            //省略打印日志
		}
		//判断是否为ConfigurationClass
		else if (ConfigurationClassUtils.checkConfigurationClassCandidate(beanDef, this.metadataReaderFactory)) {
			configCandidates.add(new BeanDefinitionHolder(beanDef, beanName));
		}
	}
	//省略后续处理代码
}
```
通过代码发现主要是通过 ***ConfigurationClassUtils.checkConfigurationClassCandidate*** 方法来校验是否为 **ConfigurationClass** 。那么来研究一下方法 **checkConfigurationClassCandidate** ：

```java
public static boolean checkConfigurationClassCandidate(
			BeanDefinition beanDef, MetadataReaderFactory metadataReaderFactory) {
    //省略部分代码
    
    //获取是否Configuration修饰的类
    Map<String, Object> config = metadata.getAnnotationAttributes(Configuration.class.getName());
		if (config != null && !Boolean.FALSE.equals(config.get("proxyBeanMethods"))) {
			beanDef.setAttribute(CONFIGURATION_CLASS_ATTRIBUTE, CONFIGURATION_CLASS_FULL);
		}
		//判断是否为Component、ComponentScan、Import、ImportResource中的一个
		else if (config != null || isConfigurationCandidate(metadata)) {
			beanDef.setAttribute(CONFIGURATION_CLASS_ATTRIBUTE, CONFIGURATION_CLASS_LITE);
		}
		else {
			return false;
		}
	//省略部分代码
	
	return true;
}

//isConfigurationCandidate源码
public static boolean isConfigurationCandidate(AnnotationMetadata metadata) {
		// 判断是否为接口
		if (metadata.isInterface()) {
			return false;
		}

		// 是否为Component、ComponentScan、Import、ImportResource配置类中的一个
		for (String indicator : candidateIndicators) {
			if (metadata.isAnnotated(indicator)) {
				return true;
			}
		}

		// 查询是否有被@Bean注解修复的方法
		try {
			return metadata.hasAnnotatedMethods(Bean.class.getName());
		}
		catch (Throwable ex) {
            //省略日志打印
			return false;
		}
	}
```
通过源码分析可以发现配置Class分为两类：  

- **full configurationClass**

  Spring中称为full configurationClass,这个是由注解@Configuration注解修饰的。
- **lite configurationClass**
  
  Spring中称为lite configurationClass，也就是轻量级的配置类，由注解@Component、@ComponentScan、@Import、@ImportResource

在来看一下 **ConfigurationClassPostProcessor*#*processConfigBeanDefinitions*** 中是如何来处理configurationClass：

```java
public void processConfigBeanDefinitions(BeanDefinitionRegistry registry) {
    
    //省略代码
    
    //configCandidates的处理代码如下
    
    //ConfigurationClassParser处理类来处理configCandidates
    ConfigurationClassParser parser = new ConfigurationClassParser(
				this.metadataReaderFactory, this.problemReporter, this.environment,
				this.resourceLoader, this.componentScanBeanNameGenerator, registry);

		Set<BeanDefinitionHolder> candidates = new LinkedHashSet<>(configCandidates);
		Set<ConfigurationClass> alreadyParsed = new HashSet<>(configCandidates.size());
		do {
		    //解析candidates
			parser.parse(candidates);
			parser.validate();
            
            //获取解析后的配置类
			Set<ConfigurationClass> configClasses = new LinkedHashSet<>(parser.getConfigurationClasses());
			configClasses.removeAll(alreadyParsed);

			// 创建解析后的配置类Bean
			if (this.reader == null) {
				this.reader = new ConfigurationClassBeanDefinitionReader(
						registry, this.sourceExtractor, this.resourceLoader, this.environment,
						this.importBeanNameGenerator, parser.getImportRegistry());
			}
			this.reader.loadBeanDefinitions(configClasses);
			alreadyParsed.addAll(configClasses);

			candidates.clear();
			//循环处理
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
    
}
```
通过代码分析上面的代码主要处理ConfigurationClass是通过 ***ConfigurationClassParser*** 解析器来处理。下面看一下解析器的 ***ConfigurationClassParser#parse*** 方法：

```java
	public void parse(Set<BeanDefinitionHolder> configCandidates) {
		for (BeanDefinitionHolder holder : configCandidates) {
			BeanDefinition bd = holder.getBeanDefinition();
			try {
				if (bd instanceof AnnotatedBeanDefinition) {
					parse(((AnnotatedBeanDefinition) bd).getMetadata(), holder.getBeanName());
				}
				else if (bd instanceof AbstractBeanDefinition && ((AbstractBeanDefinition) bd).hasBeanClass()) {
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
        //处理DeferredImportSelector接口
		this.deferredImportSelectorHandler.process();
	}
```
通过上面代码可以看出来主要是分为两部分：

- **ConfigurationClassParser#parse ConfigurationClass解析**

   ConfigurationClassParser#parse是一个空壳方法，当中调用了一个 ConfigurationClassParser#processConfigurationClass方法
- **DeferredImportSelector接口的处理**

下面来分析一下 **ConfigurationClassParser#processConfigurationClass** 方法：

```java
protected void processConfigurationClass(ConfigurationClass configClass) throws IOException {
        //条件加载的判定之前有分析过@Conditional注解
		if (this.conditionEvaluator.shouldSkip(configClass.getMetadata(), ConfigurationPhase.PARSE_CONFIGURATION)) {
			return;
		}

		ConfigurationClass existingClass = this.configurationClasses.get(configClass);
        //省略部分代码
		SourceClass sourceClass = asSourceClass(configClass);
		do {
		    //处理ConfigurationClass
			sourceClass = doProcessConfigurationClass(configClass, sourceClass);
		}
		while (sourceClass != null);

		this.configurationClasses.put(configClass, configClass);
	}
```
代码分析可以看出来主要是通过 ***doProcessConfigurationClass*** 方法来处理ConfigurationClass类：

```java
protected final SourceClass doProcessConfigurationClass(ConfigurationClass configClass, SourceClass sourceClass)
			throws IOException {

		//@Component注解处理
		if (configClass.getMetadata().isAnnotated(Component.class.getName())) {
			processMemberClasses(configClass, sourceClass);
		}

		// @PropertySource注解处理
		for (AnnotationAttributes propertySource : AnnotationConfigUtils.attributesForRepeatable(
				sourceClass.getMetadata(), PropertySources.class,
				org.springframework.context.annotation.PropertySource.class)) {
			if (this.environment instanceof ConfigurableEnvironment) {
				processPropertySource(propertySource);
			}
			else {
				//省略日志打印
			}
		}
		// @ComponentScan 注解处理
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

		// @Import 注解处理
		processImports(configClass, sourceClass, getImports(sourceClass), true);
		// @ImportResource 注解处理
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

		// @Bean 注解方法处理
		Set<MethodMetadata> beanMethods = retrieveBeanMethodMetadata(sourceClass);
		for (MethodMetadata methodMetadata : beanMethods) {
			configClass.addBeanMethod(new BeanMethod(methodMetadata, configClass));
		}

		// 处理默认的接口方法
		processInterfaces(configClass, sourceClass);

		// 处理父类
		if (sourceClass.getMetadata().hasSuperClass()) {
			String superclass = sourceClass.getMetadata().getSuperClassName();
			if (superclass != null && !superclass.startsWith("java") &&
					!this.knownSuperclasses.containsKey(superclass)) {
				this.knownSuperclasses.put(superclass, configClass);
				// Superclass found, return its annotation metadata and recurse
				return sourceClass.getSuperClass();
			}
		}
		return null;
	}		
```
通上面的代码可以发现主要处理了这样几个注解：  

- **@Component注解处理**
- **@PropertySource注解处理**
- **@ComponentScan 注解处理**
- **@Import 注解处理**
- **@ImportResource 注解处理**
- **@Bean 注解方法处理**
- **处理默认的接口方法**
- **处理父类**

分析到这里就可以看出来， ***ConfigurationClassPostProcessor*** 类主要是处理一下的几个注解： **Component、PropertySources、PropertySource、ComponentScans、ComponentScan、Import、ImportResource、Bean** 。
### 3. ConfigurationClassPostProcessor如何注入到Spring Application中
通过 **AnnotationConfigUtils** 类中的静态方法 **registerAnnotationConfigProcessors** 注入：

```java
public static final String CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME =
			"org.springframework.context.annotation.internalConfigurationAnnotationProcessor";

//
if (!registry.containsBeanDefinition(CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition(ConfigurationClassPostProcessor.class);
			def.setSource(source);
			beanDefs.add(registerPostProcessor(registry, def, CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME));
		}
```