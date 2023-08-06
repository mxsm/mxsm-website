---
title: "引用和借用"
sidebar_label: "4.2. 引用和借用"
linkTitle: "引用和借用"
weight: 202308051736
description: 引用和借用
---

## [引用和借用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html#references-and-borrowing)

在列表 4-5 中的元组代码中存在一个问题，即我们必须将 `String` 返回给调用函数，这样在调用 `calculate_length` 后仍然可以使用 `String`，因为 `String` 被移动到了 `calculate_length` 中。相反，我们可以提供一个对 `String` 值的引用。*引用* 就像指针一样，它是一个地址，我们可以跟随它来访问存储在该地址的数据；该数据由其他某个变量拥有。与指针不同的是，引用在其生命周期内保证指向某种特定类型的有效值。

下面是如何定义和使用一个带有对象引用作为参数的 `calculate_length` 函数，而不是获取值的所有权：

文件名：src/main.rs

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

首先，注意在变量声明和函数返回值中的所有元组代码都消失了。其次，在 `calculate_length` 中，我们将 `&s1` 传递给 `calculate_length`，并且在其定义中，我们使用 `&String` 而不是 `String`。这些 & 符号表示*引用*，它们允许您引用某个值而不获取其所有权。图 4-5 描述了这个概念。

![Three tables: the table for s contains only a pointer to the table for s1. The table for s1 contains the stack data for s1 and points to the string data on the heap.](https://doc.rust-lang.org/book/img/trpl04-05.svg)

图 4-5：`&String s` 指向 `String s1` 的示意图

:::tip 注意

使用 `&` 进行引用的反操作是*解引用*，可以使用解引用运算符 `*` 进行解引用。我们将在第 8 章中看到解引用运算符的一些用法，并在第 15 章中讨论解引用的详细信息。

:::

让我们仔细看看这里的函数调用：

```rust
    let s1 = String::from("hello");

    let len = calculate_length(&s1);
```

`&s1` 的语法允许我们创建一个引用，该引用*指向* `s1` 的值，但并不拥有它。由于它不拥有该值，当引用停止使用时，它所指向的值将不会被丢弃。

同样，函数的签名使用 `&` 表示参数 `s` 的类型是一个引用。让我们添加一些说明性注释：

```rust
fn calculate_length(s: &String) -> usize { // s 是一个 String 的引用
    s.len()
} // 在这里，s 超出了作用域。但由于它没有所引用值的所有权，
  // 所以不会发生 drop 操作。
```

变量 `s` 的有效范围与任何函数参数的有效范围相同，但是引用指向的值在 `s` 停止使用后并不会被丢弃，因为 `s` 没有所有权。当函数的参数使用引用而不是实际值时，我们就不需要返回值来还原所有权，因为我们从未拥有过它。

我们将创建引用的行为称为*借用*。就像在现实生活中，如果一个人拥有某物，你可以从他们那里借走。完成后，你必须归还它。你不拥有它。

那么，如果我们尝试修改我们借用的东西会发生什么呢？请尝试在列表 4-6 中运行代码。小剧透：它不起作用！

文件名：src/main.rs

```rust
fn main() {
    let s = String::from("hello");

    change(&s);
}

fn change(some_string: &String) {
    some_string.push_str(", world");
}
```

列表 4-6：尝试修改借用值

这是错误：

```console
$ cargo run
   Compiling ownership v0.1.0 (file:///projects/ownership)
error[E0596]: cannot borrow `*some_string` as mutable, as it is behind a `&` reference
 --> src/main.rs:8:5
  |
7 | fn change(some_string: &String) {
  |                        ------- help: consider changing this to be a mutable reference: `&mut String`
8 |     some_string.push_str(", world");
  |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `some_string` is a `&` reference, so the data it refers to cannot be borrowed as mutable

For more information about this error, try `rustc --explain E0596`.
error: could not compile `ownership` due to previous error
```

就像变量默认是不可变的一样，引用也是不可变的。我们不允许修改我们拥有引用的东西。

### [可变引用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html#mutable-references)

我们可以通过使用一些小的修改，而不是可变引用，来修复列表 4-6 中的代码，以允许我们修改一个借用值：

文件名：src/main.rs

```rust
fn main() {
    let mut s = String::from("hello");

    change(&mut s);
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

首先，我们将 `s` 更改为 `mut`。然后，在调用 `change` 函数时，我们使用 `&mut s` 创建一个可变引用，并更新函数签名以接受一个可变引用，即 `some_string: &mut String`。这使得很清楚 `change`

 函数将会修改它所借用的值。

可变引用有一个重要限制：如果您有一个对值的可变引用，则不能同时拥有对该值的其他引用。尝试创建两个对 `s` 的可变引用的代码将失败：

文件名：src/main.rs

```rust
    let mut s = String::from("hello");

    let r1 = &mut s;
    let r2 = &mut s;

    println!("{}, {}", r1, r2);
```

这是错误：

```console
$ cargo run
   Compiling ownership v0.1.0 (file:///projects/ownership)
error[E0499]: cannot borrow `s` as mutable more than once at a time
 --> src/main.rs:5:14
  |
4 |     let r1 = &mut s;
  |              ------ first mutable borrow occurs here
5 |     let r2 = &mut s;
  |              ^^^^^^ second mutable borrow occurs here
6 |
7 |     println!("{}, {}", r1, r2);
  |                        -- first borrow later used here

For more information about this error, try `rustc --explain E0499`.
error: could not compile `ownership` due to previous error
```

这个错误说这段代码无效，因为我们不能同时以可变方式借用 `s` 多次。第一个可变借用是在 `r1` 中，并且必须持续到在 `println!` 中使用它，但是在创建该可变引用和其使用之间，我们试图创建另一个可变引用 `r2` 来借用相同的数据。

防止同时拥有对同一数据的多个可变引用的限制允许以一种非常受控制的方式进行修改。这是新 Rust 程序员会遇到的问题，因为大多数语言允许您随时进行修改。有了这个限制的好处是，Rust 可以在编译时防止数据竞争。*数据竞争*类似于竞态条件，当这三种行为发生时会发生：

- 两个或更多的指针同时访问同一数据。
- 至少有一个指针正在用于写入数据。
- 没有使用任何机制来同步对数据的访问。

数据竞争会导致未定义的行为，并且在运行时尝试跟踪和修复它们时可能难以诊断和修复；Rust 通过拒绝编译存在数据竞争的代码来防止此问题！

与往常一样，我们可以使用花括号创建新的作用域，允许多个可变引用，但是不允许*同时*使用：

```rust
    let mut s = String::from("hello");

    {
        let r1 = &mut s;
    } // r1 在此处超出作用域，所以我们可以毫无问题地创建一个新的引用。

    let r2 = &mut s;
```

Rust 对于结合可变和不可变引用也有类似的规则。这段代码将导致错误：

```rust
    let mut s = String::from("hello");

    let r1 = &s; // 没问题
    let r2 = &s; // 没问题
    let r3 = &mut s; // 严重问题

    println!("{}, {}, and {}", r1, r2, r3);
```

这是错误：

```console
$ cargo run
   Compiling ownership v0.1.0 (file:///projects/ownership)
error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
 --> src/main.rs:6:14
  |
4 |     let r1 = &s; // 没问题
  |              -- 不可变引用在这里产生
5 |     let r2 = &s; // 没问题
6 |     let r3 = &mut s; // 严重问题
  |              ^^^^^^ 可变引用在这里产生
7 |
8 |     println!("{}, {}, and {}", r1, r2, r3);
  |                                -- 在这里使用了不可变引用

For more information about this error, try `rustc --explain E0502`.
error: could not compile `ownership` due to previous error
```

我们*同样*不能在拥有对相同值的不可变引用时拥有可变引用。

对于使用不可变引用的用户，不希望该值突然发生变化！但是，多个不可变引用是允许的，因为只读取数据的人没有修改数据的能力。

请注意，引用的作用域从引用引入的地方开始，并持续到最后一次使用该引用的时间。例如，这段代码将编译，因为不可变引用的最后一次使用，即 `println!`，在可变引用被引入之前发生：

```rust
    let mut s = String::from("hello");

    let r1 = &s; // 没问题
    let r2 = &s; // 没问题
    println!("{} and {}", r1, r2);
    // 变量 r1 和 r2 将在此处之后不再使用

    let r3 = &mut s; // 没问题
    println!("{}", r3);
```

不可变引用 `r1` 和 `r2` 的作用域在它们最后使用的 `println!` 后结束，这在可变引用 `r3` 被创建之前。这些作用域不重叠，因此允许这段代码：编译器可以判断出引用在作用域结束点之前不再使用。

尽管借用错误有时可能令人沮丧，但请记住，这是 Rust 编译器在编译时（而不是运行时）指出潜在错误的方式，以及准确指出问题所在。这样一来，您就不必追踪数据不是您所认为的那样的原因。

### [悬垂引用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html#dangling-references)

在具有指针的语言中，很容易错误地创建*悬垂指针*，即指向可能已被分配给其他人的内存位置的指针，同时保留对该内存的指针。相比之下，在 Rust 中，编译器保证引用永远不会是悬垂引用：如果您有对某些数据的引用，编译器将确保在引用数据之前不会离开其作用域。

让我们尝试创建一个悬垂引用，看看 Rust 如何通过编译时错误来防止它们：

文件名：src/main.rs

```rust
fn main() {
    let reference_to_nothing = dangle();
}

fn dangle() -> &String {
    let s = String::from("hello");

    &s
}
```

这是错误：

```console
$ cargo run
   Compiling ownership v0.1.0 (file:///projects/ownership)
error[E0106]: missing lifetime specifier
 --> src/main.rs:5:16
  |
5 | fn dangle() -> &String {
  |                ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but there is no value for it to be borrowed from
help: consider using the `'static` lifetime
  |
5 | fn dangle() -> &'static String {
  |                 +++++++

For more information about this error, try `rustc --explain E0106`.
error: could not compile `ownership` due to previous error
```

这个错误消息提到了一个我们尚未涉及的特性：生命周期。我们将在第 10 章中详细讨论生命周期。但是，如果忽略有关生命周期的部分，该消息确实包含了为什么此代码是一个问题的关键：

```text
this function's return type contains a borrowed value, but there is no value
for it to be borrowed from
```

让我们仔细看看我们的 `dangle` 代码的每个阶段都发生了什么：

文件名：src/main.rs

```rust
fn dangle() -> &String { // dangle 返回一个 String 的引用

    let s = String::from("hello"); // s 是一个新的 String

    &s // 我们返回一个对 String s 的引用
} // 在这里，s 超出了作用域，被 drop 掉。其内存消失。
  // 危险！
```

由于 `s` 是在 `dangle` 中创建的，当 `dangle` 的代码完成时，`s` 将被释放。但是我们试图返回一个对它的引用。这意味着此引用将指向一个无效的 `String`。这不好！Rust 不会允许我们这样做。

在这里的解决方案是直接返回 `String`：

```rust
fn no_dangle() -> String {
    let s = String::from("hello");

    s
}
```

这可以毫无问题地工作。所有权被移出，没有任何东西被释放。

### [引用规则](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html#the-rules-of-references)

让我们回顾一下关于引用的讨论：

- 在任意给定时间，您要么可以有一个可变引用，要么可以有任意数量的不可变引用。
- 引用必须始终是有效的。

接下来，我们将研究一种不同类型的引用：切片。