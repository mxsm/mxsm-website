---
title: "Rust所有权(ownership)"
sidebar_label: Rust所有权
linkTitle: "Rust所有权"
weight: 202308201045
description: Rust所有权
---

## 1.什么是Ownership

Rust 的所有权（Ownership）系统是其独特的**内存管理机制**，旨在确保代码在运行时没有数据竞争、空指针和内存泄漏等问题。所有权系统是 Rust 的核心概念之一，它帮助开发者在编写代码时更轻松地管理内存，避免常见的编程错误。

> 类比Java就相当于JVM的垃圾收集器

`Ownership` 的三条规则：

1. 每一个Value都有一个变量，也就是所有者
2. Value同一时间有且只有一个所有者
3. 当所有者超出作用域或手动释放所有权时，值将被销毁并释放其占用的内存

## 2.变量与数据交互方式

变量与数据交互方式有三种：

- **Move语义 变量赋值、函数传参时，如果数据类型未实现Copy trait，会发生所有权转移(Move)**
- Clone语义
- **Copy语义 变量赋值、函数传参时，如果数据类型实现了Copy trait, 就会使用Copy语义，对应的值会被按位拷贝(浅拷贝)，产生新的值，不会发生所有权转移**

**Rust不允许自身或其任何部分实现了Drop trait的类型使用Copy trait**

可以从文档https://doc.rust-lang.org/std/marker/trait.Copy.html#implementors查看哪些类型实现了Copy trait中

### 2.1 Move语义

先看下面的例子：

```
fn main() {
    let s = "ttt".to_string();
    let ss = s;
    print!("{}",s); //编译报错
}
```

上面代码编译会报以下错误：

```
error[E0382]: borrow of moved value: `s`
 --> src\main.rs:4:17
  |
2 |     let s = "ttt".to_string();
  |         - move occurs because `s` has type `String`, which does not implement the `Copy` trait
3 |     let ss = s;
  |              - value moved here
4 |     print!("{}",s);
  |                 ^ value borrowed here after move
  |
  = note: this error originates in the macro `$crate::format_args` which comes from the expansion of the macro `print` (in Nightly builds, run with -Z macro-backtrace for more info)
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let ss = s.clone();
  |               ++++++++
```

从上面的例子可以看出来： **当将一个值赋给另一个变量时，其所有权会从一个变量移动到另一个变量，而不是简单地复制数据。这有助于避免资源重复释放和数据竞争的问题。**

```rust
let s1 = String::from("hello");
let s2 = s1;
```

那么内存中是怎么样的呢？

![trpl04-01](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/concepts/trpl04-01.svg)

上面所示就是第一段代码 **let s1 = String::from("hello");**

![trpl04-04](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/concepts/trpl04-04.svg)

第二段代码，这个有点类似于Java中的浅拷贝，而在 Rust 同时使第一个变量无效了，这个操作被称为 **移动**（*move*）

### **2.2 Clone语义**

如果需要深度复制(这里也就是我们平时说的深度拷贝-Java中也有类似的概念)我们可以使用一个叫做clone的方法，这里我们需要定义的结构体实现Clone trait.

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();

    println!("s1 = {}, s2 = {}", s1, s2);
}
```

### 2.3 Copy语义

如下基础数据类型：

```rust
fn main() {
    let x = 5;
    let y = x;

    println!("x = {}, y = {}", x, y);
}
```

这个和上面String的例子不一样，

**Rust 有一个叫做 `Copy` trait 的特殊注解，可以用在类似整型这样的存储在栈上的类型上。如果一个类型实现了 `Copy` trait，那么一个旧的变量在将其赋值给其他变量后仍然可用。**

### 2.4 Clone和Copy的区别

在 Rust 中，`Clone` 和 `Copy` 是两个 trait，用于定义类型的复制和克隆行为。它们有一些重要的区别：

1. `Copy` Trait：
   - `Copy` trait 适用于具有固定大小的简单值类型，如整数、浮点数、布尔值等。当类型实现了 `Copy` trait 时，它表示该类型的值在进行赋值操作时会进行复制，而不是移动。
   - 实现了 `Copy` trait 的类型在赋值时会复制其值，不会发生所有权转移。

```rust
#[derive(Copy, Clone)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = p1; // 复制 Point 的值
    println!("p1: {:?}, p2: {:?}", p1, p2);
}
```

1. `Clone` Trait：
   - `Clone` trait 适用于所有类型，它提供了一种自定义复制行为的方式。通过实现 `Clone` trait，您可以定义类型如何克隆自身。默认情况下，实现了 `Clone` trait 的类型在进行克隆操作时会进行“深拷贝”。

```rust
#[derive(Clone)]
struct Person {
    name: String,
    age: i32,
}

