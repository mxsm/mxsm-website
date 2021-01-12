---
title: ExtensionLoader源码解析
categories:
  - RPC
  - Dubbo
  - 源码解析
tags:
  - RPC
  - Dubbo
  - 源码解析
abbrlink: 9c179cb7
date: 2019-09-20 19:58:38
---
### ExtensionLoader源码解析(Dubbo-2.7.1版本)

首先看一下 **`ExtensionLoader`** 源码中的类的变量,变量分为两类:

- 私有的静态变量

  ```java
      //下面的三个变量是拓展了JAVA的SPI
  		//JAVA标准的SPI存放的目录 Dubbo也会去扫描这个目录但是下面的文件格式是按照Dubbo的格式来的
      private static final String SERVICES_DIRECTORY = "META-INF/services/";
  		//用户自定义的拓展放在这个目录
      private static final String DUBBO_DIRECTORY = "META-INF/dubbo/";
  		//Dubbo内部实现的拓展问价放在这个目录
      private static final String DUBBO_INTERNAL_DIRECTORY = DUBBO_DIRECTORY + "internal/";
  		
  		//类命名正则表达式
      private static final Pattern NAME_SEPARATOR = Pattern.compile("\\s*[,]+\\s*");
  		//接口对应的ExtensionLoader的缓存
      private static final ConcurrentMap<Class<?>, ExtensionLoader<?>> EXTENSION_LOADERS = new ConcurrentHashMap<>();
  		//接口对应的实现的实例对象缓存
      private static final ConcurrentMap<Class<?>, Object> EXTENSION_INSTANCES = new ConcurrentHashMap<>();
  ```

- 对象的私有变量

  ```java
  		//拓展的接口Class
  		private final Class<?> type;
  	  //拓展使用的工厂
      private final ExtensionFactory objectFactory;
  
  		//类和名称的缓存
      private final ConcurrentMap<Class<?>, String> cachedNames = new ConcurrentHashMap<>();
  		//加载type类型接口实现的名称和类的缓存
      private final Holder<Map<String, Class<?>>> cachedClasses = new Holder<>();
  		//缓存带有@Activate注解的对象
      private final Map<String, Object> cachedActivates = new ConcurrentHashMap<>();
      //缓存实例
  		private final ConcurrentMap<String, Holder<Object>> cachedInstances = new ConcurrentHashMap<>();
  		//保存带有@Adaptive注解的对象实例
      private final Holder<Object> cachedAdaptiveInstance = new Holder<>();
  		//保存带有@Adaptive注解的class
      private volatile Class<?> cachedAdaptiveClass = null;
  		//缓存的默认名称--获取SPI注解的value值
      private String cachedDefaultName;
  		
      private volatile Throwable createAdaptiveInstanceError;
  		//保存包装classes
      private Set<Class<?>> cachedWrapperClasses;
  
      private Map<String, IllegalStateException> exceptions = new ConcurrentHashMap<>();
  ```

从代码中随便找出一个该类的使用方式来对类进行进一步分析，选取 **`ServiceConfig`** 类中的一段代码：

```java
 private static final Protocol protocol = ExtensionLoader.getExtensionLoader(Protocol.class).getAdaptiveExtension();
```

- 首先用过 **`ExtensionLoader`** 调用静态方法 **`getExtensionLoader`**
- 获取到 **`ExtensionLoader`** 对象后调用对象的 **`getAdaptiveExtension`** 方法(还有其他的类似方法这是其中的一个)
- 最后获取到 **`Protocol`** 的实际对象

```java
 private ExtensionLoader(Class<?> type) {
        this.type = type;
   			//这段代码下面进行分析
        objectFactory = (type == ExtensionFactory.class ? null : ExtensionLoader.getExtensionLoader(ExtensionFactory.class).getAdaptiveExtension());
    }
```

从上面的代码可以看出来 **`ExtensionLoader`** 的构造函数为私有的。所以外部不能进行创建该对象。

