---
title: 语法概览
order: 1
---

# 语法概览

StmPy 的代码是合法的 Python 语法，但只支持其中一部分。原因很简单：程序最后要变成 C，在编译时就要知道每个变量的类型和每个数组的大小。

## 程序的结构

入口文件（默认是 `main.py`）的顶层只能写这几种东西：

```python
from stmpy import GPIO, UART, delay_ms      # import
import sensors

BAUD = 115200                               # 常量和全局变量
count: int = 0
buf = bytearray(16)                         # 全局数组

led = GPIO("PC13")                          # 外设对象
uart = UART(1, baudrate=BAUD)

def blink(times: int) -> None:              # 函数
    for i in range(times):
        led.toggle()
        delay_ms(100)

def main():                                 # 程序入口，必须有
    while True:
        blink(3)
        delay_ms(1000)
```

- **`main()` 由系统自动调用**：芯片初始化完成后进入 `main()`，不要自己写 `main()` 调用它。
- **外设对象只能写在顶层**，不能在函数里创建。
- 顶层不能写别的语句，比如 `if`、`for` 或者普通的函数调用。

## 类型

| 类型 | 说明 |
|---|---|
| `int` | 32 位有符号整数，详见[数字和运算](numbers.md) |
| `float` | 32 位单精度浮点数 |
| `bool` | `True` / `False` |
| `str` | 字符串常量，用来传给 `uart.write()` 这类方法 |
| 数组 | `bytearray(n)`、`[0] * n` 这类固定长度的数组，见[数组](arrays.md) |
| 外设 | `GPIO`、`UART` 等，可以当参数传给函数 |

**变量的类型由第一次赋值决定，之后不能改：**

```python
x = 1           # int
x = 2.5         # 报错：x 是 int

y: float = 1    # 写注解时按注解来，1 存成 1.0
y = 2.5         # 可以
```

字符串只能当常量用，不能拼接、取下标或者用 `len()`。没有 `None`。

## 全局变量

顶层的赋值有三种：

- **常量表达式**：`BAUD = 115200`、`PERIOD = 1000 // 4`。值在编译时算出来。
- **数组**：`buf = bytearray(16)`。
- **外设对象**：`led = GPIO("PC13")`。

函数里要修改全局变量时，和 Python 一样要先写 `global`，否则就是新建了一个同名的局部变量：

```python
count: int = 0

def tick() -> None:
    global count
    count += 1
```

别的模块的全局变量只能读不能写。要修改的话，在那个模块里写一个函数来改。

## 函数

```python
def clamp(value: int, low: int, high: int) -> int:
    if value < low:
        return low
    if value > high:
        return high
    return value
```

- **参数必须写类型注解。**
- **要返回值就必须写返回类型**，不写表示没有返回值。
- 参数只能是普通的位置参数：没有默认值，也没有 `*args`、`**kwargs`，调用时也不能写成 `clamp(value=3, ...)`。
- 不能返回数组。要得到一组结果，就传一个数组进去让函数填。
- 外设对象可以当参数传，写驱动时很有用：

```python
from stmpy import I2C

def read_id(bus: I2C) -> int:
    return bus.read_reg(0x68, 0x75)
```

调用 `stmpy` 里的外设和函数时没有这些限制，可以用关键字参数和默认值，比如 `UART(1, baudrate=9600)`。

## 控制流

| 写法 | 说明 |
|---|---|
| `if` / `elif` / `else` | |
| `while` | 不支持 `while ... else` |
| `for i in range(...)` | `range` 的步长必须是非 0 的常量 |
| `for x in 数组` | 遍历数组的每个元素 |
| `break` / `continue` / `pass` / `return` | |

`for i in range(n)` 和 Python 的行为一致：`n` 只在循环开始时算一次，循环体里改 `i` 不影响下一轮。

## 运算

| 类别 | 运算符 |
|---|---|
| 算术 | `+` `-` `*` `/` `//` `%` |
| 位运算 | `&` `\|` `^` `~` `<<` `>>` |
| 比较 | `==` `!=` `<` `<=` `>` `>=` |
| 逻辑 | `and` `or` `not` |
| 复合赋值 | `+=` `-=` `*=` 等 |

不支持 `**`、连续比较（`a < b < c`）和条件表达式（`a if c else b`）。除法和取整的规则见[数字和运算](numbers.md)。

## 内置函数

| 名字 | 说明 |
|---|---|
| `range()` | 只能用在 `for` 里 |
| `len()` | 数组的长度 |
| `bytearray()` | 创建字节数组 |
| `int` `float` `bool` `str` `list` | 只能写在类型注解里，不能当函数调用 |

`print()`、`abs()`、`min()`、`max()`、`int()`、`float()` 等目前还没有。向串口输出用 `uart.write()` 和 `uart.write_int()`。

## 不支持的写法

- `class`、`lambda`、闭包、生成器、`async`
- `try` / `except`、`assert`、`with`
- `list` 的 `append`、切片，以及 `dict`、`set`、元组
- `isinstance()`、`type()` 等运行时类型检查

## 多个文件

程序可以拆成多个 `.py` 文件，用 `import` 互相引用，规则见[模块和 import](modules.md)。
