---
title: "使用结构体的示例程序"
linkTitle: "使用结构体的示例程序"
sidebar_label: 5.2. 使用结构体的示例程序
weight: 202308051736
description: 使用结构体的示例程序
---

## [使用结构体的示例程序](https://doc.rust-lang.org/book/ch05-02-example-structs.html#an-example-program-using-structs)

为了理解何时我们可能希望使用结构体，让我们编写一个计算矩形面积的程序。我们将从使用单独的变量开始，然后重构程序，直到我们使用结构体为止。

我们将使用Cargo创建一个名为“rectangles”的新二进制项目，该项目将接收以像素为单位指定的矩形的宽度和高度，并计算矩形的面积。代码清单5-8展示了在项目的`src/main.rs`文件中以一种方式执行这个操作的简短程序。

文件名：src/main.rs

```rust
fn main() {
    let width1 = 30;
    let height1 = 50;

    println!(
        "The area of the rectangle is {} square pixels.",
        area(width1, height1)
    );
}

fn area(width: u32, height: u32) -> u32 {
    width * height
}
```

代码清单5-8：计算由单独的宽度和高度变量指定的矩形的面积

现在，使用`cargo run`运行这个程序：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished dev [unoptimized + debuginfo] target(s) in 0.42s
     Running `target/debug/rectangles`
