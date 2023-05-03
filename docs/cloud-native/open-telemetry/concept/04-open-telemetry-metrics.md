---
title: "OpenTelemetry-Metrics(指标)"
linkTitle: "OpenTelemetry-Metrics(指标)"
weight: 202303111427
description: OpenTelemetry-Metrics(指标)相关知识以及例子
---

## 1. OpenTelemetry Metrics类型

指标API定义了各种仪器。仪器记录测量值，这些值由指标SDK聚合并最终在进程外导出。仪器有同步和异步两种形式。同步仪器在发生时记录测量值。异步仪器注册回调，每次集合时调用一次，并在该时间点记录测量值。可用以下仪器：

- **LongCounter/DoubleCounter**：仅记录正值，具有同步和异步选项。对于计数诸如通过网络发送的字节数之类的内容非常有用。计数器测量默认按始终增加的单调总和聚合。
- **LongUpDownCounter/DoubleUpDownCounter**：记录正负值，具有同步和异步选项。对于计算上升和下降的内容非常有用，例如队列的大小。上下计数器测量默认按非单调总和聚合。
- **LongGauge/DoubleGauge**：使用异步回调测量瞬时值。对于记录不能跨属性合并的值非常有用，例如CPU利用率百分比。计量测量默认按计量表聚合。
- **LongHistogram/DoubleHistogram**：记录最有用于分析的测量值，例如作为直方图分布。没有异步选项可用。对于记录HTTP服务器处理请求所需的时间持续时间之类的内容非常有用。直方图测量默认按显式桶直方图聚合。

## 2. 手动仪表化步骤

引入Jar到项目

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="Maven" label="Maven" default>

```xml
<project>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>io.opentelemetry</groupId>
                <artifactId>opentelemetry-bom</artifactId>
                <version>1.24.0</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>io.opentelemetry</groupId>
            <artifactId>opentelemetry-api</artifactId>
        </dependency>
        <dependency>
            <groupId>io.opentelemetry</groupId>
            <artifactId>opentelemetry-sdk</artifactId>
        </dependency>
        <dependency>
            <groupId>io.opentelemetry</groupId>
            <artifactId>opentelemetry-exporter-otlp</artifactId>
        </dependency>
        <dependency>
            <groupId>io.opentelemetry</groupId>
            <artifactId>opentelemetry-semconv</artifactId>
            <version>1.24.0-alpha</version>
        </dependency>
    </dependencies>
</project>
```

  </TabItem>
  <TabItem value="Gradle" label="Gradle">

```groovy
dependencies {
    implementation 'io.opentelemetry:opentelemetry-api:1.24.0'
    implementation 'io.opentelemetry:opentelemetry-sdk:1.24.0'
    implementation 'io.opentelemetry:opentelemetry-exporter-otlp:1.24.0'
    implementation 'io.opentelemetry:opentelemetry-semconv:1.24.0-alpha'
}
```

  </TabItem>
</Tabs>

创建例子：

```java
//创建资源
Resource resource = Resource.getDefault()
  .merge(Resource.create(Attributes.of(ResourceAttributes.SERVICE_NAME, "logical-service-name")));

//创建TracerProvider
SdkTracerProvider sdkTracerProvider = SdkTracerProvider.builder()
  .addSpanProcessor(BatchSpanProcessor.builder(OtlpGrpcSpanExporter.builder().build()).build())
  .setResource(resource)
  .build();
//创建MeterProvider
SdkMeterProvider sdkMeterProvider = SdkMeterProvider.builder()
  .registerMetricReader(PeriodicMetricReader.builder(OtlpGrpcMetricExporter.builder().build()).build())
  .setResource(resource)
  .build();

//创建OpenTelemetry实例
OpenTelemetry openTelemetry = OpenTelemetrySdk.builder()
  .setTracerProvider(sdkTracerProvider)
  .setMeterProvider(sdkMeterProvider)
  .setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
  .buildAndRegisterGlobal();
```

## 3. OpenTelemetry Metrics导入Prometheus

下面写一个例子将OpenTelemetry Metrics导入Prometheus。我们这里需要增加一个导入

```xml
implementation("io.opentelemetry:opentelemetry-exporter-prometheus:1.23.1-alpha")
```

代码如下：

```java
public class OpenTelemetryTest {

    public static void main(String[] args) throws InterruptedException {

        Resource resource = Resource.getDefault().merge(Resource.create(Attributes.empty()));
        SdkMeterProvider build = SdkMeterProvider.builder().setResource(resource)
            .registerMetricReader(PrometheusHttpServer.builder().setPort(7070).build()).build();
        OpenTelemetrySdk openTelemetrySdk = OpenTelemetrySdk.builder().setMeterProvider(build).buildAndRegisterGlobal();

        Meter mxsm = openTelemetrySdk.getMeter("mxsm");
        MemoryMXBean mxb = ManagementFactory.getMemoryMXBean();
        AtomicLong  cc= new AtomicLong();
        mxsm.upDownCounterBuilder("process.runtime.jvm.memory.usage").setUnit("Bytes")
            .buildWithCallback(record -> record.record(Runtime.getRuntime().totalMemory(),Attributes.of(AttributeKey.stringKey("type"),"heap")));
        mxsm.upDownCounterBuilder("process.runtime.jvm.memory.usage_after_last_gc").setUnit("bytes").buildWithCallback(record->record.record(cc.longValue(), Attributes.of(AttributeKey.stringKey("type"),"heap")));
        LongCounter build1 = mxsm.counterBuilder("mxsm.qqq").setUnit("1").build();
        long i =1;
        for(; ;){
            cc.set(mxb.getHeapMemoryUsage().getUsed());
            build1.add(i);
            TimeUnit.SECONDS.sleep(1);
        }

    }

}
```

首先本地运行Prometheus。配置好相关配置。运行上面的程序然后打开Prometheus的控制台网页

![image-20230311224950073](https://raw.githubusercontent.com/mxsm/picture/main/eventmesh/core/quick-start/image-20230311224950073.png)

![image-20230311225006443](https://raw.githubusercontent.com/mxsm/picture/main/eventmesh/core/quick-start/image-20230311225006443.png)

更多语义转换的可以参照https://opentelemetry.io/docs/reference/specification/metrics/semantic_conventions/。

