---
title: "Hello, World!"
sidebar_label: 1.2 Hello, World!
linkTitle: "Rust Hello, World!"
weight: 202308051736
description: Rust Hello, World!第一个程序
---



# Hello, World!

现在你已经安装了Rust,是时候编写你的第一个Rust程序了。当学习一门新语言时,编写一个在屏幕上打印“你好,世界!”文本的小程序是传统,所以我们在这里也将这样做!

> 注意:本书假设您对命令行有基本的熟悉度。Rust没有对您的编辑或工具或代码所在的位置作出具体要求,所以如果您更喜欢使用集成开发环境(IDE)而不是命令行,请随意使用您最喜欢的IDE。现在许多IDE都有一定程度的Rust支持;请检查IDE的文档以获取详细信息。Rust团队一直在通过`rust-analyzer`致力于支持出色的IDE。请参阅[附录D](https://doc.rust-lang.org/book/appendix-04-useful-development-tools.html)以获取更多详细信息。

## 创建项目目录

首先,您将创建一个目录来存储Rust代码。Rust不关心您的代码所在的位置,但是对于本书中的练习和项目,我们建议在主目录中创建一个`projects`目录,并在其中保留所有项目。

打开一个终端并输入以下命令在`projects`目录中创建一个“Hello World”项目的目录。

对于Linux、macOS和Windows上的PowerShell,输入:

```console
$ mkdir ~/projects
$ cd ~/projects
$ mkdir hello_world
$ cd hello_world
```

对于Windows CMD,输入:

```cmd
> mkdir "%USERPROFILE%\projects"
> cd /d "%USERPROFILE%\projects"
> mkdir hello_world
> cd hello_world
```

## 编写和运行Rust程序

接下来,新建一个源文件,并将其命名为`main.rs`。Rust文件总是以`.rs`扩展名结尾。如果您使用多个单词作为文件名,约定是使用下划线将它们分隔开。例如,使用 `hello_world.rs`而不是`helloworld.rs`。

现在打开刚刚创建的`main.rs`文件,输入列表1-1中的代码。

文件名:`main.rs`

```rust
fn main() {
  println!("Hello, world!");
}
```

列表1-1: 打印`Hello, world!`的程序

保存文件,然后回到`~/projects/hello_world`目录下的终端窗口。在Linux或macOS上,输入以下命令来编译和运行该文件:

```console
$ rustc main.rs
$ ./main
Hello, world!
```

在Windows上,输入命令`.\main.exe`代替`./main`:

```powershell
> rustc main.rs
> .\main.exe
Hello, world!
```

无论您的操作系统如何,字符串“Hello, world!”都应该打印到终端中。如果没有看到此输出,请参阅[“故障排除”](https://doc.rust-lang.org/book/ch01-01-installation.html#troubleshooting)部分以获取帮助的方法。

如果打印出了“Hello, world!”,恭喜你!您正式编写了一个Rust程序。这使您成为了一个Rust程序员--欢迎加入!

## Rust程序剖析

让我们详细查看这个“Hello World”程序。以下是第一部分:

```rust
fn main() {

}
```

这些行定义了一个名为`main`的函数。`main`函数很特殊:它是每个Rust可执行程序中首先运行的代码。在这里,第一行声明了一个没有参数也不返回任何内容的名为`main`的函数。如果有参数,它们应放在括号`()`中。

函数体被`{}`包围。Rust要求所有函数体都有花括号包围。将开括号放在函数声明同一行并在中间添加一个空格是良好的编程风格。

> 注意:如果您想在Rust项目中保持标准的样式,可以使用名为`rustfmt`的自动格式化工具来以特定样式格式化代码(有关`rustfmt`的更多细节请参阅[附录D](https://doc.rust-lang.org/book/appendix-04-useful-development-tools.html))。Rust团队已经将此工具与`rustc`标准Rust发行版一起包含,所以它应该已经安装在您的计算机上!

`main`函数体包含以下代码:

```rust
  println!("Hello, world!");
```

这行代码完成了这个小程序中的所有工作:它向屏幕打印文本。这里有四个需要注意的重要细节。

首先,Rust的编程风格是使用4个空格缩进,而不是制表符。

其次,`println!`调用了一个Rust宏。如果它调用一个函数,那么它会被写成`println`(没有`!`)。我们将在第19章更详细地讨论Rust宏。现在,您只需要知道使用`!`意味着您正在调用一个宏,而不是普通函数,并且宏不总是遵循与函数相同的规则。

第三,您可以看到`"Hello, world!"`字符串。我们将这个字符串作为参数传递给`println!`,然后它被打印到屏幕上。

第四,我们在行尾添加分号(`;`),这表示这个表达式结束,下一个表达式可以开始了。大多数Rust代码行以分号结尾。

## 编译和运行是独立的步骤

您刚刚运行了一个新创建的程序,所以让我们检查一下每个步骤的过程。

在运行Rust程序之前,必须使用Rust编译器通过输入`rustc`命令并传入源文件名来编译它,如下所示:

```console
$ rustc main.rs
```

如果您有C或C++背景,会发现这与`gcc`或`clang`类似。编译成功后,Rust会输出一个二进制可执行文件。

在Linux、macOS和Windows上的PowerShell中,可以通过在shell中输入`ls`命令来查看可执行文件:

```console 
$ ls
main main.rs
```

在Linux和macOS上,您会看到两个文件。在Windows上的PowerShell中,您会看到与使用CMD相同的三个文件。在Windows上的CMD中,您需要输入:

```cmd
> dir /B %= /B选项意味着只显示文件名=%
main.exe
main.pdb
main.rs
```

这显示了带有`.rs`扩展名的源代码文件,在Windows上的可执行文件(`main.exe`),以及在使用Windows时包含调试信息的带有`.pdb`扩展名的文件。接下来,您可以像这样运行`main`或`main.exe`文件:

```console
$ ./main # 或在Windows上 .\main.exe
```

如果您的`main.rs`是“Hello, world!”程序,这行会将`Hello, world!`打印到您的终端。

如果您更熟悉动态语言,例如Ruby、Python或JavaScript,则可能不习惯将编译和运行作为独立的步骤。Rust是一种`提前编译`的语言,这意味着您可以编译一个程序并将可执行文件给别人,即使他们没有安装Rust也可以运行它。如果您给某人一个`.rb`、`.py`或`.js`文件,他们需要安装Ruby、Python或JavaScript实现(分别)。但是在这些语言中,您只需要一个命令来编译和运行程序。语言设计都是需要权衡利弊的。

对于简单的程序,仅使用`rustc`进行编译就可以了,但是随着项目的增长,您会想要管理所有选项并轻松共享代码。接下来,我们将向您介绍Cargo工具,它将帮助您编写真实的Rust程序。