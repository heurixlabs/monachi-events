// MONACHI Events — site settings. Edit this file to change events, prices and contact details.

window.MONACHI = {
  // Paste the Google Apps Script "Web app" URL here after setup (see SETUP.md).
  // While it is empty the site runs in WhatsApp + UPI mode (no online payment, no automatic pass).
  BACKEND_URL: "",

  // Razorpay Key ID (starts with rzp_test_ or rzp_live_). This one is safe to publish.
  // NEVER put the Key Secret here. It goes only into Apps Script → Script properties.
  RAZORPAY_KEY_ID: "",

  WHATSAPP: "917217054807",          // country code + number, digits only
  UPI_ID: "monikagupta17681@okaxis", // used in WhatsApp + UPI mode
  UPI_NAME: "Monika Gupta",
  INSTAGRAM: "monachi.crafts",

  // status: "open" = booking live, "soon" = coming soon card with "Notify me".
  // theme: halloween | diwali | christmas | newyear | baking | monachi (colours of the card and the pass)
  // Prices here are for display only. The real price is set in apps-script/Code.gs.
  EVENTS: [
    {
      id: "halloween-2026", code: "HW", status: "open", theme: "halloween",
      title: "Halloween Party", kicker: "Kids party",
      lede: "Spooky fun awaits! An evening of games, crafts and costumes for little monsters.",
      date: "Saturday, 31 October 2026", short: "Sat 31 Oct 2026", time: "5:00 – 7:00 PM",
      ages: "4 – 14 years", minAge: 4, maxAge: 14, fee: 250,
      venue: "Sunbeam Pre School premises",
      activities: ["Fun Halloween games", "Snacks", "Craft activities", "Tattoo making"],
      award: "Best Costume Award: the winner gets a special prize.",
      poster: "assets/halloween-poster.jpg"
    },
    {
      id: "diwali-2026", code: "DW", status: "soon", theme: "diwali",
      title: "Diwali DIY Party", kicker: "Kids & family",
      lede: "Diya painting, rangoli and festive crafts for children and families.",
      when: "November 2026 · date coming soon"
    },
    {
      id: "baking-2026", code: "BK", status: "soon", theme: "baking",
      title: "Kids Baking & Chocolate Workshop", kicker: "Workshop",
      lede: "Little chefs bake cookies and make their own chocolates to take home.",
      when: "November & December 2026",
      photo: "assets/workshops/cookies-1.jpg"
    },
    {
      id: "christmas-2026", code: "XM", status: "soon", theme: "christmas",
      title: "Christmas Party", kicker: "Kids party",
      lede: "Ornament making, Christmas crafts, games and a visit from Santa.",
      when: "December 2026 · date coming soon"
    },
    {
      id: "newyear-2026", code: "NY", status: "soon", theme: "newyear",
      title: "New Year Bash", kicker: "Kids & family",
      lede: "Party hats, countdown crafts, music and games to welcome 2027.",
      when: "Late December 2026 · date coming soon"
    }
  ],

  // Previous workshops shown in the gallery. Add photos to assets/workshops/ and list them here.
  PAST: [
    { title: "DIY Flower Workshop", detail: "Flowers made from pipe cleaners", photos: ["assets/workshops/flowers-1.jpg", "assets/workshops/flowers-2.jpg"] },
    { title: "Cookie Baking Workshop", detail: "Little chefs baked chocolate cookies", photos: ["assets/workshops/cookies-1.jpg", "assets/workshops/cookies-2.jpg"] },
    { title: "Clay Workshop", detail: "Shaping and painting clay models", photos: [], art: "clay" },
    { title: "Tie & Dye Workshop", detail: "Colourful tie and dye T-shirts and bags", photos: [], art: "tiedye" }
  ],

  // Private party enquiries.
  ENQUIRIES: [
    { id: "birthday", title: "Birthday Party DIY", text: "A craft-themed birthday at your venue or ours. We bring the materials, the host and the fun." },
    { id: "kitty", title: "Kitty Party DIY", text: "Pearl canvas, custom tumblers, coin trees and more. A creative afternoon for your group." }
  ]
};
