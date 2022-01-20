---
title: "如何自定义Spring Enable注解"
linkTitle: "如何自定义Spring Enable注解"
date: 2022-01-20
weight: 202201200920
---

Spring中有这样一类注解以Enable开头，例如：**@EnableAsync、@EnableWebMvc、@EnableTransactionManagement** 等等，这三个是在工作中见的比较多也比较常见的一个。从注解字面上的意思来看，主要用于开启某项功能，例如：**@EnableTransactionManagement** 注解是开启事务管理，然后搭配 **@Transactional** 注解使用。在工作过程中仅仅是Spring提供的注解是完全不够的，所以需要我们进行自定义Enable类型注解，来开启某一个功能，然后搭配对应的注解来使用。这里先讲如何自定义Enable类型的注解，后面结合拓展AOP类型注解进行搭配使用。

### 1. @Enable注解原理解析

@Enable类型注解原理解析流程如下图：

![Enable原理 ](https://raw.githubusercontent.com/mxsm/picture/main/spring/custom/Enable%E5%8E%9F%E7%90%86%20.png)

从@Enable注解的解析流程图可以分析一下原理：

- 注解的解析的入口在 **ConfigurationClassPostProcessor**  ，这个类是 **BeanDefinitionRegistryPostProcessor** 接口的实现，而**BeanDefinitionRegistryPostProcessor** 接口继承了**BeanFactoryPostProcessor** 。(Spring容器启动就会调用**BeanFactoryPostProcessor** 一系列相关的继承和实现实例的方法)
- **ConfigurationClassPostProcessor** 从Spring容器中获取被 **@Configuration** 修饰的类，然后交给新建的 **ConfigurationClassParser** 实例处理。
- **ConfigurationClassParser** 负责处理 **@Component、@PropertySources、@PropertySource、@ComponentScans、@ComponentScan、@ImportResource、@Configuration修饰的类方法上面的@Bean、@Import**。
- **@Import** 作为 **@Enable** 注解的入口，**@Import** 导入的配置类需要实现 **DeferredImportSelector、ImportSelector、ImportBeanDefinitionRegistrar** 三个当中的一个,以这三个类往Spring容器中注入自己实现功能相关的类来达到我们自己的功能实现的目的

通过Spring解析配置了@Configuration的类，然后解析类上面配置了@Import的注解配置 value 值的接口，这些类都是实现了**DeferredImportSelector、ImportSelector、ImportBeanDefinitionRegistrar** 这三个接口中的一个。执行了三个接口的实现这里就已经完成了我们自定义的类注册到Spring容器。

> Tpis:在自定义Enable用到的Spring原生的注解以及接口
>
> - 注解
>
>   @Configuration、@Import
>
> - 接口
>
>   DeferredImportSelector、ImportSelector、ImportBeanDefinitionRegistrar

### 2. 自定义@Enable注解实战

自定义一个@EnableLog注解，功能：用来是否允许来进行日志记录。自定义需要如下几个步骤：

![Enable自定义步骤](https://raw.githubusercontent.com/mxsm/picture/main/spring/custom/Enable%E8%87%AA%E5%AE%9A%E4%B9%89%E6%AD%A5%E9%AA%A4.png)

#### 2.1 定义@Enable注解

```java
@Documented
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
public @interface EnableLog {
    boolean value() default true;
    /**
     * use asynchronization method to record log
     * @return
     */
    boolean async() default false;

    /**
     * log name
     * @return
     */
    String loggerName() default "";

    boolean proxyTargetClass() default false;
}
```

注解里面的属性可以根据实现的功能自己定义。

#### 2.2 实现接口

需要实现三个接口中的任意一个：

- **ImportSelector**
- **DeferredImportSelector**
- **ImportBeanDefinitionRegistrar**

**ImportSelector**和**DeferredImportSelector**接口算是一类接口执行的时间不同而已。**ImportBeanDefinitionRegistrar** 往Spring容器中注入BeanDefinition。这三个接口选择看实现功能的需要。我们这里使用的 **ImportSelector** (这个也是最常用的)：

```java
public class LogImportSelector implements ImportSelector {

    /**
     * Select and return the names of which class(es) should be imported based on the {@link AnnotationMetadata} of the
     * importing @{@link Configuration} class.
     *
     * @param importingClassMetadata
     * @return the class names, or an empty array if none
     */
    public String[] selectImports(AnnotationMetadata importingClassMetadata) {

        AnnotationAttributes attributes = AnnotationAttributes.fromMap(
            importingClassMetadata.getAnnotationAttributes(EnableLog.class.getName(), false));
        boolean value = attributes.getBoolean("value");
        if (value) {
            return new String[]{LogConfig.class.getName(), LogImportBeanDefinitionRegistrar.class.getName()};
        }
        return new String[0];
    }
}
```

这里往Spring容器中注入了一个 **LogConfig** 的配置类，以及一个 **LogImportBeanDefinitionRegistrar** 类。

-  **LogConfig**： 主要用来配置记录日志的AOP相关的类实例
- **LogImportBeanDefinitionRegistrar**：开启AOP的处理，以及Spring在日志处理过程中使用的代理方式

> 代码具体会在基于AOP拓展的时候进行讲解

#### 2.3 自定义注解增加@Import注解

上面自定义的 **@EnableLog** 注解只是定义一个普通的注解，那么要如何跟Spring相结合，这就需要用到 **@Import** 注解。

```java
@Documented
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Import(LogImportSelector.class) (1)
public @interface EnableLog {
    //省略部分代码
}
```

增加(1)位置的代码。这里就把自定义的注解和Spring框架结合一起。到这里自定义 **@EnableLog** 完成了。

#### 2.4 配合@Configuration使用

在使用自定义的Enable注解需要搭配Spring原生的 **@Configuration** 进行使用(原理已经在上面介绍)

```java
@EnableLog
@Configuration
public class EnableLogConfig {

}
```

如上代码这样就可以使用了。

> Tips: 如果是SpringBoot项目，可以直接放在@SpringBootApplication注解的类上面，有人会问为什么放在这里可以呢？原因就是 @SpringBootConfiguration注解上面配置了 @Configuration 注解。原因就在这里@SpringBootApplication就相当于一个@Configuration注解，所以我们自定义的Enable注解可以直接放在@SpringBootApplication，当然也可以自定义一个用@Configuration修饰的类上面。

代码会在后续的文章给出来。这里涉及到AOP的拓展。

### 3. 总结

- Enable类型的注解从Spring原生的和自己拓展的来看，相当于一个开关。增加这个注解就开启了一个功能，需要搭配其他的注解来使用，例如：@EnableAsync搭配@Async注解，@EnableTransactionManagement搭配@Transactional注解使用
- Enable类型注解生效需要搭配@Configuration注解
- Enable类型注解的实现需要搭配注解@Import导入，功能实现需要实现**DeferredImportSelector、ImportSelector、ImportBeanDefinitionRegistrar** 三个接口中一个。

将Spring的原生注解和一些特定的拓展接口实现自定义Enable类型注解。