---
title: "Rust智能指针(Smart Pointer)"
sidebar_label: Rust智能指针(Smart Pointer)
linkTitle: "Rust智能指针(Smart Pointer)"
weight: 202308272034
description: Rust智能指针(Smart Pointer)
---

## 1. 什么是智能指针

**指针** （*pointer*）是一个包含内存地址的变量的通用概念。使用C和C++的人就会经常的遇到指针。而Java的开发者指针已经被屏蔽。开发人员基本上不要去关心。那么Rust的智能指针又是什么？

**智能指针**（*smart pointers*）是一类**数据结构(结构体)**，它们的表现类似指针，但是也拥有额外的元数据和功能。

> 注意：智能指针的概念并非 Rust 独有：其起源于 C++，也存在于其他语言中

普通指针(引用)和智能指针的区别：引用是一类只借用数据的指针，在大部分情况下，智能指针 **拥有** 它们指向的数据。

智能指针是一类非基础数据的数据结构所以智能指针通常使用结构体实现。

> 说明： 开发者可以通过实现Deref和Drop trait自定义智能指针
>
> Rust标准库中提供了许多不同的智能指针：String`，`Vec\<T>`，`Box\<T>`，`Rc\<T>`，`Arc\<T>`，`Weak\<T>`，`Cell\<T>`，`RefCell\<T>`，`UnsafeCell\<T>

标准库中最常用的智能指针：

- **`Box<T>`，用于在堆上分配值**
- **`Rc<T>`，一个引用计数类型，其数据可以有多个所有者**
- **`Ref<T>` 和 `RefMut<T>`，通过 `RefCell<T>` 访问（ `RefCell<T>` 是一个在运行时而不是在编译时执行借用规则的类型）**

## 2. 智能指针的实现基础

智能指针通常用结构体来提现，**智能指针区别于常规结构体的显著特性在于其实现了 `Deref` 和 `Drop` trait。**实现`Deref` trait允许我们重载解引用运算符（dereference operator）**`*`**

```rust
fn main() {
    let a = &1;
    let b = Box::new(1);
    assert_eq!(1, *a);
    assert_eq!(1, *b);
}
```

### 2.1.Box\<T>智能指针

通过上面的我们可以知道智能指针是一个结构体，下面我们来看一下源码：

```rust
#[lang = "owned_box"]
#[fundamental]
#[stable(feature = "rust1", since = "1.0.0")]
// The declaration of the `Box` struct must be kept in sync with the
// `alloc::alloc::box_free` function or ICEs will happen. See the comment
// on `box_free` for more details.
pub struct Box<
    T: ?Sized,
    #[unstable(feature = "allocator_api", issue = "32838")] A: Allocator = Global,
>(Unique<T>, A);
```

通过上面的源码可以知道Box\<T>是一个结构体，同时实现了实现了 `Deref` 和 `Drop` trait我们看一下源码：

```rust
#[stable(feature = "rust1", since = "1.0.0")]
unsafe impl<#[may_dangle] T: ?Sized, A: Allocator> Drop for Box<T, A> {
    fn drop(&mut self) {
        // FIXME: Do nothing, drop is currently performed by compiler.
    }
}

#[stable(feature = "rust1", since = "1.0.0")]
impl<T: ?Sized, A: Allocator> Deref for Box<T, A> {
    type Target = T;

    fn deref(&self) -> &T {
        &**self
    }
}
```

通过上面的源码可以发现drop并没有任何实现。

例子：

```rust
 let b = Box::new(5); //数据存储在堆上面
 let c = 2; //数据存储在栈上面
```

`Box<T>` 是一种智能指针类型，用于在堆上分配和存储数据，并在不同作用域之间共享所有权。`Box<T>` 的主要使用场景是在需要动态分配的数据，但又需要在编译时知道大小的情况下使用。

以下是一些使用 `Box<T>` 的常见场景，并给出相应的例子：

1. **动态分配大型数据结构：**

   ```rust
   struct BigStruct {
       // 大型数据结构
   }
   
   fn create_big_struct() -> Box<BigStruct> {
       let big_struct = BigStruct {
           // 初始化大型数据结构
       };
       Box::new(big_struct)
   }
   ```


