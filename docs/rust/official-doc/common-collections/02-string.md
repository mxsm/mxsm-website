---
title: "使用字符串存储UTF-8编码的文本"
sidebar_label: 8.2. 使用字符串存储UTF-8编码的文本
linkTitle: "使用字符串存储UTF-8编码的文本"
weight: 202308051736
description: 使用字符串存储UTF-8编码的文本
---

## [使用字符串存储UTF-8编码的文本](https://doc.rust-lang.org/book/ch08-02-strings.html#storing-utf-8-encoded-text-with-strings)

我们在第4章讨论了字符串，但现在我们将更深入地了解它们。初学 Rust 的程序员通常会因为以下三个原因而对字符串感到困惑：Rust 常常会暴露可能的错误，字符串是一种比许多程序员认为的更复杂的数据结构，还有 UTF-8。当你从其他编程语言转过来时，这些因素会结合在一起，使得学习使用字符串似乎很困难。

我们将在集合的上下文中讨论字符串，因为字符串被实现为一组字节，以及一些方法在将这些字节解释为文本时提供有用的功能。在本节中，我们将讨论 `String` 上的操作，这些操作是每个集合类型都具有的，比如创建、更新和读取。我们还将讨论 `String` 与其他集合的区别，即人们和计算机对 `String` 数据解释的差异，尤其是对 `String` 进行索引的复杂性。

### [什么是字符串？](https://doc.rust-lang.org/book/ch08-02-strings.html#what-is-a-string)

我们首先来定义我们所说的 *字符串* 是什么。Rust 在核心语言中只有一种字符串类型，即字符串切片 `str`，通常以其借用形式 `&str` 见诸人前。在第4章中，我们谈到了*字符串切片*，它们是对某个 UTF-8 编码的字符串数据的引用，存储在其他地方。例如，字符串字面值就存储在程序的二进制文件中，因此它们是字符串切片。

`String` 类型是由 Rust 标准库提供的，而不是编码到核心语言中的，它是一种可增长、可变、所有权的 UTF-8 编码的字符串类型。当 Rustaceans 在 Rust 中谈论“字符串”时，他们可能是指 `String` 或字符串切片 `&str` 类型，而不仅仅是其中一种类型。尽管本节主要讨论 `String`，但在 Rust 的标准库中，这两种类型都被广泛使用，并且 `String` 和字符串切片都是 UTF-8 编码的。

### [创建一个新的字符串](https://doc.rust-lang.org/book/ch08-02-strings.html#creating-a-new-string)

许多在 `Vec<T>` 上可用的操作在 `String` 上也同样可用，因为 `String` 实际上是围绕一组字节的向量封装，并带有一些额外的保证、限制和功能。创建一个实例的函数在 `Vec<T>` 和 `String` 上都可以工作，示例 8-11 显示了使用 `new` 函数创建一个新的空字符串。

```rust
let mut s = String::new();
```

示例 8-11：创建一个新的、空的 `String`

这一行创建了一个名为 `s` 的新空字符串，然后我们可以将数据加载到其中。通常，我们会有一些初始数据，我们想要用它来初始化字符串。为此，我们可以使用 `to_string` 方法，该方法在任何实现了 `Display` trait 的类型上都可用，就像字符串字面值一样。示例 8-12 展示了两个示例。

```rust
let data = "initial contents";

let s = data.to_string();

// 也可以直接使用字符串字面值：
let s = "initial contents".to_string();
```

示例 8-12：使用 `to_string` 方法从字符串字面值创建一个 `String`

这段代码创建了一个包含 `initial contents` 的字符串。

我们也可以使用函数 `String::from` 从字符串字面值创建一个 `String`。示例 8-13 中的代码与使用 `to_string` 的示例 8-12 中的代码是等价的。

```rust
let s = String::from("initial

 contents");
```

示例 8-13：使用 `String::from` 函数从字符串字面值创建一个 `String`

因为字符串用于许多不同的情况，我们可以使用许多不同的泛型 API 来处理字符串，这为我们提供了很多选择。有些看起来可能会显得多余，但它们都有其用武之地！在这种情况下，`String::from` 和 `to_string` 做的事情是一样的，所以选择哪个取决于风格和可读性。

