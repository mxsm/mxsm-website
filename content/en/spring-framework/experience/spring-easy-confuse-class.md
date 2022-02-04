---
title: "Spring中那些容易混淆的类开发中该如何选择?"
linkTitle: "Spring中那些容易混淆的类开发中该如何选择?"
date: 2022-02-03
weight: 202202032202
---

Spring在使用过程中会发现有很多那些名字相近的拓展接口。这些接口有的实现的功能区别很大有的区别较小。下面就来总结下一下Spring中那些容易混淆的类，同时说一下作用以及拓展应用。

> Spring版本：5.3.x

### 1.  BeanFactoryPostProcessor与BeanPostProcessor

BeanFactoryPostProcessor与BeanPostProcessor因为名字很相近稍微不注意就会认为是一样的。其实这个两个是两个完全不一样的接口

![BeanFactoryPostProcessor与BeanPostProcessor](https://raw.githubusercontent.com/mxsm/picture/main/spring/experience/BeanFactoryPostProcessor%E4%B8%8EBeanPostProcessor.png)

#### 1.1 BeanFactoryPostProcessor

**作用：** BeanFactory的后置处理器，允许自定义修改应用上下文的Bean的定义。同时可以调整上下文的底层bean工厂的bean属性值。

**执行时间：** Spring 上下文刷新的时候执行

**自定义拓展：** 可以用来自定义修饰类的注解,比如自定义一个@Component

#### 1.2 BeanPostProcessor

**作用：** Bean的后置处理器，允许自定义修改新bean实例——例如，检查标记接口或用代理包装bean。(动态代理)

**执行时间：** 从Spring 容器中获取Bean的时候

**自定义拓展：** 可以用来自定义修饰类熟悉的注解像@Value

### 2. ImportBeanDefinitionRegistrar和ImportSelector

ImportBeanDefinitionRegistrar和ImportSelector主要搭配注解@Import使用，在一些自定义拓展的过程中可能会发现有的人使用的是ImportBeanDefinitionRegistrar实现类，有的使用的是ImportSelector使用类。所以在使用的时候就很疑惑到底使用哪个？

#### 2.1 ImportBeanDefinitionRegistrar

看一下接口源码：

```java
public interface ImportBeanDefinitionRegistrar {
	default void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry,
			BeanNameGenerator importBeanNameGenerator) {

		registerBeanDefinitions(importingClassMetadata, registry);
	}
	default void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
	}

}
```

**ImportBeanDefinitionRegistrar#registerBeanDefinitions** 方法参数有一个**BeanDefinitionRegistry** ，说明在**ImportBeanDefinitionRegistrar** 实现可以直接往Spring容器中注册Bean的定义。同时也可以获取到 @Import修饰的注解。

#### 2.2 ImportSelector

ImportSelector只能选择性的往导入需要的类名称，如果导入的类是ImportBeanDefinitionRegistrar或者ImportSelector会进行进一步处理，如果导入的是普通的类会将类包装为 **`ConfigurationClass`** 存放在ConfigurationClassParser类的configurationClasses属性中。在处理ConfigurationClassParser#parse结束后会将ConfigurationClassParser类的configurationClasses属性中没有加载的配置类定义加载到Spring容器中，如下图：

![image-20220204011652184](https://raw.githubusercontent.com/mxsm/picture/main/spring/experience/image-20220204011652184.png)

**在搭配@Import注解使用的时候到底使用哪一个看自定义过程中是否需要往Spring容器中自己注册Bean的定义，ImportBeanDefinitionRegistrar和ImportSelector两者功能类似有互补的情况**

> Tips: ImportSelector导入的类是否标注了@Configuration注解最终都会当做配置类加载到Spring容器

### 3. ImportSelector和DeferredImportSelector

ImportSelector和DeferredImportSelector两个的作用是一样的，都是导入类到Spring容器中，不同之处在于执行的时间不同。ImportSelector先执行，DeferredImportSelector后执行。我们从代码层面来看一下：

![image-20220204111609644](https://raw.githubusercontent.com/mxsm/picture/main/spring/experience/image-20220204111609644.png)

在**ConfigurationClassParser#parse** 方法中有这样一段代码如上图，前面的parse方法中执行的是 **ImportSelector** ，如果遇到 **DeferredImportSelector** 就会存放到属性 **`deferredImportSelectorHandler`** 在对 @Configuration注解解析完成后再一次执行 **DeferredImportSelector** 的实现类。

**两个的功能基本上一样只是执行的时间不同，有延迟的作用。所以在使用的时候根据自定义拓展的使用者来定**

### 4. FactoryBean和BeanFactory

这个两个类稍微不注意就要搞混了。单词都一样只是顺序变了一下。其实这是两个完全不同的功能两个类。

#### 4.1 FactoryBean

Spring中的Bean有两种：

- 普通的bean

- 工厂Bean也就是实现了FactoryBean

  FactoryBean跟普通Bean不同，其返回的对象不是指定类的一个实例，而是该FactoryBean的getObject方法所返回的对象。

```java
public interface FactoryBean<T> {
	String OBJECT_TYPE_ATTRIBUTE = "factoryBeanObjectType";

	@Nullable
	T getObject() throws Exception;

	@Nullable
	Class<?> getObjectType();

	default boolean isSingleton() {
		return true;
	}
}
```

FactoryBean 通常是用来创建比较复杂的bean，一般的bean 直接用xml配置即可或者使用注解，但如果一个bean的创建过程中涉及到很多其他的bean 和复杂的逻辑，用xml配置比较困难，这时可以考虑用FactoryBean

很多开源项目在集成Spring 时都使用到FactoryBean，比如 [MyBatis3](https://link.jianshu.com/?t=https://github.com/mybatis/mybatis-3) 提供 mybatis-spring项目中的 `org.mybatis.spring.SqlSessionFactoryBean`

> 项目地址：https://github.com/mybatis/spring/blob/master/src/main/java/org/mybatis/spring/SqlSessionFactoryBean.java

#### 4.2 BeanFactory

**BeanFactory** 是Spring Bean容器的顶级接口接口。



> 文章对你有帮助可以点个赞关注我，你的点赞、关注是我前进的动力，文章有不正确的地方请您斧正留言评论~谢谢！