```java
 public static <T> ExtensionLoader<T> getExtensionLoader(Class<T> type) {
        if (type == null) {
            throw new IllegalArgumentException("Extension type == null");
        }
   			//判断了是否为接口
        if (!type.isInterface()) {
            throw new IllegalArgumentException("Extension type (" + type + ") is not an interface!");
        }
   			//判断是否含有Dubbo自定义的@SPI注解
        if (!withExtensionAnnotation(type)) {
            throw new IllegalArgumentException("Extension type (" + type +
                    ") is not an extension, because it is NOT annotated with @" + SPI.class.getSimpleName() + "!");
        }
				
   			//首先从静态变量的缓存中获取
        ExtensionLoader<T> loader = (ExtensionLoader<T>) EXTENSION_LOADERS.get(type);
        if (loader == null) {
          	//不存在创建放入缓存
            EXTENSION_LOADERS.putIfAbsent(type, new ExtensionLoader<T>(type));
            loader = (ExtensionLoader<T>) EXTENSION_LOADERS.get(type);
        }
        return loader;
    }

	private static <T> boolean withExtensionAnnotation(Class<T> type) {
        return type.isAnnotationPresent(SPI.class);
    }
```

正如上面的调用是通过调用 **`ExtensionLoader`** 的静态方法  **getExtensionLoader(Class<T> type)**  来获取对应type的 **`ExtensionLoader`** 对象。所以从上面可以看出来要能生成 **`ExtensionLoader`** 对象需要满足一下几个条件：

- **type一定要是接口(interface)**
- **type接口上面一定要包含@SPI注解**

通过调用以后生成了type接口对应的 **`ExtensionLoader`** 对象，然后接下来看对象调用对象的 **`getAdaptiveExtension`** 方法。

```java
    public T getAdaptiveExtension() {
      	//首先从缓存的Holder对象中获取Adaptive对象
        Object instance = cachedAdaptiveInstance.get();
      	//获取的dubbo check
        if (instance == null) {
            if (createAdaptiveInstanceError == null) {
                synchronized (cachedAdaptiveInstance) {
                  	//再一次获取
                    instance = cachedAdaptiveInstance.get();
                    if (instance == null) {
                        try {
                            instance = createAdaptiveExtension();
                          	//存入缓存
                            cachedAdaptiveInstance.set(instance);
                        } catch (Throwable t) {
                            createAdaptiveInstanceError = t;
                            //throw ex
                        }
                    }
                }
            } else {
                //throw ex
            }
        }
        return (T) instance;
    }

//对象cachedAdaptiveInstance用的是这个对象持有的
public class Holder<T> {
		//使用了关键字volatile保证可见性
    private volatile T value;

    public void set(T value) {
        this.value = value;
    }

    public T get() {
        return value;
    }

}
```

从上面的代码看一下获取的步骤：

- **首先从缓存对象** **`cachedAdaptiveInstance`** **来获取合适的拓展类**
- **如果获取拓展类不存在就开始创建(dubbo check)**
- **调用** **`createAdaptiveExtension`** **方法进行创建对象并且放入** **`cachedAdaptiveInstance`** **缓存起来**

接下里看一下 **`createAdaptiveExtension`** 方法：

```java
    private T createAdaptiveExtension() {
        try {
          	//这里分为了两个方法一个是：(T) getAdaptiveExtensionClass().newInstance()
          	//获取对应的类进行实例化，injectExtension对对象进行注入对应的私有变量引用
            return injectExtension((T) getAdaptiveExtensionClass().newInstance());
        } catch (Exception e) {
            throw new IllegalStateException("Can't create adaptive extension " + type + ", cause: " + e.getMessage(), e);
        }
    }
	//那么看一下injectExtension方法
private T injectExtension(T instance) {
        try {
          	//首先判断ExtensionFactory是否为空
            if (objectFactory != null) {
                for (Method method : instance.getClass().getMethods()) {
                  	//判断方法是否是set开头的方法
                    if (isSetter(method)) {
                      	//判断是否带有@DisableInject注解--表示不允许注入
                        if (method.getAnnotation(DisableInject.class) != null) {
                            continue;
                        }
                      	//获取要注入的对象的class
                        Class<?> pt = method.getParameterTypes()[0];
                      	//排除基本类
                        if (ReflectUtils.isPrimitives(pt)) {
                            continue;
                        }
                        try {
                          	//返回set后面的名称
                            String property = getSetterProperty(method);
                            Object object = objectFactory.getExtension(pt, property);
                            if (object != null) {
                              	//注入
                                method.invoke(instance, object);
                            }
                        } catch (Exception e) {
                           // throw ex
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        }
        return instance;
    }

```

