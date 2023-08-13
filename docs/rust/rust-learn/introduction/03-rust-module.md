---
title: "Rust项目结构modules"
sidebar_label: Rust项目结构modules
linkTitle: "Rust项目结构modules"
weight: 202308122155
description: Rust项目结构modules
---

## 1. Rust module  是什么?

在 Rust 中，`module`（模块）是一种用于组织代码的机制。模块允许您将相关的代码块、函数、结构体、枚举和其他项分组在一起，以便于管理和组织项目的代码结构。通过使用模块，您可以将代码分成逻辑上的单元，并将其组织成层次结构。

> module可以看成Java中的Package或者是大型项目中的module。



## 2. 如何定义Rust module?

模块定义有两种方式：

- 直接通过语法定义在一个文件中
- 通过文件来定义不同的模块，以文件作为区分。

### 2.1 语法定义

```rust
Syntax:
Module :
      unsafe? mod IDENTIFIER ;
   | unsafe? mod IDENTIFIER {
        InnerAttribute*
        Item*
      }
```

模块相当于一个容器包含0个或者多个item,这些item可以是如下：

- [modules](https://doc.rust-lang.org/reference/items/modules.html)
- [`extern crate` declarations](https://doc.rust-lang.org/reference/items/extern-crates.html)
- [`use` declarations](https://doc.rust-lang.org/reference/items/use-declarations.html)
- [function definitions](https://doc.rust-lang.org/reference/items/functions.html)
- [type definitions](https://doc.rust-lang.org/reference/items/type-aliases.html)
- [struct definitions](https://doc.rust-lang.org/reference/items/structs.html)
- [enumeration definitions](https://doc.rust-lang.org/reference/items/enumerations.html)
- [union definitions](https://doc.rust-lang.org/reference/items/unions.html)
- [constant items](https://doc.rust-lang.org/reference/items/constant-items.html)
- [static items](https://doc.rust-lang.org/reference/items/static-items.html)
- [trait definitions](https://doc.rust-lang.org/reference/items/traits.html)
- [implementations](https://doc.rust-lang.org/reference/items/implementations.html)
- [`extern` blocks](https://doc.rust-lang.org/reference/items/external-blocks.html)

也就是模块中还可以定义模块，同时还可以包含方法，结构体等等。

**模块声明：**

使用 `mod` 关键字在 Rust 中声明一个模块。模块可以嵌套，从而创建一个层次结构。模块声明告诉 Rust 代码的组织方式。

```rust
mod mxsm_module {
    // 模块内的代码
}

mod math {
    type Complex = (f64, f64);
    fn sin(f: f64) -> f64 {
        /* ... */
    }
    fn cos(f: f64) -> f64 {
        /* ... */
    }
    fn tan(f: f64) -> f64 {
        /* ... */
    }
}
```

**模块路径:**

模块路径用于引用其他模块中的项。模块路径由模块的名称组成，可以包含多个模块层次。可以使用 `::` 运算符来指定模块路径。如下代码

```rust
mod my_mxsm {
    pub fn my_function() {
        
    }
}

fn main() {
    my_mxsm::my_function(); // 使用模块路径引用函数
}

```

**模块可见性:**

Rust 中的项（例如函数、结构体、枚举等）默认情况下是私有的，只能在同一个模块中访问。使用 `pub` 关键字可以将项设置为公共的，以便在其他模块中访问。

> 对比Java可见性通过private, public , protected 关键字进行控制

```rust
mod mxsm_module {
    pub fn public_function() {
        // 公共函数
    }

    fn private_function() {
        // 私有函数
    }
}

fn main() {
    mxsm_module::public_function(); // 可以访问公共函数
    // mxsm_module::private_function(); // 无法访问私有函数
}

```

在Rust的可见性中自由两种：公共(pub)和私有(无任何修饰)。

### 2.2 模块源文件

没有主体的模块将从外部文件加载。当模块没有路径属性时，文件的路径反映了逻辑模块路径。根模块路径组件是目录，模块的内容位于一个文件中，文件名为模块加上 .rs 扩展名。例如，下面的模块结构可以对应以下的文件系统结构：

|                       |                  |               |
| --------------------- | ---------------- | ------------- |
| Module Path           | Filesystem Path  | File Contents |
| `crate`               | `lib.rs`         | `mod util;`   |
| `crate::util`         | `util.rs`        | `mod config;` |
| `crate::util::config` | `util/config.rs` |               |

模块的文件名也可以是模块名称作为一个目录，其中的内容位于该目录下名为 mod.rs 的文件中。上面的示例也可以用 crate::util 表示，其内容在名为 util/mod.rs 的文件中。不允许同时存在 util.rs 和 util/mod.rs 两者。

> 注意：在 rustc 1.30 之前，使用 mod.rs 文件是加载具有嵌套子模块的模块的方法。鼓励使用新的命名约定，因为它更一致，并且避免在项目中有许多名为 mod.rs 的文件。

我们就使用开发工具来创建上面的模块：

1. **创建package**

   ![image-20230813184905149](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230813184905149.png)

2. **创建util文件**

   ![image-20230813185058233](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230813185058233.png)

   创建完成后会发现在文件上面有一行提示。这个表示当前module没有添加到lib.rs中。点击添加或者直接手动添加即可

   ![image-20230813185259512](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230813185259512.png)

3. **创建util目录以及config模块**

   ![image-20230813185428531](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230813185428531.png)

这里就完成整个模块的创建。从上面的图创建可看出来是一层层像结构树一样。

## 3. Path属性

用于加载外部文件模块的目录和文件可以受到 path 属性的影响。对于不在内联模块块内的模块的路径属性，文件路径是相对于源文件所在的目录的。例如，以下代码片段将根据其所在位置使用所示的路径：

![image-20230813200757498](https://raw.githubusercontent.com/mxsm/picture/main/rust/rust-learn/introductionimage-20230813200757498.png)

在 Rust 中，`#[path]` 属性用于在编译时指定一个文件的路径，以便将其内容包含到当前文件中。这在某些情况下可以用来实现代码分离或在不同的上下文中复用代码。

> 但是，值得注意的是，`#[path]` 属性通常不是推荐的做法，因为它可能导致代码可读性降低、维护困难等问题。

## 4. Rust模块引用

在 Rust 中，路径（path）通常用于引用模块、项（函数、结构体、枚举等）以及其他 crate 中的内容。路径指示了 Rust 编译器应该在哪里查找特定的项。路径有两种主要类型：

- **绝对路径**
- **相对路径**

### 4.1 **绝对路径（Absolute Path）**：

绝对路径从 crate 根开始，指定了从 crate 根到目标项的完整路径。在绝对路径中，通常使用 crate 名称作为起点。

```rust
// 使用绝对路径引入其他 crate 中的项
use crate_name::module_name::item_name;
```

```rust
// 使用绝对路径引入当前 crate 中的项
use crate::module_name::item_name;
```

### 4.2 **相对路径（Relative Path）**：

相对路径从当前模块开始，指定了从当前模块到目标项的路径。在相对路径中，使用 `super` 关键字表示父模块，使用 `self` 关键字表示当前模块。

```rust
// 使用相对路径引入当前模块中的项
use self::module_name::item_name;
```

```rust
// 使用相对路径引入父模块中的项
use super::module_name::item_name;
```

```rust
// 使用相对路径引入当前模块中的其他项
mod my_module {
    use self::other_item::SomeType;
    // 或者
    use crate::my_module::other_item::SomeType;
}
```

请注意，路径的使用方式取决于所处的代码位置和要引入的项的位置。通过适当的路径，可以在不同的模块和 crate 之间访问和重用代码项。Rust 的路径系统有助于实现模块化和可维护的代码结构。

> 我是蚂蚁背大象，文章对你有帮助给[项目点个❤](https://github.com/mxsm/mxsm-website)关注我[GitHub:mxsm](https://github.com/mxsm)，文章有不正确的地方请您斧正,创建[ISSUE提交PR](https://github.com/mxsm/mxsm-website/issues)\~谢谢! Emal:<mxsm@apache.com>

