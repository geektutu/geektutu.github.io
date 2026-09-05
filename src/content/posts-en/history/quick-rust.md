---
title: "A Gentle Introduction to Rust"
description: >-
  Rust is a systems programming language balancing safety, speed and
  concurrency. This tutorial covers Rust and Cargo installation, basic types
  (strings, ints), control flow (if, if let, while let, loop, for),
  composite types (struct, enum), error handling (panic, Result), Cargo
  project layout and testing Rust code.
date: '2019-11-24 23:59:10'
tags:
  - Rust
book: history
status: done
draft: false
cover: ../../posts/history/quick-rust/rust.jpg
---

Rust is a systems programming language that balances safety, speed, and concurrency. As a low-level systems language, Rust can in theory be used anywhere C/C++ is used — for example, embedded programming that requires fine-grained hardware control, or performance-critical applications (database engines, browser engines, 3D rendering engines, and so on). Compared with the systemic flaws of C/C++ (security vulnerabilities caused by poor memory management), Rust guarantees memory safety at compile time through its ownership mechanism, with no need for garbage collection (GC) and no manual memory deallocation.

## 1. Hello World

### 1.1 Installing Rust

- Install online
    - Windows: download [rustup-init.exe](https://rust-lang.org/tools/install) and follow the guided installation.
    - Linux: *curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh*

- Install offline
    - Download a [standalone installer](https://forge.rust-lang.org/infra/other-installation-methods.html#standalone-installers)
    - Windows: download the .msi file and double-click to install.
    - Linux: download the .tar.gz file, extract it with *tar -xvf xxx.tar.gz*, then run install.sh.

- Check the version

```bash
$ rustc --version
rustc 1.39.0 (4560ea788 2019-11-04)
$ cargo --version
cargo 1.39.0 (1c6ec66d5 2019-09-30)
```

### 1.2 Your First Rust Program

```rust
fn main() {
    println!("Hello, world!");
}
```

Functions are declared with `fn`. As in most programming languages, `main()` is the entry point of a Rust program. `println!` prints text to the console, and the `!` indicates that it is a macro, not a function.

- Save the file as hello_world.rs — rs is the Rust file extension.
- Compile: *rustc hello_world.rs*.
- Run: *./hello_world* (Linux) or *hello_world.exe* (Windows).

Try a few more ways to use *println!*.

```rust
fn main() {
    println!("{}, {}!", "Hello", "world"); // Hello, world!
    println!("{0}, {1}!", "Hello", "world"); // Hello, world!
    println!("{greeting}, {name}!", greeting="Hello", name="world"); // Hello, world!
    
    let y = String::from("Hello, ") + "world!";
    println!("{}", y); // Hello, world!
}
```

The code above prints

```rust
Hello, world!
Hello, world!
Hello, world!
Hello, world!
```

### 1.3 Using Cargo

To make debugging and learning easier later on, let's first introduce Rust's built-in package manager and build system, `Cargo`. [crates.io](https://crates.io/) is Rust's community registry.

- Create a new project: *cargo new <crate_name>*
- Build: *cargo build*
- Run: *cargo run*
- Update dependencies: *cargo update*
- Run tests: *cargo test*
- Generate documentation: *cargo doc*
- Static check: *cargo check*

- Create a new binary (executable) project

```bash
$ cargo new tutu --bin
$ cd tutu && tree
├── Cargo.toml
└── src
    └── main.rs
```

Write the following into main.rs

```rust
fn main() {
    println!("Hello, Cargo!");
}
```

Run *cargo run* in the project directory

```bash
$ cargo run
 tutu git:(master) ✗ cargo run
   Compiling tutu v0.1.0 (/xxx/demo/tutu)
    Finished dev [unoptimized + debuginfo] target(s) in 0.49s
     Running `target/debug/tutu`
Hello, Cargo!
```

- Create a new library project

```bash
$ cargo new tutu --lib
$ cd tutu && tree
├── Cargo.toml
└── src
    └── lib.rs
```

- Cargo.toml is the project's manifest file, containing all the metadata Cargo needs.
- src holds the source code.
- main.rs / lib.rs are the entry files.

Running *cargo run* or *cargo build* generates the executable in target/debug/, while running *cargo build --release* generates it in target/release/.

## 2 Basic Concepts

### 2.1 Comments

```rust

/// outer comment
mod test {
    // line comment
    /* block comment */
}


mod test {
    //! package/module-level comment

    // ...
}
```

> `///` is used outside a mod block, while `//!` writes package/module-level comments.
> Comments support markdown syntax; use *cargo doc* to generate HTML documentation.

### 2.2 Variables

- Local variables

In Rust, variables are immutable by default — they are called variable bindings, and the `mut` keyword marks them as mutable.

Variables declared with let are local variables. They may be declared without initialization as long as they are initialized before use. Rust is a statically typed language and checks types at compile time, but you can omit the type when declaring a variable with let — the compiler will infer a suitable one.


```rust
// Immutable
let c;
let a = true;
let b: bool = true;
let (x, y) = (1, 2);
c = 12345;

// Mutable
let mut z = 5;
z = 6;
```

- Global variables

In Rust you can declare global variables with static. A variable declared with static lives for the entire program, from startup to exit; the memory it occupies is fixed and is not reclaimed during execution. In addition, a static declaration must state the type explicitly — type inference is not supported. Global variables must be initialized at declaration, and the initialization must be a simple assignment: no complex expressions, statements, or function calls.

```rust
// Static variable (immutable)
static N: i32 = 5;

// Static variable (mutable)
static mut N: i32 = 5;
```

- Constants

Constants declared with const also live for the entire program. The biggest difference between const and static is that the compiler does not necessarily allocate memory for a const — during compilation it will very likely be inlined as an optimization, similar to C's macro definitions.

```rust
const N: i32 = 5;
```

### 2.3 Functions

Functions are declared with `fn`.

```rust
fn main() {
    println!("Hello, world!");
}
```

Parameter types must be specified

```rust
fn print_sum(a: i8, b: i8) {
    println!("sum is: {}", a + b);
}
```

The default return value is the empty tuple `()`. If a function returns a value, specify the return type with `->`.

```rust
fn plus_one(a: i32) -> i32 {
    a + 1
    // equivalent to return a + 1; can be shortened to a + 1
}
```

You can use a tuple to return multiple values

```rust
fn plus_one(a: i32) -> (i32, i32) {
    (a, &a + 1)
}

fn main() {
    let (add_num, result) = plus_one(10);
    println!("{} + 1 = {}", add_num, result); // 10 + 1 = 11
}
```

Function pointers can also be used as variables

```rust
let b = plus_one;
let c = b(5); //6
```

### 2.4 Primitive Data Types

- Booleans (bool)
- Characters (char)
- Signed integers (i8, i16, i32, i64, i128)
- Unsigned integers (u8, u16, u32, u64, u128)
- Pointer-sized signed/unsigned integers (isize/usize; the size depends on the machine architecture — on a 32-bit system, isize is equivalent to i32)
- Floating-point numbers (f32, f64)
- Arrays: composed of elements of the same type, with a fixed length.

```rust
let a = [1, 2, 3]; // a[0] = 1, a[1] = 2, a[2] = 3
let mut b = [1, 2, 3];

let c: [int; 3] = [1, 2, 3]; // [type; array length]

let d: ["my value"; 3]; //["my value", "my value", "my value"];

let e: [i32; 0] = []; // empty array

println!("{:?}", a); //[1, 2, 3]
```

The length of an array is fixed; for dynamic/variable-length arrays, use `Vec` (not a primitive type).

- Tuples: composed of elements of the same or different types, with a fixed length.

```rust
let a = (1, 1.5, true, 'a', "Hello, world!");
// a.0 = 1, a.1 = 1.5, a.2 = true, a.3 = 'a', a.4 = "Hello, world!"

let b: (i32, f64) = (1, 1.5);

let (c, d) = b; // c = 1, d = 1.5
let (e, _, _, _, f) = a; //e = 1, f = "Hello, world!", _ is a placeholder meaning that position is ignored

let g = (0,); // a tuple containing a single element

let h = (b, (2, 4), 5); //((1, 1.5), (2, 4), 5)

println!("{:?}", a); //(1, 1.5, true, 'a', "Hello, world!")
```

A tuple's length is also fixed, and when you update an element inside a tuple, the new value must have the same type as the previous one.

- Slices: pointers into a region of memory.

A slice does not copy the original array; it merely points to a contiguous part of it and behaves like an array. To access the array/data structure a slice points to, use the `&` operator.

```rust
let a: [i32; 4] = [1, 2, 3, 4];

let b: &[i32] = &a; // all of it
let c = &a[0..4]; // [0, 4)
let d = &a[..]; // all of it

let e = &a[1..3]; // [2, 3]
let e = &a[1..]; // [2, 3, 4]
let e = &a[..3]; // [1, 2, 3]
```

- Strings (str)

In Rust, `str` is a statically allocated, immutable UTF-8 byte sequence of unknown length. `&str` is a slice pointing to that string.

```rust
let a = "Hello, world!"; //a: &'static str
let b: &str = "Hello, world!";
```

The string a `&str` slice points to is statically allocated. Rust also has a separate heap-allocated, growable string type, `String` (not a primitive type). It is usually obtained by converting a `&str` with the *to_string()* or *String::from()* methods.

```rust
let s1 = "Hello, world!".to_string();
let s2 = String::from("Hello, world!");
```

- Functions

Function pointers are also primitive types and can be assigned to other variables.

### 2.5 Operators

- Arithmetic operators

```rust
+ - * / %
let a = 5;
let b = a + 1; //6
let c = a - 1; //4
let d = a * 2; //10
let e = a / 2; // ⭐️ 2 not 2.5
let f = a % 2; //1

let g = 5.0 / 2.0; //2.5
```

- Comparison operators

```rust
== = != < > <= >=
let a = 1;
let b = 2;

let c = a == b; //false
let d = a != b; //true
let e = a < b; //true
let f = a > b; //false
let g = a <= a; //true
let h = a >= a; //true

let i = true > false; //true
let j = 'a' > 'A'; //true
```

- Logical operators

```rust
 ! && ||
let a = true;
let b = false;

let c = !a; //false
let d = a && b; //false
let e = a || b; //true
```

- Bitwise operators

```rust
& | ^ << >>
let a = 1;
let b = 2;

let c = a & b; //0  (01 && 10 -> 00)
let d = a | b; //3  (01 || 10 -> 11)
let e = a ^ b; //3  (01 != 10 -> 11)
let f = a << b; //4  (left shift -> '01'+'00' -> 100)
let g = a >> a; //0  (right shift -> o̶1̶ -> 0)
```

- Assignment operators

```rust
let mut a = 2;

a += 5; //2 + 5 = 7
a -= 2; //7 - 2 = 5
a *= 5; //5 * 5 = 25
a /= 2; //25 / 2 = 12 not 12.5
a %= 5; //12 % 5 = 2

a &= 2; //10 && 10 -> 10 -> 2
a |= 5; //010 || 101 -> 111 -> 7
a ^= 2; //111 != 010 -> 101 -> 5
a <<= 1; //'101'+'0' -> 1010 -> 10
a >>= 2; //101̶0̶ -> 10 -> 2
```

- Type-cast operator: as

```rust
let a = 15;
let b = (a as f64) / 2.0; //7.5
```

- Borrowing and dereference operators

Rust introduces the concept of ownership, and on top of references it derives the concept of borrowing; ownership itself is not covered here.

Briefly: a reference creates an alias for an existing variable; taking a reference as a function argument is called borrowing; and dereferencing is the opposite of referencing — it returns the variable the reference points to.

```rust
// Reference/borrow: & &mut

fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);
    println!("The length of '{}' is {}.", s1, len); // The length of 'hello' is 5.
}

fn calculate_length(s: &String) -> usize { // taking a reference as a function argument is called borrowing
    s.len()
}
```

```rust
// Dereference: *

fn main() {
    // get a mutable reference to the element at index 2 of v, and modify its value through the dereference
    let v = &mut [1, 2, 3, 4, 5];
    {
        let third  = v.get_mut(2).unwrap();
        *third += 50;
    }
    println!("v={:?}", v); // v=[1, 2, 53, 4, 5]
}
```

> [References and Borrowing — The Rust Book](https://doc.rust-lang.org/stable/book/ch04-02-references-and-borrowing.html)
> [What is Ownership — The Rust Book](https://doc.rust-lang.org/stable/book/ch04-01-what-is-ownership.html)

### 2.6 Control Flows

- if - else if - else

```rust
let team_size = 7;
if team_size < 5 {
    println!("Small");
} else if team_size < 10 {
    println!("Medium");
} else {
    println!("Large");
}

// when the branches return values, the types must match; this can replace C's ternary operator
let is_below_eighteen = if team_size < 18 { true } else { false };
```

- match

It can replace C's `switch case`.

```rust
let tshirt_width = 20;
let tshirt_size = match tshirt_width {
    16 => "S", // check 16
    17 | 18 => "M", // check 17 and 18
    19 ... 21 => "L", // check from 19 to 21 (19,20,21)
    22 => "XL",
    _ => "Not Available",
};
println!("{}", tshirt_size); // L
```

`_` matches any remaining case.

- while

```rust
let mut a = 1;
while a <= 10 {
	println!("Current value : {}", a);
	a += 1; // Rust does not support ++/-- increment/decrement syntax
}
```

- loop

Similar to C's `while(1)`

```rust
let mut a = 0;
loop {
	if a == 0 {
        println!("Skip Value : {}", a);
        a += 1;
        continue;
	} else if a == 2 {
	    println!("Break At : {}", a);
        break;
    }
	println!("Current Value : {}", a);
	a += 1;
}

// Skip Value : 0
// Current Value : 1
// Break At : 2
```

- for

```rust
for a in 0..10 { //(a = 0; a <10; a++)
    println!("Current value : {}", a);
}

'outer_for: for c1 in 1..6 { //set label outer_for
    'inner_for: for c2 in 1..6 {
        println!("Current Value : [{}][{}]", c1, c2);
        if c1 == 2 && c2 == 2 { break 'outer_for; } // exit the outer loop
    }
}

let group : [&str; 4] = ["Mark", "Larry", "Bill", "Steve"];
for person in group.iter() {
    println!("Current Person : {}", person);
}
```

Labeled breaks like `break 'outer_for` in a for expression work the same way in loop and while.

## 3. Other Data Types

### 3.1 Structs

Like tuples, structs can combine different data types, but unlike tuples, each piece of data in a struct is named to mark its meaning. Structs are therefore more flexible than tuples: you don't rely on order to specify or access values in an instance.

- Defining a struct

```rust
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}
```

- Creating an instance

```rust
let user1 = User {
    email: String::from("someone@example.com"),
    username: String::from("someusername123"),
    active: true,
    sign_in_count: 1,
};
```

- Changing a field's value

```rust
let mut user1 = User {
    email: String::from("someone@example.com"),
    username: String::from("someusername123"),
    active: true,
    sign_in_count: 1,
};

user1.email = String::from("anotheremail@example.com");
```

- Field init shorthand when variable names match field names

```rust
fn build_user(email: String, username: String) -> User {
    User {
        email,
        username,
        active: true,
        sign_in_count: 1,
    }
}
```

- Tuple structs

Tuple structs carry the meaning conveyed by the struct's name but have no concrete field names. When there are few fields, and the fields have no names yet strong semantics from their positions alone, naming each field would be redundant. For example:

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32);

let black = Color(0, 0, 0);
let origin = Point(3, 4);
```

VS

```rust
struct Point {
    x: i32
    y: i32
}
let origin = Point {
    x: 3
    y: 4
}
```

### 3.2 Enums

- Defining an enum

```rust
enum IpAddrKind {
    V4,
    V6,
}
```

- Using enum values

```rust
let four = IpAddrKind::V4;

fn route(ip_type: IpAddrKind) { }
route(four);
route(IpAddrKind::V6);
```

- Storing data in enum variants

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

let home = IpAddr::V4(127, 0, 0, 1);

let loopback = IpAddr::V6(String::from("::1"));
```

A more complex example

```rust
enum Message {
    Quit, // no data attached
    Move { x: i32, y: i32 }, // anonymous struct
    Write(String),
    ChangeColor(i32, i32, i32),
}
```

- match control flow

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}


fn value_in_cents(coin: Coin) -> u32 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        },
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

- Option

Option is a very important enum type defined in the standard library. The Option type is widely used because it encodes a very common scenario: a value is either there or it isn't. In Rust, a variable must be assigned a valid value before it is used — there is no null — so when you use a variable of any type, the compiler guarantees it always holds a valid value, and you can use it confidently without any checks. If a value might be absent, you must express that explicitly with `Option<T>`.

Option is defined as follows:

```rust
pub enum Option<T> {
    Some(T),
    None,
}
```

`Option<T>` has two variants:

1) None — indicates failure or no value
2) Some(value) — a tuple struct wrapping a value of type T

