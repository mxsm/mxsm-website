---
title: "SpringBoot中内嵌Tomcat的实现原理解析"
linkTitle: "SpringBoot中内嵌Tomcat的实现原理解析"
date: 2021-01-18
weight: 2
---

### 什么是自动装配
在SpringBoot源码中有一个spring-boot-autoconfigure模块,在这个模块中做了很多默认的配置。也就是我们俗称的“自动装配”。  
在SpringBoot的自动装配会根据添加的依赖，自动加载依赖相关的配置属性并启动依赖，自动装配的底层原理： **spring的条件注解@Conditional来实现** 。
### 为什么要自动装配
利用自动装配模式代替XML配置模式，比如使用SpringMVC时，需要配置组件扫描、调度器、试图解析器等，现在有了自动装配，这些都可以不用配置了，SpringBoot默认已经帮我们配置好了。利用内嵌的Tomcat通过自动装配就不需要配置外置的Tomcat，减少配置的麻烦。**说白了自动装配就是减少了配置。**
### SpringBoot Tomcat自动装配详解

我们会从下面四个方面去分析Tomcat的自动装配。

- **SpringBoot项目配置**
- **SpringBoot项目启动**
- **SpringBoot Tomcat如何装配**
- **SpringBoot Tomcat如何启动**

#### SpringBoot项目配置

