---
title: ClassPathXmlApplicationContext源码解析
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
abbrlink: a272be0e
date: 2019-02-26 13:54:31
---
### 1. ClassPathXmlApplicationContext源码解析

从名称可以看出来这个 **ApplicationContext** 主要负责Class Path 的xml对Spring 框架的解析

```java
public class ClassPathXmlApplicationContext extends AbstractXmlApplicationContext {

	@Nullable
	private Resource[] configResources;

	public ClassPathXmlApplicationContext() {
	}

	public ClassPathXmlApplicationContext(ApplicationContext parent) {
		super(parent);
	}

	public ClassPathXmlApplicationContext(String configLocation) throws BeansException {
		this(new String[] {configLocation}, true, null);
	}

	public ClassPathXmlApplicationContext(String... configLocations) throws BeansException {
		this(configLocations, true, null);
	}

	public ClassPathXmlApplicationContext(String[] configLocations, @Nullable ApplicationContext parent)
			throws BeansException {

		this(configLocations, true, parent);
	}

	public ClassPathXmlApplicationContext(String[] configLocations, boolean refresh) throws BeansException {
		this(configLocations, refresh, null);
	}

	public ClassPathXmlApplicationContext(
			String[] configLocations, boolean refresh, @Nullable ApplicationContext parent)
			throws BeansException {

		super(parent);
		setConfigLocations(configLocations);
		if (refresh) {
			refresh();
		}
	}
    
	public ClassPathXmlApplicationContext(String path, Class<?> clazz) throws BeansException {
		this(new String[] {path}, clazz);
	}

	public ClassPathXmlApplicationContext(String[] paths, Class<?> clazz) throws BeansException {
		this(paths, clazz, null);
	}

	public ClassPathXmlApplicationContext(String[] paths, Class<?> clazz, @Nullable ApplicationContext parent)
			throws BeansException {

		super(parent);
		Assert.notNull(paths, "Path array must not be null");
		Assert.notNull(clazz, "Class argument must not be null");
		this.configResources = new Resource[paths.length];
		for (int i = 0; i < paths.length; i++) {
			this.configResources[i] = new ClassPathResource(paths[i], clazz);
		}
		refresh();
	}


	@Override
	@Nullable
	protected Resource[] getConfigResources() {
		return this.configResources;
	}

}
```

从上面的代码可以看出来主要就是几个 **`ClassPathXmlApplicationContext`** 的构造函数。构造函数的主要目的是为了读取配置文件。通过获取到 **`Resource`** (在Spring中所有的配置文件都被抽象成了一个资源)。主要的通过调用 **`refresh()`** 方法。

```java
public abstract class AbstractApplicationContext extends DefaultResourceLoader
		implements ConfigurableApplicationContext {

	@Override
	public void refresh() throws BeansException, IllegalStateException {
		synchronized (this.startupShutdownMonitor) {
			//准备刷新当前 ApplicationContext.
			prepareRefresh();

			// 告诉子类去刷新内部的Bean Factory--bean的解析和加载Bean的定义
			ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();


			//准备 bean factory 能使用当前的context
			prepareBeanFactory(beanFactory);

			try {
				//允许在上下文子类中对bean工厂进行后处理
				postProcessBeanFactory(beanFactory);

				//调用 factory processors在当前 context 注册为Beans
				invokeBeanFactoryPostProcessors(beanFactory);

				//注册Bean的后置处理器
				registerBeanPostProcessors(beanFactory);

				// 为当前context初始化消息资源 .
				initMessageSource();

				// 初始化事件多路通道.
				initApplicationEventMulticaster();

				// 初始化其他特殊的beans在特殊context子类
				onRefresh();

				// 检查和注册监听
				registerListeners();

				//实例化所有的剩下的单例(非懒加载初始化)
				finishBeanFactoryInitialization(beanFactory);

				//发布匹配事件.
				finishRefresh();
			}

			catch (BeansException ex) {
				if (logger.isWarnEnabled()) {
					logger.warn("Exception encountered during context initialization - " +
							"cancelling refresh attempt: " + ex);
				}

				// Destroy already created singletons to avoid dangling resources.
				destroyBeans();

				// Reset 'active' flag.
				cancelRefresh(ex);

				// Propagate exception to caller.
				throw ex;
			}

			finally {
				// Reset common introspection caches in Spring's core, since we
				// might not ever need metadata for singleton beans anymore...
				resetCommonCaches();
			}
		}
	}

}
```

