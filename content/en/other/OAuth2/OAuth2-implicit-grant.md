---
title: "OAuth2-隐式授权详解(Implicit Grant)"
linkTitle: "OAuth2-隐式授权详解(Implicit Grant)"
date: 2022-03-31
weight: 202203312250
---

一起养成写作习惯！这是我参与「掘金日新计划 · 4 月更文挑战」的第2天，[点击查看活动详情](https://juejin.cn/post/7080800226365145118)。

### 1. 隐式授权概述

隐式授予类型用于获取访问令牌(**`它不支持发布刷新令牌`**)，并针对已知操作特定重定向URI的公共客户端进行了优化。这些客户端通常使用JavaScript等脚本语言在浏览器中实现。(主要面向浏览器)。客户端必须能够与资源所有者的用户代理交互，并且能够接收来自授权服务器传入的请求(这个是通过重定向实现)。在授权码授予类型中，客户端分别请求授权和访问令牌，与此不同的是，客户端作为授权请求的结果接收访问令牌。隐式授权类型不包括客户端身份验证，它依赖于资源所有者的存在和重定向URI的注册。因为访问令牌被编码到重定向URI中，所以它可能被公开给资源所有者和驻留在同一设备上的其他应用程序。

上述的几个关键点：

- 不用通过第三方应用后端服务
- 浏览器中直接向认证服务器申请访问令牌
- 相比授权码授权少了获取授权码的过程
- 客户端无需验证，且令牌对访问者可见
- 令牌是拼接在重定向URL的后面

### 2. 隐式授权的流程

看一下官方给的授权流程：

![隐式授权流程图](https://raw.githubusercontent.com/mxsm/picture/main/other/oauth2/%E9%9A%90%E5%BC%8F%E6%8E%88%E6%9D%83%E6%B5%81%E7%A8%8B%E5%9B%BE.png)

对比 **`授权码模式`** ，少了获取授权码的获取，转换成详细的时序图如下：

![隐式授权时序图](https://raw.githubusercontent.com/mxsm/picture/main/other/oauth2/%E9%9A%90%E5%BC%8F%E6%8E%88%E6%9D%83%E6%97%B6%E5%BA%8F%E5%9B%BE.png)

#### 2.1 授权请求

客户端构造的请求URI的格式如下：

**`Context-Type: application/x-www-form-urlencoded`**

HTTP请求方式： GET

请求参数：

| 参数          | 是否必须 | 说明                                                         |
| ------------- | -------- | ------------------------------------------------------------ |
| response_type | 必须     | 必须设置为 **token**  (这个是OAuth2的规范)                   |
| client_id     | 必须     | 客户端在授权服务注册的能够标识的唯一值，一般用应用的唯一ID   |
| redirect_uri  | 可选     | 授权完成后的重定向地址，一般可以在授权服务后台进行设置       |
| scope         | 可选     | 可选、表示授权范围                                           |
| state         | 推荐使用 | 用来维护请求和回调状态的附加字符串，在授权完成回调时会附加此参数，应用可以根据此字符串来判断上下文关系 |

例子如下：

```http
GET /authorize?response_type=token&client_id=s6BhdRkqt3&state=xyz
        &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb HTTP/1.1
Host: server.example.com
```

> Tips: URI要进行URIEncode的编码

授权服务器对URI的请求参数进行验证。就会返回一个授权的页面用户点击授权页面，授权页面点击授权后授权服务器就会返回一个访问令牌 Access Token。

#### 2.2 访问令牌返回

隐式模式访问令牌的返回是将数据放在重定向URI的后面，格式如下：

返回参数：

| 参数         | 是否必须 | 说明                                                         |
| ------------ | -------- | ------------------------------------------------------------ |
| access_token | 必须     | 必须设置为 **token**  (这个是OAuth2的规范)                   |
| token_type   | 必须     | 固定值bearer，[参考OAuth2规范](https://datatracker.ietf.org/doc/html/rfc6749#section-7.1) |
| expires_in   | 推荐使用 | Access Token的有效时间                                       |
| scope        | 可选     | 可选、表示授权范围                                           |
| state        | 推荐使用 | 用来维护请求和回调状态的附加字符串，在授权完成回调时会附加此参数，应用可以根据此字符串来判断上下文关系 |

例子：

```http
HTTP/1.1 302 Found
Location: http://example.com/cb#access_token=2YotnFZFEjr1zCsicMWpAA&state=xyz&token_type=example&expires_in=3600
```

### 3. 应用场景

对于采用隐式授权（Implicit Grant）方式获取Access Token的授权验证流程，**`适用于无Server端配合的应用`** 。 这些应用往往位于一个用户代理（User Agent）里面。例如：**`手机/桌面客户端程序、浏览器插件等,`** 这一类应用无法妥善保管客户端在授权服务器注册时候颁发的客户端秘钥(App Secret Key)。

### 4. 总结

隐式授权（Implicit Grant）是为了解决无Server后端配合的应用，而又防止客户端的在授权服务器的秘钥泄露对授权码模式的一种精简。相比授权码模式做了以下几个改动：

- 少了获取授权码的步骤
- 少了验证客户端的有效性
- 隐式授权不支持刷新访问令牌(refresh Token)

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢
