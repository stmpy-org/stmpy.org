---
title: Modules and imports
order: 4
---

# Modules and imports

A program can be split into several files. Imports are written as in Python, but all files are analyzed together at compile time, nothing is imported at run time.

## Basic rules

- **`import` can only be at the top level of a file**, an import in a function is an error.
- **Where modules are found**, in this order:
  1. The libraries that come with StmPy, for now only `stmpy`
  2. The project root (the directory of the `.spp`): `x.py` modules, `x/` packages with an `__init__.py`, and plain directories without one
- **Do not name a project module like a library that comes with StmPy**, the library wins.
- **The entry file cannot be imported** by another module.
- **No circular imports.** A importing B while B imports A is a compile error, the message shows the chain.
- **Names starting with `_` are private to their module**, other modules cannot import them.

## import

```python
import stmpy
import stmpy as sp
import drivers.mpu
```

Use the module name with it: `stmpy.GPIO("PA1")`, `sp.GPIO("PA1")`.

`import drivers.mpu` binds the name `drivers`, reach the module as `drivers.mpu.read()`. `import drivers.mpu as mpu` binds `mpu` itself.

## from import

```python
from stmpy import GPIO
from stmpy import GPIO as G
from drivers import mpu
```

Use the imported names directly: `GPIO("PA1")`, `G("PA1")`, `mpu.read()`. Submodules of a package can be imported this way too.

## import *

```python
from stmpy import *
```

Imports every name a module exports. With `__all__` in the module, those are the names in it; without, every name that does not start with `_`.

`__all__` can only be defined once at the top level of a module, and its value must be a list of strings.

## Relative imports

```python
from . import util
from .util import delay
from ..core import config as cfg
```

`.` is the package of the current file, `..` the one above it, and so on.

- A relative import cannot go above the project root.
- The files in the project root cannot use relative imports, write an absolute import instead.

## Across modules

- **The global variables and arrays of another module are read only.** To change one, add a function to that module that does it.
- **Peripheral objects can be used across modules**, such as a `key` defined in `board.py` and `@board.key.on_edge()` in `main.py`.
- **Each peripheral can be defined only once.** For several files to use the same `UART`, they all import the same object.

A common layout puts pins and peripherals in `board.py` and drivers in `drivers/`. The drivers take peripheral objects as parameters, so they do not care which pins are used:

```python
# drivers/mpu.py
from stmpy import I2C

ADDR = 0x68

def wake(bus: I2C) -> None:
    bus.write_reg(ADDR, 0x6B, 0)
```

```python
# main.py
from stmpy import I2C
from drivers import mpu

bus = I2C(1, freq=400_000)

def main():
    mpu.wake(bus)
```
