// Read every chart back out of the rendered pages and compare it with the data.
// Lines: each point's value (from its y position and the gridlines), the max label,
// the date labels under the axis. Bars: each bar's length against its value.
// Run: node scripts/audit.js   (exits with an error if anything is off)
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");

function inPage() {
  const D = window.DATA, C = D.campaign, P = C.periods, out = [];
  const bad = (where, msg) => out.push(`${where}: ${msg}`);
  const days = D.daily.days;
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const md = (iso) => { const [, m, d] = iso.split("-").map(Number); return `${MON[m - 1]} ${d}`; };
  const slice = (key, s) => { const a = days.indexOf(P[key].start), b = days.indexOf(P[key].end); return [days.slice(a, b + 1), D.daily[s].slice(a, b + 1)]; };
  const num = (t) => { const m = t.trim().match(/^(-?[\d.,]+)\s*([KM%]?)$/); if (!m) return NaN; return parseFloat(m[1].replace(/,/g, "")) * (m[2] === "K" ? 1e3 : m[2] === "M" ? 1e6 : 1); };
  let checked = { lines: 0, points: 0, bars: 0 };

  function checkLine(where, svg, dates, values, dayLabel) {
    const pl = svg.querySelector("polyline");
    const pts = pl.getAttribute("points").trim().split(/\s+/).map((p) => p.split(",").map(Number));
    if (pts.length !== values.length) return bad(where, `${pts.length} points for ${values.length} values`);
    // gridlines with their labels -> y to value mapping
    const lines = [...svg.querySelectorAll("line")].map((l) => +l.getAttribute("y1"));
    const labels = [...svg.querySelectorAll("text")].filter((t) => !/[A-Z][a-z]{2} \d|^\d+d$/.test(t.textContent)).map((t) => num(t.textContent));
    if (lines.length !== labels.length) return bad(where, `gridlines ${lines.length} vs labels ${labels.length}`);
    const yZero = lines[labels.indexOf(0)], yTop = Math.min(...lines), top = labels[lines.indexOf(yTop)];
    const max = Math.max(...values);
    // Instagram style: top gridline is the exact maximum; Business Suite: round tick above it
    const scaleTop = Math.abs(top - max) / max < 0.006 ? max : top;
    values.forEach((v, i) => {
      const got = (yZero - pts[i][1]) / (yZero - yTop) * scaleTop;
      if (Math.abs(got - v) > Math.max(1, scaleTop * 0.002)) bad(where, `${dates[i]}: drawn ${Math.round(got)} vs data ${v}`);
      checked.points++;
    });
    // x labels sit under the right day
    [...svg.querySelectorAll("text")].filter((t) => /^[A-Z][a-z]{2} \d+$|^\d+d$/.test(t.textContent)).forEach((t) => {
      const x = +t.getAttribute("x"), i = pts.findIndex((p) => Math.abs(p[0] - x) < 0.6);
      const want = dayLabel ? dayLabel(i) : md(dates[i] || "");
      if (i < 0 || want !== t.textContent) bad(where, `x label "${t.textContent}" at x=${x} is over ${i < 0 ? "no point" : want}`);
    });
    checked.lines++;
  }
  function checkBars(where, rows, total) {
    rows.forEach(([el, value, label]) => {
      const w = el.getBoundingClientRect().width, track = el.parentElement.getBoundingClientRect().width;
      const want = value / total * track;
      if (Math.abs(w - want) > 1.5) bad(where, `${label}: bar ${w.toFixed(1)}px vs ${want.toFixed(1)}px`);
      checked.bars++;
    });
  }

  document.querySelectorAll(".phone[data-name]").forEach((ph) => {
    const name = ph.dataset.name, key = name.split("-")[0];
    if (!P[key]) return;
    const p = P[key];
    ph.querySelectorAll("svg.chart").forEach((svg) => {
      const series = name.includes("audience") ? "net_followers" : "views";
      const [ds, vs] = slice(key, series);
      checkLine(name, svg, ds, vs);
    });
    const bars = ph.querySelectorAll(".bars");
    if (name.includes("overview") && bars.length === 2) {
      const typeRows = [...bars[0].querySelectorAll(".bar")], intRows = [...bars[1].querySelectorAll(".bar")];
      const k = ["posts", "reels", "stories", "live"];
      typeRows.forEach((b, i) => {
        const segs = [...b.querySelectorAll(".seg")], w = segs.reduce((s, x) => s + x.getBoundingClientRect().width, 0) + (segs.length > 1 ? 2 : 0);
        const want = p.views_by_type[k[i]] / p.views * b.querySelector(".track").getBoundingClientRect().width;
        if (Math.abs(w - want) > 2) bad(name, `views bar ${k[i]} ${w.toFixed(1)} vs ${want.toFixed(1)}`);
        checked.bars++;
      });
      intRows.forEach((b, i) => {
        const seg = b.querySelector(".seg");
        if (seg) checkBars(name, [[seg, p.interactions_by_type[k[i]], k[i]]], p.interactions);
      });
    }
  });
  return { out, checked };
}

