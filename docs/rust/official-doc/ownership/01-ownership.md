---
title: "什么是所有权"
linkTitle: "什么是所有权"
sidebar_label: 4.1. 什么是所有权
weight: 202308051736
description: 什么是所有权
---

## 什么是所有权？

*所有权*是一组规则，用于管理Rust程序如何管理内存。所有程序在运行时都必须管理它们使用计算机内存的方式。有些语言具有垃圾回收，它们在程序运行时定期寻找不再使用的内存；而在其他语言中，程序员必须显式地分配和释放内存。Rust采用了第三种方法：通过一套编译器检查的所有权系统来管理内存。如果违反了其中的任何规则，程序将无法编译。所有权的任何特性在程序运行时都不会减慢程序的速度。

由于所有权对于许多程序员来说是一个新概念，需要一些时间来适应。好消息是，你越是熟悉Rust和所有权系统的规则，你就越容易自然地开发出安全和高效的代码。坚持下去！

当你理解了所有权，你就会对理解使Rust独特的特性有一个坚实的基础。在本章中，你将通过一些示例来学习所有权，重点放在一个非常常见的数据结构上：字符串。

> ### [栈和堆](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#the-stack-and-the-heap)
>
> 许多编程语言不需要经常考虑栈和堆。但在像Rust这样的系统编程语言中，一个值是在栈上还是堆上存储，会影响语言的行为以及为什么你必须做出某些决策。所有权的某些部分将在本章后面与栈和堆相关的内容中进行描述，因此在这里进行简要解释以做准备。
>
> 栈和堆都是程序在运行时可以使用的内存部分，但它们的结构方式不同。栈按照它们得到值的顺序存储值，并以相反的顺序删除值。这被称为*后进先出*。想象一下一堆盘子：当你添加更多的盘子时，你将它们放在堆的顶部，当你需要一个盘子时，你从顶部取出一个。在堆栈上添加或删除数据被称为*推送到栈上*或*从栈上弹出*。在栈上存储的所有数据必须具有已知的固定大小。大小在编译时未知或可能更改的数据必须存储在堆上。
>
> 堆不是那么有组织：当你将数据放入堆时，你请求一定数量的空间。内存分配器找到一个足够大的空闲位置，将其标记为正在使用，并返回一个*指针*，即该位置的地址。这个过程被称为*在堆上分配*，有时缩写为只是*分配*（在堆上推送值不被视为分配）。由于堆上指针是已知的固定大小，因此你可以将指针存储在栈上，但当你需要实际数据时，你必须遵循指针。想象自己坐在餐厅里。当你进入时，你告诉主持人你的小组人数，主持人找到一个足够大的空桌，并带你过去。如果你的小组中有人迟到，他们可以问你坐在哪里找到你。
>
> 与在堆上分配相比，在栈上进行推送更快，因为内存分配器无需搜索存储新数据的位置；该位置总是在栈的顶部。相比之下，在堆上分配空间需要更多的工作，因为内存分配器必须首先找到足够大的空间来容纳数据，然后执行簿记以为下次分配做准备。
>
> 访问堆中的数据比访问栈上的数据更慢，因为你必须遵循指针才能到达那里。如果处理器在内存中跳来跳去，它就会更快。继续这个类比，考虑一位服务员从许多桌子上收集订单。在处理多个桌子的订单之前，集中处理一张桌子上的所有订单是最高效的。从A桌收取订单，然后从B桌收取订单，然后再从A桌收取订单，最后再从B桌收取订单会导致速度更慢。同样地，如果处理器在栈上的数据附近工作，而不是在堆上的数据附近，它的工作效率会更高。
>
> 当你的代码调用一个函数时，传递给函数的值（包括可能在堆上的数据的指针）以及函数的局部变量都被推送到栈上。当函数结束时，这些值将从栈上弹出。
>
> 跟踪哪些代码部分在使用堆上的哪些数据，最小化堆上的重复数据量，并清理不再使用的堆上数据，以便不会用尽空间，这些都是所有权解决的问题。一旦你理解了所有权，你就不需要经常考虑栈和堆，但是知道所有权的主要目的是管理堆数据可以帮助解释它为什么以这种方式工作。

Ownership 是 Rust 中的一个核心概念，它定义了如何管理内存和变量的生命周期。以下是 Ownership 的规则：

