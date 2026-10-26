// MONACHI Events — site settings. Edit this file to change events, prices and contact details.

window.MONACHI = {
  // Paste the Google Apps Script "Web app" URL here after setup (see SETUP.md).
  // While it is empty the site runs in WhatsApp + UPI mode (no online payment, no automatic pass).
  BACKEND_URL: "",

  // Used only by the hidden test page (test-booking/) while Razorpay is in Test Mode.
  // When Razorpay approves the account: put the live Key ID below and copy this URL into BACKEND_URL.
  TEST_BACKEND_URL: "https://script.google.com/macros/s/AKfycbxwDjusQhGyCM2Zq5JoTft-4ItwB8pt9bYNjiAsPGpdbkRmUHJTYJS8pATlEfOzRob_tg/exec",

  // Razorpay Key ID (starts with rzp_test_ or rzp_live_). This one is safe to publish.
  // NEVER put the Key Secret here. It goes only into Apps Script → Script properties.
  RAZORPAY_KEY_ID: "rzp_test_Ts4Ojh2zAd43IX",

  WHATSAPP: "917217054807",          // country code + number, digits only
  EMAIL: "monachi.bookings@gmail.com",
  UPI_ID: "monikagupta17681@okaxis", // used in WhatsApp + UPI mode
  UPI_NAME: "Monika Gupta",
  INSTAGRAM: "monachi.crafts",

  // Live website address (used for share links and calendar invites).
  SITE_URL: "https://heurixlabs.github.io/monachi-events/",

  // status: "open" = booking live, "soon" = coming soon card with "Notify me".
  // slug: the event's own page, e.g. slug "halloween" → SITE_URL + "halloween/" (run tools/build_event_pages.py after adding one)
  // start / end: ISO date-time with +05:30 (drives the countdown and "Add to calendar"); leave out until the date is fixed.
  // mapUrl: Google Maps link for the venue.
  // theme: halloween | diwali | christmas | newyear | baking | monachi (colours of the card and the pass)
  // Prices here are for display only. The real price is set in apps-script/Code.gs.
  EVENTS: [
    {
      id: "halloween-2026", slug: "halloween", code: "HW", status: "open", theme: "halloween",
      title: "Halloween Party", kicker: "Kids party",
      lede: "Spooky fun awaits! An evening of games, crafts and costumes for little monsters.",
      date: "Saturday, 31 October 2026", short: "Sat 31 Oct 2026", time: "5:00 – 7:00 PM",
      start: "2026-10-31T17:00:00+05:30", end: "2026-10-31T19:00:00+05:30",
      ages: "4 – 14 years", minAge: 4, maxAge: 14, fee: 250,
      venue: "Sunbeam Pre School premises", city: "Haridwar",
      mapUrl: "https://maps.app.goo.gl/pyUiNYeGjpbrEBzr9",
      activities: ["Fun Halloween games", "Snacks", "Craft activities", "Tattoo making"],
      award: "Best Costume Award: the winner gets a special prize.",
      poster: "assets/halloween-poster.jpg"
    },
    {
      id: "diwali-2026", slug: "diwali", code: "DW", status: "soon", theme: "diwali",
      title: "Diwali Family Celebration", kicker: "Family & friends",
      badge: "Passes available shortly",
      soonNote: "Booking passes will be available shortly. Tap \"Notify me\" and we'll message you the moment they open.",
      blurb: "A festive evening of lights, music, food, shopping and crafts for the whole family and friends.",
      lede: "A festive evening for the whole family and friends: lights, laughter and togetherness. Presented by MONACHI in collaboration with Breeze & Beans. Come, celebrate, shop, eat and make memories!",
      date: "Wednesday, 4 November 2026", short: "Wed 4 Nov 2026", time: "6:00 – 11:00 PM",
      start: "2026-11-04T18:00:00+05:30", end: "2026-11-04T23:00:00+05:30",
      when: "Wed 4 Nov 2026 · 6–11 PM · Breeze & Beans",
      venue: "Breeze & Beans Café, Kankhal", city: "Haridwar",
      mapUrl: "https://maps.app.goo.gl/gDgER1nTx5WmNH6Z6",
      activities: ["Live music", "Food", "Shopping from local small businesses", "Craft fest: Diwali décor ideas", "Family fun activities"],
      flyer: "assets/flyers/diwali-family.jpg"
    },
    {
      id: "baking-2026", slug: "little-baker", code: "BK", status: "soon", theme: "baking",
      title: "Little Baker Bakery Workshop", kicker: "Kids workshop",
      lede: "Little chefs mix, bake and decorate treats, and make chocolates to take home.",
      when: "November & December 2026",
      flyer: "assets/flyers/little-baker.jpg"
    },
    {
      id: "christmas-2026", slug: "christmas", code: "XM", status: "soon", theme: "christmas",
      title: "Christmas Party", kicker: "Kids party",
      lede: "Ornament making, Christmas crafts, games and a visit from Santa.",
      when: "December 2026 · date coming soon",
      flyer: "assets/flyers/christmas.jpg"
    },
    {
      id: "newyear-2026", slug: "new-year", code: "NY", status: "soon", theme: "newyear",
      title: "New Year Bash", kicker: "Kids & family",
      lede: "Party hats, countdown crafts, music and games to welcome 2027.",
      when: "Late December 2026 · date coming soon",
      flyer: "assets/flyers/newyear.jpg"
    }
  ],

  // Previous workshops shown in the gallery. Add photos to assets/workshops/ and list them here.
  PAST: [
    { title: "DIY Flower Workshop", detail: "Flowers made from pipe cleaners", photos: ["assets/workshops/flowers-1.jpg", "assets/workshops/flowers-2.jpg"] },
    { title: "Kids Baker Class", detail: "12 June 2026 · little chefs baked chocolate cookies", photos: ["assets/flyers/kids-baker-class-jun-2026.jpg", "assets/workshops/cookies-1.jpg", "assets/workshops/cookies-2.jpg"] },
    { title: "Clay Workshop", detail: "Kids sculpted their own superhero figures from clay", photos: ["assets/workshops/clay-1.jpg", "assets/workshops/clay-2.jpg"], art: "clay" },
    { title: "Tie & Dye Workshop", detail: "Tied, dyed and unwrapped their own colourful cloths", photos: ["assets/workshops/tiedye-1.jpg", "assets/workshops/tiedye-3.jpg", "assets/workshops/tiedye-2.jpg"], art: "tiedye" }
  ],

  // Private party enquiries.
  ENQUIRIES: [
    { id: "birthday", title: "Birthday Party DIY", text: "A craft-themed birthday at your venue or ours. We bring the materials, the host and the fun." },
    { id: "kitty", title: "Kitty Party DIY", text: "Pearl canvas, custom tumblers, coin trees and more. A creative afternoon for your group." }
  ]
};
