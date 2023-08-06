---
title: "变量和可变性"
sidebar_label: 3.1. 变量和可变性
linkTitle: "变量和可变性"
weight: 202308051736
description: 变量和可变性
---

# 变量和可变性

如[“使用变量存储值”](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html#storing-values-with-variables)部分所述,默认情况下,变量是不可变的。这是Rust提供的许多小提示之一,以鼓励您以利用Rust提供的安全性和易于并发的方式编写代码。但是,您仍然可以使变量可变。让我们来探索Rust为何倾向于支持不可变性,以及有时您可能希望选择退出的原因。

当一个变量是不可变的,一旦一个值被绑定到一个名称,您就不能改变那个值。为了说明这一点,使用`cargo new variables`在`projects`目录中生成一个名为`variables`的新项目。

然后,在新的`variables`目录中,打开`src/main.rs`并用以下代码替换其内容,该代码目前还无法编译:

文件名:`src/main.rs`

```rust
fn main() {
  let x = 5;
  println!("The value of x is: {x}");
  x = 6;
  println!("The value of x is: {x}");
}
```

使用`cargo run`保存并运行程序。您应该收到一个关于不可变性错误的错误消息,如下所示:

```
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables) 
error[E0384]: cannot assign twice to immutable variable `x`
 --> src/main.rs:4:5
  |
2 |     let x = 5;
  |         -
  |         |
  |         first assignment to `x`
  |         help: consider making this binding mutable: `mut x`  
3 |     println!("The value of x is: {x}");
4 |     x = 6;
  |     ^^^^^ cannot assign twice to immutable variable

For more information about this error, try `rustc --explain E0384`.
error: could not compile `variables` due to previous error
```

这个例子展示了编译器如何帮助您找到程序中的错误。编译器错误可能会让人沮丧,但它实际上只意味着您的程序还不能安全地做您想要它做的事;它*不*意味着您不是一个好的程序员!有经验的Rustacean仍然会遇到编译错误。

您收到错误消息“不能给不可变变量`x`赋值两次”,因为您试图给不可变的`x`变量赋予第二个值。

当我们试图改变一个被标记为不可变的值时,在编译时收到错误非常重要,因为这种情况可能导致bug。如果我们代码的一部分操作基于值永远不会改变的假设,而另一部分代码改变了该值,那么第一部分代码可能不会按设计的方式运行。这种bug的根源在事后很难跟踪,尤其是当第二部分代码只是*有时候*改变该值时。Rust编译器保证当您声明一个值不会改变时,它确实不会改变,所以您不必自己跟踪它。您的代码因此更易于推理。

但是可变性可以非常有用,并且可以使代码更方便编写。虽然变量默认是不可变的,但是像[第2章](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html#storing-values-with-variables)中所做的那样,在变量名之前添加`mut`可以使它们可变。添加`mut`还通过指示代码的未来阅读者将更改此变量的值来传达意图。

例如,让我们将`src/main.rs`更改为以下内容:

文件名:`src/main.rs`

```rust
fn main() {
  let mut x = 5;
  println!("The value of x is: {x}");
  x = 6;
  println!("The value of x is: {x}"); 
}
```

现在我们运行程序时,会得到:

```
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables)
    Finished dev [unoptimized + debuginfo] target(s) in 0.30s
     Running `target/debug/variables`
The value of x is: 5
The value of x is: 6
```

当使用`mut`时,我们被允许将绑定到`x`的值从`5`改为`6`。最终,决定是否使用可变性完全取决于您,并且取决于您认为在特定情况下更清晰的方式。

## 常量

像不可变变量一样,*常量*是绑定到一个名称的值,不允许更改,但常量与变量之间存在一些差异。

首先,常量不允许使用`mut`。常量不仅默认是不可变的——它们总是不可变的。您使用`const`关键字而不是`let`关键字声明常量,并且值的类型*必须*注明。我们将在下一节[“数据类型”](https://doc.rust-lang.org/book/ch03-02-data-types.html#data-types)中介绍类型和类型注释,所以现在不要担心细节。只需知道您必须总是注明类型。

常量可以在任何范围内声明,包括全局范围,这使它们对需要知道该值的代码的许多部分非常有用。

最后一个区别是,常量只能设置为常量表达式,而不能是只能在运行时计算的结果值。

下面是一个常量声明的例子:

```rust
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;
```

常量的名称是`THREE_HOURS_IN_SECONDS`,其值被设置为将60(一分钟中的秒数)与60(一小时中的分钟数)与3(我们要在此程序中计算的小时数)相乘的结果。Rust对常量的命名约定是使用大小写与下划线分隔单词。编译器可以在编译时计算一小部分操作,这使我们可以选择以更易于理解和验证的方式编写此值,而不是将此常量设置为值10800。有关在声明常量时可以使用哪些操作的更多信息,请参阅[Rust参考的常量评估部分](https://doc.rust-lang.org/reference/const_eval.html)。

在声明的作用域内,常量在程序运行的全部时间内都有效。这一特性使得常量对程序的多个部分可能需要知道的应用程序域的值非常有用,例如游戏中任何玩家可以赢得的最大点数,或光速。

将整个程序中使用的硬编码值命名为常量,有助于向代码的未来维护者传达该值的含义。如果将来需要更新硬编码值,它还可以使代码中仅需要更改的位置减少到一个。

## 遮蔽(Shadowing)

如您在[第2章](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html#comparing-the-guess-to-the-secret-number)中的猜谜游戏教程中看到的,您可以用与以前变量相同的名称声明一个新变量。Rustaceans说第一个变量被第二个*遮蔽*,这意味着第二个变量是编译器在您使用变量名称时将看到的内容。实际上,第二个变量遮蔽了第一个,直到它本身被遮蔽或作用域结束,才接管任何对变量名称的使用。我们可以通过使用相同的变量名称并重复使用`let`关键字来遮蔽一个变量,如下所示:

文件名:`src/main.rs`

```rust
fn main() {
  let x = 5;

  let x = x + 1;

  {
    let x = x * 2;
    println!("The value of x in the inner scope is: {x}");
  }

  println!("The value of x is: {x}");
}
```

该程序首先将`x`绑定到值为`5`。然后它通过重复`let x =`创建一个新的变量`x`,获取原始值并添加`1`,所以`x`的值变成了`6`。然后,在用大括号创建的内部作用域中,第三个`let`语句也遮蔽了`x`并创建了一个新变量,将前一个值乘以`2`以给`x`一个值为`12`。当该作用域结束时,内部遮蔽结束,`x`恢复为`6`。当我们运行此程序时,它将输出:

```
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/variables`
The value of x in the inner scope is: 12
The value of x is: 6
```

遮蔽不同于将变量标记为`mut`,因为如果我们不小心试图在不使用`let`关键字的情况下重新分配给此变量,我们会得到编译时错误。通过使用`let`,我们可以对一个值执行一些转换,但在完成这些转换后,该变量是不可变的。

`mut`和遮蔽之间的另一个区别是,因为我们使用`let`关键字再次有效地创建了一个新变量,所以我们可以改变值的类型但重用相同的名称。例如,假设我们的程序要求用户通过输入空格字符来显示他们希望文本之间有多少空格,然后我们想将该输入存储为一个数字:

```rust
  let spaces = "   ";
  let spaces = spaces.len();
```

第一个`spaces`变量是字符串类型,第二个`spaces`变量是数字类型。因此,遮蔽使我们免于不得不想出不同的名称,例如`spaces_str`和`spaces_num`;相反,我们可以重用更简单的`spaces`名称。但是,如果我们尝试对此使用`mut`,如下所示,我们会得到编译时错误:

```rust
  let mut spaces = "   ";
  spaces = spaces.len();
```

错误说我们不允许改变变量的类型:

```
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables) 
error[E0308]: mismatched types
 --> src/main.rs:3:14
  |
2 |     let mut spaces = "   ";
  |                      ----- expected due to this value
3 |     spaces = spaces.len();
  |              ^^^^^^^^^^^^ expected `&str`, found `usize`

For more information about this error, try `rustc --explain E0308`.
error: could not compile `variables` due to previous error
```

现在我们已经探索了变量的工作方式,让我们看看它们可以具有的更多数据类型。