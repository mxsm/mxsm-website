---
title: "Logback MDC"
linkTitle: "Logback MDC"
date: 2021-12-21
weight: 202112211703

---

在我去开发 [mxsm-log4j](https://github.com/mxsm/mxsm-log4j)项目之前，对于日志记录只是停留在会用的基础上，集成到项目。等到写了这个项目发现需要更好的去了解日志记录的一些接口和一些具体的细节。然后看到了MDC这个概念。所以决定深入的了解和记录一下

### 1. MDC(Mapped Diagnostic Context)

**`MDC`** 是 **`Mapped Diagnostic Context`** 的简称。 在[SLF4J的官网](https://www.slf4j.org/manual.html)给出的解释总结一下就是：接口是由SLF4J提供。但是具体的实现取决于具体的日志系统。例如大多数现实世界的分布式系统都需要同时处理多个客户机。在此类系统的典型多线程实现中，不同的线程将处理不同的客户端。区分一个客户机和另一个客户机的日志记录输出的一种可能但不太理想的方法是为每个客户机实例化一个新的独立的日志记录器。这种技术促进了记录器的激增，并可能增加它们的管理开销。MDC就很好的处理这一点。

> Tips: 目前只有Log4j和Logback支持MDC

- MDC 主要用于保存上下文，区分不同的请求来源

### 2. MDC类

```java
public class MDC {
    //省略了部分代码
    
  //Put a context value as identified by key
  //into the current thread's context map.
  public static void put(String key, String val);

  //Get the context identified by the key parameter.
  public static String get(String key);

  //Remove the context identified by the key parameter.
  public static void remove(String key);

  //Clear all entries in the MDC.
  public static void clear();
}
```

**`MDC`** 主要是是通过调用 **`MDCAdapter`** 接口的实现。 也就是在SLF4J的日志记录实现要支持MDC就需要实现 **`MDCAdapter`** 接口。

### 3. Logback的MDC支持

```java
public class LogbackMDCAdapter implements MDCAdapter {
    //省略代码
}
```

logback 的 MDC是基于每个线程进行管理的。注意，**子线程不会继承父线程的MDC**。

> Tips: log4j2的MDC 子线程会自动继承父线程的MDC

下面看一下官网的例子（https://github.com/qos-ch/logback/blob/master/logback-examples/src/main/java/chapters/mdc/SimpleMDC.java）：

```java
package chapters.mdc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import ch.qos.logback.classic.PatternLayout;
import ch.qos.logback.core.ConsoleAppender;

public class SimpleMDC {
  static public void main(String[] args) throws Exception {

    // You can put values in the MDC at any time. Before anything else
    // we put the first name
    MDC.put("first", "Dorothy");

    //[ SNIP ]
    
    Logger logger = LoggerFactory.getLogger(SimpleMDC.class);
    // We now put the last name
    MDC.put("last", "Parker");

    // The most beautiful two words in the English language according
    // to Dorothy Parker:
    logger.info("Check enclosed.");
    logger.debug("The most beautiful two words in English.");

    MDC.put("first", "Richard");
    MDC.put("last", "Nixon");
    logger.info("I am not a crook.");
    logger.info("Attributed to the former US president. 17 Nov 1973.");
  }

  //[ SNIP ]

}
```

假设Logback配置文件是这样配置的:

```xml
<appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender"> 
  <layout>
    <Pattern>%X{first} %X{last} - %m%n</Pattern>
  </layout> 
</appender>
```

输出的结果：

```shell
Dorothy Parker - Check enclosed.
Dorothy Parker - The most beautiful two words in English.
Richard Nixon - I am not a crook.
Richard Nixon - Attributed to the former US president. 17 Nov 1973.
```

#### 4. MDC具体应用

映射诊断上下文在客户端服务器架构中最为突出。通常，服务器上的多个线程将为多个客户机提供服务。尽管MDC类中的方法是静态的，但诊断上下文是按每个线程管理的，这允许每个服务器线程具有不同的MDC戳。像put()和get()这样的MDC操作只影响当前线程的MDC，以及当前线程的子线程。其他线程中的MDC不受影响。假定MDC信息是在每个线程的基础上进行管理的，那么每个线程都将拥有自己的MDC副本。因此，在使用MDC编程时，开发人员不需要担心线程安全或同步问题，因为它可以安全且透明地处理这些问题。

#### 4.1 获取用户的名称

例子参照 https://github.com/qos-ch/logback/blob/master/logback-examples/src/main/java/chapters/mdc/UserServletFilter.java。

正如我们所看到的，MDC在处理多个客户端时非常有用。对于管理用户身份验证的web应用程序，一个简单的解决方案是在MDC中设置用户名，并在用户退出时删除该用户名。不幸的是，使用这种技术并不总是能够获得可靠的结果。由于MDC在每个线程的基础上管理数据，因此回收线程的服务器可能会导致MDC中包含错误信息。

要使MDC中包含的信息在处理请求时始终正确，一种可能的方法是在进程开始时存储用户名，并在该进程结束时删除该用户名。在这种情况下，servlet Filter就派上用场了。

在servlet过滤器的doFilter方法中，我们可以通过请求(或其中的cookie)检索相关的用户数据，并将其存储在MDC中。其他过滤器和servlet的后续处理将自动受益于先前存储的MDC数据。最后，当servlet过滤器重新获得控制权时，我们就有机会清理MDC数据。

#### 4.2 对于Web项目获取请求地址等

在logback的中有实现就是 **`MDCInsertingServletFilter`** 。将uri,客户端请求地址等一些数据存入MDC。具体的一些值如下：

![image-20211221225852196](https://raw.githubusercontent.com/mxsm/picture/main/java/test/image-20211221225852196.png)

spring boot的配置：

```java
@Configuration
public class MonitoringConfig {

    @Bean
        FilterRegistrationBean<MDCInsertingServletFilter> mdcFilterRegistrationBean() {
        FilterRegistrationBean<MDCInsertingServletFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new MDCInsertingServletFilter());
        registrationBean.addUrlPatterns("/*");
        registrationBean.setOrder(Integer.MIN_VALUE);
        return registrationBean;
    }
}
```

> Tpis: 工作线程不能总是从发起线程继承映射的诊断上下文的副本。这就是java.util.concurrent. executor用于线程管理时的情况。例如，newCachedThreadPool方法创建了一个ThreadPoolExecutor，和其他线程池代码一样，它有复杂的线程创建逻辑。在这种情况下，建议在将任务提交给执行器之前在原始(主)线程上调用MDC.getCopyOfContextMap()。当任务运行时，作为它的第一个操作，它应该调用MDC. setcontextmapvalues()来将原始MDC值的存储副本与新的Executor托管线程关联起来。

具体的使用过程可用参考 [mxsm-log4j](https://github.com/mxsm/mxsm-log4j) 这个项目(争取把这个做到一个开箱即用的地步，后续会把项目的jar包发布到maven的中央仓库，需要等一段时间)。

参考资料：

- https://logback.qos.ch/manual/mdc.html
- https://github.com/qos-ch/logback