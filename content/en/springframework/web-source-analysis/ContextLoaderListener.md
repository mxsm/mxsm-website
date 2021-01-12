---
title: ContextLoaderListener 源码分析
categories:
  - Spring
  - Springframework
  - Spring-web分析
tags:
  - Spring
  - Springframework
  - Spring-web分析
abbrlink: 4ad074b6
date: 2018-09-18 04:12:16
---
### 1. ContextLoaderListener类

```java
public class ContextLoaderListener extends ContextLoader implements ServletContextListener {
    //....... 省略代码
    @Override
	public void contextInitialized(ServletContextEvent event) {
		initWebApplicationContext(event.getServletContext());
	}
}
```
继承了 *ContextLoader* (Spring的类)，实现了 ***ServletContextListener*** 接口(Servlet3.1的监听接口)。  
通过调用 *contextInitialized* 方法来初始化Spring上下文

```java

public WebApplicationContext initWebApplicationContext(ServletContext servletContext) {
		if (servletContext.getAttribute(WebApplicationContext.ROOT_WEB_APPLICATION_CONTEXT_ATTRIBUTE) != null) {
		  //抛异常
		}
		servletContext.log("Initializing Spring root WebApplicationContext");
		Log logger = LogFactory.getLog(ContextLoader.class);
		if (logger.isInfoEnabled()) {
			logger.info("Root WebApplicationContext: initialization started");
		}
		long startTime = System.currentTimeMillis();
		try {
			//判断上下文是否为空
			if (this.context == null) {
			   //创建Spring上下文
				this.context = createWebApplicationContext(servletContext);
			}
			if (this.context instanceof ConfigurableWebApplicationContext) {
				ConfigurableWebApplicationContext cwac = (ConfigurableWebApplicationContext) this.context;
				if (!cwac.isActive()) {
					// The context has not yet been refreshed -> provide services such as
					// setting the parent context, setting the application context id, etc
					if (cwac.getParent() == null) {
						// The context instance was injected without an explicit parent ->
						// determine parent for root web application context, if any.
						ApplicationContext parent = loadParentContext(servletContext);
						cwac.setParent(parent);
					}
					configureAndRefreshWebApplicationContext(cwac, servletContext);
				}
			}
			//把上下文设置到servlet上下文中
			servletContext.setAttribute(WebApplicationContext.ROOT_WEB_APPLICATION_CONTEXT_ATTRIBUTE, this.context);

			ClassLoader ccl = Thread.currentThread().getContextClassLoader();
			if (ccl == ContextLoader.class.getClassLoader()) {
				currentContext = this.context;
			}
			else if (ccl != null) {
				currentContextPerThread.put(ccl, this.context);
			}

			if (logger.isInfoEnabled()) {
				long elapsedTime = System.currentTimeMillis() - startTime;
				logger.info("Root WebApplicationContext initialized in " + elapsedTime + " ms");
			}

			return this.context;
		}
		catch (RuntimeException | Error ex) {
			logger.error("Context initialization failed", ex);
			servletContext.setAttribute(WebApplicationContext.ROOT_WEB_APPLICATION_CONTEXT_ATTRIBUTE, ex);
			throw ex;
		}
	}
```
通过createWebApplicationContext(servletContext)方法来创建WebApplicationContext：

```java
protected WebApplicationContext createWebApplicationContext(ServletContext sc) {
        //加载对应的类
		Class<?> contextClass = determineContextClass(sc);
		if (!ConfigurableWebApplicationContext.class.isAssignableFrom(contextClass)) {
		    //抛异常
		}
		//实例化对象
		return (ConfigurableWebApplicationContext) BeanUtils.instantiateClass(contextClass);
	}

protected Class<?> determineContextClass(ServletContext servletContext) {
        //获取 servletContext 中的 contextClass 参数值
		String contextClassName = servletContext.getInitParameter(CONTEXT_CLASS_PARAM);
		//如果没有设置contextClass值
		if (contextClassName != null) {
			try {
				return ClassUtils.forName(contextClassName, ClassUtils.getDefaultClassLoader());
			}
			catch (ClassNotFoundException ex) {
				//没有找到抛异常
			}
		}
		else {
		    //默认加载的是XmlWebApplicationContext--配置在ContextLoader.properties文件中
			contextClassName = defaultStrategies.getProperty(WebApplicationContext.class.getName());
			try {
				return ClassUtils.forName(contextClassName, ContextLoader.class.getClassLoader());
			}
			catch (ClassNotFoundException ex) {
			  	//没有找到抛异常
			}
		}
	}
```
通过上面的分析看出以及结合之前的 [Spring Web Contexts](https://github.com/mxsm/document/blob/master/Spring/Springframework/Spring-web%E5%88%86%E6%9E%90/Spring%20Web%20Context.md) 的文章讲的如何配置不同的Spirng Context。