1. Rust 中的每个值都有一个所有者（owner）。
2. 同一时间内，一个值只能有一个所有者。
3. 当所有者（owner）超出作用域时，这个值将会被 dropped（释放）。

对于变量的作用域，它指的是一个变量在程序中有效的范围。例如，对于以下代码：

```rust
let s = "hello";
```

变量 `s` 引用了一个字符串字面量，其中字符串的值硬编码在程序的文本中。该变量的有效范围从它声明的位置开始一直持续到当前 *scope* 结束。以下是对变量 `s` 的有效范围进行注释标记的示例：

```rust
    {                      // 此处 s 无效，尚未声明
        let s = "hello";   // 从此处起，s 是有效的

        // 使用 s 进行操作
    }                      // 此作用域结束，s 不再有效
```

换句话说，以下是重要的时间点：

- 当 `s` 进入 *scope* 时，它是有效的。
- 它一直有效，直到它超出 *scope*。

目前，作用域和变量有效的时间关系与其他编程语言中的类似。接下来，我们将通过引入 `String` 类型来加深对 Ownership 的理解。

在 Rust 中，为了说明 Ownership 规则，我们需要一个比前面章节涉及的数据类型更复杂的数据类型。前面提到的数据类型都是已知大小的，可以存储在栈上，并在其 *scope* 结束时弹出栈，如果代码的其他部分需要在不同的 *scope* 中使用相同的值，可以进行快速且轻松的复制。但是，我们希望看到存储在堆上的数据，并探索 Rust 如何知道何时清理这些数据。`String` 类型就是一个很好的例子。

我们将重点关注与所有权相关的 `String` 部分。这些方面也适用于其他复杂的数据类型，无论是标准库提供的还是由您自己创建的。有关更深入的 `String` 详细信息，请参阅第 8 章。

我们已经见过字符串字面量，其中字符串的值硬编码在我们的程序中。字符串字面量很方便，但并不适用于每种情况，因为它们是不可变的。而且，并非每个字符串值在编写代码时都是已知的，例如，如果我们想要接受用户输入并存储它，我们就不能使用字符串字面量。为了应对这些情况，Rust 提供了第二种字符串类型 `String`，它管理在堆上分配的数据，因此能够存储在编译时未知的文本量。您可以使用 `from` 函数将字符串字面量转换为 `String` 类型，如下所示：

```rust
let s = String::from("hello");
```

