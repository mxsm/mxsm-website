---
title: "切片类型"
sidebar_label: "4.3. 切片类型"
linkTitle: "切片类型"
weight: 202308051736
description: 切片类型
---



## [切片类型](https://doc.rust-lang.org/book/ch04-03-slices.html#the-slice-type)

*切片（Slices）* 允许你引用集合中连续的一段元素，而不是整个集合。切片是引用的一种，因此它没有所有权。

这里有一个简单的编程问题：编写一个函数，该函数接受一个由空格分隔的单词组成的字符串，并返回在该字符串中找到的第一个单词。如果函数在字符串中找不到空格，说明整个字符串是一个单词，所以应该返回整个字符串。

让我们首先不使用切片来写出这个函数的签名，以理解切片解决的问题：

```rust
fn first_word(s: &String) -> ?
```

`first_word` 函数的参数是一个 `&String`。我们不想获取所有权，所以这是可以的。但是我们应该返回什么呢？我们没有办法直接讨论字符串的*一部分*。然而，我们可以返回第一个单词的结束索引，由空格来表示。让我们试试这样做，如代码清单 4-7 所示。

文件名：src/main.rs

```rust
fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        }
    }

    s.len()
}
```

代码清单 4-7：`first_word` 函数返回 `String` 参数的字节索引值

由于我们需要逐个检查 `String` 的元素，并检查其是否为空格，我们将使用 `as_bytes` 方法将 `String` 转换为字节数组。

```rust
let bytes = s.as_bytes();
```

接下来，我们使用 `iter` 方法在字节数组上创建一个迭代器：

```rust
for (i, &item) in bytes.iter().enumerate() {
```

