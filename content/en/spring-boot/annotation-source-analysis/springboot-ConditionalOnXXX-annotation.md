---
title: SpringBoot注解解析之ConditionalOnXXX条件注解
linkeTitle: SpringBoot注解解析之ConditionalOnXXX条件注解
date: 2020-01-14
---
### 1 SpringBoot starter
Spring starter主要通过ConditionXXX来实现的。
### 2 ConditionXXX说明
下面来介绍不同的类型ConditionXXX的用法和案例。
#### 2.1 @ConditionalOnClass和@ConditionalOnMissingClass

注解 | 位置 | 说明
---|---|---
ConditionalOnClass | 方法上、类上 | 某个class位于类路径上，才会实例化一个Bean
ConditionalOnMissingClass | 方法上、类上 | 某个class类路径上不存在的时候，才会实例化一个Bean

上面两个类主要是通过判断类是否存在来实例化Bean。用法和@Conditional注解差不多。  
下面来看一下使用案例代码(SpringBoot的源码借用)：

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnClass(RedisOperations.class)
@EnableConfigurationProperties(RedisProperties.class)
@Import({ LettuceConnectionConfiguration.class, JedisConnectionConfiguration.class })
public class RedisAutoConfiguration {

	@Bean
	@ConditionalOnMissingBean(name = "redisTemplate")
	public RedisTemplate<Object, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory)
			throws UnknownHostException {
		RedisTemplate<Object, Object> template = new RedisTemplate<>();
		template.setConnectionFactory(redisConnectionFactory);
		return template;
	}

	@Bean
	@ConditionalOnMissingBean
	public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory)
			throws UnknownHostException {
		StringRedisTemplate template = new StringRedisTemplate();
		template.setConnectionFactory(redisConnectionFactory);
		return template;
	}

}
```
上面就能看到 ***@ConditionalOnClass*** 注解使用在 **RedisAutoConfiguration** 这个也是我们在SpringBoot starter 上面使用的Redis自动配置器。
#### 2.2 @ConditionalOnBean和@ConditionalOnMissingBean

注解 | 位置 | 说明
---|---|---
ConditionalOnClass | 方法上、类上 | 要求bean存在时，才会创建这个bean
ConditionalOnMissingBean | 方法上、类上 | 要求bean不存在时，才会创建这个bean

这两个注解也是一个对立的注解。通过判断bean是否存在来判断是否创建需要的bean.  
下面来看一下例子：(
[Rocketmq-spring](https://github.com/apache/rocketmq-spring/blob/master/rocketmq-spring-boot/src/main/java/org/apache/rocketmq/spring/autoconfigure/RocketMQAutoConfiguration.java))：

```java
@Configuration
@EnableConfigurationProperties(RocketMQProperties.class)
@ConditionalOnClass({MQAdmin.class})
@ConditionalOnProperty(prefix = "rocketmq", value = "name-server", matchIfMissing = true)
@Import({MessageConverterConfiguration.class, ListenerContainerConfiguration.class, ExtProducerResetConfiguration.class, RocketMQTransactionConfiguration.class})
@AutoConfigureAfter({MessageConverterConfiguration.class})
@AutoConfigureBefore({RocketMQTransactionConfiguration.class})

public class RocketMQAutoConfiguration {
    @Bean(destroyMethod = "destroy")
    @ConditionalOnBean(DefaultMQProducer.class)
    @ConditionalOnMissingBean(name = ROCKETMQ_TEMPLATE_DEFAULT_GLOBAL_NAME)
    public RocketMQTemplate rocketMQTemplate(DefaultMQProducer mqProducer,
        RocketMQMessageConverter rocketMQMessageConverter) {
        RocketMQTemplate rocketMQTemplate = new RocketMQTemplate();
        rocketMQTemplate.setProducer(mqProducer);
        rocketMQTemplate.setMessageConverter(rocketMQMessageConverter.getMessageConverter());
        return rocketMQTemplate;
    }
}
```
大概就是存在 **DefaultMQProducer** 实例，不存在实例名称为 **ROCKETMQ_TEMPLATE_DEFAULT_GLOBAL_NAME** 的Bean就会创建 ***RocketMQTemplate*** 实例。
#### 2.3 @ConditionalOnProperty
注解 | 位置 | 说明
---|---|---
ConditionalOnProperty | 方法上、类上 | Spring Boot通过@ConditionalOnProperty来控制Configuration是否生效
这个注解用的比较少下面来看一下这个注解的源码：

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.TYPE, ElementType.METHOD })
@Documented
@Conditional(OnPropertyCondition.class)
public @interface ConditionalOnProperty {

    // 数组，获取对应property名称的值，与name不可同时使用
    String[] value() default {};
    
    // 配置属性名称的前缀，比如spring源码中的
    String prefix() default "";
    
    // 数组，配置属性完整名称或部分名称
    String[] name() default {};
    
    // 可与name组合使用，比较获取到的属性值与havingValue给定的值是否相同，相同才加载配置
    String havingValue() default "";
    
    //缺少该配置属性时是否可以加载。如果为true，没有该配置属性时也会正常加载；反之则不会生效
    boolean matchIfMissing() default false;
}
```
> 在很多blog中看到说还有一个:  
boolean relaxedNames() default true;属性  
在当前的SpringBoot 2.2.2.RELEASE 版本并没有看到，通过查看历史版本发现在这个 df9d2bc9f47381a2f9e6435f825eb71e63840393的提交删除了，可以自行去历史版查看。

下面来看一下一个例子，这个例子还是上面 **rocketmq-spring-boot-starter** 的例子：

```java
@Configuration
@EnableConfigurationProperties(RocketMQProperties.class)
@ConditionalOnClass({MQAdmin.class})
@ConditionalOnProperty(prefix = "rocketmq", value = "name-server",matchIfMissing = true)
@Import({MessageConverterConfiguration.class, ListenerContainerConfiguration.class, ExtProducerResetConfiguration.class, RocketMQTransactionConfiguration.class})
@AutoConfigureAfter({MessageConverterConfiguration.class})
@AutoConfigureBefore({RocketMQTransactionConfiguration.class})

public class RocketMQAutoConfiguration {
    //省略代码
}
```

```
@ConditionalOnProperty(prefix = "rocketmq", value = "name-server", matchIfMissing = true)
```
类上面的注解，也就是说前缀为 **rocketmq** , value 为 **name-server** ，如果没有匹配到没有该配置属性时也会正常加载。

#### 2.4 @ConditionalOnResource注解
注解 | 位置 | 说明
---|---|---
ConditionalOnResource | 方法上、类上 | 当指定的资源文件出现在classpath中生效

例子：

```java
@ConditionalOnResource(resources = "${spring.info.build.location:classpath:META-INF/build-info.properties}")
@ConditionalOnMissingBean
@Bean
public BuildProperties buildProperties() throws Exception {
	return new BuildProperties(
			loadFrom(this.properties.getBuild().getLocation(), "build"));
}
```
**注意：ConditionalOnResource支持占位符。在源码中有对占位符进行解析可以去看一下类OnResourceCondition**