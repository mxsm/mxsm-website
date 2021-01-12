---
title: Maven-自定义archetype
categories:
  - 开发工具
  - Maven
tags:
  - Maven
  - archetype
abbrlink: ee66def9
date: 2020-05-16 09:34:56

---

> 基于Maven 3.6.3版本

### 什么是archetype

简单一点说archetype就是一个创建工程的模板。这样的好处在哪里呢？就是不用每次新建一个项目就要去把maven中的配置pom配置一遍我们需要的一些通用的东西。

这里举个栗子：比如你搭建spring-boot项目简单的无非不是在pom文件中添加一些spring-boot的必须的依赖。那么你新建十个项目你就要添加十次。想想累不累烦不烦。所以maven archetype就是来解决这个问题的。那么我们来看一下怎么开发这样一个模板。然后倒入idea中在后续的过程中使用

### 自定义archetype

自定义从现有网上和官网的资料来看有两种方式：

1. 从现有的个人项目生成模板(通过命令)
2. 手写添加模板

#### 从现有的个人项目生成模板(通过命令)

我这边就以创建一个spring-boot项目为例子。首先新建一个如下图所示的项目，这个项目是一个标准的Spring-boot web项目：

![](https://github.com/mxsm/document/blob/master/image/%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7/Maven/archtypeslearning.gif?raw=true)

项目创建好了以后去到项目下面执行(E:\develop\workspace\mxsm\archtypes-learning) ： **`mvn archetype:create-from-project`**

如下图所示：

![](https://github.com/mxsm/document/blob/master/image/%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7/Maven/archtypeslearningcreate.gif?raw=true)

执行完成脚本后。会在 **target/generated-sources/archetype** 这样一个目录：

![](https://github.com/mxsm/document/blob/master/image/%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7/Maven/archtypestruct.png?raw=true)

然后去目录下面执行： **`mvn install`** 命令

> 这里需要注意，如果你和我一样都是用的 idea 新建的项目然后生成的。那么需要稍微处理一下。
>
> 1. 找到target\generated-sources\archetype\src\main\resources\META-INF\maven目录下面的archetype-metadata.xml文件删除和idea相关的东西。把下图注释的部分删掉。
>
>    ```xml
>    <?xml version="1.0" encoding="UTF-8"?>
>    <archetype-descriptor xsi:schemaLocation="https://maven.apache.org/plugins/maven-archetype-plugin/archetype-descriptor/1.1.0 http://maven.apache.org/xsd/archetype-descriptor-1.1.0.xsd" name="archtypes-learning"
>        xmlns="https://maven.apache.org/plugins/maven-archetype-plugin/archetype-descriptor/1.1.0"
>        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
>      <fileSets>
>        <fileSet filtered="true" packaged="true" encoding="UTF-8">
>          <directory>src/main/java</directory>
>          <includes>
>            <include>**/*.java</include>
>          </includes>
>        </fileSet>
>        <fileSet encoding="UTF-8">
>          <directory>src/main/resources</directory>
>          <includes>
>            <include>**/*.yml</include>
>          </includes>
>        </fileSet>
>    <!--    <fileSet filtered="true" encoding="UTF-8">
>          <directory>.idea</directory>
>          <includes>
>            <include>**/*.xml</include>
>          </includes>
>        </fileSet>
>        <fileSet encoding="UTF-8">
>          <directory>.idea</directory>
>          <includes>
>            <include>**/*.gitignore</include>
>          </includes>
>        </fileSet>
>        <fileSet encoding="UTF-8">
>          <directory></directory>
>          <includes>
>            <include>archtypes-learning.iml</include>
>          </includes>
>        </fileSet>-->
>      </fileSets>
>    </archetype-descriptor>
>    ```
>
>    
>
> 2. 找到target\generated-sources\archetype\src\main\resources\archetype-resources目录删除 .iml文件和.idea目录
>
> 这样生成的才不会有问题后续的使用。

![](https://github.com/mxsm/document/blob/master/image/%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7/Maven/archtypeslearninginstall.gif?raw=true)

> Maven的官方地址：https://maven.apache.org/archetype/maven-archetype-plugin/advanced-usage.html

这个archtype在本地maven仓库的一个archetype-catalog.xml文件中可以看到：

![](https://github.com/mxsm/document/blob/master/image/%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7/Maven/archtypecatolog.png?raw=true)

接下来演示如何如何在idea中使用。如下图：

![](https://github.com/mxsm/document/blob/master/image/%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7/Maven/archtypeslearninguse1.gif?raw=true)

这样就创建好了一个自定义的模板以后就可以使用了。

#### 手动创建

手动创建又是怎么一回事，说白了就是把 **`mvn archetype:create-from-project`** 命令干的活自己干一遍。

> Maven的官方教程：http://maven.apache.org/guides/mini/guide-creating-archetypes.html

这里就不多说，但是需要大家注意一个地方就是如下图结构(官方拷贝)

```
archetype
|-- pom.xml  -- 这个pom里面的packaging是需要注意的
`-- src
    `-- main
        `-- resources
            |-- META-INF
            |   `-- maven
            |       `--archetype-metadata.xml
            `-- archetype-resources
                |-- pom.xml
                `-- src
                    |-- main
                    |   `-- java
                    |       `-- App.java
                    `-- test
                        `-- java
                            `-- AppTest.java
```

看一下archetype下面的这个pom文件(内容来自官方文档)：

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
 
  <groupId>my.groupId</groupId>
  <artifactId>my-archetype-id</artifactId>
  <version>1.0-SNAPSHOT</version>
  <packaging>maven-archetype</packaging>  <!-- 这个地方是maven-archetype -->
 
  <build>
    <extensions>
      <extension>
        <groupId>org.apache.maven.archetype</groupId>
        <artifactId>archetype-packaging</artifactId>
        <version>3.1.1</version>
      </extension>
    </extensions>
  </build>
</project>
```

里面的packaging这个地方不熟pom或者jar。而是maven-archetype这个地方一定要注意。这种手动的方式我就演示了具体的例子我提供了两种：

- [官方例子](https://github.com/apache/maven-archetypes)
- [我的例子](https://github.com/mxsm/mxsm-archetypes)

官方例子就是在IDEA中使用的那些。最基本的，我这是spring-boot的一个脚手架。后续这里会更新更多的脚手架：Dubbo、spring cloud等等后续会进行更新。