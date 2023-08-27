---
title: "Rust生命周期(lifetime)与引用有效性"
sidebar_label: Rust生命周期(lifetime)与引用有效性
linkTitle: "Rust生命周期(lifetime)与引用有效性"
weight: 202308272027
description: Rust生命周期(lifetime)与引用有效性
---

## 1. Rust生命周期(lifetime)是什么?

在 Rust 中，生命周期（Lifetime）是指一个变量或借用的有效时间范围。它指定了一个变量或借用在何时被创建，以及它在何时不再存在。Rust 中的每个变量或借用都有一个生命周期，它必须在其有效时间范围内被使用。如果一个变量或借用的生命周期结束了，那么它将不能再被访问，否则会引发编译时错误。生命周期通常由 Rust 中的编译器自动管理，开发者不需要手动管理生命周期。但是，开发者可以通过使用 Rust 的生命周期语法来指定生命周期，以实现更加精细的内存管理。

> 说明：
>
> - 生命周期结束，变量和借用生命周期结束
> - 生命周期由Rust自己掌管，开发人员无需手动管理

**划重点：**

- **Rust 中的每一个引用都有其 生命周期（*lifetime*），也就是引用保持有效的作用域。大部分时候生命周期是隐含并可以推断的，正如大部分时候类型也是可以推断的一样。**

例子：

```rust
fn mxsm(x: &str) -> &str {
    x
}
```

上面的例子生命周期隐藏了。

## 2.生命周期(lifetime)标注

**生命周期标注并不改变任何引用的生命周期的长短。与当函数签名中指定了泛型类型参数后就可以接受任何类型一样，当指定了泛型生命周期后函数也能接受任何生命周期的引用。生命周期标注描述了多个引用生命周期相互的关系，而不影响其生命周期。**

生命周期参数名称必须以撇号（`'`）开头，其名称通常全是小写，类似于泛型其名称非常短。`'a` 是大多数人默认使用的名称。生命周期参数标注位于引用的 `&` 之后，并有一个空格来将引用类型与生命周期标注分隔开。

> 说明：
>
> - 'static 是Rust内置的生命周期，相当于关键字。
> - 生命周期标注告诉 Rust 多个引用的泛型生命周期参数如何相互联系的

### 2.1 变量生命周期标注

生命周期标注语法：

```rust
&i32  //引用默认
&'a i32 //带有显示生命周期
&'a mut i32 // 带有显式生命周期的可变引用
```

### 2.2 函数签名中的生命周期标注

```rust
fn mxsm_fn(x: &str, y: &str) -> &str { //在开发工具中会直接提示报错
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

通过函数签名标注生命授权来消除编译错误：

```rust
fn mxsm_fn<'a>(x: &'a str, y: &'a str) -> &'a str { //开发工具可以就编译通过
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

### 2.3结构体定义中的生命周期标注

```rust
struct mxsm{
    name: &str, //开发工具直接报错 缺少生命周期
    name_t: String //没有错误
}
```

从上面的代码可以验证一句话：**Rust 中的每一个引用都有其 生命周期，有的时候被省略了而已。** 

结构体定义生命周期标注语法：

```rust
struct mxsm<'mxsm>{
    name: &'mxsm str,
    name_t: String
}
```

###  2.4方法定义中的生命周期标注

```rust
struct mxsm<'a>{
    st:&'a str
}

impl<'a> mxsm<'a> {
    fn mxsm_fn(&self)->i32{
        3
    }
    fn mxsm_ts(&self, tt:&str) -> &str{
        self.st
    }
}

```

### 2.5 Trait生命周期边界

语法：

```rust
Syntax
TypeParamBounds :
   TypeParamBound ( + TypeParamBound )* +?

TypeParamBound :
      Lifetime | TraitBound

TraitBound :
      ?? ForLifetimes? TypePath
   | ( ?? ForLifetimes? TypePath )

LifetimeBounds :
   ( Lifetime + )* Lifetime?

Lifetime :
      LIFETIME_OR_LABEL
   | 'static
   | '_
```

特征（Trait）和生命周期界限为泛型项目（generic item）提供了一种限制其参数类型和生命周期的方法。可以在 where 子句中为任何类型提供边界。对于某些常见情况，也有更简短的形式：

- 在声明通用参数之后编写边界：`fn f<A: Copy>() {}` 与 `fn f<A>() where A: Copy {}` 相同。
- 在特征声明中作为超特征（supertrait）：`trait Circle: Shape {}` 等同于 `trait Circle where Self: Shape {}`。
- 在特征声明中作为关联类型的边界：`trait A { type B: Copy; }` 等同于 `trait A where Self::B: Copy { type B; }`。

在使用项目时，项目的边界必须得到满足。在对泛型项目进行类型检查和借用检查时，边界可用于确定类型是否实现了某个特征。例如，对于 `Ty: Trait`：

- 在泛型函数的主体中，可以对 `Ty` 值调用来自 `Trait` 的方法。同样，可以使用 `Trait` 上的关联常量。
- 可以使用来自 `Trait` 的关联类型。
- 可以使用带有 `T: Trait` 边界的泛型函数和类型，并将 `Ty` 用于 `T`。

## 3. 生命周期省略

函数或方法的参数的生命周期被称为 **输入生命周期**（*input lifetimes*），而返回值的生命周期被称为 **输出生命周期**（*output lifetimes*）。

**生命周期省略的三条规则：**

1. **每一个是引用的参数都有它自己的生命周期参数**

   ```rust
   fn mxsm_fn<'a,'b>(x: &'a str, y: &'b str)
   fn mxsm_fn1<'a,'b,'c>(x: &'a str, y: &'b str, c: &'c str)
   ```

   通过上面的例子可以知道：有一个引用参数的函数有一个生命周期参数

2. **如果只有一个输入生命周期参数，那么它被赋予所有输出生命周期参数**

   ```rust
   fn mxsm(x: &i32) -> &i32
   fn mxsm<'a>(x: &'a i32) -> &'a i32
   ```

   上面代码等同

3. **如果方法有多个输入生命周期参数并且其中一个参数是 `&self` 或 `&mut self`，那么所有输出生命周期参数被赋予 `self` 的生命周期**

> 说明：方法第一个参数是**&self**` 或 `**&mut self** ，说明是对象的方法。

## 4.静态生命周期

**`'static`，其生命周期能够存活于整个程序期间。** 所有的字符串字面量都拥有 `'static` 生命周期，如下面例子：

```rust
let mxsm:&'static str = "mxsm world";
```

### 4.1 'static 生命周期省略

**常量和静态引用类型的声明都隐式地具有’static’生命周期，除非明确指定生命周期。**

```rust
const STRING: &str = "bitstring"; //生命周期省略
const STRING: &'static str = "bitstring"; //显示生命周期
```

**如果静态或常量项包括函数或闭包引用，而这些引用本身又包括引用，则编译器将首先尝试标准省略规则。如果它无法通过其通常的规则解决生命周期**

```rust
// Resolved as `fn<'a>(&'a str) -> &'a str`.
const RESOLVED_SINGLE: fn(&str) -> &str = |x| x;

// Resolved as `Fn<'a, 'b, 'c>(&'a Foo, &'b Bar, &'c Baz) -> usize`.
const RESOLVED_MULTIPLE: &dyn Fn(&Foo, &Bar, &Baz) -> usize = &somefunc;
```

## 5.总结

Rust 的生命周期机制是一种确保代码正确性和安全性的重要机制。通过理解 Rust 的生命周期概念，开发者可以编写更加可靠和安全的代码。

> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)\~谢谢! Emal:<mxsm@apache.com>