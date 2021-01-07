---
title: AnnotationConfigApplicationContext源码解析
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之核心类核心代码
  - Spring源码解析之ApplicationContext
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之Application
abbrlink: 92b6b71b
date: 2019-08-20 19:18:00
---
### 1. AnnotationConfigApplicationContext  
对于Application的实现是不同的，现在来分析一下常用的注解的实现。

```java
public class AnnotationConfigApplicationContext extends GenericApplicationContext implements AnnotationConfigRegistry {

    //注解读取器
	private final AnnotatedBeanDefinitionReader reader;

    //class path 扫码器
	private final ClassPathBeanDefinitionScanner scanner;

	//默认的构造方法
	public AnnotationConfigApplicationContext() {
		this.reader = new AnnotatedBeanDefinitionReader(this);
		this.scanner = new ClassPathBeanDefinitionScanner(this);
	}


	public AnnotationConfigApplicationContext(DefaultListableBeanFactory beanFactory) {
		super(beanFactory);
		this.reader = new AnnotatedBeanDefinitionReader(this);
		this.scanner = new ClassPathBeanDefinitionScanner(this);
	}


	public AnnotationConfigApplicationContext(Class<?>... annotatedClasses) {
		this();
		register(annotatedClasses);
		refresh();
	}

	//设置扫描包
	public AnnotationConfigApplicationContext(String... basePackages) {
		this();
		scan(basePackages);
		refresh();
	}


	@Override
	public void setEnvironment(ConfigurableEnvironment environment) {
		super.setEnvironment(environment);
		this.reader.setEnvironment(environment);
		this.scanner.setEnvironment(environment);
	}


	public void setBeanNameGenerator(BeanNameGenerator beanNameGenerator) {
		this.reader.setBeanNameGenerator(beanNameGenerator);
		this.scanner.setBeanNameGenerator(beanNameGenerator);
		getBeanFactory().registerSingleton(
				AnnotationConfigUtils.CONFIGURATION_BEAN_NAME_GENERATOR, beanNameGenerator);
	}


	public void setScopeMetadataResolver(ScopeMetadataResolver scopeMetadataResolver) {
		this.reader.setScopeMetadataResolver(scopeMetadataResolver);
		this.scanner.setScopeMetadataResolver(scopeMetadataResolver);
	}


	public void register(Class<?>... annotatedClasses) {
		Assert.notEmpty(annotatedClasses, "At least one annotated class must be specified");
		this.reader.register(annotatedClasses);
	}


	public void scan(String... basePackages) {
		Assert.notEmpty(basePackages, "At least one base package must be specified");
		this.scanner.scan(basePackages);
	}
	
	@Override
	public <T> void registerBean(@Nullable String beanName, Class<T> beanClass,
			@Nullable Supplier<T> supplier, BeanDefinitionCustomizer... customizers) {

		this.reader.registerBean(beanClass, beanName, supplier, customizers);
	}

}
```
> 从Spring的源码可以看出来，主要通过 this.scanner.scan(basePackages); 扫描对应的基础包下面的类来实现注入

### 2. ClassPathBeanDefinitionScanner源码的分析
通过这个类来扫描指定的class path下面的类的实例加载到Spring的容器中。并将符合过滤条件的类注册到IOC 容器内
> Mybatis 的Mapper注册器(ClassPathMapperScanner) 是同过继承ClassPathBeanDefinitionScanner,并且自定义了过滤器规则来实现的。具体的 调用过程并不会在这里说明，只是想在这里描述ClassPathBeanDefinitionScanner是如何 扫描 和 注册BeanDefinition的。

过滤器分为两种：
1. 包含过滤器--includeFilters
2. 排除过滤器--excludeFilters


| 过滤器类型   | 示例表达式                               | 备注                         | Spring中的实现类       |
| ------------ | ---------------------------------------- | ---------------------------- | ---------------------- |
| annotation   | org.springframework.stereotype.Component | 在目标组件的类型级别出现注解 | AnnotationTypeFilter   |
| assignable   | 指定的类或者接口                         | 在目标组件指定类火灾接口     | AssignableTypeFilter   |
| AspectJ type | aspectj 表达式                           | 满足aspectj 表达式的         | AspectJTypeFilter      |
| 正则表达式   | org\.example\.Default.*                  | 类名满足正则表达式的         | RegexPatternTypeFilter |
| custom       | com.mxsm.MyTypeFilter                    | 继承Spring的TypeFilter接口   | TypeFilter             |

从上面可以看出来Spring实现的有四个：AnnotationTypeFilter、AssignableTypeFilter、AspectJTypeFilter、RegexPatternTypeFilter。可以根据需要自行拓展

看一下默认的ClassPathBeanDefinitionScanner使用的默认includeFilters过滤器，(ClassPathScanningCandidateComponentProvider)

