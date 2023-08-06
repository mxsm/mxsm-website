---
title: "函数"
sidebar_label: 3.3.函数
linkTitle: "函数"
weight: 202308051736
description: 函数定义
---

## 函数（Functions）

函数在 Rust 代码中非常常见。你已经看到了语言中最重要的函数之一：`main` 函数，它是许多程序的入口点。你也已经见过 `fn` 关键字，它允许你声明新的函数。

在 Rust 代码中，函数和变量的命名采用*蛇形命名法*（snake case），即所有字母都是小写字母，并使用下划线分隔单词。以下是一个包含示例函数定义的程序：

文件名：src/main.rs

```rust
fn main() {
    println!("Hello, world!");

    another_function();
}

fn another_function() {
    println!("Another function.");
}
```

我们使用 `fn` 后跟函数名称和一对括号来定义 Rust 中的函数。花括号告诉编译器函数体的起始和结束位置。

我们可以通过输入函数名后跟一对括号来调用任何我们定义的函数。因为 `another_function` 在程序中已定义，所以它可以从 `main` 函数中调用。请注意，在源代码中，我们在 `main` 函数之后定义了 `another_function`，但是我们也可以在其之前定义。Rust 不关心您在何处定义函数，只要它们在调用方能看到的作用域内定义即可。

让我们开始一个名为 *functions* 的新二进制项目，以进一步探索函数。将 `another_function` 示例放在 *src/main.rs* 中并运行它。您应该会看到以下输出：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 0.28s
     Running `target/debug/functions`
Hello, world!
Another function.
```

代码行按照它们在 `main` 函数中出现的顺序执行。首先打印出“Hello, world!”，然后调用 `another_function`，并打印出其消息。

### [参数（Parameters）](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html#parameters)

我们可以定义带有*参数*的函数，参数是函数签名的一部分的特殊变量。当函数具有参数时，您可以为这些参数提供具体的值。从技术上讲，具体的值被称为*参数*，但在日常对话中，人们倾向于将“参数”和“实际值”这两个词用于函数定义中的变量或在调用函数时传递的具体值，而不做区分。

在这个版本的 `another_function` 中，我们添加了一个参数：

文件名：src/main.rs

```rust
fn main() {
    another_function(5);
}

fn another_function(x: i32) {
    println!("The value of x is: {x}");
}
```

尝试运行此程序；您应该会得到以下输出：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 1.21s
     Running `target/debug/functions`
The value of x is: 5
```

`another_function` 的声明有一个名为 `x` 的参数。`x` 的类型被指定为 `i32`。当我们将 `5` 传递给 `another_function` 时，`println!` 宏将 `5` 放在包含 `x` 的一对大括号中的格式字符串中。

在函数签名中，您必须声明每个参数的类型。这是 Rust 设计的一个有意决策：在函数定义中要求类型注释意味着编译器几乎不需要您在代码的其他地方使用它们来确定您的意图。如果编译器知道函数期望的类型，它还能提供更有帮助的错误消息。

当定义多个参数时，使用逗号将参数声明分隔开，如下所示：

文件名：src/main.rs

```rust
fn main() {
    print_labeled_measurement(5, 'h');
}

fn print_labeled_measurement(value: i32, unit_label: char) {
    println!("The measurement is: {value}{unit_label}");
}
```

此示例创建了一个名为 `print_labeled_measurement` 的函数，带有两个参数。第一个参数名为 `value`，是一个 `i32` 类型。第二个参数名为 `unit_label`，是 `char` 类型。然后函数打印包含 `value` 和 `unit_label` 的文本。

让我们尝试运行这段代码。将 *functions* 项目的 *src/main.rs* 文件替换为上述示例，并使用 `cargo run` 运行它：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/functions`
The measurement is: 5h
```

因为我们调用函数时，将 `5` 作为 `value` 的值，将 `'h'` 作为 `unit_label` 的值，所以程序输出包含这些值。

### [语句和表达式](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html#statements-and-expressions)

函数体由一系列语句组成，可选地以表达式结束。到目前为止，我们涵盖的函数还没有包含结束表达式，但你已经在语句中见过表达式。由于 Rust 是一种基于表达式的语言，这是一个重要的区别要理解。其他语言没有相同的区别，所以我们来看看语句和表达式是什么，以及它们的区别如何影响函数体。

- **语句**是执行某些操作并不返回值的指令。
- **表达式**求值为一个结果值。让我们来看一些例子。

实际上，我们已经使用了语句和表达式。使用 `let` 关键字创建一个变量

并给它赋值是一种语句。在列表 3-1 中，`let y = 6;` 是一种语句。

文件名：src/main.rs

```rust
fn main() {
    let y = 6;
}
```

列表 3-1：包含一个语句的 `main` 函数声明

函数定义也是语句；整个前面的示例本身就是一种语句。

语句不返回值。因此，您不能将 `let` 语句赋给另一个变量，例如下面的代码；您将会得到一个错误：

文件名：src/main.rs

```rust
fn main() {
    let x = (let y = 6);
}
```

当您运行此程序时，将得到如下错误：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
error: expected expression, found `let` statement
 --> src/main.rs:2:14
  |
2 |     let x = (let y = 6);
  |              ^^^

