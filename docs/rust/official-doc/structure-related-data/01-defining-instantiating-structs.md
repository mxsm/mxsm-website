---
title: "定义和实例化结构体"
linkTitle: "定义和实例化结构体"
sidebar_label: 5.1. 定义和实例化结构体
weight: 202308051736
description: 定义和实例化结构体
---

## 定义和实例化结构体

结构体与元组类似，在元组中我们讨论过，它们都可以包含多个相关的值。与元组类似，结构体的成员可以是不同的数据类型。不同之处在于，在结构体中，你需要给每个数据成员命名，以便清楚地表明这些值的含义。增加了这些名称使得结构体比元组更灵活：不需要依赖数据的顺序来指定或访问实例的值。

要定义一个结构体，我们使用关键字 `struct` 并为整个结构体起一个名称。结构体的名称应该描述将被组合在一起的数据片段的意义。然后，在大括号内，我们定义数据片段的名称和类型，我们称之为*字段*。例如，代码清单 5-1 显示了一个存储用户账户信息的结构体示例。

文件名：src/main.rs

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}
```

代码清单 5-1：`User` 结构体的定义

在定义了结构体之后，我们可以通过为每个字段指定具体的值来创建该结构体的*实例*。我们通过给出结构体名称，然后添加花括号，其中包含 *键：值* 对，其中键是字段的名称，值是我们要存储在这些字段中的数据。我们不需要按照在结构体中声明它们的顺序指定字段。换句话说，结构体定义就像是类型的通用模板，实例用特定的数据填充该模板，从而创建类型的值。例如，我们可以像代码清单 5-2 中所示那样声明一个特定的用户。

文件名：src/main.rs

```rust
fn main() {
    let user1 = User {
        active: true,
        username: String::from("someusername123"),
        email: String::from("someone@example.com"),
        sign_in_count: 1,
    };
}
```

代码清单 5-2：创建一个 `User` 结构体的实例

要从结构体中获取特定的值，我们使用点号（dot notation）。例如，要访问此用户的电子邮件地址，我们可以使用 `user1.email`。如果实例是可变的，我们可以使用点号（dot notation）并赋值给特定的字段来更改值。代码清单 5-3 展示了如何在可变的 `User` 实例中更改 `email` 字段的值。

文件名：src/main.rs

```rust
fn main() {
    let mut user1 = User {
        active: true,
        username: String::from("someusername123"),
        email: String::from("someone@example.com"),
        sign_in_count: 1,
    };

    user1.email = String::from("anotheremail@example.com");
}
```

代码清单 5-3：更改 `User` 实例中 `email` 字段的值

请注意，整个实例必须是可变的；Rust 不允许我们仅标记某些字段为可变。与任何表达式一样，我们可以在函数体的最后构造一个新的结构体实例，以隐式地返回该新实例。

代码清单 5-4 展示了一个 `build_user` 函数，该函数接受一个电子邮件和用户名，并返回一个具有给定电子邮件和用户名的 `User` 实例。`active` 字段的值设为 `true`，而 `sign_in_count` 字段设为 `1`。

文件名：src/main.rs

```rust
fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username: username,
        email: email,
        sign_in_count: 1,
    }
}
```

代码清单 5-4：`build_user` 函数接受电子邮件和用户名，并返回 `User` 结构体的实例

给函数参数起与结构体字段相同的名称是合理的，但是必须重复 `email` 和 `username` 字段的名称和变量有点繁琐。如果结构体有更多的字段，重复每个名称将变得更加烦人。幸运的是，这里有一个方便的简写方式！

### 使用字段初始化简写

因为代码清单 5-4 中的函数参数名称和结构体字段名称完全相同，我们可以使用 *字段初始化简写* 语法来重写 `build_user`，使其行为完全相同，但不需要重复 `username` 和 `email`，如代码清单 5-5 所示。

文件名：src/main.rs

```rust
fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username,
        email,
        sign_in_count: 1,
    }
}
```

代码清单 5-5：`build_user` 函数使用字段初始化简写，因为 `username` 和 `email` 参数与结构体字段具有相同的名称

在这里，我们正在创建一个 `User` 结构体的新实例，它有一个名为 `email` 的字段。我们希望将 `email` 字段的值设置为 `build_user` 函数的 `email` 参数中的值。由于 `email` 字段和 `email` 参数具有相同的名称，我们只需要写 `email` 而不是 `email: email`。

### 使用结构体更新语法从其他实例创建实例

通常，创建一个包含另一个实例中大部分值但更改某些值的新结构体实例是非常有用的。你可以使用 *结构体更新语法* 来实现这一点。

首先，代码清单 5-6 展示了如何在不使用更新语法的情况下创建一个新的 `User` 实例。我们为 `email` 设置了一个新值，但在除此之外，我们使用了在代码清单 5-2 中创建的 `user1` 的相同值。

文件名：src/main.rs



```rust
fn main() {
    // --snip--

    let user2 = User {
        active: user1.active,
        username: user1.username,
        email: String::from("another@example.com"),
        sign_in_count: user1.sign_in_count,
    };
}
```

代码清单 5-6：使用一个来自 `user1` 的值在常规情况下创建一个新的 `User` 实例

使用结构体更新语法，我们可以用更少的代码实现相同的效果，如代码清单 5-7 所示。语法 `..` 表示其余未显式设置的字段应该有与给定实例中相同的值。

文件名：src/main.rs

```rust
fn main() {
    // --snip--

    let user2 = User {
        email: String::from("another@example.com"),
        ..user1
    };
}
```

代码清单 5-7：使用结构体更新语法设置 `User` 实例的新 `email` 值，但使用 `user1` 的其余值

代码清单 5-7 中的代码还创建了一个 `user2` 实例，该实例的 `email` 值不同，但其 `username`、`active` 和 `sign_in_count` 字段与 `user1` 中的值相同。`..user1` 必须放在最后，以指定任何未明确设置的字段都应从 `user1` 中的相应字段获取其值，但我们可以任意顺序地指定任意数量的字段的值，而不受结构体定义中字段顺序的影响。

请注意，结构体更新语法使用 `=` 来表示赋值；这是因为它会移动数据，就像我们在[“变量和数据交互：所有权”](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#variables-and-data-interacting-with-move)一节中看到的那样。在这个例子中，创建 `user2` 后，我们不能再整体使用 `user1`，因为 `user1` 中 `username` 字段的 `String` 已经被移动到 `user2` 中。如果我们为 `user2` 的 `email` 和 `username` 字段都提供了新的 `String` 值，并且只使用了 `user1` 中的 `active` 和 `sign_in_count` 值，那么在创建 `user2` 之后，`user1` 仍然是有效的。因为 `active` 和 `sign_in_count` 都是实现了 `Copy` 特性的类型，所以我们在[“栈上的数据：Copy”](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#stack-only-data-copy)一节中讨论过的行为也适用。

### 使用没有字段名的元组结构体创建不同的类型

Rust 还支持与元组类似的结构体，称为*元组结构体*（tuple structs）。元组结构体具有由结构体名称提供的附加含义，但不与其字段关联名称，而只有字段的类型。当你想要为整个元组起一个名字，并使该元组成为与其他元组不同的类型时，以及在每个字段都像常规结构体中命名将会很冗长或冗余时，元组结构体是有用的。

要定义元组结构体，首先使用 `struct` 关键字和结构体名称，然后跟着元组中的类型。例如，这里我们定义并使用了两个元组结构体 `Color` 和 `Point`：

文件名：src/main.rs

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
}
```