从上面的代码可以看出 **`createAdaptiveExtension`** 主要有两个步骤：

- **生成对应的拓展类对象**
- **调用**  **`injectExtension`** **将生成的类对象注入set方法的注入(递归调用)**

动态注入上面的代码已经分析了，下面来分析 **`getAdaptiveExtensionClass`** 方法如何来获取拓展类的Class

```java
 private Class<?> getAdaptiveExtensionClass() {
        //获取拓展类
   			getExtensionClasses();
   			//判断是否有缓存的拓展类
   			// private volatile Class<?> cachedAdaptiveClass = null; 含有关键字
        if (cachedAdaptiveClass != null) {
            return cachedAdaptiveClass;
        }
   			//创建缓存拓展类
        return cachedAdaptiveClass = createAdaptiveExtensionClass();
    }
```

上面主要也是有三个步骤：

- **调用** **`getExtensionClasses`** **方法 获取type对应的拓展类**

  ```java
  private Map<String, Class<?>> getExtensionClasses() {
          //首先从之前的缓存获取
    			Map<String, Class<?>> classes = cachedClasses.get();
          if (classes == null) {
              synchronized (cachedClasses) {
                  classes = cachedClasses.get();
                  if (classes == null) {
                    	//不存在通过调用loadExtensionClasses()来加载
                      classes = loadExtensionClasses() 
                      cachedClasses.set(classes);
                  }
              }
          }
          return classes;
      }
  //从对应的文件下记载SPI对应的数据 -- 这里就用到之前的三个静态变量
      private Map<String, Class<?>> loadExtensionClasses() {
        	//获取默认的拓展的名称--获取注解@SPI的value值
          cacheDefaultExtensionName();
  
          Map<String, Class<?>> extensionClasses = new HashMap<>();
        	//loadDirectory方法就是去文件中加载对应的数据符合文件命名符合java的
        	//SPI规范
          v(extensionClasses, DUBBO_INTERNAL_DIRECTORY, type.getName());
          loadDirectory(extensionClasses, DUBBO_INTERNAL_DIRECTORY, type.getName().replace("org.apache", "com.alibaba"));
          loadDirectory(extensionClasses, DUBBO_DIRECTORY, type.getName());
          loadDirectory(extensionClasses, DUBBO_DIRECTORY, type.getName().replace("org.apache", "com.alibaba"));
          loadDirectory(extensionClasses, SERVICES_DIRECTORY, type.getName());
          loadDirectory(extensionClasses, SERVICES_DIRECTORY, type.getName().replace("org.apache", "com.alibaba"));
          return extensionClasses;
      }
  
      private void cacheDefaultExtensionName() {
          final SPI defaultAnnotation = type.getAnnotation(SPI.class);
          if (defaultAnnotation != null) {
              String value = defaultAnnotation.value();
              if ((value = value.trim()).length() > 0) {
                  String[] names = NAME_SEPARATOR.split(value);
                  if (names.length > 1) {
                      throw new IllegalStateException("More than 1 default extension name on extension " + type.getName()
                              + ": " + Arrays.toString(names));
                  }
                  if (names.length == 1) {
                      cachedDefaultName = names[0];
                  }
              }
          }
      }
  ```

  从上面可以看出主要进行了两个步骤的操作：

  - 获取 cacheDefaultExtensionName 默认名称从接口的@SPI注解上，如果没有就是null

    比如下面的两个接口：

    - **`Protocol`** 接口的 **`cacheDefaultExtensionName=dubbo`**

    ```java
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

    - **`ExtensionFactory`** 接口  **`cacheDefaultExtensionName`** 就是null

      ```
      @SPI
      public interface ExtensionFactory {
      
          <T> T getExtension(Class<T> type, String name);
      
      }
      ```

  - 通过 **`loadDirectory`** 来获取对应的type接口的实现类

    ```java
    private void loadDirectory(Map<String, Class<?>> extensionClasses, String dir, String type) {
      			//从之前定义的SPI的三个目录中进行查找数据
            String fileName = dir + type;
          	//比如 type.getName() = org.apache.dubbo.rpc.Protocol  
      		try {
                Enumeration<java.net.URL> urls;
                ClassLoader classLoader = findClassLoader();
                if (classLoader != null) {
                    urls = classLoader.getResources(fileName);
                } else {
                    urls = ClassLoader.getSystemResources(fileName);
                }
                if (urls != null) {
                    while (urls.hasMoreElements()) {
                        java.net.URL resourceURL = urls.nextElement();
                      	//加载资源
                        loadResource(extensionClasses, classLoader, resourceURL);
                    }
                }
            } catch (Throwable t) {
               //throw ex
            }
        }
    ```

    下面来看一下 **`loadResource`** 如何加载资源的。

    ```java
        private void loadResource(Map<String, Class<?>> extensionClasses, ClassLoader classLoader, java.net.URL resourceURL) {
            try {
              	//一行一行的读取数据项目中的结构如下图
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(resourceURL.openStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        final int ci = line.indexOf('#');
                        if (ci >= 0) {
                            line = line.substring(0, ci);
                        }
                        line = line.trim();
                        if (line.length() > 0) {
                            try {
                                String name = null;
                                int i = line.indexOf('=');
                                if (i > 0) {
                                    name = line.substring(0, i).trim();
                                    line = line.substring(i + 1).trim();
                                }
                                if (line.length() > 0) {
                                    loadClass(extensionClasses, resourceURL, Class.forName(line, true, classLoader), name);
                                }
                            } catch (Throwable t) {
                               //错误处理
                            }
                        }
                    }
                }
            } catch (Throwable t) {
                //错误打印
            }
        }
    ```

    ![图](https://github.com/mxsm/document/blob/master/image/RPC/Dubbo/Dubbo%E5%8A%A8%E6%80%81%E7%94%9F%E6%88%90%E9%80%82%E9%85%8D%E5%AF%B9%E8%B1%A1%E8%AF%B4%E6%98%8E%E6%88%AA%E5%9B%BE.jpg?raw=true)

    下面来看 **`loadClass`** 方法是如何处理的

    ```java
    private void loadClass(Map<String, Class<?>> extensionClasses, java.net.URL resourceURL, Class<?> clazz, String name) throws NoSuchMethodException {
            //判断继承关系
      			if (!type.isAssignableFrom(clazz)) {
               //throw ex
            }
      			//判断实现类上面是否含有@Adaptive注解--比如下面两个类有：
      			//AdaptiveExtensionFactory  AdaptiveCompiler都有
            if (clazz.isAnnotationPresent(Adaptive.class)) {
              	//设置变量cachedAdaptiveClass的值
                cacheAdaptiveClass(clazz);
            } else if (isWrapperClass(clazz)) { //判断是否为包装类
              	//缓存包装类
                cacheWrapperClass(clazz);
            } else {
              	//确认存在没有参数的构造函数
                clazz.getConstructor();
                if (StringUtils.isEmpty(name)) {
                    name = findAnnotationName(clazz);
                    if (name.length() == 0) {
                        throw new IllegalStateException("No such extension name for the class " + clazz.getName() + " in the config " + resourceURL);
                    }
                }
    
                String[] names = NAME_SEPARATOR.split(name);
                if (ArrayUtils.isNotEmpty(names)) {
                    cacheActivateClass(clazz, names[0]);
                    for (String n : names) {
                      	//缓存激活的class名称
                        cacheName(clazz, n);
                      	//存入拓展类的hashmap中
                        saveInExtensionClass(extensionClasses, clazz, name);
                    }
                }
            }
        }
    ```

    

- **判断是否 cachedAdaptiveClass 是否为空**

- **为空** **`createAdaptiveExtensionClass`** **创建并且赋值给** **`cachedAdaptiveClass`**

 接下来看一下 **`createAdaptiveExtensionClass`** 创建拓展类方法：

```java
private Class<?> createAdaptiveExtensionClass() {
  			//动态生成Adaptive类
        String code = new AdaptiveClassCodeGenerator(type, cachedDefaultName).generate();
        //获取ClassLoader
  			ClassLoader classLoader = findClassLoader();
  			//获取编译器
        org.apache.dubbo.common.compiler.Compiler compiler = ExtensionLoader.getExtensionLoader(org.apache.dubbo.common.compiler.Compiler.class).getAdaptiveExtension();
  			//编译代码
        return compiler.compile(code, classLoader);
    }
