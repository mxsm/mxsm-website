---
title: Spring Web Context
categories:
  - Spring
  - Springframework
  - Spring-web分析
tags:
  - Spring
  - Springframework
  - Spring-web分析
abbrlink: 605e46fe
date: 2018-10-30 06:53:43
---
### 1. Spring Web Contexts

当我们在Web项目中使用Spring的时候我们有几种方式去组织application contexts，接下来我们将分析大部分的提供。

### 2. Root Web Application Context

每一个Spring webapp有一个与他生命周期相关联的application context: root web application context

这个上下文随着应用的启动而启动，随着引用的销毁而销毁，这个由servlet context listener来实现。这个上下文在web Application中总是一个 *WebApplicationContext* 实例。这个接口继承了 *ApplicationContext*  同时能够访问到 *ServletContext* 。

#### 2.1 *ContextLoaderListener*

web应用程序是由一个监听器 *org.springframework.web.context.ContextLoaderListener* 来管理。这个监听器是Spring模块中的一部分， **默认情况下加载XML application context 从/WEB-INF/applicationContext.xml.** 然而这种默认情况是可用改变的。

#### 2.2 使用 web.xml 和 XML Application Context

web.xml

```xml
<listener>
    <listener-class>
        org.springframework.web.context.ContextLoaderListener
    </listener-class>
</listener>
```

我们可以使用contextConfigLocation参数指定XML上下文配置的另一个位置:

```xml
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>/WEB-INF/rootApplicationContext.xml</param-value>
</context-param>
```

多个的情况：

```xml
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>/WEB-INF/context1.xml, /WEB-INF/context2.xml</param-value>
</context-param>
```

或者使用通配符：

```xml
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>/WEB-INF/*-context.xml</param-value>
</context-param>
```

#### 2.3 web.xml 和 Java Application Context

除了默认XmlWebApplicationContext,看如何使用注解：

我们使用 *contextClass* 参数来告诉监听器使用那种类型的context实例：

```xml
<context-param>
    <param-name>contextClass</param-name>
    <param-value>
        org.springframework.web.context.support.AnnotationConfigWebApplicationContext
    </param-value>
</context-param>
```

 由于 *AnnotationConfigWebApplicationContext*  没有默认的配置所以我们必须提供一个：

```xml
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>
        com.baeldung.contexts.config.RootApplicationConfig,
        com.baeldung.contexts.config.NormalWebAppConfig
    </param-value>
</context-param>
```

或者我们告诉Context去扫描一个或者多个package

```xml
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>org.baeldung.bean.config</param-value>
</context-param>
```

#### 2.4 Servlet3.X 可编程配置

Servlet3.X的配置文件web.xml是可选的。此外，用户还可以访问一个API，该API允许以编程方式定义基于servlet的应用程序的每个元素spring-web模块利用这些特性，并在应用程序启动时提供API来注册应用程序的组件。Spring扫描应用程序的类路径寻找 *org.springframework.web.WebApplicationInitializer*  类的实例。通过执行 *void onStartup(ServletContext servletContext) throws ServletException* 方法来调用application启动。

#### 2.5 Servlet 3.x 和 XML Application Context

```java
public class ApplicationInitializer implements WebApplicationInitializer {
     
    @Override
    public void onStartup(ServletContext servletContext) 
      throws ServletException {
        //...
    }
}
```

只需要实现 *WebApplicationInitializer* 接口；

首先我们来创建一个root context,第一行是我们前面遇到的contextClass参数的显式版本，我们使用它来决定使用哪个特定的上下文实现:

```reStructuredText
XmlWebApplicationContext rootContext = new XmlWebApplicationContext();
```

接下来是参数 *contextConfigLocation*  定义加载bean定义：

```
rootContext.setConfigLocations("/WEB-INF/rootApplicationContext.xml");
```

接下来是为ServletContext添加监听器

```
servletContext.addListener(new ContextLoaderListener(rootContext));
```

