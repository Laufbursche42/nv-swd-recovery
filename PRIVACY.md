# Privacy

This tool runs entirely in your browser. It has no backend of its own and no accounts. This text explains exactly what happens to your data and what does not.

## In short

The tool collects nothing. There are no accounts, no analytics, no telemetry, no tracking, no ads, no cookies and no third-party scripts. Nothing is ever sent to the author.

## What data the tool processes and where it stays

Everything below stays on your device and is not uploaded to this project:

- The firmware file you load (NAVEE controller `.bin`). It is read entirely in the browser and assembled into an SWD image, and never uploaded. The assembled image is only downloaded when you trigger it yourself.
- A few settings (language, theme) are stored only locally in your browser.

## Network connections

The tool makes a network connection in these cases:

- **Loading the page.** Your browser fetches the static files from the host (see below).
- **Loading the IAP bootloader.** A normal request to this site itself (same host) to fetch the bootloader part for assembly.
- **Downloading the original firmware.** The download links open the manufacturer file in a new tab, a normal browser request to the manufacturer file host. The page forwards nothing and sends none of your data with it.

Your firmware file or your assembled image are never sent to this project. There is no Bluetooth connection here.

## Hosting and access statistics

The page is served as a static file via a host (GitHub Pages / Cloudflare Pages). On access these providers process technically necessary access data (such as IP address, time and browser identifier) to deliver the files. No personal profiles are built and no accounts are needed. Details are governed by the privacy policies of [GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement) and [Cloudflare](https://www.cloudflare.com/privacypolicy/).

## No developer backend

Nothing is ever sent to the author. There is no cloud account and no server run by this project that receives your data. The original firmware lives with the manufacturer, not with this project.

## Contact

For privacy questions contact the author (Laufbursche): [laufbursche42.github.io/Laufbursche42](https://laufbursche42.github.io/Laufbursche42/)
