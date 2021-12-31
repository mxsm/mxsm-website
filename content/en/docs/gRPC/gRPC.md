---
title: "深入浅出理解gRPC"
linkTitle: "深入浅出理解gRPC"
date: 2021-12-31
weight: 202112311714
---

### 前言

gRPC在最近的几年出现的频率越来越高，越来越多的项目都引入了gRPC,例如：Dubbo3.0, Nacos, RocketMQ5.0。那么gRPC到底是什么我们从下面的几个方面来进行分析

![image-20211231174515945](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/image-20211231174515945.png)

### 1. gRPC是什么？

gRPC是一个现代的开源高性能远程过程调用(RPC)框架，可以在任何环境中运行。它可以有效地连接数据中心内和跨数据中心的服务，支持负载均衡、跟踪、健康检查和身份验证。它也适用于分布式计算，将设备、移动应用程序和浏览器连接到后端服务---这是官方给的说明。gRPC特点：

![image-20211231173154257](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/image-20211231173154257.png)

那么gRPC是什么呢？

- 一个高性能RPC框架，一个跨语言平台的RPC框架。
- 使用Protobuf Buffers作为二进制序列化
- 使用HTTP/2进行数据传输

![图片来源gRPC官网](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/image-20211231173654659.png)

gRPC客户机和服务器可以在各种环境中彼此运行和通信。服务端使用的C++实现。而客户端可以是Ruby、Java、Go等其他的语言。这就体现了gRPC的跨平。

### 2. gRPC与Protocol Buffers

#### 2.1 Protocol Buffers是什么？

> Protocol Buffers官网：https://developers.google.com/protocol-buffers

由Google定义的一个与语言和平台无关具有可拓展的用于序列化结构化的数据(例如：XML、JSON)的协议。但更小、更快、更简单。您只需定义数据的结构化方式，然后就可以使用特殊生成的源代码轻松地向各种数据流写入和读取结构化数据，并可以被各种语言使用。

> Akka的节点之间的数据传输可以自定义基于Protobuf Buffers序列化的处理。

#### 2.2  gRPC使用Protocol Buffers序列化结构化数据

```protobuf
// The greeter service definition.
service Greeter {
  // Sends a greeting
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}

// The request message containing the user's name.
message HelloRequest {
  string name = 1;
}

// The response message containing the greetings
message HelloReply {
  string message = 1;
}
```

通过定义 *proto* 文件，来定义 **`service`** 和 **`message`** 。 service负责提供服务， message提供结构化数据的序列化。

gRPC与Protocol Buffers的关系:

**Protocol Buffers 负责gRPC的结构化数据的序列化**

### 3. gRPC与HTTP2

> [HTTP/2](https://developers.google.com/web/fundamentals/performance/http2?hl=zh-cn)

让我们深入了解gRPC概念如何与HTTP/2概念相关。gRPC引入了三个新概念:channel、RPC和Message。三者之间的关系很简单:每个Channel可能有许多RPC，而每个RPC可能有许多Message。

![chanel和RPC和Message的关系](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/chanel%E5%92%8CRPC%E5%92%8CMessage%E7%9A%84%E5%85%B3%E7%B3%BB.png)

#### 3.1 gRPC如何关联HTTP/2

![gRPC与HTTP_2](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/gRPC%E4%B8%8EHTTP_2.png)

HTTP/2中的流在一个连接上允许多个并发会话,而gRPC的通过支持多个并发连接上的多个流扩展了这个概念。

> Channel: 表示和终端的一个虚拟链接

`Channel` 背后实际上可能有多个HTTP/2 连接。从上面关系图来看，一个RPC和一个HTTP/2连接相关联，rpc实际上是纯HTTP/2流。Message与rpc关联，并以HTTP/2数据帧的形式发送。

![RPC和Message和Frame](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/RPC%E5%92%8CMessage%E5%92%8CFrame.png)

> 消息是在数据帧之上分层的。一个数据帧可能有许多gRPC消息，或者如果一个gRPC消息非常大，它可能跨越多个数据帧。

#### 3.2 解析器和负载均衡

为了保持连接的alive、Healthy和利用，gRPC使用了许多组件，其中最重要的是名称解析器和负载平衡器。

- 解析器将名称转换为地址，然后将这些地址交给负载均衡器。

- 负载均衡器负责从这些地址创建连接，并在连接之间对rpc进行负载均衡。

![gRPC解析器和负载均衡](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/gRPC%E8%A7%A3%E6%9E%90%E5%99%A8%E5%92%8C%E8%B4%9F%E8%BD%BD%E5%9D%87%E8%A1%A1.png)

#### 3.3 连接的管理

配置完成后，gRPC将保持连接池(解析器和平衡器定义的)处于正常状态、处于活动状态和已使用状态。

当连接失败时，负载均衡器将开始使用最后已知的地址列表重新连接。同时，解析器将开始尝试重新解析主机名列表。这在许多场景中都很有用。例如，如果代理不再可达，我们希望解析器更新地址列表，使其不包含该代理的地址。再举一个例子:DNS条目可能会随着时间的推移而改变，因此可能需要定期更新地址列表。通过这种方式和其他方式，gRPC旨在实现长期弹性。

一旦解析完成，负载均衡器就会被告知新的地址。如果地址发生了变化，负载均衡器可能会关闭到新列表中不存在的地址的连接，或者创建到以前不存在的地址的连接。

> 连接也试用了池化

#### 3.4 失效连接识别

gRPC连接管理的有效性取决于它识别失败连接的能力。失效连接分为两种：

- 清除的失效连接---通讯失败（例如：连接失败）

  当端点有意终止连接时，可能会发生清除故障。例如，端点可能已经优雅地关闭，或者可能超过了计时器，从而提示端点关闭连接。当连接干净地关闭时，TCP语义就足够了:关闭连接会导致FIN握手。这将结束HTTP/2连接，从而结束gRPC连接。gRPC将立即开始重新连接。不需要额外的HTTP/2或gRPC语义。

- 不可清除的失效连接（复杂的网络环境）

  endpoint死亡或挂起而不通知客户端。在这种情况下，TCP可能会在认为连接失败之前进行长达10分钟的重试。当然，没有意识到连接已死10分钟是不可接受的。gRPC使用HTTP/2语义解决了这个问题:当配置KeepAlive时，gRPC会定期发送HTTP/2 PING帧。这些帧绕过流量控制，用来建立连接是否有效。如果PING响应没有及时返回，gRPC将认为连接失败，关闭连接，并开始重新连接

通过这种方式，gRPC保持连接池的健康状态，并定期使用HTTP/2来确定连接的健康状态。

#### 3.5 Alive保持

通过发送HTTP/2 PING来定期检查连接的健康状况，以确定连接是否仍然活着

> **gRPC与HTTP/2的关系：HTTP/2为长连接、实时的通信流提供了基础。gRPC建立在这个基础之上，具有连接池、健康语义、高效使用数据帧和多路复用以及KeepAlive，gRPC的通讯基石就是HTTP/2**

### 4. gRPC的应用

现在gRPC在很多项目中都有应用

- Nacos(2.x)
- Dubbo(3.x)
- Apache RocketMQ（5.x）

有兴趣的可以研究一下对应项目的源码

### 5. 总结

- gRPC是一个高可用的 **`跨平台`** 的RPC框架
- gRPC数据序列化是通过Protobuf Buffers,数据传输基于HTTP/2
- HTTP/2的语义提供给gRPC的长连接和实时的通讯，以及其他的HTTP/2的特性