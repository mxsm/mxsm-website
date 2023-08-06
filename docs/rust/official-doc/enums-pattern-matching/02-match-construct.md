---
title: "match控制流构造"
linkTitle: "match控制流构造"
sidebar_label: 6.2. match控制流构造
weight: 202308051736
description: match控制流构造
---

## [`match` 控制流构造](https://doc.rust-lang.org/book/ch06-02-match.html#the-match-control-flow-construct)

Rust有一个非常强大的控制流构造，称为 `match`，它允许您将一个值与一系列模式进行比较，然后根据匹配的模式执行代码。模式可以由字面值、变量名、通配符和许多其他内容组成；[第18章](https://doc.rust-lang.org/book/ch18-00-patterns.html)介绍了所有不同类型的模式及其功能。`match` 的强大之处在于模式的表现力，以及编译器确认所有可能的情况都得到处理。

将 `match` 表达式类比为硬币分类机：硬币沿着带有不同大小孔的轨道滑动，每个硬币都会掉落到它所符合的第一个孔中。同样，值会通过 `match` 中的每个模式，并在第一个与之匹配的模式中，值“符合”，然后该值将掉入关联的代码块中，在执行期间使用。

说到硬币，让我们使用硬币作为例子来使用 `match`！我们可以编写一个函数，该函数接受一个未知的美国硬币，并类似于计数机一样，确定它是哪一种硬币，并以美分为单位返回其价值，如示例所示（见代码清单6-3）。

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

代码清单6-3：一个枚举和一个 `match` 表达式，其中枚举的变体是其模式

让我们来分解 `value_in_cents` 函数中的 `match`。首先，我们列出 `match` 关键字，后面是一个表达式，在这种情况下是值 `coin`。这似乎与与 `if` 一起使用的条件表达式非常相似，但有一个很大的区别：`if` 中的条件需要求值为布尔值，而在这里可以是任何类型。此示例中的 `coin` 类型是我们在第一行定义的 `Coin` 枚举类型。

接下来是 `match` 分支。分支由两部分组成：模式和一些代码。第一个分支在这里有一个模式，它是值 `Coin::Penny`，然后是将模式和代码分开的 `=>` 运算符。在这种情况下，代码仅为值 `1`。每个分支用逗号与下一个分开。

当 `match` 表达式执行时，它按顺序将结果值与每个分支的模式进行比较。如果某个模式与值匹配，将执行与该模式相关联的代码。如果该模式与值不匹配，则继续执行下一个分支，就像硬币分类机一样。我们可以有尽可能多的分支：在代码清单6-3中，我们的 `match` 有四个分支。

每个分支关联的代码是一个表达式，匹配分支中表达式的结果是整个 `match` 表达式的返回值。

通常，如果 `match` 分支的代码很短，我们不会使用花括号；就像在代码清单6-3中，每个分支仅返回一个值。如果您想在匹配分支中运行多行代码，必须使用花括号，并且接在分支后面的逗号则是可选的。例如，以下代码每次调用方法时都会打印“Lucky penny！”但仍然返回块的最后一个值 `1`：

```rust
fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        }
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

### [绑定到值的模式](https://doc.rust-lang.org/book/ch06-02-match.html#patterns-that-bind-to-values)

`match` 分支的另一个有用功能是它们可以绑定到与模式匹配的值的部分。这是我们从枚举变体中提取值的方法。

举个例子，我们将一个枚举变体更改为在其内部保存数据。从1999年到2008年，美国铸造了每个州的25美分硬币，每一面有50个州的不同设计。其他硬币没有州设计，因此只有25美分硬币有这个额外值。我们可以通过将 `Quarter` 变体更改为包含 `UsState` 值来将此信息添加到我们的 `enum` 中，如代码清单6-4中所示。

```rust
#[derive(Debug)] // 这样我们可以检查状态
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}
```

代码清单6-4：一个 `Coin` 枚举，其中 `Quarter` 变体还包含一个 `UsState` 值

假设我们的朋友想要收集所有50个州的硬币。在将我们的零钱按硬币类型分类的同时，我们还会宣读与每个25美分硬币相关的州的名称，这样如果他们没有的州出现，他们就可以将其加入到他们的收藏中。

在此代码的 `match` 表达式中，我们在与变体 `Coin::

