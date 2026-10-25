# MONACHI Events — setup guide (₹0)

The website works straight away in **WhatsApp + UPI mode**. Follow these steps once to switch on
**online mode**: Razorpay payment → instant Party Pass download → PDF by email → alerts to you.

Everything here is free. Razorpay takes its standard fee from each payment (about 2% + GST); there is no monthly fee.

---

## 1. Google Sheet + Apps Script (your booking dashboard)

1. Go to <https://sheets.google.com> with the MONACHI Gmail account and create a blank sheet named **MONACHI Bookings**.
2. In the sheet: **Extensions → Apps Script**.
3. Delete what's in `Code.gs`, then paste in everything from [`apps-script/Code.gs`](apps-script/Code.gs). Click **Save**.
4. Click the ⚙️ **Project Settings** → **Script properties** → **Add script property**, and add:

   | Property | Value |
   |---|---|
   | `RAZORPAY_KEY_ID` | from Razorpay → Account & Settings → API Keys (starts `rzp_test_` or `rzp_live_`) |
   | `RAZORPAY_KEY_SECRET` | shown once when you generate the key. **Never share it or put it on GitHub.** |
   | `OWNER_EMAIL` | `monachi.bookings@gmail.com` (booking alerts arrive here) |
   | `OWNER_WHATSAPP` | `917217054807` |
   | `CALLMEBOT_APIKEY` | from step 3 below (optional) |

5. Back in the editor, choose **setup** in the function menu and click **Run**. Allow the permissions it asks for
   (it needs your Sheet, Gmail for sending passes, and internet access for Razorpay). Three tabs appear in the sheet:
   **Bookings**, **Enquiries**, **Notify**.
6. **Deploy → New deployment → ⚙️ Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and copy the **Web app URL** (ends in `/exec`).

The **Bookings** tab is your dashboard: booking code, parent, WhatsApp, email, children, amount and **Status**
(`Payment pending` or `Paid`). Install the Google Sheets app on your phone to see it anywhere.

## 2. Connect the website

Open [`config.js`](config.js) and fill in:

```js
BACKEND_URL: "https://script.google.com/macros/s/……/exec",
RAZORPAY_KEY_ID: "rzp_test_……",
```

Commit and push. The booking form now says **Continue to payment**.

## 3. WhatsApp alerts to your own number (CallMeBot, free, optional)

1. Open <https://www.callmebot.com/blog/free-api-whatsapp-messages/> and save the CallMeBot number it shows in your phone contacts (it has been +34 621 331 709, but it changes from time to time, so always use the one on that page).
2. From 72170 54807, send it the WhatsApp message: `I allow callmebot to send me messages`
3. It replies with your **apikey**. Put that in the `CALLMEBOT_APIKEY` script property.
4. In Apps Script, run **testAlert** to check that the WhatsApp message and email arrive.

CallMeBot only sends to your own number. Parents get their pass on the website (download or share to WhatsApp) and by email.

## 4. Razorpay webhook (backup for parents who close the page while paying)

Razorpay Dashboard → **Account & Settings → Webhooks → Add new webhook**
- Webhook URL: your Apps Script **Web app URL**
- Active events: **payment.captured**
- Secret: anything (Apps Script re-checks each payment with Razorpay directly)

## 5. Test before going live

1. Use **test** keys (`rzp_test_…`) first. Book on the site and pay with Razorpay's test UPI ID `success@razorpay`.
2. Check: pass shows on the page, PDF downloads, email arrives with the PDF, the Bookings row says **Paid**, and you got the alert.
3. When Razorpay activates your account, swap both keys for the **live** ones (script property + `config.js`), then
   **Deploy → Manage deployments → Edit → New version**.

## Changing events

- **Website:** edit `EVENTS` in `config.js` (`status: "open"` to take bookings, `"soon"` for a coming-soon card).
- **Prices:** also add/edit the event in `EVENTS` at the top of `apps-script/Code.gs`, then deploy a new version.
  The backend price is the one parents are charged.
- **Tell your Notify list:** the **Notify** tab has everyone who asked to be told, with their WhatsApp and email.

## Limits (free plan)

- Gmail sends about 100 emails a day from Apps Script. Plenty for under 100 tickets a month.
- Apps Script, Google Sheets and GitHub Pages are free.
