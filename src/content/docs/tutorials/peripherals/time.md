---
title: Delays and time
sidebar:
  order: 2
---

# Delays and time

```python
from stmpy import delay_ms, delay_us, ticks_ms, ticks_diff
```

| Function | Description |
|---|---|
| `delay_ms(ms)` | wait `ms` milliseconds |
| `delay_us(us)` | wait `us` microseconds |
| `ticks_ms() -> int` | milliseconds since the program started |
| `ticks_diff(end, start) -> int` | milliseconds between two values of `ticks_ms()` |

## Delays

`delay_ms` and `delay_us` wait where they are. The CPU does nothing else meanwhile, but interrupts still run.

- `delay_ms` counts SysTick and **cannot be called in an interrupt handler**, that is a compile error, see [Interrupts](../../language/interrupts/).
- `delay_us` counts CPU cycles and works in a handler too. HCLK must be at least 1 MHz, and when it is not a whole number of MHz the delays come out short.

## Timing without blocking

To do something every so often without holding up everything else, note the time with `ticks_ms()` and see how much has passed with `ticks_diff()`:

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

After about 24.8 days `ticks_ms()` turns negative and goes around again. **Take differences with `ticks_diff()`, not by subtracting**, then they stay right across that point.

For an exact period, or a short one, an interrupt of a [timer](../timer/) is the better tool.

## Notes

- SysTick has the lowest priority, so `ticks_ms()` falls behind when an interrupt handler runs for more than 1 millisecond.
- SysTick does not run during the low power modes `sleep()` and `stop()`, so `ticks_ms()` does not know how long the chip slept. Use the [RTC](../rtc/) when the time has to be right.
