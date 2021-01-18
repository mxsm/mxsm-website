---
title: SpringBoot源码解析之ConfigurationProperties原理
linkeTitle: SpringBoot源码解析之ConfigurationProperties原理
weight: 4
date: 2020-01-16 13:53:00
---
### ConfigurationProperties的作用
配置文件的信息，读取并自动封装成实体类。

```java
public class Bean {

    private String name;
    
    private String user;
    
    private int age;

   //省略get set 方法
}
```

```yaml
student:
  name: 1111
  user: bbbb
  age: 11
```
对于这样的数据封装为Bean就需要用到@ConfigurationProperties注解。
### ConfigurationProperties注解源码解析
#### ConfigurationProperties源码

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ConfigurationProperties {

	//前缀,多个用逗号隔开
	@AliasFor("prefix")
	String value() default "";

	//前缀,多个用逗号隔开
	@AliasFor("value")
	String prefix() default "";

	//是否忽略不可用的字段
	boolean ignoreInvalidFields() default false;

	//是否忽略Java类不存在的字段
	boolean ignoreUnknownFields() default true;

}
```
#### ConfigurationProperties注解激活
通过 ***EnableConfigurationProperties*** 来处理激活 ***ConfigurationProperties*** 注解配置的类。

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import({ ConfigurationPropertiesBeanRegistrar.class, ConfigurationPropertiesBindingPostProcessorRegistrar.class })
public @interface EnableConfigurationProperties {

	//配置用ConfigurationProperties注解的类
	Class<?>[] value() default {};

}
```
***EnableConfigurationProperties*** 注解被 **@Import** 导入两个类。下面来看一下这两个类源码分析：
- **ConfigurationPropertiesBeanRegistrar**
- **ConfigurationPropertiesBindingPostProcessorRegistrar**

那么解析来一一分析这两个类。
#### ConfigurationPropertiesBeanRegistrar源码分析

```java
class ConfigurationPropertiesBeanRegistrar implements ImportBeanDefinitionRegistrar {

	@Override
	public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
		ConfigurableListableBeanFactory beanFactory = (ConfigurableListableBeanFactory) registry;
		getTypes(metadata).forEach(
				(type) -> ConfigurationPropertiesBeanDefinitionRegistrar.register(registry, beanFactory, type));
	}

	private List<Class<?>> getTypes(AnnotationMetadata metadata) {
		MultiValueMap<String, Object> attributes = metadata
				.getAllAnnotationAttributes(EnableConfigurationProperties.class.getName(), false);
		return collectClasses((attributes != null) ? attributes.get("value") : Collections.emptyList());
	}

	private List<Class<?>> collectClasses(List<?> values) {
		return values.stream().flatMap((value) -> Arrays.stream((Class<?>[]) value))
				.filter((type) -> void.class != type).collect(Collectors.toList());
	}

}
```
通过分析源码发现 ***ConfigurationPropertiesBeanRegistrar*** 主要的作用是把注解 **EnableConfigurationProperties** 中的 **value** 中配置的 **Class** 的 **BeanDefinition** 注入到Spring中。这个就是这样的简单。那么解析来分析 **ConfigurationPropertiesBindingPostProcessorRegistrar**。
#### ConfigurationPropertiesBindingPostProcessorRegistrar源码分析

```java
public class ConfigurationPropertiesBindingPostProcessorRegistrar implements ImportBeanDefinitionRegistrar {

	/**
	 * 验证器 bean的名称
	 */
	public static final String VALIDATOR_BEAN_NAME = "configurationPropertiesValidator";

	@Override
	public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
		if (!registry.containsBeanDefinition(ConfigurationPropertiesBinder.BEAN_NAME)) {
			registerConfigurationPropertiesBinder(registry);
		}
		if (!registry.containsBeanDefinition(ConfigurationPropertiesBindingPostProcessor.BEAN_NAME)) {
			registerConfigurationPropertiesBindingPostProcessor(registry);
			registerConfigurationBeanFactoryMetadata(registry);
		}
	}

	//注入ConfigurationPropertiesBinder
	private void registerConfigurationPropertiesBinder(BeanDefinitionRegistry registry) {
		GenericBeanDefinition definition = new GenericBeanDefinition();
		definition.setBeanClass(ConfigurationPropertiesBinder.class);
		definition.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
		definition.getConstructorArgumentValues().addIndexedArgumentValue(0, VALIDATOR_BEAN_NAME);
		registry.registerBeanDefinition(ConfigurationPropertiesBinder.BEAN_NAME, definition);
	}

	//注入ConfigurationPropertiesBindingPostProcessor
	private void registerConfigurationPropertiesBindingPostProcessor(BeanDefinitionRegistry registry) {
		GenericBeanDefinition definition = new GenericBeanDefinition();
		definition.setBeanClass(ConfigurationPropertiesBindingPostProcessor.class);
		definition.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
		registry.registerBeanDefinition(ConfigurationPropertiesBindingPostProcessor.BEAN_NAME, definition);
	}

	//注入ConfigurationBeanFactoryMetadata
	private void registerConfigurationBeanFactoryMetadata(BeanDefinitionRegistry registry) {
		GenericBeanDefinition definition = new GenericBeanDefinition();
		definition.setBeanClass(ConfigurationBeanFactoryMetadata.class);
		definition.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
		registry.registerBeanDefinition(ConfigurationBeanFactoryMetadata.BEAN_NAME, definition);
	}

}
```
上面的代码注入了两个关键的类：
- **ConfigurationPropertiesBinder**  
  由配置文件中的属性转换成对应类
- **ConfigurationPropertiesBindingPostProcessor**  
  bean初始化的处理

通过两个的配合来实现的。
#### ConfigurationPropertiesBindingPostProcessor源码分析
**ConfigurationPropertiesBindingPostProcessor** 这个主要是处理Bean。

```java
public class ConfigurationPropertiesBindingPostProcessor
		implements BeanPostProcessor, PriorityOrdered, ApplicationContextAware, InitializingBean {
    
	private ConfigurationBeanFactoryMetadata beanFactoryMetadata;

	private ApplicationContext applicationContext;

	private ConfigurationPropertiesBinder configurationPropertiesBinder;	 
	
	//省略代码
}
```
实现了 **BeanPostProcessor** 这个接口，主要是处理bean。下面看一下这个接口的主要方法：

```java
@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		//bean的处理--获取bean是否有ConfigurationProperties配置
		ConfigurationProperties annotation = getAnnotation(bean, beanName, ConfigurationProperties.class);
		if (annotation != null && !hasBeenBound(beanName)) {
			bind(bean, beanName, annotation);
		}
		return bean;
	}
```
通过判断bean是否配置了ConfigurationProperties注解，如果配置了就调用 **bind** 方法。下面来看一下bind方法源码：

```java
	private void bind(Object bean, String beanName, ConfigurationProperties annotation) {
		ResolvableType type = getBeanType(bean, beanName);
		Validated validated = getAnnotation(bean, beanName, Validated.class);
		Annotation[] annotations = (validated != null) ? new Annotation[] { annotation, validated }
				: new Annotation[] { annotation };
		Bindable<?> target = Bindable.of(type).withExistingValue(bean).withAnnotations(annotations);
		try {
			this.configurationPropertiesBinder.bind(target);
		}
		catch (Exception ex) {
			throw new ConfigurationPropertiesBindException(beanName, bean.getClass(), annotation, ex);
		}
	}
```
上面的代码主要就实现了配置。
### 总结
总结一下如何使用：
1. **给bean配置ConfigurationProperties**
2. **用EnableConfigurationProperties注解配置配置ConfigurationProperties了bean的class**