Thanks to `Option`, Rust does not allow a possibly-null value to work like a normal valid value — this is caught at compile time. Rust is safer: you don't have to worry about null-pointer bugs that only surface at runtime in other languages. For example:

```rust
let x: i8 = 5; // Rust has no null, so an i8 can only be assigned a valid value.
let y: Option<i8> = Some(5); // y may be absent, so it must be explicitly expressed as the Option enum
let sum = x + y;
```

If you try to add `x: i8`, which can never hold an invalid value, to `y: Option<i8>`, which might, the compiler reports an error:

```bash
error[E0277]: the trait bound `i8: std::ops::Add<std::option::Option<i8>>` is
not satisfied
 -->
  |
5 |     let sum = x + y;
  |                 ^ no implementation for `i8 + std::option::Option<i8>`
  |
```

To summarize: if a value may be absent, you must use the enum type `Option<T>`; otherwise, it must be assigned a valid value. And to use an `Option<T>`, you need to write code that handles each variant: when *T* holds a valid value, you can take the *T* value out of *Some(T)* and use it; if *T* is invalid, you can handle it some other way. *match* is usually used for this.

For example, return the sum of x and y when y holds a valid value, and return x when it is None:

```rust
fn plus(x: i8, y: Option<i8>) -> i8 {
    match y {
        None => x,
        Some(i) => x + i,
    }
}

fn main() {
    let y1: Option<i8> = Some(5);
    let y2: Option<i8> = None;
    
    let z1 = plus(10, y1);
    let z2 = plus(10, y2);
    
    println!("z1={}, z2={}", z1, z2); // z1=15, z2=10
}
```

