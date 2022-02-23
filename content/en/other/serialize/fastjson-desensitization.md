---
title: "fastjson序列化脱敏实现"
linkTitle: "fastjson序列化脱敏实现"
date: 2022-02-23
weight: 202202232131
---

### 1. 背景

平时开发过程中大家一定遇到过在Restful接口的数据给到前端某些字段需要进行脱敏，最笨的方式就是在需要脱敏的接口中对字段根据产品需求进行相关数据的脱敏工作。这种方式耦合很严重，哪天不需要脱敏了就需要直接修改每个脱敏接口中的代码。所以很容想到就是在序列化的时候对字段进行脱敏处理，这样做有这样几个好处：

- 处理的地方统一，耦合性不是太高
- 开发起来比较友好，无需每个需要序列化的接口都要处理。

平时开发Web项目的时候，除了默认的Spring自带的序列化工具，FastJson也是一个很常用的Spring web Restful接口序列化的工具。下面来基于FastJSON实现序列化指定脱敏的功能。

### 2. 脱敏实现

FastJSON实现方式有两种：

- 基于序列化过滤器
- 基于注解@JSONField实现

下面基于这两种类型分别实现11位手机号码的脱敏

#### 2.1 基于注解@JSONField

在@JSONField注解中有一个serializeUsing字段，这个字段可以让我们自定义序列化。

> Tips: fastjson 版本大于等于1.2.16

首先定义一个自定义序列化的类：

```java
public class PhoneDesensitization implements ObjectSerializer {
    @Override
    public void write(JSONSerializer serializer, Object object, Object fieldName, Type fieldType, int features)
        throws IOException {
        
        //这里只是做了一个简单
        
        if(fieldType != String.class){
            serializer.write(object);
            return;
        }
        StringBuilder phone = new StringBuilder((String)object);
        phone.replace(3,6,"****");
        serializer.write(phone.toString());

    }
}
```

那么如何使用呢？只在需要序列化的类需要脱敏的手机号码上面进行如下设置：

```java
public class Person {
    public Person(String phone) {
        this.phone = phone;
    }

    public Person(String phone, String email) {
        this.phone = phone;
        this.email = email;
    }

    @JSONField(serializeUsing = PhoneDesensitization.class)
    String phone;

    String email;

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
```

运行代码进行验证效果：

```java
public class Test {
    public static void main(String[] args) {
        String s = JSON.toJSONString(new Person("131xxxx1552"),true);
        System.out.println(s);
    }
}
```

运行结果：

```shell
{
	"phone":"131****1552"
}
```

#### 2.2 基于序列化过滤器

FastJSON中有这样一个接口： SerializeFilter，这个接口没有任何方法，有很多继承了这个接口的接口：

1. PropertyPreFilter 根据PropertyName判断是否序列化
2. PropertyFilter 根据PropertyName和PropertyValue来判断是否序列化
3. NameFilter 修改Key，如果需要修改Key,process返回值则可
4. ValueFilter 修改Value
5. BeforeFilter 序列化时在最前添加内容
6. AfterFilter 序列化时在最后添加内容

针对不同的场景可以选择，例如我们这个脱敏的需求，这个其实就是修改Value,所以我们可以选择这个，但是这个Class级别的过滤器，也就是说类中的每一个属性的值都会执行一次这个ValueFilter #process方法，那么就需要用一个方法来标识那些字段是需要处理的，最好的办法就是在需要脱敏的属性上加上注解。

定义注解：

```java
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PhoneDesensi {

}
```

实现ValueFilter 过滤器：

```java
public class PhoneSerializeFilter implements ValueFilter {

    @Override
    public Object process(Object object, String name, Object value) {
		
        try {
            //这里可以增加缓存
            PhoneDesensi annotation = object.getClass().getDeclaredField(name).getAnnotation(PhoneDesensi.class);
            if(annotation == null){
                return value;
            }
            if(!(value instanceof String)){
                return value;
            }
            StringBuilder phone = new StringBuilder((String)value);
            phone.replace(3,6,"****");
            return phone;
        } catch (NoSuchFieldException e) {
           //
        }
        return value;
    }
}
```