在[SpringBoot官网](https://docs.spring.io/spring-boot/docs/2.2.3.RELEASE/reference/html/getting-started.html#getting-started)的pom.xml文件配置：

```xml


<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>myproject</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <!-- Inherit defaults from Spring Boot -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.3.RELEASE</version>
    </parent>

    <!-- Override inherited settings -->
    <description/>
    <developers>
        <developer/>
    </developers>
    <licenses>
        <license/>
    </licenses>
    <scm>
        <url/>
    </scm>
    <url/>

    <!-- Add typical dependencies for a web application -->
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>

    <!-- Package as an executable jar -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

其实上面的主要有用的就两个配置：

```xml
   <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.3.RELEASE</version>
    </parent>
```

这个配置就是设置SpringBoot的版本，还有就是另外一个配置：

```xml
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
```

这个就是最重要的。这个依赖实现了自动装配，我们接着往下看这个依赖的源码。

在SpringBoot项目的有一个 **spring-boot-starters** 模块，通过源码可以看到这个模块里面都是pom.xml的pom文件，那么我们来看一下 **spring-boot-starter-web** 模块的pom文件。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starters</artifactId>
		<version>${revision}</version>
	</parent>
	<artifactId>spring-boot-starter-web</artifactId>
	<name>Spring Boot Web Starter</name>
	<description>Starter for building web, including RESTful, applications using Spring
		MVC. Uses Tomcat as the default embedded container</description>
	<properties>
		<main.basedir>${basedir}/../../..</main.basedir>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-json</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-tomcat</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-validation</artifactId>
			<exclusions>
				<exclusion>
					<groupId>org.apache.tomcat.embed</groupId>
					<artifactId>tomcat-embed-el</artifactId>
				</exclusion>
			</exclusions>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-web</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-webmvc</artifactId>
		</dependency>
	</dependencies>
</project>

```

通过上面可以看出来导入了 **spring-web** 、 **spring-webmvc** 。同时还导入了 **spring-boot-starter-tomcat** 、 **spring-boot-starter** 依赖。 

> 从这里可以看出来SpringBoot默认的启动容器是tomcat

看一下 **spring-boot-starte**r 的pom文件

```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starters</artifactId>
		<version>${revision}</version>
	</parent>
	<artifactId>spring-boot-starter</artifactId>
	<name>Spring Boot Starter</name>
	<description>Core starter, including auto-configuration support, logging and YAML</description>
	<properties>
		<main.basedir>${basedir}/../../..</main.basedir>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-autoconfigure</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-logging</artifactId>
		</dependency>
		<dependency>
			<groupId>jakarta.annotation</groupId>
			<artifactId>jakarta.annotation-api</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-core</artifactId>
		</dependency>
		<dependency>
			<groupId>org.yaml</groupId>
			<artifactId>snakeyaml</artifactId>
			<scope>runtime</scope>
		</dependency>
	</dependencies>
</project>
```

通过上面可以看出来导入一个重要的模块 **spring-boot-autoconfigure** 这个模块里面包含了所有的代码。

> 通过 **spring-boot-autoconfigure** 模块可以看出来，所有的SpringBoot starter的代码都在这个模块，对于不是web项目的SpringBoot项目，只需要引入：
>
> ```xml
> <dependency>
> <groupId>org.springframework.boot</groupId>
> <artifactId>spring-boot-starter</artifactId>
> </dependency>
> ```

看一下 **spring-boot-starter-tomcat**  的pom文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starters</artifactId>
		<version>${revision}</version>
	</parent>
	<artifactId>spring-boot-starter-tomcat</artifactId>
	<name>Spring Boot Tomcat Starter</name>
	<description>Starter for using Tomcat as the embedded servlet container. Default
		servlet container starter used by spring-boot-starter-web</description>
	<properties>
		<main.basedir>${basedir}/../../..</main.basedir>
	</properties>
	<dependencies>
		<dependency>
			<groupId>jakarta.annotation</groupId>
			<artifactId>jakarta.annotation-api</artifactId>
		</dependency>
		<dependency>
			<groupId>org.apache.tomcat.embed</groupId>
			<artifactId>tomcat-embed-core</artifactId>
			<exclusions>
				<exclusion>
					<groupId>org.apache.tomcat</groupId>
					<artifactId>tomcat-annotations-api</artifactId>
				</exclusion>
			</exclusions>
		</dependency>
		<dependency>
			<groupId>org.apache.tomcat.embed</groupId>
			<artifactId>tomcat-embed-el</artifactId>
		</dependency>
		<dependency>
			<groupId>org.apache.tomcat.embed</groupId>
			<artifactId>tomcat-embed-websocket</artifactId>
		</dependency>
	</dependencies>
</project>
```

而这个里面的导入的是内嵌的Tomcat。这里就分析完成了在SpringBoot的配置pom文件配置导入了一些什么东西。

#### SpringBoot项目启动

看一下我们一般SpringBoot项目启动的代码写法：

```java
@SpringBootApplication
public class RaftApplication{
    public static void main(String[] args) {
        SpringApplication.run(RaftApplication.class, args);
    }
}
```

通过 **main** 方法来启动，之前有一篇 《[SpringBoot启动分析](https://blog.ljbmxsm.com/pages/f2f8b808/)》的文章。讲解了SpringBoot是如何启动的，在另外一篇文章中 《[SpringBoot源码解析之autoconfigure](https://blog.ljbmxsm.com/pages/beb882ec/)》讲解了自动装配的底层原理。而在之前的项目配置引入依赖引入了 **<artifactId>spring-boot-autoconfigure</artifactId>** 这个模块。通过查看该模块的 **spring.factories** 的数据有一个自动配置的有这样一个配置：

```
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
org.springframework.boot.autoconfigure.web.servlet.ServletWebServerFactoryAutoConfiguration
```

这个类揭示了Tomcat如何自动装配。

#### SpringBoot Tomcat如何装配

研究一下 **`ServletWebServerFactoryAutoConfiguration`** 类的源码。探索Tomcat如何自动装配

> 注意：自动装配的底层原理根据的是Spring框架的@Conditional注解

```java
@Configuration(proxyBeanMethods = false)
@AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnClass(ServletRequest.class)
@ConditionalOnWebApplication(type = Type.SERVLET)
@EnableConfigurationProperties(ServerProperties.class)
@Import({ ServletWebServerFactoryAutoConfiguration.BeanPostProcessorsRegistrar.class,
		ServletWebServerFactoryConfiguration.EmbeddedTomcat.class,
		ServletWebServerFactoryConfiguration.EmbeddedJetty.class,
		ServletWebServerFactoryConfiguration.EmbeddedUndertow.class })
public class ServletWebServerFactoryAutoConfiguration {
	//省略代码

}
```

**@ConditionalOnClass(ServletRequest.class)** 注解判断classpath中是否有 **ServletRequest** 类。

**@ConditionalOnWebApplication(type = Type.SERVLET)** 判断是否为servlet。

**@EnableConfigurationProperties(ServerProperties.class)** 加载 **ServerProperties** 配置。

```java
@Import({ ServletWebServerFactoryAutoConfiguration.BeanPostProcessorsRegistrar.class,
		ServletWebServerFactoryConfiguration.EmbeddedTomcat.class,
		ServletWebServerFactoryConfiguration.EmbeddedJetty.class,
		ServletWebServerFactoryConfiguration.EmbeddedUndertow.class })
```

这一段导入了 **BeanPostProcessorsRegistrar** 和 三个web运行容器：

- **Tomcat**

  [Tomcat官网](http://tomcat.apache.org/)

- **Jetty**

  [Jetty官网](https://www.eclipse.org/jetty/)

- **Undertow**

  [Undertow官网](http://undertow.io/)

在 **ServletWebServerFactoryAutoConfiguration** 有三个方法一个静态内部类。

```java
@Bean
public ServletWebServerFactoryCustomizer servletWebServerFactoryCustomizer(ServerProperties serverProperties) {
	return new ServletWebServerFactoryCustomizer(serverProperties);
}
```

**servletWebServerFactoryCustomizer** 方法创建一个ServletWebServerFactoryCustomizer(定制器)。

```java
@Bean
@ConditionalOnClass(name = "org.apache.catalina.startup.Tomcat")
public TomcatServletWebServerFactoryCustomizer tomcatServletWebServerFactoryCustomizer(
			ServerProperties serverProperties) {
	return new TomcatServletWebServerFactoryCustomizer(serverProperties);
}
```

**tomcatServletWebServerFactoryCustomizer** 方法根据 **ConditionalOnClass** 存在 Tomcat那么创建 **TomcatServletWebServerFactoryCustomizer** 定制器。

```java
@Bean
	@ConditionalOnMissingFilterBean(ForwardedHeaderFilter.class)
	@ConditionalOnProperty(value = "server.forward-headers-strategy", havingValue = "framework")
	public FilterRegistrationBean<ForwardedHeaderFilter> forwardedHeaderFilter() {
		ForwardedHeaderFilter filter = new ForwardedHeaderFilter();
		FilterRegistrationBean<ForwardedHeaderFilter> registration = new FilterRegistrationBean<>(filter);
		registration.setDispatcherTypes(DispatcherType.REQUEST, DispatcherType.ASYNC, DispatcherType.ERROR);
		registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
		return registration;
	}
```
**forwardedHeaderFilter** 创建的处理转发头的过滤器。  
在 **ServletWebServerFactoryAutoConfiguration** 类中还有一个静态内部类：

```java
public static class BeanPostProcessorsRegistrar implements ImportBeanDefinitionRegistrar, BeanFactoryAware {

		private ConfigurableListableBeanFactory beanFactory;

		@Override
		public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
			if (beanFactory instanceof ConfigurableListableBeanFactory) {
				this.beanFactory = (ConfigurableListableBeanFactory) beanFactory;
			}
		}

		@Override
		public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata,
				BeanDefinitionRegistry registry) {
			if (this.beanFactory == null) {
				return;
			}
			registerSyntheticBeanIfMissing(registry, "webServerFactoryCustomizerBeanPostProcessor",
					WebServerFactoryCustomizerBeanPostProcessor.class);
			registerSyntheticBeanIfMissing(registry, "errorPageRegistrarBeanPostProcessor",
					ErrorPageRegistrarBeanPostProcessor.class);
		}

		private void registerSyntheticBeanIfMissing(BeanDefinitionRegistry registry, String name, Class<?> beanClass) {
			if (ObjectUtils.isEmpty(this.beanFactory.getBeanNamesForType(beanClass, true, false))) {
				RootBeanDefinition beanDefinition = new RootBeanDefinition(beanClass);
				beanDefinition.setSynthetic(true);
				registry.registerBeanDefinition(name, beanDefinition);
			}
		}

	}
