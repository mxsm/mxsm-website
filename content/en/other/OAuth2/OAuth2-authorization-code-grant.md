---
title: "OAuth2-授权码模式图解(Authorization Code Grant)"
linkTitle: "OAuth2-授权码模式图解(Authorization Code Grant)"
date: 2022-03-28
weight: 202203281717
---

### 1.授权码模式

授权码模式用来获取**`Access Token`** 以及 **`refresh Token`** 。这个模式是功能最完整，最严密的、安全性最高的授权模式。**`通过客户端的后台服务器与认证服务器进行交互。`**

### 2. 授权码流程图

下面是官方给的授权流程图：

![授权码模式流程](https://raw.githubusercontent.com/mxsm/picture/main/other/oauth2/%E6%8E%88%E6%9D%83%E7%A0%81%E6%A8%A1%E5%BC%8F%E6%B5%81%E7%A8%8B.png)

上图这个看起来有点懵，转换一下成详细时序图：

![授权码模式时序图](https://raw.githubusercontent.com/mxsm/picture/main/other/oauth2/%E6%8E%88%E6%9D%83%E7%A0%81%E6%A8%A1%E5%BC%8F%E6%97%B6%E5%BA%8F%E5%9B%BE.png)

上图有几个重要的步骤下面根据图以及官方的文档进行详细分析。

> Tips: 上图的client其实是可以包含前端页面、后台的服务。

#### 2.1 授权请求

官方的流程图中（A）步骤就是授权请求认证的URI，在时序图中就是步骤（2）。客户端构造的请求URI的格式如下：

**`Context-Type: application/x-www-form-urlencoded`**

HTTP请求方式： GET

请求参数：

| 参数          | 是否必须 | 说明                                                         |
| ------------- | -------- | ------------------------------------------------------------ |
| response_type | 必须     | 必须设置为**code**                                           |
| client_id     | 必须     | 客户端在授权服务注册的能够标识的唯一值，一般用应用的唯一ID   |
| redirect_uri  | 可选     | 授权完成后的重定向地址，一般可以在授权服务后台进行设置       |
| scope         | 可选     | 可选、表示授权范围                                           |
| state         | 推荐使用 | 用来维护请求和回调状态的附加字符串，在授权完成回调时会附加此参数，应用可以根据此字符串来判断上下文关系 |

例子如下：

```http
GET /authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz
        &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb HTTP/1.1
Host: server.example.com
```

> Tips: URI要进行URIEncode的编码

授权服务器对URI的请求参数进行验证，验证通过后就是响应返回

#### 2.2 授权响应

步骤（c）和时序图中的步骤（6）返回授权请求的响应。返回的格式：

**`Context-Type: application/x-www-form-urlencoded`**

返回的参数：

| 参数  | 是否必须 | 说明                                                         |
| ----- | -------- | ------------------------------------------------------------ |
| code  | 必须     | 授权码，授权码代表用户确认授权的暂时性凭证，**只能使用一次**，推荐最大生命周期不超过10分钟 |
| state | 可选     | 如果客户端传递了该参数，则必须原封不动返回                   |

例子如下：

```http
HTTP/1.1 302 Found
Location: https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz
```

#### 2.3 Access Token请求

（D）步骤和时序图中的（7）步骤，客户端向认证服务器申请令牌的HTTP请求，包含以下参数：

**`Context-Type: application/x-www-form-urlencoded`**

HTTP请求方式：POST

请求参数：

| 参数         | 是否必须 | 说明                                                       |
| ------------ | -------- | ---------------------------------------------------------- |
| grant_type   | 必须     | OAuth 2.0规定的授权类型，此处必须是 **authorization_code** |
| client_id    | 必须     | 应用的唯一ID                                               |
| redirect_uri | 必须     | 授权回调地址                                               |
| code         | 必须     | 授权码                                                     |

例子如下：

```http
POST /token HTTP/1.1
Host: server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb
```

**验证服务器需要做的：**

- 验证客户端的凭证
- 如果包含客户端身份验证，则对客户端进行身份验证
- 校验客户端的client_id
- 校验授权码是否有效
- 确保redirect_uri是存在的，且和获取授权码请求的一样

#### 2.4 Access Token响应

（E）步骤和时序图（9）中，认证服务器发送的HTTP回复：

返回参数：

| 参数          | 是否必须 | 说明                                                         |
| ------------- | -------- | ------------------------------------------------------------ |
| access_token  | 必须     | 授权服务器颁发的 **`Access Token`**                          |
| token_type    | 必须     | [OAuth 2.0协议规定的Token类型，固定为 **`Bearer`**](https://datatracker.ietf.org/doc/html/rfc6749#section-7.1) |
| expires_in    | 推荐     | 过期时间（秒）                                               |
| refresh_token | 可选     | 授权服务器颁发的**`refresh token`**                          |
| scope         | 可选     | 表示权限范围，如果与客户端申请的范围一致，此项可省略         |

返回例子如下：

```http
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"2YotnFZFEjr1zCsicMWpAA",
  "token_type":"Bearer",
  "expires_in":3600,
  "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA",
  "example_parameter":"example_value"
}
```

**说明：**

- `Content-Type: application/json;charset=UTF-8`
- 不能使用缓存

### 3. 授权码模式应用-第三方登录

授权码模式使用的最多的应用就是第三方登录，我们以自己设计一个第三方登录为例子来进行说明。首先看一下登录时序图

![第三方授权登录时序图](https://raw.githubusercontent.com/mxsm/picture/main/other/oauth2/%E7%AC%AC%E4%B8%89%E6%96%B9%E6%8E%88%E6%9D%83%E7%99%BB%E5%BD%95%E6%97%B6%E5%BA%8F%E5%9B%BE.png)

上述登录时序图说明：我们以加入你要接入微信登录为例子。那么授权服务就是微信的服务，资源拥有服务也是微信的服务。而第三方的面和第三方的后端服务就是需要接入微信登录的用户方。授权登录的页面是微信提供的。对应OAuth2的角色：

- **资源拥有者(resource owner):** 微信。
- **资源服务器 (resource server)：** 资源拥有服务(微信)
- **客户端(Client)**：第三方页面、第三方后端服务
- **授权服务器(authorization server):** 授权服务（微信）

**关键步骤说明：**

- (2)主要是为了去授权服务器验证当前接入的客户端是否合法，在验证合法的情况下返回授权登录页面，如果是微信登录获得的就是微信授权登录的页面，这个是由授权放提供。(这里大家可以找一个有接入微信或者其他的支持第三方登录的网站看一下)
- (8)和(9)主要是生成授权码和将授权码通过重定向链接将数据发送到第三方后端服务(这个过程是一个自动的过程对web页面来说，这里返回的HTTP响应码是302)
- (11)是由第三方后端服务调用授权服务去获取`Access Token` 。 OAuth 2.0协议规定redirect_uri是必填的。但是大多数的实现都没有这个必填的参数传入。后续就是授权服务校验提交的参数同时通过就返回 **`Access Token`** 

### 4. 总结

授权码模式作为最安全的模式，经常被用于用作实现第三方登录。但是对比OAuth 2.0的标准，不同的公司的实现有一定的差异。但是总体的思想都差不多。第三方的登录可以参考知乎的第三方登录页面。

> 我是蚂蚁背大象，文章对你有帮助点赞关注我，文章有不正确的地方请您斧正留言评论~谢谢

参考文档：

- https://datatracker.ietf.org/doc/html/rfc6749#section-4.1