- if let control flow

*match* has one simple scenario that can be abbreviated as `if let`. In the following, when y holds a value we print the sum; when y is None, we do nothing.

```rust
fn plus(x: i8, y: Option<i8>) {
    match y {
        Some(i) => { println!("x + y = {}", x + i) },
        None => {},
    }
}

fn main() {
    let y1: Option<i8> = Some(5);
    let y2: Option<i8> = None;
    
    plus(10, y1); // x + y = 15
    plus(10, y2);
}
```

Abbreviated as `if let`, it becomes

```rust
fn plus(x: i8, y: Option<i8>) {
    if let Some(i) = y {
        println!("x + y = {}", x + i);
    }
}
```

What if we just use `if`?

```rust
fn plus(x: i8, y: Option<i8>) {
    if y.is_some() {
        let i = y.unwrap(); // get the T value inside Some.
        println!("x + y = {}", x + i);
    }
}
```

An `if let` statement can also include an `else`.

```rust
fn plus(x: i8, y: Option<i8>) {
    if let Some(i) = y {
        println!("x + y = {}", x + i);
    } else {
        println!("y is None");
    }
}

// equivalent to

fn plus(x: i8, y: Option<i8>) {
    match y {
        Some(i) => { println!("x + y = {}", x + i) },
        None => { println!("y is None") },
    }
}
```

