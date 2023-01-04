---
title: "内嵌式Tomcat"
linkTitle: "内嵌式Tomcat"
date: 2022-02-17
weight: 202202172325
---

### 1. 引言

作为一个Java开发者，Tomcat没有不认识的。

![image-20220224231614905](https://raw.githubusercontent.com/mxsm/picture/main/others/serialize/image-20220224231614905.png)

以前都是单独部署一个Tomcat然后将服务打包成war包后进行部署。随着技术的发展，前后端的分离。Tomcat已经不需要承担前端页面的部署。所以Tomcat单独部署就不是那么合适。使用Spring Boot框架开发web应用的人大家都可能发现我们并没有部署Tomcat只是通过运行一个方法前端就能访问我们开发的接口，这是为什么？这里就介绍我们今天要说的这个内嵌式Tomcat,这个也就是为什么我们Spring Boot的web应用中报错可以看到一些关于Tomcat的信息

### 2. 内嵌式Tomcat到底是什么？

本质上还是一个Tomcat，只不过和以前单独部署然后在指定的目录中部署war不一样的是，内嵌是可以用Jar包的形式嵌入到开发者的项目中。这也是Spring Boot web项目能够使用Tomcat的根本。内嵌式Tomcat将以前传统的Tomcat以编码的方式集成到开发者的web程序中。去除了繁琐的配置。这个也和现在Spring Boot的思想不谋而合。

### 3. 创建一个内嵌Tomcat应用

> Tips: Tomcat版本9.0.58，高的版本需要引入 [Jakarta EE](https://jakarta.ee/) 的一些包，已maven项目为例

#### 3.1 创建pom.xml

在pom.xml文件中添加依赖

```xml
<properties>
    <tomcat.version>9.0.58</tomcat.version>
</properties>

<dependency>
    <groupId>org.apache.tomcat.embed</groupId>
    <artifactId>tomcat-embed-core</artifactId>
    <version>${tomcat.version}</version>
</dependency>
<dependency>
    <groupId>org.apache.tomcat.embed</groupId>
    <artifactId>tomcat-embed-jasper</artifactId>
    <version>${tomcat.version}</version>
</dependency>
```

#### 3.2 编写启动程序

```java
public class TomcatBootstrap {

    public static void main(String[] args) throws Exception{
        //第一部分
        Tomcat tomcat = new Tomcat();
        tomcat.setPort(8080);
        tomcat.getConnector();

        //第二部分
        Context ctx = tomcat.addWebapp("", new File("java-sample/src/main/webapp").getAbsolutePath());
        WebResourceRoot resources = new StandardRoot(ctx);
        resources.addPreResources(
            new DirResourceSet(resources, "/WEB-INF/classes", new File("java-sample/target/classes").getAbsolutePath(), "/"));
        ctx.setResources(resources);

        //第三部分
        tomcat.start();
        tomcat.getServer().await();
    }
}

@WebServlet(urlPatterns = "/")
public class MxsmServlet extends HttpServlet {
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.getWriter().println("hello world");
    }
}
```

![image-20220224233009657](https://raw.githubusercontent.com/mxsm/picture/main/others/serialize/image-20220224233009657.png)

> Tips: 上面代码根据不同人的代码结构不同标注的地方可能也不相同。可以根据错误提示调整。

然后启动服务如下图：

![startembedtomcat](https://raw.githubusercontent.com/mxsm/picture/main/others/serialize/startembedtomcat.gif)

#### 3.3 验证程序

在浏览器输入：**`http://localhost:8080/`**

![image-20220224233432937](https://raw.githubusercontent.com/mxsm/picture/main/others/serialize/image-20220224233432937.png)

返回了`hello world` , 说明了Tomcat正常运行了。

### 4. 总结

- 内嵌式Tomcat提供编程的方式将Tomcat集成到我们的项目，可以让Web项目以Jar包的形式运行
- 以编程的方式代替配置文件的方式来配置Tomcat,减少了配置文件。这个也是为了支持Servlet的注解。以前需要XML配的现在都可以通过注解来实现

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