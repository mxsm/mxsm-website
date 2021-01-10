---
title: BeanFactoryPostProcessor详解
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之核心类核心代码
  - Spring源码解析之BeanFactoryPostProcessor系列
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之核心类
abbrlink: 16ca0958
date: 2019-02-13 07:52:08
---
### 1. BeanFactoryPostProcessor继承关系

![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/BeanFactoryPostProcessor.png?raw=true)

**`BeanFactoryPostProcessor`** 主要用来处理注入Bean到BeanFactory中以及Bean类上面的注解，比如 **@Configuration**

- **PropertySourcesPlaceholderConfigurer和 PropertyPlaceholderConfigurer** 

  ```java
  //xml context 元素解析
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
  
  class PropertyPlaceholderBeanDefinitionParser extends AbstractPropertyLoadingBeanDefinitionParser {
  
  	private static final String SYSTEM_PROPERTIES_MODE_ATTRIBUTE = "system-properties-mode";
  
  	private static final String SYSTEM_PROPERTIES_MODE_DEFAULT = "ENVIRONMENT";
  
  
  	@Override
  	protected Class<?> getBeanClass(Element element) {
  		// As of Spring 3.1, the default value of system-properties-mode has changed from
  		// 'FALLBACK' to 'ENVIRONMENT'. This latter value indicates that resolution of
  		// placeholders against system properties is a function of the Environment and
  		// its current set of PropertySources.
  		if (SYSTEM_PROPERTIES_MODE_DEFAULT.equals(element.getAttribute(SYSTEM_PROPERTIES_MODE_ATTRIBUTE))) {
  			return PropertySourcesPlaceholderConfigurer.class;
  		}
  
  		// The user has explicitly specified a value for system-properties-mode: revert to
  		// PropertyPlaceholderConfigurer to ensure backward compatibility with 3.0 and earlier.
  		return PropertyPlaceholderConfigurer.class;
  	}
  
  	@Override
  	protected void doParse(Element element, ParserContext parserContext, BeanDefinitionBuilder builder) {
  		super.doParse(element, parserContext, builder);
  
  		builder.addPropertyValue("ignoreUnresolvablePlaceholders",
  				Boolean.valueOf(element.getAttribute("ignore-unresolvable")));
  
  		String systemPropertiesModeName = element.getAttribute(SYSTEM_PROPERTIES_MODE_ATTRIBUTE);
  		if (StringUtils.hasLength(systemPropertiesModeName) &&
  				!systemPropertiesModeName.equals(SYSTEM_PROPERTIES_MODE_DEFAULT)) {
  			builder.addPropertyValue("systemPropertiesModeName", "SYSTEM_PROPERTIES_MODE_" + systemPropertiesModeName);
  		}
  
  		if (element.hasAttribute("value-separator")) {
  			builder.addPropertyValue("valueSeparator", element.getAttribute("value-separator"));
  		}
  		if (element.hasAttribute("trim-values")) {
  			builder.addPropertyValue("trimValues", element.getAttribute("trim-values"));
  		}
  		if (element.hasAttribute("null-value")) {
  			builder.addPropertyValue("nullValue", element.getAttribute("null-value"));
  		}
  	}
  
  }
  ```

  这类加载了。

