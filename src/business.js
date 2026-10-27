/* Meta Business Suite (desktop) Insights screens, built for the Instagram account
   (business.html, window.DATA from scripts/model.py) or the Facebook Page
   (facebook.html sets window.PLATFORM = "facebook", window.FACEBOOK from
   scripts/facebook_model.py). Period: the launch window. */
(function () {
  const C = DATA.campaign, DAILY = DATA.daily, F = DATA.formats;
  const W = C.periods.win, A = C.audience;
  // daily series start on 2 July (Instagram's 30 days for July); these screens show the window only
  const WI = DAILY.days.indexOf(W.start);
  const isFB = window.PLATFORM === "facebook", FBD = window.FACEBOOK;
  const PLAT = isFB ? "Facebook" : "Instagram", ACCOUNT = isFB ? FBD.page_name : "laboratoires_nihel";
  const DW = isFB ? FBD.daily : { days: DAILY.days.slice(WI), views: DAILY.views.slice(WI), follows: DAILY.follows.slice(WI) };
  const T = isFB ? FBD.window : W; // period totals of the selected platform
  const POSTS = isFB ? FBD.items : C.posts, CUM = isFB ? FBD.cumulative : DATA.cumulative;
  POSTS.forEach((p) => { if (!p.title) p.title = isFB ? FBD.page_name : "@laboratoires_nihel"; });
  const POST = Object.fromEntries(POSTS.map((p) => [p.id, p]));
  const TOP_SUN = [...POSTS].filter((p) => p.range === "sun").sort((a, b) => b.views - a.views)[0];
  const FOOT = "@laboratoires_nihel · reconstruction for an MSc thesis (A. Belhassen, 2026) · not a screenshot of Meta Business Suite";
  const BADGE = "Illustrative mockup — simulated data — not an official Meta export";

  // ---------- formatting ----------
  const fmt = (n) => n.toLocaleString("en-US");
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dParts = (iso) => iso.split("-").map(Number);
  const md = (iso) => { const [, m, d] = dParts(iso); return `${MON[m - 1]} ${d}`; };
  const dow = (iso) => DOW[new Date(iso + "T12:00:00Z").getUTCDay()];
  const RANGE = `${md(W.start)}, 2026 - ${md(W.end)}, 2026`;
  // Business Suite compact numbers: 269.1K, 655K, 1.1K, 847 (post pages keep ".0": 981.0K)
  function compact(n, keepZero) {
    if (n < 1000) return String(n);
    const [div, unit] = n >= 1e6 ? [1e6, "M"] : [1e3, "K"];
    let s = (n / div).toFixed(1);
    if (!keepZero) s = s.replace(/\.0$/, "");
    return s + unit;
  }
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const thumb = (id) => `../assets/thumbs/${(POST[id] && POST[id].thumb) || id}.jpg`;

  // ---------- icons ----------
  const S = (size, body, sw = 1.8) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const P = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7V20.5h-6v-6h-5v6h-6z"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    adsmgr: '<circle cx="12" cy="12" r="9"/><path d="M8.8 16.5 12 7.5l3.2 9M10 13.6h4"/>',
    inbox: '<path d="M20.5 12a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.1-4.2A8.5 8.5 0 1 1 20.5 12Z"/>',
    leads: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14.5 10h3.5M14.5 13.5h3.5"/>',
    content: '<rect x="4" y="6.5" width="13" height="13" rx="2"/><path d="M8 3.5h10a2 2 0 0 1 2 2v10"/><path d="M7 11h7M7 14.5h5"/>',
    creator: '<path d="M3 13.5c2 0 3-1 4.5-2.5S10.5 8 12.5 8c1.5 0 2.5 1 2.5 2s-1 1.8-2.3 1.8H11"/><path d="M3 18h7l6.5-4.5c.9-.6 2.2-.4 2.7.5.5.8.2 1.8-.6 2.4L12.5 21H3"/>',
    planner: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v3M16 3v3M9.5 9.5v11M15 9.5v11M3.5 15h17"/>',
    ads: '<path d="M3.5 10v4.5h3l8 4.5V5.5l-8 4.5z"/><path d="M18 9.5a3.5 3.5 0 0 1 0 5.5"/>',
    insights: '<path d="M5 20V12M10 20V5M15 20v-6M20 20V9" stroke-width="3.2"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-.9-1.5-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2.1 0 2.9 5.8 1.4 5.8 4.3 0 1.3-1.2 2.1-2.9 2.1-1.4 0-2.5-.6-3-1.5M12 6v1.8M12 16.3V18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/><circle cx="12" cy="12" r="6.6"/>',
    help: '<path d="M9.2 9.2A2.9 2.9 0 0 1 12 7c1.7 0 3 1.1 3 2.6 0 2.3-3 2.4-3 4.6"/><circle cx="12" cy="17.4" r=".5" fill="currentColor"/>',
    overview: '<path d="M4 4l6 6M20 4l-6 6M4 20l6-6M20 20l-6-6"/><circle cx="12" cy="12" r="2.2"/>',
    plan: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".8" fill="currentColor"/><circle cx="4.5" cy="12" r=".8" fill="currentColor"/><circle cx="4.5" cy="18" r=".8" fill="currentColor"/>',
    results: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="m7 15 3.5-3.5 2.5 2.5 4-5"/>',
    audience: '<circle cx="9" cy="9" r="3"/><path d="M3.5 19c.8-3 2.9-4.6 5.5-4.6s4.7 1.6 5.5 4.6"/><circle cx="16.5" cy="8" r="2.4"/><path d="M15.5 13.2c2.6-.3 4.4 1.2 5 4.3"/>',
    messaging: '<path d="M17.5 10.5a6.5 6.5 0 0 1-9.6 5.6L4.5 17l.9-3.1a6.5 6.5 0 1 1 12.1-3.4Z"/><path d="M19.6 13.5A5 5 0 0 1 18.6 19l.8 2.3-2.6-.8a5 5 0 0 1-5.8-.5"/>',
    bench: '<path d="M4 6h16M4 11h7M4 16h5"/><circle cx="16" cy="15" r="3.2"/><path d="m18.4 17.4 2.6 2.6"/>',
    cardi: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M7 13h5M7 16h8"/>',
    grid: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 9h17M3.5 14.5h17M9 3.5v17M14.5 3.5v17"/>',
    rocket: '<path d="M13.5 17.5 9.5 21v-4.5L6 13l-3.5-1 3.5-3.5h4.5C13 5 16.5 3 21 3c0 4.5-2 8-5.5 10.5V18z"/><circle cx="15" cy="9" r="1.6"/>',
    collapse: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15M6 9h1.5M6 12h1.5"/>',
    caret: '<path d="m6 9.5 6 6 6-6" fill="currentColor" stroke-width="1"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M7 13.5h2M11 13.5h2M15 13.5h2M7 17h2M11 17h2"/>',
    info: '<circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none"/><path d="M12 11v5.5" stroke="#fff" stroke-width="2.4"/><circle cx="12" cy="7.6" r="1.3" fill="#fff" stroke="none"/>',
    export: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15"/>',
    eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
    heart: '<path d="M12 20.5s-8-4.9-9.6-9.9C1.3 7.2 3.5 4 6.8 4c2.1 0 3.7 1.2 5.2 3.1C13.5 5.2 15.1 4 17.2 4c3.3 0 5.5 3.2 4.4 6.6-1.6 5-9.6 9.9-9.6 9.9Z" fill="currentColor"/>',
    comment: '<path d="M20.5 12a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.1-4.2A8.5 8.5 0 1 1 20.5 12Z" fill="currentColor"/>',
    share: '<path d="M13.5 5v4C6.5 9.5 4 14 3.5 19.5 6 16 9 14.5 13.5 14.5v4.5l7-7z" fill="currentColor"/>',
    chevR: '<path d="m9 5 7 7-7 7" stroke-width="2.4"/>',
    back: '<path d="M19 12H5M11 5l-7 7 7 7" stroke-width="2.2"/>',
    dots: '<circle cx="5.5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor"/>',
    reel: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 8.5h18M9 3l3 5.5M15 3l3 5.5"/><path d="M10 12v5.5l4.8-2.75z" fill="currentColor" stroke-width="1"/>',
    photo: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m4.5 18 5-5 3.5 3.5 2.5-2.5 4 4"/>',
    carousel: '<rect x="3" y="6.5" width="14.5" height="14.5" rx="2.5"/><path d="M7 3h11.5A2.5 2.5 0 0 1 21 5.5V17"/>',
    columns: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M9.2 4.5v15M14.8 4.5v15"/>',
    likeO: '<path d="M12 20.5s-8-4.9-9.6-9.9C1.3 7.2 3.5 4 6.8 4c2.1 0 3.7 1.2 5.2 3.1C13.5 5.2 15.1 4 17.2 4c3.3 0 5.5 3.2 4.4 6.6-1.6 5-9.6 9.9-9.6 9.9Z"/>',
    commentO: '<path d="M20.5 12a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.1-4.2A8.5 8.5 0 1 1 20.5 12Z"/>',
    send: '<path d="M21.5 3 10 13.2"/><path d="M21.5 3 15 21l-5-7.8L2.5 9.4 21.5 3Z"/>',
    save: '<path d="M18.5 21 12 15.5 5.5 21V3.5h13V21Z"/>',
  };
  const ic = (name, size = 18, sw) => S(size, P[name], sw);
  const IG = (size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="var(--bs-ig)" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="5.2"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="var(--bs-ig)" stroke="none"/></svg>`;
  const FBI = (size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0866ff"/><path d="M13.5 23v-8h2.6l.4-3.1h-3V9.9c0-.9.3-1.5 1.6-1.5h1.6V5.6a21 21 0 0 0-2.3-.1c-2.3 0-3.9 1.4-3.9 4v2.4H8V15h2.5v8" fill="#fff"/></svg>`;
  const PI = isFB ? FBI : IG;
  const infoI = `<span class="info" style="color:#1c2b33">${S(14, P.info)}</span>`;
  const caret = S(14, P.caret, 1);
  const TELESCOPE = `<svg width="190" height="140" viewBox="0 0 190 140">
    <defs><linearGradient id="tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8fc"/><stop offset=".55" stop-color="#c9d9ea"/><stop offset="1" stop-color="#93aecb"/></linearGradient></defs>
    <path d="M95 70 64 136M95 70l31 66M95 70v58" stroke="#1d6fe0" stroke-width="5" stroke-linecap="round"/>
    <g transform="rotate(-24 95 60)"><rect x="28" y="46" width="118" height="28" rx="14" fill="url(#tb)" stroke="#9fb6cf"/>
    <rect x="138" y="40" width="26" height="40" rx="10" fill="url(#tb)" stroke="#9fb6cf"/><rect x="16" y="52" width="16" height="16" rx="6" fill="#dbe6f1" stroke="#9fb6cf"/></g>
    <circle cx="95" cy="70" r="7" fill="#1d6fe0"/></svg>`;

  // ---------- chart (line, Business Suite style) ----------
  function niceStep(max) {
    const target = max / 3, mag = Math.pow(10, Math.floor(Math.log10(target)));
    return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= target);
  }
  function lineChart(values, dates, { w, h, color, label }) {
    const step = Math.max(1, niceStep(Math.max(...values))), top = Math.ceil(Math.max(...values) / step) * step;
    const x0 = 44, x1 = w - 8, y0 = 8, y1 = h - 26;
    const x = (i) => x0 + (x1 - x0) * i / (values.length - 1), y = (v) => y1 - (v / top) * (y1 - y0);
    let g = "";
    for (let v = 0; v <= top + 1e-9; v += step) {
      g += `<line x1="${x0}" x2="${x1}" y1="${y(v)}" y2="${y(v)}" stroke="#e4e6eb"/><text x="${x0 - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#65676b">${compact(v)}</text>`;
    }
    for (let i = 0; i < dates.length; i += 14) g += `<text x="${x(i)}" y="${h - 8}" text-anchor="middle" font-size="11" fill="#65676b">${md(dates[i])}</text>`;
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${g}<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/></svg>
      <div class="legend-bs"><span><i style="background:${color}"></i>${label}</span></div>`;
  }

  // ---------- chrome ----------
  const NAV = [["home", "Home"], ["bell", "Notifications"], ["adsmgr", "Ads Manager"], ["inbox", "Inbox"], ["leads", "Leads Center"], ["content", "Content"],
    ["creator", "Creator Marketing"], ["planner", "Planner"], ["ads", "Ads"], ["insights", "Insights"], ["money", "Monetization"], ["menu", "All tools"]];
  const SUB = [["overview", "Overview"], ["plan", "Plan"], ["results", "Results"], ["audience", "Audience"], ["leads", "Leads"], ["messaging", "Messaging"], ["bench", "Benchmarking"],
    ["grp", "Content"], ["cardi", "Overview", "c-overview"], ["grid", "Content", "c-content"], ["rocket", "Ads", "c-ads"], ["grp", "Earnings"], ["money", "Earnings", "earnings"]];

  function screen(active, mainHtml, scroll, platform = true, dateLabel = RANGE) {
    const nav = NAV.map(([i, t]) => `<div class="bs-item ${t === "Insights" ? "on" : ""}">${ic(i)}${t}</div>`).join("");
    const sub = SUB.map(([i, t, id]) => i === "grp" ? `<div class="grp">${t}</div>`
      : `<div class="bs-item ${(id || t.toLowerCase()) === active ? "on" : ""}">${ic(i)}${t}</div>`).join("");
    const node = el(`<div class="bs">
      <div class="sim">Illustrative mockup · simulated data</div>
      <aside class="bs-nav">
        <div class="bs-brand">Meta<br>Business Suite</div>
        <div class="bs-acct"><span class="av">N</span><span class="nm">Laboratoires Nihel</span>${caret}</div>
        ${nav}<hr><div class="bs-item">Edit</div><div class="sp"></div>
        <div class="bs-item">${ic("search")}Search</div><div class="bs-item">${ic("gear")}Settings</div><div class="bs-item help">${ic("help")}Help</div>
      </aside>
      <header class="bs-head"><div><h1>Insights</h1><p>Review performance results and more.</p></div>
        <div class="bs-ctrls">${platform ? `<span class="bs-sel">${PI(16)}${PLAT}${caret}</span>` : ""}
          <span class="bs-sel">${ic("cal", 16)}${dateLabel}${caret}</span>
          <span class="bs-avatar">N<i>${PI(11)}</i></span></div></header>
      <nav class="bs-sub">${sub}</nav>
      <main class="bs-main"><div class="bs-scroll">${mainHtml}</div></main>
    </div>`);
    node.dataset.anchor = scroll ? scroll[0] : "";
    node.dataset.at = scroll ? scroll[1] : 0;
    return node;
  }

  // ---------- Content > Overview ----------
  function contentOverview() {
    const vals = DW.views, dates = DW.days;
    const top = [...POSTS].sort((a, b) => b.views - a.views).slice(0, 5);
    const typeIcon = (p) => p.format === "Reel" ? "reel" : p.format === "Carousel" ? "carousel" : "photo";
    const cards = top.map((p) => `<div class="pc"><div class="im" style="background-image:url('${thumb(p.id)}')">${PI(16)}</div>
      <div class="tx"><div class="cap">${esc(p.title)}</div><div class="dt">${dow(p.date)} ${md(p.date)}</div>
      <div class="mx"><span>${ic("eye", 13)}${compact(p.views)}</span><span>${ic("heart", 13)}${compact(p.likes)}</span>
      <span>${ic("comment", 13)}${fmt(p.comments)}</span><span>${ic("share", 13)}${fmt(p.shares)}</span></div></div></div>`).join("");
    const bars = (rows) => {
      const max = Math.max(...rows.map((r) => r[1]));
      return rows.map(([n, v]) => `<div class="hbar"><div class="nm">${n}</div><div class="ln"><div class="b" style="width:${(v / max * 170).toFixed(1)}px"></div><span class="v">${fmt(v)}</span></div></div>`).join("");
    };
    const FF = isFB ? FBD.formats : null;
    const byViews = isFB ? [["Reels", FF.Reel.views], ["Photo", FF.Photo.views]]
      : [["Reels", F.Reel.views], ["Stories", F.Stories.views], ["Photo", F.Post.views], ["Multi photo", F.Carousel.views]];
    const byInt = isFB ? [["Reels", FF.Reel.interactions], ["Photo", FF.Photo.interactions]]
      : [["Reels", F.Reel.interactions], ["Photo", F.Post.interactions], ["Stories", F.Stories.interactions], ["Multi photo", F.Carousel.interactions]];
    const published = isFB ? [["Reels", FF.Reel.published], ["Photos", FF.Photo.published]]
      : [["Reels", F.Reel.published], ["Photos", F.Post.published], ["Multi photo", F.Carousel.published]];
    const tiles = isFB
      ? `<div class="tile-bs on"><div class="l">Views ${infoI}</div><div class="v">${compact(T.views)}</div></div>
          <div class="tile-bs"><div class="l">Content interactions ${infoI}</div><div class="v">${compact(T.interactions)}</div></div>`
      : `<div class="tile-bs on"><div class="l">Views ${infoI}</div><div class="v">${compact(W.views)}</div></div>
          <div class="tile-bs"><div class="l">Reach ${infoI}</div><div class="v">${compact(W.viewers)}</div></div>
          <div class="tile-bs"><div class="l">Content interactions ${infoI}</div><div class="v">${compact(W.interactions)}</div></div>`;
    const breakdown = isFB
      ? `<div class="k">Total</div><div class="n">${fmt(T.views)}</div>
            <div class="k">From Reels</div><div class="n">${fmt(T.views_by_type.reels)}</div>
            <div class="k">From photos</div><div class="n">${fmt(T.views_by_type.photos)}</div><hr>
            <div class="k">Viewers ${infoI}</div><div class="n">${fmt(T.viewers)}</div>`
      : `<div class="k">Total</div><div class="n">${fmt(W.views)}</div>
            <div class="k">From Reels</div><div class="n">${fmt(W.views_by_type.reels)}</div>
            <div class="k">From posts</div><div class="n">${fmt(W.views_by_type.posts)}</div>
            <div class="k">From stories</div><div class="n">${fmt(W.views_by_type.stories)}</div><hr>
            <div class="k">Viewers ${infoI}</div><div class="n">${fmt(W.viewers)}</div>`;
    return `
      <div class="bcard">
        <div class="bcard-h"><h2>${PI(17)}Content overview</h2><span class="btn">Breakdown: Content type ${caret}</span></div>
        <div class="tabs-bs"><span class="on">All</span><span>Posts</span><span>Stories</span><span>Reels</span><span>Live</span></div>
        <div class="tiles-bs">${tiles}</div>
        <div class="ov-grid">
          <div>${lineChart(vals, dates, { w: 600, h: 250, color: "var(--bs-line-dark)", label: "Views" })}</div>
          <div class="bd"><h4>Views breakdown</h4><div class="s">${md(W.start)} - ${md(W.end)}</div>
            ${breakdown}</div>
        </div>
      </div>
      <div class="bcard" id="co-top">
        <div class="sec-h" style="margin-top:0"><h2>${PI(17)}Top content by views</h2><div class="btns"><span class="btn">Boost content</span><span class="btn">See all content</span></div></div>
        <div class="posts">${cards}<span class="next">${ic("chevR", 18)}</span></div>
      </div>
      <div class="bcard" id="co-formats">
        <div class="bcard-h"><h2>${PI(17)}Top content formats</h2><span class="btn">${ic("export", 15)}Export ${caret}</span></div>
        <div class="fmt-grid">
          <div class="fmt"><h4>Published content ${infoI}</h4><div class="s">Based on up to 200 pieces of content</div>${bars(published)}</div>
          <div class="fmt"><h4>Views ${infoI}</h4>${bars(byViews)}</div>
          <div class="fmt"><h4>Content interactions ${infoI}</h4>${bars(byInt)}</div>
        </div>
      </div>`;
  }

  // ---------- Results ----------
  function results() {
    const exp = `<span class="btn">${ic("export", 15)}Export ${caret}</span>`;
    const card = (title, value, body, id = "") => `<div class="bcard res" ${id ? `id="${id}"` : ""}><div class="bcard-h"><h3>${title} ${infoI}</h3>${exp}</div><div class="big">${value}</div><div class="ph">${body}</div></div>`;
    return `
      <div class="bcard banner"><svg width="56" height="44" viewBox="0 0 56 44"><circle cx="22" cy="22" r="21" fill="#cfe4fb"/><path d="M14 30 30 12l10 10-14 14z" fill="#1d6fe0"/><path d="M30 12l6-6 4 4-6 6z" fill="#7fb3f2"/></svg>
        <p>Set a goal, track progress and learn helpful tips for your professional success.</p><span class="btn primary">Start new goal</span></div>
      <div class="res-grid">${isFB ? fbCards() : `
        ${card("Views", compact(W.views), `<div>${lineChart(DW.views, DW.days, { w: 390, h: 175, color: "var(--bs-line-light)", label: "Views" })}</div>`)}
        ${card("Reach", compact(W.viewers), TELESCOPE)}
        ${card("Content interactions", compact(W.interactions), TELESCOPE, "res-row2")}
        ${card("Link clicks", fmt(W.profile.bio_taps), TELESCOPE)}
        ${card("Visits", fmt(W.profile.visits), TELESCOPE)}
        ${card("Follows", compact(W.follows), `<div>${lineChart(DW.follows, DW.days, { w: 390, h: 175, color: "var(--bs-line-light)", label: "Instagram follows" })}</div>`)}`}
      </div>`;
    function fbCards() {
      const ch = (vals, label) => `<div>${lineChart(vals, DW.days, { w: 390, h: 175, color: "var(--bs-line-light)", label })}</div>`;
      return `${card("Views", compact(T.views), ch(DW.views, "Views"))}
        ${card("Viewers", compact(T.viewers), ch(DW.viewers, "Viewers"))}
        ${card("Content interactions", compact(T.interactions), ch(DW.interactions, "Content interactions"), "res-row2")}
        ${card("Link clicks", fmt(T.link_clicks), ch(DW.link_clicks, "Facebook link clicks"))}
        ${card("Visits", fmt(T.visits), ch(DW.visits, "Facebook visits"))}
        ${card("Follows", fmt(T.follows), TELESCOPE)}`;
    }
  }

  // ---------- Content > Content (table) ----------
  function allContent() {
    const rows = [...POSTS].sort((a, b) => b.views - a.views).slice(0, 12).map((p) => {
      const kind = p.format === "Reel" ? ["reel", "Reel"] : p.format === "Carousel" ? ["carousel", "Carousel"] : ["photo", "Photo"];
      const inter = p.likes + p.comments + p.shares + p.saves;
      return `<tr><td><div class="trow"><div class="th" style="background-image:url('${thumb(p.id)}')">${PI(14)}</div>
          <div class="tt"><b>${esc(p.title)}</b><small>${ic(kind[0], 13)}${kind[1]} • ${ACCOUNT}</small></div>
          <span class="split"><span class="btn">Boost</span><span class="btn">${caret}</span></span><span class="btn" style="padding:0 8px">${ic("dots", 16)}</span></div></td>
        <td>${dow(p.date)} ${md(p.date)}</td><td class="r">${fmt(p.views)}</td><td class="r">${fmt(inter)}</td><td class="r">${fmt(p.reach)}</td></tr>`;
    }).join("");
    const sortI = `<span style="color:var(--bs-btn)">↓</span>`;
    return `<div class="bcard">
      <div class="bcard-h"><h2>All content</h2><span class="split"><span class="btn primary">Create post</span><span class="btn primary">${caret}</span></span></div>
      <div class="tbl-tools"><span class="btn">Posts and stories ${caret}</span><span class="btn">Media type ${caret}</span><span class="btn">Filter: 1 selected ${caret}</span>
        <span class="clear">Clear</span><span class="btn search">${ic("search", 15)}Search by ID or caption</span><span style="flex:1"></span><span class="btn">${ic("columns", 15)}Columns</span></div>
      <table class="bt"><tr><th>Title</th><th>Date published</th><th class="r">Views ${sortI}</th><th class="r">Interactions</th><th class="r">Reach</th></tr>${rows}</table>
    </div>`;
  }

  // ---------- post detail ----------
  function postDetail(id) {
    const p = POST[id], cum = DATA.cumulative[id];
    const inter = p.likes + p.comments + p.shares + p.saves;
    const days = cum.map((_, i) => i + 1);
    const w = 500, h = 220, x0 = 46, x1 = w - 10, y0 = 8, y1 = h - 26;
    const step = niceStep(p.views), top = Math.ceil(p.views / step) * step;
    const x = (i) => x0 + (x1 - x0) * i / (cum.length - 1), y = (v) => y1 - v / top * (y1 - y0);
    let g = "";
    for (let v = 0; v <= top; v += step) g += `<line x1="${x0}" x2="${x1}" y1="${y(v)}" y2="${y(v)}" stroke="#e4e6eb"/><text x="${x0 - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#65676b">${compact(v)}</text>`;
    [0, 6, 13, 20, 29].forEach((i) => { g += `<text x="${x(i)}" y="${h - 8}" text-anchor="middle" font-size="11" fill="#65676b">${days[i]}d</text>`; });
    const chart = `<svg width="${w}" height="${h}">${g}<polyline points="${cum.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" fill="none" stroke="var(--bs-line-light)" stroke-width="2"/></svg>
      <div class="legend-bs"><span><i style="background:var(--bs-line-light)"></i>This post's views</span></div>`;
    return `
      <div class="bcard pd-head">${ic("back", 18)}<div class="th" style="background-image:url('${thumb(id)}')"></div>
        <div class="t"><b>${esc(p.title)}</b><small>${PI(13)}Reel · Published on: ${dow(p.date)} ${md(p.date)} · laboratoires_nihel${p.collab ? ` in collaboration with ${esc(p.collab)}` : ""}</small></div>
        <span class="btn" style="padding:0 8px">${ic("dots", 16)}</span><span class="btn primary">Boost</span></div>
      <div class="pd-grid">
        <div>
          <div class="bcard"><h2 style="font-size:14.5px;font-weight:600">Overview</h2>
            <div class="kpis-bs"><div><div class="l">Views ${infoI}</div><div class="v">${compact(p.views, true)}</div></div>
              <div><div class="l">Reach ${infoI}</div><div class="v">${compact(p.reach, true)}</div></div>
              <div><div class="l">Interactions ${infoI}</div><div class="v">${fmt(inter)}</div></div>
              <div><div class="l">Profile visits ${infoI}</div><div class="v">${fmt(p.visits)}</div></div></div></div>
          <div class="bcard"><div class="l" style="font-size:12px;font-weight:600;display:flex;gap:5px;align-items:center">Views ${infoI}</div>
            <div style="font-size:25px;margin:4px 0 10px">${compact(p.views, true)}</div>
            <div class="tabs-bs" style="margin:0 0 10px"><span class="on">Total</span></div>${chart}</div>
          <div class="bcard"><div class="l" style="font-size:12px;font-weight:600;display:flex;gap:5px;align-items:center">Interactions ${infoI}</div>
            <div style="font-size:25px;margin-top:4px">${fmt(inter)}</div>
            <div class="kpis-bs sm"><div><div class="l">Likes ${infoI}</div><div class="v">${fmt(p.likes)}</div></div>
              <div><div class="l">Comments ${infoI}</div><div class="v">${fmt(p.comments)}</div></div>
              <div><div class="l">Shares ${infoI}</div><div class="v">${fmt(p.shares)}</div></div>
              <div><div class="l">Saves ${infoI}</div><div class="v">${fmt(p.saves)}</div></div></div></div>
        </div>
        <div class="bcard"><h2 style="font-size:14.5px;font-weight:600">Feed preview</h2>
          <div class="preview"><div class="who"><span class="av">N</span>laboratoires_nihel</div>
            <div class="img" style="background-image:url('${thumb(id)}')"></div>
            <div class="acts">${ic("likeO", 20)}${ic("commentO", 20)}${ic("send", 20)}<span class="sp"></span>${ic("save", 20)}</div>
            <div class="likes">${fmt(p.likes)} likes</div><div class="pcap"><b>laboratoires_nihel</b> ${esc(p.title)}</div></div></div>
      </div>`;
  }

  // ---------- Audience ----------
  function audience() {
    const ages = A.age.map(([a, v]) => [a, parseFloat(v)]);
    const w = 800, h = 200, x0 = 44, x1 = w - 10, y0 = 10, y1 = h - 30, top = 50;
    const y = (v) => y1 - v / top * (y1 - y0), slot = (x1 - x0) / ages.length;
    let g = "";
    for (let v = 0; v <= top; v += 10) g += `<line x1="${x0}" x2="${x1}" y1="${y(v)}" y2="${y(v)}" stroke="#e4e6eb"/><text x="${x0 - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#65676b">${v}%</text>`;
    ages.forEach(([a, v], i) => {
      const cx = x0 + slot * (i + 0.5);
      g += `<rect x="${cx - 26}" y="${y(v)}" width="52" height="${y1 - y(v)}" fill="var(--bs-bar)"/><text x="${cx}" y="${h - 10}" text-anchor="middle" font-size="12" fill="#1c2b33">${a}</text>`;
    });
    const list = (rows, suffix) => {
      const max = Math.max(...rows.map((r) => parseFloat(r[1])));
      return rows.map(([n, v]) => `<div class="hbar teal"><div class="nm">${esc(n)}${suffix}</div><div class="ln"><div class="b" style="width:${(parseFloat(v) / max * 300).toFixed(1)}px"></div><span class="v">${v}</span></div></div>`).join("");
    };
    const gender = A.gender.map(([n, v]) => `${n} ${v}`).join(" · ");
    return `<div class="bcard">
      <div class="bcard-h"><h2>Audience</h2><span class="btn">${ic("export", 15)}Export ${caret}</span></div>
      <div class="aud-tabs"><span class="on">Demographics</span><span>Trends</span><span>Potential audience</span></div>
      <div style="margin-top:14px;font-size:13px;font-weight:600;display:flex;gap:5px;align-items:center">Followers ${infoI}</div>
      <div class="note-bs" style="margin-top:2px">Lifetime</div><div class="aud-big">${fmt(isFB ? FBD.followers : W.followers_end)}</div>
      <div style="margin-top:16px;font-size:13px;font-weight:600;display:flex;gap:5px;align-items:center">Age & gender ${infoI}</div>
      <svg width="${w}" height="${h}" style="margin-top:8px">${g}</svg>
      <div class="legend-bs" style="font-size:12px;color:#1c2b33">${gender}</div>
      <div class="loc-grid"><div><h4>Top cities</h4>${list(W.cities, ", Tunisia")}</div><div><h4>Top countries</h4>${list(A.countries, "")}</div></div>
    </div>`;
  }

  // ---------- pages ----------
  function addPage(title, sub, inner) {
    const n = document.querySelectorAll(".page").length + 1;
    const pg = el(`<section class="page"><header class="page-head"><h1>${title} <span>· ${sub}</span></h1><span class="sim-badge">${BADGE}</span></header>
      <footer class="page-foot"><span>${FOOT}</span><span>Page ${n}</span></footer></section>`);
    pg.insertBefore(inner, pg.querySelector(".page-foot"));
    document.body.appendChild(pg);
    pg.querySelectorAll(".bs").forEach((s) => {
      if (!s.dataset.anchor) return;
      const t = s.querySelector("#" + s.dataset.anchor);
      s.querySelector(".bs-scroll").style.transform = `translateY(${-(t.offsetTop - Number(s.dataset.at))}px)`;
    });
  }
  // Why the chart's top is lower than the biggest post: one point = one day.
  function chartNote() {
    const v = DW.views, i = v.indexOf(Math.max(...v)), day = DW.days[i];
    const lead = POSTS.filter((x) => x.date === day).sort((a, b) => b.views - a.views)[0];
    return `<br><b>Reading the chart:</b> one point = the views of one day; the ${v.length} days add up to ${fmt(T.views)}. Busiest day ${md(day)}: ${fmt(v[i])}` +
      (lead ? `, of which ${fmt(CUM[lead.id][0])} from the first day of the ${esc(lead.label || lead.title)} (${fmt(lead.views)} views over 30 days, 40% on day 1).` : ".");
  }

  function shot(name, title, caption, scr) {
    scr.dataset.name = name;
    const wrap = el(`<div class="bs-wrap"><div class="bs-scale"></div><div class="bs-cap">${caption}</div></div>`);
    wrap.firstElementChild.appendChild(scr);
    addPage(title, `${PLAT} · ${RANGE}`, wrap);
  }

  function intro() {
    const body = el(`<div class="sheet" style="grid-template-columns:1.1fr 1fr">
      <div>
        <div class="eyebrow">Appendix · illustrative mockup · simulated data</div>
        <div class="cover-title">Meta Business Suite Insights<br>for @laboratoires_nihel (Instagram)</div>
        <p class="lede">Desktop Insights screens for the sun care launch window (${RANGE}), laid out like the reference
        Business Suite screenshots. All figures are the same simulated data as the Instagram app mockup; nothing is added.</p>
        <div class="panel" style="margin-top:24px"><h2>Screens</h2>
          <table class="t"><tr><th>Page</th><th style="text-align:left">Screen</th><th style="text-align:left">Shows</th></tr>
          <tr><td>2</td><td class="l">Content › Overview</td><td class="l">Views, reach, interactions; daily views; views by content type</td></tr>
          <tr><td>3</td><td class="l">Content › Overview (scrolled)</td><td class="l">Top content by views; top content formats</td></tr>
          <tr><td>4–5</td><td class="l">Results</td><td class="l">Views, reach, interactions, link clicks, visits, follows</td></tr>
          <tr><td>6</td><td class="l">Content › Content</td><td class="l">All content table, sorted by views</td></tr>
          <tr><td>7</td><td class="l">Post detail</td><td class="l">${esc(TOP_SUN.title)} (top sun care post)</td></tr>
          <tr><td>8</td><td class="l">Audience</td><td class="l">Followers, age, gender, cities, countries</td></tr></table></div>
      </div>
      <div class="panel">
        <h2>How the data maps to the screens</h2>
        <table class="t">
          <tr><th style="text-align:left">Business Suite metric</th><th style="text-align:left">Source value</th><th>Value</th></tr>
          <tr><td>Views</td><td class="l">Views, window (Reels + posts + stories)</td><td>${fmt(W.views)}</td></tr>
          <tr><td>Reach / Viewers</td><td class="l">Accounts reached, window</td><td>${fmt(W.viewers)}</td></tr>
          <tr><td>Content interactions</td><td class="l">Likes + comments + shares + saves + story replies</td><td>${fmt(W.interactions)}</td></tr>
          <tr><td>Link clicks</td><td class="l">Bio link taps</td><td>${fmt(W.profile.bio_taps)}</td></tr>
          <tr><td>Visits</td><td class="l">Profile visits</td><td>${fmt(W.profile.visits)}</td></tr>
          <tr><td>Follows</td><td class="l">Gross follows (net + unfollows)</td><td>${fmt(W.follows)}</td></tr>
          <tr><td>Followers (lifetime)</td><td class="l">Followers on 1 Sep</td><td>${fmt(W.followers_end)}</td></tr>
        </table>
        <h3>Left out because the data does not exist</h3>
        <p>Comparison with the previous period (the green “↑ %” badges), organic vs ads split, watch time, 3-second views,
        number of stories published, and the age × gender cross-split. The views breakdown therefore uses content type instead of organic/ads,
        the age chart shows age only, and charts without daily data show the empty-state illustration, as Business Suite does. Facebook is covered by its own mockup.</p>
        <h3>Derived series</h3>
        <p>Daily views and follows, views and interactions by format, and the post's cumulative views come from the same deterministic
        model as the app mockup (rules 1 and 5). <code>scripts/model.py</code> checks that they add up exactly to the source totals.</p>
      </div>
    </div>`);
    addPage("Meta Business Suite · Insights mockup", "Instagram · launch window", body);
  }

  function facebookPages() {
    const obs = FBD.items.filter((i) => i.views_observed), est = FBD.items.filter((i) => !i.views_observed);
    const rules = FBD.rules.map(([h, t]) => `<li><b>${h}.</b> ${t}</li>`).join("");
    const body = el(`<div class="sheet" style="grid-template-columns:1.05fr 1fr">
      <div>
        <div class="eyebrow">Appendix · illustrative mockup · simulated data</div>
        <div class="cover-title">Meta Business Suite Insights<br>for the Laboratoires Nihel Facebook Page</div>
        <p class="lede">Desktop Insights screens for the sun care launch window (${RANGE}) with Facebook selected, laid out like the reference
        Business Suite screenshots. The ${FBD.items.length} Facebook publications (${obs.length} Reels, ${est.length} photo posts) are each matched to their Instagram twin by image.</p>
        <div class="kpis">
          <div class="kpi"><div class="l">Followers (unchanged)</div><div class="v">${fmt(FBD.followers)}</div></div>
          <div class="kpi"><div class="l">Views · window</div><div class="v">${fmt(T.views)}</div></div>
          <div class="kpi"><div class="l">Content interactions</div><div class="v">${fmt(T.interactions)}</div></div>
          <div class="kpi"><div class="l">Viewers · window</div><div class="v">${fmt(T.viewers)}</div></div>
        </div>
        <div class="panel" style="margin-top:20px"><h2>What is observed and what is estimated</h2>
          <p><span class="tag o">O</span><b>Observed:</b> ${esc(FBD.observed)} ${esc(FBD.followers_note)}</p>
          <p><span class="tag e">E</span><b>Estimated:</b> views of the ${est.length} photo posts, viewers, visits, link clicks, the day-by-day split and all audience data.</p>
          <p><b>Not on Facebook:</b> the 15 Aug black-and-white Reel and the two collab Reels (5 and 20 July) have no Facebook twin. No stories, watch time or 3-second views are available, so those tiles are left out.</p></div>
      </div>
      <div class="panel"><h2>Rules</h2><ol class="rules">${rules}</ol>
        <p class="fine">Photo views ratio: median of ${FBD.ratio_pairs} Reels = ${(FBD.ratio * 100).toFixed(1)}% of Instagram views. Lifetime interactions of the ${FBD.items.length} items:
        ${fmt(FBD.items.reduce((a, i) => a + i.interactions, 0))}; ${fmt(T.interactions)} of them fall inside the window (rule 1). All sums are checked by <code>scripts/facebook_model.py</code>.</p></div>
    </div>`);
    addPage("Meta Business Suite · Facebook Insights mockup", "Laboratoires Nihel · launch window", body);
    shot("fb-content-overview", "Content overview", "<b>2</b> · Content › Overview · top of page" + chartNote(), screen("c-overview", contentOverview()));
    shot("fb-content-overview-2", "Content overview", "<b>3</b> · Content › Overview · scrolled to top content and formats", screen("c-overview", contentOverview(), ["co-top", 0]));
    shot("fb-results", "Results", "<b>4</b> · Results · top of page" + chartNote(), screen("results", results()));
    shot("fb-results-2", "Results", "<b>5</b> · Results · scrolled · Follows = 0: the Page stayed at 105K", screen("results", results(), ["res-row2", 0]));
    shot("fb-all-content", "Content", `<b>6</b> · Content › Content · 12 of ${FBD.items.length} publications, sorted by views (photo views estimated)`, screen("c-content", allContent()));
    shot("fb-audience", "Audience", "<b>7</b> · Audience · 105K followers (observed); demographics reuse the Instagram estimates, no Facebook audience data", screen("audience", audience(), null, true, "Lifetime"));
    document.body.dataset.ready = "1";
  }

  if (isFB) { facebookPages(); return; }
  intro();
  shot("bs-content-overview", "Content overview", "<b>2</b> · Content › Overview · top of page" + chartNote(), screen("c-overview", contentOverview()));
  shot("bs-content-overview-2", "Content overview", "<b>3</b> · Content › Overview · scrolled to top content and formats", screen("c-overview", contentOverview(), ["co-top", 0]));
  shot("bs-results", "Results", "<b>4</b> · Results · top of page" + chartNote(), screen("results", results()));
  shot("bs-results-2", "Results", "<b>5</b> · Results · scrolled", screen("results", results(), ["res-row2", 0]));
  shot("bs-all-content", "Content", `<b>6</b> · Content › Content · 12 of ${C.posts.length} publications, sorted by views`, screen("c-content", allContent()));
  shot("bs-post-detail", "Post detail", `<b>7</b> · Post detail · ${esc(TOP_SUN.title)} · views over its first 30 days`, screen("c-content", postDetail(TOP_SUN.id)));
  shot("bs-audience", "Audience", "<b>8</b> · Audience · demographics of followers on 1 Sep 2026 (estimated)", screen("audience", audience(), null, true, "Lifetime"));
  document.body.dataset.ready = "1";
})();