```java
	protected void registerDefaultFilters() {
	    //注解Component是其中一个
		this.includeFilters.add(new AnnotationTypeFilter(Component.class));
		ClassLoader cl = ClassPathScanningCandidateComponentProvider.class.getClassLoader();
		//以及下面对JSR的规范的支持，如果没有对应的注解直接略过也不报错
		try {
			this.includeFilters.add(new AnnotationTypeFilter(
					((Class<? extends Annotation>) ClassUtils.forName("javax.annotation.ManagedBean", cl)), false));
			logger.trace("JSR-250 'javax.annotation.ManagedBean' found and supported for component scanning");
		}
		catch (ClassNotFoundException ex) {
			// JSR-250 1.1 API (as included in Java EE 6) not available - simply skip.
		}
		try {
			this.includeFilters.add(new AnnotationTypeFilter(
					((Class<? extends Annotation>) ClassUtils.forName("javax.inject.Named", cl)), false));
			logger.trace("JSR-330 'javax.inject.Named' annotation found and supported for component scanning");
		}
		catch (ClassNotFoundException ex) {
			// JSR-330 API not available - simply skip.
		}
	}
```
扫描主要使用scan方法
```java
	public int scan(String... basePackages) {
		int beanCountAtScanStart = this.registry.getBeanDefinitionCount();
        
        //扫码配置基本 packages下面的类
		doScan(basePackages);

		// 默认的情况下注入注解配置处理器--ConfigurationClassPostProcessor,
		//AutowiredAnnotationBeanPostProcessor等Spring.自定义的处理器
		//下面会分析一下这个工具类的这个方法
		if (this.includeAnnotationConfig) {
			AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry);
		}

		return (this.registry.getBeanDefinitionCount() - beanCountAtScanStart);
	}
```
通过上面可以看出来主要是两个方法：
- **doScan**

  这个主要用于Spring扫描输入的基本包下面的以及子包下面的类
  
- **AnnotationConfigUtils.registerAnnotationConfigProcessors**

  注入一些处理注解的配置的Processors，比如处理的注解：Autowired， Value等注解

#### 2.1 ClassPathBeanDefinitionScanner#doScan 方法的源码分析

```java
protected Set<BeanDefinitionHolder> doScan(String... basePackages) {
		Assert.notEmpty(basePackages, "At least one base package must be specified");
		Set<BeanDefinitionHolder> beanDefinitions = new LinkedHashSet<>();
		//加载不同的路径下面的包
		for (String basePackage : basePackages) {
		    //获取包下面的候选组件--过滤出来符合条件的，在AnnotationConfigApplicationContext
		    //创建的使用的默认的过滤器(包含过滤器和排除过滤器)
			Set<BeanDefinition> candidates = findCandidateComponents(basePackage);
			for (BeanDefinition candidate : candidates) {
				//设置SCOP
				ScopeMetadata scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(candidate);
				candidate.setScope(scopeMetadata.getScopeName());
				//生成bean name
				String beanName = this.beanNameGenerator.generateBeanName(candidate, this.registry);
				//处理普通的bean
				if (candidate instanceof AbstractBeanDefinition) {
					postProcessBeanDefinition((AbstractBeanDefinition) candidate, beanName);
				}
				// 处理注解类的Bean
				if (candidate instanceof AnnotatedBeanDefinition) {
					AnnotationConfigUtils.processCommonDefinitionAnnotations((AnnotatedBeanDefinition) candidate);
				}
				//判断beanName是否存在于Spring容器中
				if (checkCandidate(beanName, candidate)) {
					BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(candidate, beanName);
					//根据proxyMode是否创建代理
					definitionHolder =
							AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry);
					beanDefinitions.add(definitionHolder);
					registerBeanDefinition(definitionHolder, this.registry);
				}
			}
		}
		return beanDefinitions;
	}
```
这里来分析一下ClassPathScanningCandidateComponentProvider#findCandidateComponents方法，该方法的作用就是把basePackage下面的Java类转换为Spring的BeanDefinition

