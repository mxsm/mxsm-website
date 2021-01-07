---
title: Netty
categories:
  - Netty
tags:
  - Netty
abbrlink: 1c6ba3e2
date: 2018-12-17 14:25:36
---
### Netty 线程模型

![线程模型](https://github.com/mxsm/document/blob/master/image/netty/NettyServer%E5%A4%84%E7%90%86%E8%BF%9E%E6%8E%A5%E7%9A%84%E7%A4%BA%E6%84%8F%E5%9B%BE.png?raw=true)

上图显示的是 **`Netty`** 主从模型。

- **Boss NioEventLoopGroup** 

  这个Boss Group主要是用来监听和轮询Accept请求，然后处理Accept请求处理建立Channel通道，并且将Channel注册到Worker Group

- **Worker NioEventLoopGroup**

  这个Worker Group 主要用来监听READ和WRITE事件的。处理来自Boss Group注册来的Channel。每一个NioEventLoop都是一个线程，Worker Group就是一个线程组。

  