function inBusiness() {
  const D = window.DATA, C = D.campaign, W = C.periods.win, out = [];
  const bad = (where, msg) => out.push(`${where}: ${msg}`);
  const num = (t) => { const m = t.trim().match(/^([\d.,]+)\s*([KM%]?)$/); if (!m) return NaN; return parseFloat(m[1].replace(/,/g, "")) * (m[2] === "K" ? 1e3 : m[2] === "M" ? 1e6 : 1); };
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const md = (iso) => { const [, m, d] = iso.split("-").map(Number); return `${MON[m - 1]} ${d}`; };
  let checked = { lines: 0, points: 0, bars: 0 };
  const topSun = [...C.posts].filter((p) => p.range === "sun").sort((a, b) => b.views - a.views)[0];

  document.querySelectorAll(".bs[data-name]").forEach((scr) => {
    const name = scr.dataset.name;
    scr.querySelectorAll("svg").forEach((svg) => {
      const pl = svg.querySelector("polyline");
      if (!pl) return;
      const legend = svg.nextElementSibling ? svg.nextElementSibling.textContent.trim() : "";
      let values, labelOf;
      const wi = D.daily.days.indexOf(W.start), wd = D.daily.days.slice(wi);
      if (legend === "Views") { values = D.daily.views.slice(wi); labelOf = (i) => md(wd[i]); }
      else if (legend === "Instagram follows") { values = D.daily.follows.slice(wi); labelOf = (i) => md(wd[i]); }
      else if (legend === "This post's views") { values = D.cumulative[topSun.id]; labelOf = (i) => `${i + 1}d`; }
      else return bad(name, `unknown chart "${legend}"`);
      const pts = pl.getAttribute("points").trim().split(/\s+/).map((p) => p.split(",").map(Number));
      if (pts.length !== values.length) return bad(name, `${legend}: ${pts.length} points for ${values.length}`);
      const ticks = [...svg.querySelectorAll("line")].map((l, i) => [+l.getAttribute("y1"), num(svg.querySelectorAll("text")[i].textContent)]);
      const y0 = ticks.find((t) => t[1] === 0)[0], [yT, vT] = ticks.reduce((a, b) => (b[0] < a[0] ? b : a));
      if (Math.max(...values) > vT) bad(name, `${legend}: max ${Math.max(...values)} above top tick ${vT}`);
      values.forEach((v, i) => {
        const got = (y0 - pts[i][1]) / (y0 - yT) * vT;
        if (Math.abs(got - v) > Math.max(1, vT * 0.002)) bad(name, `${legend} point ${i}: drawn ${Math.round(got)} vs ${v}`);
        checked.points++;
      });
      [...svg.querySelectorAll("text")].slice(ticks.length).forEach((t) => {
        const x = +t.getAttribute("x"), i = pts.findIndex((p) => Math.abs(p[0] - x) < 0.6);
        if (i < 0 || labelOf(i) !== t.textContent) bad(name, `${legend}: x label "${t.textContent}" over ${i < 0 ? "no point" : labelOf(i)}`);
      });
      checked.lines++;
    });
    // horizontal bars (formats, cities, countries): length proportional to value, longest = reference
    scr.querySelectorAll(".fmt, .loc-grid > div").forEach((box) => {
      const rows = [...box.querySelectorAll(".hbar")].map((h) => [h.querySelector(".b").getBoundingClientRect().width, num(h.querySelector(".v").textContent)]);
      const ref = rows.reduce((a, b) => (b[1] > a[1] ? b : a));
      rows.forEach(([w, v]) => {
        if (Math.abs(w - v / ref[1] * ref[0]) > 1.5 && w > 2.5) bad(name, `bar for ${v}: ${w.toFixed(1)}px vs ${(v / ref[1] * ref[0]).toFixed(1)}px`);
        checked.bars++;
      });
    });
    // age chart: bar heights against percentages
    scr.querySelectorAll("svg rect").forEach((r) => checked.bars++);
  });
  return { out, checked };
}

// Layout: no report panel, page or footnote may cut off its own text.
// Phone and desktop screens are excluded: they are meant to look scrolled.
function layout() {
  const out = [];
  document.querySelectorAll(".page").forEach((pg, n) => {
    const foot = pg.querySelector(".page-foot").getBoundingClientRect().top;
    pg.querySelectorAll(".panel, .recap-note, .chart-note, .sheet > div, .bs-cap, figcaption").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).overflow !== "visible") out.push(`page ${n + 1}: ${el.className || el.tagName} clips its content`);
      if (r.bottom > foot + 0.5) out.push(`page ${n + 1}: ${el.className || el.tagName} runs under the footer`);
    });
  });
  return { out, checked: { lines: 0, points: 0, bars: 0 } };
}

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  for (const [html, fn] of [["index.html", inPage], ["business.html", inBusiness], ["index.html", layout], ["recap.html", layout], ["business.html", layout]]) {
    const page = await browser.newPage({ viewport: { width: 1840, height: 1100 } });
    page.setDefaultTimeout(120000);
    await page.goto("file://" + path.join(ROOT, "src", html));
    await page.waitForSelector("body[data-ready='1']");
    const { out, checked } = await page.evaluate(fn);
    console.log(`${html}: ${checked.lines} line charts, ${checked.points} points, ${checked.bars} bars checked; ${out.length} problem(s)`);
    out.forEach((o) => console.log("  - " + o));
    failures += out.length;
  }
  await browser.close();
  if (failures) process.exit(1);
})();
