/**
 * MONACHI Events — free backend on Google Apps Script.
 *
 * What it does:
 *  - Saves bookings, private-party enquiries and "notify me" sign-ups to this Google Sheet.
 *  - Creates a Razorpay order for each booking (price is set HERE, never trusted from the website).
 *  - Verifies the payment, marks the booking Paid, emails the parent a PDF Party Pass per child,
 *    and alerts MONACHI by email and WhatsApp (CallMeBot, free).
 *  - Lets parents fetch their pass again with booking code + phone.
 *
 * Setup: see SETUP.md. Secrets live in Project Settings → Script properties:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, OWNER_EMAIL, OWNER_WHATSAPP (e.g. 917217054807), CALLMEBOT_APIKEY (optional)
 */

// Real prices and details. Keep in sync with config.js on the website.
const EVENTS = {
  "halloween-2026": {
    code: "HW", title: "Halloween Party", fee: 250, open: true,
    date: "Saturday, 31 October 2026", short: "Sat 31 Oct 2026", time: "5:00 – 7:00 PM",
    venue: "Sunbeam Pre School premises", minAge: 4, maxAge: 14
  }
};

const SHEETS = {
  Bookings: ["Booking code", "Created", "Event", "Parent name", "WhatsApp", "Email", "Children", "No. of children", "Amount (₹)", "Status", "Razorpay order", "Razorpay payment", "Paid at", "Pass emailed", "Notes", "Event id", "Children JSON"],
  Enquiries: ["Created", "Type", "Name", "WhatsApp", "Email", "Preferred date", "Guests", "Age group", "Notes"],
  Notify: ["Created", "Event", "Name", "WhatsApp", "Email", "Event id"]
};
const COL = Object.fromEntries(SHEETS.Bookings.map((h, i) => [h, i + 1]));
const MAX_KIDS = 6;

/* ---------- Web app entry points ---------- */
function doGet() { return json({ ok: true, service: "MONACHI Events" }); }

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.event && body.payload) return json(handleWebhook(body));
    switch (body.action) {
      case "createOrder": return json(createOrder(body));
      case "verify": return json(verifyPayment(body));
      case "lookup": return json(lookup(body));
      case "notify": return json(saveNotify(body));
      case "enquiry": return json(saveEnquiry(body));
      default: return json({ ok: false, error: "Unknown request." });
    }
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err.message || err) });
  }
}

