---
title: Introduction
sidebar:
  order: 0
---

# Introduction

StmPy lets you program STM32 microcontrollers in Python syntax.

```python
from stmpy import GPIO, delay_ms

led = GPIO("PC13")

def main():
    while True:
        led.toggle()
        delay_ms(500)
```

This code never runs in a Python interpreter. StmPy translates it to C on top of the STM32 HAL library, compiles that with `arm-none-eabi-gcc` into a `.hex` firmware file, and you flash it to the chip. The program runs as fast as hand-written C, and the chip needs no interpreter.

## How it differs from Python

StmPy uses Python syntax, but its rules are closer to C:

- **Types are fixed at compile time.** A variable that starts as an `int` stays an `int`.
- **Arrays have a fixed length.** There is no `append`, and no `dict` or `set`.
- **Peripherals are objects at the top level of a file**, such as `GPIO("PC13")` or `UART(1)`. Their arguments must be known at compile time.
- **Mistakes are caught at compile time**: a pin used twice, a peripheral the chip does not have, a call that would hang inside an interrupt. You find out when you build, not on the board.

See the [language overview](language/overview/) for what is supported.

## What it can do

- **Peripherals**: GPIO, timers, PWM, input capture, encoders, ADC, DAC, UART, I2C, SPI, CAN, RTC, watchdogs, internal flash, low power modes and CRC.
- **Interrupts**: attach a function to a peripheral with a decorator, such as `@key.on_edge()`.
- **Background transfers**: UART and SPI sends, UART receives and continuous ADC conversions can run by DMA in the background.
- **Chips**: the whole STM32F1 and STM32F4 series. Switching chips usually means changing the part number in the project file and nothing else.
- **Editor support**: completion, hover, go to definition and error checking on save. Completing a pin argument lists the pins of your chip.

## Next steps

- [Installation](getting-started/installation/)
- [Your first program](getting-started/first-project/): from a new project to a blinking LED
