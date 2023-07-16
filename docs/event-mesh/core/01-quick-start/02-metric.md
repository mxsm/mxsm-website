EventMesh以OpenTelemetry Metrics规范Prometheus 格式公开以下指标，你可以使用这些指标监控EvenMesh集群。

- EventMesh Runtime Grpc指标
- EventMesh Runtime HTTP指标
- EventMesh Runtime TCP指标

## Metrics指标详情

### Metrics指标类型

EventMesh完全遵循OpenTelemetry Metrics规范，提供Metrics的类型有：

- **Counter**
- **Gauge**
- **Histogram**

更多信息，请参考[指标](https://opentelemetry.io/docs/concepts/signals/metrics/)

### 通用指标

#### 通用指标的Label说明

- rpc.system：RPC系统类型

  grpc，tcp，http/https

- rpc.service：服务名称

  EventMeshGrpcServer，EventMeshHTTPServer，EventMeshTCPServer

- client.protocol.type: 客户端协议类型

  TCP，HTTP，GRPC

- client.address: 客户端地址

#### Grpc指标特有的Lable说明

- net.peer.name： grpc地址
- net.peer.port： grpc端口

#### TCP指标特有的Lable说明

- net.host.name: TCP服务的IP地址
- net.host.port：TCP服务的端口

#### 通用具体指标

| 指标类型 | 指标名称                                       | 单位 | 指标说明                        |
| -------- | ---------------------------------------------- | ---- | ------------------------------- |
| Counter  | eventmesh.general.client.eventmesh.message.num | 1    | 客户端发送到EventMesh的消息数量 |
| Gauge    | eventmesh.general.eventmesh.mq.message.num     | 1    | EventMesh发送到MQ的消息数量     |
| Gauge    | eventmesh.general.mq.eventmesh.message.num     | 1    | MQ发送到EventMesh的消息数量     |
| Gauge    | eventmesh.general.eventmesh.client.message.num | 1    | EventMesh发送到客户端的消息数量 |

### Grpc指标

指标名称在代码中是以**`.`** 作为分隔，在Prometheus中会替换成下划线(_)

#### Grpc指标的Lable说明

- net.peer.name:  Grpc服务IP地址
- net.peer.port：Grpc服务端口地址
- rpc.system： RPC系统， grpc
- rpc.service: 服务名称，EventMeshGrpcServer

#### Grpc具体指标

| 指标类型 | 指标名称                            | 单位 | 指标说明                           |
| -------- | ----------------------------------- | ---- | ---------------------------------- |
| Gauge    | eventmesh.grpc.sub.topic.num        | 1    | Grpc客户端订阅的主题数量           |
| Gauge    | eventmesh.grpc.client.eventmesh.tps | tps  | Grpc客户端发送到EventMesh消息的TPS |
| Gauge    | eventmesh.grpc.eventmesh.client.tps | tps  | EventMesh发送到Grpc客户端的TPS     |
| Gauge    | eventmesh.grpc.eventmesh.mq.tps     | tps  | EventMesh发送到MQ的消息TPS         |
| Gauge    | eventmesh.grpc.mq.eventmesh.tps     | tps  | EventMesh消费MQ的消息的TPS         |
| Gauge    | eventmesh.grpc.retry.queue.size     | 1    | 重试队列的大小                     |

### HTTP指标

#### HTTP指标的Lable说明

- http.scheme: HTTP的协议

  https，http

- http.flavor：HTTP的协议版本

  默认1.1版本

- net.host.name： HTTP服务的IP地址

- net.host.port：HTTP服务的端口

- rpc.system： RPC系统， HTTP

- rpc.service: 服务名称，EventMeshHTTPServer

#### HTTP具体指标

| 指标类型 | 指标名称                                      | 单位 | 指标说明                         |
| -------- | --------------------------------------------- | ---- | -------------------------------- |
| Counter  | eventmesh.http.request.discard.num            | 1    | 丢弃的消息数量                   |
| Counter  | eventmesh.http.batch.send.message.num         | 1    | HTTP客户端发送的批量消息数量     |
| Counter  | eventmesh.http.batch.send.message.fail.num    | 1    | HTTP客户端发送批量消息失败的数量 |
| Counter  | eventmesh.http.batch.send.message.discard.num | 1    | HTTP客户端发送批量消息丢弃的数量 |
| Counter  | eventmesh.http.send.message.num               | 1    | HTTP客户端发送消息数量           |
| Counter  | eventmesh.http.send.message.fail.num          | 1    | HTTP客户端发送消息失败数量       |
| Counter  | eventmesh.http.reply.message.num              | 1    | 回复消息数量                     |
| Counter  | eventmesh.http.reply.message.fail.num         | 1    | 回复消息失败的数量               |
| Counter  | eventmesh.http.push.message.num               | 1    | HTTP push的消息数量              |
| Counter  | eventmesh.http.push.message.fail.num          | 1    | HTTP push失败消息数量            |
| Gauge    | eventmesh.http.body.decode.cost.avg           | ms   | 消息Body解码平均耗时             |
| Gauge    | eventmesh.http.request.tps.max                | tps  | HTTP 请求最大TPS                 |
| Gauge    | eventmesh.http.request.tps.avg                | tps  | HTTP 请求的平均TPS               |
| Gauge    | eventmesh.http.request.cost.max               | ms   | HTTP处理最大耗时                 |
| Gauge    | eventmesh.http.request.cost.avg               | ms   | HTTP处理平均耗时                 |
| Gauge    | eventmesh.http.batch.send.message.tps.max     | tps  | HTTP 发送批量消息最大TPS         |
| Gauge    | eventmesh.http.batch.send.message.tps.avg     | tps  | HTTP 发送批量消息平均TPS         |
| Gauge    | eventmesh.http.batch.send.message.fail.rate   | %    | 发送批量消息失败率               |
| Gauge    | eventmesh.http.send.message.tps.max           | tps  | 发送消息最大的tps                |
| Gauge    | eventmesh.http.send.message.tps.avg           | tps  | 发送消息的平均tps                |
| Gauge    | eventmesh.http.send.message.fail.rate         | %    | 发送消息的失败率                 |
| Gauge    | eventmesh.http.push.message.tps.max           | tps  | Push消息的最大TPS                |
| Gauge    | eventmesh.http.push.message.tps.avg           | tps  | Push消息的平均TPS                |
| Gauge    | eventmesh.http.push.message.fail.rate         | %    | Push消息的失败率                 |
| Gauge    | eventmesh.http.push.latency.max               | ms   | Push消息最大的延迟               |
| Gauge    | eventmesh.http.push.latency.avg               | ms   | Push消息平均的延迟               |
| Gauge    | eventmesh.http.batch.message.queue.size       | 1    | 批量消息处理线程池队列剩余大小   |
| Gauge    | eventmesh.http.send.message.queue.size        | 1    | 发送消息处理线程池队列剩余大小   |
| Gauge    | eventmesh.http.push.message.queue.size        | 1    | Push消息处理线程池队列剩余大小   |
| Gauge    | eventmesh.http.retry.queue.size               | 1    | 重试队列剩余大小                 |
| Gauge    | eventmesh.http.batch.send.message.cost.avg    | ms   | 发送批量消息平均耗时             |
| Gauge    | eventmesh.http.send.message.cost.avg          | ms   | 发送消息平均耗时                 |
| Gauge    | eventmesh.http.reply.message.cost.avg         | ms   | 回复消息的平均耗时               |

### TCP指标

#### TCP指标的Lable说明

- net.host.name:  TCP服务IP地址
- net.host.port：TCP服务端口地址
- rpc.system： RPC系统， TCP
- rpc.service: 服务名称，EventMeshTCPServer

#### TCP具体指标

| 指标类型 | 指标名称                           | 单位 | 指标说明                      |
| -------- | ---------------------------------- | ---- | ----------------------------- |
| Gauge    | eventmesh.tcp.connection.num       | 1    | TCP客户端连接数量             |
| Gauge    | eventmesh.tcp.sub.topic.num        | 1    | TCP客户端订阅的主题数量       |
| Gauge    | eventmesh.tcp.client.eventmesh.tps | tps  | TCP客户端发送到EventMesh的TPS |
| Gauge    | eventmesh.tcp.eventmesh.client.tps | tps  | EventMesh推送到TCP客户端的TPS |
| Gauge    | eventmesh.tcp.eventmesh.mq.tps     | tps  | EventMesh发送到MQ的TPS        |
| Gauge    | eventmesh.tcp.mq.eventmesh.tps     | tps  | MQ推送到EventMesh的TPS        |
| Gauge    | eventmesh.tcp.retry.queue.size     | 1    | TCP重试队列剩余的大小         |

## 指标的获取方式

前提条件 在开始之前，请确保满足以下前提条件：

- 已经安装和配置了 Prometheus 监控系统。
- 已经部署和运行了 EventMesh 实例。

配置 EventMesh 导出 Prometheus Metrics 为了使 EventMesh 导出 Prometheus Metrics，需要进行以下配置步骤：

- 在 EventMesh 的启动配置文件eventmesh.properties中，添加以下配置项：

  ```properties
  eventMesh.metrics.plugin=prometheus
  ```

  表示使用 Prometheus 导出器。

- 在prometheus.properties配置文件中配置：

  ```properties
  eventMesh.metrics.prometheus.port=19090
  ```

  表示导出器监听的端口号

可视化和分析 Prometheus Metrics 使用 Prometheus 监控系统，您可以将收集的指标数据可视化和分析。通过以下步骤可以实现：

- 打开 Prometheus Web 界面，通常为 `http://prometheus-host:9090`（`prometheus-host` 是 Prometheus 实例的主机名或 IP 地址）。
- 在查询表达式中，输入感兴趣的指标名称或标签，例如 `eventmesh_messages_received_total`。
- 选择适当的时间范围和聚合函数，点击“Execute”按钮执行查询。
- Prometheus 将显示查询结果的图表和数值数据，以及其他数据可视化和导出选项。

监控和性能优化 使用 EventMesh 导出的 Prometheus Metrics，您可以实时监控和分析以下关键指标，以进行性能优化和故障排除：

- 消息发送和接收的数量
- 消息处理延迟和吞吐量
- 连接数和连接状态
- 错误计数和异常情况

## 开发指引
