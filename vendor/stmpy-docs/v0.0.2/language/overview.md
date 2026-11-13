---
title: Language overview
order: 1
---

# Language overview

StmPy code is valid Python syntax, but only a part of Python is supported. The reason is simple: the program ends up as C, so the type of every variable and the size of every array must be known at compile time.

## Structure of a program

The top level of the entry file (`main.py` by default) can only have these:

```python
from stmpy import GPIO, UART, delay_ms      # imports
import sensors

BAUD = 115200                               # constants and global variables
count: int = 0
buf = bytearray(16)                         # global arrays

led = GPIO("PC13")                          # peripheral objects
uart = UART(1, baudrate=BAUD)

def blink(times: int) -> None:              # functions
    for i in range(times):
        led.toggle()
        delay_ms(100)

def main():                                 # entry point, required
    while True:
        blink(3)
        delay_ms(1000)
```

- **`main()` is called for you**: the chip is set up, then `main()` runs. Do not call it yourself.
- **Peripheral objects can only be created at the top level**, not inside a function.
- No other statements at the top level, such as `if`, `for` or plain function calls.

## Types

| Type | Description |
|---|---|
| `int` | 32 bit signed integer, see [Numbers and operators](numbers.md) |
| `float` | 32 bit single precision floating point |
| `bool` | `True` / `False` |
| `str` | string constants, to pass to methods such as `uart.write()` |
| arrays | fixed length arrays such as `bytearray(n)` and `[0] * n`, see [Arrays](arrays.md) |
| peripherals | `GPIO`, `UART` and the others, they can be passed to functions |

**The first assignment decides the type of a variable, it cannot change later:**

```python
x = 1           # int
x = 2.5         # error: x is an int

y: float = 1    # an annotation decides instead, 1 is stored as 1.0
y = 2.5         # fine
```

Strings can only be used as constants: no concatenation, no indexing and no `len()`. There is no `None`.

## Global variables

An assignment at the top level is one of three things:

- **A constant expression**: `BAUD = 115200`, `PERIOD = 1000 // 4`. The value is computed at compile time.
- **An array**: `buf = bytearray(16)`.
- **A peripheral object**: `led = GPIO("PC13")`.

As in Python, a function that changes a global variable needs `global`, otherwise the assignment makes a new local variable with the same name:

```python
count: int = 0

def tick() -> None:
    global count
    count += 1
```

The global variables of another module can be read but not written. To change one, add a function to that module that does it.

## Functions

```python
def clamp(value: int, low: int, high: int) -> int:
    if value < low:
        return low
    if value > high:
        return high
    return value
```

- **Every parameter needs a type annotation.**
- **A function that returns a value needs a return type**, without one it returns nothing.
- Parameters are plain positional parameters: no default values, no `*args` or `**kwargs`, and calls cannot name them as in `clamp(value=3, ...)`.
- A function cannot return an array. To get several results, pass an array in for the function to fill.
- Peripheral objects can be passed as parameters, which is how drivers are written:

```python
from stmpy import I2C

def read_id(bus: I2C) -> int:
    return bus.read_reg(0x68, 0x75)
```

Calls to the peripherals and functions of `stmpy` do not have these limits, they take keyword arguments and have defaults, such as `UART(1, baudrate=9600)`.

## Control flow

| Construct | Notes |
|---|---|
| `if` / `elif` / `else` | |
| `while` | no `while ... else` |
| `for i in range(...)` | the step of `range` must be a non-zero constant |
| `for x in array` | goes through every element |
| `break` / `continue` / `pass` / `return` | |

`for i in range(n)` behaves as in Python: `n` is evaluated once before the loop, and changing `i` in the body does not change the next round.

## Operators

| Kind | Operators |
|---|---|
| arithmetic | `+` `-` `*` `/` `//` `%` |
| bitwise | `&` `\|` `^` `~` `<<` `>>` |
| comparison | `==` `!=` `<` `<=` `>` `>=` |
| logical | `and` `or` `not` |
| augmented assignment | `+=` `-=` `*=` and so on |

There is no `**`, no chained comparison (`a < b < c`) and no conditional expression (`a if c else b`). See [Numbers and operators](numbers.md) for division and rounding.

## Built-in functions

| Name | Notes |
|---|---|
| `range()` | only in a `for` loop |
| `len()` | the length of an array |
| `bytearray()` | creates a byte array |
| `int` `float` `bool` `str` `list` | only in type annotations, they cannot be called |

`print()`, `abs()`, `min()`, `max()`, `int()`, `float()` and the like are not there yet. Use `uart.write()` and `uart.write_int()` to send text over a serial port.

## Not supported

- `class`, `lambda`, closures, generators, `async`
- `try` / `except`, `assert`, `with`
- `append` and slices of lists, `dict`, `set`, tuples
- run time type checks such as `isinstance()` and `type()`

## Several files

A program can be split into several `.py` files that import each other, see [Modules and imports](modules.md).
