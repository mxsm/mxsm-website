---
title: "方法语法"
linkTitle: "方法语法"
sidebar_label: 5.3. 方法语法
weight: 202308051736
description: 方法语法
---

## 方法语法

*方法*与函数类似：我们用`fn`关键字和名称声明它们，它们可以有参数和返回值，并且它们包含在从其他地方调用方法时运行的一些代码。与函数不同，方法是在结构体的上下文中定义的（或者在我们在[第6章](https://doc.rust-lang.org/book/ch06-00-enums.html)和[第17章](https://doc.rust-lang.org/book/ch17-02-trait-objects.html)中介绍的枚举或trait对象的上下文中定义），它们的第一个参数始终是`self`，它代表方法被调用的结构体实例。

### 定义方法

让我们改变`area`函数，它以`Rectangle`实例作为参数，而是在`Rectangle`结构体上定义一个`area`方法，如代码清单5-13所示。

文件名：src/main.rs

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );
}
```

代码清单5-13：在`Rectangle`结构体上定义一个`area`方法

为了在`Rectangle`的上下文中定义函数，我们在`Rectangle`上启动了一个`impl`（实现）块。在这个`impl`块内的所有内容都将与`Rectangle`类型相关联。然后，我们将`area`函数移到`impl`大括号内，并将签名中的第一个（在本例中是唯一的）参数更改为`self`，并在函数体内的所有地方更改。在`main`函数中，我们通过使用*方法语法*来调用我们`Rectangle`实例上的`area`方法，而不是调用`area`函数。方法语法在实例之后：我们在实例后添加一个点，接着是方法名、括号和任何参数。

在`area`的签名中，我们使用`&self`代替`rectangle: &Rectangle`。`&self`实际上是`self: &Self`的缩写。在`impl`块内，类型`Self`是`impl`块所对应的类型的别名。方法必须有一个名为`self`类型为`Self`的参数作为它们的第一个参数，因此Rust允许你在第一个参数位置上只使用名称`self`来缩写。请注意，我们仍然需要在`self`简写前面使用`&`，以表示此方法借用了`Self`实例，就像我们在`rectangle: &Rectangle`中所做的那样。方法可以获取`self`的所有权、不可变地借用`self`（如我们在这里所做的），或者可变地借用`self`，就像它们可以对任何其他参数一样。

在这里选择`&self`的原因与我们在函数版本中使用`&Rectangle`的原因相同：我们不希望获取所有权，我们只想读取结构体中的数据，而不是写入数据。如果我们想要在方法执行期间更改我们调用方法的实例作为方法的一部分，我们将使用`&mut self`作为第一个参数。使用只有`self`作为第一个参数的方法获取实例的所有权是罕见的；当方法将`self`转换为其他类型，并且希望在转换后阻止调用者继续使用原始实例时，通常会使用此技术。

使用方法而不是函数的主要原因是为了组织代码，此外还提供了方法语法，并且不必在每个方法的签名中重复`self`的类型。我们将所有与类型的实例关联的功能放入一个`impl`块中，而不是让我们代码的未来用户在我们提供的库的各个地方搜索`Rectangle`的功能。

请注意，我们可以选择为方法取与结构体字段相同的名称。例如，我们可以在`Rectangle`上定义一个同样被命名为`width`的方法：

文件名：src/main.rs

```rust
impl Rectangle {
    fn width(&self) -> bool {
        self.width > 0
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    if rect1.width() {
        println!("The rectangle has a nonzero width; it is {}", rect1.width);
    }
}
```

在这里，我们选择让`width`方法在实例的`width`字段值大于`0`时返回`true`，否则返回`false`：我们可以将同名字段在方法内部用于任何目的。在`main`函数中，当我们将`rect1.width`跟随圆括号使用时，Rust知道我们指的是方法`width`。当我们不使用圆括号时，Rust知道我们指的是字段`width`。

通常，但并非总是，当我们给方法取与字段相同的名称时，我们希望它只返回字段中的值而不做其他任何事情。这样的方法称为*getter*，Rust不会像一些其他语言那样自动为结构体字段实现它们。getter很有用，因为你可以将字段设为私有，而将方法设为公共，从而在类型的公共API中启用只读访问该字段。我们将在[第7章](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html#exposing-paths-with-the-pub-keyword)中讨论公共和私有，以及如何将字段或方法指定为公共或私有。

> ### `->`操作符在哪里？
>
> 在C和C++中，调用方法使用两个不同的操作符

：如果直接在对象上调用方法，则使用`.`，如果在对象指针上调用方法并且需要首先解引用指针，则使用`->`。换句话说，如果`object`是一个指针，则`object->something()`类似于`(*object).something()`。
>
>Rust没有`->`操作符的等价物；相反，Rust拥有一种称为*自动引用和解引用*的功能。调用方法是Rust中这种行为的少数几个地方之一。
>
>它的工作原理如下：当你用`object.something()`调用方法时，Rust会自动添加`&`、`&mut`或`*`，以便`object`与方法的签名匹配。换句话说，下面两者是等价的：
>
>```rust
>p1.distance(&p2);
>(&p1).distance(&p2);
>```
>
>第一个看起来更干净。这种自动引用行为是因为方法具有明确的接收者——`self`的类型。给定接收者和方法的名称，Rust可以确定方法是读取（`&self`）、修改（`&mut self`）还是消耗（`self`）。Rust让方法接收者的借用隐式，这在实践中使所有权使用起来更加舒适。

### 带有更多参数的方法

让我们通过在`Rectangle`结构体上实现第二个方法来练习使用方法。这次，我们希望一个`Rectangle`实例接受另一个`Rectangle`实例作为参数，并在第二个`Rectangle`完全适合`self`（第一个`Rectangle`）中时返回`true`；否则，它应该返回`false`。也就是说，一旦我们定义了`can_hold`方法，我们希望能够编写代码清单5-14中所示的程序。

文件名：src/main.rs

```rust
fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    let rect3 = Rectangle {
        width: 60,
        height: 45,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```

代码清单5-14：使用尚未编写的`can_hold`方法

预期的输出如下所示，因为`rect2`的两个维度都小于`rect1`的维度，但`rect3`的宽度大于`rect1`的宽度：

```text
Can rect1 hold rect2? true
Can rect1 hold rect3? false
```

我们知道我们要定义一个方法，因此它将在`impl Rectangle`块内。方法名将是`can_hold`，它将以另一个`Rectangle`的不可变借用作为参数。我们可以通过查看调用该方法的代码来确定参数的类型：`rect1.can_hold(&rect2)`传入了`&rect2`，它是对`rect2`的不可变借用，`rect2`是`Rectangle`的一个实例。这是有道理的，因为我们只需要读取`rect2`（而不是写入，这意味着我们需要一个可变借用），我们希望`main`在调用`can_hold`方法后保留对`rect2`的所有权，以便我们在之后可以再次使用它。`can_hold`的返回值将是一个布尔值，并且实现将检查`self`的宽度和高度是否大于另一个`Rectangle`的宽度和高度。让我们将新的`can_hold`方法添加到代码清单5-13中的`impl`块中，如代码清单5-15所示。

文件名：src/main.rs

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

代码清单5-15：在`Rectangle`上实现一个`can_hold`方法，它以另一个`Rectangle`实例作为参数

当我们将带有`main`函数的代码清单5-14运行时，我们将获得我们期望的输出。方法可以带有多个参数，我们将它们添加到`self`参数之后的签名中，这些参数的工作方式与函数中的参数一样。

### 关联函数

在`impl`块中定义的所有函数都被称为*关联函数*，因为它们与`impl`后面命名的类型相关联。我们可以定义没有`self`作为第一个参数的关联函数（因此不是方法），因为它们不需要类型的实例来处理。我们已经使用了这样一个函数：定义在`String`类型上的`String::from`函数。

没有`self`作为第一个参数的关联函数通常用于构造函数，用于返回结构体的新实例。这些通常被称为`new`，但`new`并不是特殊的名称，也不是内置到语言中的。例如，我们可以选择提供一个名为`square`的关联函数，该函数将具有一个维度参数，并将其作为宽度和高度，从而使创建正方形`Rectangle`更加容易，而不必两次指定相同的值：

文件名：src/main.rs

```rust
impl Rectangle {
    fn square(size: u32) -> Self {
        Self {
            width: size,
            height: size,
        }
    }
}
```

在返回类型和函数体中，`Self`关键字是`impl`关键字后面出现的类型的别名，这里是`Rectangle`。

要调用此关联函数，我们使用结构体名称和`::`语法；`let sq = Rectangle::square(3);`就是一个例子。这

个函数是由结构体命名空间包围的：`::`语法既适用于关联函数，也适用于模块创建的命名空间。我们将在[第7章](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html)中讨论模块。

### 多个`impl`块

每个结构体允许有多个`impl`块。例如，代码清单5-15等价于代码清单5-16中的代码，其中每个方法在其自己的`impl`块中。

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

代码清单5-16：使用多个`impl`块重写代码清单5-15

这里没有理由将这些方法分为多个`impl`块，但这是有效的语法。我们将在第10章中看到一个情况，在这种情况下，多个`impl`块很有用，我们将讨论泛型类型和trait。

## 总结

结构体允许你创建对你的领域有意义的自定义类型。通过使用结构体，你可以将关联的数据片段连接在一起，并为每个片段命名，使代码更加清晰。在`impl`块中，你可以定义与你的类型相关联的函数，而方法是与你的结构体实例具有行为的关联函数。

但是结构体不是你可以创建自定义类型的唯一方法：让我们转向Rust的枚举功能，为你的工具箱增加另一种工具。