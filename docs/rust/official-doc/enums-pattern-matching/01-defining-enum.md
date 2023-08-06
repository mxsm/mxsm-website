---
title: "定义枚举"
linkTitle: "定义枚举"
sidebar_label: 6.1. 定义枚举
weight: 202308051736
description: 定义枚举
---

## [定义枚举](https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html#defining-an-enum)

在Rust中，结构体为您提供了一种将相关字段和数据分组在一起的方式，例如`Rectangle`结构体包含`width`和`height`字段。而枚举为您提供了一种表示值为可能的一组值之一的方式。例如，我们可能想表达`Rectangle`是一个包含`Circle`和`Triangle`等可能形状之一的集合。为了实现这一点，Rust允许我们将这些可能性编码为一个枚举。

让我们来看一下我们可能想要在代码中表达的情况，并查看为什么在这种情况下，枚举比结构体更有用且更合适。假设我们需要处理IP地址。当前，IP地址有两个主要标准：第四版和第六版。因为这是我们的程序将遇到的IP地址的唯一可能性，我们可以*枚举*所有可能的变体，这就是枚举得名的原因。

任何IP地址都可以是第四版或第六版地址，但不能同时是两者。IP地址的这种特性使得枚举数据结构适合，因为枚举值只能是其变体之一。第四版和第六版地址仍然都是基本的IP地址，因此在处理适用于任何类型的IP地址的代码时，它们应该被视为相同类型。

我们可以通过定义`IpAddrKind`枚举并列出IP地址可以是`V4`和`V6`这两种可能的类型来在代码中表达这个概念：

```rust
enum IpAddrKind {
    V4,
    V6,
}
```

现在，`IpAddrKind`是一个我们可以在代码中使用的自定义数据类型。

## [枚举值](https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html#enum-values)

我们可以像这样创建`IpAddrKind`的两个变体的实例：

```rust
    let four = IpAddrKind::V4;
    let six = IpAddrKind::V6;
```

请注意，枚举的变体是以其标识符为命名空间的，并且我们使用双冒号将它们分开。这很有用，因为现在`IpAddrKind::V4`和`IpAddrKind::V6`这两个值都是相同类型：`IpAddrKind`。然后，我们可以定义一个函数，它接受任何`IpAddrKind`：

```rust
fn route(ip_kind: IpAddrKind) {}
```

我们可以使用任何一个变体调用这个函数：

```rust
    route(IpAddrKind::V4);
    route(IpAddrKind::V6);
```

使用枚举还有更多的优点。再考虑一下我们的IP地址类型，目前我们没有办法存储实际的IP地址*数据*；我们只知道它是什么*类型*。在第5章中刚刚学习了结构体，你可能会想使用结构体来解决这个问题，如列表6-1所示。

```rust
    enum IpAddrKind {
        V4,
        V6,
    }

    struct IpAddr {
        kind: IpAddrKind,
        address: String,
    }

    let home = IpAddr {
        kind: IpAddrKind::V4,
        address: String::from("127.0.0.1"),
    };

    let loopback = IpAddr {
        kind: IpAddrKind::V6,
        address: String::from("::1"),
    };
```

列表6-1：使用结构体存储IP地址的数据和`IpAddrKind`变体

在这里，我们定义了一个名为`IpAddr`的结构体，它有两个字段：一个`kind`字段，其类型为`IpAddrKind`（我们之前定义的枚举），以及一个类型为`String`的`address`字段。我们有两个该结构体的实例。第一个是`home`，它的`kind`为`IpAddrKind::V4`，其关联的地址数据是`127.0.0.1`。第二个实例是`loopback`，它的`kind`值是`IpAddrKind::V6`，关联的地址是`::1`。我们使用了结构体来将`kind`和`address`值捆绑在一起，因此现在变体和值是关联在一起的。

然而，使用枚举来表示相同的概念更加简洁：与其在结构体中使用枚举，我们可以直接将数据放在每个枚举变体中。`IpAddr`枚举的新定义表明`V4`和`V6`变体都将有关联的`String`值：

```rust
    enum IpAddr {
        V4(String),
        V6(String),
    }

    let home = IpAddr::V4(String::from("127.0.0.1"));

    let loopback = IpAddr::V6(String::from("::1"));
```

我们直接将数据附加到枚举的每个变体中，因此不需要额外的结构体。在这里，我们还更容易看到枚举的另一个细节：我们定义的每个枚举变体的名称也成为构造枚举实例的函数。也就是说，`IpAddr::V4()`是一个函数调用，它接受一个`String`参数并返回`IpAddr`类型的实例。我们在定义枚举时自动获得了这个构造函数。

