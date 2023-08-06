---
title: "安装"
sidebar_label: 1.1. 安装
linkTitle: "Rust安装"
weight: 202308051736
description: Rust安装
---



# Rust安装

第一步是安装Rust。我们将通过rustup下载Rust,这是一个用于管理Rust版本和相关工具的命令行工具。您需要联网下载。

注意:如果由于某些原因您不想使用rustup,请参阅其他Rust安装方法页面以获取更多选项。

以下步骤将安装最新稳定版本的Rust编译器。Rust的稳定性保证确保书中所有可以编译的示例在使用较新版本的Rust时也可以编译。不同版本之间的输出可能略有不同,因为Rust通常会改进错误消息和警告。换句话说,使用这些步骤安装的任何新版本的稳定Rust都应该与本书的内容配合良好。

命令行表示法

在本章及全书中,我们将展示一些在终端中使用的命令。以$开头的行表示您应该在终端中输入的内容。您不需要输入$字符;它是提示命令开始位置的命令行提示符。不以$开头的行通常显示前一个命令的输出。另外,特定于PowerShell的示例将使用>而不是$。

## 在Linux或macOS上安装rustup

如果您使用Linux或macOS,请打开一个终端并输入以下命令:

```
$ curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

该命令会下载一个脚本并开始安装rustup工具,它会安装最新稳定版本的Rust。您可能会被要求输入密码。如果安装成功,会出现以下行:

```
Rust is installed now. Great!
```

您还需要一个链接器,这是一个Rust用来将其编译输出合并为一个文件的程序。您可能已经有一个了。如果您遇到链接器错误,应该安装C编译器,其通常会包含链接器。C编译器也很有用,因为一些常见的Rust包依赖于C代码,需要C编译器。

在macOS上,您可以通过运行以下命令获取C编译器:

```
$ xcode-select --install
```

Linux用户应根据其发行版的文档通常安装GCC或Clang。例如,如果您使用Ubuntu,可以安装build-essential包。

## 在Windows上安装rustup

在Windows上,请访问 https://www.rust-lang.org/tools/install 并按照安装Rust的说明进行操作。在某个时候,您会收到一条消息,其中解释说您还需要Visual Studio 2013或更高版本的MSVC构建工具。

要获取构建工具,您需要安装Visual Studio 2022。当询问要安装哪些工作负载时,请包括:

- “Desktop Development with C++”
- Windows 10或11 SDK
- 英语语言包组件以及您选择的任何其他语言包

本书的其余部分使用在cmd.exe和PowerShell中都可以工作的命令。如果有具体区别,我们会进行解释应该使用哪个。

## 故障排除

要检查Rust是否正确安装,请打开shell并输入此行:

```
$ rustc --version
```

您应该看到已发布的最新稳定版本的版本号、提交哈希和提交日期,格式如下:

```
rustc x.y.z (abcabcabc yyyy-mm-dd)
```

如果看到此信息,则表示已成功安装Rust! 如果您没有看到此信息,请检查Rust是否在您的%PATH%系统变量中,如下所示。

在Windows CMD中,使用:

```
> echo %PATH%
```

在PowerShell中,使用:

```
> echo $env:Path
```

在Linux和macOS上,使用:

```
$ echo $PATH
```

如果一切正确但Rust仍然不工作,您可以获得帮助的地方有很多。请在社区页面上了解如何联系其他Rustaceans(我们给自己的愚蠢昵称)。

## 更新和卸载

一旦通过rustup安装Rust,更新到新发布的版本很容易。从shell中运行以下更新脚本:

```
$ rustup update
```

要卸载Rust和rustup,请从shell中运行以下卸载脚本:

```
$ rustup self uninstall
```

## 本地文档

Rust的安装还包括本地副本的文档,以便您可以脱机阅读。运行rustup doc在浏览器中打开本地文档。

如果标准库提供了某个类型或函数,而您不确定它的作用或如何使用它,请使用应用程序编程接口(API)文档来查找相关信息!