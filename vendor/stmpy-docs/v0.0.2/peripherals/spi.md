---
title: SPI
order: 11
---

# SPI

SPI is a fast synchronous bus, common for flash memory chips, displays and SD cards. StmPy's SPI is a bus master, and data goes in and out through `bytearray` buffers (see [Arrays](../language/arrays.md)).

Chip select (CS) is not part of the SPI object, drive it with a plain [GPIO](gpio.md).

```python
from stmpy import SPI, GPIO, UART

flash = SPI(1, baudrate=4_000_000)
cs = GPIO("PA4")
uart = UART(2)
cmd = bytearray([0x9F, 0, 0, 0])

def main():
    cs.on()                 # deselect
    cs.off()                # select
    flash.transfer(cmd)     # send 0x9F and 3 dummy bytes, cmd gets what came back
    cs.on()
    uart.write_int(cmd[1])  # manufacturer ID
```

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `id` | required | SPI number, 1 is SPI1 |
| `baudrate` | 1_000_000 | clock in Hz, the highest rate up to this one is taken |
| `mode` | 0 | 0-3, clock polarity × 2 + clock phase, as the device datasheet says |
| `sck` | `""` | clock pin such as `"PB3"`, see "Pins" |
| `miso` | `""` | data in pin such as `"PB4"` |
| `mosi` | `""` | data out pin such as `"PB5"` |
| `background_send` | `False` | send in the background with `send()`, see "Background send" |

## Methods

| Method | Description |
|---|---|
| `write(data: bytearray)` | send `data`, what comes back is dropped |
| `read(buf: bytearray)` | send 0xFF for each byte and fill `buf` with what comes back |
| `transfer(buf: bytearray)` | send `buf` and replace each byte with the one received at the same time |
| `transfer_byte(b) -> int` | send one byte and return the one received at the same time |
| `send(data: bytearray)` | start sending `data` in the background and return at once, what comes back is dropped. Needs `background_send` |
| `busy() -> bool` | whether a background send is still going on |

Only 8 bit data, most significant bit first.

## Pins

Without any of the three pins the SPI takes its default pins. With any of them only those are used: `sck` is required, and at least one of `miso` and `mosi`. The pins must belong to this SPI, and on STM32F1 the compiler picks the remap.

```python
lcd = SPI(1, sck="PA5", mosi="PA7")     # send only, PA6 is free for other uses
flash = SPI(2)                          # PB13, PB14, PB15
```

STM32F103:

| SPI | Pin set | SCK | MISO | MOSI | Chips |
|---|---|---|---|---|---|
| SPI1 | default | PA5 | PA6 | PA7 | all |
| SPI1 | remap | PB3 | PB4 | PB5 | all |
| SPI2 | default | PB13 | PB14 | PB15 | xB and up, 48 pins and up |
| SPI3 | default | PB3 | PB4 | PB5 | xE / xG |

| Written | Result |
|---|---|
| `SPI(1, sck="PB3", miso="PB4", mosi="PB5")` | SPI1 remap |
| `SPI(1, sck="PA5", mosi="PA7")` | send only, no `read`, `transfer` or `transfer_byte` |
| `SPI(1, sck="PA5", miso="PA6")` | receive only, no `write`, `transfer` or `transfer_byte` |
| `SPI(1, sck="PA5")` | error: one of `miso` and `mosi` is needed |
| `SPI(1, sck="PB3", mosi="PA7")` | error: the pins are not in the same set |

- With several devices on a bus, each gets its own chip select pin. The NSS pin is not used.
- The SPI1 remap uses the pins of SPI3, they cannot be used together.
- PB3 and PB4 belong to JTAG after reset, the compiler hands them over when they are used, SWD keeps working.
- A pin left out is not configured and not taken.
- For STM32F4 and other chips, completion in the editor and the compile errors are the reference.

## Clock

- SPI1 is on the APB2 bus, SPI2 and SPI3 on APB1. The divider can only be 2, 4, 8 ... 256.
- The rate is the highest one up to `baudrate`. For example SPI1 at 4 MHz in the 72 MHz setup: dividing by 16 gives 4.5 MHz, too fast, so it divides by 32 for 2.25 MHz. Hover over the object in the editor to see the real rate.
- The highest rate is 18 MHz on STM32F1, 12 MHz on F100, and half the bus clock on STM32F4, such as 42 MHz for SPI1 and 21 MHz for SPI2 and SPI3 at 168 MHz. A higher value still gets only that.
- The lowest is 1/256 of the bus clock, about 281 kHz for SPI1 and 141 kHz for SPI2 in the 72 MHz setup. Lower is a compile error.

## Background send

Large blocks of data, such as a frame for a display, suit `send()`: DMA takes them, it returns at once and the program goes on.

```python
from stmpy import SPI, GPIO

lcd = SPI(1, baudrate=18_000_000, sck="PA5", mosi="PA7", background_send=True)
cs = GPIO("PA4")
frame = bytearray(1024)

@lcd.on_sent()
def on_sent():
    cs.on()         # called once everything is out, release chip select now

def main():
    cs.on()
    fill(frame)
    cs.off()
    lcd.send(frame)
```

The rules are those of [background send on a UART](uart.md):

1. The argument of `send` must be the name of a global array, otherwise it is a compile error.
2. Do not change the array while it is being sent.
3. While a send is going on, `send`, `write`, `transfer` and the others first wait for it. `read` and `transfer` then get new data, what came back during the send is dropped.
4. The array has at most 65535 bytes.
5. Do not release chip select before `send` is done, check with `busy()` or `on_sent`.

The compiler assigns the DMA channel. On STM32F1 the channel of each SPI is fixed by the hardware:

| SPI | DMA channel | Chips |
|---|---|---|
| SPI1 | DMA1 channel 3 | all |
| SPI2 | DMA1 channel 5 | xB and up |
| SPI3 | DMA2 channel 2 | xE / xG |

A channel has one use, a clash is a compile error:

| Written | Result |
|---|---|
| `SPI(1, background_send=True)` with `UART(3, rx_buffer=64)` | error: both need DMA1 channel 3 |
| `SPI(2, background_send=True)` with `UART(1, rx_buffer=64)` | error: both need DMA1 channel 5 |

## Notes

- Transfers wait until done, with no timeout, so they work in interrupt handlers. But do not use one SPI from both the main loop and a handler, a transfer in the handler is dropped while the bus is busy.
- The methods an SPI cannot use are only checked on calls by the object's name, not when it is passed to a function as a parameter.
