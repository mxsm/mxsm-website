---
title: DispatcherServlet源码解析
categories:
  - Spring
  - Springframework
  - Spring-web分析
tags:
  - Spring
  - Springframework
  - Spring-web分析
abbrlink: d8d3733
date: 2018-08-09 16:19:07
---
### 1. DispatcherServlet是什么？
从本质上是说DispatcherServlet就是一个Servlet规范的实现。也就是一个Servlet！
### 2. DispatcherServlet在Spring中的继承关系

```java
public class DispatcherServlet extends FrameworkServlet {
    //省略代码
}

public abstract class FrameworkServlet extends HttpServletBean implements ApplicationContextAware {
    //省略代码
}

public abstract class HttpServletBean extends HttpServlet implements EnvironmentCapable, EnvironmentAware {
    //省略代码    
}

```
从上面的关系可以看出来 *HttpServletBean* 继承了Servlet API的 *HttpServlet* ，然后 *FrameworkServlet* 继承了
*HttpServletBean*， 最后 *DispatcherServlet* 继承了 *FrameworkServlet* 。
### 3. 源码分析
由于DispatcherServlet是一个Servlet那么就从Servlet的方法入手。Servlet完成实例化以后首先调用的就是init方法。在GenericServlet类中init()方法实现为空，在HttpServletBean重写

```java
@Override
	public final void init() throws ServletException {

		// Set bean properties from init parameters.
		PropertyValues pvs = new ServletConfigPropertyValues(getServletConfig(), this.requiredProperties);
		if (!pvs.isEmpty()) {
			try {
				BeanWrapper bw = PropertyAccessorFactory.forBeanPropertyAccess(this);
				ResourceLoader resourceLoader = new ServletContextResourceLoader(getServletContext());
				bw.registerCustomEditor(Resource.class, new ResourceEditor(resourceLoader, getEnvironment()));
				initBeanWrapper(bw);
				bw.setPropertyValues(pvs, true);
			}
			catch (BeansException ex) {
				if (logger.isErrorEnabled()) {
					logger.error("Failed to set bean properties on servlet '" + getServletName() + "'", ex);
				}
				throw ex;
			}
		}

		// 该方法在HttpServletBean类中实现为空--主要由子类进行实现
		initServletBean();
	}
```
下面看一下initServletBean方法在FrameworkServlet中的实现：

```java
@Override
	protected final void initServletBean() throws ServletException {
		
		//省略日志打印

		try {
		    //初始化webApplicationContext
			this.webApplicationContext = initWebApplicationContext();
			//初始化initFrameworkServlet-- 默认实现为空
			initFrameworkServlet();
		}
		catch (ServletException | RuntimeException ex) {
			logger.error("Context initialization failed", ex);
			throw ex;
		}

		//省略日志打印
	}
```
从上面可以看出来主要是初始化webApplicationContext，通过调用initWebApplicationContext()方法。

```java
protected WebApplicationContext initWebApplicationContext() {
        //获取ServletContext中的属性值为WebApplicationContext.ROOT_WEB_APPLICATION_CONTEXT_ATTRIBUTE对象的值
		//如果有ContextLoaderListner的情况设置的
		WebApplicationContext rootContext =
				WebApplicationContextUtils.getWebApplicationContext(getServletContext());
		WebApplicationContext wac = null;
		if (this.webApplicationContext != null) {
			// A context instance was injected at construction time -> use it
			wac = this.webApplicationContext;
			if (wac instanceof ConfigurableWebApplicationContext) {
				ConfigurableWebApplicationContext cwac = (ConfigurableWebApplicationContext) wac;
				if (!cwac.isActive()) {
				
					if (cwac.getParent() == null) {
						cwac.setParent(rootContext);
					}
					//刷新WebApplicationContext
					configureAndRefreshWebApplicationContext(cwac);
				}
			}
		}
		if (wac == null) {
		    //根据contextAttribute属性查找WebApplicationContext
			wac = findWebApplicationContext();
		}
		if (wac == null) {
			// 如果上面都没有创建一个
			wac = createWebApplicationContext(rootContext);
		}

		if (!this.refreshEventReceived) {
		
			synchronized (this.onRefreshMonitor) {
			   //触发onRefresh方法去做一些其他的事情
				onRefresh(wac);
			}
		}

		if (this.publishContext) {
			// Publish the context as a servlet context attribute.
			String attrName = getServletContextAttributeName();
			getServletContext().setAttribute(attrName, wac);
		}

		return wac;
	}
```
分析一下createWebApplicationContext(rootContext)方法，configureAndRefreshWebApplicationContext(cwac);在分析一下createWebApplicationContext中也有调用：

