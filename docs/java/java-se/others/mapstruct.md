---
title: "Spring BeanUtils从精通到放弃，Mapstruct从入门到精通"
linkTitle: "Spring BeanUtils从精通到放弃，Mapstruct从入门到精通"
date: 2022-10-09
weight: 202210092113
---

日常的开发业务系统中对象之间的属性值拷贝是不可避免的，转换过程中使用的比较多的就是Spring的`BeanUtils` 这个工具类(原因：大部分的项目都是使用的Spring framework进行开发的)。类似的工具还有Apache Commons BeanUtils。偶然在GitHub上面看到`Mapstruct` 这个工具来实现对象DTO和Entity之间的拷贝性能还远超 `BeanUtils` 。

我们用JMH来对数据进行测试:

```java
package com.github.mxsm.mapstruct;

import java.util.concurrent.TimeUnit;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.BenchmarkMode;
import org.openjdk.jmh.annotations.Fork;
import org.openjdk.jmh.annotations.Measurement;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.annotations.OutputTimeUnit;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.Setup;
import org.openjdk.jmh.annotations.State;
import org.openjdk.jmh.annotations.Threads;
import org.openjdk.jmh.annotations.Warmup;
import org.openjdk.jmh.results.format.ResultFormatType;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.RunnerException;
import org.openjdk.jmh.runner.options.Options;
import org.openjdk.jmh.runner.options.OptionsBuilder;
import org.springframework.beans.BeanUtils;

@BenchmarkMode(Mode.Throughput)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 5)
@Threads(1)
@Fork(1)
@State(value = Scope.Benchmark)
@OutputTimeUnit(TimeUnit.SECONDS)
public class MapstructBenchmark {

    private ClassA classA;

    @Setup
    public void init() {
        classA = new ClassA();
    }

    @Benchmark
    public void mapstructBenchmark() {
        ClassA a = StructMapper.INSTANCE.classA2classA(classA);
    }

    @Benchmark
    public void beanUtilsBenchmark() {
        ClassA target = new ClassA();
        BeanUtils.copyProperties(classA, target);
    }

    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder()
            .include(MapstructBenchmark.class.getSimpleName())
            .result("result.json")
            .resultFormat(ResultFormatType.JSON).build();
        new Runner(opt).run();
    }
}
```

运行后的对比结果：

