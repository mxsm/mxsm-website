---
title: Spring Cloud Gateway-动态路由器实现
date: 2020-12-08
weight: 2
---

### 1 路由配置的两种方式

- **yml文件配置**

  yml文件配置可以参照官网的配置方式，精简的配置例子如下：

  ```yaml
  spring:
    cloud:
      gateway:
        routes:
        - id: after_route
          uri: https://example.org
          predicates:
          - Cookie=mycookie,mycookievalue
  ```

  完全的例子：

  ```yaml
  spring:
    cloud:
      gateway:
        routes:
        - id: after_route
          uri: https://example.org
          predicates:
          - name: Cookie
            args:
              name: mycookie
              regexp: mycookievalue
  ```

  [Spring Cloud Gateway官网的配置](https://docs.spring.io/spring-cloud-gateway/docs/2.2.5.RELEASE/reference/html/#configuring-route-predicate-factories-and-gateway-filter-factories)

- **代码**

  ```java
  @SpringBootApplication
  public class DemogatewayApplication {
  	@Bean
  	public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
  		return builder.routes()
  			.route("path_route", r -> r.path("/get")
  				.uri("http://httpbin.org"))
  			.route("host_route", r -> r.host("*.myhost.org")
  				.uri("http://httpbin.org"))
  			.route("rewrite_route", r -> r.host("*.rewrite.org")
  				.filters(f -> f.rewritePath("/foo/(?<segment>.*)", "/${segment}"))
  				.uri("http://httpbin.org"))
  			.route("hystrix_route", r -> r.host("*.hystrix.org")
  				.filters(f -> f.hystrix(c -> c.setName("slowcmd")))
  				.uri("http://httpbin.org"))
  			.route("hystrix_fallback_route", r -> r.host("*.hystrixfallback.org")
  				.filters(f -> f.hystrix(c -> c.setName("slowcmd").setFallbackUri("forward:/hystrixfallback")))
  				.uri("http://httpbin.org"))
  			.route("limit_route", r -> r
  				.host("*.limited.org").and().path("/anything/**")
  				.filters(f -> f.requestRateLimiter(c -> c.setRateLimiter(redisRateLimiter())))
  				.uri("http://httpbin.org"))
  			.build();
  	}
  }
  ```

  以编程的方式配置。

以上两种都是将路由写死，没有进行动态的加载。下面来看一下如何动态添加路由器。

### 2 动态路由

> spring cloud gateway的源码版本 2.2.6.RELEASE

动态路由可以通过配置来实现动态的加载。首先来通过源码分析一下路由的初始化过程。

![](https://github.com/mxsm/document/blob/master/image/Spring/SpringCloud/SpringCloudGateway/springcloud%E8%B7%AF%E7%94%B1%E5%8A%A0%E8%BD%BD%E5%99%A8%E6%BA%90%E7%A0%81.png?raw=true)

默认是从配置文件加载。这个也是官网的配置。路由的定义最终用 **`RouteDefinition`** 类进行封装。项目启动所有的路由都被加载装配，并且存到了内存中：

<a data-fancybox="gallery" href="https://github.com/mxsm/document/blob/master/image/Spring/SpringCloud/SpringCloudGateway/%E8%B7%AF%E7%94%B1%E5%8A%A0%E8%BD%BD%E5%88%B0%E5%86%85%E5%AD%98.png?raw=true"><img src="https://github.com/mxsm/document/blob/master/image/Spring/SpringCloud/SpringCloudGateway/%E8%B7%AF%E7%94%B1%E5%8A%A0%E8%BD%BD%E5%88%B0%E5%86%85%E5%AD%98.png?raw=true"></a>

添加的数据存储在内存中。在没有用户自定义的情况下会从文件配置中加载和内存中加载。在刚刚启动网关项目的内存总是没有任何路由的定义的。

> 只要实现RouteDefinitionRepository接口就能自定义加载存储位置了。

如何添加了？在[Spring Cloud gateway官网](https://docs.spring.io/spring-cloud-gateway/docs/2.2.6.RELEASE/reference/html/)上有现成的接口.

![](https://github.com/mxsm/document/blob/master/image/Spring/SpringCloud/SpringCloudGateway/gateway%E8%87%AA%E5%AE%9A%E4%B9%89%E6%8E%A5%E5%8F%A3.png?raw=true)

actuator api中包含了gateway的动态添加接口和查询接口：

![](https://github.com/mxsm/document/blob/master/image/Spring/SpringCloud/SpringCloudGateway/%E6%8E%A5%E5%8F%A3.png?raw=true)

> 当然也可以参照 GatewayControllerEndpoint 自己实现

本人比较懒用现成的就可以。结合上面的实现的存储位置就能实现动态的添加路由器了。

> 注意: 用接口/gateway/routes/{id_route_to_create} （POST）添加完成路由后，你立马调用/actuator/gateway/routes/{id} (GET) 是获取不到刚添加的路由。原因在于路由都是从缓存中获取。添加后需要调用/actuator/gateway/refresh (POST) 清除缓存。这样就能重新加载缓存获取到新加的路由器信息了。