2. **在递归数据结构中避免无限大小问题**：

   ```rust
   enum LinkedList<T> {
       Cons(T, Box<LinkedList<T>>),
       Nil,
   }
   ```

3. **在 trait 对象中存储类型对象**：

   ```rust
   trait Shape {
       fn area(&self) -> f64;
   }
   
   struct Circle {
       radius: f64,
   }
   
   impl Shape for Circle {
       fn area(&self) -> f64 {
           std::f64::consts::PI * self.radius * self.radius
       }
   }
   
   fn main() {
       let circle: Box<dyn Shape> = Box::new(Circle { radius: 5.0 });
       println!("Circle area: {}", circle.area());
   }
   ```

4. **使用在编译时未知大小的类型**：

   ```rust
   fn process_unknown_size_data(data: &[u8]) -> Box<[u8]> {
       data.to_vec().into_boxed_slice()
   }
   ```

5. **构建递归数据结构**：

   这个和第二个在递归数据结构中避免无限大小问题类似

   ```rust
   #[derive(Debug)]
   struct Node {
    value: i32,
       next: Option<Box<Node>>,
   }
   
   fn main() {
       let node1 = Node {
        value: 1,
           next: None,
       };
   
       let node2 = Node {
        value: 2,
           next: Some(Box::new(node1)),
       };
   
       println!("{:?}", node2);
   }
   ```

总之，`Box<T>` 在需要在堆上分配数据并且在不同作用域之间共享所有权时非常有用。它是 Rust 中处理动态分配的数据的重要工具，能够帮助避免生命周期和所有权问题。

## 3. 自定义智能指针

智能指针的关键在于实现 **`Deref` 和 `Drop` trait** 。 所以我们自定义也必须实现。

```
use std::ops::Deref;
fn main() {
    let pointer = MxsmSmartPointer::new(1);
    println!("{:?}", pointer);
    assert_eq!(1,*pointer);
}
#[derive(Debug)]
pub struct MxsmSmartPointer{
    num: i32
}

impl MxsmSmartPointer{
    fn new(num:i32)->Self{
        Self{
            num
        }
    }
}
impl Drop for MxsmSmartPointer {
    fn drop(&mut self) {
        println!("Drop")
    }
}
impl Deref for  MxsmSmartPointer{
    type Target = i32;
    fn deref(&self) -> &Self::Target {
        &self.num
    }
}
```

运行代码结果：

```shell
D:/develop/Rust/mxsm_application/target/debug/mxsm_application.exe
MxsmSmartPointer { num: 1 }
Drop

Process finished with exit code 0
```

## 4.总结

首先智能指针的基础是**`Deref` 和 `Drop` trait**， 上面列举了Box智能指针的用法和部分的源码，同时让我们知道如何自定义相关的智能指针。Rust 语言中有多种智能指针类型，它们具有不同的特点和用途。

1. Rc\<T>：共享所有权的智能指针，允许多个引用同时指向同一个对象。Rc<T> 实现了所有权模式，当所有引用都被删除时，它会自动释放该对象的内存。
2. Arc\<T>：与 Rc\<T> 类似，但是它支持跨线程安全的共享所有权。
3. Box\<T>：轻量级的智能指针，用于分配堆内存并将其转换为不可变的值。
4. Ref\<T>：不可变的智能指针，用于指向一个不可变的值。它不能被复制或移动，并且保证了指向的值在整个生命周期内不会被修改。
5. Pin\<T>：类似于 Ref<T>，但是它可以在借用检查过程中被固定，以确保它不会被移动或删除。
6. Send\<T>：用于实现跨线程安全的智能指针。它确保了在不同线程中使用的智能指针指向的对象是安全的。

这些智能指针类型在 Rust 中被广泛使用，它们提供了高效、安全的内存管理方法，帮助程序员避免常见的内存问题，如内存泄漏和悬空指针。

> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)\~谢谢! Emal:<mxsm@apache.com>