```

到这里基本上的ExtensionLoader已经分析完成。

这里还有一个地方需要分析：

```java
    public T getExtension(String name) {
        if (StringUtils.isEmpty(name)) {
            throw new IllegalArgumentException("Extension name == null");
        }
        if ("true".equals(name)) {
            return getDefaultExtension();
        }
        Holder<Object> holder = getOrCreateHolder(name);
        Object instance = holder.get();
        if (instance == null) {
            synchronized (holder) {
                instance = holder.get();
                if (instance == null) {
                    instance = createExtension(name);
                    holder.set(instance);
                }
            }
        }
        return (T) instance;
    }
```

在调用 **`getExtension`** 方法会自动对类进行包装：

```java
    private T createExtension(String name) {
        Class<?> clazz = getExtensionClasses().get(name);
        if (clazz == null) {
            throw findException(name);
        }
        try {
            T instance = (T) EXTENSION_INSTANCES.get(clazz);
            if (instance == null) {
                EXTENSION_INSTANCES.putIfAbsent(clazz, clazz.newInstance());
                instance = (T) EXTENSION_INSTANCES.get(clazz);
            }
            injectExtension(instance);
            Set<Class<?>> wrapperClasses = cachedWrapperClasses;
            if (CollectionUtils.isNotEmpty(wrapperClasses)) {
                for (Class<?> wrapperClass : wrapperClasses) {
                  	//生成包装类 
                    instance = injectExtension((T) wrapperClass.getConstructor(type).newInstance(instance));
                }
            }
            return instance;
        } catch (Throwable t) {
            throw new IllegalStateException("Extension instance (name: " + name + ", class: " +
                    type + ") couldn't be instantiated: " + t.getMessage(), t);
        }
    }
