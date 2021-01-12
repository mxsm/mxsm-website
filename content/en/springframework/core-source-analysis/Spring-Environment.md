---
title: Spring Environment源码解析
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之组件
  - Environment
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之组件
abbrlink: '78940654'
date: 2019-01-23 18:30:48
---
### Environment关系图

![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/Environment.png?raw=true)

从上图可以看出来 **`Environment`** 主要有三个实现类：

- **MockEnvironment** 

  用于mock的

- **StandardEnvironment** 

  标准的环境

- **StandardServletEnvironment** 

  用于web的环境

### 分析一下常用的StandardEnvironment

```java
public interface Environment extends PropertyResolver {

	//获取配置文件
	String[] getActiveProfiles();

    //获取默认的配置文件
	String[] getDefaultProfiles();
	
    //是否接受配置文件
	boolean acceptsProfiles(Profiles profiles);

}

//看一下接口 PropertyResolver
//PropertyResolver 主要是获取对应的Properties值，String或者进行数据类型转换后的值
//同时会处理占位符的数据
public interface PropertyResolver  {

	
	boolean containsProperty(String key);


	@Nullable
	String getProperty(String key);

	String getProperty(String key, String defaultValue);


	@Nullable
	<T> T getProperty(String key, Class<T> targetType);


	<T> T getProperty(String key, Class<T> targetType, T defaultValue);


	String getRequiredProperty(String key) throws IllegalStateException;


	<T> T getRequiredProperty(String key, Class<T> targetType) throws IllegalStateException;


	String resolvePlaceholders(String text);


	String resolveRequiredPlaceholders(String text) throws IllegalArgumentException;

}
```

![图](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/PropertyResolver.png?raw=true)

看一下StandardEnvironment的代码

```java
public class StandardEnvironment extends AbstractEnvironment {

	//系统的property名称
	public static final String SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME = "systemEnvironment";

	//JVM的property名称
	public static final String SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME = "systemProperties";


	//把系统的Properties和JVM的Properties存入
    //此方法在父类的构造函数中进行调用
	@Override
	protected void customizePropertySources(MutablePropertySources propertySources) {
		propertySources.addLast(new MapPropertySource(SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME, getSystemProperties()));
		propertySources.addLast(new SystemEnvironmentPropertySource(SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, getSystemEnvironment()));
	}

}
```

