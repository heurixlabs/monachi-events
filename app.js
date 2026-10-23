// MONACHI Events — page logic.
// Online mode (BACKEND_URL + RAZORPAY_KEY_ID set): book → Razorpay → instant Party Pass, email, alerts.
// Manual mode (not set yet): book → WhatsApp message → UPI QR → pass sent by MONACHI.

const M = window.MONACHI;
const ONLINE = Boolean(M.BACKEND_URL && M.RAZORPAY_KEY_ID);
const $ = (s, r = document) => r.querySelector(s);
const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const waLink = (text, to = M.WHATSAPP) => "https://wa.me/" + (to || "") + "?text=" + encodeURIComponent(text);
const open = M.EVENTS.filter((e) => e.status === "open");
const soon = M.EVENTS.filter((e) => e.status === "soon");
const evById = (id) => M.EVENTS.find((e) => e.id === id);
const cleanPhone = (v) => { let p = String(v || "").replace(/\D/g, ""); if (p.length === 12 && p.startsWith("91")) p = p.slice(2); if (p.length === 11 && p.startsWith("0")) p = p.slice(1); return p; };
const phoneOk = (p) => /^[6-9]\d{9}$/.test(p);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

async function api(action, data) {
  const res = await fetch(M.BACKEND_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...data }) });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

