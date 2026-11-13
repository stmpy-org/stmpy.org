---
title: Encoder
sidebar:
  order: 6
---

# Encoder

`Encoder` counts a quadrature encoder with the timer hardware. It takes no CPU and does not miss counts. It works for knobs as well as for encoders on motors.

The two pins must be CH1 and CH2 of the same timer.

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

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `a` | required | pin of signal A, such as `"PA0"` |
| `b` | required | pin of signal B, such as `"PA1"` |
| `pull` | `Pull.UP` | pull resistor of both pins, a mechanical knob needs pull-ups |
| `timer` | 0 | the timer number when the pins are channels of several timers. 0 takes the first in the pin table |

## Methods

| Method | Description |
|---|---|
| `count() -> int` | the position, starting at 0, from -32768 to 32767 |
| `reset()` | set the position to 0 |

## Direction and counts

- The count goes up when A leads B. If the direction is wrong, swap the pins, such as `Encoder("PA1", "PA0")`, no rewiring needed.
- Every edge of A and B counts, so a full cycle of the signals is 4 counts. An encoder of 1000 lines counts 4000 per turn.
- A mechanical knob usually has one cycle per click, that is 4 counts, so `knob.count() // 4` gives clicks.

## Beyond the range

After 32767 the count goes on at -32768. When the total movement can go beyond that, read it regularly and add up the differences:

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

Between two calls of `update()` the movement must stay within 32767 counts.

## Pins

STM32F103:

| Timer | A / B | Chips |
|---|---|---|
| TIM1 | PA8 / PA9 | all |
| TIM1 | PE9 / PE11 | 100, 144 pins |
| TIM2 | PA0 / PA1 | all |
| TIM2 | PA15 / PB3 | all |
| TIM3 | PA6 / PA7 | all |
| TIM3 | PB4 / PB5 | all |
| TIM3 | PC6 / PC7 | 64 pins and up |
| TIM4 | PB6 / PB7 | xB and up |
| TIM4 | PD12 / PD13 | xB and up, 100, 144 pins |
| TIM5 | PA0 / PA1 | xE / xG |
| TIM8 | PC6 / PC7 | xE / xG |

- A and B in the table can be swapped, which reverses the direction.
- Without `timer` the first in the table is taken: PA0 and PA1 take TIM2 (`timer=5` takes TIM5), PC6 and PC7 take TIM3 (`timer=8` takes TIM8).
- An encoder takes the whole timer, it cannot also be a `Timer`, `PWM` or `Capture`.
- PA15, PB3 and PB4 belong to JTAG after reset, the compiler hands them over when they are used, SWD keeps working.

For other chips, completion in the editor and the compile errors are the reference.

## Notes

- The hardware does the counting, `count()` just reads a register and works in interrupt handlers too.
- Edges between `reset()` and the next read are cleared with it. To track movement use the code of "Beyond the range", do not read and reset.
- An encoder with 5 V outputs needs 5 V tolerant pins or a voltage divider.
