---
title: CAN
order: 12
---

# CAN

CAN is the bus of cars and industrial equipment. The pins of the chip do not connect to the bus directly, a transceiver chip such as the TJA1050 goes in between.

```python
from stmpy import CAN, delay_ms

bus = CAN(bitrate=500_000)
data = bytearray(8)

def main():
    while True:
        data[0] += 1
        bus.send(0x123, data)       # into a mailbox, returns at once

        while bus.available():
            who = bus.id()          # who sent it, the message stays
            n = bus.read(data)      # take the message, returns its length
        delay_ms(100)
```

Receiving by interrupt:

```python
@bus.on_rx()
def on_message():
    while bus.available():
        who = bus.id()
        n = bus.read(data)
```

## Parameters

| Parameter | Default | Description |
|---|---|---|
| `bitrate` | 500_000 | bit rate, up to 1_000_000. Every node on the bus must use the same |
| `tx` | `""` | transmit pin. Give both `tx` and `rx` or neither |
| `rx` | `""` | receive pin |
| `loopback` | `False` | loopback mode: the program receives its own messages and nothing goes on the bus |
| `id` | 1 | which CAN. F105, F107, F405, F407 and others have CAN1 and CAN2, F413 and F423 also CAN3 |

## Methods

| Method | Description |
|---|---|
| `send(id, data: bytearray, extended=False) -> bool` | put the message in a transmit mailbox and return at once. `False` when the mailboxes are full or the arguments are not valid |
| `available() -> bool` | whether a received message is waiting |
| `id() -> int` | the ID of the waiting message, -1 when there is none. The message stays |
| `extended() -> bool` | whether the waiting message has a 29 bit ID |
| `read(buf: bytearray) -> int` | take the message into `buf` and return its length, -1 when there is none. `buf` should have 8 bytes, what does not fit is dropped |
| `@on_rx(priority=8)` | calls the handler while a received message is waiting, the handler is `def f()` |

IDs are 11 bits by default (0 to 0x7FF), 29 bits with `extended=True` (0 to 0x1FFFFFFF). A message has at most 8 bytes.

## Trying it without a bus

`loopback=True` needs no transceiver and no second node, use it to check that the program works first:

```python
bus = CAN(loopback=True)
```

## Pins

STM32F103:

| Pin set | TX | RX | Chips |
|---|---|---|---|
| default | PA12 | PA11 | all |
| remap | PB9 | PB8 | 48 pins and up |
| remap | PD1 | PD0 | 100, 144 pins |

RX is an input with a pull-up, so the CAN starts even without a transceiver. For other chips, completion in the editor and the compile errors are the reference.

## Bit rate

The compiler works out the prescaler from PCLK1, and **the bit rate must come out exactly, otherwise it is a compile error**. Nodes that are slightly off can fail to talk to each other, so no approximation is taken.

| PCLK1 | Common bit rates that work |
|---|---|
| 36 MHz (STM32F103 at 72 MHz) | 125k, 250k, 500k, 1M |
| 8 MHz (the default HSI) | 125k, 250k, 500k, 1M, but HSI is not accurate enough for a real bus |

> **Use the external crystal on a real bus** (`use_hse = true`), HSI can be off by more than CAN allows.

The sample point is near 87.5%. Hover over the object in the editor to see the real values.

## Sending

- The hardware has 3 transmit mailboxes. `send` puts the message in a free one and returns, messages go out in the order they were put in.
- **A bus with only one node does not work**, that is how CAN is defined: without another node acknowledging, a message is sent again and again, the mailboxes fill up and then `send` returns `False`. With one node, use `loopback`.
- After too many errors the hardware leaves the bus by itself (bus off), and comes back when it recovers.
- `send` does not wait, so it works in interrupt handlers.

## Receiving

- The hardware holds 3 messages. When the program does not read them in time, a new message replaces the newest one, silently. Use `on_rx` on a busy bus.
- For now every message on the bus is received, the program decides by `id()` what it wants. On a very busy bus this takes CPU time.
- **The `on_rx` handler must read the messages**, otherwise the interrupt comes again as soon as it returns and the program does nothing else.

## Notes

- F100, F101, F102, F401, F410 and F411 have no CAN, using it is a compile error.
- Each CAN can have only one object.
- CAN1 and CAN2 share one set of filters, half each. Using CAN2 turns on the clock of CAN1 too. CAN3 of F413 and F423 has its own filters.
- The CAN of the STM32F103 shares a block of memory with USB, so the two cannot be used together, and they share the `USB_LP_CAN1_RX0` interrupt vector. F105 and F107 do not have this limit.
