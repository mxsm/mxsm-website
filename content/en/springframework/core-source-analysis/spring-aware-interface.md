---
title: Spring中的Aware接口
categories:
  - Spring
  - Springframework
  - Spring-core分析
tags:
  - Spring
  - Springframework
  - Spring-core分析
abbrlink: e71659e8
date: 2018-08-25 13:48:54
---
#### 1. ApplicationContextAware

```java
public interface ApplicationContextAware {

    void setApplicationContext(ApplicationContext applicationContext) throws BeansException;
}
```

#### 2. BeanNameAware

```java
public interface BeanNameAware {

    void setBeanName(String name) throws BeansException;
}
```

#### 3. ApplicationEventPublisherAware

```java
public interface ApplicationEventPublisherAware extends Aware {

	void setApplicationEventPublisher(ApplicationEventPublisher applicationEventPublisher);

}
```

#### 4. BeanClassLoaderAware

```java
public interface BeanClassLoaderAware extends Aware {

	void setBeanClassLoader(ClassLoader classLoader);

}
```
#### 5. BeanFactoryAware

```java
public interface BeanFactoryAware extends Aware {

	void setBeanFactory(BeanFactory beanFactory) throws BeansException;

}
```
#### 6. BootstrapContextAware

```java
public interface BootstrapContextAware extends Aware {

	void setBootstrapContext(BootstrapContext bootstrapContext);

}
```
#### 7. LoadTimeWeaverAware

```java
public interface LoadTimeWeaverAware extends Aware {

	void setLoadTimeWeaver(LoadTimeWeaver loadTimeWeaver);

}
```
#### 8. MessageSourceAware

```java
public interface MessageSourceAware extends Aware {

	void setMessageSource(MessageSource messageSource);

}
```
#### 9. NotificationPublisherAware

```java
public interface NotificationPublisherAware extends Aware {

	void setNotificationPublisher(NotificationPublisher notificationPublisher);

}
```
#### 10. ResourceLoaderAware

```java
public interface ResourceLoaderAware extends Aware {

	void setResourceLoader(ResourceLoader resourceLoader);

}
```
#### 11. ServletConfigAware

```java
public interface ServletConfigAware extends Aware {

	void setServletConfig(ServletConfig servletConfig);

}
```
#### 12. ServletContextAware

```java
public interface ServletContextAware extends Aware {

	void setServletContext(ServletContext servletContext);

}
```