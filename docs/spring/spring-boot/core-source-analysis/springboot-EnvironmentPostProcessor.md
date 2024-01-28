---
title: SpringBoot源码解析之spring.factories配置-EnvironmentPostProcessor
linkTiletitle: SpringBoot源码解析之spring.factories配置-EnvironmentPostProcessor
date: 2020-01-15
---

### EnvironmentPostProcessor的作用

SpringBoot支持动态的读取文件，留下的扩展接 **org.springframework.boot.env.EnvironmentPostProcessor** 。这个接口是spring包下的，使用这个进行配置文件的集中管理，而不需要每个项目都去配置配置文件。这种方法也是springboot框架留下的一个扩展（可以自己去扩展），下面看一下源码：

```java
@FunctionalInterface
public interface EnvironmentPostProcessor {
	void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application);

}
```

源码很简单就一个方法。

### EnvironmentPostProcessor在SpringBoot(v2.2.2)源码分析

源码分析主要分为以下几个步骤：

- **如何从spring.factories加载**
- **EnvironmentPostProcessor如何处理数据**

#### 如何从spring.factories加载

Spring框架加载 **spring.factories** 里面的数据主要是通过 **SpringFactoriesLoader** 来进行加载的，那么我们来看一下SpringBoot中如何加载EnvironmentPostProcessor：

```java
public class ConfigFileApplicationListener implements EnvironmentPostProcessor, SmartApplicationListener, Ordered {
    //省略代码
    List<EnvironmentPostProcessor> loadPostProcessors() {
		return SpringFactoriesLoader.loadFactories(EnvironmentPostProcessor.class, getClass().getClassLoader());
	}
}
```

通过研究代码发现，主要是通过 **`ConfigFileApplicationListener`** 监听器中的 **loadPostProcessors** 方法来加载。

#### EnvironmentPostProcessor如何处理数据

通过上面的可以看出来主要是通过 **`ConfigFileApplicationListener`**  来进行加载的，那么接着来看一下如何处理数据。通过代码反推的方式来进行：

```java
public class ConfigFileApplicationListener implements EnvironmentPostProcessor, SmartApplicationListener, Ordered {
    //省略代码
    //说明：从代码可以看出来实现了EnvironmentPostProcessor和SmartApplicationListener监听器
}
```

下面来看一下 **`loadPostProcessors`** 方法在 **`onApplicationEnvironmentPreparedEvent`** 中调用：

```java
private void onApplicationEnvironmentPreparedEvent(ApplicationEnvironmentPreparedEvent event) {
    	//从spring.factories加载EnvironmentPostProcessor
		List<EnvironmentPostProcessor> postProcessors = loadPostProcessors();
		//添加当前的类实例
    	postProcessors.add(this);
    	//对EnvironmentPostProcessor进行排序--如果使用了Order
		AnnotationAwareOrderComparator.sort(postProcessors);
		for (EnvironmentPostProcessor postProcessor : postProcessors) {
            //数据处理
			postProcessor.postProcessEnvironment(event.getEnvironment(), event.getSpringApplication());
		}
	}
```

通过上面的代码可以看出来，获取了spring.factories加载EnvironmentPostProcessor的实现，执行相关的EnvironmentPostProcessor的方法 **`postProcessEnvironment`** 。

那么分析了完成了如何进行调用 **`EnvironmentPostProcessor`** 。那调用如何触发的，前面可以看出来 **`ConfigFileApplicationListener`** 是监听器。 下面来看一下代码分析：

```java
	@Override
	public void onApplicationEvent(ApplicationEvent event) {
		if (event instanceof ApplicationEnvironmentPreparedEvent) {
			onApplicationEnvironmentPreparedEvent((ApplicationEnvironmentPreparedEvent) event);
		}
		if (event instanceof ApplicationPreparedEvent) {
			onApplicationPreparedEvent(event);
		}
	}
```