请记住，字符串是 UTF-8 编码的，因此我们可以在其中包含任何正确编码的数据，就像示例 8-14 中所示的那样。

```rust
let hello = String::from("السلام عليكم");
let hello = String::from("Dobrý den");
let hello = String::from("Hello");
let hello = String::from("שָׁלוֹם");
let hello = String::from("नमस्ते");
let hello = String::from("こんにちは");
let hello = String::from("안녕하세요");
let hello = String::from("你好");
let hello = String::from("Olá");
let hello = String::from("Здравствуйте");
let hello = String::from("Hola");
```

示例 8-14：在字符串中存储不同语言的问候语

所有这些都是有效的 `String` 值。

### [更新字符串](https://doc.rust-lang.org/book/ch08-02-strings.html#updating-a-string)

`String` 可以增长大小，其内容也可以改变，就像 `Vec<T>` 的内容一样，如果您将更多数据推入其中。此外，您还可以方便地使用 `+` 运算符或 `format!` 宏将 `String` 值连接起来。

#### [使用 `push_str` 和 `push` 在字符串中添加内容](https://doc.rust-lang.org/book/ch08-02-strings.html#appending-to-a-string-with-push_str-and-push)

我们可以通过使用 `push_str` 方法来添加字符串切片，将其附加到 `String` 上，示例 8-15 显示了这一过程。

```rust
let mut s = String::from("foo");
s.push_str("bar");
```

示例 8-15：使用 `push_str` 方法将字符串切片附加到 `String`

执行这两行后，`s` 将包含 `foobar`。`push_str` 方法接受一个字符串切片，因为我们不一定要获取参数的所有权。例如，在示例 8-16 中的代码中，我们希望在将其内容附加到 `s1` 后仍然能使用 `s2`。

```rust
let mut s1 = String::from("foo");
let s2 = "bar";
s1.push_str(s2);
println!("s2 is {s2}");
```

示例 8-16：在将其内容附加到 `String` 之后使用字符串切片

如果 `push_str` 方法获取了 `s2` 的所有权，我们将无法在最后一行打印其值。然而，这段代码的运行结果是我们所期望的！

`push` 方法接受一个字符作为参数，并将其添加到 `String` 中。示例 8-17 使用 `push` 方法将字母“l”添加到 `String` 中。

```rust
let mut s = String::from("lo");
s.push('l');
```

示例 8-17：使用 `push` 方法将一个字符添加到 `String` 中的值

结果，`s` 将包含 `lol`。

#### [使用 `+` 运算符或 `format!` 宏连接字符串](https://doc.rust-lang.org/book/ch08-02-strings.html#concatenation-with-the--operator-or-the-format-macro)

通常，您可能希望将两个现有的字符串组合起来。一种方法是使用 `+` 运算符，如示例 8-18 所示。

```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // 注意 s1 在这里被移动并且不能再使用
```

示例 8-18：使用 `+` 运算符将两个 `String` 值连接成一个新的 `String` 值

字符串 `s3` 将包含 `Hello, world!`。之所以 `s1` 在添加之后无效，以及为什么我们使用 `s2` 的引用，与使用 `+` 运算符时调用的方法的签名有关。`+` 运算符使用 `add` 方法，其签名如下所示：

```rust
fn add(self, s: &str) -> String {
```

在标准库中，您会看到 `add` 使用泛型和关联类型定义。在这里，我们使用了具体类型，这是在用 `String` 值调用此方法时发生的情况。我们将在第10章中讨论泛型。这个签名给了我们需要了解 `+` 运算符的一些技巧。

首先，`s2` 有一个 `&`，这意味着我们正在将第二个字符串的 *引用* 添加到第一个字符串中。这是由于 `add` 函数中的 `s` 参数：我们只能将 `&str` 添加到 `String` 中，而不能

将两个 `String` 值相加。但是等等——`&s2` 的类型是 `&String`，而不是在 `add` 的第二个参数中指定的 `&str`。那么为什么示例 8-18 会编译通过呢？

