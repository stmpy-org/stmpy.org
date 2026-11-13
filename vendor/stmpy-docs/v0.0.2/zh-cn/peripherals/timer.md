---
title: 定时器
order: 3
---

# 定时器

定时器按固定的周期调用中断处理函数，比在主循环里用 `delay_ms` 准，也不会被主循环里的其他事情拖慢。

```python
from stmpy import GPIO, Timer

led = GPIO("PC13")
tim = Timer(2, period_ms=500)

@tim.on_update(priority=4)
def on_tick():
    led.toggle()

def main():
    while True:
        pass
```

## 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `id` | 必填 | 定时器编号，2 就是 TIM2 |
| `period_ms` | 0 | 周期，单位毫秒 |
| `period_us` | 0 | 周期，单位微秒，用于不是整毫秒的周期。和 `period_ms` 只能写一个 |
| `start` | `True` | 程序一开始就计数。`False` 时要调用 `start()` 才开始 |

## 方法

| 方法 | 说明 |
|---|---|
| `start()` | 开始计数。暂停后再调用，从暂停的地方继续 |
| `stop()` | 暂停计数 |
| `elapsed_us() -> int` | 当前这个周期已经过去了多少微秒，范围是 0 到周期 |
| `@on_update(priority=8)` | 每个周期结束时调用一次处理函数，处理函数是 `def f()` |

一个定时器只能挂一个 `on_update`。

没有读原始计数值的方法：分频是编译器选的，同一个计数值在不同周期下代表的时间不同，用 `elapsed_us()` 就不用操心这个。

## 周期的精度

- 分频由编译器按定时器的时钟算出来。能整除时周期是精确的，不能整除时取最接近的值，在编辑器里悬停在对象上能看到实际的周期。
- 最长的周期取决于定时器的时钟：72 MHz 时约 59 秒，8 MHz（默认的 HSI）时约 536 秒，超出时编译报错。
- 周期很短（几微秒）时，中断会占满 CPU，主循环几乎没有机会运行。

## 定时器的时钟

TIM1、TIM8-TIM11、TIM15-TIM17 在 APB2 总线上，其余在 APB1 上。总线分频不是 1 时，定时器的时钟是总线时钟的两倍。所以 STM32F103 在 72 MHz 的常用配置下，所有定时器都是 72 MHz。

## 有哪些定时器

STM32F103：

| 芯片 | 定时器 |
|---|---|
| x6 组（16、32 KB） | TIM1-TIM3 |
| xB 组（64、128 KB，比如 C8T6） | TIM1-TIM4 |
| xE 组（256-512 KB） | TIM1-TIM8 |
| xG 组（768 KB、1 MB） | TIM1-TIM14 |

其他产品线以 ST 的数据为准，比如 F101 没有 TIM1 和 TIM8，F100 有 TIM15-TIM17。用了芯片上没有的定时器时编译报错。

一个定时器只能有一种用途：用作 `Timer` 的定时器，不能再用作 [PWM](pwm.md)、[输入捕获](capture.md)或[编码器](encoder.md)。

## 中断向量

- TIM1、TIM8 的更新中断叫 `TIM1_UP`、`TIM8_UP`。
- xG 组的芯片上，它们和 TIM9-TIM14 共用向量，比如 TIM1 和 TIM10 共用 `TIM1_UP_TIM10`。两个都挂中断时，优先级必须相同。
