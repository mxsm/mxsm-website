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
| Gauge    | eventmesh.grpc.eventmesh.mq.tps     | tps  |                                    |
| Gauge    | eventmesh.grpc.mq.eventmesh.tps     | tps  |                                    |
| Gauge    | eventmesh.grpc.retry.queue.size     | tps  |                                    |