我们之所以能在调用 `add` 时使用 `&s2`，是因为编译器可以将 `&String` 参数强制转换为 `&str`。当我们调用 `add` 方法时，Rust 使用 *解引用强制转换*（deref coercion），这里将 `&s2` 转换为 `&s2[..]`。我们将在第15章中更详细地讨论解引用强制转换。由于 `add` 不会获取 `s` 参数的所有权，因此该操作之后 `s2` 仍然是一个有效的 `String`。

其次，我们可以在签名中看到，`add` 获取 `self` 的所有权，因为 `self` 没有 `&`。这意味着示例 8-18 中的 `s1` 将在 `add` 调用中被移动，并在此之后不再有效。因此，虽然 `let s3 = s1 + &s2;` 看起来像是复制了两个字符串并创建了一个新的字符串，但实际上，此语句实际上获取了 `s1` 的所有权，附加了 `s2` 内容的副本，然后返回了结果的所有权。换句话说，它看起来像是在进行大量复制，但实际上并非如此；实现比复制更高效。

如果我们需要连接多个字符串，`+` 运算符的行为就变得不太方便了：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = s1 + "-" + &s2 + "-" + &s3;
```

此时，`s` 将是 `tic-tac-toe`。由于其中包含大量的 `+` 和 `"` 字符，很难看出发生了什么。对于更复杂的字符串组合，我们可以使用 `format!` 宏：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{s1}-{s2}-{s3}");
```

这段代码也将 `s` 设置为 `tic-tac-toe`。`format!` 宏的工作方式类似于 `println!`，但不是将输出打印到屏幕，而是返回包含内容的 `String`。使用 `format!` 宏的版本更容易阅读，并且由 `format!` 宏生成的代码使用引用，因此这次调用不会获取其任何参数的所有权。

### [字符串的索引](https://doc.rust-lang.org/book/ch08-02-strings.html#indexing-into-strings)

在许多其他编程语言中，通过索引引用字符串中的单个字符是一种有效且常见的操作。然而，在 Rust 中，如果您尝试使用索引语法来访问 `String` 的部分内容，将会出现错误。考虑无效代码示例 8-19。

```rust
let s1 = String::from("hello");
let h = s1[0];
```

示例 8-19：尝试使用索引语法访问字符串

这段代码将导致以下错误：

```console
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
error[E0277]: the type `String` cannot be indexed by `{integer}`
 --> src/main.rs:3:13
  |
3 |     let h = s1[0];
  |             ^^^^^ `String` cannot be indexed by `{integer}`
  |
  = help: the trait `Index<{integer}>` is not implemented for `String`
  = help: the following other types implement trait `Index<Idx>`:
            <String as Index<RangeFrom<usize>>>
            <String as Index<RangeFull>>
            <String as Index<RangeInclusive<usize>>>
            <String as Index<RangeTo<usize>>>
            <String as Index<RangeToInclusive<usize>>>
            <String as Index<std::ops::Range<usize>>>

For more information about this error, try `rustc --explain E0277`.
error: could not compile `collections` due to previous error
```

错误和提示表明了问题：Rust 的字符串不支持索引。但是为什么呢？为了回答这个问题，我们需要讨论 Rust 如何在内存中存储字符串。

#### [内部表示](https://doc.rust-lang.org/book/ch08-02-strings.html#internal-representation)

`String` 是 `Vec<u8>` 的包装器。让我们看一下来自示例 8-14 的一些正确编码的 UTF-8 示例字符串。首先是这个：

```rust
let hello = String::from("Hola");
```

在这种情况下，`len` 将是 4，这意味着存储字符串“Hola”的向量长度为 4 字节。这些字母在 UTF-8 编码时每个占用 1 字节。然而，下面的代码可能会让您感到意外。注意，这个字符串以大写的西里尔字母 Ze 开头，而不是阿拉伯数字 3。

```rust
let hello = String::from("Здравствуйте");
```

当问你这个字符串的长度时，您可能会说是 12。实际上，Rust 的答案是 24：这是“Здравствуйте”在 UTF-8 编码中所占用的字节数，因为该字符串中的每个 Unicode 标量值占用 2 个字节的存储空间。因此，通过索引访问字符串的字节不总是对应有效的 Unicode 标量值。为了证明这一点，考虑这个无效的 Rust 代码：

```rust
let hello

 = "Здравствуйте";

