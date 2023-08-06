---
title: "包(Package)和板条箱(Crate)"
linkTitle: "包(Package)和板条箱(Crate)"
sidebar_label: 7.1. 包(Package)和板条箱(Crate)
weight: 202308051736
description: 包(Package)和板条箱(Crate)
---

## [包和板条箱](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html#packages-and-crates)

模块系统的第一部分是包和板条箱。

*板条箱*是 Rust 编译器一次考虑的最小代码量。即使您运行的是 `rustc` 而不是 `cargo`，并且传递一个单独的源代码文件（就像我们在第1章的“编写和运行Rust程序”部分所做的那样），编译器将该文件视为一个板条箱。板条箱可以包含模块，而模块可以在其他文件中定义，这些文件会与板条箱一起编译，我们将在接下来的部分中看到。

一个板条箱可以是二进制板条箱或库板条箱。*二进制板条箱*是可以编译为可执行文件的程序，比如命令行程序或服务器。每个二进制板条箱必须有一个名为 `main` 的函数，定义了在执行可执行文件时发生的事情。到目前为止，我们创建的所有板条箱都是二进制板条箱。

*库板条箱*没有 `main` 函数，它们也不会编译为可执行文件。相反，它们定义了意图与多个项目共享的功能。例如，我们在[第2章](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html#generating-a-random-number)中使用的 `rand` 板条箱提供了生成随机数的功能。大多数情况下，当 Rustaceans（Rust程序员）说“板条箱”时，他们指的是库板条箱，并且他们将“板条箱”与“库”这个一般的编程概念交换使用。

*板条箱根*是一个源代码文件，Rust 编译器从该文件开始，它构成了板条箱的根模块（我们将在[“定义模块以控制作用域和私有性”](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html)部分中详细解释模块）。

*包*是一个包含一个或多个板条箱的捆绑提供一组功能的结构。一个包含一个描述如何构建这些板条箱的 *Cargo.toml* 文件。Cargo 实际上是一个包，它包含了您一直在使用的命令行工具的二进制板条箱。Cargo 包还包含了一个库板条箱，这个二进制板条箱依赖于它。其他项目可以依赖于 Cargo 库板条箱，以使用与 Cargo 命令行工具相同的逻辑。

一个包可以包含任意数量的二进制板条箱，但最多只能有一个库板条箱。一个包必须包含至少一个板条箱，无论是库板条箱还是二进制板条箱。

让我们逐步了解创建包时发生的情况。首先，我们输入命令 `cargo new`：

```console
$ cargo new my-project
     Created binary (application) `my-project` package
$ ls my-project
Cargo.toml
src
$ ls my-project/src
main.rs
```

在运行 `cargo new` 后，我们使用 `ls` 查看 Cargo 创建了什么。在项目目录中，有一个 *Cargo.toml* 文件，这是一个包。还有一个 *src* 目录，其中包含 *main.rs*。在文本编辑器中打开 *Cargo.toml*，请注意没有提及 *src/main.rs*。Cargo 遵循一个约定，即 *src/main.rs* 是与包同名的二进制板条箱的板条箱根。同样，Cargo 知道如果包目录包含 *src/lib.rs*，则包含一个与包同名的库板条箱，而 *src/lib.rs* 是其板条箱根。Cargo 将板条箱根文件传递给 `rustc` 来构建库或二进制文件。

在这里，我们有一个只包含 *src/main.rs* 的包，这意味着它只包含一个名为 `my-project` 的二进制板条箱。如果一个包含 *src/main.rs* 和 *src/lib.rs*，则有两个板条箱：一个二进制板条箱和一个与包同名的