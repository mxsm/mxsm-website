---
title: Servlet3.1
categories:
  - Java
  - Java Web
tags:
  - Java
  - Java Web
abbrlink: 70ddb022
date: 2018-05-19 11:05:33
---
### 1. 什么是Servlet

Servlet 是基于 Java 技术的 web 组件，容器托管的，用于生成动态内容。像其他基于 Java 的组件技术一样， 

Servlet 也是基于平台无关的 Java 类格式，被编译为平台无关的字节码，可以被基于 Java 技术的 web server 

动态加载并运行。容器，有时候也叫做 servlet 引擎，是 web server 为支持 servlet 功能扩展的部分。客户端 

通过 Servlet 容器实现的请求/应答模型与 Servlet 交互。

### 2. **Servlet** 接口

Servlet 接口是 Java Servlet API 的核心抽象。所有 Servlet 类必须直接或间接的实现该接口，或者更通常做法 

是通过继承一个实现了该接口的类从而复用许多共性功能。目前有 GenericServlet 和 HttpServlet 这两个类实 

现了 Servlet 接口。大多数情况下，开发者只需要继承 HttpServlet 去实现自己的 Servlet 即可:

```java
public interface Servlet {

    public void init(ServletConfig config) throws ServletException;
    
    public ServletConfig getServletConfig();

    public void service(ServletRequest req, ServletResponse res)
        
	throws ServletException, IOException;
	
    public String getServletInfo();
    
    public void destroy();
}
```

