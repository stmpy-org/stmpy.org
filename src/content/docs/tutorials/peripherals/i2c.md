---
title: I2C
sidebar:
  order: 10
---

# I2C

I2C is a two-wire bus, common for sensors, EEPROMs and OLED displays. StmPy's I2C is a bus master, and data goes in and out through `bytearray` buffers (see [Arrays](../../language/arrays/)).

## Usage

This example reads the acceleration of an MPU6050. The driver is a file of its own that takes a bus object and does not care which pins it uses:

```python
# mpu.py
from stmpy import I2C

ADDR = 0x68
_raw = bytearray(6)

def wake(bus: I2C) -> None:
    bus.write_reg(ADDR, 0x6B, 0)

def accel_x(bus: I2C) -> int:
    if not bus.read_regs(ADDR, 0x3B, _raw):
        return 0
    x = (_raw[0] << 8) | _raw[1]
    if x >= 0x8000:
        x -= 0x10000
    return x
```

```python
# main.py
from stmpy import I2C, UART, delay_ms
import mpu

bus = I2C(1, freq=400_000)
uart = UART(2)

def main():
    if not bus.ping(mpu.ADDR):
        uart.write("no mpu6050\n")
    mpu.wake(bus)
    while True:
        uart.write_int(mpu.accel_x(bus))
        uart.write("\n")
        delay_ms(100)
```

A bus can have several devices with different addresses, pass the same bus object to each driver.

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `id` | required | I2C number, 1 is I2C1 |
| `freq` | 100_000 | bus clock in Hz: 100 kHz in standard mode, up to 400 kHz in fast mode |
| `scl` | `""` | clock pin such as `"PB8"`, see "Pins" |
| `sda` | `""` | data pin such as `"PB9"`, see "Pins" |

## Methods

`addr` is the 7 bit device address, such as 0x68; `reg` is an 8 bit register address.

| Method | Description |
|---|---|
| `write(addr, data: bytearray) -> bool` | send `data` |
| `read(addr, buf: bytearray) -> bool` | fill `buf` |
| `write_reg(addr, reg, value) -> bool` | write one register (one byte) |
| `read_reg(addr, reg) -> int` | read one register, -1 on failure |
| `write_regs(addr, reg, data: bytearray) -> bool` | write the registers from `reg` on |
| `read_regs(addr, reg, buf: bytearray) -> bool` | read the registers from `reg` on into `buf` |
| `ping(addr) -> bool` | whether a device answers at this address |

The methods returning `bool` give `True` when the device acknowledged every byte, `False` when it did not answer, the bus had an error, or 100 milliseconds passed.

## Pins

Without `scl` and `sda` the I2C takes its default pins. To use others, give both, and they must belong to this I2C. On STM32F1 the compiler picks the remap.

```python
bus = I2C(1, scl="PB8", sda="PB9")
```

STM32F103:

| I2C | Pin set | SCL | SDA | Chips |
|---|---|---|---|---|
| I2C1 | default | PB6 | PB7 | all |
| I2C1 | remap | PB8 | PB9 | 48 pins and up |
| I2C2 | default | PB10 | PB11 | xB and up, 48 pins and up |

| Written | Result |
|---|---|
| `I2C(1)` | PB6, PB7 |
| `I2C(1, scl="PB8", sda="PB9")` | I2C1 remap |
| `I2C(1, scl="PB8")` | error: both pins are needed |
| `I2C(1, scl="PB8", sda="PB7")` | error: the pins are not in the same set |
| `I2C(2, scl="PB8", sda="PB9")` | error: PB8 is not an SCL of I2C2, choose PB10 |

- **SCL and SDA both need pull-up resistors**, 4.7 kΩ to 3.3 V is common. The internal pull-ups do not work in I2C mode.
- The USART1 remap (`tx="PB6"`) also uses PB6 and PB7, it clashes with the default pins of I2C1.
- For STM32F4 and other chips, completion in the editor and the compile errors are the reference.

## Clock

- I2C is on the APB1 bus. On an STM32F103 in the usual 72 MHz setup, PCLK1 is 36 MHz.
- The lowest frequency depends on PCLK1: 4396 Hz at 36 MHz, 977 Hz at 8 MHz (the default HSI). Lower is a compile error.
- Fast mode (above 100 kHz) has a low to high ratio of 2:1.

## Bus recovery at start

When the microcontroller resets in the middle of a transfer, a device can keep SDA low and the bus is stuck. So at start the two pins are first used as plain GPIO: while SDA is low, up to 9 clocks on SCL let the device finish its byte, then a START and a STOP reset every device, and only then does the I2C peripheral take the pins.

The I2C of STM32F1 also has a hardware issue: a glitch on the lines can leave the BUSY flag set, after which the peripheral never sends a START again (errata ES096 2.13.7). The peripheral is reset once at start to clear it.

## Notes

- The timeout of every transfer counts SysTick, so **they cannot be called in an interrupt handler**, that is a compile error.
- After a failed transfer the peripheral is back to idle and the next one can simply retry. A bus that gets stuck while running is not recovered for now, the board has to be powered off and on.
- Register addresses are 8 bits. For EEPROMs with 16 bit addresses such as the 24C32, put the address bytes together yourself with `write` and `read`.
