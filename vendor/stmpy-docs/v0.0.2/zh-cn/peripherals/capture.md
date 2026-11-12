---
title: 输入捕获
order: 5
---

# 输入捕获

输入捕获由定时器硬件记下边沿到来那一刻的计数值，结果不受程序响应快慢的影响，适合测量周期、频率和脉宽。

只要写引脚，编译器会找到引脚对应的定时器通道。

## 用法

测量两个上升沿之间的时间，用等待的方式：

```python
from stmpy import Capture, UART

signal = Capture("PA0")
uart = UART(1)

def main():
    last = signal.read(-1)
    while True:
        now = signal.read(-1)
        uart.write_int((now - last) & 0xFFFF)   # 两个上升沿之间的微秒数
        uart.write("\n")
        last = now
```

测量脉宽，用中断的方式：

```python
from stmpy import Capture, Edge

echo = Capture("PA0", edge=Edge.BOTH)
start: int = 0
width_us: int = 0

@echo.on_capture()
def on_echo(t: int):
    global start, width_us
    if echo.rising():
        start = t
    else:
        width_us = (t - start) & 0xFFFF
```

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `pin` | 必填 | 输入引脚，比如 `"PA0"` |
| `edge` | `Edge.RISING` | 捕获哪种边沿：`RISING`、`FALLING`、`BOTH` |
| `tick_us` | 1.0 | 一个计数是多少微秒，决定精度和量程 |
| `pull` | `Pull.NONE` | 引脚的上下拉 |
| `timer` | 0 | 引脚属于多个定时器时，用它指定定时器编号。0 表示取第一个 |

## 方法

| 方法 | 说明 |
|---|---|
| `read(timeout_ms: int) -> int` | 最多等 `timeout_ms` 毫秒，返回边沿处的计数值（0-65535），超时返回 -1。传负数表示一直等 |
| `available() -> bool` | 是否已经捕获到边沿，是的话 `read` 会立刻返回 |
| `rising() -> bool` | 刚取走的边沿是不是上升沿，只有 `Edge.BOTH` 时能用 |
| `@on_capture(priority=8)` | 每个边沿调用一次处理函数，参数是这个边沿的计数值 |

## 计数值怎么用

计数值只有 16 位，到 65535 之后回到 0，单独一个值没有意义，**要算两个值的差**。差要写成 `(b - a) & 0xFFFF`，这样跨过回零的地方时结果也是对的。

两个边沿之间不能超过 65536 个计数，否则会少算整圈，程序也分辨不出来。`tick_us` 要按信号来选：

| `tick_us` | 精度 | 最长间隔 | 适合 |
|---|---|---|---|
| 0.1 | 0.1 微秒 | 6.5 毫秒 | 几 kHz 以上的信号 |
| 1（默认） | 1 微秒 | 65.5 毫秒 | 超声波测距、航模接收机 |
| 100 | 100 微秒 | 6.5 秒 | 转速、红外遥控编码 |

`tick_us` 会换算成整数的分频，72 MHz 时取值范围是 0.014 到 910。除不尽时取最接近的，在编辑器里悬停在对象上能看到实际的值。

## 引脚和定时器

能用的引脚和 PWM 相同，见 [PWM](pwm.md) 的引脚表。重映射由编译器选，不用写。

同一个定时器上可以有多个输入：

1. **`tick_us` 必须相同**，因为它们共用一个计数器。这样不同引脚的计数值也可以直接比较，能测两路信号的相位差。
2. **STM32F1 上，引脚必须在同一种重映射里。**
3. 这个定时器不能再用作 `Timer`、`PWM` 或 `Encoder`。

## 中断

- 挂了 `on_capture` 的对象，边沿只交给处理函数，不能再用 `read()` 和 `available()`，直接调用会编译报错。
- 中断向量：TIM1、TIM8 是 `TIM1_CC`、`TIM8_CC`，其余的就是定时器的名字，比如 `TIM2`。同一个定时器上的多个 `on_capture` 共用一个向量，优先级必须相同。
- `read` 的超时靠 SysTick 计时，不能在中断里调用。

## 注意

- **STM32F1 的定时器一次只能捕获一种边沿。** `Edge.BOTH` 是每次捕获后由程序切换极性来实现的，所以脉冲不能比切换的时间还短：用中断时取决于中断的响应时间，用 `read` 时取决于多久调用一次。
- 用 `read` 等待时，如果上一个边沿还没取走就来了新的，旧的会被覆盖，不会有提示。
- 输入电压要在 3.3 V 以内，或者用 5 V 容忍的引脚。没接信号的引脚要加上下拉，否则可能捕获到干扰。
