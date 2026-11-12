---
title: 编码器
sidebar:
  order: 6
---

# 编码器

`Encoder` 用定时器硬件给正交编码器计数，不占 CPU，也不会丢计数。可以接旋钮，也可以接电机上的编码器。

两个引脚必须是同一个定时器的 CH1 和 CH2。

```python
from stmpy import Encoder, UART, delay_ms

knob = Encoder("PA0", "PA1")
uart = UART(1)

def main():
    while True:
        uart.write_int(knob.count())
        uart.write("\n")
        delay_ms(100)
```

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `a` | 必填 | A 相的引脚，比如 `"PA0"` |
| `b` | 必填 | B 相的引脚，比如 `"PA1"` |
| `pull` | `Pull.UP` | 两个引脚的上下拉，机械旋钮要上拉 |
| `timer` | 0 | 引脚属于多个定时器时，用它指定定时器编号。0 表示按引脚表的顺序取第一个 |

## 方法

| 方法 | 说明 |
|---|---|
| `count() -> int` | 当前位置，从 0 开始，范围是 -32768 到 32767 |
| `reset()` | 位置清零 |

## 方向和计数

- A 相超前 B 相时计数增加。方向反了就把两个引脚对调，比如 `Encoder("PA1", "PA0")`，不用改线。
- A、B 两相的每个边沿都计数，信号走一个完整的周期计 4 次。标称 1000 线的编码器，转一圈计 4000。
- 机械旋钮常见的是一格一个周期，也就是 4 个计数，用 `knob.count() // 4` 得到格数。

## 超过范围

计数到 32767 再加 1 会变成 -32768。累计的转动量可能超过这个范围时，要定时读取并累加差值：

```python
last: int = 0
position: int = 0

def update() -> None:
    global last, position
    now = knob.count()
    diff = (now - last) & 0xFFFF
    if diff >= 0x8000:
        diff -= 0x10000
    position += diff
    last = now
```

两次调用 `update()` 之间转过的计数不能超过 32767。

## 引脚

STM32F103：

| 定时器 | A / B | 可用芯片 |
|---|---|---|
| TIM1 | PA8 / PA9 | 全部 |
| TIM1 | PE9 / PE11 | 100、144 脚 |
| TIM2 | PA0 / PA1 | 全部 |
| TIM2 | PA15 / PB3 | 全部 |
| TIM3 | PA6 / PA7 | 全部 |
| TIM3 | PB4 / PB5 | 全部 |
| TIM3 | PC6 / PC7 | 64 脚及以上 |
| TIM4 | PB6 / PB7 | xB 及以上 |
| TIM4 | PD12 / PD13 | xB 及以上的 100、144 脚 |
| TIM5 | PA0 / PA1 | xE / xG |
| TIM8 | PC6 / PC7 | xE / xG |

- 表中的 A、B 可以对调，对调后方向相反。
- 不写 `timer` 时按表中的顺序取第一个：PA0、PA1 取 TIM2（可以用 `timer=5` 换成 TIM5），PC6、PC7 取 TIM3（可以用 `timer=8`）。
- 编码器占用整个定时器，这个定时器不能再用作 `Timer`、`PWM` 或 `Capture`。
- PA15、PB3、PB4 复位后属于 JTAG，用到时编译器会自动处理，SWD 不受影响。

其他芯片的引脚以编辑器的补全和编译报错为准。

## 注意

- 计数由硬件完成，`count()` 只是读一个寄存器，在中断里也能用。
- `reset()` 和下一次读取之间到来的边沿会被清掉。要统计转动量时用上面"超过范围"一节的写法，不要边读边清。
- 5 V 输出的编码器要接 5 V 容忍的引脚，或者先分压。
