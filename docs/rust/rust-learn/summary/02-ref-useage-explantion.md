---
title: "Rust ref 和 & 使用详解"
linkTitle: "Rust ref 和 & 使用详解"
sidebar_label: Rust ref 和 & 使用详解
weight: 202309100959
description: Rust ref 和 & 使用详解
---

## 1. ref和&都是用来定义指针

先看下面的代码：

```rust
fn main() {
    let i = 1;
    let l = &i;
    let ref j = i;
    println!("{} {}", l, j)
}
```

结果都一样，都是在声明指针。区别在哪？**`&`在右边，而`ref`在左边**。验证修改值是否可以：

```rust
fn main() {
    let mut  i = 1;
    let l = &mut i;
    *l = 10;
    println!("{}", l);

    let ref mut  j = i;
    *j = 20;
    println!("{}" j)
}
```

## 2. ref

**`ref` 关键字**：

- `ref` 关键字通常用于模式匹配中，用于创建引用绑定。
- 它允许您在模式匹配中创建引用，而不会转移所有权。
- 一般用于让模式匹配不消耗值，例如在 `match` 表达式中捕获引用。

示例：  

```rust
fn main() {
    let value = 42;
    let reference = &value;
    
    match reference {
        &ref x => println!("Got a reference to {}", x),
        _ => println!("No reference found"),
    }
}
```

**`ref` 通常用于模式匹配中，用于创建引用绑定，以便在模式匹配中访问引用，而不转移所有权。**

## 3. &

**`&` 符号**：

- `&` 符号用于创建引用，它是 Rust 中用于借用值的常见方式。
- 它可以用在变量前来创建不可变引用（借用）。

示例：

```rust
fn main() {
    let value = 42;
    
    // 创建不可变引用
    let reference = &value;
    
    // 通过引用访问值
    println!("Got a reference to {}", *reference);
}
```

**`&` 用于创建引用，以便在代码中借用值，允许读取但不修改被引用的值。**

## 4. 总结

**`ref` 关键字**：

- `ref` 关键字通常用于模式匹配中，用于创建引用绑定。
- 它允许您在模式匹配中创建引用，而不会转移所有权。
- 一般用于让模式匹配不消耗值，例如在 `match` 表达式中捕获引用。

**`&` 符号**：

- `&` 符号用于创建引用，它是 Rust 中用于借用值的常见方式。
- 它可以用在变量前来创建不可变引用（借用）。