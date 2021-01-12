---
title: Spring XML解析源码分析
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之关键代码
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之关键代码
abbrlink: '15697909'
date: 2019-06-28 03:33:43
---
### 1. Spring XML解析

在Spring的配置中XML是一个很重要的配置方案，下面来分析一下Spring是如何把定义在XML中的数据类加载到Spring容器中的。

### 2. AbstractApplicationContext#obtainFreshBeanFactory

在**AbstractApplicationContext** 抽象类中通过 **`obtainFreshBeanFactory`** 的方法来加载XML中的定义的Bean。下面来看一下方法**`obtainFreshBeanFactory`** 的代码：

```java
	protected ConfigurableListableBeanFactory obtainFreshBeanFactory() {
		refreshBeanFactory();
		return getBeanFactory();
	}
```

通过上面的代码可以看到，方法中只有两个方法：

- **refreshBeanFactory**

  刷新BeanFactory,加载XML

- **getBeanFactory**

  返回BeanFactory的引用

在**AbstractApplicationContext** 中**refreshBeanFactory** 是一个抽象的方法，实现主要是有子类实现，对于XML而言，**`AbstractRefreshableApplicationContext`**  实现了该方法：

```java
protected final void refreshBeanFactory() throws BeansException {
    	//如果存在BeanFactory首先对之前的进行处理
		if (hasBeanFactory()) {
			destroyBeans();
			closeBeanFactory();
		}
		try {
            //创建BeanFactory
			DefaultListableBeanFactory beanFactory = createBeanFactory();
            //设置序列化ID
			beanFactory.setSerializationId(getId());
            //设置是否允许循环引用 和 bean的定义覆盖
			customizeBeanFactory(beanFactory);
            // 加载bean的定义到Spring容器
			loadBeanDefinitions(beanFactory);
			synchronized (this.beanFactoryMonitor) {
				this.beanFactory = beanFactory;
			}
		}
		catch (IOException ex) {
			throw new ApplicationContextException("I/O error parsing bean definition source for " + getDisplayName(), ex);
		}
	}
```

通过上面的代码分析可以看到Spring容器加载XML中的定义通过 **`loadBeanDefinitions`** 方法，在**AbstractRefreshableApplicationContext** 中是一个抽象的方法。实现在子类中，对于XML的加载Bean的定义实现在 **`AbstractXmlApplicationContext`**  类中：

```java
	protected void loadBeanDefinitions(DefaultListableBeanFactory beanFactory) throws BeansException, IOException {
		// 为BeanFactory创建一个 XmlBeanDefinitionReader.
		XmlBeanDefinitionReader beanDefinitionReader = new XmlBeanDefinitionReader(beanFactory);

		//beanDefinitionReader设置参数
		beanDefinitionReader.setEnvironment(this.getEnvironment());
		beanDefinitionReader.setResourceLoader(this);
		beanDefinitionReader.setEntityResolver(new ResourceEntityResolver(this));

		//初始化XML BeanDefinitionReader
		initBeanDefinitionReader(beanDefinitionReader);
        //加载Bean定义
		loadBeanDefinitions(beanDefinitionReader);
	}
```

XML的文件的读取是通过**XmlBeanDefinitionReader** 来进行读取数据。在**AbstractXmlApplicationContext** 类中有一个**`loadBeanDefinitions(XmlBeanDefinitionReader reader)`**  方法来进行加载XML文件中Bean的定义。

```java
	protected void loadBeanDefinitions(XmlBeanDefinitionReader reader) throws BeansException, IOException {
        //获取配置的Resource进行加载
		Resource[] configResources = getConfigResources();
		if (configResources != null) {
			reader.loadBeanDefinitions(configResources);
		}
        //获取配置的地址进行加载--（用ClassPathXmlApplicationContext创建填入application.xml的就是通过这个地方加载）
		String[] configLocations = getConfigLocations();
		if (configLocations != null) {
			reader.loadBeanDefinitions(configLocations);
		}
	}
```

所以接下来主要加载都是通过**`XmlBeanDefinitionReader#loadBeanDefinitions`**  方法来加载XML中的Bean的定义。

```java
	@Override
	public int loadBeanDefinitions(String... locations) throws BeanDefinitionStoreException {
		Assert.notNull(locations, "Location array must not be null");
		int count = 0;
		for (String location : locations) {
			count += loadBeanDefinitions(location);
		}
		return count;
	}
```

