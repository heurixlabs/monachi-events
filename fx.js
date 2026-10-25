// MONACHI festive backgrounds: light canvas animations per event theme.
// Usage: <canvas class="fx" data-theme="halloween"></canvas> inside a position:relative box.
// Pauses when off screen or the tab is hidden; shows a still frame for "reduce motion" users.

(function () {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const R = (a, b) => a + Math.random() * (b - a);

  const THEMES = {
    halloween: {
      init(w, h) {
        return {
          stars: Array.from({ length: Math.round(w * h / 9000) }, () => ({ x: R(0, w), y: R(0, h * .7), r: R(.4, 1.6), t: R(0, 6) })),
          bats: Array.from({ length: 5 }, () => ({ x: R(-w, 0), y: R(h * .08, h * .5), s: R(.35, .8), v: R(.35, .9), f: R(0, 6) })),
          mist: Array.from({ length: 4 }, (_, i) => ({ x: R(0, w), y: h * (.7 + i * .08), r: R(w * .25, w * .45), v: R(.08, .2) }))
        };
      },
      draw(c, s, w, h, t) {
        s.stars.forEach((p) => { c.globalAlpha = .35 + .35 * Math.sin(t * 1.5 + p.t); c.fillStyle = "#FFEFD2"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); });
        c.globalAlpha = 1;
        s.mist.forEach((m) => {
          m.x += m.v; if (m.x - m.r > w) m.x = -m.r;
          const g = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r); g.addColorStop(0, "rgba(180,150,230,.10)"); g.addColorStop(1, "rgba(180,150,230,0)");
          c.fillStyle = g; c.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
        });
        s.bats.forEach((b) => {
          b.x += b.v; b.f += .18; if (b.x > w + 60) { b.x = R(-200, -40); b.y = R(h * .08, h * .5); }
          const y = b.y + Math.sin(b.x / 60) * 10, flap = Math.sin(b.f) * 9 * b.s, sz = 16 * b.s;
          c.fillStyle = "rgba(10,6,22,.85)"; c.beginPath();
          c.moveTo(b.x, y);
          c.quadraticCurveTo(b.x - sz, y - flap - sz * .4, b.x - sz * 2, y - flap * .4);
          c.quadraticCurveTo(b.x - sz, y + sz * .2, b.x, y + sz * .3);
          c.quadraticCurveTo(b.x + sz, y + sz * .2, b.x + sz * 2, y - flap * .4);
          c.quadraticCurveTo(b.x + sz, y - flap - sz * .4, b.x, y);
          c.fill();
        });
      }
    },
    diwali: {
      init(w, h) { return { sparks: Array.from({ length: Math.round(w / 14) }, () => this.spark(w, h, true)) }; },
      spark(w, h, any) { return { x: R(0, w), y: any ? R(0, h) : h + 10, v: R(.25, .8), r: R(1, 3.2), d: R(-.3, .3), hue: R(30, 48), t: R(0, 6) }; },
      draw(c, s, w, h, t) {
        s.sparks.forEach((p, i) => {
          p.y -= p.v; p.x += p.d + Math.sin(t + p.t) * .2;
          if (p.y < -10) s.sparks[i] = this.spark(w, h, false);
          const a = .4 + .4 * Math.sin(t * 3 + p.t);
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          g.addColorStop(0, `hsla(${p.hue},100%,70%,${a})`); g.addColorStop(1, `hsla(${p.hue},100%,60%,0)`);
          c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r * 5, 0, 7); c.fill();
        });
      }
    },
    christmas: {
      init(w, h) { return { flakes: Array.from({ length: Math.round(w * h / 6000) }, () => ({ x: R(0, w), y: R(0, h), r: R(.8, 3), v: R(.3, 1.1), t: R(0, 6) })) }; },
      draw(c, s, w, h, t) {
        c.fillStyle = "rgba(255,255,255,.8)";
        s.flakes.forEach((f) => {
          f.y += f.v; f.x += Math.sin(t + f.t) * .4;
          if (f.y > h + 5) { f.y = -5; f.x = R(0, w); }
          c.globalAlpha = .5 + f.r / 6; c.beginPath(); c.arc(f.x, f.y, f.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
      }
    },
    newyear: {
      init() { return { bursts: [], next: 0 }; },
      draw(c, s, w, h, t) {
        if (t > s.next) {
          const cx = R(w * .1, w * .9), cy = R(h * .12, h * .55), hue = [45, 330, 185, 270][Math.floor(R(0, 4))];
          s.bursts.push({ cx, cy, hue, born: t, parts: Array.from({ length: 34 }, (_, i) => ({ a: i / 34 * Math.PI * 2, sp: R(40, 90) })) });
          s.next = t + R(.7, 1.6);
        }
        s.bursts = s.bursts.filter((b) => t - b.born < 1.8);
        s.bursts.forEach((b) => {
          const age = t - b.born, fade = 1 - age / 1.8;
          b.parts.forEach((p) => {
            const d = p.sp * Math.min(age * 1.6, 1.4), x = b.cx + Math.cos(p.a) * d, y = b.cy + Math.sin(p.a) * d + age * age * 18;
            c.fillStyle = `hsla(${b.hue},95%,65%,${fade})`; c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill();
          });
        });
      }
    },
    baking: {
      init(w, h) { const cols = ["#F6B37A", "#E0306A", "#00A0AA", "#F9C440", "#FFFFFF"]; return { bits: Array.from({ length: Math.round(w / 16) }, () => ({ x: R(0, w), y: R(0, h), v: R(.2, .6), a: R(0, 6), va: R(-.02, .02), col: cols[Math.floor(R(0, 5))] })) }; },
      draw(c, s, w, h) {
        s.bits.forEach((b) => {
          b.y += b.v; b.a += b.va; if (b.y > h + 8) { b.y = -8; b.x = R(0, w); }
          c.save(); c.translate(b.x, b.y); c.rotate(b.a); c.fillStyle = b.col; c.globalAlpha = .55;
          c.beginPath(); c.roundRect ? c.roundRect(-4, -1.3, 8, 2.6, 1.3) : c.rect(-4, -1.3, 8, 2.6); c.fill(); c.restore();
        });
      }
    }
  };
  THEMES.monachi = THEMES.baking;

  function start(canvas) {
    const theme = THEMES[canvas.dataset.theme] || THEMES.monachi;
    const c = canvas.getContext("2d");
    let w = 0, h = 0, state = null, raf = 0, visible = true, t0 = performance.now();
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5), r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      state = theme.init(w, h);
    };
    const frame = (now) => {
      c.clearRect(0, 0, w, h);
      theme.draw(c, state, w, h, (now - t0) / 1000);
      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const resume = () => { cancelAnimationFrame(raf); if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    fit();
    // still frame first (also the only frame for reduced motion)
    for (let i = 0; i < 90; i++) theme.draw(c, state, w, h, i / 30), c.clearRect(0, 0, w, h);
    theme.draw(c, state, w, h, 3);
    if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; resume(); }).observe(canvas);
    document.addEventListener("visibilitychange", resume);
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { fit(); theme.draw(c, state, w, h, 3); resume(); }, 150); });
    resume();
  }

  window.MonachiFx = { start, startAll: (root = document) => root.querySelectorAll("canvas.fx:not([data-started])").forEach((cv) => { cv.dataset.started = "1"; start(cv); }) };
})();
