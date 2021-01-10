---
title: BeanDefinition详解
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之核心类
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之核心类
abbrlink: b7e0d088
date: 2019-11-11 15:18:35
---
### 1. BeanDefinition的继承图

![图解](https://github.com/mxsm/document/blob/master/image/Spring/Springframework/BeanDefinition.png?raw=true)

BeanDefinition其实就是对Bean的一种抽象： 
Spring中的Bean抽象--------BeanDefinition 
Bean的属性操作抽象--------AttributeAccessor(属性存取器)对属性进行操作 
Bean的元数据项抽象--------BeanMetadataElement（Bean的元数据）

### 2. AttributeAccessor属性存取器的源码解析

```java
public interface AttributeAccessor {

	//设置属性
	void setAttribute(String name, @Nullable Object value);

	//获取属性
	@Nullable
	Object getAttribute(String name);

	//删除属性
	@Nullable
	Object removeAttribute(String name);

	//判断属性name是否存在
	boolean hasAttribute(String name);

    //获取属性列表
	String[] attributeNames();

}
```
AttributeAccessor实现的抽象方法是AttributeAccessorSupport，这里面对接口所有的方法都进行了实现。

### 3. BeanMetadataElement源码解析

```java
public interface BeanMetadataElement {

	//元数据元素的配置的源bean对象
	@Nullable
	default Object getSource() {
		return null;
	}

}
```
BeanMetadataAttribute实现了BeanMetadataElement接口。

### 4. BeanMetadataElement和AttributeAccessor关联
通过 BeanMetadataAttributeAccessor 类整合对Bean的操作AttributeAccessor以及BeanMetadataElement

### 5.BeanDifinition源码分析

**`BeanDifinition`** 其实就是一个接口，描述一个bean的实例，包括属性值，构造方法参数值和继承自它的类的更多信息以及一些依赖信息，懒加载等等。BeanDefinition仅仅是一个最简单的接口，主要功能是允许BeanFactoryPostProcessor 例如PropertyPlaceHolderConfigure 能够检索并修改属性值和别的bean的元数据。下面来分析一下源码

```java
public interface BeanDefinition extends AttributeAccessor, BeanMetadataElement {

	/**
	 * 标准单例作用域的作用域标识符：“singleton”。
	 * 对于扩展的bean工厂可能支持更多的作用域。
	 * 注意：在Spring中默认的创建的对象就是单例模式
	 */
	String SCOPE_SINGLETON = ConfigurableBeanFactory.SCOPE_SINGLETON;

	/**
	 * 标准原型作用域的范围标识符：“prototype”。
	 * 对于扩展的bean工厂可能支持更多的作用域。
	 */
	String SCOPE_PROTOTYPE = ConfigurableBeanFactory.SCOPE_PROTOTYPE;


	/**
	 * 表示BeanDefinition是应用程序主要部分的角色提示。 通常对应于用户定义的bean。
	 */
	int ROLE_APPLICATION = 0;

	/**
	 * 表示BeanDefinition是某些大型配置的支持部分的角色提示，通常是一个外部ComponentDefinition
	 * 当查看某个特定的ComponentDefinition时，认为bean非常重要，以便在查看应用程序的整体配置时能够意识到这一点。
	 * 注意：实际上就是说，我这个Bean是用户的，是从配置文件中过来的
	 */
	int ROLE_SUPPORT = 1;

	/**
	 * 角色提示表明一个BeanDefinition是提供一个完全背后的角色，并且与最终用户没有关系。
	 * 这个提示用于注册完全是ComponentDefinition内部工作的一部分的bean
	 * 注意：这Bean是Spring内部的和使用的用户没有关系
	 */
	int ROLE_INFRASTRUCTURE = 2;


	// Modifiable attributes

	//如果父类存在，设置这个bean定义的父定义的名称
	void setParentName(@Nullable String parentName);

	@Nullable
	String getParentName();

	//指定此bean定义的bean类名称。
	//类名称可以在bean factory后期处理中修改，通常用它的解析变体替换原来的类名称。
	void setBeanClassName(@Nullable String beanClassName);

	//返回此bean定义的当前bean类名称。
	//需要注意的是，这不一定是在运行时使用的实际类名，以防子类定义覆盖/继承其父类的类名。
	//此外，这可能只是调用工厂方法的类，或者它 在调用方法的工厂bean引用的情况下甚至可能是空的。
	//因此，不要认为这是在运行时定义的bean类型，而只是将其用于在单独的bean定义级别进行解析。
	@Nullable
	String getBeanClassName();

	//设置和获取scope
	void setScope(@Nullable String scope);

	@Nullable
	String getScope();

	//设置是否需要懒加载 ---- 默认是非懒加载在Spring的默认实现过程
	void setLazyInit(boolean lazyInit);

	boolean isLazyInit();

	/**
	 *
	 * 设置当前beand依赖,需要被初始化这些依赖bean,beanFacotryb保证首先初始化这些依赖的bean
	 */
	void setDependsOn(@Nullable String... dependsOn);

	/**
	 *获取依赖bean的名称
	 */
	@Nullable
	String[] getDependsOn();

	//设置这个bean是否是获得自动装配到其他bean的候选人。
	//需要注意是，此标志旨在仅影响基于类型的自动装配。---默认是按照类型进行装配
	//它不会影响按名称的显式引用，即使指定的bean没有标记为autowire候选，也可以解决这个问题。
	//因此，如果名称匹配，通过名称的自动装配将注入一个bean。
	void setAutowireCandidate(boolean autowireCandidate);

	/**
	 * 返回这个bean是否是自动装配到其他bean的候选者。就是是否在其他类中使用autowired来注入当前Bean的
	 */
	boolean isAutowireCandidate();

	//是否为主候选bean    使用注解：@Primary
	void setPrimary(boolean primary);

	//返回这个bean是否是主要的autowire候选者。
	boolean isPrimary();

	//指定要使用的工厂bean（如果有的话）。 这是调用指定的工厂方法的bean的名称
	void setFactoryBeanName(@Nullable String factoryBeanName);

	//返回工厂bean的名字，如果有的话。
	@Nullable
	String getFactoryBeanName();

	//如果有的话，指定工厂方法。
	//这个方法先将通过构造函数参数被调用，或者如果参数，将调用该方法的无参数构造。
	//方法将在指定的工厂bean（如果有的话）上被调用，或者作为本地bean类的静态方法被调用
	void setFactoryMethodName(@Nullable String factoryMethodName);

	/**
	 * 返回工厂方法如果有的话
	 */
	@Nullable
	String getFactoryMethodName();

	//返回此bean的构造函数参数值。
	ConstructorArgumentValues getConstructorArgumentValues();

	//判断是否有构造函数参数--5.1版本开始
	default boolean hasConstructorArgumentValues() {
		return !getConstructorArgumentValues().isEmpty();
	}

	//获取普通属性集合
	MutablePropertyValues getPropertyValues();

	/**
	 * 判断是否有PropertyValues
	 * @since 5.0.2
	 */
	default boolean hasPropertyValues() {
		return !getPropertyValues().isEmpty();
	}

	//设置和获取初始化方法的名称--从5.1版本开始
	void setInitMethodName(@Nullable String initMethodName);

	@Nullable
	String getInitMethodName();


	//设置和获取Destroy方法的名称  -- 从5.1版本开始
	void setDestroyMethodName(@Nullable String destroyMethodName);

	@Nullable
	String getDestroyMethodName();


	//设置和获取角色
	void setRole(int role);

	int getRole();


	//设置和获取人可以读的描述--人可以理解的描述 从5.1版本开始
	void setDescription(@Nullable String description);

	@Nullable
	String getDescription();


	//判断是否为单例
	boolean isSingleton();

	//判断是否为原型
	boolean isPrototype();

	//判断是否为抽象Bean，如果是就不能实例化
	boolean isAbstract();

	//返回BeanDefinition的资源描述
	@Nullable
	String getResourceDescription();

	//返回原始的BeanDefinition如果没有返回null
	@Nullable
	BeanDefinition getOriginatingBeanDefinition();

}
```

