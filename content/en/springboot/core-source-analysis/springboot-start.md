---
title: SpringBoot启动分析
linkTitle: SpringBoot启动分析
date: 2019-12-16 13:51:41
weight: 1
---
### 1. SpringBoot启动源码分析(V2.2.X)

#### 1.1 SpringApplication

SpringBoot启动主要是通过类 **SpringApplication** 的run方法启动的

```java
public ConfigurableApplicationContext run(String... args) {
		StopWatch stopWatch = new StopWatch();
		stopWatch.start();
		ConfigurableApplicationContext context = null;
		Collection<SpringBootExceptionReporter> exceptionReporters = new ArrayList<>();
		configureHeadlessProperty();
		SpringApplicationRunListeners listeners = getRunListeners(args);
		listeners.starting();
		try {
			ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
			ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);
			configureIgnoreBeanInfo(environment);
			Banner printedBanner = printBanner(environment);
            //创建ApplicationContext
			context = createApplicationContext();
			exceptionReporters = getSpringFactoriesInstances(SpringBootExceptionReporter.class,
					new Class[] { ConfigurableApplicationContext.class }, context);
            //刷新上下文的前期准备工作
			prepareContext(context, environment, listeners, applicationArguments, printedBanner);
			refreshContext(context);
			afterRefresh(context, applicationArguments);
			stopWatch.stop();
			if (this.logStartupInfo) {
				new StartupInfoLogger(this.mainApplicationClass).logStarted(getApplicationLog(), stopWatch);
			}
            //启动监听器
			listeners.started(context);
            //调用ApplicationRunner和CommandLineRunner	
			callRunners(context, applicationArguments);
		}
		catch (Throwable ex) {
			handleRunFailure(context, ex, exceptionReporters, listeners);
			throw new IllegalStateException(ex);
		}

		try {
			listeners.running(context);
		}
		catch (Throwable ex) {
			handleRunFailure(context, ex, exceptionReporters, null);
			throw new IllegalStateException(ex);
		}
		return context;
	}
```

通过上面的代码可以看出来主要的步骤有三个：

- **创建上下文--createApplicationContext方法**

  通过推断来判断是创建怎么样的ApplicationContext

- **刷新上下文的准备工作--prepareContext方法**

  处理添加一些ApplicationContext的相关参数，和SpringBoot的启动配置类

- **刷新上下文--refreshContext**

  Spring的上下文刷新

下面来具体分析一下这三个方法。

#### 1.2 createApplicationContext分析

```java
	protected ConfigurableApplicationContext createApplicationContext() {
		Class<?> contextClass = this.applicationContextClass;
		if (contextClass == null) {
			try {
				switch (this.webApplicationType) {
				case SERVLET:
					contextClass = Class.forName(DEFAULT_SERVLET_WEB_CONTEXT_CLASS);
					break;
				case REACTIVE:
					contextClass = Class.forName(DEFAULT_REACTIVE_WEB_CONTEXT_CLASS);
					break;
				default:
					contextClass = Class.forName(DEFAULT_CONTEXT_CLASS);
				}
			}
			catch (ClassNotFoundException ex) {
				throw new IllegalStateException(
						"Unable create a default ApplicationContext, please specify an ApplicationContextClass", ex);
			}
		}
		return (ConfigurableApplicationContext) BeanUtils.instantiateClass(contextClass);
	}
```

从上面可以看出是通过判断webApplicationType这个变量来加载哪个ApplicationContext。

```java
this.webApplicationType = WebApplicationType.deduceFromClasspath();
```

通过这个来进行推断。

#### 1.3 prepareContext分析

```java
	private void prepareContext(ConfigurableApplicationContext context, ConfigurableEnvironment environment,
			SpringApplicationRunListeners listeners, ApplicationArguments applicationArguments, Banner printedBanner) {
        
        //给Application设置environment
		context.setEnvironment(environment);
        //设置BeanName生成器和资源加载器
		postProcessApplicationContext(context);
        //初始化context
		applyInitializers(context);
		listeners.contextPrepared(context);
		if (this.logStartupInfo) {
			logStartupInfo(context.getParent() == null);
			logStartupProfileInfo(context);
		}
		// Add boot specific singleton beans
		ConfigurableListableBeanFactory beanFactory = context.getBeanFactory();
		beanFactory.registerSingleton("springApplicationArguments", applicationArguments);
		if (printedBanner != null) {
			beanFactory.registerSingleton("springBootBanner", printedBanner);
		}
		if (beanFactory instanceof DefaultListableBeanFactory) {
			((DefaultListableBeanFactory) beanFactory)
					.setAllowBeanDefinitionOverriding(this.allowBeanDefinitionOverriding);
		}
		if (this.lazyInitialization) {
			context.addBeanFactoryPostProcessor(new LazyInitializationBeanFactoryPostProcessor());
		}
		//加载所有的资源--这个方法很关键
		Set<Object> sources = getAllSources();
		Assert.notEmpty(sources, "Sources must not be empty");
        //加载bean到context
		load(context, sources.toArray(new Object[0]));
		listeners.contextLoaded(context);
	}
```

上面代码最重要的两个方法： **getAllSources** 和 **load** 这两个方法揭示了如何SpringBoot进行启动的重要的两个方法。

首先看一下 **getAllSources** 方法：

```java
	public Set<Object> getAllSources() {
		Set<Object> allSources = new LinkedHashSet<>();
		if (!CollectionUtils.isEmpty(this.primarySources)) {
			allSources.addAll(this.primarySources);
		}
		if (!CollectionUtils.isEmpty(this.sources)) {
			allSources.addAll(this.sources);
		}
		return Collections.unmodifiableSet(allSources);
	}
```

对于变量 **`this.primarySources`** 是在 **`SpringApplication.run`** 方法设置进去的。

再来看一下 **`load`** 方法：

```java
	protected void load(ApplicationContext context, Object[] sources) {
        //创建Bean定义加载器--添加资源配置类
		BeanDefinitionLoader loader = createBeanDefinitionLoader(getBeanDefinitionRegistry(context), sources);
		if (this.beanNameGenerator != null) {
			loader.setBeanNameGenerator(this.beanNameGenerator);
		}
		if (this.resourceLoader != null) {
			loader.setResourceLoader(this.resourceLoader);
		}
		if (this.environment != null) {
			loader.setEnvironment(this.environment);
		}
		loader.load();
	}
```

这里就通过类定义加载器就能把定义的类加载到 **`ApplicationContext`** 中。所以不是 **`SpringApplication.run`** 中的类，不一定是带有 **`main`** 方法的类。

#### 1.4 refreshContext分析

这个就是spring freamwork 的上下文刷新。

### 2. SpringBoot的启动例子

```java
package com.github.mxsm.config;

import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * @author mxsm
 * @Date 2019/11/24 11:52 description:
 */
@SpringBootApplication
public class SpringBootStrap {

}

```

启动类：

```java
package com.github.mxsm;

import com.github.mxsm.config.SpringBootStrap;
import org.springframework.boot.SpringApplication;

public class Application {

    public static void main(String[] args) {
        SpringApplication.run(SpringBootStrap.class,args);
    }
}

```

这样也可以启动SpringBoot