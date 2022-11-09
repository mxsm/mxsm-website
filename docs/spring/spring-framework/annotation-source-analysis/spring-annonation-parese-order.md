---
title: "Spring 注解解析顺序问题"
linkTitle: "Spring 注解解析顺序问题"
date: 2022-01-23
weight: 202201232201
---

在之前的Spring相关文章当中分析过 **BeanPostProcessor** 接口执行顺序问题，今天突然想到在Spring框架中常用的注解也不少。那么注解的解析到底是一个什么样的先后顺序呢？今天就通过源码来分析总结一下Spring常用注解的解析顺序，注解使用的时候应该注意什么？

### 1. Spring 常用注解

这里我将Spring常用注解按照添加的位置分成了两类：

- 添加在类上
- 添加在类的属性或者方法上面

![Spring常用注解-修饰类](https://raw.githubusercontent.com/mxsm/picture/main/spring/Spring%E5%B8%B8%E7%94%A8%E6%B3%A8%E8%A7%A3-%E4%BF%AE%E9%A5%B0%E7%B1%BB.jpeg)

- **Bean创建相关的注解**

  Bean创建，定义的核心注解就是 **`@Component`** 。而 **@Service、@Repository、@Controller** 三个只是 **@Component** 的不同语义下的延伸。本质上还是@Component。 **@Bean** 是配合 **@Configuration** 注解使用的另一类注解。功能和  **@Component** 相似但是对一下创建完全有开发者来创建。

- **配置相关注解**

  **@Configuration** 毋庸置疑是除了 **@Component** 注解意外最重要的注解之一。原因是很多其他的注解都是依赖 **@Configuration** 注解才能发挥作用。例如上图标号3、4、5、6那些注解都是依赖了它才能发挥作用。修饰的类被当做配置类。

- **属性相关注解**

  将注解将properties配置文件中的值存储到Spring的 Environment中

- **扫描相关注解**

  根据配置的基础扫描包的路径扫描@Component注解类

- **导入注解**

  这个注解算是一个辅助注解，导入一些被@Configuration修饰或者实现了 ImportSelector, ImportBeanDefinitionRegistrar接口的类，或者被 @Component修饰的类。

- **导入资源相关注解**

  用于导入Spring的配置文件。

### 2. 类修饰注解解析顺序分析

Spring注解应用上下文的入口为 **`AnnotationConfigApplicationContext`** ，用一段代码作为切入：

```java
ApplicationContext applicationContext = new AnnotationConfigApplicationContext("com.github.mxsm");
```

根据这段代码来逐一分析这些注解的解析，以及解析的顺序。

#### 2.1 @Component注解解析

**ClassPathBeanDefinitionScanner#scan** 方法负责扫描基础包下面的带有 **@Component** 流程图如下：

![注解Component解析流程图](https://raw.githubusercontent.com/mxsm/picture/main/spring/%E6%B3%A8%E8%A7%A3Component%E8%A7%A3%E6%9E%90%E6%B5%81%E7%A8%8B%E5%9B%BE.png)

这里也通过设置 **ClassPathBeanDefinitionScanner** 的 includeFilters(TypeFilter) 和excludeFilters(TypeFilter)来判断哪些是Bean哪些需要排除。

#### 2.2 @Configuration注解解析

**@Configuration** 注解的解析主要由 **ConfigurationClassPostProcessor** 负责解析。

```java
//ConfigurationClassPostProcessor#processConfigBeanDefinitions
public void processConfigBeanDefinitions(BeanDefinitionRegistry registry) {
    
    	//从Spring容器中获取包含了@Configuration注解的类
       for (String beanName : candidateNames) {
			BeanDefinition beanDef = registry.getBeanDefinition(beanName);
			if (beanDef.getAttribute(ConfigurationClassUtils.CONFIGURATION_CLASS_ATTRIBUTE) != null) {
				if (logger.isDebugEnabled()) {
					logger.debug("Bean definition has already been processed as a configuration class: " + beanDef);
				}
			}
			else if (ConfigurationClassUtils.checkConfigurationClassCandidate(beanDef, this.metadataReaderFactory)) {
				configCandidates.add(new BeanDefinitionHolder(beanDef, beanName));
			}
		}
    	
    	//没有配置@Configuration的BeanDefinition直接返回不往下解析了
       if (configCandidates.isEmpty()) {
			return;
		}
    
	//省略了部分代码
	ConfigurationClassParser parser = new ConfigurationClassParser(
				this.metadataReaderFactory, this.problemReporter, this.environment,
				this.resourceLoader, this.componentScanBeanNameGenerator, registry);
			parser.parse(candidates);
			parser.validate();
}
```

从Spring容器中获取包含了@Configuration注解的类放在列表中。**`ConfigurationClassParser`** 负责后续的解析。

> Tips：如果包含了@Order注解，会对类进行排序

解析完成@Configuration注解后，解析和@Configuration有依赖的注解。

> Tips: **ConfigurationClassUtils.checkConfigurationClassCandidate** 这段代码是检查 BeanDefinition是否包含了@Configuration注解，如果没有那么configCandidates就不会往里面放入BeanDefinition。同时configCandidates如果是空的那么也不需要进行后续解析。
>
> 也就是说：如果没有一个类配置了@Configuration注解，那么依赖@Configuration注解的@PropertySource、@ComponentScan、@Import、@ImportResource、@Bean注解都不会起作用也不被解析

#### 2.3 其他注解解析

依赖@Configuration的其他注解都是由 **ConfigurationClassParser#doProcessConfigurationClass** 进行解析,通过代码发现解析的顺序：

```java
//ConfigurationClassParser#doProcessConfigurationClass
@Nullable
protected final SourceClass doProcessConfigurationClass(
		ConfigurationClass configClass, SourceClass sourceClass, Predicate<String> filter)
		throws IOException {
	//省略部分代码

	// Process any @PropertySource annotations (1)
	for (AnnotationAttributes propertySource : AnnotationConfigUtils.attributesForRepeatable(
			sourceClass.getMetadata(), PropertySources.class,
			org.springframework.context.annotation.PropertySource.class)) {
		if (this.environment instanceof ConfigurableEnvironment) {
			processPropertySource(propertySource);
		}
	}

	// Process any @ComponentScan annotations (2)
	Set<AnnotationAttributes> componentScans = AnnotationConfigUtils.attributesForRepeatable(
			sourceClass.getMetadata(), ComponentScans.class, ComponentScan.class);
	if (!componentScans.isEmpty() &&
			!this.conditionEvaluator.shouldSkip(sourceClass.getMetadata(), ConfigurationPhase.REGISTER_BEAN)) {
		for (AnnotationAttributes componentScan : componentScans) {
			// The config class is annotated with @ComponentScan -> perform the scan immediately
			Set<BeanDefinitionHolder> scannedBeanDefinitions =
					this.componentScanParser.parse(componentScan, sourceClass.getMetadata().getClassName());
		}
	}

	// Process any @Import annotations (3)
	processImports(configClass, sourceClass, getImports(sourceClass), filter, true);

	// Process any @ImportResource annotations (4)
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

	// Process individual @Bean methods (5)
	Set<MethodMetadata> beanMethods = retrieveBeanMethodMetadata(sourceClass);
	for (MethodMetadata methodMetadata : beanMethods) {
		configClass.addBeanMethod(new BeanMethod(methodMetadata, configClass));
	}

	// Process default methods on interfaces
	processInterfaces(configClass, sourceClass);

	// No superclass -> processing is complete
	return null;
}
```

上面代码中的标号揭示了解析顺序：

（1）解析@PropertySource

（2）解析@ComponentScan

（3）解析@Import

（4）解析@ImportResource

（5）解析@Bean

![ConfigurationClassParser解析注解的顺序](https://raw.githubusercontent.com/mxsm/picture/main/spring/ConfigurationClassParser%E8%A7%A3%E6%9E%90%E6%B3%A8%E8%A7%A3%E7%9A%84%E9%A1%BA%E5%BA%8F.png)

在解析 @ComponentScan注解和@Import注解的时候如果扫描或者导入的类又存在@Configuration注解就会再一次重复执行@Configuration注解的解析流程。

通过上面分析可以总结出整体的一个解析顺序和流程如下图所示：

![Spring常用类注解的解析先后顺序](https://raw.githubusercontent.com/mxsm/picture/main/spring/Spring%E5%B8%B8%E7%94%A8%E7%B1%BB%E6%B3%A8%E8%A7%A3%E7%9A%84%E8%A7%A3%E6%9E%90%E5%85%88%E5%90%8E%E9%A1%BA%E5%BA%8F.png)

### 3. 修饰属性或者方法注解解析顺序分析

通过对Spring源码的分析可以知道处理  **`@Value`** 和 **`@Autowired`** 注解主要由 **`AutowiredAnnotationBeanPostProcessor`** 来实现。研究源码发现， **`@Value`** 和 **`@Autowired`** 注解都可以归结为一类注解：自动装配注解，只是 **`@Value`** 装配的是基本类型或者包装类型以及String类型的数据， 而 **`@Autowired`** 自动装配的是对象。

所以 **`@Value`** 和 **`@Autowired`**  没有严格意义上的前后顺序。

### 4. 总结

- **Spring 中@Component注解是很多注解的元注解(定义的注解被@Component修饰)，例如@Service只是不同语义的定义而已，本质上都是@Component注解，包括@Configuration注解**
- **@PropertySource、@ComponentScan、@Import、@ImportResource、@Bean单独是没办法使用，从上面的解析顺序分析可以得出结论，如果一个类上面配置了这五个注解但是没有配置@Configuration注解，这些注解都没办法起作用。要想起作用必须和@Configuration搭配使用。这个是最重要的一点**
- **@ComponentScan会重新执行ClassPathBeanDefinitionScanner#scan扫描，会在走一遍解析的流程**
- **@Import如果导入了包含@Configuration注解的类也同样会走一遍@Configuration的解析流程**

**在注解使用的时候注意有依赖关系的需要搭配使用单独使用会没有效果。**
