---
title: UART
order: 9
---

# UART

A UART is a serial port, for talking to a computer, a GPS, a Bluetooth module and similar devices. Data is always 8 bits, parity and stop bits can be set.

```python
from stmpy import UART

uart = UART(1, baudrate=115200)

def main():
    uart.write("hello\n")
    while True:
        c = uart.read_byte(10)
        if c >= 0:
            uart.write_byte(c)      # echo what arrives
```

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `id` | required | UART number: 1 is USART1, 4 is UART4 |
| `baudrate` | 115200 | baud rate |
| `tx` | `""` | transmit pin such as `"PB6"`, see "Pins" |
| `rx` | `""` | receive pin such as `"PB7"`, see "Pins" |
| `parity` | `Parity.NONE` | parity bit: `NONE`, `EVEN` or `ODD`. Data stays 8 bits |
| `stop_bits` | `StopBits.ONE` | stop bits: `ONE` or `TWO` |
| `rx_buffer` | 0 | bytes of the background receive buffer, see "Background receive". 0 means none |
| `background_send` | `False` | send in the background with `send()`, see "Background send" |

## Methods

| Method | Description |
|---|---|
| `write(s: str)` | send a string, returns once it is sent |
| `write_byte(b)` | send one byte, the low 8 bits of `b` |
| `write_bytes(data: bytearray)` | send every byte of `data` |
| `write_int(n)` | send `n` as decimal text, `123` goes out as `"123"` |
| `read_byte(timeout_ms) -> int` | wait up to `timeout_ms` milliseconds for a byte, -1 on timeout. A negative timeout waits forever |
| `available() -> bool` | whether a received byte is waiting |
| `read_into(buf: bytearray) -> int` | move bytes from the background receive buffer to `buf` without waiting, returns how many. Needs `rx_buffer` |
| `send(data: bytearray)` | start sending `data` in the background and return at once. Needs `background_send` |
| `busy() -> bool` | whether a background send is still going on |

## Pins

Without `tx` and `rx` the UART takes its default pins. With only one of them, only that direction is used and the other pin is free for something else.

```python
gps = UART(2, 9600, rx="PA3")       # receive only, PA2 stays free
log = UART(1, tx="PB6", rx="PB7")   # the other pins of USART1
```

The pins must belong to the UART, otherwise the error lists the ones that do. On STM32F1 the compiler picks the remap from the pins.

STM32F103:

| UART | Pin set | TX | RX | Chips |
|---|---|---|---|---|
| USART1 | default | PA9 | PA10 | all |
| USART1 | remap | PB6 | PB7 | all |
| USART2 | default | PA2 | PA3 | all |
| USART2 | remap | PD5 | PD6 | 100, 144 pins |
| USART3 | default | PB10 | PB11 | xB and up, 48 pins and up |
| USART3 | partial remap | PC10 | PC11 | xB and up, 64 pins and up |
| USART3 | full remap | PD8 | PD9 | xB and up, 100, 144 pins |
| UART4 | default | PC10 | PC11 | xE / xG |
| UART5 | default | PC12 | PD2 | xE / xG |

| Written | Result |
|---|---|
| `UART(1)` | PA9, PA10 |
| `UART(1, tx="PB6", rx="PB7")` | USART1 remap |
| `UART(1, tx="PA9")` | send only, PA10 stays free. No `read_byte`, `available` or `on_rx` |
| `UART(1, rx="PA10")` | receive only, PA9 stays free. No `write` methods |
| `UART(1, tx="PA9", rx="PB7")` | error: the pins are not in the same set |
| `UART(1, tx="PB10")` | error: PB10 is not a TX of USART1, choose PA9 or PB6 |

- On STM32F4 each pin selects its alternate function on its own, TX and RX can be any of their pins, and more pins are available. The default pins are those of F1.
- RX is an input with a pull-up, so a loose wire does not produce garbage.
- The partial remap of USART3 uses the pins of UART4, they cannot be used together. The USART1 remap clashes with the default pins of I2C1.
- For other chips, completion in the editor and the compile errors are the reference.

## Receive interrupt on_rx

Calls the handler with every byte that arrives (0-255):

```python
from stmpy import UART

uart = UART(1)
last: int = -1

@uart.on_rx(priority=3)
def on_rx(b: int):
    global last
    last = b
    uart.write_byte(b)      # echo
```

- A UART with `on_rx` gives its bytes only to the handler. `read_byte()` and `available()` can no longer be used, calling them is a compile error.
- Keep the handler short: at 115200 baud a byte takes about 87 microseconds, and when two more bytes arrive before the handler returns, the second is lost.
- With parity, bytes with a parity error reach the handler too.
- When the main loop and the handler both `write` to the same UART, the send of the handler can get dropped.

