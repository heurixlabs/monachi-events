# MONACHI Events

Booking website for MONACHI ("Crafting Celebrations") kids and family events. Free to run: GitHub Pages +
Google Sheets + Google Apps Script, with Razorpay for online payments.

## What's on the site
- **Booking now:** Halloween Party · Sat 31 Oct 2026, 5–7 PM · ages 4–14 · ₹250 per child · Sunbeam Pre School premises
- **Coming soon** (with "Notify me"): Diwali DIY Party, Little Baker Bakery Workshop (Nov–Dec), Christmas Party, New Year Bash
- **Past workshops:** DIY pipe-cleaner flowers, Kids Baker Class (June 2026), clay, tie & dye
- **Private parties:** Birthday Party DIY and Kitty Party DIY enquiry form
- **My pass:** parents fetch their Party Pass again with booking code + phone

## How booking works
**Online mode** (after [SETUP.md](SETUP.md)): parent fills the form → pays with Razorpay (UPI, card, net banking) →
Party Pass appears on the page (download PDF or share to WhatsApp) → PDF pass emailed to the parent →
MONACHI gets an email and WhatsApp alert → booking saved as **Paid** in the Google Sheet.

**WhatsApp + UPI mode** (until setup is done): parent fills the form → sends the booking on WhatsApp →
pays with the Google Pay QR → MONACHI confirms and sends the pass.

## Files
| File | What it is |
|---|---|
| `index.html` | the page |
| `config.js` | **edit this**: events, prices shown, contact details, backend URL, Razorpay Key ID |
| `app.js` | booking, payment, notify and enquiry logic |
| `pass.js` | Party Pass design and the illustrated event cards |
| `apps-script/Code.gs` | free backend: paste into Google Apps Script (see SETUP.md) |
| `assets/` | poster, QR code, workshop photos |

Add workshop photos to `assets/workshops/` and list them under `PAST` in `config.js`.
Use photos of crafts and hands, or get parents' permission before showing children's faces.

Instagram: [@monachi.crafts](https://www.instagram.com/monachi.crafts/)
