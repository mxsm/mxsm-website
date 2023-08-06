## [将模块拆分到不同文件中](https://doc.rust-lang.org/book/ch07-05-separating-modules-into-different-files.html#separating-modules-into-different-files)

到目前为止，本章中的所有示例都在一个文件中定义了多个模块。当模块变得很大时，您可能希望将它们的定义移动到单独的文件中，以便更容易浏览代码。

例如，让我们从清单7-17中的多个餐馆模块开始。我们将把这些模块提取到文件中，而不是在crate的根文件中定义所有模块。在这种情况下，crate的根文件是*src/lib.rs*，但是这个过程对于crate根文件是*src/main.rs*的二进制crate也是适用的。

首先，我们将把`front_of_house`模块提取到自己的文件中。删除`front_of_house`模块大括号内的代码，只留下`mod front_of_house;`声明，这样*src/lib.rs*文件将包含如清单7-21所示的代码。注意，在我们创建*src/front_of_house.rs*文件之前，这将无法编译。

文件名：src/lib.rs

```rust
mod front_of_house;

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

清单7-21：声明`front_of_house`模块，其主体将在*src/front_of_house.rs*中定义

接下来，将大括号内的代码放入一个名为*src/front_of_house.rs*的新文件中，如清单7-22所示。编译器会知道在这个文件中寻找，因为它在crate根中遇到了名为`front_of_house`的模块声明。

文件名：src/front_of_house.rs

```rust
pub mod hosting {
    pub fn add_to_waitlist() {}
}
```

清单7-22：在*src/front_of_house.rs*中定义的`front_of_house`模块中的项

请注意，您只需要使用`mod`声明*一次*加载一个文件在您的模块树中。一旦编译器知道文件是项目的一部分（并且由于您放置了`mod`语句而知道代码位于模块树的哪个位置），项目中的其他文件应该使用路径来引用已加载文件的代码，就像在[“在模块树中引用项的路径”](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html)部分介绍的那样。换句话说，`mod`不是其他编程语言中可能见过的“include”操作。

接下来，我们将把`hosting`模块提取到它自己的文件中。这个过程有点不同，因为`hosting`是`front_of_house`模块的子模块，而不是根模块的子模块。我们将`hosting`文件放在一个新目录中，该目录将以模块树中它的祖先命名，例如*src/front_of_house/*。

为了开始移动`hosting`，我们将*src/front_of_house.rs*更改为只包含`hosting`模块的声明：

文件名：src/front_of_house.rs

```rust
pub mod hosting;
```

然后我们创建一个*src/front_of_house*目录和一个名为*hosting.rs*的文件，其中包含`hosting`模块中的定义：

文件名：src/front_of_house/hosting.rs

```rust
pub fn add_to_waitlist() {}
```

如果我们将*hosting.rs*放在*src*目录中，编译器将期望*hosting.rs*代码在crate根中声明的`hosting`模块中，而不是声明为`front_of_house`模块的子模块。编译器对于检查哪些模块的代码应在哪些文件中的规则使得目录和文件更符合模块树。

> ### [备用文件路径](https://doc.rust-lang.org/book/ch07-05-separating-modules-into-different-files.html#alternate-file-paths)
>
> 到目前为止，我们已经介绍了Rust编译器使用的最惯用的文件路径，但是Rust也支持一种较旧的文件路径样式。对于在crate根中声明的名为`front_of_house`的模块，编译器将在以下路径中查找模块的代码：
>
> - *src/front_of_house.rs*（我们已经涵盖了这个）
> - *src/front_of_house/mod.rs*（较旧的样式，仍然支持的路径）
>
> 对于作为`front_of_house`的子模块的名为`hosting`的模块，编译器将在以下路径中查找模块的代码：
>
> - *src/front_of_house/hosting.rs*（我们已经涵盖了这个）
> - *src/front_of_house/hosting/mod.rs*（较旧的样式，仍然支持的路径）
>
> 如果您在同一个模块使用两种样式，将会收到编译器错误。在同一个项目中的不同模块使用这两种样式是允许的，但可能会让浏览您的项目的人感到困惑。
>
> 使用文件名为*mod.rs*的样式的主要缺点是，当您在编辑器中同时打开它们时，您的项目可能会有很多名为*mod.rs*的文件，这可能会让您感到困惑。

我们已经将每个模块的代码移到了单独的文件中，并且模块树保持不变。即使定义位于不同的文件中，`eat_at_restaurant`中的函数调用也会正常工作。这种技术允许您将模

块移到新文件中，以适应它们的增长。

请注意，*src/lib.rs*中的`pub use crate::front_of_house::hosting`语句也没有改变，而且`use`不会影响哪些文件作为crate的一部分进行编译。`mod`关键字声明了模块，Rust会在与模块同名的文件中查找代码，以放入该模块中。 

## [小结](https://doc.rust-lang.org/book/ch07-05-separating-modules-into-different-files.html#summary)

Rust允许您将一个包分成多个crate，并将crate分成模块，以便您可以从一个模块中引用另一个模块中定义的项。您可以通过指定绝对或相对路径来实现此目的。这些路径可以通过`use`语句引入作用域，以便在该作用域中使用较短的路径来多次引用该项。模块代码默认情况下是私有的，但是您可以通过添加`pub`关键字来使定义变为公共的。

在下一章中，我们将介绍标准库中的一些集合数据结构，您可以在整洁有序的代码中使用它们。