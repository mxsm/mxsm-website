---
title: ReferenceConfig分析
categories:
  - RPC
  - Dubbo
  - 源码解析
tags:
  - RPC
  - Dubbo
  - 源码解析
abbrlink: c2b11d2
date: 2019-03-25 02:54:32
---
###  ReferenceConfig代码分析

首先看一下 **`ReferenceConfig`** 继承关系：

![图](https://github.com/mxsm/document/blob/master/image/RPC/Dubbo/ReferenceConfig.png?raw=true)

看一下代码调用：

```java
import org.apache.dubbo.rpc.config.ApplicationConfig;
import org.apache.dubbo.rpc.config.RegistryConfig;
import org.apache.dubbo.rpc.config.ConsumerConfig;
import org.apache.dubbo.rpc.config.ReferenceConfig;
import com.xxx.XxxService;
 
// 当前应用配置
ApplicationConfig application = new ApplicationConfig();
application.setName("yyy");
 
// 连接注册中心配置
RegistryConfig registry = new RegistryConfig();
registry.setAddress("10.20.130.230:9090");
registry.setUsername("aaa");
registry.setPassword("bbb");
 
// 注意：ReferenceConfig为重对象，内部封装了与注册中心的连接，以及与服务提供方的连接
 
// 引用远程服务
ReferenceConfig<XxxService> reference = new ReferenceConfig<XxxService>(); // 此实例很重，封装了与注册中心的连接以及与提供者的连接，请自行缓存，否则可能造成内存和连接泄漏
reference.setApplication(application);
reference.setRegistry(registry); // 多个注册中心可以用setRegistries()
reference.setInterface(XxxService.class);
reference.setVersion("1.0.0");
 
// 和本地bean一样使用xxxService
XxxService xxxService = reference.get(); // 注意：此代理对象内部封装了所有通讯细节，对象较重，请缓存复用
```

直接从 **`reference.get()`** 开始分析

```java
    public synchronized T get() {
        //检查配置
        checkAndUpdateSubConfigs();

        if (destroyed) {
            throw new IllegalStateException("The invoker of ReferenceConfig(" + url + ") has already destroyed!");
        }
        if (ref == null) {
            //不存在进行初始化
            init();
        }
        return ref;
    }
```

如要存在两个方法：

- **`checkAndUpdateSubConfigs()`**

  检查配置

- **`init()`**

  ```java
      private void init() {
          //判断是否已经初始化
          if (initialized) {
              return;
          }
          initialized = true;
          //本地检查
          checkStubAndLocal(interfaceClass);
          //检查Mock
          checkMock(interfaceClass);
          Map<String, String> map = new HashMap<String, String>();
  
          map.put(Constants.SIDE_KEY, Constants.CONSUMER_SIDE);
          //追加运行时参数
          appendRuntimeParameters(map);
          //检测是否为泛化接口
          if (!isGeneric()) {
              String revision = Version.getVersion(interfaceClass, version);
              if (revision != null && revision.length() > 0) {
                  map.put("revision", revision);
              }
  
              String[] methods = Wrapper.getWrapper(interfaceClass).getMethodNames();
              if (methods.length == 0) {
                  logger.warn("No method found in service interface " + interfaceClass.getName());
                  map.put("methods", Constants.ANY_VALUE);
              } else {
                  map.put("methods", StringUtils.join(new HashSet<String>(Arrays.asList(methods)), ","));
              }
          }
          map.put(Constants.INTERFACE_KEY, interfaceName);
          appendParameters(map, application);
          appendParameters(map, module);
          appendParameters(map, consumer, Constants.DEFAULT_KEY);
          appendParameters(map, this);
          Map<String, Object> attributes = null;
          if (CollectionUtils.isNotEmpty(methods)) {
              attributes = new HashMap<String, Object>();
              for (MethodConfig methodConfig : methods) {
                  appendParameters(map, methodConfig, methodConfig.getName());
                  String retryKey = methodConfig.getName() + ".retry";
                  if (map.containsKey(retryKey)) {
                      String retryValue = map.remove(retryKey);
                      if ("false".equals(retryValue)) {
                          map.put(methodConfig.getName() + ".retries", "0");
                      }
                  }
                  attributes.put(methodConfig.getName(), convertMethodConfig2AyncInfo(methodConfig));
              }
          }
  
          String hostToRegistry = ConfigUtils.getSystemProperty(Constants.DUBBO_IP_TO_REGISTRY);
          if (StringUtils.isEmpty(hostToRegistry)) {
              hostToRegistry = NetUtils.getLocalHost();
          }
          map.put(Constants.REGISTER_IP_KEY, hostToRegistry);
          //创建代理类
          ref = createProxy(map);
  
          ApplicationModel.initConsumerModel(getUniqueServiceName(), buildConsumerModel(attributes));
      }
  
  ```

  初始化的步骤：

  1. **判断是否已经初始化**

  2. **各种参数的检查**

  3. **创建动态代理类**

     创建代理类方式有两种：

     - **`JavassistProxyFactory`**

       ```java
       public class JavassistProxyFactory extends AbstractProxyFactory {
       
           @Override
           @SuppressWarnings("unchecked")
           public <T> T getProxy(Invoker<T> invoker, Class<?>[] interfaces) {
               return (T) Proxy.getProxy(interfaces).newInstance(new InvokerInvocationHandler(invoker));
           }
       
           @Override
           public <T> Invoker<T> getInvoker(T proxy, Class<T> type, URL url) {
               // TODO Wrapper cannot handle this scenario correctly: the classname contains '$'
               final Wrapper wrapper = Wrapper.getWrapper(proxy.getClass().getName().indexOf('$') < 0 ? proxy.getClass() : type);
               return new AbstractProxyInvoker<T>(proxy, type, url) {
                   @Override
                   protected Object doInvoke(T proxy, String methodName,
                                             Class<?>[] parameterTypes,
                                             Object[] arguments) throws Throwable {
                       return wrapper.invokeMethod(proxy, methodName, parameterTypes, arguments);
                   }
               };
           }
       
       }
       ```

       

     - **`JdkProxyFactory`**

       ```java
       public class JdkProxyFactory extends AbstractProxyFactory {
       
           //JDK获取代理类
           @Override
           public <T> T getProxy(Invoker<T> invoker, Class<?>[] interfaces) {
               return (T) Proxy.newProxyInstance(Thread.currentThread().getContextClassLoader(), interfaces, new InvokerInvocationHandler(invoker));
           }
       
           @Override
           public <T> Invoker<T> getInvoker(T proxy, Class<T> type, URL url) {
               return new AbstractProxyInvoker<T>(proxy, type, url) {
                   @Override
                   protected Object doInvoke(T proxy, String methodName,
                                             Class<?>[] parameterTypes,
                                             Object[] arguments) throws Throwable {
                       Method method = proxy.getClass().getMethod(methodName, parameterTypes);
                       return method.invoke(proxy, arguments);
                   }
               };
           }
       
       }
       ```

   查看 **`ref = createProxy(map);`** 代码

   ```java
    private T createProxy(Map<String, String> map) {
      			//判断是否为JVM内部的引用
           if (shouldJvmRefer(map)) {
             	//本地调用
               URL url = new URL(Constants.LOCAL_PROTOCOL, Constants.LOCALHOST_VALUE, 0, interfaceClass.getName()).addParameters(map);
               invoker = refprotocol.refer(interfaceClass, url);
               if (logger.isInfoEnabled()) {
                   logger.info("Using injvm service " + interfaceClass.getName());
               }
           } else {
             	//远程调用
               if (url != null && url.length() > 0) { 
                   String[] us = Constants.SEMICOLON_SPLIT_PATTERN.split(url);
                   if (us != null && us.length > 0) {
                       for (String u : us) {
                           URL url = URL.valueOf(u);
                           if (StringUtils.isEmpty(url.getPath())) {
                               url = url.setPath(interfaceName);
                           }
                           if (Constants.REGISTRY_PROTOCOL.equals(url.getProtocol())) {
                               urls.add(url.addParameterAndEncoded(Constants.REFER_KEY, StringUtils.toQueryString(map)));
                           } else {
                               urls.add(ClusterUtils.mergeUrl(url, map));
                           }
                       }
                   }
               } else { // assemble URL from register center's configuration
                  //检查注册中心 
                 	checkRegistry();
                 	 //从注册中心装配URL
                   List<URL> us = loadRegistries(false);
                   if (CollectionUtils.isNotEmpty(us)) {
                       for (URL u : us) {
                           URL monitorUrl = loadMonitor(u);
                           if (monitorUrl != null) {
                               map.put(Constants.MONITOR_KEY, URL.encode(monitorUrl.toFullString()));
                           }
                           urls.add(u.addParameterAndEncoded(Constants.REFER_KEY, StringUtils.toQueryString(map)));
                       }
                   }
                   if (urls.isEmpty()) {
                      //抛出错误
                   }
               }
   
               if (urls.size() == 1) {
                   //单个注册中心直联
                   invoker = refprotocol.refer(interfaceClass, urls.get(0));
               } else {
                 	//多个注册中心或者多个服务提供者
                   List<Invoker<?>> invokers = new ArrayList<Invoker<?>>();
                   URL registryURL = null;
                   for (URL url : urls) {
                       invokers.add(refprotocol.refer(interfaceClass, url));
                       if (Constants.REGISTRY_PROTOCOL.equals(url.getProtocol())) {
                           registryURL = url; // use last registry url
                       }
                   }
                   if (registryURL != null) { // registry url is available
                       // use RegistryAwareCluster only when register's cluster is available
                       URL u = registryURL.addParameter(Constants.CLUSTER_KEY, RegistryAwareCluster.NAME);
                       // 
                       invoker = cluster.join(new StaticDirectory(u, invokers));
                   } else { // not a registry url, must be direct invoke.
                       invoker = cluster.join(new StaticDirectory(invokers));
                   }
               }
           }
   
           if (shouldCheck() && !invoker.isAvailable()) {
              
               initialized = false;
               //抛出错误
           }
           if (logger.isInfoEnabled()) {
               logger.info("Refer dubbo service " + interfaceClass.getName() + " from url " + invoker.getUrl());
           }
           /**
            * @since 2.7.0
            * ServiceData Store
            */
           MetadataReportService metadataReportService = null;
           if ((metadataReportService = getMetadataReportService()) != null) {
               URL consumerURL = new URL(Constants.CONSUMER_PROTOCOL, map.remove(Constants.REGISTER_IP_KEY), 0, map.get(Constants.INTERFACE_KEY), map);
               metadataReportService.publishConsumer(consumerURL);
         }
           // create service proxy
         return (T) proxyFactory.getProxy(invoker);
       }
   ```
  
   通过 URL中的 **`protocol`** 然后通过 **`ExtensionLoader`** 类获取对应的值。

   ```java
    private static final Protocol refprotocol = ExtensionLoader.getExtensionLoader(Protocol.class).getAdaptiveExtension();
   //Protocol都是通过javassist 动态生成代码
   ```
  
   ```java
   /**
     * Protocol 实现的默认值名称为dubbo
     *
     *
     */
   @SPI("dubbo")
   public interface Protocol {
       int getDefaultPort();
     
       @Adaptive
       <T> Exporter<T> export(Invoker<T> invoker) throws RpcException;
   
       @Adaptive
     <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException;
   
     void destroy();
   }
   ```
  
   下图是Dubbo的数据加载的截图：
  
   ![图解](https://github.com/mxsm/document/blob/master/image/RPC/Dubbo/Dubbo%E5%8A%A8%E6%80%81%E7%94%9F%E6%88%90%E9%80%82%E9%85%8D%E5%AF%B9%E8%B1%A1%E8%AF%B4%E6%98%8E%E6%88%AA%E5%9B%BE.jpg?raw=true)

代码：

```java
private static final Protocol refprotocol = ExtensionLoader.getExtensionLoader(Protocol.class).getAdaptiveExtension();
```

由于Dubbo没有已经写好带有 **`@Adaptive`** 的实现类，通过动态生成的 **`Adaptive Protocol`** 。在这个地方加载的

```java
public class Protocol$Adaptive {

    public void destroy() {
        throw new UnsupportedOperationException("The method public abstract void org.apache.dubbo.rpc.Protocol.destroy() of interface org.apache.dubbo.rpc.Protocol is not adaptive method!");
    }

    public int getDefaultPort() {
        throw new UnsupportedOperationException("The method public abstract int org.apache.dubbo.rpc.Protocol.getDefaultPort() of interface org.apache.dubbo.rpc.Protocol is not adaptive method!");
    }

    public org.apache.dubbo.rpc.Exporter export(org.apache.dubbo.rpc.Invoker arg0) throws org.apache.dubbo.rpc.RpcException {
        if (arg0 == null) throw new IllegalArgumentException("org.apache.dubbo.rpc.Invoker argument == null");
        if (arg0.getUrl() == null)
            throw new IllegalArgumentException("org.apache.dubbo.rpc.Invoker argument getUrl() == null");
        org.apache.dubbo.common.URL url = arg0.getUrl();
        String extName = (url.getProtocol() == null ? "dubbo" : url.getProtocol());
        if (extName == null)
            throw new IllegalStateException("Failed to get extension (org.apache.dubbo.rpc.Protocol) name from url (" + url.toString() + ") use keys([protocol])");
        org.apache.dubbo.rpc.Protocol extension = (org.apache.dubbo.rpc.Protocol) ExtensionLoader.getExtensionLoader(org.apache.dubbo.rpc.Protocol.class).getExtension(extName);
        return extension.export(arg0);
    }

    public org.apache.dubbo.rpc.Invoker refer(java.lang.Class arg0, org.apache.dubbo.common.URL arg1) throws org.apache.dubbo.rpc.RpcException {
        if (arg1 == null) throw new IllegalArgumentException("url == null");
        org.apache.dubbo.common.URL url = arg1;
        String extName = (url.getProtocol() == null ? "dubbo" : url.getProtocol());
        if (extName == null)
            throw new IllegalStateException("Failed to get extension (org.apache.dubbo.rpc.Protocol) name from url (" + url.toString() + ") use keys([protocol])");
        org.apache.dubbo.rpc.Protocol extension = (org.apache.dubbo.rpc.Protocol) ExtensionLoader.getExtensionLoader(org.apache.dubbo.rpc.Protocol.class).getExtension(extName);
        return extension.refer(arg0, arg1);
    }
}
```

当 **`invoker = refprotocol.refer(interfaceClass, urls.get(0));`** 调用，**`url.getProtocol()`** 的值为 **`registry`** , 那就会获取 **`registry`** 的实现类 

```
registry=org.apache.dubbo.registry.integration.RegistryProtocol
```