- **ConfigurationClassPostProcessor**

  这个类注入分为两种：

  - XML的情况下注入

    ```java
    public class ContextNamespaceHandler extends NamespaceHandlerSupport {
    
    	@Override
    	public void init() {
    		registerBeanDefinitionParser("property-placeholder", new PropertyPlaceholderBeanDefinitionParser());
    		registerBeanDefinitionParser("property-override", new PropertyOverrideBeanDefinitionParser());
            //这个类注入
    		registerBeanDefinitionParser("annotation-config", new AnnotationConfigBeanDefinitionParser());
            //这个类注入
    		registerBeanDefinitionParser("component-scan", new ComponentScanBeanDefinitionParser());
    		registerBeanDefinitionParser("load-time-weaver", new LoadTimeWeaverBeanDefinitionParser());
    		registerBeanDefinitionParser("spring-configured", new SpringConfiguredBeanDefinitionParser());
    		registerBeanDefinitionParser("mbean-export", new MBeanExportBeanDefinitionParser());
    		registerBeanDefinitionParser("mbean-server", new MBeanServerBeanDefinitionParser());
    	}
    
    }
    ```

    > ```java
    > AnnotationConfigUtils.registerAnnotationConfigProcessors(parserContext.getRegistry(), source);这个方法里面注入了
    > ```

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
    
    		if (!registry.containsBeanDefinition(CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME)) {
    			//注入ConfigurationClassPostProcessor
                RootBeanDefinition def = new RootBeanDefinition(ConfigurationClassPostProcessor.class);
    			def.setSource(source);
    			beanDefs.add(registerPostProcessor(registry, def, CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME));
    		}
    
    		if (!registry.containsBeanDefinition(AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME)) {
    			RootBeanDefinition def = new RootBeanDefinition(AutowiredAnnotationBeanPostProcessor.class);
    			def.setSource(source);
    			beanDefs.add(registerPostProcessor(registry, def, AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME));
    		}
    
    		// Check for JSR-250 support, and if present add the CommonAnnotationBeanPostProcessor.
    		if (jsr250Present && !registry.containsBeanDefinition(COMMON_ANNOTATION_PROCESSOR_BEAN_NAME)) {
    			RootBeanDefinition def = new RootBeanDefinition(CommonAnnotationBeanPostProcessor.class);
    			def.setSource(source);
    			beanDefs.add(registerPostProcessor(registry, def, COMMON_ANNOTATION_PROCESSOR_BEAN_NAME));
    		}
    
    		// Check for JPA support, and if present add the PersistenceAnnotationBeanPostProcessor.
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
    
    		if (!registry.containsBeanDefinition(EVENT_LISTENER_PROCESSOR_BEAN_NAME)) {
    			RootBeanDefinition def = new RootBeanDefinition(EventListenerMethodProcessor.class);
    			def.setSource(source);
    			beanDefs.add(registerPostProcessor(registry, def, EVENT_LISTENER_PROCESSOR_BEAN_NAME));
    		}
    
    		if (!registry.containsBeanDefinition(EVENT_LISTENER_FACTORY_BEAN_NAME)) {
    			RootBeanDefinition def = new RootBeanDefinition(DefaultEventListenerFactory.class);
    			def.setSource(source);
    			beanDefs.add(registerPostProcessor(registry, def, EVENT_LISTENER_FACTORY_BEAN_NAME));
    		}
    
    		return beanDefs;
    	}
    
    ```

    

  - 注解的情况下注入

在Spring源码中主要可以关注一下上面的三个实现类。

>主要关注下面这两个接口：
>
>**BeanFactoryPostProcessor**
>
>**BeanDefinitionRegistryPostProcessor** (可以注入bean)



### 2. BeanFactoryPostProcessor在Spring中如何工作的源码分析

首先我们应该知道，**不管是什么在Spring的容器中都是一个Bean** ，经过bean的扫描或者xml定义后加载。代码首先会在这里进入：

> AbstractApplicationContext#refresh#invokeBeanFactoryPostProcessors 方法中来处理

```java
	protected void invokeBeanFactoryPostProcessors(ConfigurableListableBeanFactory beanFactory) {
        //这个方法主要处理实现了BeanFactoryPostProcessor接口的java类
		PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, getBeanFactoryPostProcessors());

		// Detect a LoadTimeWeaver and prepare for weaving, if found in the meantime
		// (e.g. through an @Bean method registered by ConfigurationClassPostProcessor)
		if (beanFactory.getTempClassLoader() == null && beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
			beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
			beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
		}
	}