/* ---------- Events ---------- */
function renderEvents() {
  $("#live-list").innerHTML = open.length ? open.map((e) => `
    <article class="ev" id="${e.id}">
      <img class="poster" src="${e.poster}" alt="${esc(e.title)} poster" width="720" height="1080">
      <div class="body">
        <span class="status">Booking open</span>
        <h3>${esc(e.title.split(" ").slice(0, -1).join(" "))} <em>${esc(e.title.split(" ").slice(-1)[0])}</em></h3>
        <p class="lede">${esc(e.lede)}</p>
        <dl class="facts">
          <div><dt>Date</dt><dd>${esc(e.date)}</dd></div>
          <div><dt>Time</dt><dd>${esc(e.time)}</dd></div>
          <div><dt>Ages</dt><dd>${esc(e.ages)}</dd></div>
          <div><dt>Entry</dt><dd>${rupee(e.fee)} per child</dd></div>
          <div style="grid-column:1/-1"><dt>Venue</dt><dd>${esc(e.venue)}</dd></div>
        </dl>
        ${e.activities ? `<ul class="acts">${e.activities.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
        ${e.award ? `<p class="award"><b>★</b> ${esc(e.award)}</p>` : ""}
        <div class="cta-row"><a class="btn btn-orange" href="#book" data-book="${e.id}">Book now</a><span class="note">Pre-booking is a must</span></div>
      </div>
    </article>`).join("") : `<p class="section-sub">New events are coming soon. Tap "Notify me" below.</p>`;

  $("#soon-list").innerHTML = soon.map((e) => `
    <article class="soon" id="${e.id}">
      <div class="art${e.flyer ? " flyer" : ""}">${e.flyer ? `<button class="zoom" type="button" data-view="${e.flyer}" aria-label="View ${esc(e.title)} flyer"><img src="${e.flyer}" alt="${esc(e.title)} flyer" loading="lazy" width="900" height="1350"></button>` : e.photo ? `<img src="${e.photo}" alt="" loading="lazy">` : eventArt(e.theme)}${e.flyer ? "" : `<span class="badge">Coming soon</span>`}</div>
      <div class="txt">
        <span class="kicker">${esc(e.kicker || "")}</span>
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.lede)}</p>
        <span class="when">${esc(e.when || "")}</span>
        <button class="btn btn-ghost btn-sm" type="button" data-notify="${e.id}">Notify me</button>
      </div>
    </article>`).join("");
}

function renderPast() {
  $("#past-list").innerHTML = M.PAST.map((w, i) => `
    <article>
      <div class="art" id="past-art-${i}">${w.photos.length ? `<button class="zoom" type="button" data-view="${w.photos[0]}" aria-label="View ${esc(w.title)} photo"><img src="${w.photos[0]}" alt="${esc(w.title)}" loading="lazy"></button>` : eventArt(w.art) + `<span class="ph-note">Photos coming soon</span>`}</div>
      <div class="txt"><h3>${esc(w.title)}</h3><p>${esc(w.detail)}</p></div>
      ${w.photos.length > 1 ? `<div class="thumbs">${w.photos.map((p, j) => `<button type="button" aria-label="Photo ${j + 1}" aria-pressed="${j === 0}" data-past="${i}" data-src="${p}"><img src="${p}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
    </article>`).join("");
}

function renderParties() {
  $("#party-cards").innerHTML = M.ENQUIRIES.map((q) => `<div class="party ${q.id}"><h3>${esc(q.title)}</h3><p>${esc(q.text)}</p></div>`).join("");
  $("#q-type").innerHTML = M.ENQUIRIES.map((q) => `<option value="${q.id}">${esc(q.title)}</option>`).join("") + `<option value="other">Something else</option>`;
}

/* ---------- Booking form ---------- */
let kidSeq = 0;
function kidRow() {
  const i = kidSeq++, d = document.createElement("div"); d.className = "child";
  d.innerHTML = `<label for="kid-name-${i}">Child's name<input id="kid-name-${i}" data-k="name" autocomplete="off"></label>
    <label for="kid-age-${i}">Age<input id="kid-age-${i}" data-k="age" inputmode="numeric" maxlength="2"></label>
    <button type="button" class="rm" aria-label="Remove child">×</button>`;
  $(".rm", d).addEventListener("click", () => { d.remove(); syncKids(); });
  return d;
}
function addKid() { if ($("#kids").children.length < 6) $("#kids").appendChild(kidRow()); syncKids(); }
function syncKids() {
  const rows = [...$("#kids").children];
  rows.forEach((r) => ($(".rm", r).hidden = rows.length === 1));
  $("#add-kid").hidden = rows.length >= 6;
  updateTotal();
}
const currentEvent = () => evById($("#event").value) || open[0];
function updateTotal() {
  const ev = currentEvent(); if (!ev) return;
  const n = $("#kids").children.length;
  $("#total-label").textContent = `${n} ${n === 1 ? "child" : "children"} × ${rupee(ev.fee)}`;
  $("#total").textContent = rupee(n * ev.fee);
  $("#kids-legend").textContent = `Children attending (ages ${ev.ages})`;
  $("#venue-box").innerHTML = `<span class="eyebrow">Venue</span><b>${esc(ev.venue)}</b><span class="small">${esc(ev.date)} · ${esc(ev.time)}</span>`;
}
function setErr(id, msg) { $("#" + id + "-err").textContent = msg; $("#" + id).setAttribute("aria-invalid", msg ? "true" : "false"); return !msg; }
function validate() {
  const ev = currentEvent(); let ok = true;
  const parent = $("#parent").value.trim();
  ok = setErr("parent", parent.length < 2 ? "Please enter your name." : "") && ok;
  const phone = cleanPhone($("#phone").value);
  ok = setErr("phone", phoneOk(phone) ? "" : "Enter a 10-digit Indian mobile number.") && ok;
  const email = $("#email").value.trim();
  ok = setErr("email", (ONLINE ? emailOk(email) : !email || emailOk(email)) ? "" : (ONLINE ? "Enter your email. Your Party Pass is sent here." : "Check the email address.")) && ok;
  let kidsBad = false;
  const kids = [...$("#kids").children].map((r) => {
    const n = $('[data-k="name"]', r), a = $('[data-k="age"]', r), age = parseInt(a.value, 10);
    const nameOk = n.value.trim().length > 0, ageOk = age >= ev.minAge && age <= ev.maxAge;
    n.setAttribute("aria-invalid", String(!nameOk)); a.setAttribute("aria-invalid", String(!ageOk));
    if (!nameOk || !ageOk) kidsBad = true;
    return { name: n.value.trim(), age };
  });
  $("#kids-err").textContent = kidsBad ? `Add each child's name and an age from ${ev.minAge} to ${ev.maxAge}.` : "";
  if (kidsBad) ok = false;
  if (!ok) { const bad = document.querySelector('#form [aria-invalid="true"]'); if (bad) bad.focus(); return null; }
  return { eventId: ev.id, ev, parent, phone, email, kids, notes: $("#notes").value.trim() };
}

function localCode(ev) { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)]; return `MON-${ev.code}-${s}`; }

