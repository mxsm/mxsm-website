---
title: "Rust项目结构Package和Crate"
sidebar_label: Rust项目结构Package和Crate
linkTitle: "Rust项目结构Package和Crate"
weight: 202308122155
description: Rust项目结构Package和Crate
---

## 1. Package和Crate

在 Rust 中，`package` 和 `crate` 是两个重要的概念，用于组织和管理代码。它们分别表示不同层次的代码组织和封装。

### 1.1 Crate

- 一个 `crate` 是一个 Rust 项目或库的编译单元，它可以包含多个模块和代码文件。一个 `crate` 可以是一个二进制可执行文件或一个库（例如，静态库或动态库）。
- `crate` 是 Rust 的最小编译单元，每个 `crate` 都会生成一个独立的二进制文件或库文件。`crate` 中的模块和代码可以通过 `use` 关键字在其他 `crate` 中引用和重用。
- `crate` 也可以被其他 `crate` 依赖，以在项目中使用外部库。这些外部库称为依赖库，可以在项目的 `Cargo.toml` 文件中指定。

### 1.2 Package

- 一个 `package` 是一个包含一个或多个 `crate` 的更高级别的组织单元。通常，一个 `package` 包含一个主 `crate`，即二进制可执行文件或库，以及其他可能的辅助 `crate`。
- `package` 是由一个 `Cargo.toml` 文件定义的，它包含了项目的元数据（如名称、版本、作者等）以及项目的依赖配置。
- `package` 可以包含多个 `crate`，这些 `crate` 可以是主 `crate` 的辅助模块或库，也可以是不同的二进制文件。

### 1.3 与Java对比

Java中的模块可以看做成Rust的Crate,而Java中的项目和Rust的Package可以看成是等价的。所以Rust的package和Java中的package不是一个概念。`crate` 是 Rust 中最小的编译单元，可以是项目的二进制文件或库。而 `package` 则是一个更高级别的组织单元，包含一个或多个相关的 `crate`，由一个 `Cargo.toml` 文件定义。`crate` 可以通过 `use` 关键字在其他代码中引用，而 `package` 可以被其他项目依赖和集成。

## 2. Package的格式

Package分为两种：

- **binary**：应用模版
- **library**: 库模版

Cargo使用文件放置的约定，以便轻松地深入了解新的Cargo包：

```shell
.
├── Cargo.lock
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── main.rs
│   └── bin/
│       ├── named-executable.rs
│       ├── another-executable.rs
│       └── multi-file-executable/
│           ├── main.rs
│           └── some_module.rs
├── benches/
│   ├── large-input.rs
│   └── multi-file-bench/
│       ├── main.rs
│       └── bench_module.rs
├── examples/
│   ├── simple.rs
│   └── multi-file-example/
│       ├── main.rs
│       └── ex_module.rs
└── tests/
    ├── some-integration-tests.rs
    └── multi-file-test/
        ├── main.rs
        └── test_module.rs

```

- `Cargo.toml` 和 `Cargo.lock` 存储在你的包的根目录中（*包根目录*）。
- 源代码放在 `src` 目录中。
- 默认库文件是 `src/lib.rs`。
- 默认的可执行文件是 `src/main.rs`。
  - 其他可执行文件可以放在 `src/bin/` 目录中。
- 基准测试放在 `benches` 目录中。
- 示例放在 `examples` 目录中。
- 集成测试放在 `tests` 目录中。

如果一个二进制、示例、基准测试或集成测试由多个源文件组成，在 `src/bin`、`examples`、`benches` 或 `tests` 目录的子目录中放置一个 `main.rs` 文件以及额外的[*模块*](https://doc.rust-lang.org/cargo/appendix/glossary.html#module)。可执行文件的名称将是目录名称。

通过命令:

```shell
cargo new --help
```

可以看出来创建有两种上面所述的：**`binary`** 和 **`library`** 

![image-20230813102752855](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230813102752855.png)

### 2.1 创建binary

命令：

```shell
cargo new xxx --bin  
```

> xxx: package名称

![image-20230813103226526](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230813103226526.png)

通过命令行创建可以看出来自包含了最简单的，而tests等其他的目录是需要自己手动建（可以看出来是非必须得）。

### 2.2 创建library

命令：

```shell
cargo new xxx --lib
```

> xxx: package名称

![image-20230813103448562](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230813103448562.png)

从上图看出和binary的模版一样tests相关的目录没有创建需要手动创建非必须的。

## 3. 总结

1. 通过工具cargo创建package有两类：**`binary`** 和 **`library`** ，**`binary`** 是一个包含可执行文件的 Rust 项目，通常用于创建独立的可执行应用程序。，也就是Java中的带有main函数的Java类，**`library`**  一个库包中至少包含一个 Rust 代码文件（通常是 lib.rs），其中定义了模块、结构体、函数等等。
2.  benches模块，examples模块以及tests模块非必须。这个根据个人需要进行新建设置。



> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)\~谢谢! Emal:mxsm@apache.com
