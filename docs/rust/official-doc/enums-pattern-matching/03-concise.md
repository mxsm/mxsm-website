---
title: "使用if let进行简洁的控制流"
linkTitle: "使用if let进行简洁的控制流"
sidebar_label: 6.3. 使用if let进行简洁的控制流
weight: 202308051736
description: match控制流构造
---

## [使用 `if let` 进行简洁的控制流](https://doc.rust-lang.org/book/ch06-03-if-let.html#concise-control-flow-with-if-let)

`if let` 语法允许您将 `if` 和 `let` 结合在一起，以一种更简洁的方式处理匹配一个模式的值，而忽略其他情况。考虑代码清单6-6中的程序，它在 `config_max` 变量中匹配一个 `Option<u8>` 值，但只想在该值为 `Some` 变体时执行代码。

```rust
    let config_max = Some(3u8);
    match config_max {
        Some(max) => println!("The maximum is configured to be {}", max),
        _ => (),
    }
```

代码清单6-6：只在值为 `Some` 时执行代码的 `match`

如果值是 `Some`，我们通过将该值绑定到模式中的变量 `max`，打印出 `Some` 变体中的值。我们不希望处理 `None` 的值。为了满足 `match` 表达式的要求，在处理了一个变体后，我们不得不添加 `_ => ()`，这是一个令人讨厌的样板代码。

相反，我们可以使用 `if let` 来以更简短的方式编写这个逻辑。下面的代码与代码清单6-6中的 `match` 的行为相同：

```rust
    let config_max = Some(3u8);
    if let Some(max) = config_max {
        println!("The maximum is configured to be {}", max);
    }
```

`if let` 语法接受一个模式和一个用等号分隔的表达式。它的工作方式与 `match` 相同，其中表达式被传递给 `match`，而模式是它的第一个分支。在这种情况下，模式是 `Some(max)`，`max` 绑定到 `Some` 内部的值。然后，我们可以在 `if let` 块的主体中使用 `max`，就像在相应的 `match` 分支中使用 `max` 一样。如果值不匹配模式，`if let` 块中的代码将不会运行。

使用 `if let` 可以减少输入量、缩进和样板代码。但是，您将失去 `match` 强制执行的穷尽检查。在 `match` 和 `if let` 之间选择取决于您在特定情况下的需求，以及在是否愿意为失去穷尽检查而换取简洁性之间取舍。

换句话说，您可以将 `if let` 视为 `match` 的语法糖，当值匹配一个模式时运行代码，然后忽略所有其他值。

我们可以在 `if let` 中包含一个 `else`。与 `match` 表达式中等效于 `if let` 和 `else` 的 `_` 案例相同，与 `else` 配套的代码块与 `if let` 块中的代码块相同。回顾代码清单6-4中的 `Coin` 枚举定义，其中 `Quarter` 变体还包含一个 `UsState` 值。如果我们想要计算看到的所有非25美分硬币的数量，并且在宣布25美分硬币的州时，我们可以使用 `match` 表达式，如下所示：

```rust
    let mut count = 0;
    match coin {
        Coin::Quarter(state) => println!("State quarter from {:?}!", state),
        _ => count += 1,
    }
```

或者我们可以使用 `if let` 和 `else` 表达式，如下所示：

```rust
    let mut count = 0;
    if let Coin::Quarter(state) = coin {
        println!("State quarter from {:?}!", state);
    } else {
        count += 1;
    }
```

如果您的程序的逻辑过于冗长，无法使用 `match` 表达式表达，那么请记住，`if let` 也是 Rust 工具箱中的一员。

## [小结](https://doc.rust-lang.org/book/ch06-03-if-let.html#summary)

我们已经了解了如何使用枚举创建自定义类型，这些类型可以是一组枚举值中的一个。我们展示了标准库的 `Option<T>` 类型如何帮助您使用类型系统来防止错误。当枚举值包含数据时，您可以使用 `match` 或 `if let` 来提取和使用这些值，具体取决于您需要处理的情况有多少种情况。

现在，您的 Rust 程序可以使用结构体和枚举在域中表达概念。创建自定义类型供 API 使用可以确保类型安全：编译器会确保您的函数只会得到每个函数所期望的类型的值。

为了为用户提供一个组织良好的 API，使其简单易用并且只暴露用户所需的内容，让我们现在转向 Rust 的模块。