Quarter` 的值匹配的模式中添加了一个名为 `state` 的变量。当 `Coin::Quarter` 匹配时，`state` 变量将绑定到该25美分硬币的州的值。然后，我们可以在该分支的代码中使用 `state`，如下所示：

```rust
fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("州25美分硬币来自{:?}！", state);
            25
        }
    }
}
```

如果我们调用 `value_in_cents(Coin::Quarter(UsState::Alaska))`，`coin` 将是 `Coin::Quarter(UsState::Alaska)`。当我们将该值与每个 `match` 分支进行比较时，直到达到 `Coin::Quarter(state)` 时，没有一个匹配。在这一点上，`state` 的绑定将是值 `UsState::Alaska`。然后，我们可以在 `println!` 表达式中使用该绑定，从而从 `Quarter` 变体的 `Coin` 枚举中获取内部州的值。

### [使用 `Option` 进行匹配](https://doc.rust-lang.org/book/ch06-02-match.html#matching-with-optiont)

在前面的部分中，我们希望从 `Option<T>` 的 `Some` 情况中获取内部的 `T` 值；我们也可以像对待 `Coin` 枚举一样使用 `match` 来处理 `Option<T>`！我们不再比较硬币，而是比较 `Option<T>` 的变体，但 `match` 表达式的工作方式保持不变。

假设我们想编写一个函数，它接受一个 `Option<i32>`，如果内部有值，则将该值加1。如果内部没有值，则函数应返回 `None` 值，并且不尝试执行任何操作。

感谢 `match`，编写这个函数非常容易，如代码清单6-5所示。

```rust
    fn plus_one(x: Option<i32>) -> Option<i32> {
        match x {
            None => None,
            Some(i) => Some(i + 1),
        }
    }

    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);
```

代码清单6-5：一个在 `Option<i32>` 上使用 `match` 表达式的函数

让我们更详细地查看第一个 `plus_one` 的执行。当我们调用 `plus_one(five)` 时，在 `plus_one` 函数体中，变量 `x` 将具有值 `Some(5)`。然后，我们将其与每个 `match` 分支进行比较：

```rust
            None => None,
```

`Some(5)` 的值不匹配模式 `None`，因此我们继续到下一个分支：

```rust
            Some(i) => Some(i + 1),
```

`Some(5)` 是否匹配 `Some(i)`？是的！我们有相同的变体。`i` 绑定到 `Some` 中包含的值，因此 `i` 取值为 `5`。然后，将执行 `match` 分支中的代码，因此我们将 `1` 加到 `i` 的值，并创建一个包含我们的总值 `6` 的新 `Some` 值。

现在让我们考虑代码清单6-5中 `plus_one` 的第二次调用，其中 `x` 是 `None`。我们进入 `match` 并与第一个分支进行比较：

```rust
            None => None,
```

它匹配！没有值可以添加，因此程序停止并返回 `None` 值在 `=>` 的右侧。因为第一个分支匹配，不会比较其他分支。

将 `match` 与枚举结合使用在许多情况下都很有用。在Rust代码中，您会经常看到这种模式：针对枚举进行 `match`，将变量绑定到内部数据，然后基于该数据执行代码。刚开始时可能有点棘手，但一旦习惯了，您会希望在所有语言中都有这种功能。它始终是用户喜爱的。

### [匹配是穷尽的](https://doc.rust-lang.org/book/ch06-02-match.html#matches-are-exhaustive)

我们还需要讨论 `match` 的另一个方面：分支的模式必须覆盖所有可能性。考虑一下我们的 `plus_one` 函数的这个版本，它有一个错误，并且无法编译：

```rust
    fn plus_one(x: Option<i32>) -> Option<i32> {
        match x {
            Some(i) => Some(i + 1),
        }
    }