let answer = &hello[0];
```

代码尝试获取 `hello` 的第一个字节并将其存储在变量 `answer` 中。如果字符串以 ASCII 字母开始，则会运行得很好，因为每个字节都对应于一个有效的 Unicode 标量值，这也是字符串的目标读取单位。但是对于多字节字符，如上例中的西里尔字母 Ze，访问单个字节会导致不正确的内容，因为它只是该字符中的一部分。Rust 不允许这样的操作，因为它会造成无效的数据。

因此，在 Rust 中，不允许通过索引获取字符串内容，因为这可能会导致无效的 Unicode 标量值。那么如何获取字符串的一部分内容呢？

#### [切片字符串](https://doc.rust-lang.org/book/ch08-02-strings.html#slicing-strings)

如果我们需要获取字符串的一部分内容，我们可以使用 *切片*（slicing）操作来实现。示例 8-20 展示了一个获取字符串切片的示例。

```rust
let hello = "Здравствуйте";

let s = &hello[0..4];
```

示例 8-20：获取字符串切片

这个示例中的切片 `&hello[0..4]` 获取了 `hello` 的前四个字节。请注意，这并不一定等于四个字符，因为我们使用了 UTF-8 编码。在这种情况下，我们将得到包含三个字母“З”和一个半个字母“д”的字符串切片。也就是说，我们获取了 `hello` 中索引 0 到 4 之前的部分。结果字符串切片的值将是“Зд”，而其字节长度为 4。

需要注意的一点是，`&hello[0..4]` 的写法可以简化为 `&hello[..4]`。如果切片从字符串的开头开始，则可以省略 0。示例 8-21 展示了等效的代码。

```rust
let hello = "Здравствуйте";

let s = &hello[..4];
```

示例 8-21：使用简化的切片写法

同样，我们还可以获取字符串的一部分结尾。示例 8-22 展示了获取 `hello` 的最后两个字节的代码。

```rust
let hello = "Здравствуйте";

let s = &hello[17..];
```

示例 8-22：获取字符串切片的结尾

此代码获取 `hello` 中索引 17 之后的所有内容。结果字符串切片将包含两个字节，它们是半个字符“е”和字符“т”。

请注意，如果切片的起始和结束位置超出了有效的索引范围，Rust 将会 panic！让我们看看示例 8-23 中的代码。

```rust
let hello = "Здравствуйте";

let s = &hello[0..1];
```

示例 8-23：尝试获取超出索引范围的字符串切片

这段代码将产生如下 panic：

```console
thread 'main' panicked at 'byte index 1 is not a char boundary; it is inside 'З' (bytes 0..2) of `Здравствуйте`', src/main.rs:3:17
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

由于字符“З”占用了两个字节，所以 `&hello[0..1]` 尝试在字符“З”的中间进行切片，因此 Rust 认为这是无效的。

需要谨记的是，在使用切片时，请确保始终在有效的 Unicode 标量值边界进行切片，以免出现无效数据。因此，最好只在处理 ASCII 字符时使用索引，并在处理 Unicode 字符时使用切片。

### [字符串方法](https://doc.rust-lang.org/book/ch08-02-strings.html#methods-for-strings)

Rust 的标准库提供了许多有用的方法，用于操作 `String` 和 `&str` 值。这里有一些常用的方法：

- `len` 方法返回 `String` 中字节的长度，而不是字符的数量。
- `is_empty` 方法检查字符串是否为空。
- `contains` 方法检查字符串是否包含特定的子字符串。
- `replace` 方法替换字符串中的部分内容。
- `split` 方法将字符串拆分为子字符串。
- `trim` 方法去除字符串前后的空白字符。

在进行字符串处理时，建议查阅 Rust 标准库文档，以查找适合您需求的方法。这些方法会让您的代码更清晰，更易于维护。

### [使用 `for` 循环遍历字符串](https://doc.rust-lang.org/book/ch08-02-strings.html#using-for-loops-with-strings)

可以使用 `for` 循环遍历字符串的字符。由于字符串是 UTF-8 编码的，每个字符不一定占用一个字节。因此，`for` 循环将按照 Unicode 标量值的方式遍历字符串中的字符。示例 8-24 展示了如何使用 `for` 循环遍历字符串中的字符。