从上面的代码可以看出来，**`onApplicationEvent`** 中调用了私有方法 **`onApplicationEnvironmentPreparedEvent`** 。通过判断 **`ApplicationEvent`** 是否为 **`ApplicationEnvironmentPreparedEvent`**  去调用方法 **`onApplicationEnvironmentPreparedEvent`** 。

> 分析到这来就可以明白了，EnvironmentPostProcessor主要是通过Spring的事件驱动来出发调用的。

#### ConfigFileApplicationListener如何加载

在spring-boot代码模块中，可以看一下spring.factories文件中org.springframework.context.ApplicationListener选项。接下来就看看SpringBoot如何加载 ApplicationListener。通过代码分析可看一下SpringBoot运行的启动类 **`SpringApplication`** ，Spring的构造：

```java
	public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
		this.resourceLoader = resourceLoader;
		Assert.notNull(primarySources, "PrimarySources must not be null");
		this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
		this.webApplicationType = WebApplicationType.deduceFromClasspath();
		//加载spring.factories中的ApplicationContextInitializer
        setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
        ////加载spring.factories中的ApplicationListener
		setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
		this.mainApplicationClass = deduceMainApplicationClass();
	}
```

通过上面可以看出来通过 **`SpringApplication#getSpringFactoriesInstances`** 方法来获取实例。设置到私有变量：**private List&lt;ApplicationListener&lt;?>> listeners;** 分析到这里已经看到了把 **`ApplicationListener`** 相关实现实例加载。那么怎么样调用呢？

在 **SpringApplication#run** 方法，中是SpringBoot运行的关键方法，在这个方法中有一个一段代码

```java
SpringApplicationRunListeners listeners = getRunListeners(args);

private SpringApplicationRunListeners getRunListeners(String[] args) {
		Class<?>[] types = new Class<?>[] { SpringApplication.class, String[].class };
		return new SpringApplicationRunListeners(logger,
				getSpringFactoriesInstances(SpringApplicationRunListener.class, types, this, args));
	}
```

通过代码可以发现又从 **`spring.factories`** 中加载了 **`SpringApplicationRunListener`** 看一下文件中配置了哪些实现类：

```
# Run Listeners
org.springframework.boot.SpringApplicationRunListener=\
org.springframework.boot.context.event.EventPublishingRunListener
```

只有一个 **`EventPublishingRunListener`** 。下面来看一下这个类：

```java
public class EventPublishingRunListener implements SpringApplicationRunListener, Ordered {

	private final SpringApplication application;

	private final String[] args;

	private final SimpleApplicationEventMulticaster initialMulticaster;

	public EventPublishingRunListener(SpringApplication application, String[] args) {
		this.application = application;
		this.args = args;
		this.initialMulticaster = new SimpleApplicationEventMulticaster();
		for (ApplicationListener<?> listener : application.getListeners()) {
			this.initialMulticaster.addApplicationListener(listener);
		}
	}

	@Override
	public int getOrder() {
		return 0;
	}

	@Override
	public void starting() {
		this.initialMulticaster.multicastEvent(new ApplicationStartingEvent(this.application, this.args));
	}
    	@Override
	public void environmentPrepared(ConfigurableEnvironment environment) {
		this.initialMulticaster
				.multicastEvent(new ApplicationEnvironmentPreparedEvent(this.application, this.args, environment));
	}

	@Override
	public void contextPrepared(ConfigurableApplicationContext context) {
		this.initialMulticaster
				.multicastEvent(new ApplicationContextInitializedEvent(this.application, this.args, context));
	}
	
	@Override
	public void contextLoaded(ConfigurableApplicationContext context) {
		for (ApplicationListener<?> listener : this.application.getListeners()) {
			if (listener instanceof ApplicationContextAware) {
				((ApplicationContextAware) listener).setApplicationContext(context);
			}
			context.addApplicationListener(listener);
		}
		this.initialMulticaster.multicastEvent(new ApplicationPreparedEvent(this.application, this.args, context));
	}

	@Override
	public void started(ConfigurableApplicationContext context) {
		context.publishEvent(new ApplicationStartedEvent(this.application, this.args, context));
	}

	@Override
	public void running(ConfigurableApplicationContext context) {
		context.publishEvent(new ApplicationReadyEvent(this.application, this.args, context));
	}

	@Override
	public void failed(ConfigurableApplicationContext context, Throwable exception) {
		ApplicationFailedEvent event = new ApplicationFailedEvent(this.application, this.args, context, exception);
		if (context != null && context.isActive()) {
			// Listeners have been registered to the application context so we should
			// use it at this point if we can
			context.publishEvent(event);
		}
		else {
			// An inactive context may not have a multicaster so we use our multicaster to
			// call all of the context's listeners instead
			if (context instanceof AbstractApplicationContext) {
				for (ApplicationListener<?> listener : ((AbstractApplicationContext) context)
						.getApplicationListeners()) {
					this.initialMulticaster.addApplicationListener(listener);
				}
			}
			this.initialMulticaster.setErrorHandler(new LoggingErrorHandler());
			this.initialMulticaster.multicastEvent(event);
		}
	}

	private static class LoggingErrorHandler implements ErrorHandler {

		private static Log logger = LogFactory.getLog(EventPublishingRunListener.class);

		@Override
		public void handleError(Throwable throwable) {
			logger.warn("Error calling ApplicationEventListener", throwable);
		}

	}

}
```

