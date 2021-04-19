---
title: Spring注解源码解析之-Component
linkTitle: Spring注解源码解析之-Component
date: 2021-04-19
weight: 201204192015
---

> 基于Spring 5.4.2版本分析

### 1. Component概要

Spring中有一个重要的注解那就是 **`@Component`** 。对于Spring中不同场景下使用的注解例如：**`@Repository`** 、**`@Service`** 、 **`@Controller`** 都是通过 **`@Component`** 注解衍生出来的。

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface Service {
	@AliasFor(annotation = Component.class)
	String value() default "";
}
```

在这里代码中还看到一个重要的注解来实现衍生： **`@AliasFor`** 。

### 2. Component入口

不论是现在Spring流行的注解方式还是以前的老式的XML配置方式都有一个入口。这里就只分析注解模式。

对于XML配置的方式可以从下面的代码中找到入口：

```java
public class ContextNamespaceHandler extends NamespaceHandlerSupport {

	@Override
	public void init() {
		registerBeanDefinitionParser("property-placeholder", new PropertyPlaceholderBeanDefinitionParser());
		registerBeanDefinitionParser("property-override", new PropertyOverrideBeanDefinitionParser());
		registerBeanDefinitionParser("annotation-config", new AnnotationConfigBeanDefinitionParser());
		registerBeanDefinitionParser("component-scan", new ComponentScanBeanDefinitionParser());
		registerBeanDefinitionParser("load-time-weaver", new LoadTimeWeaverBeanDefinitionParser());
		registerBeanDefinitionParser("spring-configured", new SpringConfiguredBeanDefinitionParser());
		registerBeanDefinitionParser("mbean-export", new MBeanExportBeanDefinitionParser());
		registerBeanDefinitionParser("mbean-server", new MBeanServerBeanDefinitionParser());
	}

}
```

对于注解方式

```java
	public AnnotationConfigApplicationContext(String... basePackages) {
		this();
		scan(basePackages);
		refresh();
	}
```

可以看一下 **`AnnotationConfigApplicationContext`** 类。

不管是注解方式还是XML方式最终都是通过 **`ClassPathBeanDefinitionScanner`** 类来将包含有 **`@Component`** 注解的类定义加载到Spring容器里面。

### 3. ClassPathBeanDefinitionScanner解析

**`ClassPathBeanDefinitionScanner`** 作用主要是扫描带有 **`@Component`** 注解的类并实现注册。下面来看一下 **`ClassPathBeanDefinitionScanner#doScan`** 方法。

```java
protected Set<BeanDefinitionHolder> doScan(String... basePackages) {
	Assert.notEmpty(basePackages, "At least one base package must be specified");
	Set<BeanDefinitionHolder> beanDefinitions = new LinkedHashSet<>();
	for (String basePackage : basePackages) {
        //找基础包下面的候选的Component
		Set<BeanDefinition> candidates = findCandidateComponents(basePackage);
        //下面是对加载的Component做进一步处理
		for (BeanDefinition candidate : candidates) {
			ScopeMetadata scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(candidate);
			candidate.setScope(scopeMetadata.getScopeName());
			String beanName = this.beanNameGenerator.generateBeanName(candidate, this.registry);
			if (candidate instanceof AbstractBeanDefinition) {
				postProcessBeanDefinition((AbstractBeanDefinition) candidate, beanName);
			}
			if (candidate instanceof AnnotatedBeanDefinition) {
				AnnotationConfigUtils.processCommonDefinitionAnnotations((AnnotatedBeanDefinition) candidate);
			}
			if (checkCandidate(beanName, candidate)) {
				BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(candidate, beanName);
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

通过上面的代码可以看出来主要是通过 **`ClassPathScanningCandidateComponentProvider#findCandidateComponents`** 来实现加载

### 4. findCandidateComponents解析

findCandidateComponents方法属于ClassPathScanningCandidateComponentProvider#findCandidateComponents。

```java
public Set<BeanDefinition> findCandidateComponents(String basePackage) {
	if (this.componentsIndex != null && indexSupportsIncludeFilters()) {
		return addCandidateComponentsFromIndex(this.componentsIndex, basePackage);
	}
	else {
		return scanCandidateComponents(basePackage);
	}
}

private Set<BeanDefinition> scanCandidateComponents(String basePackage) {
	Set<BeanDefinition> candidates = new LinkedHashSet<>();
	try {
		String packageSearchPath = ResourcePatternResolver.CLASSPATH_ALL_URL_PREFIX +
				resolveBasePackage(basePackage) + '/' + this.resourcePattern;
		Resource[] resources = getResourcePatternResolver().getResources(packageSearchPath);
		//省略了部分打印的代码
		for (Resource resource : resources) {

			if (resource.isReadable()) {
				try {
					MetadataReader metadataReader = getMetadataReaderFactory().getMetadataReader(resource);
					if (isCandidateComponent(metadataReader)) {
						ScannedGenericBeanDefinition sbd = new ScannedGenericBeanDefinition(metadataReader);
						sbd.setSource(resource);
						if (isCandidateComponent(sbd)) {

							candidates.add(sbd);
						}

					}

				}
				catch (Throwable ex) {
					throw new BeanDefinitionStoreException(
							"Failed to read candidate component class: " + resource, ex);
				}
			}
			else {

			}
		}
	}
	catch (IOException ex) {
		throw new BeanDefinitionStoreException("I/O failure during classpath scanning", ex);
	}
	return candidates;
}
```

该方法主要还是从基础包中获取组件。从代码分析一下大概的思路：

1. 根据基础包拼装扫描的路径正则表达式。
2. 获取路径下面的 **`.class`** 文件包装成 **`Resource`** 数组。
3. 将 **`.class`** 文件包装成 **`Resource`**  处理成 **`MetadataReader`**
4. 判断 **`MetadataReader`** 是否为候选组件
5. 判断 **`ScannedGenericBeanDefinition`** 是否为候选组件，**`ScannedGenericBeanDefinition`** 由 **`MetadataReader`** 构建。

判断是否为候选组件通过 **`ClassPathScanningCandidateComponentProvider#isCandidateComponent`** 方法。

### 5. isCandidateComponent方法解析

**`isCandidateComponent`** 方法在 **`ClassPathScanningCandidateComponentProvider#isCandidateComponent`** 类中。

```java
protected boolean isCandidateComponent(MetadataReader metadataReader) throws IOException {
	//省略部分代码
	for (TypeFilter tf : this.includeFilters) {
		if (tf.match(metadataReader, getMetadataReaderFactory())) {
			return isConditionMatch(metadataReader);
		}
	}
	return false;
}
```