/* ---------- Booking + payment ---------- */
function createOrder(b) {
  const ev = EVENTS[b.eventId];
  if (!ev || !ev.open) throw new Error("This event isn't taking bookings right now.");
  const parent = clean(b.parent, 80), phone = cleanPhone(b.phone), email = clean(b.email, 120).toLowerCase();
  if (parent.length < 2) throw new Error("Please enter the parent's name.");
  if (!/^[6-9]\d{9}$/.test(phone)) throw new Error("Please enter a 10-digit Indian mobile number.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("Please enter a valid email.");
  const kids = (Array.isArray(b.kids) ? b.kids : []).slice(0, MAX_KIDS).map((k) => ({ name: clean(k.name, 60), age: parseInt(k.age, 10) }))
    .filter((k) => k.name && k.age >= ev.minAge && k.age <= ev.maxAge);
  if (!kids.length) throw new Error(`Add at least one child aged ${ev.minAge}–${ev.maxAge}.`);

  const amount = kids.length * ev.fee;
  const code = newCode(ev.code);
  const order = razorpay("post", "/v1/orders", { amount: amount * 100, currency: "INR", receipt: code, notes: { booking: code, event: ev.title } });

  sheet("Bookings").appendRow([code, new Date(), ev.title, safe(parent), "'" + phone, safe(email),
    kids.map((k) => `${k.name} (${k.age})`).join(", "), kids.length, amount, "Payment pending", order.id, "", "", "", safe(clean(b.notes, 300)), b.eventId, JSON.stringify(kids)]);

  return { ok: true, code, orderId: order.id, amount: amount * 100 };
}

function verifyPayment(b) {
  const row = findRow(COL["Booking code"], String(b.code || ""));
  if (!row) throw new Error("Booking not found.");
  const rec = readRow(row);
  if (rec.status === "Paid") return { ok: true, booking: publicBooking(rec) };
  if (String(b.razorpay_order_id) !== rec.orderId) throw new Error("Payment doesn't match this booking.");
  const expected = hmacHex(rec.orderId + "|" + b.razorpay_payment_id, prop("RAZORPAY_KEY_SECRET"));
  if (expected !== String(b.razorpay_signature)) throw new Error("Payment couldn't be verified.");
  finalize(row, String(b.razorpay_payment_id));
  return { ok: true, booking: publicBooking(readRow(row)) };
}

// Razorpay webhook (payment.captured / order.paid) — catches payments where the parent closed the page early.
// Apps Script can't read the signature header, so we re-check the payment with Razorpay's API instead.
function handleWebhook(body) {
  const p = body.payload && body.payload.payment && body.payload.payment.entity;
  if (!p || !p.order_id) return { ok: true };
  const row = findRow(COL["Razorpay order"], p.order_id);
  if (!row) return { ok: true };
  if (readRow(row).status !== "Paid") finalize(row, p.id);
  return { ok: true };
}

function finalize(row, paymentId) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const rec = readRow(row);
    if (rec.status === "Paid") return;
    const pay = razorpay("get", "/v1/payments/" + encodeURIComponent(paymentId));
    if (pay.order_id !== rec.orderId) throw new Error("Payment belongs to a different order.");
    if (Number(pay.amount) !== Number(rec.amount) * 100) throw new Error("Payment amount doesn't match.");
    if (pay.status === "authorized") razorpay("post", "/v1/payments/" + encodeURIComponent(paymentId) + "/capture", { amount: pay.amount, currency: "INR" });
    else if (pay.status !== "captured") throw new Error("Payment isn't complete yet.");

    const sh = sheet("Bookings");
    sh.getRange(row, COL["Status"]).setValue("Paid");
    sh.getRange(row, COL["Razorpay payment"]).setValue(paymentId);
    sh.getRange(row, COL["Paid at"]).setValue(new Date());
    SpreadsheetApp.flush();
    const paid = readRow(row);
    try { emailParent(paid); sh.getRange(row, COL["Pass emailed"]).setValue("Yes"); } catch (err) { console.error("Parent email failed", err); sh.getRange(row, COL["Pass emailed"]).setValue("Failed: " + err.message); }
    alertOwner(`New booking PAID ✅\n${paid.code} · ${paid.event}\n${paid.parent} · +91 ${paid.phone}\n${paid.email}\nChildren: ${paid.kidsText}\nAmount: ₹${paid.amount}`,
      `New booking paid: ${paid.code} · ${paid.parent} · ₹${paid.amount}`);
  } finally { lock.releaseLock(); }
}

function lookup(b) {
  const row = findRow(COL["Booking code"], String(b.code || "").toUpperCase().trim());
  if (!row) throw new Error("Not found.");
  const rec = readRow(row);
  if (rec.phone !== cleanPhone(b.phone)) throw new Error("Not found.");
  return { ok: true, booking: publicBooking(rec) };
}

/* ---------- Enquiries + notify list ---------- */
function saveEnquiry(b) {
  const name = clean(b.name, 80), phone = cleanPhone(b.phone);
  if (name.length < 2 || !/^[6-9]\d{9}$/.test(phone)) throw new Error("Name and a 10-digit number are needed.");
  const r = [new Date(), safe(clean(b.type, 60)), safe(name), "'" + phone, safe(clean(b.email, 120)), safe(clean(b.date, 20)), safe(clean(b.guests, 10)), safe(clean(b.ageGroup, 20)), safe(clean(b.notes, 600))];
  sheet("Enquiries").appendRow(r);
  alertOwner(`New ENQUIRY 📩 ${r[1]}\n${name} · +91 ${phone}\n${r[4]}\nDate: ${r[5] || "-"} · Guests: ${r[6] || "-"} · ${r[7]}\n${clean(b.notes, 300)}`, `New enquiry: ${r[1]} · ${name}`);
  return { ok: true };
}

function saveNotify(b) {
  const name = clean(b.name, 80), phone = cleanPhone(b.phone);
  if (name.length < 2 || !/^[6-9]\d{9}$/.test(phone)) throw new Error("Name and a 10-digit number are needed.");
  sheet("Notify").appendRow([new Date(), safe(clean(b.eventTitle, 80)), safe(name), "'" + phone, safe(clean(b.email, 120)), clean(b.eventId, 40)]);
  return { ok: true };
}

