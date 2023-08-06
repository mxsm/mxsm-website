---
title: "在模块树中引用项目的路径"
linkTitle: "在模块树中引用项目的路径"
sidebar_label: 7.3. 在模块树中引用项目的路径
weight: 202308051736
description: 在模块树中引用项目的路径
---

## [在模块树中引用项目的路径](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html#paths-for-referring-to-an-item-in-the-module-tree)

为了告诉Rust在模块树中找到一个项目，我们使用路径的方式，就像在文件系统中导航时使用路径一样。为了调用一个函数，我们需要知道它的路径。

路径有两种形式：

- *绝对路径*是从板条箱根开始的完整路径；对于外部板条箱的代码，绝对路径以板条箱名称开头，对于当前板条箱的代码，它以字面值`crate`开头。
- *相对路径*从当前模块开始，使用`self`、`super`或当前模块中的标识符。

绝对路径和相对路径都由一个或多个标识符组成，用双冒号（`::`）分隔。

回到清单7-1，假设我们想调用`add_to_waitlist`函数。这与询问“`add_to_waitlist`函数的路径是什么？”是相同的。清单7-3是在清单7-1中删除了一些模块和函数后的代码。

我们将展示两种方法来从名为`eat_at_restaurant`的新函数中调用`add_to_waitlist`函数，该函数在板条箱根中定义。这些路径是正确的，但还有另一个问题，这将阻止示例正常编译。我们稍后会解释为什么。