$("#form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = validate(); if (!b) return;
  if (ONLINE) return payOnline(b);
  showManual(b);
});

/* ---------- Online: Razorpay ---------- */
function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve; s.onerror = () => reject(new Error("Couldn't load the payment window. Check your internet connection and try again."));
    document.head.appendChild(s);
  });
}
async function payOnline(b) {
  const btn = $("#submit-btn"), msg = $("#form-msg");
  btn.disabled = true; btn.textContent = "Opening payment…"; msg.className = "msg"; msg.textContent = "";
  try {
    await loadRazorpay();
    const order = await api("createOrder", { eventId: b.eventId, parent: b.parent, phone: b.phone, email: b.email, kids: b.kids, notes: b.notes });
    const rzp = new window.Razorpay({
      key: M.RAZORPAY_KEY_ID, order_id: order.orderId, amount: order.amount, currency: "INR",
      name: "MONACHI Events", description: `${b.ev.title} · ${b.kids.length} ${b.kids.length === 1 ? "child" : "children"}`,
      prefill: { name: b.parent, email: b.email, contact: "+91" + b.phone },
      notes: { booking: order.code }, theme: { color: "#1D2240" },
      handler: async (r) => {
        msg.className = "msg"; msg.textContent = "Payment received. Preparing your Party Pass…";
        try {
          const res = await api("verify", { code: order.code, razorpay_order_id: r.razorpay_order_id, razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature });
          showPasses(res.booking, true);
        } catch (err) {
          msg.className = "msg err";
          msg.textContent = `Your payment went through, but we couldn't show the pass right now. Your booking code is ${order.code}. Use "Get your pass again" below in a minute, or message us on WhatsApp.`;
        }
      },
      modal: { ondismiss: () => { msg.className = "msg err"; msg.textContent = "Payment wasn't completed. Your place isn't booked yet. Tap the button to try again."; } }
    });
    rzp.on("payment.failed", (r) => { msg.className = "msg err"; msg.textContent = (r.error && r.error.description ? r.error.description + ". " : "") + "No money was taken. Please try again."; });
    rzp.open();
  } catch (err) {
    msg.className = "msg err"; msg.textContent = err.message || "Something went wrong. Please try again.";
  } finally {
    btn.disabled = false; btn.textContent = "Continue to payment";
  }
}