```java
protected WebApplicationContext createWebApplicationContext(@Nullable ApplicationContext parent) {
		//获取contextClass,如果没有设置contextClass默认是XmlWebApplicationContext
		Class<?> contextClass = getContextClass();
		if (!ConfigurableWebApplicationContext.class.isAssignableFrom(contextClass)) {
			//不是继承关系抛错
		}
		
		//实例化数据
		ConfigurableWebApplicationContext wac =
				(ConfigurableWebApplicationContext) BeanUtils.instantiateClass(contextClass);

		wac.setEnvironment(getEnvironment());
		wac.setParent(parent);
		//contextConfigLocation设置配置文件或者扫描包的路径,根据不同的Context来匹配
		String configLocation = getContextConfigLocation();
		if (configLocation != null) {
			wac.setConfigLocation(configLocation);
		}
		
		//配置刷新--调用了Spring core 的refresh方法
		configureAndRefreshWebApplicationContext(wac);

		return wac;
	}
```
创建完成Spring application context后开始FrameworkServlet#refresh方法这个方法是一个抽象的方法在子类中实现，也就是在DispatcherServlet中实现：

```java
	@Override
	protected void onRefresh(ApplicationContext context) {
		initStrategies(context);
	}
	//初始化一些请求过程中的策略
	protected void initStrategies(ApplicationContext context) {
		initMultipartResolver(context);
		initLocaleResolver(context);
		initThemeResolver(context);
		initHandlerMappings(context);
		initHandlerAdapters(context);
		initHandlerExceptionResolvers(context);
		initRequestToViewNameTranslator(context);
		initViewResolvers(context);
		initFlashMapManager(context);
	}
```
对于方法initStrategies主要做了这9件事情。

- initMultipartResolver

  初始化MultipartResolver，用于处理文件上传服务，如果有文件上传，那么就会将当前的HttpServletRequest包装成DefaultMultipartHttpServletRequest，并且将每个上传的内容封装成CommonsMultipartFile对象。需要在dispatcherServlet-servlet.xml中配置文件上传解析器。

- initLocaleResolver

  用于处理应用的国际化问题，本地化解析策略。

- initThemeResolver

  用于定义一个主题

- initHandlerMapping

  用于定义请求映射关系

- initHandlerAdapters

  用于根据Handler的类型定义不同的处理规则

- initHandlerExceptionResolvers

  当Handler处理出错后，会通过此将错误日志记录在log文件中，默认实现类是SimpleMappingExceptionResolver

- initRequestToViewNameTranslators

  将指定的ViewName按照定义的RequestToViewNameTranslators替换成想要的格式

- initViewResolvers

  用于将View解析成页面

- initFlashMapManager

  用于生成FlashMap管理器

### 4. service方法的分析
*service* 方法主要是处理在HTTP请求，在 *FrameworkServlet* 中重写了 *HttpServlet* 方法中的 *service* 方法。

```java
    @Override
	protected void service(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {

		HttpMethod httpMethod = HttpMethod.resolve(request.getMethod());
		//PATCH方法或者为null的处理
		if (httpMethod == HttpMethod.PATCH || httpMethod == null) {
			processRequest(request, response);
		}
		else {
		    //调用HttpServlet的方法--处理其他的HTTP方法
			super.service(request, response);
		}
	}
```
*doGet、doPost、doPut、doDelete、doOptions、doTrace* 方法中共同调用了 *processRequest* 方法。

```java
	protected final void processRequest(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {

		long startTime = System.currentTimeMillis();
		Throwable failureCause = null;

		LocaleContext previousLocaleContext = LocaleContextHolder.getLocaleContext();
		//获取Locale
		LocaleContext localeContext = buildLocaleContext(request);

		RequestAttributes previousAttributes = RequestContextHolder.getRequestAttributes();
		//获取Servlet请求属性
		ServletRequestAttributes requestAttributes = buildRequestAttributes(request, response, previousAttributes);
        
        //异步管理
		WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
		asyncManager.registerCallableInterceptor(FrameworkServlet.class.getName(), new RequestBindingInterceptor());

		initContextHolders(request, localeContext, requestAttributes);

		try {
		    //调用子类的doService
			doService(request, response);
		}
		catch (ServletException | IOException ex) {
			failureCause = ex;
			throw ex;
		}
		catch (Throwable ex) {
			failureCause = ex;
			throw new NestedServletException("Request processing failed", ex);
		}

		finally {
		    //释放Context
			resetContextHolders(request, previousLocaleContext, previousAttributes);
			if (requestAttributes != null) {
				requestAttributes.requestCompleted();
			}
			logResult(request, response, failureCause, asyncManager);
			publishRequestHandledEvent(request, response, startTime, failureCause);
		}
	}

```
通过调用DispatcherServlet#doService方法来处理外部发来服务器的HTTP请求，