看一下上面代码的流程图解：

![](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/AbstractApplicationContextReflash%E8%87%AA%E8%A1%8C%E6%B5%81%E7%A8%8B%E5%9B%BE.png?raw=true)

上面代码省略了其他方法。接下来一个个来解析方法：

- **`prepareRefresh()`** 

  ```java
  protected void prepareRefresh() {
  	// 首先标记为active状态
  	this.startupDate = System.currentTimeMillis();
  	this.closed.set(false);
  	this.active.set(true);
  
  	if (logger.isDebugEnabled()) {
  		if (logger.isTraceEnabled()) {
  			logger.trace("Refreshing " + this);
  		}
  		else {
  			logger.debug("Refreshing " + getDisplayName());
  		}
  	}
  
  	// 在context中初始化任何有占位符的资源----由AbstractApplicationContext的子类实现
  	initPropertySources();
  
  	//验证一些必须有的属性
  	getEnvironment().validateRequiredProperties();
  
  	// 存储准备刷新 ApplicationListeners...
  	if (this.earlyApplicationListeners == null) {
  		this.earlyApplicationListeners = new LinkedHashSet<>(this.applicationListeners);
  	}
  	else {
  		// 重置本地的
  		this.applicationListeners.clear();
  		this.applicationListeners.addAll(this.earlyApplicationListeners);
  	}
  	this.earlyApplicationEvents = new LinkedHashSet<>();
  }
  ```

  看一下在 **prepareRefresh** 方法中的几个主要的方法：

  - **`initPropertySources()`** 该方法主要用于初始化属性资源在子类中进行实现。对于不同的子类实现的方式不同。对于现在我们研究的是 **`ClassPathXmlApplicationContext`**  。通过代码研究发现在这个类中是没有实现的。

- **`ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory()`**

  接下来看一下 **`obtainFreshBeanFactory`** 方法的代码：

  ```java
  protected ConfigurableListableBeanFactory obtainFreshBeanFactory() {
  		refreshBeanFactory();
  		return getBeanFactory();
  }
  ```

  包含了两个方法分别是：

  1. **refreshBeanFactory --- 抽象方法由子类(AbstractRefreshableApplicationContext)实现**

     ```java
     protected final void refreshBeanFactory() throws BeansException {
         	//判断是否有BeanFactory
     		if (hasBeanFactory()) {
     			destroyBeans();
     			closeBeanFactory();
     		}
     		try {
                 //重新创建BeanFactory
     			DefaultListableBeanFactory beanFactory = createBeanFactory();
     			//设置序列化ID
                 beanFactory.setSerializationId(getId());
     			customizeBeanFactory(beanFactory);
                 //加载Bean的定义---这里就是加载定义Spring Bean 的定义加载到 BeanFactory
                 //这个方法是一个抽象方法由子类实现
     			loadBeanDefinitions(beanFactory);
     			synchronized (this.beanFactoryMonitor) {
     				this.beanFactory = beanFactory;
     			}
     		}
     		catch (IOException ex) {
     			//省略。。。。 抛出错误
     		}
     	}
     ```

     对于 **`ClassPathXmlApplicationContext`** 这个方法的实现的子类是  **`AbstractXmlApplicationContext`** 下面来粗略分析一下这个类的实现：

     - ```java
       	@Override
         	protected void loadBeanDefinitions(DefaultListableBeanFactory beanFactory) throws BeansException, IOException {
         		//创建一个XML对应的定义Reader
         		XmlBeanDefinitionReader beanDefinitionReader = new XmlBeanDefinitionReader(beanFactory);
         
         		//设置 Environment ResourceLoader EntityResolver
         		beanDefinitionReader.setEnvironment(this.getEnvironment());
         		beanDefinitionReader.setResourceLoader(this);
         		beanDefinitionReader.setEntityResolver(new ResourceEntityResolver(this));
         
         		//初始化Reader
         		initBeanDefinitionReader(beanDefinitionReader);
               //加载Bean的定义
         		loadBeanDefinitions(beanDefinitionReader);
         	}
        ```
     
  2. **getBeanFactory --- 抽象方法由子类(AbstractRefreshableApplicationContext)实现**
  
     ```java
   @Override
     	public final ConfigurableListableBeanFactory getBeanFactory() {
   		synchronized (this.beanFactoryMonitor) {
     			if (this.beanFactory == null) {
     				throw new IllegalStateException("BeanFactory not initialized or already closed - " +
     						"call 'refresh' before accessing beans via the ApplicationContext");
     			}
     			return this.beanFactory;
     		}
     	}
     ```
     
     
  
