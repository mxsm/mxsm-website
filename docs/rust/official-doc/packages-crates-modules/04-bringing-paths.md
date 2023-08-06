---
title: "使用use关键字将路径引入作用域"
linkTitle: "使用use关键字将路径引入作用域"
sidebar_label: 7.4. 使用use关键字将路径引入作用域
weight: 202308051736
description: 使用use关键字将路径引入作用域

---



## [使用 `use` 关键字将路径引入作用域](https://doc.rust-lang.org/book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html#bringing-paths-into-scope-with-the-use-keyword)

在调用函数时必须写出路径可能会感到不方便和重复。在清单7-7中，无论我们选择绝对路径还是相对路径来调用`add_to_waitlist`函数，每次调用`add_to_waitlist`时我们都不得不指定`front_of_house`和`hosting`。幸运的是，有一种方法可以简化这个过程：我们可以使用`use`关键字创建一个路径的快捷方式，并在作用域中的其他地方使用更短的名称。

在清单7-11中，我们将`crate::front_of_house::hosting`模块引入了`eat_at_restaurant`函数的作用域，因此我们只需要指定`hosting::add_to_waitlist`来调用`eat_at_restaurant`中的`add_to_waitlist`函数。

文件名：src/lib.rs

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

清单7-11：使用`use`引入模块作用域

在根模块中加入`use crate::front_of_house::hosting`之前，外部代码必须通过`restaurant::front_of_house::hosting::add_to_waitlist()`来调用`add_to_waitlist`函数。现在，`pub use`重新导出了根模块中的`hosting`模块，外部代码可以使用`restaurant::hosting::add_to_waitlist()`来调用它。

重新导出在内部代码的结构与调用内部代码的程序员对于域的理解方式不同很有用。例如，在这个餐馆的类比中，经营餐馆的人会将餐馆分为“前厅”和“后厨”。但是，参观餐馆的顾客可能不会按这种方式来考虑餐厅的各个部分。使用`pub use`，我们可以在代码中使用一种结构，同时对外部使用者公开另一种结构。这样做可以使我们的库对于工作在库上的程序员和调用库的程序员都很清晰。在第14章的[“使用`pub use`导出方便的公共API”](https://doc.rust-lang.org/book/ch14-02-publishing-to-crates-io.html#exporting-a-convenient-public-api-with-pub-use)部分，我们将再看一个`pub use`的例子，以及它如何影响你的crate的文档。

### [使用外部包](https://doc.rust-lang.org/book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html#using-external-packages)

在第2章，我们编写了一个猜数字游戏项目，使用了一个名为`rand`的外部包来获取随机数。要在我们的项目中使用`rand`，我们需要在*Cargo.toml*文件中添加如下行：

文件名：Cargo.toml

```toml
rand = "0.8.5"
```

在*Cargo.toml*中添加`rand`作为依赖项，告诉Cargo从[crates.io](https://crates.io/)下载`rand`包及其所有依赖项，并将`rand`提供给我们的项目。

然后，要将`rand`定义引入我们项目的作用域，我们需要使用`use`语句，并以crate的名称`rand`开头，然后列出要引入作用域的项。回顾一下第2章的[“生成一个随机数”](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html#generating-a-random-number)部分，我们引入了`Rng` trait，并调用了`rand::thread_rng`函数：

```rust
use rand::Rng;

fn main() {
    let secret_number = rand::thread_rng().gen_range(1..=100);
}
```

Rust社区的成员已经在[crates.io](https://crates.io/)上提供了许多包，将它们引入到您的项目中需要遵循相同的步骤：在项目的*Cargo.toml*文件中列出它们，并使用`use`从它们的crate中引入项。

请注意，标准库`std`也是一个外部的crate。由于标准库是随Rust语言一起发布的，我们不需要更改*Cargo.toml*来包含`std`。但是，我们需要使用`use`来从标准库引入项到我们的项目作用域中。例如，要使用`HashMap`，我们将使用以下行：

```rust
use std::collections::HashMap;
```

这是一个以`std`（标准库crate的名称）开头的绝对路径。

### [使用嵌套路径来简化大型use列表](https://doc.rust-lang.org/book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html#using-nested-paths-to-clean-up-large-use-lists)

如果我们在同一个crate或同一个模块中使用了多个项，将每个项单独列在一行上会占用文件中很多的垂直空间。例如，在清单2-4的猜数字游戏中，以下两个`use`语句将项从`std`引入作用域：

文件名：src/main.rs

```rust
// --snip--
use std::cmp::Ordering;
use std::io;
// --snip--
```

相反，我们可以使用嵌套路径在一行中将相同的项引入作用域。我们可以通过指定路径的共同部分，然后跟随两个冒号和花括号，包含不同的路径部分的列表来实现这一点

，如清单7-18所示。

文件名：src/main.rs

```rust
// --snip--
use std::{cmp::Ordering, io};
// --snip--
```

清单7-18：使用嵌套路径将具有相同前缀的多个项引入作用域

在更大的程序中，使用嵌套路径从相同的crate或模块中引入许多项可以大大减少所需的单独`use`语句数量！

在路径的任何级别上都可以使用嵌套路径，当合并两个共享子路径的`use`语句时，这非常有用。例如，清单7-19显示了两个`use`语句：一个将`std::io`引入作用域，另一个将`std::io::Write`引入作用域。

文件名：src/lib.rs

```rust
use std::io;
use std::io::Write;
```

清单7-19：两个`use`语句中一个是另一个的子路径

这两条路径的共同部分是`std::io`，并且这是第一条路径的完整部分。为了将这两条路径合并成一个`use`语句，我们可以在嵌套路径中使用`self`，如清单7-20所示。

文件名：src/lib.rs

```rust
use std::io::{self, Write};
```

清单7-20：将清单7-19中的路径合并为一个`use`语句

这一行将`std::io`和`std::io::Write`引入作用域。

### [通配符操作符](https://doc.rust-lang.org/book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html#the-glob-operator)

如果我们想要将一个路径中定义的*所有*公共项引入作用域，我们可以指定该路径，后跟`*`通配符操作符：

```rust
use std::collections::*;
```

这个`use`语句将`std::collections`中定义的所有公共项引入当前作用域。使用通配符操作符时要小心！通配符可能会使得很难分辨出哪些名称在作用域中以及您的程序中使用的名称是在哪里定义的。

通常在测试时使用通配符操作符来将所有内容都引入到`tests`模块中；我们将在第11章的[“如何编写测试”](https://doc.rust-lang.org/book/ch11-01-writing-tests.html#how-to-write-tests)部分中讨论这个问题。通配符操作符有时也被用作预导入模式的一部分：有关这种模式的更多信息，请参见[标准库文档](https://doc.rust-lang.org/std/prelude/index.html#other-preludes)。