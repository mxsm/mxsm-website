---
title: 自适应机制解析
categories:
  - RPC
  - Dubbo
  - 源码解析
tags:
  - RPC
  - Dubbo
  - 源码解析
abbrlink: 3494c684
date: 2018-03-05 21:01:19
---
### 1. 两个注解

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
public @interface SPI {
    String value() default "";
}

@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface Adaptive {
    String[] value() default {};

}
```

- **@SPI**

  通过SPI注解动态获取一个接口在项目中不同的实现。增强了Java原生的SPI。

- **@Adaptive**

  通过适配的标签动态注入数据

### 2. 源码解析

首先获取对应的接口的拓展器加载类：

```java
    public static <T> ExtensionLoader<T> getExtensionLoader(Class<T> type) {  
      if (type == null) {
            throw new IllegalArgumentException("Extension type == null");
        }
        if (!type.isInterface()) {
            throw new IllegalArgumentException("Extension type (" + type + ") is not an interface!");
        }
        if (!withExtensionAnnotation(type)) {
            throw new IllegalArgumentException("Extension type (" + type +
                    ") is not an extension, because it is NOT annotated with @" + SPI.class.getSimpleName() + "!");
        }

        ExtensionLoader<T> loader = (ExtensionLoader<T>) EXTENSION_LOADERS.get(type);
        if (loader == null) {
            EXTENSION_LOADERS.putIfAbsent(type, new ExtensionLoader<T>(type));
            loader = (ExtensionLoader<T>) EXTENSION_LOADERS.get(type);
        }
        return loader;
    }
```

1. 判断是否需要加载的类type是否为空
2. 判断是否为接口
3. **`withExtensionAnnotation`** 方法判断是否存在 **`@SPI`** 注解
4. 从缓存中获取拓展类Loader，不存在创建放入缓存。

然后通过 **`getAdaptiveExtension()`** 方法来获取 **`Adaptive`** 对象。

```java
    public T getAdaptiveExtension() {
      	
      	//从当前缓存中获取
        Object instance = cachedAdaptiveInstance.get();
      	//dubbo check 保证下面只能有一个
        if (instance == null) {
            if (createAdaptiveInstanceError == null) {
                synchronized (cachedAdaptiveInstance) {
                    instance = cachedAdaptiveInstance.get();
                    if (instance == null) {
                        try {
                          	//创建适配对象
                            instance = createAdaptiveExtension();
                          	//放入缓存
                            cachedAdaptiveInstance.set(instance);
                        } catch (Throwable t) {
                            createAdaptiveInstanceError = t;
                            throw new IllegalStateException("Failed to create adaptive instance: " + t.toString(), t);
                        }
                    }
                }
            } else {
                throw new IllegalStateException("Failed to create adaptive instance: " + createAdaptiveInstanceError.toString(), createAdaptiveInstanceError);
            }
        }

        return (T) instance;
    }
```

首先也是从缓存中获取，在缓存中没有的时候调用 **`createAdaptiveExtension()`** 同样设置到缓存：

```java
    private T createAdaptiveExtension() {
        try {
          	//创建适配对象然后对对象进行动态注入
            return injectExtension((T) getAdaptiveExtensionClass().newInstance());
        } catch (Exception e) {
          //报错
        }
    }
```

先看一下 **`getAdaptiveExtensionClass()`** 获取适配拓展类

```java

private Class<?> getAdaptiveExtensionClass() {
  			//获取所有的适配类的dubbo实现并且保存
        getExtensionClasses();
  			//判断是否为空 -- 用了volatile 修饰cachedAdaptiveClass 保证可见性
        if (cachedAdaptiveClass != null) {
            return cachedAdaptiveClass;
        }
        return cachedAdaptiveClass = createAdaptiveExtensionClass();
    }
//获取所有的拓展类的对应关系
private Map<String, Class<?>> getExtensionClasses() {
        Map<String, Class<?>> classes = cachedClasses.get();
        if (classes == null) {
            synchronized (cachedClasses) {
                classes = cachedClasses.get();
                if (classes == null) {
                  	//关键方法
                    classes = loadExtensionClasses();
                    cachedClasses.set(classes);
                }
            }
        }
        return classes;
    }
		//SPI的拓展
		/**
		 * META-INF/services/  -- Java标准的SPI
		 * META-INF/dubbo/  -- 用户自己拓展的
		 * META-INF/dubbo/internal/ -- Dubbo内部的拓展
		 * 会去加载这三个目录下面的文件
 		*/
    private Map<String, Class<?>> loadExtensionClasses() {
        cacheDefaultExtensionName();

        Map<String, Class<?>> extensionClasses = new HashMap<>();
        loadDirectory(extensionClasses, DUBBO_INTERNAL_DIRECTORY, type.getName());
        loadDirectory(extensionClasses, DUBBO_INTERNAL_DIRECTORY, type.getName().replace("org.apache", "com.alibaba"));
        loadDirectory(extensionClasses, DUBBO_DIRECTORY, type.getName());
        loadDirectory(extensionClasses, DUBBO_DIRECTORY, type.getName().replace("org.apache", "com.alibaba"));
        loadDirectory(extensionClasses, SERVICES_DIRECTORY, type.getName());
        loadDirectory(extensionClasses, SERVICES_DIRECTORY, type.getName().replace("org.apache", "com.alibaba"));
        return extensionClasses;
    }
```

如果适配的class不存在,

**`String code = new AdaptiveClassCodeGenerator(type, cachedDefaultName).generate();`** 生成代码

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

> 对于拓展类的实现有两类：
>
> - 默认的-Adaptive类型
>
>   在没有指定的时候会获取对应的类上面的@Adaptive注解来获取
>
> - 通过配置或者其他方式指定的类
>
>   