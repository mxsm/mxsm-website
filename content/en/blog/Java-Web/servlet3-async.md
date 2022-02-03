---
title: Servlet异步请求如何开启
date: 2021-03-16
weight: 2
---

「这是我参与2022首次更文挑战的第17天，活动详情查看：[2022首次更文挑战](https://juejin.cn/post/7052884569032392740)」

### 1. 背景

在研究长轮询的实现过程，有使用到Servlet3的异步请求。下面就来学习一下Servlet3的异步请求

> 现在Servlet的版本已经到了5

### 2. Servlet同步请求
以Tomcat服务器为例：
- Http请求到达Tomcat
- Tomcat从线程池中取出线程处理到达Tomcat的请求
- 将请求Http解析为HttpServletRequest
- 分发到具体Servlet处理对应的业务
- 通过HttpServletResponse返回处理的数据

![image](https://github.com/mxsm/picture/blob/main/javaweb/Servlet%E5%90%8C%E6%AD%A5%E8%AF%B7%E6%B1%82%E7%A4%BA%E6%84%8F%E5%9B%BE.png?raw=true)  
正常情况下请求模型和上面的模型一样，所有的请求交给Tomcat服务器的线程池处理，整个动作处理完成才释放回线程池。  
这里就存在了一个问题如果后期的业务处理时间比较长。那么处理请求的线程就会被一直占用。当请求越来越多被占用的线程也会越来越多。直到被耗尽线程池中所有的线程。后续进来的就一直被阻塞等待线程来处理。  

> 当用户不关心提交的返回可以定义业务处理线程池，前端请求提交后，Tomcat线程将处理提交给业务线程池立即返回。Spring 中的异步任务(@Async)就是这样的。  

### 3. Servlet异步请求
同样以Tomcat服务为例：
- 将请求Http解析为HttpServletRequest
- 分发到具体Servlet处理，将业务提交给自定义业务线程池，Tomcat线程立刻被释放。
- 当业务线程将任务执行结束，将会将结果转交给Tomcat线程池。
- 通过HttpServletResponse返回处理的数据

引入异步Servlet3整体流程：  
![image](https://github.com/mxsm/picture/blob/main/javaweb/%E5%BC%82%E6%AD%A5Servlet3%E6%95%B4%E4%BD%93%E6%B5%81%E7%A8%8B.png?raw=true)  

使用异步 Servelt，Tomcat 线程仅仅处理请求解析动作，所有耗时较长的业务操作全部交给业务线程池，所以相比同步请求， Tomcat 线程可以处理 更多请求。虽然将业务交给了业务流程处理，但是前端还在等待结果返回(同步等待返回)。
> 异步处理，前端会同步等待结果返回。很多人会觉得异步请求会返回更快。其实不然由于异步存在线程的切换。所有返回时间会比同步的慢。

虽然没有降低相应时间但是还是有其他明显的优点:
- 可以处理更高并发连接数，提高系统整体吞吐量
- 请求解析与业务处理完全分离，职责单一
- 自定义业务线程池，我们可以更容易对其监控，降级等处理
- 可以根据不同业务，自定义不同线程池，相互隔离，不用互相影响

### 4. 异步Servlet使用方法
使用异步Servlet只需要三步：
1. ***HttpServletRequest#startAsync()*** 获取 ***AsyncContext*** 异步上下文
2. 使用自定义业务线程池处理业务
3. ***AsyncContext#getResponse()*** 返回处理结果给前端，然后调用 ***AsyncContext#complete()*** 

### 5. Spring中的实现例子

代码如下图：

![图](https://github.com/mxsm/picture/blob/main/javaweb/servlet%E5%BC%82%E6%AD%A5%E4%BB%A3%E7%A0%81%E5%9B%BE%E7%89%87.png?raw=true)

1. 开启异步Servlet
2. 模拟业务执行
3. 返回结果给前端

前面有说过前端是一直在同步等待的我们通过运行代码来验证一下。结果如下图：

![图](https://github.com/mxsm/picture/blob/main/javaweb/servlet%E5%BC%82%E6%AD%A5%E6%89%A7%E8%A1%8C%E5%89%8D%E7%AB%AF%E5%90%8C%E6%AD%A5%E7%AD%89%E5%BE%85%E9%AA%8C%E8%AF%81%E7%BB%93%E6%9E%9C%E5%9B%BE.gif?raw=true)

> 代码地址：https://github.com/mxsm/spring-sample/blob/master/spring-boot/src/main/java/com/github/mxsm/controller/AsyncController.java