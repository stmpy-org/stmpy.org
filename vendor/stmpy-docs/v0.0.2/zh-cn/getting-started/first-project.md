---
title: 第一个程序
order: 2
---

# 第一个程序

这一页用一块常见的 STM32F103C8T6 开发板（Blue Pill）做例子，让板上 PC13 的 LED 闪起来。用别的板子时，把芯片型号和 LED 的引脚换成你自己板子上的。

## 工程的组成

一个工程就是一个目录，最少有两个文件：

```
blink/
├── blink.spp     工程文件：芯片型号、时钟、编译选项
└── main.py       程序入口
```

用 StmPy Studio 时，新建工程的向导会生成这两个文件。用命令行时自己建就行。

## 工程文件

`blink.spp` 是一个 TOML 文件：

```toml
[project]
chip = "STM32F103C8T6"

[rcc]
use_hse = true
hse_value = 8000000
hse_pll_enable = true
hse_pll_mul = 9
```

- `chip` 是芯片型号，必须写。
- `[rcc]` 是时钟配置：用板子上 8 MHz 的外部晶振，倍频 9 倍，让芯片跑在 72 MHz。整节都不写时用芯片内部的 8 MHz 时钟，程序也能跑，只是慢一些。

工程名就是 `.spp` 的文件名，这里是 `blink`。所有选项见[工程文件](../reference/project-file.md)和[时钟配置](../reference/clock.md)。

## 程序

`main.py`：

```python
from stmpy import GPIO, delay_ms

led = GPIO("PC13")

def main():
    while True:
        led.toggle()
        delay_ms(500)
```

- 外设对象写在文件顶层。`GPIO("PC13")` 默认是推挽输出。
- `main()` 是程序入口，芯片上电初始化完成后会自动调用它，不要自己调用。
- 单片机程序一般不会结束，`main()` 里通常是一个死循环。

## 编译

在工程目录里运行：

```bash
stmpy build blink.spp
```

成功时会输出 Flash 和 RAM 的用量，以及生成的 `.hex` 文件的路径：

```
flash: 2848 / 65536 bytes (4.3%)
ram:   1592 / 20480 bytes (7.8%) (with stack and heap)
/path/to/blink/build/blink.hex
```

程序有错时，会按 `文件:行: 错误类型: 说明` 的格式列出所有错误，能确定列号时还会带上列号。比如把引脚写成 48 脚封装上没有的 `PE0`：

```
main.py:3: ValueError: PE0 is not available on STM32F103C8 (48 pins)
```

## 烧录

用 Studio 时直接在 Studio 里烧录。用命令行时，接好下载器，然后运行：

```bash
probe-rs download --chip STM32F103C8 --binary-format hex build/blink.hex
```

按一下板子上的复位键，LED 就开始闪了。

## 下一步

- [语法概览](../language/overview.md)：StmPy 支持哪些 Python 写法
- [GPIO](../peripherals/gpio.md)：读按键、控制输出
- [中断](../language/interrupts.md)：按键按下时立刻响应，不用在主循环里一直查
