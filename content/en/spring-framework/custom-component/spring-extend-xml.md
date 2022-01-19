---
title: "如何自定义Spring xml Namespace"
linkTitle: "如何自定义Spring xml Namespace"
date: 2021-01-19
weight: 202101192306
---

在Spring XML配置文件中除了Spring 默认的Namespace，今天我们来看一下如何自定义Namespace

### 1. Spring自定义XML的Namespace原理

![自定义xml schema](https://raw.githubusercontent.com/mxsm/picture/main/spring/custom/%E8%87%AA%E5%AE%9A%E4%B9%89xml%20schema.png)

整个Spring容器启动的时候流程还是一样，但是在加载Bean的定义的时候，XML配置文件调用的是 **AbstractXmlApplicationContext#loadBeanDefinitions** 方法来加载XML中的Bean的定义。然后通过 **XmlBeanDefinitionReader** 从设置的默认位置或者指定位置的xml解析成为Document到内存。**BeanDefinitionDocumentReader** 负责解析 XML Document中每个 Element。

> 整个过程会读取META-INF/spring.schemas文件中配置的Namespace和XSD文件的对应关系进行校验

在解析的过程中会去判断是Spring默认的Namespace还是用户自定义Namespace

- Spring 默认Element处理

  默认的Element: import,alias,bean,beans,这些都是由 **DefaultBeanDefinitionDocumentReader** 提供默认解析

- 自定义的Element处理

  通过获取配置在 **META-INF/spring.handlers** 文件中对应Namespace的处理类。这个Namespace的处理类实现 **NamespaceHandler或者NamespaceHandlerSupport** 。

然后调用NamespaceHandler具体实例的NamespaceHandler#parse方法对Element进行解析。

### 2. Spring自定义XML的Namespace实战

定义一个和Spring默认的bean拥有相同功能的Element,这个Element可以叫：**mxsmBean**, 具体的步骤如下图：

![Spring 自定义XML Namespace步骤](https://raw.githubusercontent.com/mxsm/picture/main/spring/custom/Spring%20%E8%87%AA%E5%AE%9A%E4%B9%89XML%20Namespace%E6%AD%A5%E9%AA%A4.png)

#### 2.1 XSD定义

通过XSD文件定义mxsmBean需要有哪些属性。

```xml
<?xml version="1.0" encoding="UTF-16" ?>
<xsd:schema xmlns="https://github.com/mxsm/schema/mxsm"  (1)
            xmlns:xsd="http://www.w3.org/2001/XMLSchema"  
            targetNamespace="https://github.com/mxsm/schema/mxsm">  (2)

    <xsd:import namespace="http://www.springframework.org/schema/beans" />

    <xsd:element name="mxsmBean">
        <xsd:complexType>
            <xsd:attribute name="name" type="xsd:string" use="required"/>
            <xsd:attribute name="class" type="xsd:string" use="required"/>
        </xsd:complexType>
    </xsd:element>
</xsd:schema>
```

(1)和(2)是加自己的Namescape,XSD存放的位置如下：

![image-20220119221646852](https://raw.githubusercontent.com/mxsm/picture/main/spring/custom/image-20220119221646852.png)

#### 2.2 编写NamespaceHandler接口实现

这个接口主要是用来处理我们对应的Element。例如在 https://github.com/mxsm/schema/mxsm 下面我只是定义application这个Element所以就只需要解析这一个就可以了。

> NamespaceHandlerSupport是实现了部分NamespaceHandler接口的抽象方法，一般情况下我们实现NamespaceHandlerSupport类

```java
public class MxsmSchemaHandler extends NamespaceHandlerSupport {
    @Override
    public void init() {
        registerBeanDefinitionParser("mxsmBean", new MxsmBeanDefinitionParser());
        //如果有多个Element就调用多个
    }
}

public class MxsmBeanDefinitionParser implements BeanDefinitionParser {

    @Override
    public BeanDefinition parse(Element element, ParserContext parserContext) {
        String aClass = element.getAttribute("class");
        System.out.println(aClass);
        BeanDefinitionBuilder beanDefinitionBuilder = BeanDefinitionBuilder.genericBeanDefinition(aClass);
        AbstractBeanDefinition beanDefinition = beanDefinitionBuilder.getBeanDefinition();
        parserContext.getRegistry().registerBeanDefinition(element.getAttribute("name"), beanDefinition);
        return beanDefinition;
    }
}
```

每一个对应的标签对应一个解析类，解析类实现 **BeanDefinitionParser** 接口。

#### 2.3 配置META-INF/spring.schemas和META-INF/spring.handlers文件配置

**spring.schemas作用**：配置自定义Namespace的xsd文件的存放位置

```properties
https\://github.com/mxsm/schema/mxsm/mxsm.xsd=com/github/mxsm/xml/xsd/mxsm.xsd
```

 spring.handlers作用：配置自定义Namespace对应的NamespaceHandler

```properties
https\://github.com/mxsm/schema/mxsm=com.github.mxsm.handler.MxsmSchemaHandler
```

在项目中存放的位置如图：

![image-20220119221852581](https://raw.githubusercontent.com/mxsm/picture/main/spring/custom/image-20220119221852581.png)

#### 2.4 Spring application.xml文件中引入自定义的Element

创建Spring应用的xml文件。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:mxsm="https://github.com/mxsm/schema/mxsm"  (1)
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd
        https://github.com/mxsm/schema/mxsm  (2)
        https://github.com/mxsm/schema/mxsm/mxsm.xsd  (3)
        http://www.springframework.org/schema/context
        https://www.springframework.org/schema/context/spring-context.xsd">

        <mxsm:mxsmBean class="com.github.mxsm.bean.MxsmBeanTest" name="test"/>

</beans>
```

(1)、(2)，(3) 这三处在使用的时候需要加上。到这里为止，自定义的步骤都已经完成了。接下来就是进行验证我们能不能把这个类注入到Spring 容器中。这里我们写一段测试代码来检验：

```java
public class App {
    public static void main( String[] args ) {
        ApplicationContext context = new ClassPathXmlApplicationContext("application.xml");
        //System.out.println(context.getBean("aaaa",String.class));
        MxsmBeanTest test = context.getBean("test", MxsmBeanTest.class);
        System.out.println(test);
        MxsmBeanTest bean = context.getBean(MxsmBeanTest.class);
        System.out.println(bean);
        System.out.println(test==bean);
    }
}
```

然后运行看一下结果：

![image-20220119223247306](https://raw.githubusercontent.com/mxsm/picture/main/spring/custom/image-20220119223247306.png)

从运行结果来看能够获取到 **MxsmBeanTest** 对应的实例，并且获取的还是单例。那么说明在我们创建默认的时候注册到Spring容器中的定义获取的类实例默认是已单例的形式。

> 完整代码地址：https://github.com/mxsm/spring-sample/tree/master/namespace-handler



### 3. 总结

- 在自定义拓展前，首先你要知道你拓展的Element是干什么用的，然后在根据用途来进行解析。比如我上面这个mxsmBean就是为了实现一个简化版本的和Spring默认的Bean类似的功能。
- Namespace的XSD文件的编写，需要了解XSD的编写(教程参考：https://www.w3school.com.cn/schema/schema_example.asp)
- 在接口层面需要实现NamespaceHandler以及BeanDefinitionParser接口，两者搭配以前使用。
- 在文件META-INF/spring.schemas和META-INF/spring.handlers中添加对应配置，Spring会默认加载这两个文件中的配置进行解析。
- 在Spring的xml配置文件中导入对应自定义的Namespace。

上面就是整个自定义命名空间的过程，步骤以及Spring怎么样去解析。如果想了解更多的细节可以去Spring的网站(https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#xsd-schemas)了解。同时Spring自己也实现了一些例如 util（spring-util.xsd）。可以通过这些来学习。这样能够更好的明白和理解自定义的这个过程。