```rust
for c in "नमस्ते".chars() {
    println!("{}", c);
}
```

示例 8-24：使用 `for` 循环遍历字符串的字符

执行这段代码将输出：

```console
न
म
स
्
त
े
```

您可以看到，字符串被正确地拆分为了单个字符。请注意，字符“स”是在两个字节上表示的（'स' 和 '्'），这是 UTF-8 编码的一部分。因此，我们可以正确地遍历字符串并对每个字符执行操作。

### [使用 `bytes` 方法遍历字节](https://doc.rust-lang.org/book/ch

08-02-strings.html#iterating-over-bytes)

如果您希望以字节为单位而不是以字符为单位遍历字符串，可以使用 `bytes` 方法。`bytes` 方法返回一个迭代器，它产生字符串的每个字节。示例 8-25 展示了如何使用 `bytes` 方法。

```rust
for b in "नमस्ते".bytes() {
    println!("{}", b);
}
```

示例 8-25：使用 `bytes` 方法遍历字符串的字节

这段代码的输出将是：

```console
224
164
168
224
164
174
224
164
184
224
165
141
224
164
164
```

每个输出都是字符串中的一个字节，这些字节代表 Unicode 标量值的一部分。

### [使用 `chars` 和 `bytes` 方法的区别](https://doc.rust-lang.org/book/ch08-02-strings.html#differences-between-chars-and-bytes-methods)

使用 `chars` 方法或 `bytes` 方法进行遍历的选择取决于您希望以字符还是以字节为单位处理字符串。一般来说，如果您需要处理字符内容（例如，对字符进行计数或查找），则使用 `chars` 方法是更好的选择。如果您需要处理字节级别的内容（例如，对字节进行计数或查找特定的字节值），则使用 `bytes` 方法是更合适的。

在 Rust 中处理字符串时，请牢记字符串是 UTF-8 编码的，并且每个字符不一定占用一个字节。这种编码方式确保了 Rust 中的字符串处理是安全且高效的，但也需要更多的注意。请在处理字符串时仔细选择遍历方法，以确保您的代码正确处理 Unicode 字符。

### [字符串切片](https://doc.rust-lang.org/book/ch08-02-strings.html#string-slices)

回顾一下，在字符串切片一节中，我们使用了如下代码：

```rust
let hello = "Здравствуйте";
let s = &hello[0..4];
```

尝试运行这段代码时，Rust 可能会在代码中的数字中看到任意 Unicode 字符的中间，并在运行时崩溃。让我们仔细看看为什么。

Rust 使用 UTF-8 编码存储字符串，而每个索引值都对应于字符串中的字节。但是，在切片中我们不应该只使用任意字节来获取子字符串，因为这可能会在 UTF-8 编码的字符串中返回无效的数据。我们只能在有效的 Unicode 标量值边界上进行切片。

那么，为什么 Rust 在编译时不检查这些索引呢？在其他编程语言中，这样的错误通常在编译时就能发现。Rust 更倾向于强调性能，并希望避免任何在运行时导致开销的操作。在字符串切片中添加运行时索引检查会导致性能下降。因此，Rust 在运行时提供了更多的灵活性，并将索引检查留给开发人员。这意味着，使用切片时，开发人员需要保证它们的代码正确处理 Unicode 字符，以避免潜在的问题。

## 总结

本节讨论了 Rust 中字符串类型 `String` 和字符串切片 `&str`，以及它们之间的区别。`String` 是可变的、堆分配的字符串类型，`&str` 是不可变的、常量字符串切片。字符串是 UTF-8 编码的，因此在处理字符串时需要注意索引和切片的操作，以确保正确处理 Unicode 字符。

您已经学会了：

- 如何创建和修改 `String`。
- 如何使用字符串切片 `&str` 和操作来处理字符串。
- 如何使用 `for` 循环遍历字符串的字符和字节。
- 在处理字符串时要注意 Unicode 字符的编码和索引。

字符串处理是任何编程语言中常见的任务。Rust 提供了灵活且高效的字符串处理方式，确保您的代码在处理字符串时既安全又高效。请始终牢记字符串是 UTF-8 编码的，并正确使用索引和切片来处理字符串内容。