- **`prepareBeanFactory(beanFactory)`**

  主要对bean Factory 进行设置

  ```java
  protected void prepareBeanFactory(ConfigurableListableBeanFactory beanFactory) {
  		// 设置Bean的类加载器.
  		beanFactory.setBeanClassLoader(getClassLoader());
          //设置Bean表达式解析器
  		beanFactory.setBeanExpressionResolver(new StandardBeanExpressionResolver(beanFactory.getBeanClassLoader()));
      	//设置属性
  		beanFactory.addPropertyEditorRegistrar(new ResourceEditorRegistrar(this, getEnvironment()));
  
  		// 添加Context上下文处理 *Aware处理器
  		beanFactory.addBeanPostProcessor(new ApplicationContextAwareProcessor(this));
  		//设置忽略*Aware依赖--上面的ApplicationContextAwareProcessor已经处理了
          beanFactory.ignoreDependencyInterface(EnvironmentAware.class);
  		beanFactory.ignoreDependencyInterface(EmbeddedValueResolverAware.class);
  		beanFactory.ignoreDependencyInterface(ResourceLoaderAware.class);
  		beanFactory.ignoreDependencyInterface(ApplicationEventPublisherAware.class);
  		beanFactory.ignoreDependencyInterface(MessageSourceAware.class);
  		beanFactory.ignoreDependencyInterface(ApplicationContextAware.class);
  
  		// 设置特殊类型对应的bean.beanFactory对应刚刚获取的BeanFactory
          //ResourceLoader, ApplicationEventPublisher, ApplicationContext这3个接口对应的bean都设置为当前的Spring容器
  		beanFactory.registerResolvableDependency(BeanFactory.class, beanFactory);
  		beanFactory.registerResolvableDependency(ResourceLoader.class, this);
  		beanFactory.registerResolvableDependency(ApplicationEventPublisher.class, this);
  		beanFactory.registerResolvableDependency(ApplicationContext.class, this);
  
  		// 注册ApplicationListenerDetector，用于发现实现了ApplicationListener接口的bean
  		beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(this));
  
  		// Detect a LoadTimeWeaver and prepare for weaving, if found.
  		if (beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
  			beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
  			// Set a temporary ClassLoader for type matching.
  			beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
  		}
  
  		// 注册默认的 environment beans
  		if (!beanFactory.containsLocalBean(ENVIRONMENT_BEAN_NAME)) {
  			beanFactory.registerSingleton(ENVIRONMENT_BEAN_NAME, getEnvironment());
  		}
  		if (!beanFactory.containsLocalBean(SYSTEM_PROPERTIES_BEAN_NAME)) {
  			beanFactory.registerSingleton(SYSTEM_PROPERTIES_BEAN_NAME, getEnvironment().getSystemProperties());
  		}
  		if (!beanFactory.containsLocalBean(SYSTEM_ENVIRONMENT_BEAN_NAME)) {
  			beanFactory.registerSingleton(SYSTEM_ENVIRONMENT_BEAN_NAME, getEnvironment().getSystemEnvironment());
  		}
  	}
  ```

  

- **`postProcessBeanFactory(beanFactory)`**

  在 **`ClassPathXmlApplicationContext`** 中 **`postProcessBeanFactory`** 只是一个空的实现