双冒号 `::` 运算符允许我们将特定的 `from` 函数命名空间化为 `String` 类型，而不是使用诸如 `string_from` 等名称。我们将在第 5 章的 [“Method Syntax”](https://doc.rust-lang.org/book/ch05-03-method-syntax.html#method-syntax) 中更深入地讨论这个语法，以及在第 7 章的 [“Paths for Referring to an Item in the Module Tree”](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html) 中讨论使用模块进行命名空间化。

与字符串字面量不同，`String` 类型是可

变的：

```rust
    let mut s = String::from("hello");

    s.push_str(", world!"); // push_str() 将一个字符串字面量附加到 String

    println!("{}", s); // 这将打印 `hello, world!`
```

那么，这里有什么区别呢？为什么 `String` 可以被修改，而字符串字面量则不能？区别在于这两种类型处理内存的方式。

### 内存与分配

对于字符串字面值，在编译时我们已经知道了内容，所以文本直接硬编码进了最终的可执行文件中。这就是为什么字符串字面值快速高效的原因。但是这些特性只有在字符串字面值是不可变的情况下才成立。不幸的是，对于那些大小在编译时未知且在程序运行时可能发生变化的文本片段，我们无法在二进制文件中为每个文本片段分配内存空间。

而对于 `String` 类型，为了支持可变且可以扩展的文本内容，我们需要在堆上分配一块未知大小的内存来保存内容。这意味着：

- 内存必须在运行时向内存分配器申请。
- 我们需要一种方法在我们使用完 `String` 后将内存返回给内存分配器。

第一部分由我们完成：当我们调用 `String::from` 时，它的实现会请求所需的内存。这在大多数编程语言中都是普遍的做法。

然而，第二部分与众不同。在拥有*垃圾回收器（GC）*的语言中，GC会跟踪和清理不再使用的内存，我们不需要考虑这个问题。但是在大多数没有垃圾回收器的语言中，我们需要自己判断何时内存不再使用，并调用代码显式地释放它，就像我们请求内存时一样。在历史上，正确地处理这个问题一直是一个棘手的编程问题。如果忘记释放内存，会造成内存泄漏。如果过早释放，可能导致无效的变量。如果释放两次，也是一个错误。我们需要保证每一次 `allocate` 都有与之对应的一次 `free`。

Rust 采取了不同的方式：一旦拥有内存的变量超出了其作用域，内存就会自动返回。下面是我们使用 `String` 代替字符串字面值的作用域示例（来自列表 4-1）：

```rust
    {
        let s = String::from("hello"); // s 从这一点开始有效

        // 使用 s 做一些事情
    }                                  // 这个作用域结束，s 不再有效
```

当 `s` 超出作用域时，就有一个自然的时机可以将 `String` 需要的内存返回给内存分配器。当变量超出作用域时，Rust 会自动为我们调用一个特殊的函数，这个函数被称为 [`drop`](https://doc.rust-lang.org/std/ops/trait.Drop.html#tymethod.drop)，它是 `String` 的作者可以用来返回内存的地方。Rust 会在闭括号处自动调用 `drop`。

> 注意：在 C++ 中，这种在项目生命周期结束时释放资源的模式有时被称为*资源获取即初始化（RAII）*。如果你使用过 RAII 模式，那么 Rust 中的 `drop` 函数会很熟悉。

这种模式对 Rust 代码的编写产生了深远影响。虽然现在看起来很简单，但在更复杂的情况下，当我们想让多个变量使用我们在堆上分配的数据时，代码的行为可能会出乎意料。让我们现在探讨一些这样的情况。

### 变量和数据的移动交互

在 Rust 中，多个变量可以以不同的方式与相同的数据进行交互。让我们看一个使用整数的示例，如列表 4-2 所示。

```rust
    let x = 5;
    let y = x;
```

列表 4-2：将变量 `x` 的整数值赋给 `y`

我们可以猜测这段代码在做什么：“将值 `5` 绑定到 `x`；然后复制 `x` 中的值并将其绑定到 `y`。” 现在我们有了两个变量 `x` 和 `y`，并且它们都等于 `5`。这是实际发生的情况，因为整数是简单的值，具有已知且固定的大小，这两个 `5` 的值都被推送到堆栈上。

现在我们来看看 `String` 版本：

```rust
    let s1 = String::from("hello");
    let s2 = s1;
```

这看起来非常相似，所以我们可能会假设它的工作方式也是相同的：即第二行会复制 `s1` 中的值，并将其绑定到 `s2`。但实际情况并非如此。

看一下图 4-1，了解 `String` 在内部发生的情况。`String` 由三部分组成，如图左侧所示：一个指向保存字符串内容的内存的指针、一个长度和一个容量。这组数据存储在堆栈上。右侧是保存内容的堆上内存。

![两个表：第一个表包含 s1 在堆栈上的表示，由长度（5）、容量（5）和指向第二个表中第一个值的指针组成。第二个表包含在堆上保存字符串数据的内存，按字节排列。](https://doc.rust-lang.org/book/img/trpl04-01.svg)

图 4-1：保存值为 `"hello"` 的 `String` 在内存中的表示，绑定到 `s1`

长度表示 `String` 目前使用的内容内存量，以字节为单位。容量是 `String` 从分配器中获得的总内存量，也以字节为单位。长度和容量之间的区别在这个上下文中并不重要，所以现在可以忽略容量。

当我们将 `s1` 赋值给 `s2` 时，`String` 数据被复制，这意味着我们复制了在堆栈上的指针、长度和容量。但是我们没有复制指针所指向的堆上数据。换句话说，内存中的数据表示看起来像图 4-2。

![三个表：分别表示 s1 和 s2 在堆栈上的字符串数据，它们都指向相同的堆上字符串数据。](https://doc.rust-lang.org/book/img/trpl04-02.svg)

图 4-2：表示具有 `s1` 的指针、长度和容量的变量 `s2`

这个表示与图 4-3 不同，如果 Rust 复制堆上的数据，内存会是这个样子。如果 Rust 这样做，`s2 = s1` 的操作会在运行时性能方面非常昂贵，因为堆上的数据可能很大。

![四个表：两个表示 s1 和 s2 在堆栈上的数据，它们都指向各自的堆上字符串数据副本。](https://doc.rust-lang.org/book/img/trpl04-03.svg)

图 4-3：如果 Rust 也复制堆上的数据，`s2 = s1` 可能会执行的另一种情况

前面我们说过，当一个变量超出作用域时，Rust 会自动调用 `drop` 函数并清理该变量的堆内存。但是图 4-2 显示了两个数据指针指向同一位置。这是一个问题：当 `s2` 和 `s1` 超出作用域时，它们都会尝试释放同一块内存。这被称为*双重释放（double free）*错误，是我们之前提到的内存安全性错误之一。释放内存两次会导致内存损坏，可能导致安全漏洞。

为了确保内存安全，`let s2 = s1;` 后，Rust 将 `s1` 视为无效。因此，当 `s1` 超出作用域时，Rust 不需要释放任何东西。看看在创建 `s2` 后尝试使用 `s1` 会发生什么；它不会工

作：

```rust
    let s1 = String::from("hello");
    let s2 = s1;

    println!("{}, world!", s1);
```

你会得到一个类似于这样的错误，因为 Rust 阻止你使用无效的引用：

```console
$ cargo run
   Compiling ownership v0.1.0 (file:///projects/ownership)
error[E0382]: borrow of moved value: `s1`
 --> src/main.rs:5:28
  |
2 |     let s1 = String::from("hello");
  |         -- move occurs because `s1` has type `String`, which does not implement the `Copy` trait
3 |     let s2 = s1;
  |              -- value moved here
4 |
5 |     println!("{}, world!", s1);
  |                            ^^ value borrowed here after move
  |
  = note: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let s2 = s1.clone();
  |                ++++++++

For more information about this error, try `rustc --explain E0382`.
error: could not compile `ownership` due to previous error
```

如果你在使用其他语言时听说过“浅复制”和“深复制”这些术语，在不复制数据的情况下复制指针、长度和容量的概念可能听起来像是在做浅复制。但由于 Rust 还使第一个变量无效，所以它被称为*移动*，而不是浅复制。在这个示例中，我们会说 `s1` 被*移动*到了 `s2` 中。因此，实际上发生的情况如图 4-4 所示。

![三个表：分别表示 s1 和 s2 在堆栈上的字符串数据，它们都指向相同的堆上字符串数据。表 s1 是灰色的，因为 s1 不再有效；只有 s2 可以用于访问堆上的数据。](https://doc.rust-lang.org/book/img/trpl04-04.svg)

图 4-4：在 `s1` 无效后内存中的表示

这解决了我们的问题！只有 `s2` 有效，当它超出作用域时它将单独释放内存，问题解决。

此外，这也暗示了一个设计选择：Rust 永远不会自动创建“深度”复制的数据。因此，任何*自动*复制都可以认为在运行时性能方面是廉价的。

#### 变量和克隆交互

如果我们确实想要深度复制 `String` 的堆数据，而不仅仅是堆栈数据，我们可以使用一个常见的方法叫做 `clone`。我们将在第 5 章讨论方法语法，但因为方法是许多编程语言中常见的特性，你可能以前见过它们。

以下是 `clone` 方法的示例：

```rust
    let s1 = String::from("hello");
    let s2 = s1.clone();

    println!("s1 = {}, s2 = {}", s1, s2);
```

这可以正常工作，并明确地产生了图 4-3 中显示的行为，堆数据确实被复制。

当你看到一个对 `clone` 的调用时，你知道正在执行一些随机代码，而这些代码可能是昂贵的。这是一个视觉指示，表示正在发生一些不同的事情。

#### 仅限堆栈数据：Copy

还有一个我们尚未讨论的问题。使用整数的代码——部分显示在列表 4-2 中——有效且有效：

```rust
    let x = 5;
    let y = x;

    println!("x = {}, y = {}", x, y);
```

但这段代码似乎与我们刚刚学到的相矛盾：我们没有调用 `clone`，但 `x` 仍然有效，没有被移动到 `y` 中。

原

因是编译时大小已知的类型（例如整数）完全存储在堆栈上，因此实际值的复制速度很快。这意味着我们没有理由在创建变量 `y` 后阻止 `x` 有效。换句话说，在这里深度复制和浅复制之间没有区别，因此可以省略调用 `clone`。

Rust 有一个特殊的注解叫做 `Copy` 特性，我们可以将其放在存储在堆栈上的类型上，例如整数（我们将在[第 10 章](https://doc.rust-lang.org/book/ch10-02-traits.html)中详细讨论特性）。如果一个类型实现了 `Copy` 特性，使用它的变量不会被移动，而是进行简单的复制，使其在赋值给另一个变量后仍然有效。

如果类型或其部分实现了 `Drop` 特性，Rust 不会允许我们给该类型加上 `Copy` 注解。如果该类型在值超出作用域时需要发生特殊情况，并且我们为该类型添加了 `Copy` 注解，将会得到一个编译时错误。有关如何将 `Copy` 注解添加到您的类型以实现特性的信息，请参阅附录 C 中的 [“可派生特性”](https://doc.rust-lang.org/book/appendix-03-derivable-traits.html)。

那么，哪些类型实现了 `Copy` 特性？您可以查看给定类型的文档来确定，但通常情况下，任何一组简单标量值都可以实现 `Copy` 特性，而任何需要分配或是某种形式的资源的类型都不能实现 `Copy`。以下是一些实现了 `Copy` 特性的类型：

- 所有的整数类型，比如 `u32`。
- 布尔类型 `bool`，其值为 `true` 或 `false`。
- 所有浮点类型，比如 `f64`。
- 字符类型 `char`。
- 元组，如果它们只包含同样实现了 `Copy` 特性的类型。例如，`(i32, i32)` 实现了 `Copy`，但 `(i32, String)` 不实现。


### 所有权和函数

将值传递给函数的机制与将值赋给变量的机制类似。传递变量给函数将移动或复制，就像赋值一样。列表 4-3 展示了一个示例，其中使用了一些标注，显示了变量何时进入和退出作用域。

文件名：src/main.rs

```rust
fn main() {
    let s = String::from("hello");  // s 进入作用域

    takes_ownership(s);             // s 的值移动到函数里...
                                    // ... 所以在这里不再有效

    let x = 5;                      // x 进入作用域

    makes_copy(x);                  // x 应该移动函数里，
                                    // 但 i32 是 Copy 的，所以在后面依然可以使用 x

} // 这里 x 先退出作用域，然后是 s。由于 s 的值已经被移动，所以在这里没有特殊的事情发生。

fn takes_ownership(some_string: String) { // some_string 进入作用域
    println!("{}", some_string);
} // 这里，some_string 被移动进入函数，然后在这里离开作用域并调用 `drop`。背后的内存被释放。

fn makes_copy(some_integer: i32) { // some_integer 进入作用域
    println!("{}", some_integer);
} // 这里，some_integer 离开作用域。没有特殊的事情发生。
```

列表 4-3：具有所有权和作用域标注的函数

如果我们尝试在调用 `takes_ownership` 后使用 `s`，Rust 将会在编译时报错。这些静态检查保护我们免受错误。尝试向 `main` 函数中添加使用 `s` 和 `x` 的代码，以查看您可以在哪里使用它们，以及所有权规则在哪里阻止您这样做。

### 返回值和作用域

返回值也会转移所有权。列表 4-4 显示了一个返回某个值的函数的示例，其中使用了与列表 4-3 中相似的标注。

文件名：src/main.rs

```rust
fn main() {
    let s1 = gives_ownership();         // gives_ownership 将返回值移给 s1

    let s2 = String::from("hello");     // s2 进入作用域

    let s3 = takes_and_gives_back(s2);  // s2 被移动到 takes_and_gives_back 函数中，
                                        // 它也将返回值移给 s3
} // 这里，s3 首先离开作用域，然后是 s2。但由于 s2 的值被移动，所以没有特殊的事情发生。

fn gives_ownership() -> String {             // gives_ownership 将它的返回值移给调用它的函数
                                             // （这就是为什么后面没有分号，返回值就是没有分号的表达式的值）

    let some_string = String::from("yours"); // some_string 进入作用域

    some_string                              // some_string 被移出作用域并返回给调用的函数
}

// 这个函数会将传入的 String 返回给调用者
fn takes_and_gives_back(a_string: String) -> String { // a_string 进入作用域

    a_string  // a_string 被移出作用域并返回给调用的函数
}
```

列表 4-4：传递参数的所有权

但是这样做对每个函数都返回所有权并返回

所有权的模式并不高效。如果有一个函数需要从调用它的代码获取一些数据的所有权并返回所有权，我们通常希望在不将所有权移动到并从函数返回的情况下实现。

对于这种情况，Rust 提供了引用（reference）的概念，它允许您通过传递引用而不是值来传递数据。引用允许多个部分同时访问数据，而不会导致所有权转移。我们将在下一节中讨论引用。