error: expected expression, found statement (`let`)
 --> src/main.rs:2:14
  |
2 |     let x = (let y = 6);
  |              ^^^^^^^^^
  |
  = note: variable declaration using `let` is a statement

error[E0658]: `let` expressions in this position are unstable
 --> src/main.rs:2:14
  |
2 |     let x = (let y = 6);
  |              ^^^^^^^^^
  |
  = note: see issue #53667 <https://github.com/rust-lang/rust/issues/53667> for more information

warning: unnecessary parentheses around assigned value
 --> src/main.rs:2:13
  |
2 |     let x = (let y = 6);
  |             ^         ^
  |
  = note: `#[warn(unused_parens)]` on by default
help: remove these parentheses
  |
2 -     let x = (let y = 6);
2 +     let x = let y = 6;
  |

For more information about this error, try `rustc --explain E0658`.
warning: `functions` (bin "functions") generated 1 warning
error: could not compile `functions` due to 3 previous errors; 1 warning emitted
```

`let y = 6` 语句不返回值，因此没有任何内容可以绑定到 `x` 上。这与其他语言（如 C 和 Ruby）中发生的情况不同，在这些语言中，赋值返回赋的值。在这些语言中，您可以编写 `x = y = 6` 并使 `x` 和 `y` 都具有值 `6`；但在 Rust 中不是这样的。

表达式求值为一个结果值，并且构成了你在 Rust 中编写的大部分其余代码。考虑一个数学运算，比如 `5 + 6`，这是一个求值为值 `11` 的表达式。表达式可以是语句的一部分：在列表 3-1 中，`let y = 6;` 语句中的 `6` 是一个求值为值 `6` 的表达式。调用函数是一个表达式。调用宏是一个表达式。由花括号创建的新的作用域块也是一个表达式，例如：

文件名：src/main.rs

```rust
fn main() {
    let y = {
        let x = 3;
        x + 1
    };

    println!("The value of y is: {y}");
}
```

这个表达式：

```rust
{
    let x = 3;
    x + 1
}
```

是一个块，此处的块在这个例子中求值为 `4`。这个值被绑定到 `y` 上，作为 `let` 语句的一部分。请注意，`x + 1` 行末尾没有分号，这与您之前看到的大多数行不同。表达式不包含结尾的分号。如果在表达式末尾加上分号，它将变成语句，并且不会返回值。请记住，在接下来探索函数返回值和表达式时，要牢记这一点。

### [带有返回值的函数](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html#functions-with-return-values)

函数可以将值返回给调用它们的代码。我们不为返回值命名，但是在箭头（`->`）后必须声明其类型。在 Rust 中，函数的返回值与函数体块的最后一个表达式的值是同义的。您可以使用 `return` 关键字并指定一个值来提前从函数中返回，但大多数函数隐式地返回最后一个表达式。下面是一个返回值的函数示例：

文件名：src/main.rs

```rust
fn five() -> i32 {
    5
}

fn main() {
    let x = five();

    println!("The value of x is: {x}");
}
```

函数 `five` 中没有函数调用、宏，甚至连 `let` 语句都没有 —— 只有一个单独的数字 `5`。这在 Rust 中是一个完全有效的函数。请注意，函数的返回类型也被指定为 `-> i32`。尝试运行这段代码；输出应该如下所示：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 0.30s
     Running `target/debug/functions`
The value of x is: 5
```

`five` 中的 `5` 就是函数的返回值，因此返回类型为 `i32`。现在让我们详细查看一下。有两个重要的地方：首先，`let x = five();` 这一行显示我们正在使用函数的返回值来初始化一个变量。因为函数 `five` 返回 `5`，所以这行代码与以下代码是相同的：

```rust
let x = 5;
```

其次，`five` 函数没有参数并定义了返回值的类型，但是函数体却只有一个孤零零的 `5`

，没有分号，因为它是一个希望返回的表达式的值。

让我们再看一个例子：

文件名：src/main.rs

```rust
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {x}");
}

fn plus_one(x: i32) -> i32 {
    x + 1
}
```

运行此代码将打印 `The value of x is: 6`。但如果我们在 `x + 1` 的末尾加上分号，将其从表达式改为语句，我们将得到一个错误：

文件名：src/main.rs

```rust
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {x}");
}

fn plus_one(x: i32) -> i32 {
    x + 1;
}
```

编译此代码将产生错误，如下所示：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
error[E0308]: mismatched types
 --> src/main.rs:7:24
  |
7 | fn plus_one(x: i32) -> i32 {
  |    --------            ^^^ expected `i32`, found `()`
  |    |
  |    implicitly returns `()` as its body has no tail or `return` expression
8 |     x + 1;
  |          - help: remove this semicolon to return this value

For more information about this error, try `rustc --explain E0308`.
error: could not compile `functions` due to previous error
```

主要错误消息 `mismatched types` 显示了此代码的核心问题。函数 `plus_one` 的定义表明它将返回一个 `i32`，但是语句不会求值为值，这表现为 `()`，即单元类型。因此，没有返回任何内容，这与函数定义相矛盾，导致错误。在此输出中，Rust 提供了一条消息，可能有助于解决此问题：它建议删除分号，这将修复错误。