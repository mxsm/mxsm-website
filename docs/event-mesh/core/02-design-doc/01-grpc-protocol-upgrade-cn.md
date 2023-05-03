---
title: "EventMesh Grpc协议升级设计"
linkTitle: "EventMesh Grpc协议升级设计"
weight: 202304021002
description: EventMesh Grpc协议升级设计文档
---

## 1. 背景

当前EventMesh的GRPC协议的数据交互使用的的EventMesh自定义的的SimpleMessage协议，为了更好的支持CloudEvents规范现在对SimpleMessage协议进行改造，使用CloudEvents提供的Protobuf的格式协议。

## 2. 架构

SimpleMessage主要用于Grpc SDK与Runtime之间的数据交互，重新定义一个EventMesh的CloudEvent协议(完全兼容CloudEvents规范)替换SimpleMessage。

![eventmesh-sdk-grpc](https://raw.githubusercontent.com/mxsm/picture/main/eventmesh/core/design/eventmesh-sdk-grpc.png)

> Tips: 在CloudEvents的当前1.0.2的发布版本中，Protobuf格式增加批处理功能，但是对应的SDK暂时还没提供批处理的实现。

通过重新定义的EventMesh的CloudEvent协议来替换SimpleMessage协议，能够更好的实现CloudEvents的规范。

- SDK GRPC发送的消息有三类：EventMeshMessage，CloudEvent(CloudEvents规范)、Openmessage。将这三类消息通过转换器转换成EventMesh的CloudEvent的数据格式。
- 将上述的三类消息通过转化器转换成EventMesh自定义的CloudEvent protobuf格式的消息，在GRPC调用的时候进行传输
- Runtime接收到SDK发送的EventMesh自定义的CloudEvent protobuf格式的消息后对消息进行必要的校验，这里的校验包括CloudEvents规范的必须值，以及EventMesh需要校验的值。
- 校验通过后将数据转换成CloudEvent(CloudEvents规范)的数据，进行后续的数据处理。

> Tips: 自定义的EventMesh CloudEvent protobuf格式和CloudEvents的Protobuf的格式规范一样

## 3. 如何改造

### 3.1 数据协议改造

数据协议定义：

```protobuf
syntax = "proto3";

package org.apache.eventmesh.cloudevents.v1;

import "google/protobuf/any.proto";
import "google/protobuf/timestamp.proto";

option java_package = "org.apache.eventmesh.common.protocol.grpc.cloudevents";
option java_multiple_files = true;
option java_outer_classname = "EventMeshCloudEvents";


message CloudEvent {

  // -- CloudEvent Context Attributes

  // Required Attributes
  string id = 1;
  string source = 2; // URI-reference
  string spec_version = 3;
  string type = 4;

  // Optional & Extension Attributes
  map<string, CloudEventAttributeValue> attributes = 5;

  // -- CloudEvent Data (Bytes, Text, or Proto)
  oneof  data {
    bytes binary_data = 6;
    string text_data = 7;
    google.protobuf.Any proto_data = 8;
  }

  /**
   * The CloudEvent specification defines
   * seven attribute value types...
   */

  message CloudEventAttributeValue {

    oneof attr {
      bool ce_boolean = 1;
      int32 ce_integer = 2;
      string ce_string = 3;
      bytes ce_bytes = 4;
      string ce_uri = 5;
      string ce_uri_ref = 6;
      google.protobuf.Timestamp ce_timestamp = 7;
    }
  }
}

/**
 * CloudEvent Protobuf Batch Format
 *
 */

message CloudEventBatch {
  repeated CloudEvent events = 1;
}
```

定义的数据协议和CloudEvents的1.0.2规范完全相同.

### 3.2 服务协议改造

```protobuf
syntax = "proto3";

package org.apache.eventmesh.cloudevents.v1;

import "google/protobuf/empty.proto";
import "eventmesh-cloudevents.proto";

option java_package = "org.apache.eventmesh.common.protocol.grpc.cloudevents";
option java_multiple_files = true;
option java_outer_classname = "EventMeshGrpcService";


service PublisherService {
  //publish event
  rpc publish(CloudEvent) returns (CloudEvent);

  //publish event with reply
  rpc publishReply(CloudEvent) returns (CloudEvent);

  //publish event one way
  rpc publishOneWay(CloudEvent) returns (google.protobuf.Empty);

  // publish batch event
  rpc batchPublish(CloudEventBatch) returns (CloudEvent);

  //publish batch event one way
  rpc batchPublishOneWay(CloudEventBatch) returns (google.protobuf.Empty);
}

service ConsumerService {
  // The subscribed event will be delivered by invoking the webhook url in the Subscription
  rpc subscribe(CloudEvent) returns (CloudEvent);

  //  The subscribed event will be delivered through stream of Message
  rpc subscribeStream(stream CloudEvent) returns (stream CloudEvent);

  rpc unsubscribe(CloudEvent) returns (CloudEvent);
}

service HeartbeatService {
  rpc heartbeat(CloudEvent) returns (CloudEvent);
}
```

### 3.3 SDK的升级改造

- SDK对外的接口`EventMeshGrpcProducer`和`EventMeshGrpcConsumer`无需改动(包括发布和订阅)，只需要增加一个转换器将EventMeshMessage，CloudEvent(CloudEvents规范)、Openmessage三类消息转换成自定义的CloudEvent的Protobuf格式的数据即可。
- 因为Grpc的服务参数有改动，所以需要对SDK的Grpc的Sub进行相对应的改动。

### 3.4 Runtime GRPC的升级改造

- 重构整个发布和订阅的处理逻辑，增加统一数据校验和权限校验，以及数据的处理，包括重构以下处理类：

  - ProducerService： 处理发布请求
  - ConsumerService： 处理消费请求
  - HeartbeatService： 处理心跳请求

  将数据校验权限校验进行统一处理。

- 增加转换器将EventMesh的CloudEvent Protobuf协议数据转换成CloudEvents规范的数据

## 4. 兼容性问题

- 使用自定义的CloudEvent协议能够很好的对CloudEvents的标准协议进行兼容。
- EventMesh从低版本升级到高版本无数据的兼容性问题。