然后使用配置：

```java
public class Person {
    public Person(String phone) {
        this.phone = phone;
    }

    public Person(String phone, String email) {
        this.phone = phone;
        this.email = email;
    }

    @PhoneDesensi
    String phone;

    String email;

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

```

运行如下代码验证：

```java
public class Test {

    public static void main(String[] args) {
        String s = JSON.toJSONString(new Person("131xxxx1552","123@163.com"),new PhoneSerializeFilter());
        System.out.println(s);
    }

}
```

运行结果：

```shell
{"email":"123@163.com","phone":"131****1552"}
```

> Tips: 上面的代码只是一个实现的思路，当中还有很多的地方需要完善。

#### 2.3 两种方式的性能对比

测试代码：

```java
@BenchmarkMode(Mode.Throughput)
@Warmup(iterations = 3, time = 10)
@Measurement(iterations = 3, time = 60)
@Threads(16)
@Fork(1)
@State(value = Scope.Benchmark)
@OutputTimeUnit(TimeUnit.SECONDS)
public class JmhTest {

    private Person person = new Person("131xxxx1552", "123@163.com");
    private Person1 person1 = new Person1("131xxxx1552", "123@163.com");

    private PhoneSerializeFilter filter = new PhoneSerializeFilter();

    @Benchmark
    public void valueFilter(Blackhole blackhole) {
        String a = JSON.toJSONString(person1, filter);
        blackhole.consume(a);
    }

    @Benchmark
    public void objectSerializer(Blackhole blackhole) {
       String a = JSON.toJSONString(person);
        blackhole.consume(a);
    }

    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder()
            .include(JmhTest.class.getSimpleName())
            .result("result.json")
            .resultFormat(ResultFormatType.JSON).build();
        new Runner(opt).run();
    }
}
```

运行结果：

![image-20220223222349475](https://raw.githubusercontent.com/mxsm/picture/main/others/serialize/image-20220223222349475.png)

![fastjson的序列化性能对比](https://raw.githubusercontent.com/mxsm/picture/main/others/serialize/fastjson%E7%9A%84%E5%BA%8F%E5%88%97%E5%8C%96%E6%80%A7%E8%83%BD%E5%AF%B9%E6%AF%94.png)



从运行结果可以看出来大概使用 **基于序列化过滤器** 相比 **基于注解@JSONField** 损失了11%的性能。

### 3. Spring Boot集成

配置 Spring MVC 的话只需继承 `WebMvcConfigurer` 覆写 `configureMessageConverters` 方法即可,如下：

```java
@Configuration
public class WebMvcConfigurer implements WebMvcConfigurer {
    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        FastJsonHttpMessageConverter converter = new FastJsonHttpMessageConverter();
        //自定义配置...对于第二种方式
        //FastJsonConfig config = new FastJsonConfig();
        // config.setSerializeFilters(new PhoneSerializeFilter()); --设置自定义的Filter
        converters.add(0, converter);
    }
}
```

> Tips: Tips：fastjson网站这里使用的是WebMvcConfigurerAdapter,但是在Spring5.0后标记为过期了。

### 4. 总结

- 两种实现方式各有千秋，基于第一种方式就是每一种需要脱敏的数据都需要编写一个自定义序列化类，但是性能强于第二种。第二种虽然性能比第一种稍弱。这里可以对代码进行优化增加缓存提高。然后就是可以用一个自定义注解来实现这个功能。同时用第二种方式使用自定义的注解还可以实现其他非FastJSON的脱敏
- 基于这两种方式实现数据脱敏能够降低和代码耦合。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

参考资料：

- https://github.com/alibaba/fastjson/wiki