```

如果没有包装类直接对象。这里就解释了为什么定义的默认集群为 **FailoverCluster** 最后变成了 **MockerClusterWrapper** 这里给出了解释。在 **Cluster** 有多重实现包括Wapper类型

### Dubbo SPI高级用法之 AOP

在用Spring的时候，我们经常会用到AOP功能。在目标类的方法前后插入其他逻辑。比如通常使用Spring AOP来实现日志，监控和鉴权等功能。 Dubbo的扩展机制，是否也支持类似的功能呢？答案是yes。在Dubbo中，有一种特殊的类，被称为Wrapper类。通过装饰者模式，使用包装类包装原始的扩展点实例。在原始扩展点实现前后插入其他逻辑，实现AOP功能。

### 什么是Wrapper类

那什么样类的才是Dubbo扩展机制中的Wrapper类呢？Wrapper类是一个有复制构造函数的类，也是典型的装饰者模式。下面就是一个Wrapper类:

```java
class A{
    private A a;
    public A(A a){
        this.a = a;
    }
}
```

类A有一个构造函数`public A(A a)`，构造函数的参数是A本身。这样的类就可以成为Dubbo扩展机制中的一个Wrapper类。Dubbo中这样的Wrapper类有ProtocolFilterWrapper, ProtocolListenerWrapper等, 大家可以查看源码加深理解。





### 总结

- **主要利用了Java SPI的思想并且对SPI进行了拓展。**
- **动态生成代码**
- **支持setter的IOC注入— 可以进行拓展比如向Spring的IOC靠拢**