**`XmlBeanDefinitionReader#loadBeanDefinitions`** 调用了父类的方法 **`AbstractBeanDefinitionReader#loadBeanDefinitions`** 

```java
	@Override
	public int loadBeanDefinitions(String location) throws BeanDefinitionStoreException {
		return loadBeanDefinitions(location, null);
	}

	public int loadBeanDefinitions(String location, @Nullable Set<Resource> actualResources) throws BeanDefinitionStoreException {
		ResourceLoader resourceLoader = getResourceLoader();
		if (resourceLoader == null) {
			throw new BeanDefinitionStoreException(
					"Cannot load bean definitions from location [" + location + "]: no ResourceLoader available");
		}

		if (resourceLoader instanceof ResourcePatternResolver) {
			// Resource pattern matching available.
			try {
				Resource[] resources = ((ResourcePatternResolver) resourceLoader).getResources(location);
				int count = loadBeanDefinitions(resources);
				if (actualResources != null) {
					Collections.addAll(actualResources, resources);
				}
				if (logger.isTraceEnabled()) {
					logger.trace("Loaded " + count + " bean definitions from location pattern [" + location + "]");
				}
				return count;
			}
			catch (IOException ex) {
				throw new BeanDefinitionStoreException(
						"Could not resolve bean definition resource pattern [" + location + "]", ex);
			}
		}
		else {
			// Can only load single resources by absolute URL.
			Resource resource = resourceLoader.getResource(location);
			int count = loadBeanDefinitions(resource);
			if (actualResources != null) {
				actualResources.add(resource);
			}
			if (logger.isTraceEnabled()) {
				logger.trace("Loaded " + count + " bean definitions from location [" + location + "]");
			}
			return count;
		}
	}
```
在 **`loadBeanDefinitions`** 实现在XML中是通过 **`XmlBeanDefinitionReader`** 中实现

```java
	public int loadBeanDefinitions(EncodedResource encodedResource) throws BeanDefinitionStoreException {
		Assert.notNull(encodedResource, "EncodedResource must not be null");
		if (logger.isTraceEnabled()) {
			logger.trace("Loading XML bean definitions from " + encodedResource);
		}

		Set<EncodedResource> currentResources = this.resourcesCurrentlyBeingLoaded.get();
		if (currentResources == null) {
			currentResources = new HashSet<>(4);
			this.resourcesCurrentlyBeingLoaded.set(currentResources);
		}
		if (!currentResources.add(encodedResource)) {
			throw new BeanDefinitionStoreException(
					"Detected cyclic loading of " + encodedResource + " - check your import definitions!");
		}
		try {
			InputStream inputStream = encodedResource.getResource().getInputStream();
			try {
				InputSource inputSource = new InputSource(inputStream);
				if (encodedResource.getEncoding() != null) {
					inputSource.setEncoding(encodedResource.getEncoding());
				}
                //加载xml中的Bean定义
				return doLoadBeanDefinitions(inputSource, encodedResource.getResource());
			}
			finally {
				inputStream.close();
			}
		}
		catch (IOException ex) {
			throw new BeanDefinitionStoreException(
					"IOException parsing XML document from " + encodedResource.getResource(), ex);
		}
		finally {
			currentResources.remove(encodedResource);
			if (currentResources.isEmpty()) {
				this.resourcesCurrentlyBeingLoaded.remove();
			}
		}
	}

```

通过上面的代码可以看出来 **`doLoadBeanDefinitions`** 主要通过这个方法加载XML中的Bean定义

```java
protected int doLoadBeanDefinitions(InputSource inputSource, Resource resource)
			throws BeanDefinitionStoreException {

			//读取 xml document
			Document doc = doLoadDocument(inputSource, resource);
    		//往Spring容器中注册 Bean定义
			int count = registerBeanDefinitions(doc, resource);
			if (logger.isDebugEnabled()) {
				logger.debug("Loaded " + count + " bean definitions from " + resource);
			}
			return count;
    		// 省略了try catch模块

	}
```

**`XmlBeanDefinitionReader#registerBeanDefinitions(doc, resource)`** 方法就是加载类的定义

```java
	public int registerBeanDefinitions(Document doc, Resource resource) throws BeanDefinitionStoreException {
		BeanDefinitionDocumentReader documentReader = createBeanDefinitionDocumentReader();
		int countBefore = getRegistry().getBeanDefinitionCount();
        //注册Bean
		documentReader.registerBeanDefinitions(doc, createReaderContext(resource));
		return getRegistry().getBeanDefinitionCount() - countBefore;
	}

```

