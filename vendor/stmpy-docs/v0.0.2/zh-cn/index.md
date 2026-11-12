---
title: StmPy 简介
order: 0
---

# StmPy 简介

StmPy 让你用 Python 的语法给 STM32 写程序。

```python
from stmpy import GPIO, delay_ms

led = GPIO("PC13")

def main():
    while True:
        led.toggle()
        delay_ms(500)
```

这段代码不会在 Python 解释器里运行。StmPy 先把它翻译成基于 STM32 HAL 库的 C 代码，再用 `arm-none-eabi-gcc` 编译成 `.hex` 固件，烧录到芯片上运行。所以它跑得和手写的 C 程序一样快，也不需要芯片上有解释器。

## 和 Python 有什么不同

StmPy 用的是 Python 的语法，但规则更接近 C：

- **类型在编译时就定下来。** 一个变量第一次赋值是 `int`，之后就一直是 `int`。
- **数组长度固定。** 没有 `append`，也没有 `dict`、`set`。
- **外设是写在文件顶层的对象**，比如 `GPIO("PC13")`、`UART(1)`。它们的参数在编译时就要确定。
- **错误在编译时报出来**：引脚冲突、用了芯片上没有的外设、在中断里调用会卡死的函数，都会在编译时报错，而不是等到板子上才发现。

具体支持哪些语法，见[语法概览](language/overview.md)。

## 能做什么

- **外设**：GPIO、定时器、PWM、输入捕获、编码器、ADC、DAC、UART、I2C、SPI、CAN、RTC、看门狗、内部 Flash、低功耗、CRC。
- **中断**：用装饰器把函数挂到外设上，比如 `@key.on_edge()`。
- **后台传输**：UART、SPI 的发送和接收，以及 ADC 的连续转换，都可以交给 DMA 在后台完成。
- **芯片**：STM32F1 和 STM32F4 全系列。换芯片只要改工程文件里的型号，代码一般不用动。
- **编辑器支持**：补全、悬停提示、跳转定义，保存时检查错误。在引脚参数里补全时，会列出当前芯片上能用的引脚。

## 下一步

- [安装](getting-started/installation.md)
- [第一个程序](getting-started/first-project.md)：从新建工程到让板子上的灯闪起来