我们将在 [第 13 章](https://doc.rust-lang.org/book/ch13-02-iterators.html) 中更详细地讨论迭代器。现在，只需要知道 `iter` 是一个方法，它返回集合中的每个元素，并且 `enumerate` 包装 `iter` 的结果，将每个元素作为元组的一部分返回。从 `enumerate` 返回的元组的第一个元素是索引，第二个元素是元素的引用。这比我们自己计算索引要方便一些。

由于 `enumerate` 方法返回一个元组，我们可以使用模式（patterns）来解构该元组。在 `for` 循环中，我们指定一个模式，其中 `i` 是元组中的索引，`&item` 是元组中的单个字节。因为我们从 `.iter().enumerate()` 获取了对元素的引用，所以在模式中使用了 `&`。

在 `for` 循环内部，我们使用字节文字的语法来搜索表示空格的字节。如果找到了空格，我们返回该位置。否则，我们使用 `s.len()` 返回字符串的长度。

```rust
if item == b' ' {
    return i;
}
```

我们现在有一种方法来找到字符串中第一个单词的结束索引，但有一个问题。我们返回了一个独立的 `usize`，但它只在 `&String` 的上下文中有意义。换句话说，因为它与 `String` 是一个独立的值，所以不能保证它在将来仍然有效。考虑代码清单 4-8 中使用代码清单 4-7 中的 `first_word` 函数的程序。

文件名：src/main.rs

```rust
fn main() {
    let mut s = String::from("hello world");

    let word = first_word(&s); // word 将获得值 5

    s.clear(); // 这将清空 String，使它变为空字符串 ""

    // 这里 word 仍然是 5，但是现在没有字符串可以使用值 5 了。
    // word 现在是完全无效的！
}
```

代码清单 4-8：调用 `first_word` 函数并更改 `String` 内容后存储结果

这个程序可以成功编译，即使在调用 `s.clear()` 后使用了 `word`。因为 `word` 完全没有与 `s` 的状态相关联，`word` 仍然包含值 `5`。我们可以尝试使用值 `5` 与变量 `s` 提取第一个单词，但这是一个错误，因为自从我们在 `word` 中保存了 `5` 以来，`s` 的内容已经改变了。

必须担心 `word` 中的索引与 `s` 中的数据不同步是很麻烦且容易出错的！如果我们编写一个 `second_word` 函数，管理这些索引会更加脆弱。它的签名将是这样的：

```rust
fn second_word(s: &String) -> (usize, usize) {
```

现在我们正在跟踪起始 *和* 结束索引，我们有了更多基于特定状态计算的值，但与该状态无关。我们有三个无关的浮动变量，需要保持同步。

幸运的是，Rust 提供了解决这个问题的方法：字符串切片。

### [字符串切片](https://doc.rust-lang.org/book/ch04-03-slices.html#string-slices)

*字符串切片* 是对 `String` 的一部分的引用，它的写法如下：

```rust
let s = String::from("hello world");

let hello = &s[0..5];
let world = &s[6..11];
```

与对整个 `String` 的引用不同，`hello` 是对 `String` 一部分的引用，该部分在额外的 `[0..5]` 中指定。我们使用方括号内的范围创建切

片，通过指定 `[starting_index..ending_index]`，其中 `starting_index` 是切片的起始位置，`ending_index` 是切片的最后一个位置的后一个位置。在内部，切片数据结构存储了切片的起始位置和长度，该长度等于 `ending_index` 减去 `starting_index`。因此，在 `let world = &s[6..11];` 的情况下，`world` 是一个包含指向 `s` 的索引为 6 的字节的指针，并具有长度值 `5` 的切片。

图 4-6 在图示中展示了这一点。

![三个表：表示 s 的堆栈数据的表，它指向堆上字符串数据 “hello world” 中索引 0 的字节的表。第三个表表示切片 world 的堆栈数据，其长度值为 5，指向堆数据表中索引 6 的字节。](https://doc.rust-lang.org/book/img/trpl04-06.svg)

图 4-6：字符串切片引用了 `String` 的一部分

通过 Rust 的 `..` 范围语法，如果你想从索引 0 开始，可以省略两个点之前的值。换句话说，下面两种写法是等价的：

```rust
let s = String::from("hello");

let slice = &s[0..2];
let slice = &s[..2];
```

同理，如果你的切片包含 `String` 的最后一个字节，你可以省略尾部的数字。这意味着下面两种写法是等价的：

```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[3..len];
let slice = &s[3..];
```

你还可以同时省略两个值，以获取整个字符串的切片。因此，下面两种写法是等价的：

```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[0..len];
let slice = &s[..];
```

> 注意：字符串切片的范围索引必须位于有效的 UTF-8 字符边界上。如果尝试在多字节字符的中间创建字符串切片，程序将以错误退出。为了介绍字符串切片，本节假设仅使用 ASCII。有关 UTF-8 处理的更全面讨论，请参阅第 8 章中的 [“使用字符串存储 UTF-8 编码的文本”](https://doc.rust-lang.org/book/ch08-02-strings.html#storing-utf-8-encoded-text-with-strings) 部分。

有了所有这些信息，让我们将 `first_word` 重写为返回切片。表示“字符串切片”的类型写作 `&str`：

文件名：src/main.rs

```rust
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

我们以与代码清单 4-7 中相同的方式获取了找到第一个空格后的单词的结束索引，方法是查找第一个空格的位置。当找到空格时，我们返回一个字符串切片，使用字符串的起始点和空格的索引作为起始和结束索引。

现在，当我们调用 `first_word` 时，我们得到一个与基础数据相关联的单个值。该值由切片的起始点引用和切片中元素的数量组成。

返回切片对于 `second_word` 函数也有效：

```rust
fn second_word(s: &String) -> &str {
```

我们现在有了一个简单的 API，很难出错，因为编译器将确保对 `String` 的引用保持有效。回想一下代码清单 4-8 中的程序，在获得第一个单词的结束索引后，我们清空了字符串，因此索引无效。逻辑上，那段代码是错误的，但没有立即显示出错误。如果我们继续尝试使用 `s` 中的第一个单词索引，问题将在以后的使用中出现。切片使这个错误变得不可能，并且让我们更早地发现了代码中的问题。使用切片版本的 `first_word` 将在编译时引发错误：

文件名：src/main.rs

```rust
fn main() {
    let mut s = String::from("hello world");

    let word = first_word(&s);

    s.clear(); // 错误！

    println!("the first word is: {}", word);
}
```

这里是编译器的错误信息：

```console
$ cargo run
   Compiling ownership v0.1.0 (file:///projects/ownership)
error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
  --> src/main.rs:18:5
   |
16 |     let word = first_word(&s);
   |                           -- immutable borrow occurs here
17 |
18 |     s.clear(); // 错误！
   |     ^^^^^^^^^ mutable borrow occurs here
19 |
20 |     println!("the first word is: {}", word);
   |                                       ---- immutable borrow later used here

For more information about this error, try `rustc --explain E0502`.
error: could not compile `ownership` due to previous error
```

从借用规则中我们知道，如果我们对某物有一个不可变的引用，我们不能同时获取可变的引用。因为 `clear` 需要截断 `String`，它需要获取一个可变的引用。在调用 `clear` 后，`println!` 使用了 `word` 中的引用，因此不可变引用必须仍然存在。Rust 不允许同时存在 `clear` 中的可变引用和 `word` 中的不可变引用，因此编译失败。Rust 使得我们的 API 更易于使用，并在编译时消除了一整类错误！

#### [字符串字面值作为切片](https://doc.rust-lang.org/book/ch04-03-slices.html#string-literals-as-slices)

回顾一下我们讨论过的字符串字面值是存储在二进制文件中的。现在我们了解了切片，我们可以正确理解字符串字面值：

```rust
let s = "Hello, world!";
```

`s` 的类型在这里是 `&str`，它是指向二进制文件中特定位置的切片。这也是为什么字符串字面值是不可变的；`&str` 是一个不可变的引用。

#### [将字符串切片作为参数](https://doc.rust-lang.org/book/ch04-03-slices.html#string-slices-as-parameters)

知道你可以从字面值和 `String` 值中取出切片，让我们对 `first_word` 做进一步改进，使其签名如下所示：

```rust
fn first_word(s: &str) -> &str {
```

一个经验丰富的 Rust 程序员将改用代码清单 4-9 中所示的签名，因为它允许我们在 `&String` 值和 `&str` 值上使用相同的函数。

```rust
fn first_word(s: &str) -> &str {
```

代码清单 4-9：通过使用字符串切片作为 `s` 参数的类型来改进 `first_word` 函数

如果我们有一个字符串切片，我们可以直接传递它。如果我们有一个 `String`，我们可以传递 `String` 的切片或对 `String` 的引用。这种灵活性利用了*解引用强制转换*（deref coercions），我们将在第 15 章的 [“使用函数和方法进行隐式解引用强制转换”](https://doc.rust-lang.org/book/ch15-02-deref.html#implicit-deref-coercions-with-functions-and-methods) 部分中介绍。

使用字符串切片而不是对 `String` 的引用来定义函数会使得我们的 API 更加通用和有用，同时又不会失去任何功能：

文件名：src/main.rs

```rust
fn main() {
    let my_string = String::from("hello world");

    // `first_word` 可以用于 `String` 的切片，无论部分还是全部
    let word = first_word(&my_string[0..6]);
    let word = first_word(&my_string[..]);
    // `first_word` 也可以用于对 `String` 的引用，它们是等价的
    let word = first_word(&my_string);

    let my_string_literal = "hello world";

    // `first_word` 可以用于字符串字面值的切片，无论部分还是全部
    let word = first_word(&my_string_literal[0..6]);
    let word = first_word(&my_string_literal[..]);

    // 由于字符串字面值本身就是字符串切片，
    // 这样也是可以的，无需使用切片语法！
    let word = first_word(my_string_literal);
}
```

### [其他切片](https://doc.rust-lang.org/book/ch04-03-slices.html#other-slices)

如你所想象的那样，字符串切片是特定于字符串的。但是还有一个更通用的切片类型。考虑以下数组：

```rust
let a = [1, 2, 3, 4, 5];
```

正如我们可能想要引用字符串的一部分，我们可能也想要引用数组的一部分。我们可以这样做：

```rust
let a = [1, 2, 3, 4, 5];

let slice = &a[1..3];

assert_eq!(slice, &[2, 3]);
```

这个切片的类型是 `&[i32]`。它的工作方式与字符串切片相同，通过存储对第一个元素的引用和长度来实现。当处理其他类型的集合时，你将使用这种切片。在第 8 章中，我们将详细讨论这些集合，特别是向量（vectors）。

## [总结](https://doc.rust-lang.org/book/ch04-03-slices.html#summary)

所有权、借用和切片的概念确保了 Rust 程序在编译时的内存安全。Rust 语言使你能够像其他系统编程语言一样控制内存使用，但是当所有者超出作用域时，所有者自动清理该数据，意味着你不必写和调试额外的代码来获得这种控制。

所有权影响了 Rust 中的许多其他部分，因此我们将在本书的其余部分更进一步地讨论这些概念。现在我们继续进入第 5 章，讨论如何在一个 `struct` 中将数据片段组合在一起。