fn main() {
    let person1 = Person {
        name: String::from("Alice"),
        age: 30,
    };
    let person2 = person1.clone(); // 深拷贝 Person
    println!("person1: {:?}, person2: {:?}", person1, person2);
}
```

综上所述，`Copy` trait 适用于简单值类型，当值复制时不会发生所有权转移。而 `Clone` trait 可以适用于任何类型，用于自定义克隆行为，通常会进行“深拷贝”。选择使用哪个 trait 取决于类型的特性和您想要的复制行为。需要注意的是，实现了 `Clone` trait 的类型可以通过调用 `clone()` 方法进行克隆，但这会产生一些额外的开销。

## 3. Ownership和函数

### 3.1 数据传入函数

首先我看一下下面的例子：

```rust
fn main() {
    let s = String::from("hello world");  // s 进入作用域
    mxsm_ownership(s); // s的值转移到函数里面
    //println!("{}", s);  // 这边s不在有效 编译报错

    //mxsm_ownership1(&s); //move语义 这边s不在有效 编译报错
    //println!("{}", s);// 这边s不在有效 编译报错

    //基础数据
    let x = 1;
    mxsm_copy(x); //基础数据都实现了Copy语义所以这里使用的是Copy语义而不是Movie
    println!("{}", x) //这里依然有效
}

fn mxsm_ownership(s:String){
    println!("{}", s)
}

fn mxsm_ownership1(s:&str){
    println!("{}", s)
}

fn mxsm_copy(i:i32){
    println!("{}", i);
}
```

将值传递给函数与给变量赋值的原理相似。向函数传递值可能会移动或者复制，就像赋值语句一样。

### 3.2 Ownership与函数返回值

例子：

```rust
fn main() {
    let s1 = gives_ownership();         // gives_ownership 将返回值
                                        // 转移给 s1

    let s2 = String::from("hello");     // s2 进入作用域

    let s3 = takes_and_gives_back(s2);  // s2 被移动到
                                        // takes_and_gives_back 中，
                                        // 它也将返回值移给 s3
} // 这里，s3 移出作用域并被丢弃。s2 也移出作用域，但已被移走，
  // 所以什么也不会发生。s1 离开作用域并被丢弃

fn gives_ownership() -> String {             // gives_ownership 会将
                                             // 返回值移动给
                                             // 调用它的函数

    let some_string = String::from("yours"); // some_string 进入作用域。

    some_string                              // 返回 some_string 
                                             // 并移出给调用的函数
                                             // 
}

// takes_and_gives_back 将传入字符串并返回该值
fn takes_and_gives_back(a_string: String) -> String { // a_string 进入作用域
                                                      // 

    a_string  // 返回 a_string 并移出给调用的函数
}
```

**变量的所有权总是遵循相同的模式：将值赋给另一个变量时移动它。当持有堆中数据值的变量离开作用域时，其值将通过 `drop` 被清理掉，除非数据被移动为另一个变量所有。**

从上面可以看出来，基本上都是将结构体实例传入方法中或者返回。大家想一下如果这个这个结构体的实例占用的空间很大这样就会造成性能问题。那么如何解决。这里就是下面需要说到的引用。

## 4. 引用和借用

**引用**（*reference*）像一个指针，因为它是一个地址，我们可以由此访问储存于该地址的属于其他变量的数据。 与指针不同，引用确保指向某个特定类型的有效值。

```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

示意图如下：

**`&s1` 语法让我们创建一个 指向 值 `s1` 的引用，但是并不拥有它。因为并不拥有这个值，所以当引用停止使用时，它所指向的值也不会被丢弃**

```rust
fn main() {
    let s = String::from("hello world");  // s 进入作用域
    let ss = &s;
    let sss = ss;
    println!("{}", ss); //ss依然有效
}
```

**我们将创建一个引用的行为称为 借用（\**\**\*borrowing\*\**\**）, 但是借用不能改变借用对象的值，如果需要能够改变借用对象的值需要增加 mut关键字**

### 4.1 悬垂引用（Dangling References）

在具有指针的语言中，很容易通过释放内存时保留指向它的指针而错误地生成一个 **悬垂指针**（*dangling pointer*），所谓悬垂指针是其指向的内存可能已经被分配给其它持有者。相比之下，在 Rust 中编译器确保引用永远也不会变成悬垂状态：当你拥有一些数据的引用，编译器确保数据不会在其引用之前离开作用域。

例子：

```rust
fn dangle() -> &String { // dangle 返回一个字符串的引用

    let s = String::from("hello"); // s 是一个新字符串

    &s // 返回字符串 s 的引用
}//离开方法s作用域结束，内存被释放， 而引用还在
```

所以这种情况下会编译报错.Rust不允许悬垂引用的存在。

## 5. 总结

- **在任意给定时间，要么 只能有一个可变引用，要么 只能有多个不可变引用**。

- **引用必须总是有效的**

  悬垂引用就是一个无效的引用，所以Rust编译器在编译的时候检测杜绝此类引用发生。

> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)\~谢谢! Emal:<mxsm@apache.com>