- **`invokeBeanFactoryPostProcessors(beanFactory)`**

  实例化和执行所有的注册的 **`BeanFactoryPostProcessor`**  如果实现了 **`Ordered`**  或者 **`PriorityOrdered`** 需要遵循

  ```java
  	protected void invokeBeanFactoryPostProcessors(ConfigurableListableBeanFactory beanFactory) {
          //处理后置Bean Factory 处理器
  		PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, getBeanFactoryPostProcessors());
  		if (beanFactory.getTempClassLoader() == null && beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
  			beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
  			beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
  		}
  	}
  ```

  在上面的方法主要是通过： **`PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, getBeanFactoryPostProcessors())`** 来进行

  ```java
  	public static void invokeBeanFactoryPostProcessors(
  			ConfigurableListableBeanFactory beanFactory, List<BeanFactoryPostProcessor> beanFactoryPostProcessors) {
  
  		//首先执行BeanDefinitionRegistryPostProcessor
  		Set<String> processedBeans = new HashSet<>();
  
  		if (beanFactory instanceof BeanDefinitionRegistry) {
  			BeanDefinitionRegistry registry = (BeanDefinitionRegistry) beanFactory;
  			List<BeanFactoryPostProcessor> regularPostProcessors = new ArrayList<>();
  			List<BeanDefinitionRegistryPostProcessor> registryProcessors = new ArrayList<>();
  
  			for (BeanFactoryPostProcessor postProcessor : beanFactoryPostProcessors) {
  				if (postProcessor instanceof BeanDefinitionRegistryPostProcessor) {
  					//调用处理BeanDefinitionRegistryPostProcessor
  					BeanDefinitionRegistryPostProcessor registryProcessor =
  							(BeanDefinitionRegistryPostProcessor) postProcessor;
  					registryProcessor.postProcessBeanDefinitionRegistry(registry);
  					registryProcessors.add(registryProcessor);
  				}
  				else {
  					regularPostProcessors.add(postProcessor);
  				}
  			}
  
  
  			List<BeanDefinitionRegistryPostProcessor> currentRegistryProcessors = new ArrayList<>();
  
  			// 首先执行 BeanDefinitionRegistryPostProcessors 实现了 PriorityOrdered.
  			String[] postProcessorNames =
  					beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
  			for (String ppName : postProcessorNames) {
  				if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
  					currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
  					processedBeans.add(ppName);
  				}
  			}
  			sortPostProcessors(currentRegistryProcessors, beanFactory);
  			registryProcessors.addAll(currentRegistryProcessors);
  			invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
  			currentRegistryProcessors.clear();
  
  			// 接下来执行 BeanDefinitionRegistryPostProcessors 实现 Ordered.
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
  
  			// 执行剩下的所有的 BeanDefinitionRegistryPostProcessors
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
  			
  			//执行回调方法 postProcessBeanFactory
  			invokeBeanFactoryPostProcessors(registryProcessors, beanFactory);
  			invokeBeanFactoryPostProcessors(regularPostProcessors, beanFactory);
  		}
  
  		else {
  			// Invoke factory processors registered with the context instance.
  			invokeBeanFactoryPostProcessors(beanFactoryPostProcessors, beanFactory);
  		}
  
  		// Do not initialize FactoryBeans here: We need to leave all regular beans
  		// uninitialized to let the bean factory post-processors apply to them!
  		String[] postProcessorNames =
  				beanFactory.getBeanNamesForType(BeanFactoryPostProcessor.class, true, false);
  
  		//处理PriorityOrdered 和 Ordered 的类
  		List<BeanFactoryPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
  		List<String> orderedPostProcessorNames = new ArrayList<>();
  		List<String> nonOrderedPostProcessorNames = new ArrayList<>();
  		for (String ppName : postProcessorNames) {
  			if (processedBeans.contains(ppName)) {
  				// skip - already processed in first phase above
  			}
  			else if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
  				priorityOrderedPostProcessors.add(beanFactory.getBean(ppName, BeanFactoryPostProcessor.class));
  			}
  			else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
  				orderedPostProcessorNames.add(ppName);
  			}
  			else {
  				nonOrderedPostProcessorNames.add(ppName);
  			}
  		}
  
  		// 首先执行 BeanFactoryPostProcessors 实现了 PriorityOrdered.
  		sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
  		invokeBeanFactoryPostProcessors(priorityOrderedPostProcessors, beanFactory);
  
  		// 执行 BeanFactoryPostProcessors 实现了 Ordered.
  		List<BeanFactoryPostProcessor> orderedPostProcessors = new ArrayList<>(orderedPostProcessorNames.size());
  		for (String postProcessorName : orderedPostProcessorNames) {
  			orderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
  		}
  		sortPostProcessors(orderedPostProcessors, beanFactory);
  		invokeBeanFactoryPostProcessors(orderedPostProcessors, beanFactory);
  
  		// 最后执行所有的 BeanFactoryPostProcessors.
  		List<BeanFactoryPostProcessor> nonOrderedPostProcessors = new ArrayList<>(nonOrderedPostProcessorNames.size());
  		for (String postProcessorName : nonOrderedPostProcessorNames) {
  			nonOrderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
  		}
  		invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory);
  
  		beanFactory.clearMetadataCache();
  	}
  ```

  

