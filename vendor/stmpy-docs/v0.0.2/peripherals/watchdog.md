---
title: Watchdog
order: 14
---

# Watchdog

A watchdog resets the chip when the program hangs or goes astray. The program has to "feed" it regularly, and when it is not fed in time, the chip resets.

```python
from stmpy import IWDG

dog = IWDG(1000)

def main():
    while True:
        work()
        dog.feed()
```

The chip has two watchdogs, IWDG is usually enough:

| | IWDG, independent watchdog | WWDG, window watchdog |
|---|---|---|
| Clock | the internal LSI, independent of the main clock | PCLK1 |
| Accuracy | poor, the real timeout is 2/3 to 4/3 of the setting | good |
| Longest timeout | 26214 ms | 58 ms with PCLK1 at 36 MHz |
| Fed too early | no problem | can reset too |
| For | a safety net that works even when the main clock fails | checking the timing of the program |

## IWDG

| Parameter | Default | Description |
|---|---|---|
| `timeout_ms` | required | time from a feed to the reset, 1-26214 |
| `start` | `True` | start with the program. With `False`, call `start()` |

The LSI of STM32F1 is nominally 40 kHz, but anywhere from 30 to 60 kHz from chip to chip. So the real timeout of `IWDG(1000)` is between 667 and 1333 milliseconds: **feed at 2/3 of the setting**, such as every 500 milliseconds.

The LSI of STM32F4 is nominally 32 kHz, but 17 to 47 kHz, which is even less accurate. `timeout_ms` goes up to about 32768 milliseconds there.

## WWDG

```python
from stmpy import WWDG

# feeds must be more than 10 ms and less than 30 ms apart
dog = WWDG(30, min_feed_ms=10)
```

| Parameter | Default | Description |
|---|---|---|
| `timeout_ms` | required | time from a feed to the reset, the limit depends on PCLK1 |
| `min_feed_ms` | 0 | a feed sooner than this after the last one resets the chip too. 0 allows any time |
| `start` | `True` | start with the program. With `False`, call `start()` |

The timeout is a whole number of steps of `PCLK1 / 4096 / prescaler`. The compiler picks the prescaler, there are at most 64 steps, and the step sets the error. Hover over the object in the editor to see the real value.

| PCLK1 | Longest timeout | Finest step |
|---|---|---|
| 36 MHz | 58 ms | 114 µs |
| 8 MHz | 262 ms | 512 µs |

A feed does not clear the prescaler, so the real timeout can be one step short.

## Methods

Both watchdogs have:

| Method | Description |
|---|---|
| `feed()` | feed the watchdog, the timeout starts again |
| `start()` | start the watchdog, the timeout counts from now |

## Programs that start slowly

Objects are set up in the order they are defined, and with `start=True` the timeout counts from that moment. The rest of the setup and the start of `main()` must fit in it. If they do not, use `start=False` and start the watchdog when ready:

```python
dog = IWDG(1000, start=False)

def main():
    load_config()
    dog.start()
    while True:
        work()
        dog.feed()
```

## Notes

- **Once started, a watchdog cannot be stopped**, only a reset stops it. After a reset it is not running, and the program starts it again.
- When the debugger halts at a breakpoint, the watchdog halts too and does not reset the chip.
- Do not feed unconditionally in a timer interrupt: when the main loop hangs the interrupt keeps running, and the watchdog is useless.
- A program can have one `IWDG` and one `WWDG` object. For several files to feed it, they import the same object.
- With an IWDG, the low power modes must also wake up in time to feed it, see [Low power](power.md).
