---
title: DAC
sidebar:
  order: 8
---

# DAC

DAC 在引脚上输出一个可调的模拟电压。

不是所有芯片都有 DAC。STM32F1 里有 DAC 的是 F100、F105、F107，以及 F101、F103 的 xE / xG 组（比如 STM32F103RC、STM32F103ZE）。芯片上没有时编译报错。

```python
from stmpy import DAC, delay_ms

out = DAC("PA4")
ref = DAC("PA5", vref_mv=3000)

def main():
    ref.write_mv(1500)
    while True:
        for i in range(4096):
            out.write(i)
        delay_ms(10)
```

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `pin` | 必填 | 输出引脚，`"PA4"` 或 `"PA5"` |
| `vref_mv` | 3300 | 参考电压，单位毫伏，`write_mv()` 用它换算。取值 2400-3600 |

## 方法

| 方法 | 说明 |
|---|---|
| `write(value: int)` | 设置输出，0（0 V）到 4095（参考电压），超出范围按边界处理 |
| `write_mv(mv: int)` | 设置输出，单位毫伏，超出范围按边界处理 |

## 引脚

| 引脚 | 通道 |
|---|---|
| PA4 | DAC 通道 1 |
| PA5 | DAC 通道 2 |

一个引脚只能有一个 DAC 对象，也不能同时当 GPIO、ADC 等。

## 输出范围和速度

- 第一次写之前，输出是 0 V。
- 输出缓冲是打开的，带负载的能力够，但到不了电源轨：大约只能在 0.2 V 到 VDDA - 0.2 V 之间，再往外就不准了。
- 负载电阻不要小于 5 kΩ。
- `write()` 只写一个寄存器，在中断里也能用。输出大约要 3-4 微秒才能稳定，写得比这更快时输出跟不上。
- 用循环输出波形时，频率会受循环的速度和中断影响，不稳定。
