---
title: Timer
sidebar:
  order: 3
---

# Timer

A timer calls an interrupt handler at a fixed period. It is more accurate than `delay_ms` in the main loop, and the rest of the main loop cannot slow it down.

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

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `id` | required | timer number, 2 is TIM2 |
| `period_ms` | 0 | period in milliseconds |
| `period_us` | 0 | period in microseconds, for periods that are not whole milliseconds. Give only one of `period_ms` and `period_us` |
| `start` | `True` | count from the start of the program. With `False`, counting starts with `start()` |

## Methods

| Method | Description |
|---|---|
| `start()` | start counting. After `stop()` it goes on from where it stopped |
| `stop()` | pause counting |
| `elapsed_us() -> int` | microseconds since the current period began, from 0 up to the period |
| `@on_update(priority=8)` | calls the handler at the end of every period, the handler is `def f()` |

A timer can have only one `on_update`.

There is no method to read the raw count: the compiler picks the prescaler, so the same count means different times for different periods. `elapsed_us()` takes care of that.

## Accuracy of the period

- The compiler works out the prescaler from the timer clock. When the clock divides evenly the period is exact, otherwise the nearest one is taken. Hover over the object in the editor to see the real period.
- The longest period depends on the timer clock: about 59 seconds at 72 MHz, about 536 seconds at 8 MHz (the default HSI). Longer is a compile error.
- With a very short period (a few microseconds), the interrupt takes all the CPU and the main loop hardly runs.

## Timer clock

TIM1, TIM8-TIM11 and TIM15-TIM17 are on the APB2 bus, the others on APB1. When a bus is divided, its timers run at twice the bus clock. So on an STM32F103 in the usual 72 MHz setup every timer runs at 72 MHz.

## Available timers

STM32F103:

| Chip | Timers |
|---|---|
| group x6 (16, 32 KB) | TIM1-TIM3 |
| group xB (64, 128 KB, such as C8T6) | TIM1-TIM4 |
| group xE (256-512 KB) | TIM1-TIM8 |
| group xG (768 KB, 1 MB) | TIM1-TIM14 |

For the other lines ST's data decides, F101 for example has no TIM1 and TIM8, F100 has TIM15-TIM17. A timer the chip does not have is a compile error.

A timer has one use: a timer used as a `Timer` cannot also be used for [PWM](../pwm/), [input capture](../capture/) or an [encoder](../encoder/).

## Interrupt vectors

- The update interrupts of TIM1 and TIM8 are called `TIM1_UP` and `TIM8_UP`.
- On chips of group xG they share vectors with TIM9-TIM14, such as `TIM1_UP_TIM10` for TIM1 and TIM10. With handlers on both, they need the same priority.