请注意，`black` 和 `origin` 的值是不同的类型，因为它们是不同元组结构体的实例。你定义的每个结构体都是其自己的类型，尽管结构体内部的字段可能具有相同的类型。例如，接受类型为 `Color` 的参数的函数不能将 `Point` 作为参数传递，即使两者都由三个 `i32` 值组成。除此之外，元组结构体实例与元组类似，可以将它们解构为其各个成员，可以使用 `.` 后跟索引来访问单个值。

### 没有任何字段的类单元结构体

你还可以定义不具有任何字段的结构体！这些称为*类单元结构体*（unit-like structs），因为它们的行为与我们在[“元组类型”](https://doc.rust-lang.org/book/ch03-02-data-types.html#the-tuple-type)一节中提到的 `()` 单元类型相似。类单元结构体在你需要在某些类型上实现特质，但没有任何你想在类型本身中存储的数据时非常有用。我们将在第 10 章讨论特质。下面是一个声明和实例化名为 `AlwaysEqual` 的类单元结构体的示例：

文件名：src/main.rs

```rust
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual;
}
```

为了定义 `AlwaysEqual`，我们使用 `struct` 关键字，加上我们想要的名称，然后是一个分号。不需要大括号或括号！然后我们可以以类似的方式在 `subject` 变量中获得 `AlwaysEqual` 的一个实例：使用我们定义的名称，不需要大括号或括号。假设以后我们将为此类型实现一种行为，使得 `AlwaysEqual` 的每个实例始终等于任何其他类型的实例，可能是为了测试目的而提供已知的结果。我们不需要任何数据来实现这个行为！你将在第 10 章中看到如何在任何类型上定义

特质，并在其中实现它们，包括类单元结构体。

> ### 结构体数据的所有权
>
> 在代码清单 5-1 中的 `User` 结构体定义中，我们使用了拥有所有权的 `String` 类型，而不是 `&str` 字符串切片类型。这是一个有意为之的选择，因为我们希望该结构体的每个实例都拥有其所有的数据，并且该数据在整个结构体有效时都有效。
>
> 当然，结构体也可以存储对其他数据的引用，但要这样做，我们需要使用*生命周期*，这是 Rust 中的一个特性，在第 10 章中讨论。生命周期确保结构体引用的数据在结构体有效时有效。比方说，如果你尝试在结构体中存储引用而不指定生命周期，例如下面的代码，这是行不通的：
>
> 文件名：src/main.rs
>
> ```rust
> struct User {
>  active: bool,
>  username: &str,
>  email: &str,
>  sign_in_count: u64,
> }
> 
> fn main() {
>  let user1 = User {
>      active: true,
>      username: "someusername123",
>      email: "someone@example.com",
>      sign_in_count: 1,
>  };
> }
> ```
>
> 编译器会报错，表示需要生命周期说明符：
>
> ```console
> $ cargo run
> Compiling structs v0.1.0 (file:///projects/structs)
> error[E0106]: missing lifetime specifier
> --> src/main.rs:3:15
> |
> 3 |     username: &str,
> |               ^ expected named lifetime parameter
> |
> help: consider introducing a named lifetime parameter
> |
> 1 ~ struct User<'a> {
> 2 |     active: bool,
> 3 ~     username: &'a str,
> |
> 
> error[E0106]: missing lifetime specifier
> --> src/main.rs:4:12
> |
> 4 |     email: &str,
> |            ^ expected named lifetime parameter
> |
> help: consider introducing a named lifetime parameter
> |
> 1 ~ struct User<'a> {
> 2 |     active: bool,
> 3 |     username: &str,
> 4 ~     email: &'a str,
> |
> 
> For more information about this error, try `rustc --explain E0106`.
> error: could not compile `structs` due to 2 previous errors
> ```
>
> 在第 10 章中，我们将讨论如何修复这些错误，以便在结构体中存储引用，但现在我们将使用像 `String` 这样的拥有所有权的类型来修复这些错误，而不使用像 `&str` 这样的引用类型。