#### 2.6 Servlet 3.x 和 Java Application Context

使用 *AnnotationConfigWebApplicationContext*  

```java
public class AnnotationsBasedApplicationInitializer 
  extends AbstractContextLoaderInitializer {
  
    @Override
    protected WebApplicationContext createRootApplicationContext() {
        AnnotationConfigWebApplicationContext rootContext
          = new AnnotationConfigWebApplicationContext();
        rootContext.register(RootApplicationConfig.class);
        return rootContext;
    }
}
```

在这里，我们可以看到我们不再需要注册ContextLoaderListener,还要注意register方法的使用，它是特定于AnnotationConfigWebApplicationContext的，而不是更通用的setConfigLocations:通过调用它，我们可以用上下文注册单个@Configuration注释的类，从而避免了包扫描。

### 3. Dispatcher Servlet Contexts

**Spring MVC applications有至少一个Dispatcher Servlet 配置**  这个Servlet处理接受请求，分发给适当的控制器方法然后返回对应的视图。

每一个 **DispatcherServlet** 有关联的application context. 在这样的上下文中定义的bean配置servlet并定义MVC对象，如控制器和视图解析器。

#### 3.1 web.xml 和 XML Application Context

```xml
<servlet>
    <servlet-name>normal-webapp</servlet-name>
    <servlet-class>
        org.springframework.web.servlet.DispatcherServlet
    </servlet-class>
    <load-on-startup>1</load-on-startup>
</servlet>
<servlet-mapping>
    <servlet-name>normal-webapp</servlet-name>
    <url-pattern>/api/*</url-pattern>
</servlet-mapping>
```

如果没有另外指定，servlet的名称将用于确定要加载的XML文件,在例子中我们将使用 *WEB-INF/normal-webapp-servlet.xml*. 配置文件。

我们也可指定配置文件：

```xml
<servlet>
    ...
    <init-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>/WEB-INF/normal/*.xml</param-value>
    </init-param>
</servlet>
```

#### 3.2 web.xml 和 Java Application Context

当我们想要使用另一种类型的上下文时，我们继续使用ContextLoaderListener。也就是说，我们指定了一个contextClass参数和一个合适的contextConfigLocation:

```xml
<servlet>
    <servlet-name>normal-webapp-annotations</servlet-name>
    <servlet-class>
        org.springframework.web.servlet.DispatcherServlet
    </servlet-class>
    <init-param>
        <param-name>contextClass</param-name>
        <param-value>
            org.springframework.web.context.support.AnnotationConfigWebApplicationContext
        </param-value>
    </init-param>
    <init-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>com.baeldung.contexts.config.NormalWebAppConfig</param-value>
    </init-param>
    <load-on-startup>1</load-on-startup>
</servlet>
```

#### 3.3 Servlet 3.x 和 XML Application Context
创建一个WebApplicationInitializer和一个XML的applications context,去实现onStartup方法

```java
XmlWebApplicationContext normalWebAppContext = new XmlWebApplicationContext();
normalWebAppContext.setConfigLocation("/WEB-INF/normal-webapp-servlet.xml");
ServletRegistration.Dynamic normal/= servletContext.addServlet("normal-webapp", new DispatcherServlet(normalWebAppContext));
normal.setLoadOnStartup(1);
normal.addMapping("/api/*");
```

#### 3.4 Servlet 3.x 和 Java Application Context
这一次我们配置一个注解上下文实现WebApplicationInitializer: AbstractDispatcherServletInitializer。

```java
@Override
protected WebApplicationContext createServletApplicationContext() {
  
    AnnotationConfigWebApplicationContext secureWebAppContext = new AnnotationConfigWebApplicationContext();
    secureWebAppContext.register(SecureWebAppConfig.class);
    return secureWebAppContext;
}
 
@Override
protected String[] getServletMappings() {
    return new String[] { "/s/api/*" };
}
```



https://www.baeldung.com/spring-web-contexts

https://www.nonelonely.com/article/1552475062917







