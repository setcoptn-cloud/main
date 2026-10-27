/* Monthly recap cards (July, August, launch window) built from window.DATA.
   Same source as the Insights mockup: data/campaign.json, checked by scripts/model.py. */
(function () {
  const C = DATA.campaign;
  const P = C.periods;
  const FOOT = "@laboratoires_nihel · reconstruction for an MSc thesis (A. Belhassen, 2026) · not a screenshot of Instagram";
  const BADGE = "Illustrative mockup — simulated data — not an official Instagram export";

  const fmt = (n) => n.toLocaleString("en-US");
  const k1 = (n) => (n / 1000).toFixed(1) + "K";
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const tag = (t) => `<span class="tag ${t === "O" ? "o" : "e"}">${t}</span>`;

  const signal = `<svg width="18" height="12" viewBox="0 0 18 12" fill="#111"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" y="0" width="3" height="12" rx=".8"/></svg>`;
  const wifi = `<svg width="16" height="12" viewBox="0 0 16 12" fill="#111"><path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.3-1.3A10.3 10.3 0 0 0 8 .8 10.3 10.3 0 0 0 .7 3.7L2 5a8.5 8.5 0 0 1 6-2.4Z"/><path d="M8 6.2c1.3 0 2.5.5 3.4 1.3l1.3-1.3A6.7 6.7 0 0 0 8 4.4c-1.8 0-3.5.7-4.7 1.8l1.3 1.3c.9-.8 2.1-1.3 3.4-1.3Z"/><circle cx="8" cy="10.2" r="1.3"/></svg>`;
  const battery = `<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.6" fill="none" stroke="#111" stroke-opacity=".4"/><rect x="2.2" y="2.2" width="17" height="8.6" rx="2" fill="#111"/><path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1S25.8 4.7 25 4.4Z" fill="#111" fill-opacity=".45"/></svg>`;

  function card(i, title, sub, blocks) {
    const segs = [0, 1, 2].map((s) => `<i class="${s <= i ? "on" : ""}"></i>`).join("");
    return `<div class="phone recap">
      <div class="status"><span class="time">12:29</span><span class="sys">${signal}${wifi}${battery}</span></div>
      <div class="progress">${segs}</div>
      <div class="simline">Illustrative mockup · simulated data</div>
      <div class="sun"><div></div></div>
      <div class="rc-title">${title}</div>
      <div class="rc-sub">${sub}</div>
      ${blocks.map(([big, label, t, note]) => `<div class="rc-block"><div class="rc-big">${big}</div>
        <div class="rc-label">${label} ${tag(t)}</div><div class="rc-note">${note}</div></div>`).join("")}
      <div class="home"></div>
    </div>`;
  }

  const J = P.jul, G = P.aug, W = P.win;
  const split = (p) => `Sun care ${k1(p.split.views[0])} + other ranges ${k1(p.split.views[1])}`;
  const cards = [
    card(0, "July 2026", "Account recap · last 30 days (2–31 July)", [
      [k1(J.views), "Views", "E", `${split(J)} (25 Jul Reel)`],
      [J.follower_share.non_followers, "Views from non-followers", "E", `${J.follower_share.followers} from followers · three Reels-tab Reels: 75% non-followers`],
      [k1(J.followers_end), "Followers on 31 July", "E", `<b class="up">+${fmt(J.net_followers)}</b> since 1 July · ${fmt(J.followers_end)} followers`],
    ]),
    card(1, "August 2026", "Account recap · 1–31 August", [
      [k1(G.views), "Views", "E", `${split(G)} (15 Aug Reel)`],
      [G.follower_share.non_followers, "Views from non-followers", "E", `${G.follower_share.followers} from followers · 15 Aug Reel: 75% non-followers`],
      [k1(G.followers_end), "Followers on 31 August", "E", `<b class="up">+${fmt(G.net_followers)}</b> since 31 July · ${fmt(G.followers_end)} followers`],
    ]),
    card(2, "Launch window", "Account recap · 5 July – 1 September", [
      [k1(W.views), "Views", "E", split(W)],
      [W.follower_share.non_followers, "Views from non-followers", "E", `${W.follower_share.followers} from followers`],
      [k1(W.followers_end), "Followers on 1 September", "E", `<b class="up">+${fmt(W.net_followers)}</b> since 4 July (${W.growth_pct}) · ${fmt(W.followers_end)} followers`],
    ]),
  ];
  const caps = ["July 2026 · last 30 days, 2–31 Jul", "August 2026 · 1–31 Aug", "Launch window · 5 Jul – 1 Sep"];

  const pg = el(`<section class="page">
    <header class="page-head"><h1>Monthly recap <span>· @laboratoires_nihel · sun care launch</span></h1><span class="sim-badge">${BADGE}</span></header>
    <div class="screens" style="bottom:78px;gap:56px">${cards.map((c, i) => `<figure class="shot">${c}<figcaption><b>${i + 1}</b> · ${caps[i]}</figcaption></figure>`).join("")}</div>
    <div class="recap-note">Views = all views counted inside the period (Reels + posts + stories), as on the Insights screens; sun care and other ranges are split as in the reconciliation table.
      Followers = deterministic model from ${fmt(C.followers_start.value)} on 4 July (+52.8 a day + 1 per 50 likes and comments); observed anchors: 15 Apr (28.2K), 14 Oct (38.8K), 23 Oct (40.4K).
      ${tag("O")} observed · ${tag("E")} estimated. The 107K-view Reel of 15 August is unrelated to sun care. A post's lifetime views can exceed what falls inside a period: the 25 Jul Reel has ${fmt(C.posts.find((x) => x.id === "R3").views)} views, ${k1(J.split.views[1])} of them by 31 July. Not a screenshot of Instagram.</div>
    <footer class="page-foot"><span>${FOOT}</span><span>Recap</span></footer></section>`);
  document.body.appendChild(pg);
  pg.querySelectorAll(".phone").forEach((ph, i) => { ph.dataset.name = ["recap-jul", "recap-aug", "recap-win"][i]; });
  document.body.dataset.ready = "1";
})();
