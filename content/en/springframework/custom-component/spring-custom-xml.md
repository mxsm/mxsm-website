---
title: Spring自定义xml
categories:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring 自定义拓展
  - XML自定义拓展
tags:
  - Spring
  - Springframework
  - Spring-core分析
  - Spring 自定义拓展
abbrlink: c14a2e36
date: 2019-10-17 14:31:51
---
### 1. Spring中的XML schema扩展机制

Spring 为基于 XML 构建的应用提供了一种扩展机制，用于定义和配置 Bean。 它允许使用者编写自定义的 XML bean 解析器，并将解析器本身以及最终定义的 Bean 集成到 Spring IOC 容器中。

> Dubbo中就用到了XML Schema拓展机制

### 2. 如何进行XML拓展自定义实现 

#### 2.1 定义XSD文件

#### 在项目的 **resources** 文件夹下面定义一个xsd的文件(更加详细的可以参考Spring源码中定义或者Dubbo中的xsd的定义)

```xml
<?xml version="1.0" encoding="UTF-16" ?>
<xsd:schema xmlns="https://github.com/mxsm/schema/mxsm"
            xmlns:xsd="http://www.w3.org/2001/XMLSchema"
            xmlns:beans="http://www.springframework.org/schema/beans"
            targetNamespace="https://github.com/mxsm/schema/mxsm">

    <xsd:import namespace="http://www.springframework.org/schema/beans" />

    <xsd:element name="application">
        <xsd:complexType>
            <xsd:complexContent>
                <xsd:extension base="beans:identifiedType">
                    <xsd:attribute name="name" type="xsd:string" use="required"/>
                </xsd:extension>
            </xsd:complexContent>
        </xsd:complexType>
    </xsd:element>

</xsd:schema>
```

比如我定义在：**com/github/mxsm/xml/xsd/mxsm.xsd** 。这其中每一个/表示一层目录结构

#### 2.2 编写一个 **`NamespaceHandler`**

编写一个 **`NamespaceHandler`** 来处理自定义的xml节点。比如上面定义的xsd

```java
package com.github.mxsm.handler;

import com.github.mxsm.parser.MxsmBeanDefinitionParser;
import org.springframework.beans.factory.xml.NamespaceHandlerSupport;

public class MxsmSchemaHandler extends NamespaceHandlerSupport {
    @Override
    public void init() {
        registerBeanDefinitionParser("application", new MxsmBeanDefinitionParser());
    }
}

```

通过实现继承 **`NamespaceHandlerSupport`** 来实现：

> registerBeanDefinitionParser("application", new MxsmBeanDefinitionParser()) 通过这个来实现解析不同的Element名称，第一个参数是节点的名称

#### 2.3 编写一个或者多个 `BeanDefinitionParser` 的实现

在 **`MxsmSchemaHandler`** 的代码中有一个 **`MxsmBeanDefinitionParser`** 类是用来解析当前的Element

```java
package com.github.mxsm.parser;

import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.xml.BeanDefinitionParser;
import org.springframework.beans.factory.xml.ParserContext;
import org.w3c.dom.Element;

/**
 * @author mxsm
 * @Date 2019/6/2
 */
public class MxsmBeanDefinitionParser implements BeanDefinitionParser {

    @Override
    public BeanDefinition parse(Element element, ParserContext parserContext) {
        System.out.println(element.getAttribute("name")+"-------");
        return null;
    }
}
```

通过实现接口 **`BeanDefinitionParser`** 来解析名称为 **`application`** 节点的元素

#### 2.4 通过配置文件注册schema和handler

通过在 **resouces** 资源文件下面的 **META-INF** 文件定义 Spring 规定的两个文件：

- **spring.handlers**

  保存自定义命名空间的用哪个 **`NamespaceHandler`** 去进行处理.

  ```
  https\://github.com/mxsm/schema/mxsm=com.github.mxsm.handler.MxsmSchemaHandler
  ```

- **spring.schemas**

  保存了命名空间对应的xsd的文件位置：

  ```
  https\://github.com/mxsm/schema/mxsm/mxsm.xsd=com/github/mxsm/xml/xsd/mxsm.xsd
  ```

  当前的 mxsm.xsd 的路径在资源文件夹resouces的目录下com/github/mxsm/xml/xsd(这也是目录结构--参照Spring 建立目录结构，如果用Idea开发工具建立不能直接建立文件目录，而需要一级一级的建立)

### 3. 如何在Spring工程中配置xml使用自定义的节点

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:mxsm="https://github.com/mxsm/schema/mxsm"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd
        https://github.com/mxsm/schema/mxsm
        https://github.com/mxsm/schema/mxsm/mxsm.xsd">

    <mxsm:application name="test" />

</beans>
```

将自己的命名空间加入然后书写自定义的xml元素

> 工程的github地址：https://github.com/mxsm/spring-sample/tree/master/namespace-handler