/* ---------- Pass display, PDF, sharing ---------- */
let lastPasses = null;
async function showPasses(bk, fresh) {
  const ev = evById(bk.eventId) || { title: bk.eventTitle, date: bk.date, short: bk.date, time: bk.time, venue: bk.venue, theme: "monachi" };
  try { await document.fonts.load('700 60px "Fredoka"'); await document.fonts.load('600 30px "Poppins"'); } catch (_) {}
  const canvases = bk.kids.map((k, i) => { const c = document.createElement("canvas"); drawPass(c, { event: ev, child: k.name, age: k.age, parent: bk.parent, code: bk.code, passId: `${bk.code}-${i + 1}`, paid: true }); return c; });
  lastPasses = { bk, ev, canvases };
  $("#passes").innerHTML = "";
  canvases.forEach((c, i) => { const img = new Image(); img.src = c.toDataURL("image/png"); img.alt = `Party Pass for ${bk.kids[i].name}`; $("#passes").appendChild(img); });
  $("#paid-note").textContent = `Booking ${bk.code} · ${rupee(bk.amount)} paid.${bk.email ? ` A copy has been emailed to ${bk.email}.` : ""} Show the pass at the entry.`;
  $("#form").hidden = true; $("#manual").hidden = true; $("#paid").hidden = false; $("#form-msg").textContent = "";
  try { localStorage.setItem("monachi-last", JSON.stringify({ code: bk.code, phone: bk.phone })); } catch (_) {}
  if (fresh) $("#paid").scrollIntoView({ block: "start" });
}
function passPdf() {
  const { jsPDF } = window.jspdf, { bk, canvases } = lastPasses;
  const pdf = new jsPDF({ unit: "px", format: [1080, 1350], hotfixes: ["px_scaling"] });
  canvases.forEach((c, i) => { if (i) pdf.addPage([1080, 1350]); pdf.addImage(c.toDataURL("image/jpeg", .92), "JPEG", 0, 0, 1080, 1350); });
  return { pdf, name: `MONACHI-${bk.code}-Party-Pass.pdf` };
}
$("#dl-pdf").addEventListener("click", () => { if (!lastPasses) return; const { pdf, name } = passPdf(); pdf.save(name); });
$("#share-wa").addEventListener("click", async () => {
  if (!lastPasses) return;
  const { bk, ev } = lastPasses, { pdf, name } = passPdf();
  const text = `Our MONACHI Party Pass for ${ev.title} (${ev.date}, ${ev.time}). Booking ${bk.code}.`;
  const file = new File([pdf.output("blob")], name, { type: "application/pdf" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text, title: "MONACHI Party Pass" }); return; } catch (err) { if (err.name === "AbortError") return; }
  }
  pdf.save(name);
  window.open(waLink(text + " The pass PDF is attached.", ""), "_blank", "noopener");
  $("#share-msg").textContent = "The PDF has been downloaded. Attach it in the WhatsApp chat that just opened.";
});
$("#book-another").addEventListener("click", () => { $("#paid").hidden = true; $("#form").hidden = false; $("#form").reset(); $("#kids").replaceChildren(); addKid(); $("#book").scrollIntoView(); });

$("#find-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const m = $("#find-msg"), code = $("#f-code").value.trim().toUpperCase(), phone = cleanPhone($("#f-phone").value);
  if (!code || !phoneOk(phone)) { m.className = "msg err"; m.textContent = "Enter your booking code and the WhatsApp number you booked with."; return; }
  if (!ONLINE) { m.className = "msg"; m.innerHTML = `Online passes aren't switched on yet. <a href="${waLink(`Hi MONACHI, please resend my Party Pass for booking ${code}.`)}" target="_blank" rel="noopener">Ask us on WhatsApp</a>.`; return; }
  m.className = "msg"; m.textContent = "Looking up your booking…";
  try {
    const res = await api("lookup", { code, phone });
    if (res.booking.status !== "Paid") { m.className = "msg err"; m.textContent = "We found the booking, but the payment isn't complete yet. Book again to pay, or message us on WhatsApp."; return; }
    m.textContent = ""; showPasses(res.booking, true);
  } catch (err) { m.className = "msg err"; m.textContent = "We couldn't find that booking. Check the code and number, or message us on WhatsApp."; }
});

