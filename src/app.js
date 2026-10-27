/* Builds every page of the mockup from window.DATA (src/data.js).
   No figure is typed here: all numbers come from data/campaign.json or from
   the daily series that scripts/model.py derives and verifies. */
(function () {
  const C = DATA.campaign;
  const DAILY = DATA.daily;
  const POSTS = Object.fromEntries(C.posts.map((p) => [p.id, p]));
  const PERIODS = C.periods;
  const FOOT = "@laboratoires_nihel · reconstruction for an MSc thesis (A. Belhassen, 2026) · not a screenshot of Instagram";
  const BADGE = "Illustrative mockup — simulated data — not an official Instagram export";

  // ---------- formatting ----------
  const fmt = (n) => n.toLocaleString("en-US");
  // Instagram compact numbers: "1K", "13.6K", "141K" (bars, tiles, axes) and "1.0K" (content list)
  function compact(n, keepZero) {
    if (n < 1000) return String(Math.round(n * 10) / 10);
    if (n >= 100000) return Math.round(n / 1000) + "K";
    let s = (n / 1000).toFixed(1);
    if (!keepZero) s = s.replace(/\.0$/, "");
    return s + "K";
  }
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const shortDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return MON[m - 1] + " " + d; };
  const pctNum = (s) => parseFloat(s);
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const thumb = (id) => `../assets/thumbs/${id}.jpg`;

  // ---------- icons (24px grid, stroke) ----------
  const S = (size, body, extra = "") =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</svg>`;
  const I = {
    back: S(27, '<path d="M15 4.5 7.5 12l7.5 7.5"/>', 'stroke-width="2.1"'),
    share: S(26, '<path d="M8.5 9.5H5.5v11.5h13V9.5h-3"/><path d="M12 2.5v12"/><path d="M8 6.3 12 2.5l4 3.8"/>', 'stroke-width="1.8"'),
    info: S(27, '<circle cx="12" cy="12" r="9.6"/><path d="M12 10.8v6"/><circle cx="12" cy="7.5" r=".7" fill="currentColor"/>', 'stroke-width="1.7"'),
    infoSm: S(17, '<circle cx="12" cy="12" r="9.2"/><path d="M12 11v5.5"/><circle cx="12" cy="7.6" r=".7" fill="currentColor"/>', 'stroke-width="2.1"'),
    chev: S(14, '<path d="m6 9 6 6 6-6"/>', 'stroke-width="2.6"'),
    heart: (s = 12) => S(s, '<path d="M12 20s-7.5-4.6-9.2-9.3C1.7 7.5 3.8 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.2 0 5.3 3 4.2 6.2C19.5 15.4 12 20 12 20Z"/>', 'stroke-width="2.2"'),
    comment: (s = 12) => S(s, '<path d="M3.5 12a8.5 8.5 0 0 0 12.6 7.4l4.4 1.1-1.1-4.2A8.5 8.5 0 1 0 3.5 12Z"/>', 'stroke-width="2"'),
    send: (s = 12) => S(s, '<path d="M3 4.5h18L12.6 20.5l-2.3-7.6Z"/><path d="M10.3 12.9 21 4.5"/>', 'stroke-width="2"'),
    save: (s = 12) => S(s, '<path d="M18.5 21 12 15.5 5.5 21V3.5h13V21Z"/>', 'stroke-width="2.2"'),
    repost: (s = 12) => S(s, '<path d="M16.5 3 20 6.5 16.5 10"/><path d="M4 12v-1.5a4 4 0 0 1 4-4h12"/><path d="M7.5 21 4 17.5 7.5 14"/><path d="M20 12v1.5a4 4 0 0 1-4 4H4"/>', 'stroke-width="2"'),
    eye: S(13, '<path d="M1.8 12S5.5 5 12 5s10.2 7 10.2 7-3.7 7-10.2 7S1.8 12 1.8 12Z"/><circle cx="12" cy="12" r="3.2"/>', 'stroke-width="2.4"'),
    reel: (s = 14) => S(s, '<rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5"/><path d="M2.8 8.3h18.4M9 2.8l3 5.5M15 2.8l3 5.5"/><path d="M10 11.6v5.6l4.8-2.8L10 11.6Z" fill="currentColor" stroke-width="1.2"/>', 'stroke-width="1.9"'),
    carousel: (s = 14) => S(s, '<rect x="2.8" y="6.5" width="14.7" height="14.7" rx="2.5"/><path d="M7 2.8h11.7a2.5 2.5 0 0 1 2.5 2.5V17"/>', 'stroke-width="2"'),
    person: S(24, '<circle cx="12" cy="12" r="9.3"/><circle cx="12" cy="9.8" r="3.2"/><path d="M6.2 18.6c1.3-2.3 3.4-3.5 5.8-3.5s4.5 1.2 5.8 3.5"/>', 'stroke-width="1.8"'),
    extlink: S(24, '<path d="M13.5 3.5h7v7"/><path d="M20.5 3.5 11 13"/><path d="M18 14v4.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2H10"/>', 'stroke-width="1.8"'),
    store: S(24, '<path d="M3.5 9.5 5 4h14l1.5 5.5"/><path d="M3.5 9.5a2.8 2.8 0 0 0 5.67 0 2.8 2.8 0 0 0 5.66 0 2.8 2.8 0 0 0 5.67 0"/><path d="M5 12.2V20h14v-7.8"/><path d="M10 20v-4.5h4V20"/>', 'stroke-width="1.8"'),
  };
  const bed = `<svg width="21" height="13" viewBox="0 0 21 13" fill="#fff"><path d="M1 1.2h1.6v5.3h16.8c.6 0 1 .4 1 1v5.3h-1.6v-2.3H2.6v2.3H1z"/><rect x="3.5" y="2.6" width="5.2" height="3.4" rx="1.4"/><rect x="9.6" y="2.6" width="9.6" height="3.4" rx="1.4"/></svg>`;
  const signal = `<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx=".8" fill="#fff"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8" fill="#fff"/><rect x="10" y="3" width="3" height="9" rx=".8" fill="#fff"/><rect x="15" y="0" width="3" height="12" rx=".8" fill="#fff"/></svg>`;
  const wifi = `<svg width="16" height="12" viewBox="0 0 16 12" fill="#fff"><path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.3-1.3A10.3 10.3 0 0 0 8 .8 10.3 10.3 0 0 0 .7 3.7L2 5a8.5 8.5 0 0 1 6-2.4Z"/><path d="M8 6.2c1.3 0 2.5.5 3.4 1.3l1.3-1.3A6.7 6.7 0 0 0 8 4.4c-1.8 0-3.5.7-4.7 1.8l1.3 1.3c.9-.8 2.1-1.3 3.4-1.3Z"/><path d="M8 9.7c.4 0 .8.2 1.1.4L8 11.3 6.9 10.1c.3-.2.7-.4 1.1-.4Z"/><circle cx="8" cy="10.2" r="1.3"/></svg>`;
  const battery = `<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.6" fill="none" stroke="#fff" stroke-opacity=".45"/><rect x="2.2" y="2.2" width="17" height="8.6" rx="2" fill="#fff"/><path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1S25.8 4.7 25 4.4Z" fill="#fff" fill-opacity=".5"/></svg>`;

  // ---------- phone chrome ----------
  function phone(tab, inner, scroll) {
    const tabs = ["Overview", "Content", "Audience"].map((t) => `<div class="${t === tab ? "on" : ""}">${t}</div>`).join("");
    const node = el(`<div class="phone">
      <div class="ph-top">
        <div class="status"><span class="time">12:29${bed}</span><span class="sys">${signal}${wifi}${battery}</span></div>
        <div class="nav"><span class="back">${I.back}</span><span class="title">Insights</span><span class="acts">${I.share}${I.info}</span></div>
        <div class="tabs">${tabs}</div>
      </div>
      <div class="viewport"><div class="scroll">${inner}</div></div>
      <div class="home-fade"></div><div class="simline">Illustrative mockup · simulated data</div><div class="home"></div>
    </div>`);
    node.dataset.anchor = scroll ? scroll[0] : "";
    node.dataset.at = scroll ? scroll[1] : 0;
    return node;
  }
  function applyScroll(root) {
    root.querySelectorAll(".phone").forEach((ph) => {
      if (!ph.dataset.anchor) return;
      const target = ph.querySelector("#" + ph.dataset.anchor);
      const sc = ph.querySelector(".scroll");
      sc.style.transform = `translateY(${-(target.offsetTop - Number(ph.dataset.at))}px)`;
    });
  }

  // ---------- shared blocks ----------
  const secTitle = (txt, info = true) => `<div class="h-sec">${txt}${info ? I.infoSm : ""}</div>`;
  const picker = (txt) => `<span class="picker">${txt}${I.chev}</span>`;

  function bar(name, segs, num) {
    const s = segs.map(([w, c]) => `<div class="seg" style="width:${(w * 100).toFixed(3)}%;background:${c}"></div>`).join("");
    return `<div class="bar"><div class="name">${name}</div><div class="line"><div class="track">${s}</div><div class="num">${num}</div></div></div>`;
  }

  // Line chart drawn like Instagram: top gridline = series maximum, middle = half, bottom = 0.
  function lineChart(values, dates, height = 124) {
    const W = 414, x0 = 50, x1 = 383, top = 10, bot = top + height;
    const max = Math.max(...values);
    const x = (i) => x0 + (x1 - x0) * (i / (values.length - 1));
    const y = (v) => bot - (v / max) * height;
    const pts = values.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
    const lab = (v) => compact(v, false);
    const grid = [max, max / 2, 0].map((v) =>
      `<line x1="${x0}" x2="${x1}" y1="${y(v)}" y2="${y(v)}" stroke="#2b2e35" stroke-width="1"/>
       <text x="42" y="${y(v) + 4.5}" font-size="13" fill="#a8abb3" text-anchor="end">${lab(v)}</text>`).join("");
    const mid = Math.floor((values.length - 1) / 2);
    const xl = `<text x="${x0}" y="${bot + 20}" font-size="13" fill="#a8abb3">${shortDate(dates[0])}</text>
      <text x="${x(mid)}" y="${bot + 20}" font-size="13" fill="#a8abb3" text-anchor="middle">${shortDate(dates[mid])}</text>
      <text x="${x1}" y="${bot + 20}" font-size="13" fill="#a8abb3" text-anchor="end">${shortDate(dates[dates.length - 1])}</text>`;
    return `<svg class="chart" width="${W}" height="${bot + 30}" viewBox="0 0 ${W} ${bot + 30}">${grid}
      <polyline points="${pts}" fill="none" stroke="var(--ig-magenta)" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>${xl}</svg>`;
  }

  function slice(key, series) {
    const p = PERIODS[key];
    const a = DAILY.days.indexOf(p.start), b = DAILY.days.indexOf(p.end);
    return { dates: DAILY.days.slice(a, b + 1), values: DAILY[series].slice(a, b + 1) };
  }
  function postsIn(key) {
    const p = PERIODS[key];
    return C.posts.filter((x) => x.date >= p.start && x.date <= p.end).sort((a, b) => b.views - a.views);
  }

  // ---------- Overview tab ----------
  function overview(key) {
    const p = PERIODS[key];
    const v = slice(key, "views");
    const vt = p.views_by_type, fs = p.follower_split_by_type;
    const typeBar = (name, k) => {
      const share = vt[k] / p.views;
      const f = fs[k] || 0;
      return bar(name, vt[k] ? [[share * f, "var(--ig-magenta)"], [share * (1 - f), "var(--ig-pink)"]] : [], compact(vt[k]));
    };
    const it = p.interactions_by_type;
    const intBar = (name, k) => bar(name, it[k] ? [[it[k] / p.interactions, "var(--ig-magenta)"]] : [], fmt(it[k]));
    const top = postsIn(key).slice(0, 4).map((x) =>
      `<div class="tile" style="background-image:url('${thumb(x.id)}')">
        ${x.format === "Reel" ? `<span class="ti">${I.reel(17)}</span>` : x.format === "Carousel" ? `<span class="ti">${I.carousel(17)}</span>` : ""}
        <span class="tv">${I.eye}${compact(x.views)}</span></div>`).join("");
    return `
      <div class="row sec-first"><span class="h-big">All content</span>${picker(PERIODS[key].picker)}</div>
      <div class="cards">
        <div class="card on"><div class="lbl">Views</div><div class="val">${fmt(p.views)}</div></div>
        <div class="card"><div class="lbl">Net followers</div><div class="val">+${fmt(p.net_followers)}</div></div>
        <div class="card"><div class="lbl">Interactions</div><div class="val">${fmt(p.interactions)}</div></div>
      </div>
      <div class="share-txt"><b>${p.follower_share.followers}</b> followers<br><b>${p.follower_share.non_followers}</b> non-followers</div>
      ${lineChart(v.values, v.dates)}
      <div class="band"></div>
      <div class="sec" id="sec-type">${secTitle("Views by content type")}</div>
      <div class="row kv"><span>Viewers</span><span>${fmt(p.viewers)}</span></div>
      <div class="legend"><span><i style="background:var(--ig-magenta)"></i>Followers</span><span><i style="background:var(--ig-pink)"></i>Non-followers</span></div>
      <div class="bars">${typeBar("Posts", "posts")}${typeBar("Reels", "reels")}${typeBar("Stories", "stories")}${typeBar("Live videos", "live")}</div>
      <div class="sec row" id="sec-top"><span class="h-sec">Top content by views</span><span class="link">See all</span></div>
      <div class="tiles">${top}</div>
      <div class="sec" id="sec-int">${secTitle("Interactions by content type")}</div>
      <div class="chips"><span class="chip on">All</span><span class="chip">${I.heart(14)}Likes</span><span class="chip">${I.comment(14)}Comments</span><span class="chip">${I.repost(14)}Reposts</span><span class="chip">${I.send(14)}Shares</span></div>
      <div class="bars">${intBar("Posts", "posts")}${intBar("Reels", "reels")}${intBar("Stories", "stories")}${intBar("Live videos", "live")}</div>
      <div class="sec" id="sec-prof">${secTitle("Profile activity")}</div>
      <div class="prof">
        <div class="it"><span class="ic">${I.person}</span><span class="nm">Profile visits</span><span class="v">${fmt(p.profile.visits)}</span></div>
        <div class="it"><span class="ic">${I.extlink}</span><span class="nm">Bio link taps</span><span class="v">${fmt(p.profile.bio_taps)}</span></div>
        <div class="it"><span class="ic">${I.store}</span><span class="nm">Business address taps</span><span class="v">${fmt(p.profile.address_taps)}</span></div>
      </div>`;
  }

  // ---------- Content tab ----------
  // Instagram lists post age relative to the day the screen is viewed: here the day after the period ends
  function ago(iso, end) {
    const days = Math.round((Date.parse(end) - Date.parse(iso)) / 864e5) + 1;
    return days < 7 ? `${days}d` : `${Math.floor(days / 7)}w`;
  }

  function content(key) {
    const rows = postsIn(key).slice(0, 10).map((x) => `
      <div class="li">
        <div class="th" style="background-image:url('${thumb(x.id)}')">${x.format === "Reel" ? I.reel(11) : x.format === "Carousel" ? I.carousel(11) : ""}</div>
        <div class="tx">
          <div class="cap"><span class="c">${esc(x.title || "")}</span><span class="d">${ago(x.date, PERIODS[key].end)}</span></div>
          <div class="mx"><span>${I.heart(15)}${fmt(x.likes)}</span><span>${I.comment(15)}${fmt(x.comments)}</span><span>${I.repost(15)}0</span><span>${I.send(15)}${fmt(x.shares)}</span></div>
        </div>
        <div class="rv"><b>${compact(x.views, true)}</b><small>Views</small></div>
      </div>`).join("");
    return `
      <div class="row sec-first"><span class="h-big dd">All content ${I.chev}</span>${picker(PERIODS[key].picker)}</div>
      <div class="chips"><span class="chip">Latest</span><span class="chip on">Views</span><span class="chip">Viewers</span><span class="chip">Follows</span><span class="chip">Likes</span><span class="chip">Comments</span></div>
      <div class="list">${rows}</div>`;
  }

  // ---------- Audience tab ----------
  function audience(key, locMode) {
    const p = PERIODS[key], A = C.audience;
    const f = slice(key, "net_followers");
    const pctBars = (rows, colors) => `<div class="bars pct">${rows.map(([n, v], i) =>
      bar(esc(n), [[pctNum(v) / 100, colors ? colors[i] : "var(--ig-magenta)"]], v)).join("")}</div>`;
    const loc = locMode === "cities" ? p.cities : A.countries;
    const act = Object.entries(A.active_times_relative);
    return `
      <div class="row sec-first"><span class="h-big">Followers</span>${picker(PERIODS[key].picker)}</div>
      <div class="fol-num">${fmt(p.followers_end)}</div>
      <div class="fol-delta"><b>${p.growth_pct}</b> since ${p.since}</div>
      <div class="sec">${secTitle("Follower growth over time", false)}</div>
      <div class="chips"><span class="chip on">Overall</span><span class="chip">Follows</span><span class="chip">Unfollows</span></div>
      ${lineChart(f.values, f.dates, 106)}
      <div class="sec" id="sec-gender">${secTitle("Gender")}</div>
      ${pctBars(A.gender, ["var(--ig-magenta)", "var(--ig-pink)"])}
      <div class="sec" id="sec-age">${secTitle("Age range")}</div>
      ${pctBars(A.age)}
      <div class="sec" id="sec-loc">${secTitle("Top locations")}</div>
      <div class="chips"><span class="chip ${locMode === "cities" ? "" : "on"}">Countries</span><span class="chip ${locMode === "cities" ? "on" : ""}">Cities</span></div>
      ${pctBars(loc)}
      <div class="sec" id="sec-lang">${secTitle("Top languages")}</div>
      ${pctBars(A.languages)}
      <div class="sec" id="sec-active">${secTitle("Follower active times")}</div>
      <div class="subnote">Based on your current time zone (GMT+1)</div>
      <div class="chips days">${["Su", "M", "Tu", "W", "Th", "F", "Sa"].map((d, i) => `<span class="chip ${i ? "" : "on"}">${d}</span>`).join("")}</div>
      <div class="act">${act.map(([, r]) => `<div style="height:${(r * 100).toFixed(1)}%"></div>`).join("")}</div>
      <div class="act-lbl">${act.map(([h]) => `<span>${h}</span>`).join("")}</div>
      <div class="most">When followers are most active</div>
      ${["Sundays", "Mondays", "Tuesdays"].map((d) => `<div class="most-row"><b>${d}</b>6 PM - 9 PM</div>`).join("")}`;
  }

  // ---------- pages ----------
  function page(title, sub, body) {
    const n = document.querySelectorAll(".page").length + 1;
    const pg = el(`<section class="page">
      <header class="page-head"><h1>${title} <span>· ${sub}</span></h1><span class="sim-badge">${BADGE}</span></header>
      <footer class="page-foot"><span>${FOOT}</span><span>Page ${n}</span></footer></section>`);
    pg.insertBefore(body, pg.querySelector(".page-foot"));
    document.body.appendChild(pg);
    applyScroll(pg);
    return pg;
  }
  function shotsPage(key, kind) {
    const p = PERIODS[key];
    const wrap = el(`<div class="screens"></div>`);
    const shots = kind === "overview"
      ? [["Overview", overview(key), null, "Overview · chart = views per day"],
         ["Overview", overview(key), ["sec-top", 165], "Overview · scrolled to top content"],
         ["Overview", overview(key), ["sec-int", 130], "Overview · scrolled to profile activity"],
         ["Content", content(key), null, "Content · sorted by views"]]
      : [["Audience", audience(key, "countries"), null, "Audience · followers"],
         ["Audience", audience(key, "countries"), ["sec-age", 57], "Audience · age and countries"],
         ["Audience", audience(key, "cities"), ["sec-loc", 29], "Audience · cities and languages"],
         ["Audience", audience(key, "countries"), ["sec-active", 188], "Audience · active times"]];
    shots.forEach(([tab, html, scroll, cap], i) => {
      const fig = el(`<figure class="shot"></figure>`);
      const ph = phone(tab, html, scroll);
      ph.dataset.name = `${key}-${kind}-${i + 1}`;
      fig.appendChild(ph);
      fig.appendChild(el(`<figcaption><b>${i + 1}</b> · ${cap} · ${p.range}</figcaption>`));
      wrap.appendChild(fig);
    });
    const title = kind === "overview" ? "Overview and content" : "Audience";
    const note = kind === "audience" ? " · audience data estimated" : key === "jul" ? " · the 15 Aug Reel (107K) is counted in August" : "";
    if (kind !== "overview") return page(`${p.label} · ${title}`, p.range + note, wrap);
    const holder = el(`<div></div>`);
    wrap.style.bottom = "64px";
    holder.append(wrap, el(`<div class="chart-note">${chartNote(key)}</div>`));
    return page(`${p.label} · ${title}`, p.range + note, holder);
  }

  // Why the chart's top value is lower than the biggest post: one point = one day.
  function chartNote(key) {
    const p = PERIODS[key], { dates, values } = slice(key, "views");
    const i = values.indexOf(Math.max(...values)), day = dates[i];
    const lead = C.posts.filter((x) => x.date === day).sort((a, b) => b.views - a.views)[0];
    const [, m, d] = day.split("-").map(Number);
    const dayTxt = `${d} ${MON[m - 1]}`;
    return `<b>Reading the chart:</b> one point = the views of one day (all content, stories included); the ${values.length} days add up to ${fmt(p.views)}. ` +
      `Busiest day ${dayTxt}: ${fmt(values[i])} views` +
      (lead ? `, of which ${fmt(DATA.cumulative[lead.id][0])} from the first day of “${esc(lead.title)}”. Its ${fmt(lead.views)} views spread over 30 days (40% on day 1), so no single day reaches a post's total, as in Instagram.` : ".");
  }

  function peakLabel(key) {
    const { dates, values } = slice(key, "views"), i = values.indexOf(Math.max(...values));
    const [, m, d] = dates[i].split("-").map(Number);
    return `${d} ${["January", "February", "March", "April", "May", "June", "July", "August", "September"][m - 1]} (${fmt(values[i])} views)`;
  }

  // ---------- cover ----------
  function cover() {
    const J = PERIODS.jul, G = PERIODS.aug, W = PERIODS.win, R = PERIODS.pre;
    const sep = (f) => f(W) - (f(J) - f(R)) - f(G);
    const vt = (k) => (p) => p.views_by_type[k];
    const idt = (k) => (p) => p.interactions_detail[k];
    const r = (label, f, cls = "") => `<tr class="${cls}"><td>${label}</td><td>${fmt(f(J))}</td><td>${fmt(f(R))}</td><td>${fmt(f(G))}</td><td>${fmt(sep(f))}</td><td>${fmt(f(W))}</td></tr>`;
    const signed = (label, f, cls = "") => `<tr class="${cls}"><td>${label}</td><td>+${fmt(f(J))}</td><td>+${fmt(f(R))}</td><td>+${fmt(f(G))}</td><td>+${fmt(sep(f))}</td><td>+${fmt(f(W))}</td></tr>`;
    const splitRow = (label, k) => `<tr><td>${label}</td>${["jul", "aug", "win"].map((q) => PERIODS[q].split[k].map((x) => `<td>${x === null ? "–" : fmt(x)}</td>`).join("")).join("")}</tr>`;
    const body = el(`<div class="sheet" style="grid-template-columns: 1.05fr 1fr;">
      <div>
        <div class="eyebrow">Appendix · illustrative mockup · simulated data · version 3</div>
        <div class="cover-title">The Nihel Sun care launch,<br>shown as Instagram Insights screens</div>
        <p class="lede">July (Instagram’s last 30 days: 2–31 July), August and the whole launch window (5 July – 1 September 2026), redrawn from the reference
        Instagram Insights screenshots. Figures: the version 2 simulation plus three Reels that only show in the Reels tab (5, 20 and 25 July), added with the same rules; the
        day-by-day charts come from the same deterministic model, so every total is the exact sum of its parts.</p>
        <div class="kpis">
          <div class="kpi"><div class="l">Views · July</div><div class="v">${fmt(J.views)}</div></div>
          <div class="kpi"><div class="l">Views · August</div><div class="v">${fmt(G.views)}</div></div>
          <div class="kpi"><div class="l">Views · window</div><div class="v">${fmt(W.views)}</div></div>
          <div class="kpi"><div class="l">Followers · 1 Sep</div><div class="v">${fmt(W.followers_end)}</div></div>
          <div class="kpi"><div class="l">Interactions · window</div><div class="v">${fmt(W.interactions)}</div></div>
          <div class="kpi"><div class="l">Accounts reached · window</div><div class="v">${fmt(W.viewers)}</div></div>
          <div class="kpi"><div class="l">Net followers · window</div><div class="v">+${fmt(W.net_followers)}</div></div>
          <div class="kpi"><div class="l">Publications</div><div class="v">${C.posts.length}</div></div>
        </div>
        <div class="panel" style="margin-top:24px">
          <h2>What is observed and what is estimated</h2>
          <p><span class="tag o">O</span><b>Observed:</b> ${C.observed}</p>
          <p><span class="tag e">E</span><b>Estimated:</b> ${C.estimated}</p>
          <p><b>Scope:</b> as in Instagram, the screens cover the whole account, so the other-range publications (25 Jul Fête de la République Reel; 13, 15 and 21 Aug) appear in top content. Reels hidden from the profile grid still count, as in Instagram. The split between sun care and other ranges is given in the table opposite.</p>
          <p><b>Reading the screens:</b> the date selector reads as in Instagram: “30 days” for July (the last 30 days on 1 August: 2–31 July) and “Custom” for August and the window; each range is also stated under every screen and on the chart axis. Content lists show post age as on the day after the period (1w, 3d…). Reposts are not in the data and show 0. July screens end on 31 July, so the 15 Aug Reel only appears from August on. Bars are drawn as Instagram draws them: views and interactions as a share of the total, audience bars as a percentage of 100%.</p>
        </div>
      </div>
      <div class="panel">
        <h2>Reconciliation by period</h2>
        <table class="t tight">
          <tr><th>Metric</th><th>July (30 days)</th><th>of which 2–4 Jul*</th><th>August</th><th>1 Sep*</th><th>Window</th></tr>
          ${r("Views", (p) => p.views, "tot")}
          ${r("Reels", vt("reels"), "sub")}${r("Posts", vt("posts"), "sub")}${r("Stories", vt("stories"), "sub")}
          ${r("Interactions", (p) => p.interactions, "tot")}
          ${r("Likes", idt("likes"), "sub")}${r("Comments", idt("comments"), "sub")}${r("Shares", idt("shares"), "sub")}${r("Saves", idt("saves"), "sub")}${r("Story replies", idt("story_replies"), "sub")}
          ${r("Profile visits", (p) => p.profile.visits, "tot")}
          ${r("Bio link taps", (p) => p.profile.bio_taps, "sub")}${r("Business address taps", (p) => p.profile.address_taps, "sub")}
          ${signed("Net followers", (p) => p.net_followers, "tot")}
          ${r("Follows", (p) => p.follows, "sub")}${r("Unfollows", (p) => p.unfollows, "sub")}
          <tr class="tot"><td>Accounts reached</td><td>${fmt(J.viewers)}</td><td>–</td><td>${fmt(G.viewers)}</td><td>–</td><td>${fmt(W.viewers)}</td></tr>
          <tr class="tot"><td>Followers at end</td><td>${fmt(J.followers_end)}</td><td>${fmt(R.followers_end)}</td><td>${fmt(G.followers_end)}</td><td>${fmt(W.followers_end)}</td><td>${fmt(W.followers_end)}</td></tr>
          <tr class="tot"><td>Best day</td><td>${J.best_day}</td><td></td><td>${G.best_day}</td><td></td><td>${W.best_day}</td></tr>
        </table>
        <p class="fine">* July is Instagram's “30 days” (2–31 Jul); 2–4 Jul are before the launch (rule 9). Window = July − 2–4 Jul + August + 1 Sep. Accounts reached is not additive (rule 4), so it has no value for the partial columns. Followers: ${fmt(C.followers_start.value)} on 4 July.</p>
        <h3>Sun care vs other ranges</h3>
        <table class="t">
          <tr><th></th><th colspan="3" style="text-align:center">July</th><th colspan="3" style="text-align:center">August</th><th colspan="3" style="text-align:center">Window</th></tr>
          <tr class="sub"><td></td>${"<td>Sun</td><td>Other</td><td>Account</td>".repeat(3)}</tr>
          ${splitRow("Views", "views")}${splitRow("Interactions", "interactions")}${splitRow("Accounts reached", "reached")}${splitRow("Profile visits", "visits")}
        </table>
        <p class="fine"><b>Views per day vs per post:</b> the line chart shows views per day; each publication's views are spread over its first 30 days, 40% on day 1. The 5 July creator Reel (${fmt(POSTS.R1.views)} lifetime) adds ${fmt(DATA.cumulative.R1[0])} on 5 July; the July peak is ${peakLabel("jul")}. Top content and content lists show lifetime views.</p>
        <p class="fine">Campaign check: ${C.posts.filter((x) => x.range === "sun").length} sun care and ${C.posts.filter((x) => x.range === "other").length} other-range publications, ${C.posts.filter((x) => !x.grid).length} of them only in the Reels tab; all sums on this page and on the screens are re-computed by <code>scripts/model.py</code>.</p>
      </div>
    </div>`);
    return page("Nihel Sun · Instagram Insights mockup", "July & August 2026", body);
  }

  // ---------- method ----------
  function method() {
    const rules = C.rules.map(([h, t], i) => `<li><b>${i + 1}. ${h}.</b> ${t}</li>`).join("");
    const weeks = C.weekly_followers.map(([w, lc, g, d, f], i) =>
      `<tr class="${i >= 5 && i <= 7 ? "hl" : ""}"><td>${w}</td><td>${fmt(lc)}</td><td>+${g}</td><td>${d}</td><td>${fmt(f)}</td></tr>`).join("");
    const pubs = [...C.posts].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)).map((x) => {
      const [, m, d] = x.date.split("-");
      return `<tr class="${x.range === "other" || !x.grid || x.id === "S07" ? "hl" : ""}"><td class="th-cell"><img src="${thumb(x.id)}" alt=""></td><td class="l">${x.id}</td><td class="l">${d}/${m}</td><td class="l">${x.format}</td><td>${fmt(x.views)}</td><td>${fmt(x.reach)}</td><td>${fmt(x.likes)}</td><td>${x.comments}</td><td>${x.shares}</td><td>${x.saves}</td><td>${x.visits}</td><td>${x.er}</td></tr>`;
    }).join("");
    const body = el(`<div class="sheet" style="grid-template-columns: 1fr 1.25fr; padding-top:22px; padding-bottom:22px">
      <div class="panel">
        <h2>Rules (applied identically to every period)</h2>
        <ol class="rules">${rules}</ol>
        <h3>Follower model, week by week</h3>
        <table class="t compact"><tr><th>Week</th><th>Likes + comm.</th><th>Gain</th><th>/day</th><th>Followers</th></tr>${weeks}</table>
        <p class="fine">The 15 Aug Reel's likes spread over 9–22 Aug and the 21 Aug post over 16–29 Aug (highlighted). Charts plot these daily values; top gridline = highest day, as in Instagram.</p>
      </div>
      <div class="panel" style="padding-bottom:14px">
        <h2>Publications (lifetime) · ${C.posts.filter((x) => x.range === "sun").length} sun care + ${C.posts.filter((x) => x.range === "other").length} other ranges</h2>
        <table class="t pubs" style="font-size:11px"><tr><th></th><th style="text-align:left">ID</th><th style="text-align:left">Date</th><th style="text-align:left">Format</th><th>Views</th><th>Reach</th><th>Likes</th><th>Com.</th><th>Shares</th><th>Saves</th><th>Visits</th><th>ER</th></tr>${pubs}</table>
        <p class="fine">R1–R3 = Reels only in the Reels tab (views, likes, comments observed; rest by rule 8). O1 = Fête de la femme, O2 = black-and-white Reel,
        O3 = body mist (11 comments from the campaign total). S07 = corrected 20 July views. ER = (likes + comments + shares + saves) ÷ reach.</p>
      </div>
    </div>`);
    return page("Method and checks", "how every number is produced", body);
  }

  cover();
  ["jul", "aug", "win"].forEach((k) => { shotsPage(k, "overview"); shotsPage(k, "audience"); });
  method();
  document.body.dataset.ready = "1";
})();
