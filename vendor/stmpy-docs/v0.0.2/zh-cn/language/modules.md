---
title: 模块和 import
order: 4
---

# 模块和 import

程序可以拆成多个文件。写法和 Python 一样，但所有文件在编译时就一起分析，不会在运行时导入。

## 基本规则

- **`import` 只能写在文件顶层**，写在函数里会报错。
- **模块的查找顺序**：
  1. StmPy 自带的库，目前只有 `stmpy`
  2. 工程根目录（`.spp` 所在的目录）：`x.py` 模块、带 `__init__.py` 的 `x/` 包，以及没有 `__init__.py` 的普通目录
- **工程里的模块不要和自带库同名**，同名时用的是自带库。
- **入口文件不能被别的模块 import。**
- **不能循环引用。** A import B、B 又 import A 时编译报错，错误信息会列出引用链。
- **`_` 开头的名字是模块私有的**，别的模块不能 import 它。

## import

```python
import stmpy
import stmpy as sp
import drivers.mpu
```

用的时候带上模块名：`stmpy.GPIO("PA1")`、`sp.GPIO("PA1")`。

`import drivers.mpu` 绑定的名字是 `drivers`，用 `drivers.mpu.read()` 访问。`import drivers.mpu as mpu` 绑定的才是 `mpu` 本身。

## from import

```python
from stmpy import GPIO
from stmpy import GPIO as G
from drivers import mpu
```

直接用导入的名字：`GPIO("PA1")`、`G("PA1")`、`mpu.read()`。也可以导入包里的子模块。

## import *

```python
from stmpy import *
```

导入一个模块导出的所有名字。模块里定义了 `__all__` 时按 `__all__` 导出，没有时导出所有不以 `_` 开头的名字。

`__all__` 只能在模块顶层定义一次，值必须是字符串列表。

## 相对导入

```python
from . import util
from .util import delay
from ..core import config as cfg
```

`.` 是当前文件所在的包，`..` 是上一级，依此类推。

- 相对导入不能越过工程根目录。
- 工程根目录下的文件不能用相对导入，直接写绝对导入即可。

## 跨模块使用

- **别的模块的全局变量和数组只能读。** 要修改的话，在那个模块里写一个函数来改。
- **外设对象可以跨模块使用**，比如在 `board.py` 里定义 `key`，在 `main.py` 里写 `@board.key.on_edge()`。
- **同一个外设只能定义一次。** 多个文件要用同一个 `UART`，就都 import 同一个对象。

一个常见的拆分方式是：把引脚和外设集中写在 `board.py`，驱动放在 `drivers/` 里，驱动的函数接收外设对象作为参数，不关心具体的引脚：

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
