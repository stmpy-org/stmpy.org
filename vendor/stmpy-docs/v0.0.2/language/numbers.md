---
title: Numbers and operators
order: 2
---

# Numbers and operators

## int

`int` is a 32 bit signed integer, from -2147483648 to 2147483647.

- **Constants must be in this range**, a constant outside it is a compile error. Hexadecimal too: `0xFFFFFFFF` does not fit an `int`, write `-1` instead.
- **Constant expressions are computed at compile time**, and their result must be in range as well, so `1 << 31` is an error.
- **Overflow at run time has no guaranteed result**: it may wrap around, or the compiler may optimize on the assumption that it never happens. Do not rely on the value after an overflow. Where a value has to stay within some bits, such as for a CRC or a mask, keep it there with `& 0xFFFF` and the like.

`bool` takes part in arithmetic as an `int`: `True + 1` is 2.

## float

`float` is a 32 bit single precision number with about 7 significant digits. An integer above 16777216 (2²⁴) loses precision when stored as a `float`.

An operation on an `int` and a `float` gives a `float`.

There is no way yet to turn a `float` back into an `int`, `int()` is not supported.

## Division

Division follows Python, **not C**:

| Expression | Result | Example |
|---|---|---|
| `a / b` | always a `float` | `7 / 2` is `3.5` |
| `a // b` | rounded down | `7 // 2` is `3`, `-7 // 2` is `-4` |
| `a % b` | has the sign of the divisor | `-7 % 2` is `1` |

C rounds integer division toward zero, so `-7 / 2` is `-3` in C. The code StmPy generates follows the Python rules, so the results differ from C for negative numbers.

The result of `/` is a `float` and cannot be assigned to an `int` variable:

```python
x = 7
y: int = x / 2      # error: y is an int, x / 2 is a float
z = x // 2          # 3
```

A divisor that is the constant 0 is a compile error. When a divisor computed at run time is 0, the result is not guaranteed.

## Bitwise operators

`&` `|` `^` `~` `<<` `>>` work on `int` only. `>>` is an arithmetic shift, a negative number stays negative.

A common pattern, combining two bytes into a signed 16 bit number:

```python
x = (high << 8) | low
if x >= 0x8000:
    x -= 0x10000
```

## Comparison

`int` and `float` can be compared directly. Chained comparison is not supported, write `a < b < c` as `a < b and b < c`.
