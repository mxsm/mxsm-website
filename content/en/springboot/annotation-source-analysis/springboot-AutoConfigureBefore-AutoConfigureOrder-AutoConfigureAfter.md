---
title: SpringBoot源码解析之-AutoConfigureBefore、AutoConfigureOrder、AutoConfigureAfter
linkTitle: SpringBoot源码解析之-AutoConfigureBefore、Order、After
date: 2018-04-15
weight: 2
---
### 1. SpringBoot的类加载顺序注解
- **AutoConfigureBefore**
- **AutoConfigureOrder**
- **AutoConfigureAfter**

通过这三个注解能够巧妙的使用排序。
### 2. 源码解析
在SpringBoot的加载主要通过注解 **@*EnableAutoConfiguration*** 来实现。在类 ***AutoConfigurationImportSelector*** 中有一个方法：

```java
private List<String> sortAutoConfigurations(Set<String> configurations,AutoConfigurationMetadata autoConfigurationMetadata) {
	return new AutoConfigurationSorter(getMetadataReaderFactory(), autoConfigurationMetadata)
					.getInPriorityOrder(configurations);
}
```
通过上面的可以看出来主要是通过 ***AutoConfigurationSorter*** 来实现的。下面来看一下这个类：

```java
	List<String> getInPriorityOrder(Collection<String> classNames) {
		AutoConfigurationClasses classes = new AutoConfigurationClasses(this.metadataReaderFactory,
				this.autoConfigurationMetadata, classNames);
		List<String> orderedClassNames = new ArrayList<>(classNames);
		// Initially sort alphabetically
		Collections.sort(orderedClassNames);
		// Then sort by order
		orderedClassNames.sort((o1, o2) -> {
			int i1 = classes.get(o1).getOrder();
			int i2 = classes.get(o2).getOrder();
			return Integer.compare(i1, i2);
		});
		// 处理这两个注解 @AutoConfigureBefore @AutoConfigureAfter
		orderedClassNames = sortByAnnotation(classes, orderedClassNames);
		return orderedClassNames;
	}
```