```
在这个静态内部类中往SpringApplication的Context中注入两个Bean的处理器：
- **WebServerFactoryCustomizerBeanPostProcessor**  
  WebServerFactoryCustomizer bean的处理
- **ErrorPageRegistrarBeanPostProcessor**  
  ErrorPageRegistrar bean处理器

在 **ServletWebServerFactoryAutoConfiguration** 类上面有一个@Import注解导入了四个类：

```
ServletWebServerFactoryAutoConfiguration.BeanPostProcessorsRegistrar.class
ServletWebServerFactoryConfiguration.EmbeddedTomcat.class
ServletWebServerFactoryConfiguration.EmbeddedJetty.class
ServletWebServerFactoryConfiguration.EmbeddedUndertow.class
```
第一个就是ServletWebServerFactoryAutoConfiguration中的静态类，然后我们研究一下 **EmbeddedTomcat** 中的静态内部类：

```java
@Configuration(proxyBeanMethods = false)
class ServletWebServerFactoryConfiguration {

    @Configuration(proxyBeanMethods = false)
    //存在有Tomcat的类--这个是Apache Tomcat的启动类(内嵌Tomcat)
	@ConditionalOnClass({ Servlet.class, Tomcat.class, UpgradeProtocol.class })
	@ConditionalOnMissingBean(value = ServletWebServerFactory.class, search = SearchStrategy.CURRENT)
	public static class EmbeddedTomcat {

		@Bean
		public TomcatServletWebServerFactory tomcatServletWebServerFactory(
				ObjectProvider<TomcatConnectorCustomizer> connectorCustomizers,
				ObjectProvider<TomcatContextCustomizer> contextCustomizers,
				ObjectProvider<TomcatProtocolHandlerCustomizer<?>> protocolHandlerCustomizers) {
			TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
			factory.getTomcatConnectorCustomizers()
					.addAll(connectorCustomizers.orderedStream().collect(Collectors.toList()));
			factory.getTomcatContextCustomizers()
					.addAll(contextCustomizers.orderedStream().collect(Collectors.toList()));
			factory.getTomcatProtocolHandlerCustomizers()
					.addAll(protocolHandlerCustomizers.orderedStream().collect(Collectors.toList()));
			return factory;
		}

	}
    
