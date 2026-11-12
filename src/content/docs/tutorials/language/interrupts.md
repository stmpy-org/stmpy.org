---
title: Interrupts
sidebar:
  order: 5
---

# Interrupts

Interrupts are written with decorators: the decorator belongs to a peripheral object, and the decorated function is the interrupt handler. When the hardware event happens, the chip pauses the main program, calls the function, and then goes back.

```python
from stmpy import GPIO, Mode, Pull, Edge

led = GPIO("PC13")
key = GPIO("PA0", Mode.INPUT, pull=Pull.UP)
pressed: bool = False

@key.on_edge(Edge.FALLING, priority=2)
def on_press():
    global pressed
    pressed = True

def main():
    global pressed
    while True:
        if pressed:
            pressed = False
            led.toggle()
```

## Rules

1. **Decorators need parentheses**: write `@key.on_edge()`, not `@key.on_edge`.
2. **Define or import the peripheral object before the decorator.** An object of another module works too, such as `@board.key.on_edge()`.
3. **Decorator arguments must be compile time constants**, like the arguments of a peripheral.
4. **The decorator decides the signature of the handler**, which returns nothing. Most are `def f()`, a few pass data in, such as `def f(b: int)` for `on_rx` of a UART.
5. A function can have several decorators, it is called when any of the events happens.
6. **Code cannot call a handler directly**, and `main` cannot be a handler.
7. `key.on_edge()` is only a decorator, it cannot be a statement of its own.

## Available interrupts

| Decorator | Called when | Handler | See |
|---|---|---|---|
| `GPIO.on_edge` | a pin sees a rising or falling edge | `def f()` | [GPIO](../../peripherals/gpio/) |
| `Timer.on_update` | each period ends | `def f()` | [Timer](../../peripherals/timer/) |
| `Capture.on_capture` | an edge is captured | `def f(t: int)`, the count | [Input capture](../../peripherals/capture/) |
| `UART.on_rx` | a byte arrives | `def f(b: int)`, the byte | [UART](../../peripherals/uart/) |
| `UART.on_idle` | the line goes quiet after some bytes | `def f()` | [UART](../../peripherals/uart/) |
| `UART.on_sent`, `SPI.on_sent` | a background send has finished | `def f()` | [UART](../../peripherals/uart/), [SPI](../../peripherals/spi/) |
| `CAN.on_rx` | a received message is waiting | `def f()` | [CAN](../../peripherals/can/) |
| `RTC.on_second` | every second | `def f()` | [RTC](../../peripherals/rtc/) |
| `RTC.on_alarm` | the alarm time is reached | `def f()` | [RTC](../../peripherals/rtc/) |

## Priority

Every decorator has a `priority` parameter, 8 by default.

- From 0 to 15, **lower numbers are more urgent**. An interrupt of a higher priority can interrupt the running handler of a lower one.
- **Handlers sharing an interrupt vector need the same priority**, otherwise it is a compile error. For example, `on_edge` of PA5 and of PA6 are both on the `EXTI9_5` vector.
- SysTick, which keeps the system time, has the lowest priority, 15. `delay_ms` and `ticks_ms` count on it.

## Calls that cannot be used in a handler

SysTick does not run while a handler runs, so a call waiting for SysTick would never return in a handler. These calls are compile errors in a handler, also when called through other functions:

| Call | Why |
|---|---|
| `delay_ms` | waits for SysTick |
| `uart.read_byte` | the timeout counts SysTick |
| `capture.read` | the timeout counts SysTick |
| all I2C transfers | the timeout counts SysTick |
| `power.sleep` / `stop` / `standby` | the handler holds off interrupts of its level and below, nothing could wake the chip |
| `flash.erase` / `write` | the CPU stops for tens of milliseconds, and it fails while the main loop is writing |

For example:

```python
def wait() -> None:
    delay_ms(1)

@key.on_edge()
def handler():
    wait()
```

The error points at the line of `delay_ms(1)` and shows the chain of calls:

```
ValueError: delay_ms cannot be used in an interrupt handler: handler -> wait -> delay_ms
```

Allowed, with care:

- `delay_us` counts CPU cycles and works in a handler. But waiting in a handler holds up the other interrupts of its level and below.
- `uart.write` works and returns once the bytes are sent. But while the main loop is sending on the same UART, the send in the handler is dropped without an error.

## Shared variables

Interrupts and the main program usually exchange data through global variables. **A global variable that a handler uses, and that is written anywhere, is made `volatile` by the compiler**, including those used in functions the handler calls. Read only globals are left as they are.

Without `volatile`, the optimizer could read `if pressed:` in the main loop only once and never see the change made by the interrupt. The compiler takes care of this for you.

What you do have to keep in mind: `volatile` makes every read and write go to memory, but **a read, change and write is not one step**. When `count += 1` is in both the main loop and a handler, an update can get lost.

## Notes

- Keep handlers short. While one runs, the interrupts of its level and below wait.
- Interrupts are enabled once every peripheral is set up, they are on when `main()` starts.
- Mechanical buttons bounce, one press can trigger several interrupts. Filter them in the handler if needed.
- There is no way yet to avoid the read, change and write race completely, critical sections will come later.