/* ---------- Emails + alerts ---------- */
function emailParent(rec) {
  const ev = EVENTS[rec.eventId] || {};
  const pages = rec.kids.map((k, i) => passHtml(rec, ev, k, i)).join('<div style="page-break-after:always"></div>');
  const pdf = Utilities.newBlob(`<html><body style="margin:0">${pages}</body></html>`, "text/html", "pass.html").getAs("application/pdf").setName(`MONACHI-${rec.code}-Party-Pass.pdf`);
  const names = rec.kids.map((k) => k.name).join(", ");
  const html = `<div style="font-family:Arial,sans-serif;color:#1D2240;max-width:560px">
    <h2 style="margin:0 0 8px">You're booked for the ${esc(rec.event)}! 🎉</h2>
    <p>Hi ${esc(rec.parent)}, thank you for booking with MONACHI. Your Party Pass for <b>${esc(names)}</b> is attached as a PDF. Please show it at the entry (on your phone is fine).</p>
    <table style="border-collapse:collapse;font-size:14px">
      <tr><td style="padding:4px 12px 4px 0;color:#66657A">Booking</td><td><b>${rec.code}</b></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#66657A">Date</td><td>${esc(ev.date || "")}, ${esc(ev.time || "")}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#66657A">Venue</td><td>${esc(ev.venue || "")}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#66657A">Paid</td><td>₹${rec.amount}</td></tr>
    </table>
    <p>Questions? WhatsApp us on +91 72170 54807 · Instagram @monachi.crafts</p>
    <p style="color:#B8924A">Team MONACHI · Crafting Celebrations</p></div>`;
  MailApp.sendEmail({ to: rec.email, subject: `Your MONACHI Party Pass · ${rec.event} · ${rec.code}`, htmlBody: html, attachments: [pdf], name: "MONACHI Events", replyTo: prop("OWNER_EMAIL") || undefined });
}

function passHtml(rec, ev, kid, i) {
  return `<div style="font-family:Arial,sans-serif;background:#1B1335;color:#F7EEDD;padding:36px;width:640px">
    <div style="text-align:center;font-size:34px;font-weight:bold;letter-spacing:3px"><span style="color:#E0306A">M</span><span style="color:#F39200">O</span><span style="color:#00A0AA">N</span><span style="color:#8A5BD0">AC</span>HI</div>
    <div style="text-align:center;color:#F9C440;font-size:11px;letter-spacing:5px;margin-top:4px">CRAFTING CELEBRATIONS</div>
    <div style="text-align:center;color:#F9C440;font-size:14px;letter-spacing:6px;margin-top:18px">PARTY PASS</div>
    <div style="text-align:center;color:#F7931E;font-size:40px;font-weight:bold;margin:6px 0 20px">${esc(rec.event)}</div>
    <div style="background:#FCF2DC;color:#1B1335;border-radius:18px;padding:26px">
      <div style="font-size:12px;letter-spacing:3px;color:#6E6390">ADMIT ONE CHILD <span style="float:right;color:#157F5B;border:2px solid #157F5B;border-radius:8px;padding:2px 10px;letter-spacing:1px">✓ PAID</span></div>
      <div style="font-size:44px;font-weight:bold;margin-top:14px">${esc(kid.name)}</div>
      <div style="font-size:18px;color:#6E6390">Age ${kid.age}</div>
      <table style="width:100%;margin-top:18px;font-size:16px;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#6E6390;font-size:11px;letter-spacing:2px">PARENT</td><td style="color:#6E6390;font-size:11px;letter-spacing:2px">DATE</td></tr>
        <tr><td style="font-weight:bold">${esc(rec.parent)}</td><td style="font-weight:bold">${esc(ev.short || ev.date || "")}</td></tr>
        <tr><td style="padding:14px 0 8px;color:#6E6390;font-size:11px;letter-spacing:2px">TIME</td><td style="padding-top:14px;color:#6E6390;font-size:11px;letter-spacing:2px">VENUE</td></tr>
        <tr><td style="font-weight:bold">${esc(ev.time || "")}</td><td style="font-weight:bold">${esc(ev.venue || "")}</td></tr>
      </table>
      <div style="border-top:2px dashed #C9BFA8;margin:22px 0 14px"></div>
      <div style="font-size:11px;letter-spacing:2px;color:#6E6390">PASS ID</div>
      <div style="font-size:28px;font-weight:bold">${rec.code}-${i + 1}</div>
      <div style="font-size:14px;color:#6E6390">Show this pass at the entry</div>
    </div>
    <div style="text-align:center;font-size:13px;margin-top:18px">WhatsApp +91 72170 54807 · Instagram @monachi.crafts</div>
  </div>`;
}