    //省略其他的代码两个静态内部类
}
```
在这个静态内部类中做了一件事情，那就是创建 **TomcatServletWebServerFactory** 类。在这个类中有一个 **getWebServer** 方法，这个方法在接口 **ServletWebServerFactory#getWebServer** 中。那么看一下这个类的实现：

```
	@Override
	public WebServer getWebServer(ServletContextInitializer... initializers) {
		if (this.disableMBeanRegistry) {
			Registry.disableRegistry();
		}
		Tomcat tomcat = new Tomcat();
		File baseDir = (this.baseDirectory != null) ? this.baseDirectory : createTempDir("tomcat");
		tomcat.setBaseDir(baseDir.getAbsolutePath());
		Connector connector = new Connector(this.protocol);
		connector.setThrowOnFailure(true);
		tomcat.getService().addConnector(connector);
		customizeConnector(connector);
		tomcat.setConnector(connector);
		tomcat.getHost().setAutoDeploy(false);
		configureEngine(tomcat.getEngine());
		for (Connector additionalConnector : this.additionalTomcatConnectors) {
			tomcat.getService().addConnector(additionalConnector);
		}
		prepareContext(tomcat.getHost(), initializers);
		return getTomcatWebServer(tomcat);
	}
```
可以看出来这个方法主要是创建内嵌的Tomcat。
> TomcatServletWebServerFactory#getWebServer中就创建了内嵌的Tomcat。以前的Tomcat都是配置在外面，SpringBoot主要是通过内嵌的Web容器取消了开发过程中配置。

#### SpringBoot Tomcat如何启动
分析了如何创建内嵌的Tomcat，那么对于SpringBoot是如何启动Tomcat的。对于Tomcat的启动分为两个方面分析：
1. **TomcatServletWebServerFactory#getWebServer什么时候调用？**
2. **Tomcat什么时候启动**  

##### Tomcat容器创建
```flow
st=>start: 开始
spRun=>operation: SpringApplication#run
spCreateApplicationContext=>operation: SpringApplication#createApplicationContext
spRefreshContextcondition=>operation: SpringApplication#refreshContext
e=>end: 结束

st->spRun->spCreateApplicationContext->spRefreshContextcondition->e

```
上面是SpringApplication的主要几个方法。在方法**refreshContext**中主要是刷新上下文:

```java
	protected void refresh(ApplicationContext applicationContext) {
		Assert.isInstanceOf(AbstractApplicationContext.class, applicationContext);
		((AbstractApplicationContext) applicationContext).refresh();
	}
```
通过代码发现主要是通过调用 **AbstractApplicationContext#refresh** 方法。这个方法很熟悉，SpringApplication中创建的ApplicationContext主要创建的是 **AnnotationConfigServletWebServerApplicationContext** 。而这个类继承了 **ServletWebServerApplicationContext** 类，当前类重载了 **onRefresh** 方法。那么看一下 **ServletWebServerApplicationContext#onRefresh** 方法代码:

```java
	@Override
	protected void onRefresh() {
		super.onRefresh();
		try {
		   //创建WebServer(对于Tomcat的容器创建的是TomcatWebServer)
			createWebServer();
		}
		catch (Throwable ex) {
			throw new ApplicationContextException("Unable to start web server", ex);
		}
	}
```
通过调用 **onRefresh** 方法创建了TomcatWebServer。
在 **AbstractApplicationContext#refresh** 这个方法中最后调用了一个 **finishRefresh** 方法。在 **AbstractApplicationContext#refresh** 方法中的代码：

```java
	protected void finishRefresh：
	() {
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
在ServletWebServerApplicationContext重写了方法finishRefresh：

```java
@Override
	protected void finishRefresh() {
	    //调用了父类的完成刷新方法
		super.finishRefresh();
		//启动webServer
		WebServer webServer = startWebServer();
		if (webServer != null) {
		    //发布ServletWebServerInitializedEvent事件
			publishEvent(new ServletWebServerInitializedEvent(webServer, this));
		}
	}
```
所以这里就启动了Web容器。
> 通过这里发现创建WebServer是在onRefresh方法中创建了,而启动WebServer是在 finishRefresh中启动。启动过程中还推送了ServletWebServerInitializedEvent事件。

**通过源码发现TomcatServletWebServerFactory#getWebServer是在ServletWebServerApplicationContext#onRefresh方法中调用了createWebServer方法来触发的。**

##### Tomcat什么时候启动
说到这个Tomcat启动事件，很多人都比较困惑。通过代码分析可以发现在如果把SpringBoot当做一个简单的Spring的应用，从初始化到完成Spring环境的完成。Tomcat是在SpringApplication完成后启动的，然后发布ServletWebServerInitializedEvent事件。