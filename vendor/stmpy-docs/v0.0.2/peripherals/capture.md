---
title: Input capture
order: 5
---

# Input capture

Input capture has the timer hardware note the count at the moment an edge arrives, so the result does not depend on how soon the program responds. It measures periods, frequencies and pulse widths.

Give the pin, and the compiler finds the timer channel on it.

## Usage

The time between two rising edges, by waiting:

```python
from stmpy import Capture, UART

signal = Capture("PA0")
uart = UART(1)

def main():
    last = signal.read(-1)
    while True:
        now = signal.read(-1)
        uart.write_int((now - last) & 0xFFFF)   # microseconds between two rising edges
        uart.write("\n")
        last = now
```

A pulse width, by interrupt:

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

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `pin` | required | input pin such as `"PA0"` |
| `edge` | `Edge.RISING` | which edges are captured: `RISING`, `FALLING` or `BOTH` |
| `tick_us` | 1.0 | microseconds per count, sets the resolution and the range |
| `pull` | `Pull.NONE` | pull resistor of the pin |
| `timer` | 0 | the timer number when the pin is a channel of several timers. 0 takes the first |

## Methods

| Method | Description |
|---|---|
| `read(timeout_ms: int) -> int` | wait up to `timeout_ms` milliseconds and return the count at the edge (0-65535), -1 on timeout. A negative timeout waits forever |
| `available() -> bool` | whether an edge was captured, `read` then returns at once |
| `rising() -> bool` | whether the edge just taken was a rising one, only with `Edge.BOTH` |
| `@on_capture(priority=8)` | calls the handler at every edge, with the count as its parameter |

## Using the counts

A count has only 16 bits and goes back to 0 after 65535, so a single count means nothing: **take the difference of two**. Write it as `(b - a) & 0xFFFF`, then it is right across the wrap too.

Two edges must be at most 65536 counts apart, otherwise whole rounds are lost and the program cannot tell. Choose `tick_us` for your signal:

| `tick_us` | Resolution | Longest gap | For |
|---|---|---|---|
| 0.1 | 0.1 µs | 6.5 ms | signals of a few kHz and up |
| 1 (default) | 1 µs | 65.5 ms | ultrasonic distance sensors, RC receivers |
| 100 | 100 µs | 6.5 s | speed sensors, infrared remote codes |

`tick_us` becomes a whole prescaler, from 0.014 to 910 at 72 MHz. When it does not divide evenly the nearest is taken, hover over the object in the editor to see the real value.

## Pins and timers

The pins are those of PWM, see the pin table of [PWM](pwm.md). The compiler picks the remap.

One timer can have several inputs:

1. **They need the same `tick_us`**, they share one counter. Counts of different pins can then be compared directly, to measure the phase between two signals.
2. **On STM32F1 the pins must be in the same remap.**
3. The timer cannot also be a `Timer`, `PWM` or `Encoder`.

## Interrupts

- An object with `on_capture` gives its edges only to the handler. `read()` and `available()` can no longer be used, calling them is a compile error.
- Vectors: `TIM1_CC` and `TIM8_CC` for TIM1 and TIM8, the timer's name for the others, such as `TIM2`. Several `on_capture` on one timer share its vector and need the same priority.
- The timeout of `read` counts SysTick, so it cannot be called in a handler.

## Notes

- **The timers of STM32F1 capture one kind of edge at a time.** `Edge.BOTH` switches the polarity in software after each capture, so a pulse cannot be shorter than that takes: the interrupt response time with a handler, or how often `read` is called without one.
- When waiting with `read`, a new edge before the last one was taken replaces it, silently.
- Keep the input within 3.3 V, or use a 5 V tolerant pin. An unconnected pin needs a pull resistor, otherwise it may capture noise.
