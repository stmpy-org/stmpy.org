---
title: GPIO
order: 1
---

# GPIO

GPIO is a plain digital pin: it drives a high or low level, or reads the level from outside.

```python
from stmpy import GPIO, Mode, Pull, delay_ms

led = GPIO("PC13")
key = GPIO("PA0", Mode.INPUT, pull=Pull.UP)

def main():
    while True:
        if key.read() == 0:         # the button goes to ground, pressed reads 0
            led.toggle()
            delay_ms(200)
```

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `name` | required | pin name such as `"PC13"` or `"PA0"`, in any case |
| `mode` | `Mode.OUTPUT_PP` | mode, see below |
| `pull` | `Pull.NONE` | pull resistor: `NONE`, `UP` or `DOWN` |
| `speed` | `Speed.LOW` | how fast the output switches: `LOW`, `MEDIUM` or `HIGH` |

| Mode | Description |
|---|---|
| `Mode.OUTPUT_PP` | push-pull output, drives both high and low. The usual choice for an LED |
| `Mode.OUTPUT_OD` | open-drain output, only pulls low, a pull-up resistor makes it high. For a line several devices share |
| `Mode.INPUT` | digital input |
| `Mode.ANALOG` | analog mode, the digital input is off, which saves the most power. Read analog voltages with the [ADC](adc.md) |

`speed` only changes how steep the edges of the output are, not how fast the program can change it. Keep the default `LOW` unless you need more, it makes the least noise. `Speed.MAX` is not supported yet.

## Methods

| Method | Description |
|---|---|
| `on()` | drive the pin high |
| `off()` | drive the pin low |
| `toggle()` | invert the output |
| `write(value)` | low when `value` is 0, high otherwise |
| `read() -> int` | the level of the pin, 0 or 1 |

> On many boards the LED sits between the pin and 3.3 V, such as PC13 on the Blue Pill. Then `off()` turns it on and `on()` turns it off.

## External interrupt on_edge

Calls a handler as soon as the level of the pin changes, instead of checking it in the main loop.

```python
from stmpy import GPIO, Mode, Pull, Edge

key = GPIO("PA0", Mode.INPUT, pull=Pull.UP)
presses: int = 0

@key.on_edge(Edge.FALLING, priority=2)
def on_press():
    global presses
    presses += 1
```

| Parameter | Default | Description |
|---|---|---|
| `edge` | `Edge.FALLING` | `RISING`, `FALLING`, or `BOTH` for either |
| `priority` | 8 | priority, 0-15, lower is more urgent |

- The pin must be `Mode.INPUT`, set its pull resistor with `pull` as usual.
- Without an external pull resistor do not use `Pull.NONE`, a floating pin triggers all the time.

The general rules of interrupts are in [Interrupts](../language/interrupts.md).

### Pin numbers cannot repeat

The chip has 16 external interrupt lines (EXTI0-EXTI15), and pins with the same number share one, whatever their port. So **pins with `on_edge` must all have different numbers**:

| Written | Result | Why |
|---|---|---|
| `on_edge` on PA5 and on PB5 | error | both need EXTI5 |
| `on_edge` twice on one pin | error | same reason, use `Edge.BOTH` for both edges |
| `on_edge` on PA5 and on PA6 | fine | different lines |
| `on_edge` on PA5 and on PB6 | fine | different lines, the port does not matter |
| `on_edge` on PA5, only `read()` on PB5 | fine | a plain input takes no line |

The error of a clash says who has the line:

```
main.py:10: ValueError: EXTI5 is already used by a.on_edge at main.py:6
```

Some lines share an interrupt vector:

| EXTI line | Vector |
|---|---|
| 0-4 | one each: `EXTI0` - `EXTI4` |
| 5-9 | shared `EXTI9_5` |
| 10-15 | shared `EXTI15_10` |

Pins sharing a vector (such as PA5 and PA6) each call their own handler, but they need the same priority.

## Pins

- **PA13 and PA14 cannot be used.** They are the SWD debug port, flashing and debugging need them.
- **PA15, PB3 and PB4** belong to the JTAG debug port after reset. When a program uses them, the compiler hands them over, SWD keeps working.
- A pin has one use: a pin taken by a UART, a PWM output and so on cannot be a GPIO too, and the other way round.
- Completing `GPIO("")` in the editor lists every pin of your chip that can be used.
