---
title: "如何自定义Bean validation实现数据校验"
linkTitle: "如何自定义Bean validation实现数据校验"
date: 2022-01-30
weight: 202201301429
---

![Jakarta Bean Validation](https://beanvalidation.org/logo/logo.svg)

在开发的过程中数据校验是一个很常见的操作，通常的做法：

```java
public boolean addUser(StudentJson json){
    if(json.getFirstName() == null || "".equals(json.getFirstName().trim())){
        throw new IllegalArgumentException("名称不能为空");
    }
    //其他的校验逻辑
    return true;
}
```

将所有的校验逻辑写在业务代码中。这里可能还存在其他的一个问题就是一种类型的数据可能校验逻辑基本上一样就判空。如果没有一套统一的处理验证的接口规范。就需要用户针对不同的Bean的字段写校验逻辑。[**`Bean validation`**](https://beanvalidation.org/) 就是为了解决这个问题。而对于 **`Bean validation`** 实现使用范围最广的就是 **`hibernate-validator`**  。比如Spring都有使用 **`hibernate-validator`** 。

> hibernate-validator Github地址：https://github.com/hibernate//hibernate-validator/

**Bean Validation的口号: Constrain once, validate everywhere**

Bean Validation的知识结构图如下：

![beanvalidation知识点](E:\download\beanvalidation知识点.png)

如何自定义一个约束，根据上面的**Bean Validation** 的知识结构图来一步步实现。下面已定义一个 手机号码约束

### 1. 定义约束

定义的注解约束如下：

```
@Documented
@Constraint(validatedBy = MobileNumValidator.class)
@Target({ ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE, ElementType.CONSTRUCTOR, ElementType.PARAMETER, ElementType.TYPE_USE })
@Retention(RetentionPolicy.RUNTIME)
public @interface MobileNum {

    String message() default "{com.github.mxsm.MobileNum.message}";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };

}
```

![image-20220130171927372](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220130171927372.png)

**标号1：** **@Constraint** 注解设置自定义验证器，**`MobileNumValidator`** 需要自己实现 **ConstraintValidator** 接口

**标号2：** 这三个是约束必填的三个属性(同时还可以增加其他的属性)

> message的插入值默认定义在ValidationMessages.properties文件中，这里还涉及到国际化等等。

### 2. ConstraintValidator接口实现

**`MobileNumValidator`** 的接口实现如下:

```java
public class MobileNumValidator implements ConstraintValidator<MobileNum,String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {

        if(null == value || value.trim().length() != 11 || !value.matches("^[0-9]+$")){
            return false;
        }
        return true;
    }
}
```

###  3.  MobileNum注解测试

测试代码如下：

```java
public class ValidationMain {

    public static void main(String[] args) {
        Person person = new Person();
        person.setMobile("122222222");
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        Set<ConstraintViolation<Person>> constraintViolations = validator.validate( person );
        ConstraintViolation<Person> next = constraintViolations.iterator().next();
        String message = next.getMessage();
        System.out.println(message);
    }


    public static class Person{
        @MobileNum
        //@Email
        private String mobile;

        public String getMobile() {
            return mobile;
        }

        public void setMobile(String mobile) {
            this.mobile = mobile;
        }
    }
}
```

> 增加Hibernate-validator的maven依赖。
>
> ```xml
>     <dependency>
>       <groupId>jakarta.validation</groupId>
>       <artifactId>jakarta.validation-api</artifactId>
>       <version>3.0.1</version>
>     </dependency>
>     <dependency>
>       <groupId>org.hibernate.validator</groupId>
>       <artifactId>hibernate-validator</artifactId>
>       <version>7.0.2.Final</version>
>     </dependency>
>     <dependency>
>       <groupId>org.glassfish</groupId>
>       <artifactId>jakarta.el</artifactId>
>       <version>4.0.1</version>
>     </dependency>
> ```
>
> 同时需要增加 **`jakarta.validation-api`** ，因为高版本的JavaEE已经不在javax下面而在jakarta下面这个需要注意，同时在classpath下创建一个ValidationMessages.properties文件
>
> ```properties
> com.github.mxsm.MobileNum.message=手机号码不正确
> ```

![image-20220130205426240](C:\Users\mxsm\AppData\Roaming\Typora\typora-user-images\image-20220130205426240.png)

运行查看结果：

![beanvalidation测试运行](C:\Users\mxsm\Desktop\pic\beanvalidation测试运行.gif)

从运行结果可以看出来成功打印了在ValidationMessages.properties配置的手机号码不正确提示

### 4. 总结

- 自定义约束注解需要@Constraint修饰，必须包含 **`message、groups、payload`** 三个属性
- 自定义注解的message一般使用占位符，这样便于后期的可能的国际化
- **Hibernate-validator** 实现默认读取的是 *ValidationMessages.properties* ，如果国际化的配置文件格式为ValidationMessages_xxxx.properties,例如英文：*ValidationMessages_en_US.properties* 获取JVM的locale（Locale#getDefault()）



**参考资料**：

- https://hibernate.org/validator/releases/7.0/
- https://beanvalidation.org/