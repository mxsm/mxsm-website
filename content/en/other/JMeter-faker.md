---
title: "JMeter+Faker让测试数据生成自动化"
linkTitle: "JMeter+Faker让测试数据生成自动化"
date: 2022-04-16
weight: 202204160817
---

Faker主要用来生成开发测试过程中的的模拟真实数据。JMeter主要用于测试，在测试的过程中造数据是一个很头疼的问题。今天笔者就来介绍一下如何将Faker和JMeter进行组合来实现。模拟数据创建，通过Faker创建的模拟数据更加真实。

### 1. 环境准备

- JMeter， 版本：5.4.3
- javafaker，版本：1.0.2

下载javafaker的jar包，然后把jar包放到JMeter的lib目录中。

![image-20220416155645007](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20220416155645007.png)

这里就已经准备好了。接下来就是启动JMeter服务。

> Tips: 由于javafaker还有依赖snakeyaml，所以这个jar包也需要引入

### 2. JMeter+Faker案例

用一个简单的创建用户作为例子，首先创建用户需要的几个字段：名称、年龄、手机号码、电子邮件就用这几个字段。

#### 2.1 服务端接口编写

在服务端编写一个简单的Spring Boot web项目的创建用户接口：

```java
public class User {

    private String name;

    private String age;

    private String mobile;

    private String email;
	//省略get set方法
}

@RestController
@RequestMapping("/jmeter")
public class JmeterController {
    @PostMapping("/user")
    public User getDistributedId(@RequestBody User user){
        return user;
    }
}
```

这个就是一个简单的后台服务。

#### 2.1 JMeter脚本编写

**创建线程组：**

![image-20220416104357292](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20220416104357292.png)

**添加BeanShell Sampler: **

![image-20220416104454260](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20220416104454260.png)

**编写BeanShell Sampler的代码：**

![image-20220416155353708](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20220416155353708.png)

#### 2.3 增加 HTTP Reqeust

![image-20220416155417301](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20220416155417301.png)

#### 2.4 运行

![image-20220416155455934](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20220416155455934.png)

每次运行生成的数据都不一样。

通过编写代码的方式将faker和JMeter整合到一起，可以用于测试接口或者通过接口造数据。造出来的数据更加的真实。

### 3. JMeter的BeanShell Sampler变量

![image-20220416160308782](https://raw.githubusercontent.com/mxsm/picture/main/other/image-20220416160308782.png)

通过官网可以知道有以上的变量可以使用。上面的例子就用到vars变量，后续的组件可以获取到里面的值。

> Tips:参照https://jmeter.apache.org/usermanual/component_reference.html#BeanShell_Sampler

### 4.总结

JMeter+Faker的组合，在测试和造数据有这更加真实的可靠，同时生产的数据更加随机，比起手动和直接写生产数据的规则代码大大提高了效率。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢！

**参考资料：**

- https://jmeter.apache.org/usermanual/component_reference.html#BeanShell_Sampler