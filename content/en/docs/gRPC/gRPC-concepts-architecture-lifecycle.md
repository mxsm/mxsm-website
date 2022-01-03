---
title: "gRPC的概念-图文并茂"
linkTitle: "gRPC的概念-图文并茂"
date: 2022-01-01
weight: 202201011641
---

之前在学习gRPC梳理了Protobuf Buffers和HTTP/2在gRPC中的作用和关系。接下来对gRPC的几个概念整理一下。

![image-20220101165554451](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/image-20220101165554451.png)

主要有两个：

- gRPC中如何定义一个服务

  gRPC使用的是 [Protocol Buffers](https://developers.google.com/protocol-buffers)作为接口定义语言

- RPC生命周期

### 1. 服务定义

gRPC使用的是 [Protocol Buffers](https://developers.google.com/protocol-buffers)作为接口定义语言，通过[Protocol Buffers](https://developers.google.com/protocol-buffers)来定义，下面以Java作为例子来定义一个

> [Protocol Buffers](https://developers.google.com/protocol-buffers)官网：https://developers.google.com/protocol-buffers

#### 1.1 定义一个proto文件

```protobuf
syntax = "proto3";

option java_multiple_files = true;
option java_package = "com.github.mxsm.grpc";

/*下面这一段来自gRPC官网，或者也可以自己定义，这里只是做一个演示*/
service HelloService {
  rpc SayHello (HelloRequest) returns (HelloResponse);
}

message HelloRequest {
  string greeting = 1;
}

message HelloResponse {
  string reply = 1;
}
```

> 文件的位置放在 **`src/main/proto`**（默认情况）

#### 1.2 pom.xml文件增加依赖和插件

```xml
<!-- gRPC依赖 -->
<dependency>
  <groupId>io.grpc</groupId>
  <artifactId>grpc-netty-shaded</artifactId>
  <version>1.43.1</version>
</dependency>
<dependency>
  <groupId>io.grpc</groupId>
  <artifactId>grpc-protobuf</artifactId>
  <version>1.43.1</version>
</dependency>
<dependency>
  <groupId>io.grpc</groupId>
  <artifactId>grpc-stub</artifactId>
  <version>1.43.1</version>
</dependency>
<dependency> <!-- necessary for Java 9+ -->
  <groupId>org.apache.tomcat</groupId>
  <artifactId>annotations-api</artifactId>
  <version>6.0.53</version>
  <scope>provided</scope>
</dependency>
```

上面就是增加了相关的gRPC依赖。

```xml
<build>
  <extensions>
    <extension>
      <groupId>kr.motd.maven</groupId>
      <artifactId>os-maven-plugin</artifactId>
      <version>1.6.2</version>
    </extension>
  </extensions>
  <plugins>
    <plugin>
      <groupId>org.xolstice.maven.plugins</groupId>
      <artifactId>protobuf-maven-plugin</artifactId>
      <version>0.6.1</version>
      <configuration>
        <protocArtifact>com.google.protobuf:protoc:3.19.1:exe:${os.detected.classifier}</protocArtifact>
        <pluginId>grpc-java</pluginId>
        <pluginArtifact>io.grpc:protoc-gen-grpc-java:1.43.1:exe:${os.detected.classifier}</pluginArtifact>
        <protoSourceRoot>${basedir}/src/main/resources</protoSourceRoot>
        <outputDirectory>src/main/java</outputDirectory>
      </configuration>
      <executions>
        <execution>
          <goals>
            <goal>compile</goal>
            <goal>compile-custom</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

这里增加的代码生成插件。

> 通过protoSourceRoot修改了proto文件的存放的位置，outputDirectory修改输出的位置。

![gRPC代码生成](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/gRPC%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90.gif)

通过动态图可以看出来，通过[Protocol Buffers](https://developers.google.com/protocol-buffers)定义出来了对应的接口。以及结构化的数据。

> 也可以参考Nacos定义的服务，看看开源服务是怎么样去定义的。文件地址：https://github.com/alibaba/nacos/blob/develop/api/src/main/proto/nacos_grpc_service.proto

### 2. 服务方法分类

gRPC能够让我们定义四类服务方法

#### 2.1 一元RPC

客户端发送一个单独的请求到服务器，然后服务器在返回一个单独响应给客户端

![一元RPC](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/%E4%B8%80%E5%85%83RPC.png)

这种就是客户端请求，然后等待服务器返回。

定义方式：

```protobuf
rpc SayHello(HelloRequest) returns (HelloResponse);
```



#### 2.2 服务器流式RPC

客户端向服务器发送请求，并获得一个流来读取一系列消息。客户端从返回的流中读取，直到没有更多的消息。gRPC保证单个RPC调用中的消息顺序

![服务器流式RPC](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%B5%81%E5%BC%8FRPC.png)

客户端请求一次，但是服务器通过流返回多个返回消息。

定义方式：

```protobuf
rpc LotsOfReplies(HelloRequest) returns (stream HelloResponse);
```

> Tips: 在返回的消息的前面使用 stream 关键字

#### 2.3 客户端流式RPC

其中客户端写入一系列消息并将它们发送到服务器，再次使用提供的流。一旦客户端完成了消息的写入，它就会等待服务器读取消息并返回响应。

![客户端流式RPC](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/%E5%AE%A2%E6%88%B7%E7%AB%AF%E6%B5%81%E5%BC%8FRPC.png)

定义方式：

```protobuf
rpc LotsOfGreetings(stream HelloRequest) returns (HelloResponse);
```

#### 2.4 双向流RPC

双方使用读写流发送一系列消息。两个流独立运作,因此客户端和服务器可以读和写在他们喜欢的任何顺序:例如,服务器可以等待收到所有客户端消息之前写的反应,也可以交替阅读一条消息然后写一个消息,或其他一些读写的结合。每个流中的消息顺序被保留。

![双向流](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/%E5%8F%8C%E5%90%91%E6%B5%81.png)

定义方式：

```protobuf
rpc BidiHello(stream HelloRequest) returns (stream HelloResponse);
```

> 服务定义在 **`.proto`** 文件中，gRPC提供了gRPC提供了生成客户端和服务器端代码的协议缓冲区编译器插件。gRPC在客户端调用定义的接口，在服务器端实现定义的相对应的接口
>
> - 在服务器端，服务器实现服务声明的方法，并运行gRPC服务器来处理客户端调用。gRPC基础设施对传入的请求进行解码，执行服务方法，并对服务响应进行编码。(RPC的调用过程)
> - 在客户端，客户端有一个称为存根的本地对象，它实现了与服务相同的方法。然后客户端可以在本地对象上调用这些方法，将调用的参数包装在适当的Protocol Buffers消息类型中——gRPC负责向服务器发送请求并返回服务器的Protocol Buffers响应。
>
> gRPC有同步和异步两种风格

### 3. RPC的生命周期

上面说了四种不同的RPC,每种RPC的生命周期也不一样，下面来看一下不同RPC的生命周期。

> 元数据是以键-值对列表的形式表示的关于特定RPC调用(比如身份验证细节)的信息，其中键是字符串，值通常是字符串，但也可以是二进制数据。元数据对于gRPC本身是不透明的——它让客户机提供与服务器调用相关联的信息，反之亦然。

#### 3.1 一元RPC生命周期

客户端发送一个请求并且等待服务器的返回。

1. 一旦客户机调用存根方法，服务器就会被通知，RPC已经被调用了，该调用使用客户机的元数据、方法名以及指定的截止日期等等
2. 服务器可以直接返回它自己的初始元数据(必须在任何响应之前发送)，或者等待客户机的请求消息
3. 一旦服务器获得了客户机的请求消息，它就会执行创建和填充响应所需的任何工作。然后将响应(如果成功)连同状态详细信息(状态代码和可选的状态消息)和可选的跟踪元数据返回给客户端
4. 如果响应状态为OK，则客户端将获得响应，从而完成客户端上的调用

![一元RPC生命周期](https://raw.githubusercontent.com/mxsm/picture/main/gRPC/%E4%B8%80%E5%85%83RPC%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F.png)

#### 3.2 服务器流RPC生命周期

服务器流RPC类似于一元RPC，不同之处是服务器返回响应客户机请求的消息流。在发送所有消息之后，服务器的状态详细信息(状态代码和可选的状态消息)和可选的跟踪元数据被发送到客户端。这就完成了服务器端的处理。客户端拥有服务器的所有消息后就完成了。

#### 3.3 客户端流RPC生命周期

客户端流RPC类似于一元RPC，不同之处是客户端向服务器发送消息流而不是单个消息。服务器用一条消息(以及它的状态详细信息和可选的跟踪元数据)响应，通常但不一定是在它收到所有客户端消息之后

#### 3.4 双向流RPC生命周期

在双向流RPC中，调用是由调用方法的客户机和接收客户机元数据、方法名和截止日期的服务器发起的。服务器可以选择发回其初始元数据或等待客户端开始流消息。客户端和服务器端流处理是特定于应用程序的。由于这两个流是独立的，客户端和服务器可以以任何顺序读写消息。例如,一个服务器可以等到它已经收到了客户的所有信息之前写它的消息,或者是服务器和客户端可以玩“乒乓球”——服务器收到一个请求,然后发回一个响应,然后根据响应客户端发送另一个请求,等等

#### 3.5 截止时间/过期时间

gRPC允许客户端指定在使用DEADLINE_EXCEEDED错误终止RPC之前，他们愿意等待RPC完成多长时间。在服务器端，服务器可以查询特定的RPC是否超时，或者还剩下多少时间来完成RPC。

#### 3.6 RPC终止

在gRPC中，客户端和服务器都对调用的成功做出独立的和本地的判断，它们的结论可能不匹配。这意味着，例如，您可以有一个RPC，它在服务器端成功完成(“我已经发送了我所有的响应!”)，但在客户端失败(“响应在我的截止日期之后到达!”)。服务器也可以在客户端发送完所有请求之前决定是否完成。

> 例如：web网页请求某一个后端的接口，但是还没又返回的时候前端已经关闭了连接。就在关闭连接没多久后端完成了处理这个接口并且准备返回数据。这个时候就会出现后端数据没法传输到前端。

### 4 什么是Channel?

gRPC通道提供到指定主机和端口的gRPC服务器的连接。它在创建客户端存根时使用。客户端可以指定通道参数来修改gRPC的默认行为，比如打开或关闭消息压缩。通道有状态，包括已连接和空闲。