**`BeanDefinitionDocumentReader#registerBeanDefinitions`** 进行注册，而 **`registerBeanDefinitions`** 方法的实现在 **DefaultBeanDefinitionDocumentReader** 类

```java
	public void registerBeanDefinitions(Document doc, XmlReaderContext readerContext) {
		this.readerContext = readerContext;
		doRegisterBeanDefinitions(doc.getDocumentElement());
	}

	protected void doRegisterBeanDefinitions(Element root) {

		BeanDefinitionParserDelegate parent = this.delegate;
		this.delegate = createDelegate(getReaderContext(), root, parent);

		if (this.delegate.isDefaultNamespace(root)) {
			String profileSpec = root.getAttribute(PROFILE_ATTRIBUTE);
			if (StringUtils.hasText(profileSpec)) {
				String[] specifiedProfiles = StringUtils.tokenizeToStringArray(
						profileSpec, BeanDefinitionParserDelegate.MULTI_VALUE_ATTRIBUTE_DELIMITERS);
				// We cannot use Profiles.of(...) since profile expressions are not supported
				// in XML config. See SPR-12458 for details.
				if (!getReaderContext().getEnvironment().acceptsProfiles(specifiedProfiles)) {
					if (logger.isDebugEnabled()) {
						logger.debug("Skipped XML bean definition file due to specified profiles [" + profileSpec +
								"] not matching: " + getReaderContext().getResource());
					}
					return;
				}
			}
		}

		preProcessXml(root);
        //解析Bean的定义
		parseBeanDefinitions(root, this.delegate);
		postProcessXml(root);

		this.delegate = parent;
	}
```

分析一下 **parseBeanDefinitions(root, this.delegate)** 方法中是如何进行数据解析：

```java
	protected void parseBeanDefinitions(Element root, BeanDefinitionParserDelegate delegate) {
        //判断是否为默认的命名空间 http://www.springframework.org/schema/beans
		if (delegate.isDefaultNamespace(root)) {
			NodeList nl = root.getChildNodes();
			for (int i = 0; i < nl.getLength(); i++) {
				Node node = nl.item(i);
				if (node instanceof Element) {
					Element ele = (Element) node;
                    //判断是否是自定义的命名空间
					if (delegate.isDefaultNamespace(ele)) {
                        //解析默认的命名空间
						parseDefaultElement(ele, delegate);
					}
					else {
                        //解析自定义的命名空间
						delegate.parseCustomElement(ele);
					}
				}
			}
		}
		else {
			delegate.parseCustomElement(root);
		}
	}

	private void parseDefaultElement(Element ele, BeanDefinitionParserDelegate delegate) {
        //解析import
		if (delegate.nodeNameEquals(ele, IMPORT_ELEMENT)) {
			importBeanDefinitionResource(ele);
		}
        //解析alias
		else if (delegate.nodeNameEquals(ele, ALIAS_ELEMENT)) {
			processAliasRegistration(ele);
		}
        //解析bean
		else if (delegate.nodeNameEquals(ele, BEAN_ELEMENT)) {
			processBeanDefinition(ele, delegate);
		}
        //解析beans
		else if (delegate.nodeNameEquals(ele, NESTED_BEANS_ELEMENT)) {
			// recurse
			doRegisterBeanDefinitions(ele);
		}
	}
```

分析一下如何处理自定义的XML通过 **BeanDefinitionParserDelegate#parseCustomElement** 方法

```java
	public BeanDefinition parseCustomElement(Element ele) {
		return parseCustomElement(ele, null);
	}

	@Nullable
	public BeanDefinition parseCustomElement(Element ele, @Nullable BeanDefinition containingBd) {
        //获取命名空间的URI
		String namespaceUri = getNamespaceURI(ele);
		if (namespaceUri == null) {
			return null;
		}
        //获取处理命名空间的NamespaceHandler--
		NamespaceHandler handler = this.readerContext.getNamespaceHandlerResolver().resolve(namespaceUri);
		if (handler == null) {
			error("Unable to locate Spring NamespaceHandler for XML schema namespace [" + namespaceUri + "]", ele);
			return null;
		}
		return handler.parse(ele, new ParserContext(this.readerContext, this, containingBd));
	}

```


