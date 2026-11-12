---
title: 延时和计时
sidebar:
  order: 2
---

# 延时和计时

```python
from stmpy import delay_ms, delay_us, ticks_ms, ticks_diff
```

| 函数 | 说明 |
|---|---|
| `delay_ms(ms)` | 等待 `ms` 毫秒 |
| `delay_us(us)` | 等待 `us` 微秒 |
| `ticks_ms() -> int` | 程序启动以来的毫秒数 |
| `ticks_diff(end, start) -> int` | 两个 `ticks_ms()` 之间相差的毫秒数 |

## 延时

`delay_ms` 和 `delay_us` 都是原地等待，等待期间 CPU 不做别的事，但中断照常响应。

- `delay_ms` 靠 SysTick 计时，**不能在中断处理函数里调用**，编译时会报错，见[中断](../../language/interrupts/)。
- `delay_us` 按 CPU 周期计时，中断里也能用。HCLK 至少要 1 MHz；HCLK 不是整数 MHz 时延时会偏短。

## 不阻塞地定时

要每隔一段时间做一件事、同时又不耽误别的事时，用 `ticks_ms()` 记下时间，再用 `ticks_diff()` 算过了多久：

```python
from stmpy import GPIO, ticks_ms, ticks_diff

led = GPIO("PC13")

def main():
    last = ticks_ms()
    while True:
        now = ticks_ms()
        if ticks_diff(now, last) >= 500:
            last = now
            led.toggle()
        do_other_things()
```

`ticks_ms()` 大约 24.8 天后会变成负数，从头再走一圈。**算间隔时要用 `ticks_diff()`，不要直接相减**，这样跨过这一点时结果也是对的。

需要精确的周期，或者周期很短时，用[定时器](../timer/)的中断更合适。

## 注意

- SysTick 的优先级最低，一个中断处理函数执行超过 1 毫秒时，`ticks_ms()` 会少算。
- `sleep()`、`stop()` 低功耗期间 SysTick 不走，`ticks_ms()` 不知道睡了多久。需要准确的时间时用 [RTC](../rtc/)。