### 3.3 Methods and Traits (impl & traits)

- Implementing methods (impl)

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

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

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );
}
```

- Associated functions

Associated functions do not take `self` as a parameter. They are functions rather than methods because they do not operate on an instance of a struct. *String::from*, which we used earlier to create strings, is an associated function. Associated functions are often used as constructors that return a new instance of a struct. For example, we could provide an associated function that takes a single dimension and uses it for both width and height, making it easier to create a square Rectangle without specifying the same value twice:

```rust
impl Rectangle {
    fn square(size: u32) -> Rectangle {
        Rectangle { width: size, height: size }
    }
}

let rect2 = Rectangle::square(10);
```

- Implementing traits

```rust
trait Summary {
    fn summarize(&self) -> String;
}

impl Summary for Rectangle {
    fn summarize(&self) -> String {
        format!("{{width={}, height={}}}", self.width, self.height)
    }
}

// traits also support inheritance
trait Person {
    fn full_name(&self) -> String;
}

trait Employee : Person { //Employee inherit from person trait
    fn job_title(&self) -> String;
}

trait Expat {
    fn salary(&self) -> f32
}

trait ExpatEmployee : Employee + Expat { // multiple inheritance: inherits from both Employee and Expat
    fn additional_tax(&self) -> f64;
}
```

### 3.3 Generics

When we implement a function or data structure, we often want the parameters to support different types — generics solve this problem. Replace the parameter type with an uppercase letter, such as T, and use `<T>` to tell the compiler that *T* is a generic.

- Generics in functions

```rust
fn largest<T>(list: &[T]) -> T {
    let mut largest = list[0];

    for &item in list.iter() {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest(&char_list);
    println!("The largest char is {}", result);
}
```

- Generics in structs

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let integer = Point { x: 5, y: 10 };
    let float = Point { x: 1.0, y: 4.0 };
}
```

- Generics in enums

```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

The Result enum has two generic types, T and E. Result has two variants: Ok, which holds a value of type T, and Err, which holds a value of type E. This definition lets the Result enum conveniently express any operation that may succeed (returning a value of type T) or fail (returning a value of type E). Recall the file-opening scenario from Listing 9-3: when the file is opened successfully, T is filled with a *std::fs::File*; when something goes wrong opening the file, E is filled with a *std::io::Error*.

- Generics in methods

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

fn main() {
    let p = Point { x: 5, y: 10 };

    println!("p.x = {}", p.x());
}
```



### 3.4 Common Collections: Vec

- Creating

```rust
let v: Vec<i32> = Vec::new();  // empty vector
// let v = vec![1, 2, 3];  // vector with initial values; vec! is a macro provided for conveniently initializing a Vec.

println!("third element {}", &v[2]); // 3
println!("100th element {}", &v[100]); // panic error

assert_eq!(v.get(2), Some(&3));
assert_eq!(v.get(100), None);
```

Both v.get(2) and &v[2] can retrieve a value from a Vec. The difference is that &v[2] returns a reference to the element, and referencing a position that doesn't exist causes an error, whereas v.get(2) returns the enum type `Option<&T>`: v.get(2) returns *Some(&3)*, and v.get(100) returns *None*.

- Updating

```rust
let v: Vec<i32> = Vec::new();
v.push(5);
v.push(6);
v.push(7);
v.push(8);
v.pop() // removes the last element
```

- Iterating

```rust
let v = vec![100, 32, 57];
for i in &v {
    println!("{}", i);
}

let mut v2 = vec![100, 32, 57];
for i in &mut v2 {
    *i += 50;
}
```

- if let control flow

What if we want to modify the value of the element at index 2 in a `Vec`? We can write:

```rust
fn main() {
    let mut v = vec![1, 2, 3, 4, 5];
    {
        let third  = v.get_mut(2).unwrap();
        *third += 50;
    }
    println!("v={:?}", v); // v=[1, 2, 53, 4, 5]
}
```

Since the return value of v.get_mut() is the enum type `Option<T>`, we can use `if let` to simplify the code.

```rust
fn main() {
    let mut v = vec![1, 2, 3, 4, 5];
    if let Some(third) = v.get_mut(2) {
        *third += 50;
    }
    println!("v={:?}", v); // v=[1, 2, 53, 4, 5]
}
```

- while let control flow

`if let` fits the single-element scenario, while `while let` suits iteration.

```rust
let mut stack = vec![1, 2, 3, 4, 5];
while let Some(top) = stack.pop() {
    println!("{}", top); // prints 5 4 3 2 1 in turn
}
```

> For more usage, see [Vec — official documentation](https://doc.rust-lang.org/std/vec/struct.Vec.html)

### 3.5 Common Collections: String

The core language has only one string type: `str`, the string slice, which usually appears in its borrowed form, `&str`. The string type discussed here is a collection of bytes plus implementations of some commonly used methods. Because it is a collection, it supports adding, removing, and modifying elements, and its length can change.

- Creating

```rust
let mut s1 = String::new();
let s2 = "initial contents".to_string();
let s3 = String::new();
```

- Updating

```rust
let mut s = String::from("foo");
s.push_str("bar"); // append a string
s.push('!') // append a single character
assert_eq!(s.remove(0), 'f'); // remove the character at a given position

let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2;
```

- format

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{}-{}-{}", s1, s2, s3);
println!("{}", s); // tic-tac-toe
```

- Indexing

```rust
let v = String::from("hello");
assert_eq!(Some('h'), v.chars().nth(0));
```

- Iterating

```rust
let v = String::from("hello");
for c in v.chars() {
    println!("{}", c);
}
```

Internally, String is a wrapper over a `Vec<u8>`, but some characters may occupy more than 2 bytes, so `String` does not support direct indexing; if you need to index, convert it with *chars()* first.

> See [String — official documentation](https://doc.rust-lang.org/std/string/struct.String.html)

### 3.6 Common Collections: HashMap

- Creating

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);
```

Here `use` brings the `HashMap` struct into scope.

- Accessing

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

let team_name = String::from("Blue");
let score = scores.get(&team_name);
```

- Updating

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10); // 10
scores.insert(String::from("Blue"), 25); // 25
// with entry: if Blue exists, the value is not updated; if it doesn't exist, it is inserted — so scores['Blue'] remains 25
scores.entry(String::from("Blue")).or_insert(50); 
```

> See [HashMap — official documentation](https://doc.rust-lang.org/std/collections/struct.HashMap.html)

## 4 Error Handling

### 4.1 Unrecoverable Errors: panic!

Rust has the panic! macro. When it executes, the program prints an error message, unwinds and cleans up the stack data, and then exits. This usually means the program has run into something it doesn't know how to handle.

- Calling it directly

```rust
fn main() {
    panic!("crash and burn");
}
```

Running *cargo run* prints

```bash
$ cargo run
Compiling tutu v0.1.0 (/xxx/demo/tutu)
    Finished dev [unoptimized + debuginfo] target(s) in 0.28s
     Running `target/debug/tutu`
thread 'main' panicked at 'crash and burn', src/main.rs:2:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace.
```

The last two lines contain the error message caused by `panic!`; the first line, src/main.rs:2:5, is where `panic!` appears in the source.

- Errors caused by code bugs

```rust
fn main() {
    let v = vec![1, 2, 3];

    v[99]; // out of bounds
}
```

As before, the error output of *cargo run* is only two lines and lacks the function call stack. To make locating the problem easier, you can set the *RUST_BACKTRACE* environment variable to get more stack information — in Rust this is called a `backtrace`. From the backtrace, you can see the list of all functions that were called up to the point of execution.

For example, run *RUST_BACKTRACE=1 cargo run*; the advantage of this approach is that the environment variable only applies to the current command.

```bash
$ RUST_BACKTRACE=1 cargo run
Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/tutu`
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', /rustc/xxx/src/libcore/slice/mod.rs:2717:10
stack backtrace:
   0: backtrace::backtrace::libunwind::trace
             at /cargo/registry/src/github.com-1ecc6299db9ec823/backtrace-0.3.37/src/backtrace/libunwind.rs:88
  ...
  17: <alloc::vec::Vec<T> as core::ops::index::Index<I>>::index
             at /rustc/xxx/src/liballoc/vec.rs:1796
  18: tutu::main
             at src/main.rs:4
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.
```

The first line of the error message explains the cause: out of bounds. Right after it, the function call stack is printed: src/main.rs:4 -> liballoc/vec.rs:1796 -> ...

On Windows, you can run *set RUST_BACKTRACE=1 && cargo run*.

- release

When a panic occurs, the program starts unwinding by default, which means Rust walks back up the stack and cleans up the data of every function it encounters — but this unwinding and cleanup is a lot of work. The alternative is to abort directly, which exits the program without cleaning up. The memory the program used is then cleaned up by the operating system.

In release mode, if you want the binary to be as small as possible, you can set panic to abort in `Cargo.toml`.

```ini
[profile.release]
panic = "abort"
```

### 4.2 Recoverable Errors: Result

- Handling a Result

Some errors you want to catch and handle. Rust provides the `Result` mechanism for recoverable errors, similar to `try catch` in other languages.

Here is the definition of `Result<T, E>`

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Some functions return a `Result`. So how do you know whether a function's return value is a `Result`? It's simple!

```rust
fn main(){
    let f: u32 = File::create("hello.txt");
}
```

When we compile the code above, it reports an error.

```bash
 = note: expected type `u32`
             found type `std::result::Result<std::fs::File, std::io::Error>`
```

The error message shows that *File::create* returns a `Result<fs::File, io::Error>` object; if nothing goes wrong, we can get the file handle from `Result::Ok<T>`.

Here is a complete example: create the file hello.txt and try to write "Hello, world!" to it.

```rust
use std::fs::File;
use std::io::prelude::*;

fn main() {
    let f = File::create("hello.txt");

    let mut file = match f {
        Ok(file) => file,
        Err(error) => {
            panic!("Problem create the file: {:?}", error)
        },
    };
    match file.write_all(b"Hello, world!") {
        Ok(()) => {},
        Err(error) => {
            panic!("Failed to write: {:?}", error)
        }
    };
}
```

If it runs successfully, you will see a new hello.txt file in the project root.

- unwrap and expect

Handling a `Result` can sometimes be too tedious, so Rust provides a concise alternative: *unwrap*. If it succeeds, the value inside `Result::Ok<T>` is returned directly; if it fails, panic! is called and the program ends.

```rust
let f = File::open("hello.txt").unwrap(); // on success, f is assigned the file handle; on failure, the program ends.
```

*expect* is a friendlier option: it allows you to attach a custom message when panic! is called, which is very helpful for debugging.

```rust
let f = File::open("hello.txt").expect("Failed to open hello.txt");
```

- Returning a Result

We can write functions like *File::open* that let callers decide for themselves how to handle success/failure.

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut s = String::new();

    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}
```

If the function above succeeds, it returns the text of hello.txt as a string; if it fails, it returns an `io::Error`.

- A simpler implementation

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

This version uses the `?` operator to return errors to the caller.

How it works: if the value of a `Result` is Ok, the expression returns the value inside Ok and the program continues. If the value is an Error, the error value is returned as the return value of the whole function, as if the `return` keyword had been used. Written this way, the logic is much clearer.


## 5 Packages, Crates, and Modules

### 5.1 Packages and Crates

```bash
.
├── Cargo.lock
├── Cargo.toml
├── benches
│   └── large-input.rs
├── examples
│   └── simple.rs
├── src
│   ├── bin
│   │   └── another_executable.rs
│   ├── lib.rs
│   └── main.rs
└── tests
    └── some-integration-tests.rs
```

A Cargo project is a package. A package contains at least one crate; it may contain zero or more binary crates, but only one library crate. src/main.rs is the crate root of the binary crate with the same name as the package, and the roots of any other binary crates are placed in the src/bin directory; src/lib.rs is the crate root of the library crate with the same name as the package.

### 5.2 Modules

Modules let us group the code within a crate to improve readability and reusability. They define whether an item is public (usable by external code) or part of the internal implementation, not usable by external code (private).

- Declaring modules

In Rust, modules are declared with mod. Modules can be nested, and module names can be used as paths. For example:

```rust
// src/main.rs

mod math {
    mod basic {
        fn plus(x: i32, y: i32) -> i32 { x + y}
        fn mul(x: i32, y: i32) -> i32 { x * y}
    }
}

fn main() {
    println!("2 + 3 = {}", math::basic::plus(2, 3));
    println!("2 * 3 = {}", math::basic::mul(2, 3));
}
```

- Bringing paths into scope

Use `use` to bring a path into scope.

We declare a module in src/lib.rs and call it from src/main.rs.

```rust
// src/lib.rs

pub mod greeting {
    pub fn hello(name: &str) { println!("Hello, {}", &name) } // only pub makes it visible outside
}
```

```rust
// src/main.rs

use tutu;

fn main() {
    tutu::greeting::hello("Jack"); // Hello, Jack
}
```

The length of the path is up to you; it could also be written as

```rust
// src/main.rs

use tutu::greeting;

fn main() {
    greeting::hello("Jack");
}
```

src/main.rs and src/lib.rs belong to different crates, so when bringing the path into scope, you must include the package name *tutu*.

- Splitting modules into files

You can declare multiple modules in src/lib.rs with `mod`, but sometimes for readability it is the custom to put each module in its own file.

Create src/greeting.rs and write

```rust
// src/greeting.rs

pub fn hello(name: &str) { println!("Hello, {}", &name) }
```

In src/lib.rs, you can then use it like this,

```rust
// src/lib.rs
pub mod greeting;

pub fn func() {
    greeting::hello("Tom");
}
```

The key is the line `mod greeting;`: `mod greeting` is followed by no implementation, only a semicolon, which declares that the contents of the greeting module are located in src/greeting.rs.

Other crates, such as src/main.rs, use it exactly the same way as before.

```rust
// src/main.rs

use tutu::greeting;

fn main() {
    greeting::hello("Jack");
}
```

## 6 Testing

### 6.1 Unit Tests

```rust
fn plus(x: i32, y: i32) -> i32 {
    x + y
}

fn main() {
    let x = 10;
    let y = 20;
    println!("{} + {} = {}", x, y, plus(x, y))
}

#[test]
fn it_works() {
    assert_eq!(4, plus(2, 2), );
}
```

Unit tests are very simple: just add `#[test]` before each test case and run them with *cargo test*.

```bash
$ cargo test
running 1 test
test it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

The more idiomatic approach is to create, inside each source file, a tests module containing the test functions, put the test cases in that module, and annotate the module with `cfg(test)`.

```rust
fn plus(x: i32, y: i32) -> i32 {
    x + y
}

fn main() {
    println!("2 + 3 = {}", plus(2, 3));
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn it_works() {
        assert_eq!(4, plus(2, 2), );
    }
}
```

Because internal test code lives in the same file as the source, the `#[cfg(test)]` annotation is needed to tell Rust to compile and run the test code only when cargo test is executed; this saves time when building the library and reduces the size of the compiled artifacts.

The advantage of unit tests is that they can test private functions. Tests in a separate directory, such as tests, are only allowed to test public interfaces — modules and functions marked with `pub`.

### 6.2 Integration Tests

Integration test cases live in a different directory from the source, so the modules and functions in the source are completely external to them; they can only call the public API the library exposes. Cargo expects the integration test code in the tests directory at the project root, and compiles each file in tests as a separate `crate`.

Only the library crate exposes functions for other crates to call, so functions defined in src/main.rs cannot be imported via `extern crate` and therefore cannot be integration-tested.

src/main.rs defines the main function, i.e. the entry point of an executable, which is meant to run on its own rather than to provide an interface for other crates to call.

We move the *plus* function into src/lib.rs and create tests/test_lib.rs. The final directory structure is as follows

```bash
├── Cargo.toml
├── src
│   └── lib.rs
│   └── main.rs
├── tests
    └── test_lib.rs
```

```rust
// src/lib.rs
pub fn plus(x: i32, y: i32) -> i32 { // plus must be a public API to be integration-tested.
    x + y
}
```

```
// src/main.rs

use tutu;

fn main() {
    println!("2 + 3 = {}", tutu::plus(2, 3));
}
```

```rust
// tests/test_lib.rs

use tutu;

#[test]
fn it_works() {
    assert_eq!(4, tutu::plus(2, 2));
}
```

Running *cargo test* outputs

```rust
running 1 test
test it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

## References

- [The Rust Book](https://doc.rust-lang.org/stable/book/)
- [Rust Standard Library Documentation](https://doc.rust-lang.org/stable/std)
- [Cargo Documentation](https://doc.rust-lang.org/stable/cargo/)

> The Chinese original of this article is available at [geektutu.com/post/quick-rust.html](https://geektutu.com/post/quick-rust.html).