## Background receive

Without `rx_buffer` the hardware holds one byte. If the program does not take it in time, the next byte is lost. At 115200 baud a byte lasts about 87 microseconds, so data gets lost while the program is in `delay_ms` or busy with something else.

With `rx_buffer`, DMA stores incoming bytes in a buffer in the background, without the CPU, and the program reads them when it has time.

For a message of unknown length, such as a line from a module or a GPS sentence, use `on_idle`:

```python
from stmpy import UART

uart = UART(1, rx_buffer=256)
line = bytearray(64)
length: int = 0

@uart.on_idle()
def on_message():
    global length
    length = uart.read_into(line)
```

`on_idle` is called when the line goes quiet, that is when a message is complete.

Without an interrupt, the main loop can take what is there whenever it has time:

```python
def main():
    while True:
        n = uart.read_into(line)
        if n > 0:
            handle(line, n)
        do_other_things()
```

With `rx_buffer`, `read_byte` and `available` work as before and read from the buffer.

### How big a buffer

The buffer holds up to `rx_buffer - 1` bytes, read them before it fills:

| Baud rate | Bytes per second | 256 bytes fill in |
|---|---|---|
| 9600 | 960 | 266 ms |
| 115200 | 11520 | 22 ms |
| 921600 | 92160 | 2.8 ms |

> **Once the buffer is full, new data overwrites the oldest**, the program cannot tell and there is no error. Make the buffer bigger than what can arrive between two reads.

The buffer takes RAM, the RAM usage printed after a build includes it.

### Limits

- `on_rx` and `rx_buffer` do not go together, since the bytes go to the buffer. Using both is a compile error.
- `on_idle` and `read_into` need `rx_buffer`, calling them without is a compile error.
- Do not read the buffer of one UART from both the main loop and a handler, the read position gets mixed up.
- `read_into` can now and then return 0 in `on_idle`, the program has to handle it.
- UART5 of STM32F1 has no DMA, so it cannot have an `rx_buffer`.

## Background send

The `write` methods return once the bytes are sent: 1000 bytes at 115200 baud take about 87 milliseconds. With `background_send=True`, `send()` hands the data to DMA and returns at once, and the program goes on with other work:

```python
from stmpy import UART

uart = UART(1, background_send=True)
report = bytearray(100)

@uart.on_sent()
def on_sent():
    pass            # all sent

def main():
    while True:
        fill(report)
        uart.send(report)
        do_other_things()
        while uart.busy():      # wait before changing report
            pass
```

Rules:

1. **The argument of `send` must be the name of a global array**, otherwise it is a compile error. The send goes on after the function returns, when the local arrays of the function are gone; a parameter does not work either, the compiler cannot tell which array it is.
2. **Do not change the array while it is being sent**, or what goes out is half changed. The compiler cannot catch this, use `busy()` or `on_sent` to know when it is done.
3. While a send is still going on, another `send` or a `write` method first waits for it, the bytes never interleave. The hardware does the waiting, so it does not hang in a handler either, it only waits a bit longer.
4. The array has at most 65535 bytes, and all of it is sent.

`on_sent` is called after the last byte has left the pin, the moment to switch the direction of an RS-485 transceiver. To get there the handler first waits for the last byte, at most one byte's time: about 87 microseconds at 115200 baud, about 1 millisecond at 9600. Interrupts of its level and below wait meanwhile, keep that in mind at low baud rates.

`rx_buffer` and `background_send` can be used together.

## DMA channels

Background receive and send each take a DMA channel. The compiler assigns them, hover over the object in the editor to see which.

On STM32F1 the channels of each UART are fixed by the hardware:

| UART | Receive | Send | Chips |
|---|---|---|---|
| USART1 | DMA1 channel 5 | DMA1 channel 4 | all |
| USART2 | DMA1 channel 6 | DMA1 channel 7 | all |
| USART3 | DMA1 channel 3 | DMA1 channel 2 | xB and up |
| UART4 | DMA2 channel 3 | DMA2 channel 5 | xE / xG |

A channel has one use, a clash is a compile error. For example, background send on UART4 and `continuous` on ADC3 both need DMA2 channel 5. STM32F4 has more choices, the compiler takes a free stream.

## Notes

- The methods a UART cannot use are only checked on calls by the object's name. Passed to a function as a parameter, it cannot be checked, so take care: `read_into` then always returns 0 on a UART without `rx_buffer`, and on a UART without `background_send`, `send` waits until the bytes are sent and `busy()` is always `False`.