/* ---------- Manual mode: WhatsApp + UPI ---------- */
function showManual(b) {
  const code = localCode(b.ev), amt = b.kids.length * b.ev.fee;
  const lines = [`New booking request: ${b.ev.title}`, `Booking code: ${code}`, `${b.ev.date}, ${b.ev.time}`, `Venue: ${b.ev.venue}`, ``,
    `Parent: ${b.parent}`, `WhatsApp: +91 ${b.phone}`, ...(b.email ? [`Email: ${b.email}`] : []),
    ...b.kids.map((k, i) => `Child ${i + 1}: ${k.name}, age ${k.age}`), `Total: ${b.kids.length} × ${rupee(b.ev.fee)} = ${rupee(amt)}`, ...(b.notes ? [`Notes: ${b.notes}`] : [])];
  const text = lines.join("\n");
  $("#summary").textContent = text;
  $("#wa").href = waLink(text);
  $("#pay-amt").textContent = rupee(amt); $("#pay-code").textContent = code;
  $("#upi-link").textContent = `Pay ${rupee(amt)} in a UPI app`;
  $("#upi-link").href = `upi://pay?pa=${M.UPI_ID}&pn=${encodeURIComponent(M.UPI_NAME)}&am=${amt}&cu=INR&tn=${encodeURIComponent(code)}`;
  $("#wa-paid").href = waLink(`Hi MONACHI, I have paid ${rupee(amt)} for booking ${code} (${b.ev.title}). Sending the payment screenshot now.`);
  $("#form").hidden = true; $("#manual").hidden = false;
  $("#manual").scrollIntoView({ block: "start" });
}
$("#edit").addEventListener("click", () => { $("#manual").hidden = true; $("#form").hidden = false; });
function copyText(btn, text, label) {
  const done = (t) => { btn.textContent = t; setTimeout(() => (btn.textContent = label), 1800); };
  try { navigator.clipboard.writeText(text).then(() => done("Copied"), () => done("Copy not allowed")); } catch (_) { done("Copy not allowed"); }
}
$("#copy").addEventListener("click", (e) => copyText(e.currentTarget, $("#summary").textContent, "Copy details"));
$("#copy-upi").addEventListener("click", (e) => copyText(e.currentTarget, M.UPI_ID, "Copy UPI ID"));

/* ---------- Notify me ---------- */
let notifyEvent = null;
function openNotify(id) {
  notifyEvent = evById(id); $("#n-h").textContent = `Notify me: ${notifyEvent.title}`;
  $("#n-sub").textContent = `We'll message you as soon as booking opens${notifyEvent.when ? ` (${notifyEvent.when})` : ""}.`;
  $("#n-msg").textContent = ""; $("#notify").hidden = false; $("#n-name").focus();
}
$("#n-close").addEventListener("click", () => ($("#notify").hidden = true));
$("#notify").addEventListener("click", (e) => { if (e.target.id === "notify") $("#notify").hidden = true; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { $("#notify").hidden = true; $("#viewer").hidden = true; } });
$("#viewer").addEventListener("click", (e) => { if (e.target.id === "viewer" || e.target.id === "viewer-close") $("#viewer").hidden = true; });
$("#n-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const m = $("#n-msg"), name = $("#n-name").value.trim(), phone = cleanPhone($("#n-phone").value), email = $("#n-email").value.trim();
  if (name.length < 2 || !phoneOk(phone) || (email && !emailOk(email))) { m.className = "msg err"; m.textContent = "Add your name and a 10-digit WhatsApp number (and check the email, if you added one)."; return; }
  if (!M.BACKEND_URL) { window.open(waLink(`Hi MONACHI, please notify me when booking opens for the ${notifyEvent.title}. Name: ${name}, WhatsApp: +91 ${phone}${email ? `, Email: ${email}` : ""}`), "_blank", "noopener"); m.className = "msg ok"; m.textContent = "Send the WhatsApp message that opened and you're on the list."; return; }
  m.className = "msg"; m.textContent = "Saving…";
  try { await api("notify", { eventId: notifyEvent.id, eventTitle: notifyEvent.title, name, phone, email }); m.className = "msg ok"; m.textContent = "You're on the list. We'll message you when booking opens."; $("#n-form").reset(); }
  catch (_) { m.className = "msg err"; m.textContent = "Couldn't save that. Please try again or message us on WhatsApp."; }
});

