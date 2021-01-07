---
title: FactoryBean解析
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之关键代码
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring源码解析之关键代码
abbrlink: feb6204e
date: 2019-09-24 19:35:19
---
### Spring FactoryBean应用

Spring中的Bean有两种：

- 普通的bean

- 工厂Bean也就是实现了FactoryBean

  FactoryBean跟普通Bean不同，其返回的对象不是指定类的一个实例，而是该FactoryBean的getObject方法所返回的对象。

```java
public interface FactoryBean<T> {
	@Nullable
	T getObject() throws Exception;

	@Nullable
	Class<?> getObjectType();

	default boolean isSingleton() {
		return true;
	}
}
```

### 应用场景

FactoryBean 通常是用来创建比较复杂的bean，一般的bean 直接用xml配置即可，但如果一个bean的创建过程中涉及到很多其他的bean 和复杂的逻辑，用xml配置比较困难，这时可以考虑用FactoryBean

### 应用案例

很多开源项目在集成Spring 时都使用到FactoryBean，比如 [MyBatis3](https://link.jianshu.com/?t=https://github.com/mybatis/mybatis-3) 提供 mybatis-spring项目中的 `org.mybatis.spring.SqlSessionFactoryBean`

> 项目地址：
>
> https://github.com/mybatis/spring/blob/master/src/main/java/org/mybatis/spring/SqlSessionFactoryBean.java