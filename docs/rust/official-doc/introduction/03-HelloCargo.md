---
title: "Hello, Cargo!"
sidebar_label: "1.3.Hello, Cargo!"
linkTitle: "Hello, Cargo!"
weight: 202308051736
description: Rust Cargo的使用
---

# Hello, Cargo!

Cargo是Rust的构建系统和包管理器。大多数Rustacean使用此工具来管理他们的Rust项目,因为Cargo会处理许多任务,例如构建代码、下载代码所依赖的库以及构建这些库(我们称代码所需的库为*依赖项*)。

最简单的Rust程序,比如我们到目前为止编写的,都没有任何依赖项。如果我们使用Cargo构建“Hello, World!”项目,它只会使用Cargo的构建代码部分。随着编写更复杂的Rust程序,您会添加依赖项,如果一开始使用Cargo启动项目,添加依赖项会变得更容易。

由于绝大多数Rust项目使用Cargo,本书的其余部分假定您也在使用Cargo。如果您使用了[“安装”](https://doc.rust-lang.org/book/ch01-01-installation.html#installation)部分讨论的官方安装程序,Rust会预安装Cargo。如果您通过其他方式安装了Rust,可以通过在终端输入以下命令检查是否安装了Cargo:

```console
$ cargo --version
```

如果看到一个版本号,那说明已经安装了!如果看到一个错误,例如`command not found`,请查看您的安装方法的文档以确定如何单独安装Cargo。

## 使用Cargo创建项目

让我们使用Cargo创建一个新项目,并看看它与我们的原始“Hello, World!”项目有何不同。回到您的`projects`目录(或保存代码的任何位置)。然后,在任何操作系统上,运行:

```console
$ cargo new hello_cargo
$ cd hello_cargo
```

第一个命令会创建一个名为`hello_cargo`的新目录和项目。我们将项目命名为`hello_cargo`,Cargo会在同名目录中创建其文件。

进入`hello_cargo`目录并列出文件。您会看到Cargo为我们生成了两个文件和一个目录:`Cargo.toml`文件、`src`目录和其中的`main.rs`文件。

它还初始化了一个新的Git仓库以及一个`.gitignore`文件。如果在现有的Git仓库中运行`cargo new`,则不会生成Git文件;您可以使用`cargo new --vcs=git`覆盖此行为。

> 注意:Git是一种常见的版本控制系统。您可以通过使用`--vcs`标志更改`cargo new`使用不同的版本控制系统或不使用任何版本控制系统。运行`cargo new --help`查看可用选项。

使用您选择的文本编辑器打开`Cargo.toml`。它应该类似于列表1-2中的代码。

文件名: Cargo.toml

```toml
[package]
name = "hello_cargo" 
version = "0.1.0"
edition = "2021"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[dependencies]
```

列表1-2: `cargo new`生成的`Cargo.toml`内容

该文件使用[**TOML**](https://toml.io/)(**T**om的**o**bvious,**m**inimal **l**anguage,汤姆的明显最小语言)格式,这是Cargo的配置格式。

第一行`[package]`是一个部分标题,表示以下语句正在配置一个包。随着我们向此文件添加更多信息,我们将添加其他部分。

接下来的三行设置Cargo编译程序所需的配置信息:名称、版本和要使用的Rust版本。我们将在[附录E](https://doc.rust-lang.org/book/appendix-05-editions.html)中讨论`edition`键。

最后一行`[dependencies]`是您列出项目依赖项的部分的开始。在Rust中,代码包称为*crates*。我们的项目不需要其他crates,但是第2章的第一个项目需要,所以我们会在依赖关系部分使用它。

现在打开`src/main.rs`看看:

文件名:`src/main.rs`

```rust
fn main() {
  println!("Hello, world!");
}
```

Cargo为您生成了一个“Hello, world!”程序,就像我们在列表1-1中编写的一样!到目前为止,我们的项目与Cargo生成的项目的区别是Cargo将代码放在`src`目录中,并在顶级目录中有一个`Cargo.toml`配置文件。

Cargo希望源文件位于`src`目录中。顶级项目目录仅用于自述文件、许可信息、配置文件和与代码无关的任何其他内容。使用Cargo有助于组织项目。每样东西都有其所在之处。

如果开始的项目不使用Cargo,就像我们对“Hello, world!”项目所做的那样,可以将其转换为使用Cargo的项目。将项目代码移动到`src`目录中,并创建适当的`Cargo.toml`文件。

## 构建和运行Cargo项目

现在让我们看看使用Cargo构建和运行“Hello, world!”程序有什么不同!在`hello_cargo`目录中,通过输入以下命令构建项目:

```console
$ cargo build 
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 2.85 secs
```

该命令会在`target/debug/hello_cargo`中创建可执行文件(或Windows上的`target\debug\hello_cargo.exe`),而不是在当前目录中。因为默认构建是调试构建,所以Cargo会将二进制文件放在名为`debug`的目录中。可以使用此命令运行可执行文件:

```console
$ ./target/debug/hello_cargo # or .\target\debug\hello_cargo.exe on Windows 
Hello, world!
```

如果一切顺利,`Hello, world!`应该打印到终端。第一次运行`cargo build`还会导致Cargo在顶层创建一个新文件:`Cargo.lock`。该文件跟踪项目中依赖项的确切版本。该项目没有依赖项,所以该文件比较简单。您永远不需要手动更改此文件;Cargo会为您管理其内容。

我们刚刚使用`cargo build`构建了一个项目,使用`./target/debug/hello_cargo`运行了它,但是我们也可以使用`cargo run`在一步中编译代码并运行生成的可执行文件:

```console
$ cargo run
   Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
    Running `target/debug/hello_cargo`
Hello, world!
```

使用`cargo run`比记住为二进制文件使用完整路径要方便得多,所以大多数开发者使用`cargo run`。

注意这次我们没有看到输出表明Cargo正在编译`hello_cargo`。Cargo发现文件没有更改,所以它没有重建,只是运行了二进制文件。如果您修改了源代码,Cargo会在运行之前重建项目,您会看到此输出:

```console 
$ cargo run
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.33 secs 
     Running `target/debug/hello_cargo`
Hello, world!
```

Cargo还提供了一个名为`cargo check`的命令。该命令快速检查代码是否可以编译,但不产生可执行文件:

```console
$ cargo check
  Checking hello_cargo v0.1.0 (file:///projects/hello_cargo)
   Finished dev [unoptimized + debuginfo] target(s) in 0.32 secs
```

为什么不需要一个可执行文件呢?通常,`cargo check`比`cargo build`快得多,因为它跳过了生成可执行文件的步骤。如果您在编写代码时需要不断检查工作,使用`cargo check`会加快这个过程,让您知道项目是否仍在编译!因此,许多Rustacean在编写程序时会定期运行`cargo check`,以确保它可以编译。然后,当需要使用可执行文件时,他们会运行`cargo build`。

让我们总结一下到目前为止关于Cargo学到的知识:

- 我们可以使用`cargo new`创建一个项目。

- 我们可以使用`cargo build`构建项目。

- 我们可以使用`cargo run`在一步中构建和运行项目。

- 我们可以使用`cargo check`在不产生二进制文件的情况下构建项目以检查错误。

- 与代码保存在同一目录不同,Cargo会将构建结果存储在`target/debug`目录中。

与仅使用`rustc`相比,使用Cargo的另一个优点是无论您使用哪种操作系统,命令都是相同的。所以,在这一点上,我们不再针对Linux、macOS与Windows提供特定的说明。

## 发布构建

当项目最终准备好发布时,可以使用`cargo build --release`进行编译以进行优化。这个命令会在`target/release`而不是`target/debug`中创建一个可执行文件。优化使Rust代码运行更快,但启用优化会增加编译程序的时间。这就是为什么会有两个不同的配置文件:一个用于频繁重建和重建的开发,另一个用于构建给用户的最终程序,不会重复构建并且会尽可能快地运行。如果要基准测试代码的运行时间,请确保运行`cargo build --release`并用`target/release`中的可执行文件进行基准测试。

## Cargo作为约定

对于简单的项目,与直接使用`rustc`相比,Cargo的价值并不大,但是随着程序变得更复杂,它的价值就会显现出来。一旦程序增长到多个文件或需要依赖项,让Cargo来协调构建会更容易。

即使`hello_cargo`项目很简单,它现在也使用了在Rust生涯中会使用的大部分实际工具。事实上,要使用任何现有项目,可以使用以下命令使用Git检出代码,切换到该项目目录,并构建:

```console
$ git clone example.org/someproject
$ cd someproject
$ cargo build
```

有关Cargo的更多信息,请查看[其文档](https://doc.rust-lang.org/cargo/)。

## 总结

您已经在Rust之旅中迈出了伟大的第一步!在本章中,您学习了如何:

- 使用 `rustup` 安装最新稳定版本的 Rust
- 更新到较新的 Rust 版本
- 打开本地安装的文档
- 使用 `rustc` 直接编写和运行 “Hello, world!” 程序
- 使用 Cargo 的约定创建和运行新项目

这是一个构建更实质性程序以熟悉阅读和编写 Rust 代码的好时机。因此,在第 2 章中,我们将构建一个猜谜游戏程序。如果您更喜欢先了解常见编程概念在 Rust 中的工作方式,请参阅第 3 章,然后再回到第 2 章。