使用枚举而不是结构体还有另一个优点：每个变体可以具有不同类型和不同数量的关联数据。第四版IP地址始终有四个数字组件，其值介于0和255之间。如果我们希望将`V4`地址存储

为四个`u8`值，但仍将`V6`地址表示为一个`String`值，使用结构体将无法实现。枚举很容易处理这种情况：

```rust
    enum IpAddr {
        V4(u8, u8, u8, u8),
        V6(String),
    }

    let home = IpAddr::V4(127, 0, 0, 1);

    let loopback = IpAddr::V6(String::from("::1"));
```

我们已经展示了多种不同的方式来定义数据结构以存储第四版和第六版IP地址。但事实上，想要存储IP地址并编码其类型是多么常见和有用，以至于[标准库中已经有我们可以使用的定义！](https://doc.rust-lang.org/std/net/enum.IpAddr.html) 让我们来看看标准库如何定义`IpAddr`：它有与我们之前定义和使用的枚举和变体完全相同的枚举和变体，但它在每个变体中嵌入地址数据，形式是两个不同的结构体，为每个变体定义了不同的结构体：

```rust
struct Ipv4Addr {
    // --snip--
}

struct Ipv6Addr {
    // --snip--
}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

这段代码说明了您可以在枚举变体中放入任何类型的数据：例如字符串、数值类型或结构体。甚至还可以包含其他枚举！此外，标准库类型通常并不比您可能想出的要复杂。

请注意，即使标准库中包含了`IpAddr`的定义，我们仍然可以创建和使用自己的定义而不会冲突，因为我们没有将标准库的定义引入我们的作用域。在第7章中，我们将更多地讨论如何将类型引入作用域。

让我们再看一个枚举的例子，列表6-2中有一个包含不同类型和数量值的广泛的枚举。

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}
```

列表6-2：一个`Message`枚举，其变体分别存储不同数量和类型的值

这个枚举有四个变体，每个变体都有不同的类型：

- `Quit`没有与之关联的数据。
- `Move`有命名字段，类似于结构体。
- `Write`包含一个`String`。
- `ChangeColor`包含三个`i32`值。

定义具有如列表6-2中所示的变体的枚举类似于定义不同类型的结构体定义，只是枚举不使用`struct`关键字，并且所有变体都在`Message`类型下进行分组。以下结构体可以保存与之前的枚举变体相同的数据：

```rust
struct QuitMessage; // 单元结构体
struct MoveMessage {
    x: i32,
    y: i32,
}
struct WriteMessage(String); // 元组结构体
struct ChangeColorMessage(i32, i32, i32); // 元组结构体
```

但是，如果使用不同的结构体，每个结构体都有自己的类型，与`Message`枚举定义在列表6-2中的单一类型相比，我们不能像处理枚举那样轻松地定义一个函数来接受这些类型的任何一种消息。

枚举和结构体还有一个共同之处：正如我们可以使用`impl`在结构体上定义方法一样，我们也可以在枚举上定义方法。下面是我们可以在`Message`枚举上定义的一个名为`call`的方法：

```rust
    impl Message {
        fn call(&self) {
            // 在此处定义方法体
        }
    }

    let m = Message::Write(String::from("hello"));
    m.call();
```

方法的主体将使用`self`来获取调用该方法的值。在这个例子中，我们创建了一个变量`m`，它的值是`Message::Write(String::from("hello"))`，这就是在`m.call()`中`self`在`call`方法的主体中所表示的值。

让我们再来看看另一个在标准库中非常常见且有用的枚举：`Option`。

## [`Option`枚举及其优于空值的优势](https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html#the-option-enum-and-its-advantages-over-null-values)

本节探讨了`Option`，这是标准库定义的另一个枚举。`Option`类型表示了一种非常常见的情况：值可以是某些内容，也可以是不存在。

例如，如果您请求一个非空列表中的第一个项，您将得到一个值。如果您请求一个空列表中的第一个项，您将得到一个不存在的值。使用类型系统来表达这个概念，意味着编译器可以检查您是否处理了所有应该处理的情况；这个功能可以防止在其他编程语言中非常常见的错误。

编程语言设计通常被认为是包含哪些功能，但排除哪些功能也很重要。Rust没有像许多其他语言那样有`null`特性。*Null*是一个值，表示没有值。在使用null的语言中，变量总是处于两种状态之一：null或非null。

Tony Hoare，null的发明者，在他2009年的演讲《空引用：十亿美元的错误》中说道：

> 我称其为我的十亿美元的错误。当时，我正在为面向对象语言中的引用设计第一个全面的类型系统

。我的目标是确保所有对引用的使用都是绝对安全的，由编译器自动执行检查。但我忍不住放入了一个null引用，因为它实现起来非常容易。这导致了无数的错误、漏洞和系统崩溃，这可能在过去四十年里造成了十亿美元的痛苦和损失。

空值的问题在于，如果您试图将一个空值用作非空值，将会得到某种错误。因为这种null或非null属性无处不在，很容易犯这种错误。

然而，null试图表达的概念仍然是有用的：null是一个当前无效或无法使用的值。

问题实际上并不在于这个概念，而在于特定的实现。因此，Rust没有null，但是有一个枚举可以将值的存在或不存在的概念编码。这个枚举是`Option<T>`，它在[标准库中定义](https://doc.rust-lang.org/std/option/enum.Option.html)如下：

```rust
enum Option<T> {
    None,
    Some(T),
}
```

`Option<T>`枚举非常有用，以至于它甚至包含在预导入中，您无需显式地将其引入作用域。它的变体也包含在预导入中：您可以直接使用`Some`和`None`而无需前缀`Option::`。`Option<T>`枚举仍然是一个普通的枚举，而`Some(T)`和`None`仍然是`Option<T>`类型的变体。

`<T>`语法是Rust的一个功能，我们还没有讨论过。它是一种泛型类型参数，我们将在第10章中更详细地讨论泛型。目前，您只需要知道`<T>`表示`Option`枚举的`Some`变体可以容纳任何类型的一个数据，而每个替换`T`的具体类型都使得整个`Option<T>`类型成为不同的类型。以下是使用`Option`值来保存数值类型和字符串类型的一些示例：

```rust
    let some_number = Some(5);
    let some_char = Some('e');

    let absent_number: Option<i32> = None;
```

`some_number`的类型是`Option<i32>`。`some_char`的类型是`Option<char>`，这是一个不同的类型。Rust可以推断出这些类型，因为我们已经在`Some`变体中指定了一个值。对于`absent_number`，Rust要求我们注释整个`Option`类型：编译器无法仅通过查看`None`值来推断相应的`Some`变体将保存的类型。在这里，我们告诉Rust，`absent_number`的类型是`Option<i32>`。

当我们有一个`Some`值时，我们知道存在一个值，并且该值保存在`Some`内部。当我们有一个`None`值时，从某种意义上说，它与null的含义相同：我们没有一个有效的值。那么`Option<T>`比null更好在哪里？

简而言之，因为`Option<T>`和`T`（其中`T`可以是任何类型）是不同的类型，编译器不会让我们将`Option<T>`值用作肯定是有效值。例如，下面的代码不会编译，因为它试图将`i8`添加到`Option<i8>`：

```rust
    let x: i8 = 5;
    let y: Option<i8> = Some(5);

    let sum = x + y;
```

如果运行这段代码，我们会得到一个错误消息，类似于：

```console
$ cargo run
   Compiling enums v0.1.0 (file:///projects/enums)
error[E0277]: cannot add `Option<i8>` to `i8`
 --> src/main.rs:5:17
  |
5 |     let sum = x + y;
  |                 ^ no implementation for `i8 + Option<i8>`
  |
  = help: the trait `Add<Option<i8>>` is not implemented for `i8`
  = help: the following other types implement trait `Add<Rhs>`:
            <&'a i8 as Add<i8>>
            <&i8 as Add<&i8>>
            <i8 as Add<&i8>>
            <i8 as Add>

For more information about this error, try `rustc --explain E0277`.
error: could not compile `enums` due to previous error
```

很激烈！实际上，这个错误消息意味着Rust不知道如何将`i8`和`Option<i8>`相加，因为它们是不同的类型。当我们拥有像`i8`这样的类型的值时，编译器将确保我们始终有一个有效值。在没有一个有效值的情况下，只有当我们拥有一个`Option<i8>`（或者我们正在处理的任何类型的值）时，我们才需要担心这种情况，并且编译器将确保我们在使用该值之前处理该情况。

换句话说，在使用`Option<T>`值之前，您必须将其转换为`T`。这通常有助于捕获null的最常见问题：假设某些值不是null时，实际上它是null。

消除错误地假设为非null值的风险，有助于您对代码更有信心。为了拥有可能为空的值，您必须通过将该值的类型设置为`Option<T>`来显式选择。然后，在使用该值时，您必须明确处理该值为空的情况。在每个值的类型不是`Option<T>`的地方，您可以安全地假设该值不是null。这是Rust有意为之的设计决策，用于限制null的普遍性并提高代码的安全性。