function alertOwner(text, subject) {
  const to = prop("OWNER_EMAIL");
  if (to) try { MailApp.sendEmail(to, subject, text); } catch (err) { console.error("Owner email failed", err); }
  const phone = prop("OWNER_WHATSAPP"), key = prop("CALLMEBOT_APIKEY");
  if (phone && key) try {
    UrlFetchApp.fetch("https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(phone) + "&text=" + encodeURIComponent(text) + "&apikey=" + encodeURIComponent(key), { muteHttpExceptions: true });
  } catch (err) { console.error("WhatsApp alert failed", err); }
}

/* ---------- Helpers ---------- */
function razorpay(method, path, payload) {
  const id = prop("RAZORPAY_KEY_ID"), secret = prop("RAZORPAY_KEY_SECRET");
  if (!id || !secret) throw new Error("Online payment isn't set up yet.");
  const res = UrlFetchApp.fetch("https://api.razorpay.com" + path, {
    method, contentType: "application/json", muteHttpExceptions: true,
    headers: { Authorization: "Basic " + Utilities.base64Encode(id + ":" + secret) },
    payload: payload ? JSON.stringify(payload) : undefined
  });
  const data = JSON.parse(res.getContentText() || "{}");
  if (res.getResponseCode() >= 300) throw new Error((data.error && data.error.description) || "Payment service error.");
  return data;
}
function hmacHex(value, key) { return Utilities.computeHmacSha256Signature(value, key).map((b) => ("0" + (b & 0xff).toString(16)).slice(-2)).join(""); }
function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(SHEETS[name]); sh.setFrozenRows(1); sh.getRange(1, 1, 1, SHEETS[name].length).setFontWeight("bold"); }
  return sh;
}
function findRow(col, value) {
  const sh = sheet("Bookings"), n = sh.getLastRow(); if (n < 2 || !value) return 0;
  const vals = sh.getRange(2, col, n - 1, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) if (String(vals[i][0]) === value) return i + 2;
  return 0;
}
function readRow(row) {
  const v = sheet("Bookings").getRange(row, 1, 1, SHEETS.Bookings.length).getValues()[0], g = (h) => v[COL[h] - 1];
  let kids = []; try { kids = JSON.parse(g("Children JSON") || "[]"); } catch (_) {}
  return { code: String(g("Booking code")), event: g("Event"), parent: g("Parent name"), phone: String(g("WhatsApp")).replace(/\D/g, ""), email: g("Email"),
    kidsText: g("Children"), amount: Number(g("Amount (₹)")), status: g("Status"), orderId: String(g("Razorpay order")), eventId: g("Event id"), kids };
}
function publicBooking(rec) {
  const ev = EVENTS[rec.eventId] || {};
  return { code: rec.code, eventId: rec.eventId, eventTitle: rec.event, date: ev.date, time: ev.time, venue: ev.venue, parent: rec.parent, phone: rec.phone, email: rec.email, kids: rec.kids, amount: rec.amount, status: rec.status };
}
function newCode(prefix) { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)]; return `MON-${prefix}-${s}`; }
function prop(k) { return PropertiesService.getScriptProperties().getProperty(k) || ""; }
function clean(v, max) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max); }
function cleanPhone(v) { let p = String(v || "").replace(/\D/g, ""); if (p.length === 12 && p.startsWith("91")) p = p.slice(2); if (p.length === 11 && p.startsWith("0")) p = p.slice(1); return p; }
function safe(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; } // stops spreadsheet formula injection
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* Run once from the editor (select "setup" → Run) to create the sheets and grant permissions. */
function setup() { Object.keys(SHEETS).forEach(sheet); MailApp.getRemainingDailyQuota(); UrlFetchApp.fetch("https://api.razorpay.com", { muteHttpExceptions: true }); }

/* Optional: send a test alert to yourself. */
function testAlert() { alertOwner("MONACHI test alert ✅ Bookings will arrive like this.", "MONACHI test alert"); }