```

**`PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, getBeanFactoryPostProcessors())`** 这个方法主要处理BeanFactoryPostProcessor实现的类。

```java
public static void invokeBeanFactoryPostProcessors(
			ConfigurableListableBeanFactory beanFactory, List<BeanFactoryPostProcessor> beanFactoryPostProcessors) {


		Set<String> processedBeans = new HashSet<>();

		//判断BeanFactory是否为BeanDefinitionRegistry的实例(BeanDefinitionRegistry可以注入bean)
		if (beanFactory instanceof BeanDefinitionRegistry) {
			BeanDefinitionRegistry registry = (BeanDefinitionRegistry) beanFactory;

			//存放实现BeanFactoryPostProcessor的实例
			List<BeanFactoryPostProcessor> regularPostProcessors = new ArrayList<>();

			//存放实现BeanDefinitionRegistryPostProcessor
			List<BeanDefinitionRegistryPostProcessor> registryProcessors = new ArrayList<>();

			for (BeanFactoryPostProcessor postProcessor : beanFactoryPostProcessors) {

				//分类存放BeanDefinitionRegistryPostProcessor 和 BeanFactoryPostProcessor
				if (postProcessor instanceof BeanDefinitionRegistryPostProcessor) {
					BeanDefinitionRegistryPostProcessor registryProcessor =
							(BeanDefinitionRegistryPostProcessor) postProcessor;
					//执行postProcessBeanDefinitionRegistry方法
					registryProcessor.postProcessBeanDefinitionRegistry(registry);
					registryProcessors.add(registryProcessor);
				}
				else {
					regularPostProcessors.add(postProcessor);
				}
			}


			//处理当前BeanDefinitionRegistryPostProcessor实现类
			List<BeanDefinitionRegistryPostProcessor> currentRegistryProcessors = new ArrayList<>();

			// 首先执行实现了PriorityOrdered的BeanDefinitionRegistryPostProcessor实现类
			// 在beanFacotry中通过BeanDefinitionRegistryPostProcessor类型获取名称
			String[] postProcessorNames =
					beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
			for (String ppName : postProcessorNames) {

				//过滤出来PriorityOrdered的实现类
				if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
					currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
					processedBeans.add(ppName);
				}
			}
			//排序按照PriorityOrdered
			sortPostProcessors(currentRegistryProcessors, beanFactory);
			registryProcessors.addAll(currentRegistryProcessors);
			//执行BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry()方法
			invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
			currentRegistryProcessors.clear();

			// 执行BeanDefinitionRegistryPostProcessors实现了Ordered接口的类.
			postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
			for (String ppName : postProcessorNames) {
				if (!processedBeans.contains(ppName) && beanFactory.isTypeMatch(ppName, Ordered.class)) {
					currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
					processedBeans.add(ppName);
				}
			}
			sortPostProcessors(currentRegistryProcessors, beanFactory);
			registryProcessors.addAll(currentRegistryProcessors);
			invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
			currentRegistryProcessors.clear();

			// 最后执行那些实现了BeanDefinitionRegistryPostProcessor类的
			boolean reiterate = true;
			while (reiterate) {
				reiterate = false;
				postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
				for (String ppName : postProcessorNames) {
					if (!processedBeans.contains(ppName)) {
						currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
						processedBeans.add(ppName);
						reiterate = true;
					}
				}
				sortPostProcessors(currentRegistryProcessors, beanFactory);
				registryProcessors.addAll(currentRegistryProcessors);
				invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
				currentRegistryProcessors.clear();
			}


			//调用BeanFactoryPostProcessor的postProcessBeanFactory
			invokeBeanFactoryPostProcessors(registryProcessors, beanFactory);
			invokeBeanFactoryPostProcessors(regularPostProcessors, beanFactory);
		}

		else {
			//直接调用postProcessor#postProcessBeanFactory
			invokeBeanFactoryPostProcessors(beanFactoryPostProcessors, beanFactory);
		}

		//下面处理的是实现了BeanFactoryPostProcessor的类
		String[] postProcessorNames =
				beanFactory.getBeanNamesForType(BeanFactoryPostProcessor.class, true, false);

		/**
		 * 三种：
		 * 1 实现了PriorityOrdered 和 BeanFactoryPostProcessor
		 * 2 实现了Ordered 和 BeanFactoryPostProcessor
		 * 3 只实现了BeanFactoryPostProcessor
		 */
		List<BeanFactoryPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
		List<String> orderedPostProcessorNames = new ArrayList<>();
		List<String> nonOrderedPostProcessorNames = new ArrayList<>();
		for (String ppName : postProcessorNames) {

			if (processedBeans.contains(ppName)) {
				// 如果是BeanDefinitionRegistryPostProcessor处理过的就什么也不做
			}
			else if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
				//保存实现了PriorityOrdered接口的BeanFactoryPostProcessor
				priorityOrderedPostProcessors.add(beanFactory.getBean(ppName, BeanFactoryPostProcessor.class));
			}
			else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
				//保存实现了Ordered接口的BeanFactoryPostProcessor
				orderedPostProcessorNames.add(ppName);
			}
			else {
				//正常的接口
				nonOrderedPostProcessorNames.add(ppName);
			}
		}

		//对priorityOrderedPostProcessors进行排序
		sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
		//执行BeanFactoryPostProcessor#postProcessBeanFactory()方法
		invokeBeanFactoryPostProcessors(priorityOrderedPostProcessors, beanFactory);

		// 执行完实现了Ordered接口的BeanFactoryPostProcessor
		List<BeanFactoryPostProcessor> orderedPostProcessors = new ArrayList<>();
		for (String postProcessorName : orderedPostProcessorNames) {
			orderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
		}
		sortPostProcessors(orderedPostProcessors, beanFactory);
		invokeBeanFactoryPostProcessors(orderedPostProcessors, beanFactory);

		// 执行完剩下的BeanFactoryPostProcessor(没有实现Ordered和PriorityOrdered接口)
		List<BeanFactoryPostProcessor> nonOrderedPostProcessors = new ArrayList<>();
		for (String postProcessorName : nonOrderedPostProcessorNames) {
			nonOrderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
		}
		invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory);


		beanFactory.clearMetadataCache();
	}
```

通过上面的代码可以看出来，**`AbstractApplicationContext#refresh#invokeBeanFactoryPostProcessors`** 这个方法主要用来执行 **`BeanFactoryPostProcessor`** 和 **`BeanDefinitionRegistryPostProcessor`** 这两个类的接口。 **`BeanDefinitionRegistryPostProcessor`** 继承了  **`BeanFactoryPostProcessor`** 接口。从这里可以看出来Spring容器是如何调用这两个类的。
