---
title: "Rust基本数据类型"
sidebar_label: Rust基本数据类型
linkTitle: "Rust基本数据类型"
weight: 202308122021
description: Rust基本数据类型
---

## 1. 基本数据类型

![基本数据类型](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/concepts%E5%9F%BA%E6%9C%AC%E6%95%B0%E6%8D%AE%E7%B1%BB%E5%9E%8B.png)

在 Rust 中，有一些基本的数据类型，用于表示各种不同的值。以下是 Rust 中常见的基本数据类型：

1. **整数类型（Integer Types）**：用于表示整数值，分为有符号和无符号两种。有符号整数使用 `i` 前缀，无符号整数使用 `u` 前缀，后面跟随位数，例如 `i32` 和 `u64`。

   - `i8`, `u8`: 8 位有符号和无符号整数
   - `i16`, `u16`: 16 位有符号和无符号整数
   - `i32`, `u32`: 32 位有符号和无符号整数
   - `i64`, `u64`: 64 位有符号和无符号整数
   - `i128`, `u128`: 128 位有符号和无符号整数
   - `isize`, `usize` :`isize` 是一个有符号整数类型，`usize` 是一个无符号整数类型，其大小与当前计算机架构的指针大小相同。在 32 位架构上，`isize` 通常为 4 字节（32 位），在 64 位架构上，`isize` 通常为 8 字节（64 位）。`isize` 主要用于表示内存地址、索引等。

   :::info 说明

   `isize`和`usize`这两个类型的主要用途是在涉及内存操作、指针运算、索引访问等场景中使用，以确保代码的可移植性和正确性。由于它们的大小与计算机架构相关，所以在不同架构上运行的程序可以在 `isize` 和 `usize` 类型下进行内存操作，而不必担心大小问题。

   :::

2. **浮点数类型（Floating-Point Types）**：用于表示带有小数部分的数值。

   - `f32`: 32 位单精度浮点数
   - `f64`: 64 位双精度浮点数（默认类型）

3. **布尔类型（Boolean Type）**：表示真或假的值。

   - `bool`: 只有两个可能值 `true` 或 `false`

4. **字符类型（Character Type）**：表示单个 Unicode 字符。

   - `char`: 存储单个 Unicode 字符

5. **元组类型（Tuple Type）**：用于组合多个不同类型的值为一个值。

   - `(T1, T2, ...)`: 元组类型，可以存储多个不同类型的值

6. **数组类型（Array Type）**：用于存储相同类型的多个值。

   - `[T; N]`: 数组类型，存储固定数量的相同类型的值

这些是 Rust 中最基本的数据类型，您可以将它们用于创建和操作不同类型的数据。同时，Rust 还支持枚举、结构体和其他复杂类型，以及自定义数据类型，用于更复杂的数据表示和处理。

:::info 说明

**指针类型（Pointer Types）**：用于引用内存中的数据。

- `&T`: 不可变引用
- `&mut T`: 可变引用
- `*const T`: 不可变原生指针
- `*mut T`: 可变原生指针

:::

## 2. 与Java数据的对比

以下是 Rust 和 Java 中一些常见数据类型的对比：

1. **整数类型**：

   - Rust：有符号整数使用 `i` 前缀，无符号整数使用 `u` 前缀。例如，`i32` 表示 32 位有符号整数。
   - Java：有符号整数使用 `int`，无符号整数不直接支持。长整型使用 `Long` 。 没有直接指出128位长度的整型数据

2. **浮点数类型**：

   - Rust：有 `f32` 和 `f64` 两种浮点数类型，分别表示 32 位和 64 位浮点数。
   - Java：有 `float` 和 `double` 两种浮点数类型，分别表示单精度和双精度浮点数。

3. **布尔类型**：

   - Rust：有 `bool` 类型，值为 `true` 或 `false`。
   - Java：有 `boolean` 类型，值为 `true` 或 `false`。

   boo值两种语言相似

4. **字符类型**：

   - Rust：有 `char` 类型，用于存储单个 Unicode 字符。
   - Java：有 `char` 类型，同样用于存储单个 Unicode 字符。

5. **字符串类型**：

   - Rust：有字符串切片（`&str`）和 `String` 类型。字符串切片用于引用字符串数据，而 `String` 是可变的字符串类型。
   - Java：有 `String` 类型，是不可变的字符串类。

6. **数组类型**：

   - Rust：有固定长度的数组和动态数组（`Vec` 类型）。固定长度数组表示为 `[T; N]`，`Vec` 类型是动态大小的数组。
   - Java：有固定长度的数组和 `ArrayList`，后者是动态大小的数组列表。

7. **指针和引用**：

   - Rust：有引用（`&`）和可变引用（`&mut`），用于借用数据。还有原生指针（`*const` 和 `*mut`）。
   - Java：有引用（通过对象引用）和原生指针（`null` 表示）。

   在Java中没有指针一说，而Rust和C++类似

8. **枚举类型**：

   - Rust：有强大的枚举类型，可以包含多种变体和数据。
   - Java：有枚举类型，但功能相对较弱。

9. **结构体和类**：

   - Rust：有结构体和元组结构体，没有类的概念。可以使用关联函数实现面向对象模式。
   - Java：有类，支持面向对象编程。Java的类就是结构体的高度封装

10. **空类型**：

    - Rust：有 `Option<T>` 枚举，表示可能为空的值。
    - Java：有 `null` 值表示可能为空。

11. **usize类型**：

    - Rust：Rust有 usize类型
    - Java: 缺少像usize这样的类型

## 3. Rust示例

```rust
fn main() {
    let i = 2;
    let i: i8 = 1;
    let j = 1.0;
    let f:f32 = 2.0;
    let tt = true;
    let tt:usize = 1;
    let ttt = (1,2,String::from("mxsm"));
    let a =  ["January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"];
}
```

上面代码是定义不同的数据类型

![image-20230812210319480](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/conceptsimage-20230812210319480.png)

通过代码开发工具可以看到整型的默认值位 **i32** ,浮点型的默认值为 **`f64`**

> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)\~谢谢! Emal:&lt;mxsm@apache.com>
