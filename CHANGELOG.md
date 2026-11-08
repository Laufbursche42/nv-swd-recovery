# Changelog

## v3

- Issue report: removed the Markdown bold (`**`) from the auto-filled ticket. The bold either did not render (a space before the closing marker) or came out unbalanced, so raw asterisks were left in the ticket. The labels are plain text now.

## v2

- Enable Cloudflare Web Analytics (cookieless, aggregate page metrics only); allow the beacon origin in the Content-Security-Policy.

## v1

- First release. Builds a flash-ready SWD image (IAP bootloader and app) in the browser from an official NAVEE 02831 controller stock image.
- Content-based detection: 02831 controllers are assembled, meter/display and 3553G/MM32 controllers are refused with a note.
- Includes the flash script `swd_flash_navee.py` as a download and a bilingual guide.
- Design, theme, language (DE/EN) and the prefilled report-issue link match the other Laufbursche tools.
