// Builds one page per event (e.g. halloween/index.html) from index.html.
// Run after changing index.html or adding an event with a "slug" in config.js:
//   node tools/build-event-pages.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "config.js"), "utf8"), sandbox);
const M = sandbox.window.MONACHI;
const site = M.SITE_URL.replace(/\/?$/, "/");
const template = fs.readFileSync(path.join(root, "index.html"), "utf8");
const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

for (const e of M.EVENTS.filter((x) => x.slug)) {
  let html = template;
  // relative paths one folder up
  html = html.replace(/\b(src|href)="(?!https?:|#|mailto:|data:|\.\.\/)([^"]+)"/g, '$1="../$2"');
  // logo and main-page section links go back to the home page
  html = html.replace('<a class="mark" href="#top"', '<a class="mark" href="../"');
  for (const id of ["events", "workshops", "parties"]) html = html.replace(`href="#${id}"`, `href="../#${id}"`);
  html = html.replace('data-root="" data-event=""', `data-root="../" data-event="${e.id}"`);

  const img = site + (e.poster || e.flyer || "assets/og-image.jpg");
  const when = e.date ? `${e.date}${e.time ? ", " + e.time : ""}` : (e.when || "Coming soon");
  const desc = `${when}${e.venue ? " · " + e.venue + (e.city ? ", " + e.city : "") : ""}${e.fee ? ` · ₹${e.fee} per child` : ""}. ${e.lede || ""}`;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${attr(e.title)} · MONACHI Events</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(desc)}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(e.title + " · MONACHI")}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(desc)}">`);
  html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${img}">\n<meta property="og:url" content="${site}${e.slug}/">`);

  fs.mkdirSync(path.join(root, e.slug), { recursive: true });
  fs.writeFileSync(path.join(root, e.slug, "index.html"), html);
  console.log(`built ${e.slug}/index.html`);
}

