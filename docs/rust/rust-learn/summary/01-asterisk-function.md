---
title: "Rust星号(*)的作用"
linkTitle: "Rust星号(*)的作用"
sidebar_label: Rust星号(*)的作用
weight: 202309091403
description: Rust星号(*)的作用
---

在Rust中，`*`符号具有多种不同的用途，具体取决于它的使用方式。以下是Rust中`*`常见的用法.

## 1.**解引用指针**

当作为一元运算符放在指针变量之前时，`*`用于解引用指针并访问它指向的值。在Rust中，通常更推荐使用引用而不是原始指针。引用提供了更多的安全性和可读性。解引用引用时，不需要使用 `*`，因为 Rust 自动处理引用的解引用。例如：

```rust
fn main() {
    let x = 42;
    let ptr = &x;
    let value = *ptr; // 解引用指针
    println!("{}", value);
}
```

在这个示例中，`*ptr`从指针指向的内存位置检索值`42`。

## 2.**类型注解**

在函数签名和类型注解中，`*`用于表示原始指针类型。例如：

```rust
fn process_data(data: *const i32) {
    // 函数接受一个指向i32的原始指针
}
```

在这里，`*const i32`表示对不可变的原始指针类型。

## 3. **创建原始(raw)指针**

在表达式中作为`&`的右侧使用`*`，用于从引用创建原始指针。和引用一样，原始指针是不可变或可变的，分别写作 `*const T` 和 `*mut T`

```rust
fn main() {
    let x = 42;
    let ptr: *const i32 = &x; // 从引用创建原始指针
    let mut y = 42;
    let ptr1: *mut i32 = &mut y;
}
```

> 在Rust中，您不能直接将不可变引用（`&`）赋值给可变指针（`*mut`）或将可变引用赋值给不可变指针（`*const`）。这是因为可变指针允许对数据进行可变修改，而不可变引用要求数据是不可变的，这两者之间存在不兼容性。
>
> 请注意，使用可变指针需要放在 `unsafe` 块内，并且需要格外小心，以确保不会导致不安全性问题。

### **引用解引用 (`&T` 和 `&mut T`)**

在Rust中，通常更推荐使用引用而不是原始指针。引用提供了更多的安全性和可读性。解引用引用时，不需要使用 `*`，因为 Rust 自动处理引用的解引用。

```rust
fn main() {
    let mut x = 42;

    let reference = &x; // 创建不可变引用

    // 不需要使用 * 解引用引用
    println!("Value: {}", reference);

    let mutable_reference = &mut x; // 创建可变引用

    // 不需要使用 * 解引用引用
    *mutable_reference = 100; // 修改值

    println!("Value: {}", x); // 打印修改后的值
}

```

## 4.**乘法运算符**

在算术表达式中，`*`用作乘法运算符。例如：

```rust
let result = 3 * 4; // 将3和4相乘
```

在大部分语言中都是作为乘法运算符

## 5. **通配符导入**

在模块声明中，`*`可用于通配符导入，以从模块中导入所有项目。Java语言中也是可以用于通配符。例如

```rust
mod my_module {
    pub fn function1() {}
    pub fn function2() {}
}

use my_module::*; // 从my_module导入所有项目
```

在这种情况下，`*`用于导入所有项目（在这个示例中是函数）从`my_module`模块中。`*`的含义取决于它在代码中的上下文，因此在Rust代码中使用时需要注意它的用法。

> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)\~谢谢! Emal:mxsm@apache.com