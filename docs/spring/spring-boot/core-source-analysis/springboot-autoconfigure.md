---
title: SpringBoot源码解析之autoconfigure
linkTitle: SpringBoot源码解析之autoconfigure
date: 2018-05-08
---
### 1. SpringBootApplication注解
SpringBootApplication注解是SpringBoot中最重要的一个注解，用来启动SprintBoot应用。

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(excludeFilters = { @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
		@Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) })
@ConfigurationPropertiesScan
public @interface SpringBootApplication {
    
	@AliasFor(annotation = EnableAutoConfiguration.class)
	Class<?>[] exclude() default {};
	
	@AliasFor(annotation = EnableAutoConfiguration.class)
	String[] excludeName() default {};
	
	@AliasFor(annotation = ComponentScan.class, attribute = "basePackages")
	String[] scanBasePackages() default {};
	
	@AliasFor(annotation = ComponentScan.class, attribute = "basePackageClasses")
	Class<?>[] scanBasePackageClasses() default {};
	
	@AliasFor(annotation = Configuration.class)
	boolean proxyBeanMethods() default true;

}
```
从上面的代码可以看出来有三种分类：  
1. SpringBootConfiguration -- 标注当前类为配置
2. EnableAutoConfiguration -- 自动的配置
3. ComponentScan -- Bean扫描
4. ConfigurationPropertiesScan -- 配置Properties扫描  

SpringBoot的autoconfigure主要是通过EnableAutoConfiguration解析注解来实现
#### 1.1 @EnableAutoConfiguration解析


```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage
@Import(AutoConfigurationImportSelector.class)
public @interface EnableAutoConfiguration {

	String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";

    //排除的class
	Class<?>[] exclude() default {};

    //排除的名称
	String[] excludeName() default {};

}
```
通过上面可以看出来主要是通过 ***AutoConfigurationImportSelector*** 类来导入。进入类看一下类的定义：

```java
public class AutoConfigurationImportSelector implements DeferredImportSelector, BeanClassLoaderAware,
		ResourceLoaderAware, BeanFactoryAware, EnvironmentAware, Ordered {
    //省略代码		    
}
```
从代码可以看出来主要是通过 ***DeferredImportSelector*** 导入。看一下 
***AutoConfigurationImportSelector#selectImports*** 方法。这个方法是实现了  ***ImportSelector#selectImports*** 方法。

```java
	@Override
	public String[] selectImports(AnnotationMetadata annotationMetadata) {
		//判断是否能够导入
		if (!isEnabled(annotationMetadata)) {
			return NO_IMPORTS;
		}
		//获取自动配置的元数据
		AutoConfigurationMetadata autoConfigurationMetadata = AutoConfigurationMetadataLoader
				.loadMetadata(this.beanClassLoader);
		//获取自动配置的Entry		
		AutoConfigurationEntry autoConfigurationEntry = getAutoConfigurationEntry(autoConfigurationMetadata,
				annotationMetadata);
		//返回类名		
		return StringUtils.toStringArray(autoConfigurationEntry.getConfigurations());
	}
```
对于 ***DeferredImportSelector*** 主要是通过调用 ***DeferredImportSelector#getImportGroup*** 方法。

```java
	@Override
	public Class<? extends Group> getImportGroup() {
		return AutoConfigurationGroup.class;
	}
```

接下来看一下 ***AutoConfigurationGroup*** 实现。 看一下 ***AutoConfigurationGroup#process*** 方法

```java
public void process(AnnotationMetadata annotationMetadata, DeferredImportSelector deferredImportSelector) {
			Assert.state(deferredImportSelector instanceof AutoConfigurationImportSelector,
					() -> String.format("Only %s implementations are supported, got %s",
							AutoConfigurationImportSelector.class.getSimpleName(),
							deferredImportSelector.getClass().getName()));
			//获取Entry
			AutoConfigurationEntry autoConfigurationEntry = ((AutoConfigurationImportSelector) deferredImportSelector)
					.getAutoConfigurationEntry(getAutoConfigurationMetadata(), annotationMetadata);
			this.autoConfigurationEntries.add(autoConfigurationEntry);
			for (String importClassName : autoConfigurationEntry.getConfigurations()) {
				this.entries.putIfAbsent(importClassName, annotationMetadata);
			}
		}
		
@Override
public Iterable<Entry> selectImports() {
			if (this.autoConfigurationEntries.isEmpty()) {
				return Collections.emptyList();
			}
			Set<String> allExclusions = this.autoConfigurationEntries.stream()
					.map(AutoConfigurationEntry::getExclusions).flatMap(Collection::stream).collect(Collectors.toSet());
			Set<String> processedConfigurations = this.autoConfigurationEntries.stream()
					.map(AutoConfigurationEntry::getConfigurations).flatMap(Collection::stream)
					.collect(Collectors.toCollection(LinkedHashSet::new));
			processedConfigurations.removeAll(allExclusions);

			return sortAutoConfigurations(processedConfigurations, getAutoConfigurationMetadata()).stream()
					.map((importClassName) -> new Entry(this.entries.get(importClassName), importClassName))
					.collect(Collectors.toList());
		}
```
在 ***ConfigurationClassParser*** 中对于实现的是 ***ImportSelector*** 调用的是 ***ImportSelector#selectImports*** 方法。 如果实现的是 ***DeferredImportSelector*** 接口那么调用的是  ***DeferredImportSelector#getImportGroup*** 。