- **`registerBeanPostProcessors(beanFactory)`**

  注册Bean **`PostProcessor`**  处理器。代码如下：

  ```java
  protected void registerBeanPostProcessors(ConfigurableListableBeanFactory beanFactory) {
  		PostProcessorRegistrationDelegate.registerBeanPostProcessors(beanFactory, this);
  	}
  ```

  从上面可以看出来就一行代码，调用了 **`PostProcessorRegistrationDelegate.registerBeanPostProcessors(beanFactory, this)`** 静态方法

  ```java
  public static void registerBeanPostProcessors(
  			ConfigurableListableBeanFactory beanFactory, AbstractApplicationContext applicationContext) {
  
  		String[] postProcessorNames = beanFactory.getBeanNamesForType(BeanPostProcessor.class, true, false);
  		int beanProcessorTargetCount = beanFactory.getBeanPostProcessorCount() + 1 + postProcessorNames.length;
  		beanFactory.addBeanPostProcessor(new BeanPostProcessorChecker(beanFactory, beanProcessorTargetCount));
  		List<BeanPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
  		List<BeanPostProcessor> internalPostProcessors = new ArrayList<>();
  		List<String> orderedPostProcessorNames = new ArrayList<>();
  		List<String> nonOrderedPostProcessorNames = new ArrayList<>();
  		for (String ppName : postProcessorNames) {
  			if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
  				BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
  				priorityOrderedPostProcessors.add(pp);
  				if (pp instanceof MergedBeanDefinitionPostProcessor) {
  					internalPostProcessors.add(pp);
  				}
  			}
  			else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
  				orderedPostProcessorNames.add(ppName);
  			}
  			else {
  				nonOrderedPostProcessorNames.add(ppName);
  			}
  		}
  		sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
  		registerBeanPostProcessors(beanFactory, priorityOrderedPostProcessors);
  		List<BeanPostProcessor> orderedPostProcessors = new ArrayList<>(orderedPostProcessorNames.size());
  		for (String ppName : orderedPostProcessorNames) {
  			BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
  			orderedPostProcessors.add(pp);
  			if (pp instanceof MergedBeanDefinitionPostProcessor) {
  				internalPostProcessors.add(pp);
  			}
  		}
  		sortPostProcessors(orderedPostProcessors, beanFactory);
  		registerBeanPostProcessors(beanFactory, orderedPostProcessors);
  		List<BeanPostProcessor> nonOrderedPostProcessors = new ArrayList<>(nonOrderedPostProcessorNames.size());
  		for (String ppName : nonOrderedPostProcessorNames) {
  			BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
  			nonOrderedPostProcessors.add(pp);
  			if (pp instanceof MergedBeanDefinitionPostProcessor) {
  				internalPostProcessors.add(pp);
  			}
  		}
  		registerBeanPostProcessors(beanFactory, nonOrderedPostProcessors);
  
  		
  		sortPostProcessors(internalPostProcessors, beanFactory);
  		registerBeanPostProcessors(beanFactory, internalPostProcessors);
  
  		
  		beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(applicationContext));
  	}
  ```

  这段代码和 **`BeanFactoryPostProcessor`** 处理差不多。

