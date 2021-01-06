---
title: 接口抽象类的抉择
categories:
  - Java
  - Java心得
tags:
  - Java
  - Java心得
abbrlink: d2d4228a
date: 2019-12-17 04:48:21
---
### 抽象类

```java
public abstract class Furit {

   public abstract void what();

   protected abstract void what1();
		
  //方法的限定词为public
   abstract void what2();
   
}

```

抽象类的特征：

- 抽象方法必须为 **`public`** 、 **`protected`** 、,缺省的时候为 **`public`**
- 抽象类不能实例化，必须有子类继承实现其父方法才能创建对象。
- 抽象类可以继承抽象类，子类必须复制继承父类的抽象方法。
- 只要包含一个抽象方法的抽象类，该类必须定义成抽象类，不管是否还包含其他的方法。

### 接口

```java
//一般的通用的接口
public interface Play {

  public static final String A = "A";
  
    void doPlay();

    public void doPlay1();

}
```

```java
@FunctionalInterface
public interface Consumer<T> {

    void accept(T t);

		//带有默认函数的接口--JDK8以上支持
    default Consumer<T> andThen(Consumer<? super T> after) {
        Objects.requireNonNull(after);
        return (T t) -> { accept(t); after.accept(t); };
    }
}
```

接口的特性：

- 接口可以包含 **`public static`** 的静态变量(默认只能是 **`public static`** 隐含的就是这个)
- JDK8以前接口中只能有 **`public`** 修饰的方法(在没有修饰符默认的情况下也是 **`public`** )，不存在其他的修饰符的方法。JDK8以上接口中可以包含一个以上的默认的方法。
- 一个普通的类可以实现( **`implements`** )多个接口，抽象类同样如此，只是抽象类可以不实现这些方法而让继承抽象类的子类实现，当然抽象类也可以实现。而普通类实现接口就必须在子类中实现接口的方法。

### 接口和抽象类的区别

- 抽象类可以提供成员的方法具体实现细节，而接口只能存在public abstract 方法。
- 抽象类中的成员变量可以是各种类型的，而接口中的成员变量只能是public static 类型
- 接口中不能含有静态代码块和静态方法，而抽象类中可以含有静态代码块和静态方法。
- 抽象类只能单一继承，接口可以多个实现。

### 接口和抽象类的选择

映射生活，对于人来说，年龄、身高、体重等等都是共有的特征，但是对于不同的人还有一些其他的情况不一样。这种情况下用抽象类比较好。抽象类中可以定义一些变量然后把一些不确定的交给子类，比如吃东西这个。你是吃饭还是吃奶都交给子类去管。

```java
public abstract class Person {

  private int age;
  
  private float weight;
  
  public abstract void eat();
}
```

而接口可以定义一些和人的本质无关的一些东西比如行为。

```java
public  interface Action {
  public void play();
}
```

比如A，会玩那就实现 Action 如果不会玩那就不用实现 Action 但是都是人继承Person就能从Person那边拿到对应的属性。

```java
public class A extends Person implements Action{
  public  void eat(){
    //吃的行为
  }
  
  public void play(){
    //玩的行为
  }
}
```

反观编程的角度：

- 抽象方法用来抽象哪些有公共属性对于部分方法需要进行拓展的。而接口适合一些行为方式的抽象。抽象类和接口两者相结合。
- 当需要为一些带有属性的类提供公共的实现代码的时候应该优先考虑抽象类(Dubbo的config模块中的配置类可以进行借鉴)。
- 在拓展性和可维护性应当优先才有接口(RPC调用)，接口可以看成是程序间的一个协议，比抽象类更安全更清晰