The area of the rectangle is 1500 square pixels.
```

这段代码通过调用`area`函数来计算矩形的面积，同时传递每个维度作为参数，但我们可以做更多工作，使这段代码更加清晰和易读。

这段代码的问题在于`area`函数的签名：

```rust
fn area(width: u32, height: u32) -> u32 {
```

`area`函数应该计算一个矩形的面积，但我们编写的函数有两个参数，并且在程序中没有明确表明这些参数之间的关系。将宽度和高度组合在一起将使代码更加可读和易于管理。在第3章的["元组类型"一节](https://doc.rust-lang.org/book/ch03-02-data-types.html#the-tuple-type)中，我们已经讨论了一种可能的做法：使用元组。

### [使用元组进行重构](https://doc.rust-lang.org/book/ch05-02-example-structs.html#refactoring-with-tuples)

代码清单5-9展示了另一种使用元组的程序版本。

文件名：src/main.rs

```rust
fn main() {
    let rect1 = (30, 50);

    println!(
        "The area of the rectangle is {} square pixels.",
        area(rect1)
    );
}

fn area(dimensions: (u32, u32)) -> u32 {
    dimensions.0 * dimensions.1
}
```

代码清单5-9：使用元组指定矩形的宽度和高度

从某种程度上说，这个程序变得更好了。元组让我们添加了一些结构，现在我们只传递了一个参数。但从另一个角度来看，这个版本不够清晰：元组没有给它们的元素命名，所以我们必须使用元组的索引来访问元素，使得我们的计算不太明显。

在计算面积时，宽度和高度的混淆并不重要，但如果我们想在屏幕上绘制矩形，这就很重要了！我们必须记住`width`是元组的索引`0`，`height`是元组的索引`1`。如果其他人要使用我们的代码，他们会更难弄清楚并记住这些。因为我们没有在代码中传达数据的含义，现在引入错误更加容易。

### [使用结构体进行重构：增加更多含义](https://doc.rust-lang.org/book/ch05-02-example-structs.html#refactoring-with-structs-adding-more-meaning)

我们使用结构体通过为数据添加标签来增加含义。我们可以将使用的元组转换为一个具有整体名称以及部分名称的结构体，代码清单5-10展示了这一点。

文件名：src/main.rs

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        area(&rect1)
    );
}

fn area(rectangle: &Rectangle) -> u32 {
    rectangle.width * rectangle.height
}
```

代码清单5-10：定义一个`Rectangle`结构体

在这里，我们定义了一个名为`Rectangle`的结构体。在花括号内，我们定义了`width`和`height`字段，它们都具有类型`u32`。然后，在`main`函数中，我们创建了一个具体的`Rectangle`实例，其宽度为`30`，高度为`50`。

现在，我们的`area`函数定义了一个参数，我们将其命名为`rectangle`，其类型是`Rectangle`实例的不可变借用。正如第4章中提到的，我们希望借用这个结构体而不是获取所有权。这样，`main`保留了所有权，并可以继续使用`rect1`，这就是我们在函数签名中使用`&`的原因，以及在调用函数时的位置。

`area`函数访问了`Rectangle`实例的`width`和`height`字段（注意，访问借用结构体实例的字段不会移动字段的值，这就是你经常看到借用结构体的原因）。我们现在的`area`函数签名确切地表达了我们的意图：计算`Rectangle`的面积，使用它的`width`和`height`字段。这

传达了宽度和高度之间的关系，并为值提供了描述性的名称，而不是使用元组索引值`0`和`1`。这对于清晰度是一个胜利。

### [使用派生的trait添加有用的功能](https://doc.rust-lang.org/book/ch05-02-example-structs.html#adding-useful-functionality-with-derived-traits)

在调试程序时，能够打印出`Rectangle`实例的内容是很有用的。代码清单5-11尝试像我们在之前的章节中所用的方式使用[`println!`宏](https://doc.rust-lang.org/std/macro.println.html)，但这将不起作用。

文件名：src/main.rs

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect1 is {}", rect1);
}
```

代码清单5-11：尝试打印`Rectangle`实例

当我们编译这段代码时，会得到一个错误，错误消息如下：

```text
error[E0277]: `Rectangle` doesn't implement `std::fmt::Display`
```

`println!`宏可以进行多种格式化，而默认情况下，花括号告诉`println!`使用`Display`格式化，即用于直接最终用户使用的输出格式。我们目前所见的原始类型默认实现了`Display`，因为你只会希望将`1`或任何其他原始类型的值以一种方式显示给用户。但对于结构体，`println!`应该如何格式化输出并不太清楚，因为有更多的显示可能性：你是否想要逗号？是否要打印花括号？是否应该显示所有字段？由于这种不确定性，Rust不试图猜测我们的意图，结构体没有提供可用于`println!`和`{}`占位符的`Display`实现。

如果我们继续阅读错误信息，我们会找到这个有用的提示：

```text
   = help: the trait `std::fmt::Display` is not implemented for `Rectangle`
   = note: in format strings you may be able to use `{:?}` (or {:#?} for pretty-print) instead
```

让我们试一试！`println!`宏调用现在将会变成 `println!("rect1 is {:?}", rect1);`。在花括号内放入`:?`告诉`println!`我们要使用一个名为`Debug`的输出格式。`Debug` trait使我们可以以对开发人员有用的方式打印出结构体的值，这样我们可以在调试代码时看到它的值。

用这个更改编译代码。该呀！我们不再得到错误，将会看到以下输出：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished dev [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/rectangles`
rect1 is Rectangle { width: 30, height: 50 }
```

太好了！这不是最漂亮的输出，但它显示了此实例的所有字段的值，这在调试时肯定很有帮助。当我们有更大的结构体时，有一个更易于阅读的输出是很有用的；在这种情况下，我们可以在`println!`字符串中使用`{:#?}`而不是`{:?}`。在本例中，使用`{:#?}`样式将输出以下内容：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished dev [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/rectangles`
rect1 is Rectangle {
    width: 30,
    height: 50,
}
```

在使用`Debug`格式时，另一种打印值的方式是使用[`dbg!`宏](https://doc.rust-lang.org/std/macro.dbg.html)，它获取表达式的所有权（与`println!`不同，`println!`获取引用），打印出`dbg!`宏调用在代码中发生的文件和行号，以及表达式的结果值，并返回值的所有权。

> 注意：调用`dbg!`宏会打印到标准错误控制台流（`stderr`），而不是标准输出控制台流（`stdout`）。我们将在[第12章的“将错误消息写入标准错误而不是标准输出”节](https://doc.rust-lang.org/book/ch12-06-writing-to-stderr-instead-of-stdout.html)中更多地了解`stderr`和`stdout`。

以下是一个示例，我们对赋值给`width`字段的值以及整个`rect1`的值感兴趣：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let scale = 2;
    let rect1 = Rectangle {
        width: dbg!(30 * scale),
        height: 50,
    };

    dbg!(&rect1);
}
```

我们可以在表达式`30 * scale`周围使用`dbg!`，因为`dbg!`返回表达式的值的所有权，`width`字段将获得与没有`dbg!`调用时相同的值。我们不希望`dbg!`获取`rect1`的所有权，所以我们在下一个调用中使用了对`rect1`的引用。这是这个例子的输出：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished dev [unoptimized + debuginfo] target(s) in 0.61s
     Running `target/debug/rectangles`
[src/main.rs:10] 30 * scale = 60
[src/main.rs:14] &rect1 = Rectangle {
    width: 60,
    height: 50,
}
```

我们可以看到，输出的第一部分来自`src/main.rs`的

第10行，我们正在调试表达式`30 * scale`，其结果值为`60`（对于整数实现的`Debug`格式化只打印值）。`src/main.rs`的第14行上的`dbg!`调用输出了`&rect1`的值，它是`Rectangle`结构体。此输出使用`Rectangle`类型的漂亮`Debug`格式。当你试图弄清楚你的代码在做什么时，`dbg!`宏可能会非常有用！

除了`Debug` trait，Rust还为我们提供了许多用于`derive`属性的trait，可以为我们的自定义类型添加有用的行为。这些trait及其行为在[附录C](https://doc.rust-lang.org/book/appendix-03-derivable-traits.html)中列出。我们将在第10章中讨论如何为这些trait实现自定义行为，以及如何创建自己的trait。除了`derive`，还有许多其他属性；有关更多信息，请参阅[Rust参考手册中的“属性”部分](https://doc.rust-lang.org/reference/attributes.html)。

我们的`area`函数非常具体：它只计算矩形的面积。将这个行为与我们的`Rectangle`结构体更紧密地联系起来将会更有帮助，因为它不适用于任何其他类型。让我们继续通过将`area`函数转换为定义在`Rectangle`类型上的`area`*方法*来重构这段代码。