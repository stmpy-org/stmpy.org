---
title: Installation
sidebar:
  order: 1
---

# Installation

There are two ways to use StmPy:

- **StmPy Studio**: a desktop editor that comes with stmpy, the compiler toolchain and the flashing tool. Install it and you are ready. Recommended if you are new.
- **Command line**: only the `stmpy` command, used with the editor of your choice. You install the compiler toolchain and the flashing tool yourself.

## StmPy Studio

Download the installer for your system from the download page at [stmpy.org](https://stmpy.org) or from [GitHub Releases](https://github.com/stmpy-org/stmpy-studio/releases) and install it. Creating, editing, building and flashing projects all happen in Studio, nothing else is needed.

## Command line

### 1. Install stmpy

Download the stmpy archive for your system from the download page or from [GitHub Releases](https://github.com/stmpy-org/stmpy/releases), unpack it anywhere and add the directory to your `PATH`. The archive unpacks to a folder: `stmpy` in it is the launcher, and the other files have to stay next to it, so do not copy `stmpy` out on its own.

Check that it works:

```bash
stmpy version
```

### 2. Install the compiler toolchain

stmpy compiles the C code it generates with `arm-none-eabi-gcc`. Download it from [Arm](https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads) or install it with your package manager.

stmpy looks for the toolchain in this order:

1. The directory in the environment variable `STMPY_TOOLCHAIN`, either the toolchain's root directory or its `bin` directory
2. `PATH`

### 3. Install a flashing tool

stmpy produces a `.hex` file and does not flash it. On the command line, [probe-rs](https://probe.rs) is a good choice, it works with ST-Link, J-Link, CMSIS-DAP and other common probes:

```bash
probe-rs download --chip STM32F103C8 --binary-format hex build/blink.hex
```

## Running from source

This needs Python 3.11 or later.

```bash
git clone https://github.com/stmpy-org/stmpy.git
cd stmpy
pip install -r requirements.txt
python script/fetch_resources.py
python script/gen_chip_data.py
```

- `fetch_resources.py` downloads the STM32 HAL and CMSIS sources
- `gen_chip_data.py` generates the chip data

Then use `python -m stmpyc` in the repository root instead of `stmpy`, such as `python -m stmpyc build demo.spp`.

## Next step

[Your first program](../first-project/)
