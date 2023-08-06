---
title: "定义模块以控制作用域和私有性"
linkTitle: "定义模块以控制作用域和私有性"
sidebar_label: 7.2. 定义模块以控制作用域和私有性
weight: 202308051736
description: 定义模块以控制作用域和私有性
---

## [定义模块以控制作用域和私有性](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html#defining-modules-to-control-scope-and-privacy)

在本节中，我们将讨论模块及模块系统的其他部分，包括允许您命名项目的*路径*，使用`use`关键字将路径引入作用域以及使用`pub`关键字使项目公开。我们还将讨论`as`关键字、外部包和全局操作符。

首先，我们将从一个简单的规则列表开始，方便您将来在组织代码时进行参考。然后，我们将详细解释每个规则。

### [模块速查表](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html#modules-cheat-sheet)

在这里，我们提供了一个快速参考，涵盖编译器中模块、路径、`use`关键字和`pub`关键字的工作原理，以及大多数开发者如何组织代码。在本章的所有部分中，我们将通过示例说明这些规则，但这里是一个提醒模块如何工作的好地方。

- **从板条箱根开始**：在编译板条箱时，编译器首先查找板条箱根文件（通常是库板条箱的*src/lib.rs*或二进制板条箱的*src/main.rs*），以查找要编译的代码。

- **声明模块**：在板条箱根文件中，您可以声明新的模块；例如，您可以使用`mod garden;`声明一个名为“garden”的模块。编译器将在以下位置查找模块的代码：

  - 内联，使用`mod garden`后面的花括号替换分号
  - 文件*src/garden.rs*
  - 文件*src/garden/mod.rs*

- **声明子模块**：在任何文件中，除了板条箱根文件，您都可以声明子模块。例如，在*src/garden.rs*中，您可以声明`mod vegetables;`。编译器将在以下位置查找子模块的代码：

  - 内联，直接跟在`mod vegetables`后面，使用花括号替换分号
  - 文件*src/garden/vegetables.rs*
  - 文件*src/garden/vegetables/mod.rs*

- **模块中的代码路径**：一旦一个模块是您的板条箱的一部分，您就可以在同一板条箱中的任何其他位置引用该模块中的代码，只要私有性规则允许，并且使用代码的路径。例如，在花园蔬菜模块中的`Asparagus`类型将被找到为`crate::garden::vegetables::Asparagus`。

- **私有 vs 公共**：模块内部的代码在默认情况下对其父模块是私有的。要使模块公共，请使用`pub mod`而不是`mod`进行声明。要使公共模块内的项目也公共，请在其声明之前使用`pub`。

- **`use`关键字**：在作用域内，`use`关键字可以创建项目的快捷方式，以减少长路径的重复。在任何可以引用`crate::garden::vegetables::Asparagus`的作用域中，您可以使用`use crate::garden::vegetables::Asparagus;`创建一个快捷方式，然后只需编写`Asparagus`即可在作用域中使用该类型。

下面我们创建一个名为`backyard`的二进制板条箱，展示这些规则。该板条箱的目录，同样命名为`backyard`，包含以下文件和目录：

```text
backyard
├── Cargo.lock
├── Cargo.toml
└── src
    ├── garden
    │   └── vegetables.rs
    ├── garden.rs
    └── main.rs
```

在这种情况下，板条箱根文件是*src/main.rs*，内容如下：

文件名：src/main.rs

```rust
use crate::garden::vegetables::Asparagus;

pub mod garden;

fn main() {
    let plant = Asparagus {};
    println!("I'm growing {:?}!", plant);
}
```

`pub mod garden;`行告诉编译器要包含*src/garden.rs*中找到的代码，内容如下：

文件名：src/garden.rs

```rust
pub mod vegetables;
```

在这里，`pub mod vegetables;`表示要包含*src/garden/vegetables.rs*中的代码。该代码如下：

```rust
#[derive(Debug)]
pub struct Asparagus {}
```

现在让我们深入了解这些规则，并在实践中演示它们！

### [在模块中组织相关代码](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html#grouping-related-code-in-modules)

*模块*允许我们在板条箱中组织代码，以便阅读和重用。模块还允许我们控制*私有性*，因为默认情况下，模块内部的代码是私有的。私有项目是不可供外部使用的内部实现细节。我们可以选择使模块和其中的项目公开，从而使它们可供外部代码使用和依赖。

举个例子，让我们编写一个提供餐厅功能的库板条箱。我们将定义函数的签名，但将函数体留空，集中精力组织代码，而不是实现餐厅功能。

在餐厅业务中，餐厅的一些部分被称为*前台*，而其他部分被称为*后台*。前台是顾客所在的地方，包括主持人

安排顾客座位、服务员接受订单和付款，以及调酒师制作饮料。后台是厨师在厨房工作的地方，洗碗工清洁工作，经理进行行政工作。

为了按照这种方式构建我们的板条箱，我们可以将其函数组织成嵌套模块。通过运行`cargo new restaurant --lib`创建一个名为`restaurant`的新库，然后将代码输入到*src/lib.rs*中，定义一些模块和函数签名。以下是前台部分：

文件名：src/lib.rs

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}

        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}

        fn serve_order() {}

        fn take_payment() {}
    }
}
```

图 7-1：包含其他模块的`front_of_house`模块

我们使用`mod`关键字定义一个模块，后跟模块的名称（在本例中为`front_of_house`）。模块的内容位于花括号内。在模块内部，我们可以放置其他模块，例如本例中的`hosting`和`serving`模块。模块还可以包含其他项目的定义，例如结构体、枚举、常量、特性和 - 如图 7-1 - 函数。

使用模块，我们可以将相关的定义组合在一起，并命名它们之间的关联。使用此代码的程序员可以根据组别导航代码，而无需阅读所有定义，从而更容易找到与他们相关的定义。添加新功能到此代码的程序员将知道在哪里放置代码以保持程序的组织结构。

之前，我们提到过*src/main.rs*和*src/lib.rs*称为板条箱根。它们被称为板条箱根的原因是，这两个文件的内容构成了一个名为`crate`的模块，位于板条箱的模块结构的根处，称为*模块树*。

图 7-2 显示了图 7-1 中结构的模块树。

```text
crate
 └── front_of_house
     ├── hosting
     │   ├── add_to_waitlist
     │   └── seat_at_table
     └── serving
         ├── take_order
         ├── serve_order
         └── take_payment
```

图 7-2：图 7-1 中代码的模块树

此树显示了一些模块如何嵌套在一起；例如，`hosting`嵌套在`front_of_house`内部。该树还显示了一些模块彼此为*兄弟模块*，这意味着它们在同一个模块内定义；`hosting`和`serving`是在`front_of_house`内部定义的兄弟模块。如果模块 A 包含在模块 B 内部，我们可以说模块 A 是模块 B 的*子模块*，模块 B 是模块 A 的*父模块*。注意整个模块树都是在隐式模块`crate`下面。

模块树可能会让您想起计算机文件系统的目录树；这是一个非常恰当的比较！就像文件系统中的目录一样，您使用模块来组织代码。并且就像目录中的文件一样，我们需要一种方式来找到我们的模块。