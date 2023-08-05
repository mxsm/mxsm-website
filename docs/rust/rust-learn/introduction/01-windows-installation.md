---
title: "Windows11 Rust安装"
linkTitle: "Windows11 Rust安装"
weight: 202308051736
description: Windows11 Rust安装
---

Rust是一种现代的、安全的、并发的编程语言，其强大的性能和丰富的生态系统使其在开发各种应用程序时备受欢迎。接下来在Windows平台搭建一套开发Rust的开发环境。

## 1.下载安装包

首先，访问Rust官方网站[(https://www.rust-lang.org）并下载适用于Windows的安装包] Rust"或"Download"的按钮，点击它会跳转到安装包下载页面。

![image-20230805190717222](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230805190717222.png)

根据不同的系统的位数选择。

:::info

这里可能需要先安装 [Visual Studio C++ Build tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 来保证基础环境

:::

## 2. 运行安装包安装

双击下载的安装包（通常是一个`.exe`文件），运行Rust安装程序。您将看到安装向导，按照指示进行安装。

![QQ截图20230802213724](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionQQ%E6%88%AA%E5%9B%BE20230802213724.png)

如上图所示，这里是已经在windows的环境变量里面设置**RUSTUP_HOME** 以及 **CARGO_HOME** 通过设置这两个环境变量来设置默认安装路径。

:::tip

对于自定义安装需要设置两个环境变量：

- **RUSTUP_HOME:** 设置rustup的安装路径 
- **CARGO_HOME：** 设置cargo的安装路径

通过上述两个环境变量避免了安装到C盘中。

:::

选择自定义安装(这里为了选择安装GNU,可以使用Debug模式进行调试)

![QQ截图20230802213919](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionQQ%E6%88%AA%E5%9B%BE20230802213919.png)

然后输入 **`x86_64-pc-windows-gnu`** 点击确认

![QQ截图20230802214001](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionQQ%E6%88%AA%E5%9B%BE20230802214001.png)

然后上述的全部都选择如上图所示，接着就是选择1来安装

![QQ截图20230802214016](https://github.com/mxsm/picture/blob/main/rust/rust-learn/introductionQQ%E6%88%AA%E5%9B%BE20230802214016.png?raw=true)

接下里就安装的过程，安装过程可能需要一些时间，请耐心等待直至安装完成。

![QQ截图20230802215135](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionQQ%E6%88%AA%E5%9B%BE20230802215135.png)

安装完成后，打开一个新的命令提示符或PowerShell窗口，并输入以下命令：

```shell
rustc --version
```

![image-20230805211226552](https://github.com/mxsm/picture/blob/main/rust/rust-learn/introductionimage-20230805211226552.png?raw=true)

Cargo是Rust的包管理器和构建工具，大多数Rust项目都使用它。在安装Rust的过程中，Cargo也会一并安装。为了验证Cargo是否正确安装，您可以在命令提示符或PowerShell窗口中运行以下命令：

```shell
cargo --version
```

![image-20230805203802658](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230805203802658.png)

到这里就已经完成整个的安装。

## 3. 编写第一个Rust程序

安装好了Rust环境接下来就是Rust的程序编写，本人使用的开发工具是 **jetbrains clion** （主要是免费白嫖） 开发工具看个人喜好自己选择，然后创建第一个项目：

```rust
fn main() {
    println!("Hello, world!");
}
```

运行结果如下：

![image-20230805204744181](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230805204744181.png)

并使用以下命令编译和运行您的Rust程序：

```shell
rustc main.rs
```

## 4. 工具说明

### Cargo

Cargo 是 Rust 的代码组织管理和项目构建工具，类比Java开发中的Maven以及Gradle项目构建管理工具，使用 `rustup` 安装 Rust 时，Cargo 默认也会被安装,主要的用途：

- 创建和管理 Rust 的模块系统 
- 下载和管理依赖包
- 调用`rustc`或其他构建工具来构建项目或者应用

:::tip

Cargo的使用会在后续的使用中专门进行介绍

:::

## 5. 总结

Rust是一种现代的、安全的、并发的编程语言，拥有许多优点和好处，使其在开发中备受欢迎。随着Windows使用Rust重构了部分Windows的系统部分代码，Rust在后续也会越来越受欢迎。以下是Rust的主要优点总结：

1. **安全性和内存安全**：Rust的最显著特点是其出色的安全性。它的所有权系统和借用检查器确保在编译时防止数据竞争、空指针引用和悬垂指针等内存安全问题，从而避免了许多常见的编程错误。区别C++和C的内存释放问题。
2. **高性能**：Rust编译器生成高效的机器码，使得Rust的性能接近于C和C++。
3. **并发支持**：Rust提供轻量级线程（通过`std::thread`）和原生支持并发编程。其`async/await`机制让编写高效的异步代码变得简单。
4. **易于学习**：Rust的语法简洁、清晰，具有C和C++类似的语法特性，使得学习曲线较为平缓。Rust的错误信息也非常友好，有助于开发者快速定位问题。对于其他的语言（Java）学习人员也比较友好
5. **生态系统**：虽然Rust是相对较新的语言，但其生态系统正在迅速成长。Rust拥有丰富的库和工具，方便开发者构建各种类型的应用程序。例如TiKV等项目都使用Rust进行重写
6. **跨平台**：Rust支持跨平台开发，可在各种操作系统（如Windows、macOS、Linux等）上运行。
7. **社区和支持**：Rust有一个活跃的社区，开发者可以在社区中获得丰富的学习资源和技术支持。
8. **工具链**：Rust附带有强大的工具链，包括包管理器Cargo、测试框架、文档生成工具等，使开发过程更加高效。
9. **可靠性**：Rust鼓励编写可靠、健壮的代码，使得开发者可以构建更稳定、可维护的软件。
10. **与其他语言的互操作性**：Rust支持与C和C++的互操作，使得在现有项目中使用Rust成为可能。

> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)\~谢谢! Emal:mxsm@apache.com