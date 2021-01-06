---
title: 动态代理与静态代理
categories:
  - Java
  - JSE
tags:
  - Java
  - JSE
abbrlink: 5072383b
date: 2018-08-11 19:08:33
---
#### 1. 什么是静态代理和动态代理？

![图](https://java-design-patterns.com/assets/proxy-concept.png)

代理模式是 **`Java`** 设计模式，它的特征是**代理类与委托类有相同的接口**。**代理类主要负责委托类预处理消息、过滤消息、把消息传递给委托类、以及事后处理消息。代理类与委托类之间捅穿会存在关联关系**。一个代理类的对象与一个委托类的对象关联，代理类的对象本身并不是真正服务的实现。而是通过调用委托类的方法来提供相应的服务。

根据代理的创建时期可以分为两种:

- **静态代理**

  由程序员创建或由特定工具自动生成源代码，再对其编译。在程序运行前，代理类的.class文件就已经存在了。静态代理通常只代理一个类，动态代理是代理一个接口下的多个实现类。静态代理事先知道要代理的是什么。

- **动态代理**

  在程序运行时，运用反射机制动态创建而成。动态代理不知道要代理什么东西，只有在运行时才知道

### 2. 静态代理

上代码：

```java
public interface TestService {

    void say(String msg);

}
```

```java
public class TestServiceImpl implements TestService{
    @Override
    public void say(String msg) {
        System.out.println(msg);
    }
}
```

```java
public class ProxyTestService implements TestService{

    private TestService testService;

    public ProxyTestService(TestService testService) {
        this.testService = testService;
    }

    @Override
    public void say(String msg) {

        //预处理
        System.out.println("before calling say");
        //调用被代理的testService
        testService.say(msg);
        //事后处理
        System.out.println("after calling say");


    }
}
```

执行：

```java
public class Test {

    public static void main(String[] args) throws Exception{
       TestService service = new TestServiceImpl();
       TestService service1 = new ProxyTestService(service);
       service1.say("ssssssss");
    }

}
```

通过上面可以看出来静态代理：就是在代理类中进行做数据的前后处理。

### 3. 动态代理

与静态代理类对照的是动态代理类，动态代理类的字节码在程序运行时由Java反射机制动态生成，无需程序员手工编写它的源代码。动态代理类不仅简化了编程工作，而且提高了软件系统的可扩展性，因为Java反射机制可以生成任意类型的动态代理类。java.lang.reflect 包中的Proxy类和InvocationHandler接口提供了生成动态代理类的能力。

- **JDK原生代理**

  上代码：

  ```java
  public interface TestService {
      void say(String msg);
  }
  
  public class TestServiceImpl implements TestService{
      @Override
      public void say(String msg) {
          System.out.println(msg);
      }
  }
  ```

  ```java
  public class TestInvocationHandler implements InvocationHandler {
  
      private Object target;
  
      public TestInvocationHandler(Object target) {
          this.target = target;
      }
  
      @Override
      public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
          System.out.println(proxy.getClass().getName());
          return method.invoke(target,args);
      }
  }
  ```

  ```java
  public class Test {
  
      public static void main(String[] args) throws Exception{
          TestService testService =  (TestService)Proxy.newProxyInstance(Test.class.getClassLoader(), new Class<?>[]{TestService.class}, new TestInvocationHandler(new TestServiceImpl()));
          testService.say("sssss");
      }
  
  }
  ```

  

- **cglib代理**

```java
public class EnhancerForSampleClassApplication {

    public static void main(String[] args) {

        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(A.class);
        enhancer.setCallback(new MxsmPoxy());
        A a = (A)enhancer.create();
        a.aaa("bbb");
    }

   public interface A{

        public void aaa(String aaa);

   }

   public static  class MxsmPoxy implements MethodInterceptor{

       @Override
       public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {

           System.out.println( method.getName());
           System.out.println(args[0]);

           return null;
       }
   }
}
```

cglib的妙用还可以参照Spring核心包的里面的代码。大神的代码值得学习。