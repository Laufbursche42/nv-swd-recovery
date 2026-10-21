# Disclaimer

Read this before using the tool.

## Feasibility study, no warranty

This tool is a **feasibility study** and is published purely for research and documentation purposes: to document, verifiably, how a bricked NAVEE controller of the 02831 family can be recovered via SWD.

> **No warranty of function or safety.** Error-free operation is not assured. A write can fail, be misread by the controller, or put the device into an unexpected state.

The author accepts **no liability whatsoever** for damage, loss or any other consequences arising from use. Use is entirely at your own risk.

## What this tool does and does not do

This tool restores the original (stock) firmware of a controller. It does not unlock anything on its own and does not change any speed. It only assembles the IAP bootloader and the unmodified app firmware into a flash-ready image that you write yourself via SWD.

> **SWD access and reflashing can damage the controller further.** The device is already dead. A failure is usually recoverable again via SWD, but not guaranteed.

## Experimental and cross-model

> **The IAP bootloader is generic within the 02831 class but not yet finally confirmed on the individual target model.** Only use the tool if you have SWD access to the controller.

## Your own device only

- Use this tool only on a device that belongs to you.
- If you later flash a speed-unlocked firmware, road approval is voided and public-road use is not permitted. That is not the subject of this tool, but keep it in mind.

## Not legal advice

This is not legal advice. The rules that apply where you are may differ. If you cannot fully accept these terms, you may not use the tool. See also the [License](#LICENSE).
