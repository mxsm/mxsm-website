---
title: "Rust trait你不知道的使用"
sidebar_label: Rust trait你不知道的使用
linkTitle: "Rust trait你不知道的使用"
weight: 202403031606
description: Rust trait你不知道的使用

---

## 1. trait是什么

### 1.1 trait的定义

描述了一个struct可以实现抽象接口，可以理解为Java中的接口，特别是和JDK8 中的接口相似。 能够提供默认实现

### 1.2 trait里面可以包含什么

trait可以由下面三种类型组成：

- 方法（functions）
- 类型 (types)
- 常量（constants）

> 说明：trait不能包含常量方法，也就是方法不能用关键字const修饰

例子：

```rust
trait Example {
    const CONST_NO_DEFAULT: i32;
    const CONST_WITH_DEFAULT: i32 = 99;
    type TypeNoDefault;
    fn mxsm(&self);
    fn mxsm_with_default(&self) {} // 默认实现
   // const fn mxsm_with_default_const()  编译错误，不能包含const修饰的方法
}
```



## 2. trait的作用

### 2.1 泛型约束

泛型参数可以使用trait来作为边界进行限制

```rust
trait Seq<T: Send> {

}
```

### 2.2 作为方法参数或者返回值（impl Trait）

```rust
pub trait MessageStore {}

fn store(arg: impl MessageStore) {
}

fn get_store() -> impl MessageStore {
}
```

`impl Trait` 提供了指定未命名但实现特定trait的具体类型的方法。它可以出现在两种地方：参数位置（可以作为函数的匿名类型参数）和返回位置（可以作为抽象返回类型）

#### 2.2.1 匿名参数类型

函数可以使用 `impl` 后跟一组trait bounds来声明一个具有匿名类型的参数。调用方必须提供满足匿名类型参数声明的边界的类型，并且函数只能使用通过匿名类型参数的trait边界可用的方法。

```rust
pub trait MessageStore {}

fn store(arg: impl MessageStore) {
}
fn store<T:MessageStore>(arg: T) {
    
}
```

上面基本上是等价的。

#### 2.2.2 抽象返回类型

抽象类型返回也被叫做返回位置的impl Trait。 函数可以使用 `impl Trait` 来返回抽象返回类型。这些类型代替了另一个具体类型，调用者只能使用指定的 `Trait` 声明的方法。函数的每个可能的返回值必须解析为相同的具体类型。

函数返回值是抽象类型有两种写法：

```rust
pub trait MessageStore {}

fn store()->Box<dyn MessageStore> {
}

fn store()-> impl MessageStore {
}
```

但是使用Box会有可能会导致堆分配和动态分派的性能损失。所以在某些情况下第二种使用impl trait的写法会更合适。

#### 2.2.3 impl Trait作为trait中方法的返回

traits中的函数也可以使用 `impl Trait` 作为匿名关联类型的语法。

> 说明：在trait中支持返回impl trait是在rust 1.75.0版本。

同样写法也有两种,第一种使用泛型（和使用参数的写法一致）：

```rust
fn store<T:StoreMessage>()-> T {
}
```

第二种写法就是 impl Trait的方式：

```
fn store()-> impl MessageStore {
}
```

两者有着显著的差别：第一种可以允许调用者确定返回类型T,而第二种不允许调用方确定返回类型。相反，函数选择返回类型，但只承诺它将实现 `Trait`

#### 2.2.4 impl Trait限制

impl Trait 只能作为非 extern 函数的参数或返回类型出现。它不能是 let 绑定的类型、字段类型或出现在类型别名中。如何来理解？

在 Rust 中，`impl Trait` 语法用于指定函数参数或返回类型的匿名类型。它可以用于函数签名中作为参数类型或返回类型，但不能在其他地方使用。让我们通过示例来理解：

```rust
trait MyTrait {
    fn foo(&self);
}

struct MyStruct;

impl MyTrait for MyStruct {
    fn foo(&self) {
        println!("MyStruct foo");
    }
}

// 该函数接受实现了 MyTrait trait 的类型的引用作为参数
fn print_trait_object(item: &impl MyTrait) {
    item.foo();
}

fn main() {
    let my_struct = MyStruct;

    // 在函数调用中，我们可以传递任何实现了 MyTrait 的类型的引用
    print_trait_object(&my_struct);

    // 但我们不能将 impl Trait 用于 let 绑定的类型、字段类型或类型别名
    // 以下代码会导致编译错误，因为 Rust 不允许将 impl Trait 用于这些位置
    // let item: impl MyTrait = MyStruct;
    // struct MyStruct2 {
    //     item: impl MyTrait,
    // }
    // type MyType = impl MyTrait;
}

```