/* ---------- Private party enquiry ---------- */
$("#enq-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const m = $("#enq-msg"), type = $("#q-type").selectedOptions[0].textContent, name = $("#q-name").value.trim(), phone = cleanPhone($("#q-phone").value), email = $("#q-email").value.trim();
  const d = { type, name, phone, email, date: $("#q-date").value, guests: $("#q-guests").value.trim(), ageGroup: $("#q-age").value, notes: $("#q-notes").value.trim() };
  if (name.length < 2 || !phoneOk(phone) || (email && !emailOk(email))) { m.className = "msg err"; m.textContent = "Add your name and a 10-digit WhatsApp number (and check the email, if you added one)."; return; }
  if (!M.BACKEND_URL) {
    window.open(waLink([`Hi MONACHI, I'd like to enquire about a ${type}.`, `Name: ${name}`, `WhatsApp: +91 ${phone}`, email && `Email: ${email}`, d.date && `Preferred date: ${d.date}`, d.guests && `Guests: ${d.guests}`, `Age group: ${d.ageGroup}`, d.notes && `Notes: ${d.notes}`].filter(Boolean).join("\n")), "_blank", "noopener");
    m.className = "msg ok"; m.textContent = "Send the WhatsApp message that opened and we'll get back to you."; return;
  }
  m.className = "msg"; m.textContent = "Sending…";
  try { await api("enquiry", d); m.className = "msg ok"; m.textContent = "Thank you! We'll call or message you within a day."; $("#enq-form").reset(); }
  catch (_) { m.className = "msg err"; m.textContent = "Couldn't send that. Please try again or message us on WhatsApp."; }
});

/* ---------- Init ---------- */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-book]"); if (b && $("#event")) { $("#event").value = b.dataset.book; updateTotal(); }
  const n = e.target.closest("[data-notify]"); if (n) openNotify(n.dataset.notify);
  const t = e.target.closest("[data-past]");
  const z = e.target.closest("[data-view]"); if (z) { $("#viewer-img").src = z.dataset.view; $("#viewer").hidden = false; $("#viewer-close").focus(); }
  if (t) { const i = t.dataset.past; $(`#past-art-${i} img`).src = t.dataset.src; $(`#past-art-${i} .zoom`).dataset.view = t.dataset.src; t.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === t))); }
});

renderEvents(); renderPast(); renderParties();
$("#event").innerHTML = open.map((e) => `<option value="${e.id}">${esc(e.title)} · ${esc(e.date)}</option>`).join("");
$("#add-kid").addEventListener("click", addKid);
$("#event").addEventListener("change", updateTotal);
addKid();
$("#upi-id").textContent = M.UPI_ID; $("#upi-name").textContent = M.UPI_NAME;
$("#contact-num").textContent = "+91 " + M.WHATSAPP.slice(2, 7) + " " + M.WHATSAPP.slice(7);
$("#insta").textContent = "@" + M.INSTAGRAM; $("#insta").href = `https://www.instagram.com/${M.INSTAGRAM}/`;
$("#email-hint").textContent = ONLINE ? "(your Party Pass is emailed here)" : "(optional)";
$("#submit-btn").textContent = ONLINE ? "Continue to payment" : "Review booking";
$("#book-sub").textContent = ONLINE ? "Pre-booking is a must. Pay securely online and get your Party Pass instantly." : "Pre-booking is a must. Fill this in, send it to us on WhatsApp and pay by UPI.";
$("#how-steps").innerHTML = (ONLINE ? [
  ["Fill in the form", "Your name, WhatsApp number, email and each child's name and age."],
  ["Pay securely", "UPI, cards or net banking through Razorpay."],
  ["Get your Party Pass", "Download it here, share it on WhatsApp, and find a copy in your email."],
  ["Show it at the entry", "One pass per child, with their name on it."]
] : [
  ["Fill in the form", "Your name, number and each child's name and age."],
  ["Send it on WhatsApp", "Your details arrive as a ready-made message with a booking code."],
  ["Pay by UPI", "Scan the Google Pay QR code shown after you book, then send us the screenshot."],
  ["Get your Party Pass", "Once payment is confirmed, each child gets a personal Party Pass on WhatsApp."]
]).map(([b, p]) => `<li><div><b>${b}</b><p>${p}</p></div></li>`).join("");
const h = location.hash.slice(1); if (open.some((e) => e.id === h)) $("#event").value = h;
updateTotal();
try { const last = JSON.parse(localStorage.getItem("monachi-last") || "null"); if (last) { $("#f-code").value = last.code; $("#f-phone").value = last.phone; } } catch (_) {}
