---
title: "基于Spring AOP自定义注解"
linkTitle: "基于Spring AOP自定义注解"
date: 2022-01-21
weight: 202201212043
---

Spring AOP在Spring项目中有了很多自己的应用，例如@EnableAsync和@Async就是AOP的体现，那么我们如何自己在Spring AOP的原理下自定义自己的注解。

### 1. 基于Spring AOP自定义注解原理

Spring AOP基于动态代理来实现，默认如果使用接口的，用JDK提供的动态代理实现，如果是类则使用CGLIB实现。通过@EnableAspectJAutoProxy开启AOP（同时开启对AspectJ的支持）。

![基于AOP注解自定义](https://raw.githubusercontent.com/mxsm/picture/main/spring/custom/%E5%9F%BA%E4%BA%8EAOP%E6%B3%A8%E8%A7%A3%E8%87%AA%E5%AE%9A%E4%B9%89.png)

- @EnableAspectJAutoProxy启动Spring AOP
- Spring AOP分为两种实现：
  - 基于AspectJ注解
  - 基于Spring AOP思想，也就是**Advice** 、 **Pointcut** 、 **Advisor** 这个三个，对应MethodInterceptor、AbstractBeanFactoryPointcutAdvisor、StaticMethodMatcherPointcut 三个类。
- 在Spring容器启动后生成对应的代理类，在执行方法的时候根据切面来执行对应的方法

### 2. 代码实战

将@Enable类型的注解与AOP拓展的接口相结合完成一个完整的功能。

![基于AOP注解自定义步骤](https://raw.githubusercontent.com/mxsm/picture/main/spring/custom/%E5%9F%BA%E4%BA%8EAOP%E6%B3%A8%E8%A7%A3%E8%87%AA%E5%AE%9A%E4%B9%89%E6%AD%A5%E9%AA%A4.png)

#### 2.1 定义@Enable注解

结合上一篇文章《[如何自定义Spring Enable注解](https://juejin.cn/post/7055288159042535460)》的@EnableLog的功能

#### 2.2 定义切面注解

定义一个@Log注解，功能：用来记录日志

```java
@Documented
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
public @interface Log {

    /**
     * log template
     * @return
     */
    String template() default "";
    
}
```

#### 2.3 实现AOP的三个接口

**MethodInterceptor** 是动态类的方法拦截器，用来拦截执行方法。这里就是AOP动态类的增强

```java
public class LogAdvice implements MethodInterceptor, BeanFactoryAware {
    
    //省略了部分代码
    
    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {

        Method method = invocation.getMethod();

        return execute(invocation, invocation.getThis(), method, invocation.getArguments());
    }

    private Object execute(MethodInvocation invoker, Object target, Method method, Object[] args) throws Throwable {

        try {
            LogWorker worker = new LogWorker(target, method, args);
            if (this.async) {
                logExecutor.submit(worker);
            } else {
                worker.run();
            }
        } catch (Exception e) {
            //e.printStackTrace();
            logger.warn("Failure to record logs!", e);
        }

        return invoker.proceed();
    }
}
```

主要是实现 **invoke** 方法，这里实现了日志记录的方法。和调用目标类的返回执行结果。

**StaticMethodMatcherPointcut** 切入点的实现类：

```java
public class LogPointcut extends StaticMethodMatcherPointcut{

    @Override
    public boolean matches(Method method, Class<?> targetClass) {
        return AnnotatedElementUtils.hasAnnotation(method, Log.class);
    }
}
```

这里决定了切入点，代码表示了当方法被注解@Log标注了就是匹配到了切入点

**AbstractBeanFactoryPointcutAdvisor** ：通知器用来组织 Advice 和 Pointcut

```java
public class LogAdvisor extends AbstractBeanFactoryPointcutAdvisor{

    private Pointcut logPointcut;

    public LogAdvisor(Pointcut logPointcut) {
        this.logPointcut = logPointcut;
    }

    /**
     * Get the Pointcut that drives this advisor.
     */
    @Override
    public Pointcut getPointcut() {
        return this.logPointcut;
    }
}
```

这三个接口实现后把 **Advice** 、 **Pointcut** 、 **Advisor**  三者组织起来，然后注册到Spring IOC容器。

#### 2.4 使用切面注解在需要的方法(类)

```java
@SpringBootApplication
@EnableLog
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class,args);
    }
}

@Component
public class Test {
    public void test(){
        System.out.println(1111);
    }
    @Log(template = "用户${#user.name}信息：${@test.getName(#user)}")
    public boolean addUser(User user){

        return  true;
    }
    public String getName(User user){

        return  user.getName();
    }
}
```

首先在SpringBoot启动类上加入 **@EnableLog** 然后在需要记录的类的方法上加上 **@Log**

> AOP注解定义代码：https://github.com/mxsm/mxsm-log4j
>
> 测试代码：https://github.com/mxsm/spring-sample/tree/spring-5.3.x/spring-boot

这里是基于Spring AOP接口来实现自定义接口的功能实现，在Spring中还有可以根据AspectJ注解来实现。这里就不详细讲解。想要了解的同学可以在[Spring官网 AOP](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop ) 的 **Aspect Oriented Programming with Spring** 章节查看。所以基于Spring AOP的注解定义就有两种方式。

### 3. 总结

- 基于AspectJ的定义实现比较简单，无需搭配自定义的@Enablexxx注解使用，只需要用@EnableAspectJAutoProxy(完成了我们自定义@Enablexxx的注解)开启AOP即可。
- 基于Spring AOP定义注解底层是基于动态代理。Spring动态代理可以选择JDK或者Cglib