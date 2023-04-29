---
title: "OpenTelemetry入门-Signals"
linkTitle: "OpenTelemetry入门-Signals"
weight: 202303111427
description: OpenTelemetry的Signals
---

## 1. 什么是Signal

在OpenTelemetry中，信号（Signal）指的是遥测的一类。下面来了解一下OpenTelemetry支持的遥测数据。

- **Traces**
- **Logs**
- **Metrics** 
- **Baggage** 

## 2. Traces

追踪可以为我们提供当用户或应用程序发出请求时会发生什么的整体情况。OpenTelemetry 通过跟踪我们的微服务和相关应用程序，为我们提供了一种在生产环境中将可观性实现到我们的代码中的方式。样例如下：

```json
{
    "name": "Hello-Greetings",
    "context": {
        "trace_id": "0x5b8aa5a2d2c872e8321cf37308d69df2",
        "span_id": "0x5fb397be34d26b51",
    },
    "parent_id": "0x051581bf3cb55c13",
    "start_time": "2022-04-29T18:52:58.114304Z",
    "end_time": "2022-04-29T22:52:58.114561Z",
    "attributes": {
        "http.route": "some_route1"
    },
    "events": [
        {
            "name": "hey there!",
            "timestamp": "2022-04-29T18:52:58.114561Z",
            "attributes": {
                "event_attributes": 1
            }
        },
        {
            "name": "bye now!",
            "timestamp": "2022-04-29T18:52:58.114585Z",
            "attributes": {
                "event_attributes": 1
            }
        }
    ],
}
```

为了理解 OpenTelemetry 中追踪是如何工作的，让我们看一下一个组件列表，这些组件将在仪器化我们的代码中发挥作用：

- **Tracer**

  Tracer创建包含有关给定操作（例如服务中的请求）正在发生的更多信息的跨度。Tracer是由Tracer Provider创建的。

- **Tracer Provider**

  在大多数应用程序中，Tracer Provider只会初始化一次，其生命周期与应用程序的生命周期相匹配。Tracer Provider初始化还包括Resource和Exporter的初始化。

- **Trace Exporter**

  将跟踪发送到消费者。此消费者可以是用于调试和开发时间的标准输出，也可以是OpenTelemetry Collector或您选择的任何开源或供应商后端。例如：Prometheus

- **Trace Context**

## 3. Metrics

**Metrics：**是在运行时捕获的有关服务的测量。逻辑上，捕获其中一项测量的时刻被称为指标事件，它不仅包括测量本身，还包括捕获时间和相关元数据。应用程序和请求指标是可用性和性能的重要指标。自定义指标可以提供有关可用性指标如何影响用户体验或业务的见解。收集的数据可用于警报停机或在高需求时自动触发调度决策以扩展部署。

### 3.1 OpenTelemetry三个指标

#### 3.1.1 counter

随着时间的推移总和增加的值 - 您可以将其视为汽车上的里程表；它只会增加。 这种在生活中还有很多例如：飞机的耗油量

#### 3.1.2 measure

度量：随着时间的推移汇总的值。这更类似于汽车上的旅行里程表，它代表一定范围内的值。

#### 3.1.3 observer

在特定时间点捕获一组当前值，比如计算机的某一时刻的使用内存量

除了这三个指标工具外，了解聚合的概念也很重要。聚合是一种技术，将大量的测量组合成有关在时间窗口内发生的指标事件的确切或估计统计数据。OpenTelemetry API本身不允许您指定这些聚合，但提供了一些默认的聚合。通常，OpenTelemetry SDK提供常见的聚合（例如求和、计数、最后一个值和直方图），这些聚合受到可视化工具和遥测后端的支持。

指标旨在提供聚合的统计信息。一些指标用例的例子包括：

- 报告服务按协议类型读取的字节数总数。 
- 报告按请求读取的字节数总数和每个请求的字节数。 
- 报告系统调用的持续时间。 
- 报告请求大小以确定趋势。 
- 报告进程的CPU或内存使用情况。 
- 报告帐户的平均余额值。 
- 报告正在处理的当前活动请求(当前节点的连接数)。

## 4. Logs

日志是一种带有时间戳的文本记录，可以是结构化的（建议使用）或非结构化的，并带有元数据。虽然日志是一种独立的数据源，但它们也可以附加到跨度上。在 OpenTelemetry 中，任何不是分布式跟踪或度量的一部分的数据都是日志。例如，事件是一种特定类型的日志。通常使用日志来确定问题的根本原因，并通常包含有关谁更改了什么以及更改的结果的信息。

平时开发中的日志一般是不带有Span的。

## 5. Baggage

在 OpenTelemetry 中，Baggage 是在跨度之间传递的上下文信息。它是一个键值存储，与跨度上下文一起存在于跟踪中，在该跟踪中创建的任何跨度都可以使用这些值。

例如，假设您想在跟踪中的每个跨度上都有一个 CustomerId 属性，这涉及多个服务；但是，CustomerId 只在一个特定的服务中可用。为了实现您的目标，您可以使用 OpenTelemetry Baggage 在整个系统中传播此值。

OpenTelemetry 使用上下文传播来传递 Baggage，并且每个不同的库实现都有传播器来解析和使该 Baggage 可用，无需您显式实现它。