```java
@Override
	protected void doService(HttpServletRequest request, HttpServletResponse response) throws Exception {
		logRequest(request);

		// Keep a snapshot of the request attributes in case of an include,
		// to be able to restore the original attributes after the include.
		Map<String, Object> attributesSnapshot = null;
		if (WebUtils.isIncludeRequest(request)) {
			attributesSnapshot = new HashMap<>();
			Enumeration<?> attrNames = request.getAttributeNames();
			while (attrNames.hasMoreElements()) {
				String attrName = (String) attrNames.nextElement();
				if (this.cleanupAfterInclude || attrName.startsWith(DEFAULT_STRATEGIES_PREFIX)) {
					attributesSnapshot.put(attrName, request.getAttribute(attrName));
				}
			}
		}

		// 让框架能够处理和查看WebApplicationContext中的对象
		request.setAttribute(WEB_APPLICATION_CONTEXT_ATTRIBUTE, getWebApplicationContext());
		request.setAttribute(LOCALE_RESOLVER_ATTRIBUTE, this.localeResolver);
		request.setAttribute(THEME_RESOLVER_ATTRIBUTE, this.themeResolver);
		request.setAttribute(THEME_SOURCE_ATTRIBUTE, getThemeSource());

		if (this.flashMapManager != null) {
			FlashMap inputFlashMap = this.flashMapManager.retrieveAndUpdate(request, response);
			if (inputFlashMap != null) {
				request.setAttribute(INPUT_FLASH_MAP_ATTRIBUTE, Collections.unmodifiableMap(inputFlashMap));
			}
			request.setAttribute(OUTPUT_FLASH_MAP_ATTRIBUTE, new FlashMap());
			request.setAttribute(FLASH_MAP_MANAGER_ATTRIBUTE, this.flashMapManager);
		}

		try {
		    //最重要的方法：分发请求处理
			doDispatch(request, response);
		}
		finally {
			if (!WebAsyncUtils.getAsyncManager(request).isConcurrentHandlingStarted()) {
				// Restore the original attribute snapshot, in case of an include.
				if (attributesSnapshot != null) {
					restoreAttributesAfterInclude(request, attributesSnapshot);
				}
			}
		}
	}
```
doDispatch方法用来分发请求：

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpServletRequest processedRequest = request;
		HandlerExecutionChain mappedHandler = null;
		boolean multipartRequestParsed = false;

		WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);

		try {
			ModelAndView mv = null;
			Exception dispatchException = null;

			try {
			    //检查是否为文件上传请求
				processedRequest = checkMultipart(request);
				multipartRequestParsed = (processedRequest != request);

				// 获取当前请求的处理器.
				mappedHandler = getHandler(processedRequest);
				if (mappedHandler == null) {
					noHandlerFound(processedRequest, response);
					return;
				}

				// 获取当前请求的处理适配器
				HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());

				// Process last-modified header, if supported by the handler.
				String method = request.getMethod();
				boolean isGet = "GET".equals(method);
				if (isGet || "HEAD".equals(method)) {
					long lastModified = ha.getLastModified(request, mappedHandler.getHandler());
					if (new ServletWebRequest(request, response).checkNotModified(lastModified) && isGet) {
						return;
					}
				}
				if (!mappedHandler.applyPreHandle(processedRequest, response)) {
					return;
				}
				//实际执行的处理器
				mv = ha.handle(processedRequest, response, mappedHandler.getHandler());

				if (asyncManager.isConcurrentHandlingStarted()) {
					return;
				}
                //应用默认的视图名称
				applyDefaultViewName(processedRequest, mv);
				mappedHandler.applyPostHandle(processedRequest, response, mv);
			}
			catch (Exception ex) {
				dispatchException = ex;
			}
			catch (Throwable err) {
				// As of 4.3, we're processing Errors thrown from handler methods as well,
				// making them available for @ExceptionHandler methods and other scenarios.
				dispatchException = new NestedServletException("Handler dispatch failed", err);
			}
			processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);
		}
		catch (Exception ex) {
			triggerAfterCompletion(processedRequest, response, mappedHandler, ex);
		}
		catch (Throwable err) {
			triggerAfterCompletion(processedRequest, response, mappedHandler,
					new NestedServletException("Handler processing failed", err));
		}
		finally {
			if (asyncManager.isConcurrentHandlingStarted()) {
				// Instead of postHandle and afterCompletion
				if (mappedHandler != null) {
					mappedHandler.applyAfterConcurrentHandlingStarted(processedRequest, response);
				}
			}
			else {
				// Clean up any resources used by a multipart request.
				if (multipartRequestParsed) {
					cleanupMultipart(processedRequest);
				}
			}
		}
	}
