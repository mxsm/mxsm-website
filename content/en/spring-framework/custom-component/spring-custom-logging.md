---
title: "Spring AOP+SpEL实现自定义模板记录日志"
linkTitle: "Spring AOP+SpEL实现自定义模板记录日志"
date: 2022-02-05
weight: 202202051307
---

「这是我参与2022首次更文挑战的第20天，活动详情查看：[2022首次更文挑战](https://juejin.cn/post/7052884569032392740)」

### 1. 前言

开发项目中的日志记录是必不可少的，对于非业务项目日志记录的一般是关键信息例如项目启动的配置信息等等，而对于业务系统，那记录的主要是请求的接口的数据。这种情况如果以硬编码的方式，业务代码有改动就同时需要改动日志。同时如果不需要记录日志就需要删除所有的日志记录代码。今天我们用Spring AOP+SpEL 来实现自定义模板记录日志：

![日志记录实现](E:\download\日志记录实现.png)

### 2. @MxsmLog定义



![@MxsmLog](E:\download\@MxsmLog.png)

**@MxsmLog** 包含两个属性：

1.  **template**

   用户可以自定义日志记录模板，模板符合SpEL表达式。就可以被SpEL进行解析。

2. **operateType**

   修饰的方法的操作类型，默认为 **UNKNOWN**，operateType的取值如下：

   ```java
   public enum OperateType {
       UNKNOWN,
       ADD,
       DELETE,
       UPDATE,
       SEARCH
   }
   ```

   > Tips: 包含了接口的主要是个操作增删改查，因为也可用于非Controller类上面，所以增加了一个默认的UNKNOWN

代码：

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

    /**
     *
     * @return
     */
    OperateType operateType() default OperateType.UNKNOWN;
}
```

### 3. @EnableMxsmLog

![@EnableMxsmLog](E:\download\@EnableMxsmLog.png)

**@EnableMxsmLog** 包含是个属性：

1. **value是否开启日志记录，默认为true**
2. **async是否开启同步的方式记录日志**
3. **loggerName logger的名称，这样可以设置不同的logger**
4. **proxyTargetClass使用jdk还是cglib作为代理实现**

代码:

```java
@Documented
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Import(LogImportSelector.class)
public @interface EnableMxsmLog {

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

### 4. Spring AOP+SpEL实现解析模板

主要的逻辑都在AOP的实现和SpEL的解析。AOP主要负责拦截执行方法上标注了**@MxsmLog** 的，然后获取注解中的模板信息，把模板信息给到SpEL进行模板解析。最后由日志进行打印出来。

#### 4.1 AOP实现

**Enable** 类型的注解主要是配合 **@Import** 注解来实现，如上的 **@EnableMxsmLog** 注解用 **@Import** 导入了 **`LogImportSelector`** 这个类实现了 **ImportSelector** 接口：

![image-20220205142108722](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220205142108722.png)

在上图标注的地方导入了AOP的实现。

> Tips: 如果对AOP不是很了解可以看一下《[基于Spring AOP自定义注解](https://juejin.cn/post/7055664320616595492)》

![image-20220205142138055](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220205142138055.png)

- **LogAdvisor实现了AbstractBeanFactoryPointcutAdvisor类**
- **LogAdvice实现了MethodInterceptor接口**
- **LogPointcut实现了StaticMethodMatcherPointcut类**

上面三个被实现的类组成Spring中的AOP,这里也就完成了AOP的除了模板解析的所有功能。

**`LogImportBeanDefinitionRegistrar`** 类负责注册生成代理的类的处理：

![image-20220205143450758](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220205143450758.png)

有部分人很可能会发现这段代码好像和 **`AutoProxyRegistrar`** 里面的代码相似。没错就是差不多因为都是利用AOP来实现的功能。这里主要是在获取类的时候自动创建代理类。

#### 4.2 SpEL实现解析模板

模板解析主要是用了Spring SpEL表达式来实现的。

![image-20220205144154908](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220205144154908.png)

模板的解析，因为考虑到有可能是异步的情况所以，这里抽象了一个 **LogWorker** 来执行日志解析和记录。

![image-20220205144312893](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220205144312893.png)

在这个 **LogWorker#run** 方法里实现了模板的绩效和日志的记录。

#### 4.3 错误处理

如下代码所示：

![image-20220205144619676](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220205144619676.png)

如果日志解析和记录错误的情况下不会影响到整个业务的执行。

### 5. 案例演示

增加maven依赖：

```
<dependency>
    <groupId>com.github.mxsm</groupId>
    <artifactId>mxsm-log</artifactId>
    <version>1.0.0</version>
</dependency>
```

编写测试类：

```java
@RestController
@RequestMapping("/log")
public class AsyncController {

    @Autowired
    private Test test;

    @PostMapping("/user")
    public long currentTime1(@RequestParam(value = "name",required = false)String name,
        @RequestBody User user){
         test.addUser(user);
        return System.currentTimeMillis();
    }
}

@Component
public class Test {

    public void test(){
        System.out.println(1111);
    }

    @MxsmLog(template = "用户名称${#user.name}信息：${@test.getName(#user)}")
    public boolean addUser(User user){
        return  true;
    }

    public String getName(User user){
        return  user.getName();
    }
}
```

启动开始测试：

![自定义日志记录测试](C:\Users\mxsm\Desktop\pic\自定义日志记录测试.gif)

从这里可以看到已经可以使用了

> Tips:  jar包已经发布到maven中央仓库
>
> 源码地址：https://github.com/mxsm/mxsm-log4j
>
> 测试代码地址：https://github.com/mxsm/spring-sample/tree/master/spring-boot

### 6 总结

这个只是实现了一个初步的只能说可以用。后续会基于这个实现更多的功能以及优化其实用性。能够直接用于生产！

**不足：**

- 依赖的Spring的版本较高，需要Spring5以上
- 异步的线程池配置没有给到用户自定义



> 我是蚂蚁背大象，文章对你有帮助可以点个赞关注，关注我，你的点赞、关注是我前进的动力，文章有不正确的地方请您斧正留言评论~谢谢！