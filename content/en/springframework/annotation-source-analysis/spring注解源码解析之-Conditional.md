---
title: spring注解源码解析之-Conditional
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之注解
  - Spring注解源码解析之其他注解
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之注解
abbrlink: 8e253442
date: 2018-04-15 23:18:34
---
### 1. Conditional注解的作用

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Conditional {

	Class<? extends Condition>[] value();

}
```

```java
@FunctionalInterface
public interface Condition {

	boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata);

}
```
一个是注解、一个是接口。
### 2. 从源码解析Conditional如何发挥作用
通过源码分析注解 **Conditional** 主要在三个类中。 **AnnotatedBeanDefinitionReader** 、 **ClassPathScanningCandidateComponentProvider** 、 **ConditionEvaluator** 。通过进一步分析发现 **AnnotatedBeanDefinitionReader、ClassPathScanningCandidateComponentProvider** 中都包含了 **`ConditionEvaluator`** 类的变量。**`AnnotatedBeanDefinitionReader`** 主要用来读取注解的BeanDefinition，而 **`ClassPathScanningCandidateComponentProvider`** 主要由 **`ClassPathBeanDefinitionScanner`** 继承，该类主要用来扫描class path 的BeanDefinition。下面通过分析一下 **`ClassPathBeanDefinitionScanner`** 源码来看一下如何发挥作用的，看一下 **`ClassPathBeanDefinitionScanner#doScan`** 方法：

```java
protected Set<BeanDefinitionHolder> doScan(String... basePackages) {
    
    //省略部分代码
    
    for (String basePackage : basePackages) {
            //这个方法来找到候选的BeanDefinition
			Set<BeanDefinition> candidates = findCandidateComponents(basePackage);
        
        //生路部分代码
    }
}
```
那么再来看一下 **ClassPathScanningCandidateComponentProvider#findCandidateComponents** 方法：

```java
	public Set<BeanDefinition> findCandidateComponents(String basePackage) {
		if (this.componentsIndex != null && indexSupportsIncludeFilters()) {
			return addCandidateComponentsFromIndex(this.componentsIndex, basePackage);
		}
		else {
			return scanCandidateComponents(basePackage);
		}
	}
```
进一步分析上面的 **scanCandidateComponents** 和 **addCandidateComponentsFromIndex** 方法发现，这两个方法中都调用了同一个方法 **ClassPathScanningCandidateComponentProvider#isCandidateComponent** ：

```java
	protected boolean isCandidateComponent(MetadataReader metadataReader) throws IOException {
	    //excludeFilters排除
		for (TypeFilter tf : this.excludeFilters) {
			if (tf.match(metadataReader, getMetadataReaderFactory())) {
				return false;
			}
		}
		for (TypeFilter tf : this.includeFilters) {
			if (tf.match(metadataReader, getMetadataReaderFactory())) {
			    //这个方法就是Conditional注解的实现
				return isConditionMatch(metadataReader);
			}
		}
		return false;
	}
	private boolean isConditionMatch(MetadataReader metadataReader) {
		if (this.conditionEvaluator == null) {
			this.conditionEvaluator =
					new ConditionEvaluator(getRegistry(), this.environment, this.resourcePatternResolver);
		}
		return !this.conditionEvaluator.shouldSkip(metadataReader.getAnnotationMetadata());
	}
```
通过代码分析可以看出来最后是通过调用 ***`ConditionEvaluator#shouldSkip`*** 的方法来实现的。

```java
	public boolean shouldSkip(AnnotatedTypeMetadata metadata) {
		return shouldSkip(metadata, null);
	}
	public boolean shouldSkip(@Nullable AnnotatedTypeMetadata metadata, @Nullable ConfigurationPhase phase) {
		
		//判断是否有注解Conditional
		if (metadata == null || !metadata.isAnnotated(Conditional.class.getName())) {
			return false;
		}

		//判断配置解析的类型
		if (phase == null) {
			
			//配置类的类型
			if (metadata instanceof AnnotationMetadata &&
					ConfigurationClassUtils.isConfigurationCandidate((AnnotationMetadata) metadata)) {
				return shouldSkip(metadata, ConfigurationPhase.PARSE_CONFIGURATION);
			}
			//bean注册类型
			return shouldSkip(metadata, ConfigurationPhase.REGISTER_BEAN);
		}

		List<Condition> conditions = new ArrayList<>();
		for (String[] conditionClasses : getConditionClasses(metadata)) {
			for (String conditionClass : conditionClasses) {
				Condition condition = getCondition(conditionClass, this.context.getClassLoader());
				conditions.add(condition);
			}
		}

		AnnotationAwareOrderComparator.sort(conditions);

		for (Condition condition : conditions) {
			ConfigurationPhase requiredPhase = null;
			if (condition instanceof ConfigurationCondition) {
				requiredPhase = ((ConfigurationCondition) condition).getConfigurationPhase();
			}
			//调用Condition#matches接口来判断是否加载该类
			if ((requiredPhase == null || requiredPhase == phase) && !condition.matches(this.context, metadata)) {
				return true;
			}
		}

		return false;
	}
```
通过源码解析就知道了注解@Conditional配合Condition接口在Spring容器中进行条件化加载Bean。这个在SpringBoot中被广泛的应用。

> 这个条件加载Bean和策略模式差不多。通过不同的策略来加载不同的Bean