在这个例子中，我们定义了一个 `MyTrait` trait 和一个实现了该 trait 的 `MyStruct` 结构体。然后，我们定义了一个函数 `print_trait_object`，它接受一个实现了 `MyTrait` trait 的类型的引用作为参数，并调用了该类型上的 `foo` 方法。

在 `main` 函数中，我们创建了一个 `MyStruct` 实例，并将其传递给 `print_trait_object` 函数进行调用。这是合法的，因为 `MyStruct` 实现了 `MyTrait` trait。

然而，我们不能在 let 绑定的类型、字段类型或类型别名中使用 `impl Trait`，因为 Rust 不允许这样的用法。如果尝试这样做，编译器会报错。

### 2.3 Trait对象

trait对象是另一种类型的不透明值，它实现了一组trait。trait的集合由一个对象安全的基本trait加上任意数量的auto trait组成。这里有两个点需要注意：

- trait对象必须是对象安全
- 一组trait中只能有一个有一个非自动实现的trait.

例子：

- `dyn Trait`
- `dyn Trait + Send`
- `dyn Trait + Send + Sync`
- `dyn Trait + 'static`
- `dyn Trait + Send + 'static`
- `dyn Trait +`
- `dyn 'static + Trait`.
- `dyn (Trait)`

如果两个trait对象类型彼此别名，并且自动trait的集合相同且生存期边界相同，则两个trait对象类型彼此别名

```rust
dyn Trait + Send + Sync
dyn Trait + Sync + Send
```

由于值的具体类型是不透明的，trait对象是动态大小的类型。像所有DST一样，trait对象在某种类型的指针后面使用;所以可以通过智能指针进行包裹：例如**Box&lt;dyn MessageStore&gt;** 或者 **&dyn MessageStore** ,指向trait对象的指针的每个实例包括：

- 一个指向类型 `T` 的实例的指针，该类型实现了Trait
- 一个虚方法表，通常简称为vtable，对于**Trait**的每个方法及其由 `T` 实现的特性，它包含一个指向 `T` 实现的指针（即函数指针）

### 2.4 trait对象安全

先看一个例子：

```rust
pub trait MessageStore {
    fn store(&mut self, data: &[u8]) -> impl Future<Output = ()>;
}
pub mod test_t {
    use crate::MessageStore;

    pub struct TestT {
        a: i32,
        b: Box<dyn MessageStore>,
    }
}
```

进行编译会发现一个编译器报错：

```
error[E0038]: the trait `MessageStore` cannot be made into an object
  --> rocketmq-bytebuf\src\lib.rs:34:16
   |
34 |         b: Box<dyn MessageStore>,
   |                ^^^^^^^^^^^^^^^^ `MessageStore` cannot be made into an object
   |
note: for a trait to be "object safe" it needs to allow building a vtable to allow the call to be resolvable dynamically; for more information visit <https://doc.rus
t-lang.org/reference/items/traits.html#object-safety>
  --> rocketmq-bytebuf\src\lib.rs:27:41
   |
26 | pub trait MessageStore {
   |           ------------ this trait cannot be made into an object...
27 |     fn store(&mut self, data: &[u8]) -> impl Future<Output = ()>;
   |                                         ^^^^^^^^^^^^^^^^^^^^^^^^ ...because method `store` references an `impl Trait` type in its return type
   = help: consider moving `store` to another trait

For more information about this error, try `rustc --explain E0038`.

```

这个也是在写Rocketmq-rust项目的时候遇到的问题，很多刚学习的Rust的也都遇到过。那么我们就来分析下原因。在分析原因之前我们来了解一下trait对象安全。

在Rust官网也给出了trait对象安全的定义对官网的定义进行整理主要分成两类：

第一类：trait本身

- 所有的super trait必须是对象安全的
- Sized不能是super trait
- trait中不能包含任何常常
- trait不能与任何泛型相关联

