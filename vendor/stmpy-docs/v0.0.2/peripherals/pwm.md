---
title: PWM
order: 4
---

# PWM

PWM outputs a square wave of a fixed frequency. Changing how much of each period is high (the duty cycle) sets the brightness of an LED, the speed of a motor or the angle of a servo.

Give the pin, and the compiler finds the timer channel on it and works out the prescaler.

```python
from stmpy import PWM, delay_ms

servo = PWM("PA1", freq=50, duty=0.075)    # servo: 50 Hz, 1.5 ms high
led = PWM("PA8", freq=1000)

def main():
    while True:
        servo.pulse_us(1000)
        led.duty(0.2)
        delay_ms(500)
        servo.pulse_us(2000)
        led.duty(0.8)
        delay_ms(500)
```

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `pin` | required | output pin such as `"PA1"` |
| `freq` | required | frequency in Hz, an integer |
| `duty` | 0.0 | duty cycle at start, 0.0 is always low and 1.0 always high |
| `timer` | 0 | the timer number when the pin is an output of several timers. 0 takes the first in the pin table |
| `complement` | `""` | pin of the complementary output, see "Complementary outputs" |
| `dead_ns` | 0 | dead time in nanoseconds, only with `complement` |

## Methods

| Method | Description |
|---|---|
| `duty(value: float)` | set the duty cycle, values outside 0.0-1.0 are clamped |
| `pulse_us(us: int)` | set how many microseconds of each period are high. More than the period stays high |

A change takes effect when the current period ends, so there are no cut off pulses.

## Several outputs on one timer

A timer has 4 channels, and several PWM outputs can share a timer, but:

1. **They need the same frequency**, they share one counter.
2. **A channel has one output.** PA2 and PB10, for example, are both CH3 of TIM2, they cannot both be used.
3. **On STM32F1 the pins must be in the same remap.** The compiler picks the one that brings out all of them.

| Written | Result |
|---|---|
| PA0 + PA1 | TIM2, no remap |
| PA0 + PB10 | TIM2, partial remap 2 |
| PA15 + PB11 | TIM2, full remap |
| PA0 + PA2 + PB3 | error: PA0 together with PA2 needs no remap, PB3 needs partial remap 1 or full |
| PA0 (50 Hz) + PA1 (1000 Hz) | error: different frequencies |
| PA2 + PB10 | error: both CH3 of TIM2 |

The error for different frequencies:

```
main.py:3: ValueError: b runs TIM2 at 1000 Hz but a at 50 Hz, PWM outputs on one timer need the same freq
```

A timer used for PWM cannot be a [`Timer`](timer.md), [`Capture`](capture.md) or [`Encoder`](encoder.md) too, and the other way round.

## Pins and timers

The usual pins of the STM32F103:

| Timer | Remap | CH1 | CH2 | CH3 | CH4 | Chips |
|---|---|---|---|---|---|---|
| TIM1 | none | PA8 | PA9 | PA10 | PA11 | all |
| TIM1 | full | PE9 | PE11 | PE13 | PE14 | 100, 144 pins |
| TIM2 | none | PA0 | PA1 | PA2 | PA3 | all |
| TIM2 | partial 1 | PA15 | PB3 | PA2 | PA3 | all |
| TIM2 | partial 2 | PA0 | PA1 | PB10 | PB11 | packages with PB10, PB11 |
| TIM2 | full | PA15 | PB3 | PB10 | PB11 | packages with PB10, PB11 |
| TIM3 | none | PA6 | PA7 | PB0 | PB1 | all |
| TIM3 | partial | PB4 | PB5 | PB0 | PB1 | all |
| TIM3 | full | PC6 | PC7 | PC8 | PC9 | 64 pins and up |
| TIM4 | none | PB6 | PB7 | PB8 | PB9 | xB and up |
| TIM4 | remap | PD12 | PD13 | PD14 | PD15 | xB and up, 100, 144 pins |
| TIM5 | none | PA0 | PA1 | PA2 | PA3 | xE / xG |
| TIM8 | none | PC6 | PC7 | PC8 | PC9 | xE / xG |

- The compiler picks the remap, do not write it.
- When a pin is on several timers and `timer` is not given, the first in the table is taken: PA0-PA3 take TIM2 (`timer=5` takes TIM5 on xE and up), PC6-PC9 take TIM3 (`timer=8` takes TIM8).
- F100 also has TIM12-TIM17, the xF and xG parts of F101 and F103 also TIM9-TIM14.
- **On STM32F4** each pin selects its alternate function on its own. There are no remaps, the channels of a timer can be on any of their pins, and more pins are available.

For other chips, completion in the editor and the compile errors are the reference.

## Complementary outputs

CH1-CH3 of TIM1 and TIM8 each have an inverted output, for half bridges, full bridges and three phase motors.

```python
from stmpy import PWM

# PB13 is low while PA8 is high, both stay low for 500 ns at each switch
u = PWM("PA8", freq=20000, complement="PB13", dead_ns=500)
v = PWM("PA9", freq=20000, complement="PB14", dead_ns=500)
w = PWM("PA10", freq=20000, complement="PB15", dead_ns=500)

def main():
    u.duty(0.5)
    v.duty(0.25)
    w.duty(0.75)
```

> **`dead_ns` is 0 by default, that is no dead time.** For a half bridge always set it, otherwise both transistors conduct for a moment at each switch, which can destroy them. Take the value from the datasheets of the transistors and the driver, a few hundred nanoseconds to a few microseconds is common. Leave it out when the driver chip has its own dead time.

Complementary output pins of the STM32F103:

| Timer | Remap | CH1N | CH2N | CH3N | Chips |
|---|---|---|---|---|---|
| TIM1 | none | PB13 | PB14 | PB15 | 48 pins and up |
| TIM1 | partial | PA7 | PB0 | PB1 | all |
| TIM1 | full | PE8 | PE10 | PE12 | 100, 144 pins |
| TIM8 | none | PA7 | PB0 | PB1 | xE / xG |

- Complementary outputs on one timer need the same `dead_ns`, the hardware has one dead time.
- The dead time is rounded up to whole timer clocks. At 72 MHz it is at most 14 microseconds, and longer ones come in coarser steps: about 14 ns per step up to 1.76 microseconds, about 222 ns near 14 microseconds. Hover over the object in the editor to see the real value.
- On STM32F1 an output and its complement must be in the same remap, PE9 cannot go with PB13. The partial remap of TIM1 moves only the complementary outputs, CH1-CH4 stay on PA8-PA11.
- CH4 has no complementary output. PC6-PC8 with `complement` take TIM8, no need for `timer=8`.
- At a duty cycle of 0.0 the output is always low and its complement always high, at 1.0 the other way round.

## Accuracy

- A period has at most 65535 counts, the finest duty step is 1 / counts.
- The compiler looks for a prescaler that divides evenly, but only among those that keep at least half of the most steps possible. Otherwise it takes the one with the most steps and the nearest frequency. At 72 MHz, below 1.1 kHz each period has at least about 22000 counts and the frequency is off by at most 25 ppm, less than the crystal itself.
- At 72 MHz: 50 Hz has 60000 counts per period (counting at 3 MHz, so `pulse_us` steps by 1/3 microsecond), 1 kHz has 36000.
- Higher frequencies have fewer steps, up to half the timer clock with only 2 left.

## Notes

- PA15, PB3 and PB4 belong to JTAG after reset, the compiler hands them over when they are used, SWD keeps working.
