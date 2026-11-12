---
title: Arrays
order: 3
---

# Arrays

Arrays are written as in Python, but **their length is fixed at compile time**, elements cannot be added or removed later. The buffers of I2C, SPI and UART are arrays.

## Creating arrays

```python
buf = bytearray(8)                  # 8 bytes, all 0
raw = bytearray([0xAA, 1, 2])       # bytes with the given values
samples = [0] * 16                  # 16 ints
table = [1, 2, 4, 8]                # a list literal
pattern = [0, 1] * 3                # [0, 1, 0, 1, 0, 1]
weights: list[float] = [0.5, 1, 2]  # an annotation decides the type, 1 and 2 are stored as float
```

| Written as | Elements | Each element takes | Parameter annotation |
|---|---|---|---|
| `bytearray(n)` / `bytearray([...])` | `int`, 0-255 | 1 byte | `bytearray` |
| `[0] * n` / `[1, 2]` | `int` | 4 bytes | `list[int]` |
| `[0.0] * n` | `float` | 4 bytes | `list[float]` |
| `[False] * n` | `bool` | 1 byte | `list[bool]` |

Without an annotation the elements decide: all `bool` makes a `bool` array, any `float` makes a `float` array, anything else an `int` array.

## Using arrays

```python
def checksum(data: bytearray) -> int:   # no length in a parameter, any length can be passed
    s = 0
    for b in data:
        s = (s + b) & 0xFF
    return s

def main():
    buf[0] = 0x12
    buf[-1] = checksum(buf)             # a negative constant index counts from the end, here buf[7]
    n = len(buf)                        # 8
```

| Operation | Notes |
|---|---|
| `a[i]`, `a[i] = v`, `a[i] += v` | read and write by index |
| `len(a)` | the length, a constant for a fixed size array |
| `for x in a:` | every element in turn |
| `f(a)` | pass to a function or a peripheral method, such as `uart.write_bytes(buf)` |

## Rules

1. **The length must be a compile time constant**, at least 1.
2. **An array can only be created when it is assigned to a name.** `f([1, 2])` does not work, write `a = [1, 2]` and then `f(a)`.
3. **An array cannot be assigned as a whole.** `a = b` is an error, copy element by element. A local array can be created again, with the same length and type.
4. **Arrays are passed by reference.** When a function changes an element, the caller's array changes too.
5. **A function cannot return an array.** Pass one in for the function to fill.
6. **The global arrays of another module are read only**, like its global variables.
7. **Local arrays live on the stack**, which is only 1 KB by default, so a local array above 256 bytes is a compile error. Make large arrays global.
8. The index in `a[i] += v` cannot call a function, compute it into a local variable first.

## Out of bounds

As in C, **indexes are not checked at run time**, an index out of bounds reads or writes other memory.

- **A constant index** is checked at compile time, out of bounds is an error. A negative constant index counts from the end.
- **A variable index** is used as it is, a negative one does not count from the end. Keep it between 0 and `len(a) - 1` yourself.
- The elements of a `bytearray` are 0-255: a constant outside that is a compile error, a value at run time keeps only its low 8 bits, so 300 is stored as 44.

## Shared with interrupts

A global array that an interrupt handler uses and that is written anywhere is made `volatile` by the compiler. Passing an array to a function counts as writing it, since the function may change its elements. See the "Shared variables" section of [Interrupts](interrupts.md).

## Not supported yet

Slices (`a[1:3]`), byte string literals (`b"\x01"`), arrays of several dimensions, `append` and `pop`.
