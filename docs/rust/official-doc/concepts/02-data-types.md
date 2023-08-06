---
title: "数据类型"
sidebar_label: 3.2. 数据类型
linkTitle: "数据类型"
weight: 202308051736
description: 数据类型
---

## [数据类型](https://doc.rust-lang.org/book/ch03-02-data-types.html#data-types)

在 Rust 中，每个值都属于某种*数据类型*，它告诉 Rust 正在指定哪种类型的数据，以便了解如何处理该数据。我们将讨论两种数据类型子集：标量类型和复合类型。

请记住，Rust 是一种*静态类型*语言，这意味着它必须在编译时了解所有变量的类型。编译器通常可以根据值及其使用方式来推断我们要使用的类型。在某些情况下，可能有多种类型可用，例如在第 2 章的[“比较猜测与秘密数字”](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html#comparing-the-guess-to-the-secret-number) 部分中，我们通过使用 `parse` 将 `String` 转换为数值类型时，必须添加类型注释，如下所示：

```rust
let guess: u32 = "42".parse().expect("Not a number!");
```

如果我们不添加前面代码中显示的 `: u32` 类型注释，Rust 将显示以下错误，这意味着编译器需要更多的信息来知道我们要使用哪种类型：

```console
$ cargo build
   Compiling no_type_annotations v0.1.0 (file:///projects/no_type_annotations)
error[E0282]: type annotations needed
 --> src/main.rs:2:9
  |
2 |     let guess = "42".parse().expect("Not a number!");
  |         ^^^^^
  |
help: consider giving `guess` an explicit type
  |
2 |     let guess: _ = "42".parse().expect("Not a number!");
  |              +++

For more information about this error, try `rustc --explain E0282`.
error: could not compile `no_type_annotations` due to previous error
```

对于其他数据类型，您将看到不同的类型注释。

### [标量类型](https://doc.rust-lang.org/book/ch03-02-data-types.html#scalar-types)

*标量*类型表示单个值。Rust 有四种主要的标量类型：整数、浮点数、布尔值和字符。您可能会在其他编程语言中认识到这些类型。让我们深入了解它们在 Rust 中的工作原理。

#### [整数类型](https://doc.rust-lang.org/book/ch03-02-data-types.html#integer-types)

*整数*是没有小数部分的数字。在第 2 章中，我们使用了一个整数类型 `u32`。这个类型声明表示与它关联的值应该是一个无符号整数（有符号整数类型以 `i` 开头，而不是 `u`），占用 32 位空间。表 3-1 显示了 Rust 中的内置整数类型。我们可以使用这些变体中的任何一个来声明整数值的类型。

表 3-1：Rust 中的整数类型

| 长度     | 有符号  | 无符号  |
| -------- | ------- | ------- |
| 8 位     | `i8`    | `u8`    |
| 16 位    | `i16`   | `u16`   |
| 32 位    | `i32`   | `u32`   |
| 64 位    | `i64`   | `u64`   |
| 128 位   | `i128`  | `u128`  |
| 架构相关 | `isize` | `usize` |

每个变体都可以是有符号的或无符号的，并且具有明确的大小。*有符号*和*无符号*表示数字是否可以为负数，换句话说，数字是否需要带有符号（有符号）或者只能是正数，因此可以在没有符号的情况下表示（无符号）。就像在纸上写数字一样：当符号有关系时，数字会带有加号或减号；但是当可以假设数字为正数时，数字会显示没有符号。有符号数使用[二进制补码](https://en.wikipedia.org

/wiki/Two's_complement)表示。

每个有符号变体可以存储从 -(2^n - 1) 到 2^n - 1 - 1 的数字，其中 *n* 是该变体使用的位数。因此，`i8` 可以存储从 -(2^7) 到 2^7 - 1，等于 -128 到 127。无符号变体可以存储从 0 到 2^n - 1 的数字，因此 `u8` 可以存储从 0 到 2^8 - 1，等于 0 到 255。

另外，`isize` 和 `usize` 类型取决于程序运行的计算机架构，根据表格中的 “架构” 标识，如果您在 64 位计算机架构上运行，则为 64 位，如果您在 32 位计算机架构上运行，则为 32 位。

您可以以表 3-2 中所示的任何形式编写整数字面量。请注意，可用多种数字类型的数字字面量允许使用类型后缀，例如 `57u8`，以指定类型。数字字面量还可以使用 `_` 作为视觉分隔符，使数字更易于阅读，例如 `1_000`，它将具有与指定 `1000` 相同的值。

表 3-2：Rust 中的整数字面量

| 数字字面量       | 示例          |
| ---------------- | ------------- |
| 十进制           | `98_222`      |
| 十六进制         | `0xff`        |
| 八进制           | `0o77`        |
| 二进制           | `0b1111_0000` |
| 字节 (`u8` 类型) | `b'A'`        |

那么，如何知道使用哪种类型的整数？如果不确定，Rust 的默认值通常是一个不错的起点：整数类型默认为 `i32`。您将使用 `isize` 或 `usize` 的主要情况是在对某种类型的集合进行索引时。

> ##### [整数溢出](https://doc.rust-lang.org/book/ch03-02-data-types.html#integer-overflow)
>
> 假设您有一个类型为 `u8` 的变量，它可以保存 0 到 255 之间的值。如果您尝试将变量更改为超出该范围的值，例如 256，将会发生*整数溢出*，可能导致两种行为。当您在调试模式下编译时，Rust 包含整数溢出检查，如果发生此行为，程序会在运行时*崩溃*。当程序出现错误时，Rust 使用术语*panic*。我们将在第 9 章的[“使用 `panic!` 处理不可恢复的错误”](https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html)部分更详细地讨论 panic。

> 当您在使用 `--release` 标志进行发布模式编译时，Rust 不会包含整数溢出检查，不会因溢出而导致 panic。相反，如果发生溢出，Rust 会执行*二进制补码环绕*。简单地说，超过类型所能容纳的最大值的值将“环绕”到类型所能容纳的最小值。对于 `u8`，值 256 变为 0，值 257 变为 1，以此类推。程序不会 panic，但是变量将具有可能不是您期望的值。依赖整数溢出的环绕行为被视为错误。

> 要明确处理可能发生溢出的情况，您可以使用标准库为原始数值类型提供的以下方法系列：

> - 使用 `wrapping_*` 方法在所有模式下进行包装，例如 `wrapping_add`。
> - 使用 `checked_*` 方法，在溢出时返回 `None` 值。
> - 使用 `overflowing_*` 方法，在溢出时返回值和一个指示是否发生溢出的布尔值。
> - 使用 `saturating_*` 方法，将值饱和到值的最小或最大值。

#### [浮点数类型](https://doc.rust-lang.org/book/ch03-02-data-types.html#floating-point-types)

Rust 还有两种原始类型用于表示*浮点数*，即带小数点的数字。Rust 的浮点数类型分别为 `f32` 和 `f64`，它们的大小分别为 32 位和 64 位。默认类型为 `f64`，因为在现代 CPU 上，`f64` 的运算速度大致与 `f32` 相同，但精度更高。所有浮点数类型都是有符号的。

以下是一个展示浮点数的示例：

文件名：src/main.rs

```rust
fn main() {
    let x = 2.0; // f64

    let y: f32 = 3.0; // f32
}
```

浮点数按照 IEEE-754 标准表示。`f32` 类型是单精度浮点数，`f64` 类型是双精度浮点数。

#### [数值操作](https://doc.rust-lang.org/book/ch03-02-data-types.html#numeric-operations)

Rust 支持您期望的所有数值类型的基本数学运算：加法、减法、乘法、除法和求余。整数除法向零截断到最近的整数。下面的代码展示了如何在 `let` 语句中使用每个数值操作：

文件名：src/main.rs

```rust
fn main() {
    // 加法
    let sum = 5 + 10;

    // 减法
    let difference = 95.5 - 4.3;

    // 乘法
    let product = 4 * 30;

    // 除法
    let quotient = 56.7 / 32.2;
    let truncated = -5 / 3; // 结果为 -1

    // 求余
    let remainder = 43 % 5;
}
```

每个语句中的表达式使用数学运算符，并计算出一个单一的值，然后将其绑定到一个变量。[附录 B](https://doc.rust-lang.org/book/appendix-02-operators.html) 包含 Rust 提供的所有运算符的列表。

#### 布尔类型

ust-lang.org/book/ch03-02-data-types.html#the-boolean-type)

与大多数其他编程语言一样，Rust 中的布尔类型有两个可能的值：`true` 和 `false`。布尔类型占用一个字节的大小。在 Rust 中，使用 `bool` 来指定布尔类型。例如：

文件名：src/main.rs

```rust
fn main() {
    let t = true;

    let f: bool = false; // 使用显式类型注释
}
```

主要用于条件语句，如 `if` 表达式。我们将在[“控制流”](https://doc.rust-lang.org/book/ch03-05-control-flow.html#control-flow)部分中详细讨论 `if` 表达式的工作方式。

#### [字符类型](https://doc.rust-lang.org/book/ch03-02-data-types.html#the-character-type)

Rust 的 `char` 类型是语言中最原始的字母类型。下面是一些声明 `char` 值的示例：

文件名：src/main.rs

```rust
fn main() {
    let c = 'z';
    let z: char = 'ℤ'; // 使用显式类型注释
    let heart_eyed_cat = '😻';
}
```

请注意，我们使用单引号来指定 `char` 字面量，而字符串字面量使用双引号。Rust 的 `char` 类型占用 4 个字节，表示一个 Unicode 标量值，这意味着它不仅可以表示 ASCII，还可以表示更多内容。重音字母、中文、日文和韩文字符、表情符号以及零宽空格都是 Rust 中有效的 `char` 值。Unicode 标量值的范围从 `U+0000` 到 `U+D7FF` 和 `U+E000` 到 `U+10FFFF`，包括这些范围的值。然而，“字符”在 Unicode 中并不是真正的概念，因此您对“字符”的人类直觉可能与 Rust 中的 `char` 不匹配。我们将在第 8 章的[“使用字符串存储 UTF-8 编码的文本”](https://doc.rust-lang.org/book/ch08-02-strings.html#storing-utf-8-encoded-text-with-strings)部分详细讨论此主题。

### [复合类型](https://doc.rust-lang.org/book/ch03-02-data-types.html#compound-types)

*复合类型*可以将多个值组合为一个类型。Rust 有两种原始的复合类型：元组和数组。

#### [元组类型](https://doc.rust-lang.org/book/ch03-02-data-types.html#the-tuple-type)

*元组*是一种将多个值与各种类型组合成一个复合类型的通用方法。元组具有固定的长度：一旦声明，它们的大小无法增长或缩小。

我们通过在括号内写一个逗号分隔的值列表来创建元组。元组中的每个位置都有一个类型，元组中不同值的类型不必相同。我们在此示例中添加了可选的类型注释：

文件名：src/main.rs

```rust
fn main() {
    let tup: (i32, f64, u8) = (500, 6.4, 1);
}
```

变量 `tup` 绑定到整个元组，因为元组被视为单一的复合元素。要从元组中获取单个值，我们可以使用模式匹配来解构元组值，像这样：

文件名：src/main.rs

```rust
fn main() {
    let tup = (500, 6.4, 1);

    let (x, y, z) = tup;

    println!("The value of y is: {y}");
}
```

此程序首先创建一个元组，并将其绑定到变量 `tup`。然后使用带有 `let` 的模式来获取 `tup` 并将其拆分为三个单独的变量 `x`、`y` 和 `z`。这被称为*解构*，因为它将单个元组拆分成三个部分。最后，程序打印了变量

 `y` 的值，即 `6.4`。

我们还可以通过使用点（`.`）后跟要访问的值的索引来直接访问元组元素。例如：

文件名：src/main.rs

```rust
fn main() {
    let x: (i32, f64, u8) = (500, 6.4, 1);

    let five_hundred = x.0;

    let six_point_four = x.1;

    let one = x.2;
}
```

此程序创建元组 `x`，然后通过其各自的索引访问元组的每个元素。与大多数编程语言一样，元组的第一个索引是 0。

没有任何值的元组有一个特殊的名称——*unit*。该值及其相应的类型都写作 `()`，表示一个空值或空返回类型。如果表达式没有返回任何其他值，则隐式返回单位值。

#### [数组类型](https://doc.rust-lang.org/book/ch03-02-data-types.html#the-array-type)

另一种包含多个值的集合的方法是使用*数组*。与元组不同，数组的每个元素必须具有相同的类型。与其他语言中的数组不同，Rust 中的数组具有固定的长度。

我们将值写成以逗号分隔的数组形式，放在方括号内：

文件名：src/main.rs

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];
}
```

当您希望数据在栈上分配而不是堆上时，数组很有用（我们将在第 4 章的[“栈与堆”](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#the-stack-and-the-heap)中讨论栈和堆）。或者当您希望确保始终具有固定数量的元素时，数组也很有用。不过，数组不像向量类型那么灵活。向量是标准库提供的类似的集合类型，允许增长或缩小大小。如果您不确定是否应该使用数组还是向量，那么很可能应该使用向量。第 8 章中详细讨论了向量。

但是，当您知道元素数量不需要更改时，数组会更有用。例如，如果您在程序中使用月份的名称，可能会使用数组而不是向量，因为您知道它始终包含 12 个元素：

```rust
let months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"];
```

您可以使用方括号的类型注释来指定数组的类型，其格式为：方括号中包含每个元素的类型、一个分号，然后是数组中的元素数量，如下所示：

```rust
let a: [i32; 5] = [1, 2, 3, 4, 5];
```

在此例中，`i32` 是每个元素的类型。在分号之后，数字 `5` 表示数组包含五个元素。

您还可以初始化数组以使其包含每个元素相同的值。可以在初始值后面指定一个分号，然后是方括号中的数组长度，如下所示：

```rust
let a = [3; 5];
```

名为 `a` 的数组将包含 `5` 个元素，初始值都将设置为 `3`。这与编写 `let a = [3, 3, 3, 3, 3];` 的效果相同，但写法更简洁。

##### [访问数组元素](https://doc.rust-lang.org/book/ch03-02-data-types.html#accessing-array-elements)

数组是一个在栈上有已知固定大小的单个内存块。您可以使用索引来访问数组的元素，如下所示：

文件名：src/main.rs

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];

    let first = a[0];
    let second = a[1];
}
```

在此示例中，变量 `first` 将得到值 `1`，因为它是数组

中索引为 `[0]` 的位置的值。变量 `second` 将得到值 `2`，因为它是数组中索引为 `[1]` 的位置的值。

##### [无效的数组元素访问](https://doc.rust-lang.org/book/ch03-02-data-types.html#invalid-array-element-access)

让我们看看如果尝试访问数组的索引超出数组末尾会发生什么。假设您运行以下类似于第 2 章中猜数字游戏的代码来从用户获取数组索引：

文件名：src/main.rs

```rust
use std::io;

fn main() {
    let a = [1, 2, 3, 4, 5];

    println!("Please enter an array index.");

    let mut index = String::new();

    io::stdin()
        .read_line(&mut index)
        .expect("Failed to read line");

    let index: usize = index
        .trim()
        .parse()
        .expect("Index entered was not a number");

    let element = a[index];

    println!("The value of the element at index {index} is: {element}");
}
```

该代码成功编译。如果您使用 `cargo run` 运行此代码并输入 `0`、`1`、`2`、`3` 或 `4`，程序将打印出数组中相应索引处的值。如果您输入超出数组末尾的数字，例如 `10`，则会看到如下输出：

```console
thread 'main' panicked at 'index out of bounds: the len is 5 but the index is 10', src/main.rs:19:19
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

程序在使用无效值进行索引操作时产生了*运行时*错误。程序出现错误时会立即退出，并且不会执行最后的 `println!` 语句。当您尝试使用索引进行访问时，Rust 将检查您指定的索引是否小于数组长度。如果索引大于或等于长度，Rust 将 panic。在这种情况下，由于编译器无法预先知道用户运行代码时会输入什么值，因此必须在运行时进行此检查。

这是 Rust 内存安全原则的实际应用。在许多底层语言中，不进行这种检查，并且当您提供无效索引时，可能会访问无效内存。Rust 通过立即退出而不允许访问无效内存来保护您免受此类错误的影响。第 9 章中详细讨论了 Rust 的错误处理以及如何编写既不会 panic 也不允许访问无效内存的可读性强、安全的代码。