第二类: trait方法：所有关联的函数都必须是可从trait对象调度的，或者是显式不可调度的：

- 可调度的方法

  - 没有任何类型参数
  - 是一个不使用 `Self` 的方法，除非在接收器的类型中。
  - 具有以下类型之一的接收器：
    - `&Self` (i.e. `&self`)
    - `&mut Self` (i.e `&mut self`)
    - [`Box`](https://doc.rust-lang.org/reference/special-types-and-traits.html#boxt)
    - [`Rc`](https://doc.rust-lang.org/reference/special-types-and-traits.html#rct)
    - [`Arc`](https://doc.rust-lang.org/reference/special-types-and-traits.html#arct)
    - [`Pin<P>`](https://doc.rust-lang.org/reference/special-types-and-traits.html#pinp) 这里的P是上面之一
  - 没有不透明的返回类型
    - 不能有 async fn(这个可以看成 impl Future)
    - 没有返回值为 impl Trait类型
  - 没有 `where Self: Sized` 界限

- 显式不可调度函数需要

  具有 `where Self: Sized` 界限

trait对象就是 dyn Trait  这是表示trait对象，存在的形式可以是下面几种。

作为struct的属性项：

```rust
pub struct Mxsm<'a> {
    store: &'a dyn MessageStore
}

pub struct MxsmBox {
    store: Box<dyn MessageStore>
}

pub struct MxsmArc {
    store: Arc<dyn MessageStore>
}
```

可以用一个智能指针包装或者使用引用。

2 作为方法的参数：

```rust
pub struct TestT;
impl TestT {
    pub fn get_a(&self, t: &dyn MessageStore) -> i32 {
        0
    }
	pub fn get_a1(&self, t: Box<dyn MessageStore>) -> i32 {
            0
     }
}
```

### &#x20;所有的super trait 必须是也是对象安全

看面这个例子：

```rust
pub trait MessageStore {
    const ID: i32 = 1;
    fn store(&mut self, data: &[u8]) -> i32;
}
pub trait MessageStoreMut1: MessageStore {
   
    fn store_mut(&mut self, data: &[u8]) -> i32;
}
```

这种就违背了上述条件，不是所有的super trait必须是对象安全

### trait中不能包含任何常量

看下面的例子：

```rust
pub trait MessageStore {
    const ID: i32 = 1;
    fn store(&mut self, data: &[u8]) -> i32;
}
```

包含了常量ID

### trait不能与任何泛型相关联

在 Rust 中，有一个特定的规则称为 "trait 对象安全性" 规则。这个规则确保 trait 对象的使用是安全的，它包括以下要求：

*   trait 对象不能包含关联类型。
*   trait 对象中的方法不能有泛型参数。

这个规则的目的是确保编译器在编译时可以确定 trait 对象的大小和布局，以便在运行时能够正确地调用方法。

让我们通过一个例子来理解这个规则：

```rust
trait MyTrait&lt;T&gt; {
fn foo(\&self, x: T);
}

struct MyStruct;

impl MyTrait&lt;i32&gt; for MyStruct {
fn foo(\&self, x: i32) {
println!("MyStruct foo: {}", x);
}
}

fn main() {
let my\_struct = MyStruct;


// 以下代码会导致编译错误，因为 trait 对象中的方法有泛型参数
// let trait_object: &dyn MyTrait<i32> = &my_struct;

// 要使得代码编译通过，我们需要将泛型参数替换为具体的类型
let trait_object: &dyn MyTrait<i32> = &my_struct as &dyn MyTrait<i32>;

trait_object.foo(42);
}
```

在这个例子中，我们定义了一个 `MyTrait` trait，它有一个泛型参数 `T`，并且包含一个方法 `foo`，该方法接受一个泛型参数 `x`。

然后，我们实现了 `MyTrait<i32>` trait for `MyStruct` 结构体，使得 `MyStruct` 实现了具体类型的 `MyTrait` trait。

在 `main` 函数中，我们创建了一个 `MyStruct` 实例，并尝试将其转换为 `&dyn MyTrait<i32>` 类型的 trait 对象。然而，由于 `MyTrait` 中的方法具有泛型参数 `T`，这导致了编译错误。要解决这个问题，我们需要将泛型参数替换为具体的类型，如 `i32`，以确保方法的签名在编译时是确定的。