```java
	public Set<BeanDefinition> findCandidateComponents(String basePackage) {
		if (this.componentsIndex != null && indexSupportsIncludeFilters()) {
			return addCandidateComponentsFromIndex(this.componentsIndex, basePackage);
		}
		else {
			return scanCandidateComponents(basePackage);
		}
	}
//一下代码去除了Spring源码中的一些非必要的代码
private Set<BeanDefinition> scanCandidateComponents(String basePackage) {
		Set<BeanDefinition> candidates = new LinkedHashSet<>();
		try {
		// 例如：classpath*:com.mxsm/**/*.class
			String packageSearchPath = ResourcePatternResolver.CLASSPATH_ALL_URL_PREFIX +
					resolveBasePackage(basePackage) + '/' + this.resourcePattern;
			//将指定package以及子包下面的类转化为Resource[]
			Resource[] resources = getResourcePatternResolver().getResources(packageSearchPath);
			for (Resource resource : resources) {

				if (resource.isReadable()) {
					try {
					//将Class的信息存储到MetadataReader中
						MetadataReader中 metadataReader = getMetadataReaderFactory().getMetadataReader(resource);
						//调用过滤器来处理metadataReader--默认的是包含component
						//注解的类
						if (isCandidateComponent(metadataReader)) {
						//转化为扫描定义
							ScannedGenericBeanDefinition sbd = new ScannedGenericBeanDefinition(metadataReader);
							sbd.setResource(resource);
							sbd.setSource(resource);
							//再次判断 如果是实体类 返回true,如果是抽象类，但是抽象方法 被 @Lookup 注解注释返回true
							if (isCandidateComponent(sbd)) {
								candidates.add(sbd);
							}
							else {
                                //日志打印
							}
						}
						else {
						    //日志打印
						}
					}
					catch (Throwable ex) {
						throw new BeanDefinitionStoreException(
								"Failed to read candidate component class: " + resource, ex);
					}
				}
				else {
					//日志打印
				}
			}
		}
		catch (IOException ex) {
			throw new BeanDefinitionStoreException("I/O failure during classpath scanning", ex);
		}
		return candidates;
	}


```
#### 2.2 AnnotationConfigUtils.registerAnnotationConfigProcessors源码分析
这个方法主要用于注册一些注解配置处理器例如注解：**@Configuration** 等等。

```java
public static Set<BeanDefinitionHolder> registerAnnotationConfigProcessors(
			BeanDefinitionRegistry registry, @Nullable Object source) {

		DefaultListableBeanFactory beanFactory = unwrapDefaultListableBeanFactory(registry);
		if (beanFactory != null) {
			if (!(beanFactory.getDependencyComparator() instanceof AnnotationAwareOrderComparator)) {
				beanFactory.setDependencyComparator(AnnotationAwareOrderComparator.INSTANCE);
			}
			if (!(beanFactory.getAutowireCandidateResolver() instanceof ContextAnnotationAutowireCandidateResolver)) {
				beanFactory.setAutowireCandidateResolver(new ContextAnnotationAutowireCandidateResolver());
			}
		}

		Set<BeanDefinitionHolder> beanDefs = new LinkedHashSet<>(8);

        //往Spring容器中注入ConfigurationClassPostProcessor -- 处理注解Configuration配置等等
		if (!registry.containsBeanDefinition(CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition(ConfigurationClassPostProcessor.class);
			def.setSource(source);
			beanDefs.add(registerPostProcessor(registry, def, CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME));
		}
        
        //处理Autowired和Value注解以及javax.inject.Inject(JSR-330)注解的处理器
		if (!registry.containsBeanDefinition(AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition(AutowiredAnnotationBeanPostProcessor.class);
			def.setSource(source);
			beanDefs.add(registerPostProcessor(registry, def, AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME));
		}

		// 对 JSR-250 通用规范注解的处理.
		if (jsr250Present && !registry.containsBeanDefinition(COMMON_ANNOTATION_PROCESSOR_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition(CommonAnnotationBeanPostProcessor.class);
			def.setSource(source);
			beanDefs.add(registerPostProcessor(registry, def, COMMON_ANNOTATION_PROCESSOR_BEAN_NAME));
		}

		// 对JPA注解的注解处理
		if (jpaPresent && !registry.containsBeanDefinition(PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition();
			try {
				def.setBeanClass(ClassUtils.forName(PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME,
						AnnotationConfigUtils.class.getClassLoader()));
			}
			catch (ClassNotFoundException ex) {
				throw new IllegalStateException(
						"Cannot load optional framework class: " + PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME, ex);
			}
			def.setSource(source);
			beanDefs.add(registerPostProcessor(registry, def, PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME));
		}
        
        //事件监听方法处理器
		if (!registry.containsBeanDefinition(EVENT_LISTENER_PROCESSOR_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition(EventListenerMethodProcessor.class);
			def.setSource(source);
			beanDefs.add(registerPostProcessor(registry, def, EVENT_LISTENER_PROCESSOR_BEAN_NAME));
		}

        //默认事件监听方法的处理
		if (!registry.containsBeanDefinition(EVENT_LISTENER_FACTORY_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition(DefaultEventListenerFactory.class);
			def.setSource(source);
			beanDefs.add(registerPostProcessor(registry, def, EVENT_LISTENER_FACTORY_BEAN_NAME));
		}

		return beanDefs;
	}
```
> 大部分Processor分为两类：  
> 1 实现了 **BeanPostProcessor** 接口，主要用来处理Java类内部的注解。例如： @Value  
> 2 实现了 **BeanFactoryPostProcessor** 接口，主要用来处理Java类上面的注解。例如：@Configuration

通过这样的就把对应的注解都处理了。达到了和XML配置一样的效果。对于其中的类的代码会有专门的笔记对其进行详细的分析。

### 3 总结加载过程
通过上面的源码对Spring的AnnotationConfigApplicationContext源码分析来总结一下对于注解的这个加载过程

1. **创建AnnotationConfigApplicationContext的对象，设置需要加载的basePackages**