```

我们没有处理 `None` 的情况，因此这段代码将引起错误。幸运的是，这是一个Rust知道如何捕捉的错误。如果我们尝试编译这段代码，将会得到这个错误：

```console
$ cargo run
   Compiling enums v0.1.0 (file:///projects/enums)
error[E0004]: non-exhaustive patterns: `None` not covered
 --> src/main.rs:3:15
  |
3 |         match x {
  |               ^ pattern `None` not covered
  |
note: `Option<i32>` defined here
 --> /rustc/d5a82bbd26e1ad8b7401f6a718a9c57c96905483/library/core/src/option.rs:518:1
  |
  = note: 
/rustc/d5a82bbd26e1ad8b7401f6a718a9c57c96905483/library/core/src/option.rs:522:5: not covered
  = note: the matched value is of type `Option<i32>`
help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern as shown
  |
4 ~             Some

(i) => Some(i + 1),
5 ~             None => todo!(),
  |

For more information about this error, try `rustc --explain E0004`.
error: could not compile `enums` due to previous error
```

Rust 知道我们没有覆盖每种可能的情况，甚至知道我们忘记了哪个模式！在Rust中，`match` 是*穷尽的*：为了使代码有效，我们必须穷尽所有可能的情况。特别是对于 `Option<T>`，当Rust防止我们忘记显式处理 `None` 情况时，它保护我们免于假设我们有一个值，而实际上可能是空值，从而避免了前面提到的巨额错误。

### [万用模式和 `_` 占位符](https://doc.rust-lang.org/book/ch06-02-match.html#catch-all-patterns-and-the-_-placeholder)

使用枚举，我们还可以针对一些特定值采取特殊操作，但对于所有其他值，采取一个默认操作。想象我们正在实现一个游戏，在游戏中，如果您掷出一个3点的骰子点数，您的角色不会移动，而是会得到一个新的花哨帽。如果您掷出7点，您的角色将失去一个花哨帽。对于所有其他值，您的角色将在游戏板上移动相应的步数。下面是实现该逻辑的 `match`，其中骰子点数的结果被硬编码而不是一个随机值，并且所有其他逻辑通过没有主体的函数来表示，因为实际实现超出了此示例的范围：

```rust
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        other => move_player(other),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
    fn move_player(num_spaces: u8) {}
```

对于前两个分支，模式是字面值 `3` 和 `7`。对于涵盖所有其他可能值的最后一个分支，模式是我们选择命名为 `other` 的变量。运行在 `other` 分支的代码将通过将其传递给 `move_player` 函数来使用该变量。

这段代码可以编译，即使我们没有列出 `u8` 可以具有的所有可能值，因为最后一个模式将匹配没有特别列出的所有值。这个万用模式满足了 `match` 必须是穷尽的要求。注意我们必须将万用分支放在最后，因为模式是按顺序进行评估的。如果我们在万用分支之前放置了其他分支，其他分支将永远不会运行，因此Rust会在添加了万用分支后发出警告！

Rust 还有一个可以在需要万用匹配但不希望*使用*匹配值时使用的模式：`_` 是一个特殊模式，它匹配任何值，并且不会绑定到该值。这告诉Rust我们不会使用该值，因此Rust不会对未使用的变量发出警告。

让我们再次改变游戏规则：现在，如果您掷出的点数不是3或7，您必须重新掷一次。我们不再需要使用万用值，因此我们可以改变代码，使用 `_` 而不是名为 `other` 的变量：

```rust
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        _ => reroll(),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
    fn reroll() {}
```

这个例子也满足穷尽要求，因为我们在最后一个分支中明确地忽略了所有其他值；我们没有遗漏任何内容。

最后，我们再次改变游戏规则，以便在掷出3或7以外的任何点数时，您的回合上不会发生任何其他事情。我们可以通过将空元组类型（我们在 [“元组类型”](https://doc.rust-lang.org/book/ch03-02-data-types.html#the-tuple-type) 部分中提到的空元组类型）用作与 `_` 分支关联的代码来表示：

```rust
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        _ => (),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
```

在这里，我们明确告诉Rust，我们不会使用任何在先前分支的模式中没有列出的其他值，并且在此情况下不希望运行任何代码。

有关模式和匹配的更多内容将在[第18章](https://doc.rust-lang.org/book/ch18-00-patterns.html)中介绍。现在，我们将继续介绍 `if let` 语法，这在 `match` 表达式有点冗长的情况下非常有用。