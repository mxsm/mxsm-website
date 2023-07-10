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

### Grpc指标

| 指标类型 | 指标名称                            | 单位 | 指标说明                           |
| -------- | ----------------------------------- | ---- | ---------------------------------- |
| Gauge    | eventmesh.grpc.sub.topic.num        | 1    | Grpc客户端订阅的主题数量           |
| Gauge    | eventmesh.grpc.client.eventmesh.tps | tps  | Grpc客户端发送到EventMesh消息的TPS |
| Gauge    | eventmesh.grpc.eventmesh.client.tps | tps  | EventMesh发送到Grpc客户端的TPS     |
| Gauge    | eventmesh.grpc.eventmesh.mq.tps     | tps  | EventMesh发送到MQ的消息TPS         |
| Gauge    | eventmesh.grpc.mq.eventmesh.tps     | tps  | EventMesh消费MQ的消息的TPS         |
| Gauge    | eventmesh.grpc.retry.queue.size     | 1    | 重试队列的大小                     |

### HTTP指标

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