通过上面代码可以发现主要是发布Spring的事件：

- **ApplicationStartingEvent**
- **ApplicationEnvironmentPreparedEvent**
- **ApplicationContextInitializedEvent**
- **ApplicationPreparedEvent**
- **ApplicationStartedEvent**
- **ApplicationReadyEvent**
- **ApplicationFailedEvent**

这里面主要是七个事件，对应不同的状态。通过发送 **ApplicationEnvironmentPreparedEvent** 。通过加载组装为 **`SpringApplicationRunListeners`** 。根据不同的状态来调用 **SpringApplicationRunListeners** 中不同的方法。

最后来看一下在哪里广播发布 **ApplicationEnvironmentPreparedEvent** 事件：

```java
ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);

	private ConfigurableEnvironment prepareEnvironment(SpringApplicationRunListeners listeners,
			ApplicationArguments applicationArguments) {
		// Create and configure the environment
		ConfigurableEnvironment environment = getOrCreateEnvironment();
		configureEnvironment(environment, applicationArguments.getSourceArgs());
		ConfigurationPropertySources.attach(environment);
		//这里就是发布 ApplicationEnvironmentPreparedEvent
        listeners.environmentPrepared(environment);
		bindToSpringApplication(environment);
		if (!this.isCustomEnvironment) {
			environment = new EnvironmentConverter(getClassLoader()).convertEnvironmentIfNecessary(environment,
					deduceEnvironmentClass());
		}
		ConfigurationPropertySources.attach(environment);
		return environment;
	}
```

通过发布 **listeners.environmentPrepared(environment);** 最后触发 **EnvironmentPostProcessor#postProcessEnvironment** 的方法。

### 自定义步骤

1. **自定义一个类实现EnvironmentPostProcessor接口**

2. **在资源文件 resources/META-INF下面创建一个spring.factories文件**

3. **spring.factories文件中添加如下**

   ```
   org.springframework.boot.env.EnvironmentPostProcessor=\
   #自定义的类(包含包名)
   org.springframework.boot.cloud.CloudFoundryVcapEnvironmentPostProcessor
   ```
官网的说明： [EnvironmentPostProcessor](https://docs.spring.io/spring-boot/docs/2.2.2.RELEASE/reference/html/howto.html#howto-customize-the-environment-or-application-context)
### 总结
**EnvironmentPostProcessor** 的加载和Spring框架的加载是一样的，但是对于方法的调用是通过 Spring的事件发布来触发 **EnvironmentPostProcessor** 接口中的  **postProcessEnvironment** 方法。