```
*getHandler* 获取处理器执行器处理链，然后 *getHandlerAdapter* 获取处理器适配器。 *applyPreHandle* 执行。从上面的有两个几个重要的方法：

```java
//获取执行链
mappedHandler = getHandler(processedRequest);

//获取执行适配器
HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());

//调用链执行--前置HandlerInterceptor
mappedHandler.applyPreHandle(processedRequest, response)

//实际处理
mv = ha.handle(processedRequest, response, mappedHandler.getHandler());

//调用链执行--后置HandlerInterceptor
mappedHandler.applyPostHandle(processedRequest, response, mv);
```

接下来一个个来分析上面的方法：

***`mappedHandler = getHandler(processedRequest)`***  方法的分析，看一下源代码：

```java
	protected HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception {
		if (this.handlerMappings != null) {
            //从handlerMappings获取HandlerMapping的实现
			for (HandlerMapping mapping : this.handlerMappings) {
                //从HandlerMapping实现中获取处理执行调用链
				HandlerExecutionChain handler = mapping.getHandler(request);
				if (handler != null) {
					return handler;
				}
			}
		}
		return null;
	}
```

> HandlerMapping默认实现加载有三个：
>
> 1. RequestMappingHandlerMapping
> 2. BeanNameUrlHandlerMapping
> 3. SimpleUrlHandlerMapping

默认加载的 ***`RequestMappingHandlerMapping`*** ，看一下如何获取 **`HandlerExecutionChain`** 调用链。 调用的方法 **`AbstractHandlerMapping#getHandler`**

```java
	public final HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception {
        //获取内部处理器
		Object handler = getHandlerInternal(request);
		if (handler == null) {
            //如果为空获取默认处理器
			handler = getDefaultHandler();
		}
		if (handler == null) {
			return null;
		}
		// Bean name or resolved handler?
		if (handler instanceof String) {
			String handlerName = (String) handler;
			handler = obtainApplicationContext().getBean(handlerName);
		}

		HandlerExecutionChain executionChain = getHandlerExecutionChain(handler, request);

		//省了日志打印

        //跨域的配置
		if (CorsUtils.isCorsRequest(request)) {
			CorsConfiguration globalConfig = this.corsConfigurationSource.getCorsConfiguration(request);
			CorsConfiguration handlerConfig = getCorsConfiguration(handler, request);
			CorsConfiguration config = (globalConfig != null ? globalConfig.combine(handlerConfig) : handlerConfig);
			executionChain = getCorsHandlerExecutionChain(request, executionChain, config);
		}

		return executionChain;
	}
```

然后就是获取 **`HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler())`** 适配器。

```java
protected HandlerAdapter getHandlerAdapter(Object handler) throws ServletException {
		if (this.handlerAdapters != null) {
			//获取处理适配器
            for (HandlerAdapter adapter : this.handlerAdapters) {
				if (adapter.supports(handler)) {
					return adapter;
				}
			}
		}
		throw new ServletException("No adapter for handler [" + handler +
				"]: The DispatcherServlet configuration needs to include a HandlerAdapter that supports this handler");
	}
```

适配器默认加载的 **`RequestMappingHandlerAdapter`** 适配器。 **`mappedHandler.applyPreHandle(processedRequest, response)`**  处理 **`HandlerInterceptor`** 的 ***`preHandle`*** 方法。然后 **`mv = ha.handle(processedRequest, response, mappedHandler.getHandler())`** 调用 **`HandlerAdapter`** 的 **`handle`** 方法。 **`mappedHandler.applyPostHandle(processedRequest, response, mv);`** 接下来执行 **`HandlerInterceptor`**  的 ***`postHandle`***。