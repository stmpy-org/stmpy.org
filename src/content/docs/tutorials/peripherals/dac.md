---
title: DAC
sidebar:
  order: 8
---

# DAC

The DAC outputs an adjustable analog voltage on a pin.

Not every chip has one. On STM32F1 these do: F100, F105, F107, and F101 and F103 of groups xE / xG (such as STM32F103RC and STM32F103ZE). Using it on a chip without one is a compile error.

```python
from stmpy import DAC, delay_ms

out = DAC("PA4")
ref = DAC("PA5", vref_mv=3000)

def main():
    ref.write_mv(1500)
    while True:
        for i in range(4096):
            out.write(i)
        delay_ms(10)
```

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `pin` | required | output pin, `"PA4"` or `"PA5"` |
| `vref_mv` | 3300 | reference voltage in millivolts, `write_mv()` uses it. 2400-3600 |

## Methods

| Method | Description |
|---|---|
| `write(value: int)` | set the output, 0 (0 V) to 4095 (the reference voltage), values outside are clamped |
| `write_mv(mv: int)` | set the output in millivolts, values outside are clamped |

## Pins

| Pin | Channel |
|---|---|
| PA4 | DAC channel 1 |
| PA5 | DAC channel 2 |

A pin can have only one DAC object, and cannot be a GPIO, ADC input and so on at the same time.

## Range and speed

- The output is 0 V until the first write.
- The output buffer is on, which drives loads well but does not reach the rails: only about 0.2 V to VDDA - 0.2 V is accurate.
- Keep the load at 5 kΩ or more.
- `write()` only writes a register and works in interrupt handlers. The output takes about 3-4 microseconds to settle, faster writes are not followed.
- A waveform written from a loop has a frequency that depends on the loop and on interrupts, it is not steady.