- **`initMessageSource()`**

  初始化消息源

  ```java
  	protected void initMessageSource() {
  		ConfigurableListableBeanFactory beanFactory = getBeanFactory();
          //判断是否存在Bean名称为messageSource
  		if (beanFactory.containsLocalBean(MESSAGE_SOURCE_BEAN_NAME)) {
  			this.messageSource = beanFactory.getBean(MESSAGE_SOURCE_BEAN_NAME, MessageSource.class);
  			// Make MessageSource aware of parent MessageSource.
  			if (this.parent != null && this.messageSource instanceof HierarchicalMessageSource) {
  				HierarchicalMessageSource hms = (HierarchicalMessageSource) this.messageSource;
  				if (hms.getParentMessageSource() == null) {
  					hms.setParentMessageSource(getInternalParentMessageSource());
  				}
  			}
  			if (logger.isTraceEnabled()) {
  				logger.trace("Using MessageSource [" + this.messageSource + "]");
  			}
  		}
  		else {
              //BeanFactory 不存在直接建立
  			DelegatingMessageSource dms = new DelegatingMessageSource();
  			dms.setParentMessageSource(getInternalParentMessageSource());
  			this.messageSource = dms;
  			beanFactory.registerSingleton(MESSAGE_SOURCE_BEAN_NAME, this.messageSource);
  			if (logger.isTraceEnabled()) {
  				logger.trace("No '" + MESSAGE_SOURCE_BEAN_NAME + "' bean, using [" + this.messageSource + "]");
  			}
  		}
  	}
  ```

- **`initApplicationEventMulticaster()`**

  初始化广播事件

- **`onRefresh()`**

- **`registerListeners()`**

  注册系统里的监听者，看一下这个方法的代码:

  ```java
  	protected void registerListeners() {
  		// 注册特定的静态的监听器
  		for (ApplicationListener<?> listener : getApplicationListeners()) {
  			getApplicationEventMulticaster().addApplicationListener(listener);
  		}
  
  		//获取监听器的Bean的名称
  		String[] listenerBeanNames = getBeanNamesForType(ApplicationListener.class, true, false);
  		for (String listenerBeanName : listenerBeanNames) {
  			getApplicationEventMulticaster().addApplicationListenerBean(listenerBeanName);
  		}
  
  		// Publish early application events now that we finally have a multicaster...
  		Set<ApplicationEvent> earlyEventsToProcess = this.earlyApplicationEvents;
  		this.earlyApplicationEvents = null;
  		if (earlyEventsToProcess != null) {
  			for (ApplicationEvent earlyEvent : earlyEventsToProcess) {
  				getApplicationEventMulticaster().multicastEvent(earlyEvent);
  			}
  		}
  	}
  ```

  

- **`finishBeanFactoryInitialization(beanFactory)`**

  初始化剩下的单例Bean

  ```java
  	protected void finishBeanFactoryInitialization(ConfigurableListableBeanFactory beanFactory) {
  		
  		if (beanFactory.containsBean(CONVERSION_SERVICE_BEAN_NAME) &&
  				beanFactory.isTypeMatch(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class)) {
  			beanFactory.setConversionService(
  					beanFactory.getBean(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class));
  		}
  		if (!beanFactory.hasEmbeddedValueResolver()) {
  			beanFactory.addEmbeddedValueResolver(strVal -> getEnvironment().resolvePlaceholders(strVal));
  		}
  
  		//包含Aware中的
  		String[] weaverAwareNames = beanFactory.getBeanNamesForType(LoadTimeWeaverAware.class, false, false);
  		for (String weaverAwareName : weaverAwareNames) {
  			getBean(weaverAwareName);
  		}
  
  		beanFactory.setTempClassLoader(null);
  
  		beanFactory.freezeConfiguration();
  
  		// 实例化单例Bean
  		beanFactory.preInstantiateSingletons();
  	}
  ```

- **`finishRefresh()`**

  完成最后的刷新

  ```java
  protected void finishRefresh() {
  		// Clear context-level resource caches (such as ASM metadata from scanning).
  		clearResourceCaches();
  
  		// Initialize lifecycle processor for this context.
  		initLifecycleProcessor();
  
  		// Propagate refresh to lifecycle processor first.
  		getLifecycleProcessor().onRefresh();
  
  		// Publish the final event.
  		publishEvent(new ContextRefreshedEvent(this));
  
  		// Participate in LiveBeansView MBean, if active.
  		LiveBeansView.registerApplicationContext(this);
  	}
  ```

  