![image-20221009211510035](https://raw.githubusercontent.com/mxsm/picture/main/java/javase/image-20221009211510035.png)

![Mapstruct](https://raw.githubusercontent.com/mxsm/picture/main/java/javase/Mapstruct.png)

通过对比结果发现 `Mapstruct` 的效率是`BeanUtils`几个数量级，下文会分析性能优异的原因。

> Tips:项目代码地址：https://github.com/mxsm/benchmark/tree/main/mapstruct-benchmark

### 1. Mapstruct入门到精通

**maven依赖：**

```xml
...
<properties>
    <org.mapstruct.version>1.5.3.Final</org.mapstruct.version>
</properties>
...
<dependencies>
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct</artifactId>
        <version>${org.mapstruct.version}</version>
    </dependency>
</dependencies>
...
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.8.1</version>
            <configuration>
                <source>1.8</source>
                <target>1.8</target>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.mapstruct</groupId>
                        <artifactId>mapstruct-processor</artifactId>
                        <version>${org.mapstruct.version}</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
...
```

**Gradle依赖：**

```groovy
plugins {
    ...
    id "com.diffplug.eclipse.apt" version "3.26.0" // Only for Eclipse
}

dependencies {
    ...
    implementation 'org.mapstruct:mapstruct:1.5.3.Final'

    annotationProcessor 'org.mapstruct:mapstruct-processor:1.5.3.Final'
    testAnnotationProcessor 'org.mapstruct:mapstruct-processor:1.5.3.Final' // if you are using mapstruct in test code
}
...
```

#### 1.1 Mapstruct入门

```java
public class User {
    private String name;
    private String address;
    private String password;
    private String email;
    private short age;
    // Omitting parts of code: get set method
}

public class UserEntity {
    private String name;
    private String address;
    private String password;
    private String email;
    private short age;
    // Omitting parts of code: get set method
}

```

定义一个转换接口UserMapper:

```java
@Mapper
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper( UserMapper.class );
    UserEntity convertUser2UserEntity(User user);
}
```

如果和Mybatis有混用的情况下注意 **`@Mapper`** 是 **`Mapstruct`** 的注解。编写一个测试类测试一下是否可行：

```java
public class MapstructTest {


    public static void main(String[] args) {
        User user = new User();
        user.setAddress("广东省");
        user.setAge((short) 10);
        user.setEmail("ljbmxsm@gmail.com");
        user.setName("mxsm");
        user.setPassword("mxsm");

        UserEntity userEntity = UserMapper.INSTANCE.convertUser2UserEntity(user);
        System.out.println(userEntity);
    }

}
```

运行结果：

![image-20221009211908370](https://raw.githubusercontent.com/mxsm/picture/main/java/javase/image-20221009211908370.png)

完美拷贝完成。

#### 1.2 Mapstruct进阶

上面的例子是两个类的属性名称都是相同，拷贝也是一一对应的。但是平时的开发中可能会出现两个类名称不是一一对应的情况：

```java
public class User {
    private String name;
    private String address;
    private String password;
    private String email;
    private short age;
    // Omitting parts of code: get set method
}

public class UserEntity {
    private String userName;
    private String address;
    private String pwd;
    private String email;
    private short age;
    // Omitting parts of code: get set method
}
```

如果还是使用上面的定义的Mapper就不能实现完整的数据拷贝。那么就可以使用 **`@Mapping`** 注解来指定对象的属性的拷贝

```java
@Mapper
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper( UserMapper.class );

    @Mapping(source = "name",target = "userName")
    @Mapping(source = "password",target = "pwd")
    UserEntity convertUser2UserEntity(User user);

}
```

同样使用上面的测试类看一下结果：

![image-20221009212057087](https://raw.githubusercontent.com/mxsm/picture/main/java/javase/image-20221009212057087.png)

#### 1.3 Mapstruct精通

更多的用法可以参考官网: https://mapstruct.org/documentation/stable/reference/html/

笔者编写文章的时候Mapstruct的版本为**1.5.3.Final** ，不同的版本可能不相同具体可以看文档。官方文档给了很多更加高级的用法，可以在有需要的时候查询用法。

### 2. Mapstruct高性能的原因

在文章的开篇用JMH对Mapstruct和Spring的BeanUtils进行了性能的对比，从对比的数据可以知道：**Mapstruct的性能远高于BeanUtils**。下面就从原理来分析一下两者性能差距的原因。

**首先来分析一下Spring的BeanUtils工具的实现：**

```java
	private static void copyProperties(Object source, Object target, @Nullable Class<?> editable,
			@Nullable String... ignoreProperties) throws BeansException {

		Assert.notNull(source, "Source must not be null");
		Assert.notNull(target, "Target must not be null");

		Class<?> actualEditable = target.getClass();
		if (editable != null) {
			if (!editable.isInstance(target)) {
				throw new IllegalArgumentException("Target class [" + target.getClass().getName() +
						"] not assignable to Editable class [" + editable.getName() + "]");
			}
			actualEditable = editable;
		}
		PropertyDescriptor[] targetPds = getPropertyDescriptors(actualEditable);
		List<String> ignoreList = (ignoreProperties != null ? Arrays.asList(ignoreProperties) : null);

		for (PropertyDescriptor targetPd : targetPds) {
			Method writeMethod = targetPd.getWriteMethod();
			if (writeMethod != null && (ignoreList == null || !ignoreList.contains(targetPd.getName()))) {
				PropertyDescriptor sourcePd = getPropertyDescriptor(source.getClass(), targetPd.getName());
				if (sourcePd != null) {
					Method readMethod = sourcePd.getReadMethod();
					if (readMethod != null) {
						ResolvableType sourceResolvableType = ResolvableType.forMethodReturnType(readMethod);
						ResolvableType targetResolvableType = ResolvableType.forMethodParameter(writeMethod, 0);

						// Ignore generic types in assignable check if either ResolvableType has unresolvable generics.
						boolean isAssignable =
								(sourceResolvableType.hasUnresolvableGenerics() || targetResolvableType.hasUnresolvableGenerics() ?
										ClassUtils.isAssignable(writeMethod.getParameterTypes()[0], readMethod.getReturnType()) :
										targetResolvableType.isAssignableFrom(sourceResolvableType));

						if (isAssignable) {
							try {
								if (!Modifier.isPublic(readMethod.getDeclaringClass().getModifiers())) {
									readMethod.setAccessible(true);
								}
								Object value = readMethod.invoke(source);
								if (!Modifier.isPublic(writeMethod.getDeclaringClass().getModifiers())) {
									writeMethod.setAccessible(true);
								}
								writeMethod.invoke(target, value);
							}
							catch (Throwable ex) {
								throw new FatalBeanException(
										"Could not copy property '" + targetPd.getName() + "' from source to target", ex);
							}
						}
					}
				}
			}
		}
	}
```

上面是方法，通过分析代码可以知道主要是通过获取到源Java类和目标Java类的Class然后获取到方法来进行处理。转化的逻辑非常的复杂有很多的遍历去获取源类和目标类的方法来。然后执行来达到属性的拷贝目的。

所以Spring BeanUtils主要是通过反射来实现对象属性的Copy，而反射效率不高对效率有较高的要求尽量避免使用反射来处理。

**Mapstruct高效的分析：**

首先我们可以看一下项目编译后的目标类：

![image-20221009213136989](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20221009213136989.png)

你会发现多出来了一个class文件名称是定义的Mapper接口的类的名称加上Impl。然后看一下UserMapperImpl.class中的内容

![image-20221009213328257](https://raw.githubusercontent.com/mxsm/picture/main/java/javase/image-20221009213328257.png)

看到这里你会发现这个是实现了UserMapper接口并且实现了 **`UserMapper#convertUser2UserEntity`** 方法。

方法的实现也很简单就是创建一个目标对象然后根据一定的规则(上图这个是一个简单的规则)将数据通过set方法将目标类和源类需要拷贝的属性进行一一对应。**`Mapstruct`** 快的秘密也就是在这里：**用和Java原生的set一样的方式设置值，降低了一切不必要的性能损耗。**

**从这里可以看出来Mapstruct使用了某种技术在编译时根据注解和一些规则的配置生成了一个接口对应的实现类，这个实现类用Java原生的set方式来对数据进行设值。**

> Tips: 后续会更新一篇专门的文章来讲解如何生成这个实现类，以及更加深层次的原理

### 4. 总结

Mapstruct的高性能是毋庸置疑的，如果你经常使用Spring的BeanUtils来进行对象之间的属性拷贝可以考虑尝试使用Mapstruct。Mapstruct的上手成本也不高，能够满足大多数开发者需要的场景。官方提供的文档也相当的齐全基本上的例子都能在官网找到。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢! 大家可以Follow我的[**GitHub mxsm**](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fmxsm)



参考文档：

- https://mapstruct.org/documentation/stable/reference/html/