`eat_at_restaurant`函数是库板条箱的公共API的一部分，因此我们用`pub`关键字标记它。在["使用`pub`关键字暴露路径"](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html#exposing-paths-with-the-pub-keyword)部分中，我们将详细介绍`pub`。

文件名：src/lib.rs

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

清单7-3：使用绝对和相对路径调用`add_to_waitlist`函数

在`eat_at_restaurant`中第一次调用`add_to_waitlist`函数时，我们使用了绝对路径。`add_to_waitlist`函数在与`eat_at_restaurant`相同的板条箱中定义，这意味着我们可以使用`crate`关键字来启动绝对路径。然后，我们逐个包含每个连续的模块，直到找到`add_to_waitlist`。您可以将此想象为具有相同结构的文件系统：我们会指定路径`/front_of_house/hosting/add_to_waitlist`来运行`add_to_waitlist`程序；使用`crate`名称从板条箱根开始，就像在shell中使用`/`从文件系统根开始一样。

在`eat_at_restaurant`中第二次调用`add_to_waitlist`时，我们使用了相对路径。路径以`front_of_house`开始，这是与`eat_at_restaurant`在同一级别的模块树中定义的模块的名称。在这里，文件系统的等效方式是使用路径`front_of_house/hosting/add_to_waitlist`。从模块名称开始意味着路径是相对的。

选择使用相对路径还是绝对路径是您根据项目决定的，这取决于您更有可能单独移动项目定义代码还是与使用项目的代码一起移动。例如，如果我们将`front_of_house`模块和`eat_at_restaurant`函数移动到名为`customer_experience`的模块中，我们需要更新`add_to_waitlist`的绝对路径，但相对路径仍然有效。然而，如果我们将`eat_at_restaurant`函数单独移动到名为`dining`的模块中，`add_to_waitlist`调用的绝对路径将保持不变，但相对路径将需要更新。通常，我们更喜欢指定绝对路径，因为我们更有可能单独移动代码定义和项目调用，而不受彼此影响。

让我们尝试编译清单7-3并查找为什么它还不能编译！错误信息显示在清单7-4中。

```console
$ cargo build
   Compiling restaurant v0.1.0 (file:///projects/restaurant)
error[E0603]: module `hosting` is private
 --> src/lib.rs:9:28
  |
9 |     crate::front_of_house::hosting::add_to_waitlist();
  |                            ^^^^^^^ private module
  |
note

: the module `hosting` is defined here
 --> src/lib.rs:2:5
  |
2 |     mod hosting {
  |     ^^^^^^^^^^^

error[E0603]: module `hosting` is private
  --> src/lib.rs:12:21
   |
12 |     front_of_house::hosting::add_to_waitlist();
   |                     ^^^^^^^ private module
   |
note: the module `hosting` is defined here
  --> src/lib.rs:2:5
   |
2  |     mod hosting {
   |     ^^^^^^^^^^^

For more information about this error, try `rustc --explain E0603`.
error: could not compile `restaurant` due to 2 previous errors
```

清单7-4：清单7-3中代码的编译错误

错误消息表示`hosting`模块是私有的。换句话说，我们对`hosting`模块和`add_to_waitlist`函数的路径是正确的，但Rust不允许我们使用它们，因为它没有访问私有部分。在Rust中，所有项目（函数、方法、结构体、枚举、模块和常量）默认为父模块的私有项目。如果要将函数或结构体等项设为私有，则应将其放入模块中。

父模块中的项无法使用子模块内部的私有项，但子模块中的项可以使用其祖先模块中的项。这是因为子模块封装并隐藏其实现细节，但子模块可以看到它们所定义的上下文。继续使用我们的隐喻，将隐私规则视为餐厅的后台：在其中发生的事情对餐厅顾客是私有的，但办公室经理可以在他们经营的餐厅中看到和做任何事情。

Rust选择让模块系统以这种方式工作，以便默认隐藏内部实现细节。这样，您就知道哪些内部代码部分可以更改而不会破坏外部代码。然而，Rust确实给您提供了一种选择，即使用`pub`关键字将子模块的内部代码公开给外部祖先模块。

### [使用`pub`关键字暴露路径](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html#exposing-paths-with-the-pub-keyword)

让我们回到清单7-4中的错误，该错误告诉我们`hosting`模块是私有的。我们希望父模块中的`eat_at_restaurant`函数能够访问子模块中的`add_to_waitlist`函数，因此我们用`pub`关键字标记`hosting`模块，如清单7-5所示。

文件名：src/lib.rs

```rust
mod front_of_house {
    pub mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

清单7-5：将`hosting`模块声明为`pub`，以便从`eat_at_restaurant`中使用它

不幸的是，清单7-5中的代码仍然导致错误，如清单7-6所示。

```console
$ cargo build
   Compiling restaurant v0.1.0 (file:///projects/restaurant)
error[E0603]: function `add_to_waitlist` is private
 --> src/lib.rs:9:37
  |
9 |     crate::front_of_house::hosting::add_to_waitlist();
  |                                     ^^^^^^^^^^^^^^^ private function
  |
note: the function `add_to_waitlist` is defined here
 --> src/lib.rs:3:9
  |
3 |         fn add_to_waitlist() {}
  |         ^^^^^^^^^^^^^^^^^^^^

error[E0603]: function `add_to_waitlist` is private
  --> src/lib.rs:12:30
   |
12 |     front_of_house::hosting::add_to_waitlist();
   |                              ^^^^^^^^^^^^^^^ private function
   |
note: the function `add_to_waitlist` is defined here
  --> src/lib.rs:3:9
   |
3  |         fn add_to_waitlist() {}
   |         ^^^^^^^^^^^^^^^^^^^^

For more information about this error, try `rustc --explain E0603`.
error: could not compile `restaurant` due to 2 previous errors
```

清单7-6：清单7-5中代码的编译错误

发生了什么？在`mod hosting`之前添加`pub`关键字使得该模块变为公共的。通过这个更改，如果我们可以访问`front_of_house`，那么我们也可以访问`hosting`。但是，`hosting`的*内容*仍然是私有的；使模块公开不会使其内容公开。模块上的`pub`关键字只允许其祖先模块引用它，而不允许访问其内部代码。因为模块是容器，只是将模块公开是做不了什么的；我们需要进一步选择将模块内的一个或多个项目也设为公共。

清单7-6中的错误表明`add_to_waitlist`函数是私有的。隐私规则适用于结构体、枚举、函数和方法，以及模块。

让我们通过在`fn add_to_waitlist`定义之前添加`pub`关键字来使`add_to_waitlist`函数也成为公共的，如清单7-7所示。

文件名：src/lib.rs

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}


```

清单7-7：在`mod hosting`和`fn add_to_waitlist`之前添加`pub`关键字，使我们能够从`eat_at_restaurant`中调用该函数

现在代码将编译！为了查看为什么添加`pub`关键字使我们能够在`add_to_waitlist`中使用这些路径，让我们来看看绝对路径和相对路径。

在绝对路径中，我们从`crate`开始，即我们的crate的模块树的根。`front_of_house`模块在crate的根中定义。虽然`front_of_house`不是公共的，但由于`eat_at_restaurant`函数与`front_of_house`在同一模块中定义（即`eat_at_restaurant`和`front_of_house`是兄弟模块），因此我们可以从`eat_at_restaurant`引用`front_of_house`。接下来是用`pub`标记的`hosting`模块。我们可以访问`hosting`的父模块，因此我们可以访问`hosting`。最后，`add_to_waitlist`函数标记为`pub`，我们可以访问其父模块，因此此函数调用有效！

在相对路径中，逻辑与绝对路径相同，除了第一步：路径不是从crate的根开始，而是从`front_of_house`开始。`front_of_house`模块在与`eat_at_restaurant`定义的同一模块中定义，因此从定义`eat_at_restaurant`的模块开始的相对路径有效。然后，由于`hosting`和`add_to_waitlist`都标记为`pub`，其余路径有效，因此此函数调用也是有效的！

如果计划共享库crate，使其他项目能够使用您的代码，那么您的公共API就是与您的crate用户交互的契约，决定了他们如何与您的代码进行交互。围绕管理公共API的更改有许多考虑事项，以使人们更容易依赖于您的crate。这些考虑超出了本书的范围；如果您对此主题感兴趣，请参阅[Rust API准则](https://rust-lang.github.io/api-guidelines/)。

> #### [具有二进制和库的包的最佳实践](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html#best-practices-for-packages-with-a-binary-and-a-library)
>
> 我们提到一个包可以同时包含*src/main.rs*二进制crate根和*src/lib.rs*库crate根，而且两个crate默认都带有包名。通常，具有这种包含库和二进制crate的模式的包将在二进制crate中仅包含足够的代码来启动调用库crate中代码的可执行文件。这样可以使其他项目受益于包提供的大多数功能，因为库crate的代码可以共享。
>
> 模块树应该在*src/lib.rs*中定义。然后，可以通过以包名开头的路径在二进制crate中使用所有公共项。二进制crate成为库crate的用户，就像完全外部的crate使用库crate一样：它只能使用公共API。这有助于设计良好的API；您不仅是作者，还是客户！
>
> 在[第12章](https://doc.rust-lang.org/book/ch12-00-an-io-project.html)中，我们将使用一个包含二进制crate和库crate的命令行程序来演示这种组织实践。

### [使用`super`开始相对路径](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html#starting-relative-paths-with-super)

我们可以使用`super`在父模块中开始相对路径，而不是当前模块或crate的根模块。这就像在文件系统路径中使用`..`语法。使用`super`使我们能够引用我们知道在父模块中的项，这使得在将来模块与父模块密切相关但父模块可能在模块树的其他地方移动时重新排列模块树更加容易。

考虑清单7-8中的代码，它模拟了一个厨师修正错误的订单并亲自将其送到顾客手中的情况。`back_of_house`模块中定义的`fix_incorrect_order`函数通过指定以`super`开头的路径来调用父模块中定义的`deliver_order`函数：

文件名：src/lib.rs

```rust
fn deliver_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::deliver_order();
    }

    fn cook_order() {}
}
```

清单7-8：使用以`super`开头的相对路径调用函数

`fix_incorrect_order`函数位于`back_of_house`模块中，因此我们可以使用`super`转到`back_of_house`的父模块，该父模块在这种情况下是`crate`，即根模块。然后，我们寻找`deliver_order`并找到它。成功！我们认为`back_of_house`模块和`deliver_order`函数可能会保持相同的关系，并且如果我们决定重新组织crate的模块树，这些代码可能会一起移动。因此，我们使用`super`，这样将来如果这些代码移到其他模块，我们将有更少的地方需要更新代码。

### [使结构体和枚举成为公共的](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html#making-structs-and-enums-public)

我们也可以使用`pub`将结构体和枚举指定为公共的，但在使用`pub`与结构体和枚举时有一些额外的细节。如果我们在结构体定义前使用`pub`，我们将使结构体本身成为公共的，但结构体的字段仍然是私有的。我们可以根据需要单独将每个字段设置为公共或私有。在清单7-9中，我们定义了一个名为`back_of_house::Breakfast`的公共结构体，其中有一个公共字段`toast`，但还有一个私有字段`seasonal_fruit`。这模拟了餐厅中的情况，顾客可以选择搭配餐点的面包类型，但厨师根据当季和库存情况决定搭配的水果。可用的水果变化很快，因此顾客不能选择水果，甚至看到将获得的水果。

文件名：src/lib.rs

```rust
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,
        seasonal_fruit: String,
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    // 在夏天点一份早餐，要求用Rye面包
    let mut meal = back_of_house::Breakfast::summer("Rye");
    // 改变主意，想要Wheat面包
    meal.toast = String::from("Wheat");
    println!("I'd like {} toast please", meal.toast);

    // 如果我们取消注释下一行，将不能编译通过；我们不允许查看或修改搭配的季节性水果
    // meal.seasonal_fruit = String::from("blueberries");
}
```

清单7-9：带有一些公共字段和一些私有字段的结构体

由于`back_of_house::Breakfast`结构体中的`toast`字段是公共的，在`eat_at_restaurant`函数中，我们可以使用点号表示法对`toast`字段进行读写操作。请注意，我们不能在`eat_at_restaurant`函数中使用`seasonal_fruit`字段，因为`seasonal_fruit`是私有的。尝试取消对修改`seasonal_fruit`字段值的行的注释，查看会得到什么错误！

另外，请注意由于`back_of_house::Breakfast`有一个私有字段，结构体需要提供一个公共关联函数来构造`Breakfast`的实例（我们在这里命名为`summer`）。如果`Breakfast`没有这样的函数，我们就无法在`eat_at_restaurant`中创建`Breakfast`的实例，因为我们无法在`eat_at_restaurant`中设置私有字段`seasonal_fruit`的值。

相比之下，如果我们将枚举设为公共，那么其所有变体都将成为公共的。我们只需要在`enum`关键字前加上`pub`，如清单7-10所示。

文件名：src/lib.rs

```rust
mod back_of_house {
    pub enum Appetizer {
        Soup,
        Salad,
    }
}

pub fn eat_at_restaurant() {
    let order1 = back_of_house::Appetizer::Soup;
    let order2 = back_of_house::Appetizer::Salad;
}
```

清单7-10：将枚举指定为公共使其所有变体都成为公共的

由于我们将`Appetizer`枚举设为公共，因此我们可以在`eat_at_restaurant`中使用`Soup`和`Salad`变体。

除非枚举的变体是公共的，否则枚举并不是很有用；在每种情况下都需要为所有枚举变体添加`pub`注解会很麻烦，因此枚举变体的默认访问级别是公共的。结构体通常在字段不是公共的情况下也很有用，因此结构体字段遵循默认规则，即除非使用`pub`注解，否则所有字段都是私有的。

还有一个使用`pub`的情况我们尚未涉及，那就是最后一个模块系统特性：`use`关键字。我们先单独介绍`use`，然后再展示如何结合使用`pub`和`use`。