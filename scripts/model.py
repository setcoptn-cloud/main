"""Rebuild every figure of the mockups from data/campaign.json and verify it.

1. Regression: with the 27 publications of the v2 document, the rules must
   reproduce every v2 total exactly (accounts reached also gets the v3
   correction for the 15 Aug Reel).
2. v3: the same code path runs on all 30 publications, i.e. with the three
   Reels that only appear in the Reels tab (R1-R3).
The script stops on any mismatch, then writes src/data.js for the mockups.
Run: python3 scripts/model.py
"""
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = json.loads((ROOT / "data" / "campaign.json").read_text(encoding="utf-8"))
V2 = D["periods_v2"]

START = dt.date(2026, 7, 2)
DAYS = [START + dt.timedelta(n) for n in range(62)]  # 2 Jul - 1 Sep (launch window from 5 Jul)
V3 = D["periods_v3"]
PRE = [dt.date.fromisoformat(x) for x in V3["jul"]["pre_launch"]]  # 2-4 Jul, before the launch
DECAY = [0.4 * 0.6 ** k for k in range(30)]
FORMATS = {"Reel", "Post", "Carousel"}
METRICS4 = ("likes", "comments", "shares", "saves")


def alloc(total, weights):
    """Whole-number split of total by weights, largest remainder first."""
    s = sum(weights)
    raw = [total * w / s for w in weights]
    out = [int(x) for x in raw]
    for k in sorted(range(len(raw)), key=lambda k: -(raw[k] - out[k]))[: total - sum(out)]:
        out[k] += 1
    return out


def half_up(x):
    return int(x + 0.5)


errors = []


def check(label, got, want):
    if got != want:
        errors.append(f"{label}: model {got} != expected {want}")


# ---------- estimated fields of the Reels added in v3 (rules 6 and 8) ----------
for p in D["posts"]:
    if p.get("added"):
        p["reach"] = round(p["views"] / 1.9)
        p["shares"] = half_up(0.10 * p["likes"])
        p["saves"] = half_up(0.05 * p["likes"])
        p["visits"] = round(0.0063 * p["reach"])
        p["er"] = f"{100 * sum(p[m] for m in METRICS4) / p['reach']:.2f}%"
ALL = D["posts"]
BASE = [p for p in ALL if not p.get("added")]
NEW = [p for p in ALL if p.get("added")]
for p in ALL:
    check(f"ER {p['id']}", f"{100 * sum(p[m] for m in METRICS4) / p['reach']:.2f}%", p["er"])


def in_period(key):
    a, b = dt.date.fromisoformat(V2[key]["start"]), dt.date.fromisoformat(V2[key]["end"])
    return [d for d in DAYS if a <= d <= b]


def post_days(p, metric):
    """{day: value} for one publication, rule 1."""
    day0 = dt.date.fromisoformat(p["date"])
    return {day0 + dt.timedelta(k): x for k, x in enumerate(alloc(p[metric], DECAY))}


def total(posts, metric, ds, pred=lambda p: True):
    days = set(ds)
    return sum(x for p in posts if pred(p) for d, x in post_days(p, metric).items() if d in days)


def daily(posts, metric, pred=lambda p: True):
    s = {d: 0 for d in DAYS}
    for p in posts:
        if pred(p):
            for d, x in post_days(p, metric).items():
                if d in s:
                    s[d] += x
    return s


# ---------- stories (rule 2): fixed totals of the first reconstruction ----------
st = D["stories"]
JUL = in_period("jul")
AUG = in_period("aug")
SEP1 = dt.date(2026, 9, 1)
heavy = set(st["jul"]["heavy_days"])
stories = dict(zip(JUL, alloc(st["jul"]["views"], [st["jul"]["heavy_weight"] if d.isoformat() in heavy else 1 for d in JUL])))
stories.update(zip(AUG, alloc(st["aug"]["views"], [1] * len(AUG))))
stories[SEP1] = st["sep1"]["views"]
jul_units = sum(st["jul"]["heavy_weight"] if d.isoformat() in heavy else 1 for d in JUL)
PRE_RATE = round(st["jul"]["views"] / jul_units)
for d in PRE:
    stories[d] = PRE_RATE
PRE_STORIES = PRE_RATE * len(PRE)
PRE_REPLIES = round(st["jul"]["replies"] / st["jul"]["views"] * PRE_STORIES)
PRE_VISITS = round(0.0025 * PRE_STORIES)

is_reel = lambda p: p["format"] == "Reel"
is_post = lambda p: p["format"] in ("Post", "Carousel")
is_other = lambda p: p["range"] == "other"


def followers_series(posts):
    """Rule 5: +52.8 a day + 1 per 50 likes and comments received that day."""
    lk, cm = daily(posts, "likes"), daily(posts, "comments")
    start = D["followers_start"]["value"]
    acc = start - 52.8 * len(PRE)
    prev = round(acc)
    net, fol = {}, {}
    for d in DAYS:
        if d == PRE[-1] + dt.timedelta(1):
            acc, prev = float(start), start  # 4 July value of the source
        acc += 52.8 + (lk[d] + cm[d]) / 50
        cur = round(acc)
        net[d], fol[d], prev = cur - prev, cur, cur
    return net, fol, lk, cm


def pct(s):
    return float(s.rstrip("%")) / 100


def period(key, posts, added, pre=False):
    """All figures of one period. `added` = publications added on top of v2;
    `pre` = also count 2-4 July (July shown as Instagram's last 30 days)."""
    v2, ds = V2[key], in_period(key)
    if pre:
        ds = PRE + ds
    ps, pr, pv = (PRE_STORIES, PRE_REPLIES, PRE_VISITS) if pre else (0, 0, 0)
    k = 0.55 * (0.85 if key == "win" else 1)
    net, fol, lk, cm = followers_series(posts)

    vt = {"posts": total(posts, "views", ds, is_post), "reels": total(posts, "views", ds, is_reel),
          "stories": v2["views_by_type"]["stories"] + ps, "live": 0}
    views = sum(vt.values())
    other_views = total(posts, "views", ds, is_other)
    det = {m: total(posts, m, ds) for m in METRICS4}
    det["story_replies"] = v2["interactions_detail"]["story_replies"] + pr
    inter = sum(det.values())
    i4 = lambda pred: sum(total(posts, m, ds, pred) for m in METRICS4)
    ibt = {"posts": i4(is_post), "reels": i4(is_reel), "stories": det["story_replies"], "live": 0}
    other_inter = i4(is_other)

    # rule 4 + v3 correction: non-follower reach (75%) of the 15 Aug Reel and of the
    # added Reels counts in full; their follower reach goes through the overlap factor.
    o2 = next(p for p in posts if p["id"] == "O2")
    add_reach = lambda p: total([p], "reach", ds) * (0.75 + 0.25 * k)
    pre_reach = k * ps / 1.6  # stories reach = views / 1.6, through the overlap factor
    viewers = round(v2["viewers"] + pre_reach + (1 - k) * 0.75 * total([o2], "reach", ds) + sum(add_reach(p) for p in added))
    sun_reached = round(v2["split"]["reached"][0] + pre_reach + sum(add_reach(p) for p in added if not is_other(p)))

    # views from non-followers: added Reels are 75% non-followers, like the 15 Aug Reel
    added_views = sum(total([p], "views", ds) for p in added)
    fs = dict(v2["follower_split_by_type"])
    nf = round((pct(v2["follower_share"]["non_followers"]) * v2["views"] + (1 - fs["stories"]) * ps + 0.75 * added_views) / views * 1000) / 10
    if vt["reels"]:
        fs["reels"] = round((fs["reels"] * v2["views_by_type"]["reels"] + 0.25 * added_views) / vt["reels"], 4)

    # rule 7: profile visits; taps are a share of visits
    add_vis = lambda pred: sum(total([p], "visits", ds) for p in added if pred(p))
    vis = [v2["split"]["visits"][0] + pv + add_vis(lambda p: not is_other(p)), v2["split"]["visits"][1] + add_vis(is_other)]
    visits = vis[0] + vis[1]

    n = sum(net[d] for d in ds)
    end = fol[ds[-1]]
    best = max(net[d] for d in ds)
    first = next(d for d in ds if net[d] == best)
    follows = round(n / 0.84)
    o = V3.get(key, {}) if pre or added else {}
    return {
        "label": v2["label"], "short": v2["short"], "start": ds[0].isoformat(), "end": v2["end"],
        "range": o.get("range", v2["range"]) if pre else v2["range"], "since": o.get("since", v2["since"]) if pre else v2["since"],
        "picker": o.get("picker", "Custom"), "cities": v2["cities"], "note": D["period_notes_v3"][key] if added else v2["note"],
        "views": views, "views_by_type": vt,
        "follower_share": {"followers": f"{100 - nf:.1f}%", "non_followers": f"{nf:.1f}%"},
        "follower_split_by_type": fs,
        "viewers": viewers,
        "interactions": inter, "interactions_by_type": ibt, "interactions_detail": det,
        "net_followers": n, "followers_end": end, "follows": follows, "unfollows": follows - n,
        "growth_pct": f"+{100 * n / (end - n):.1f}%", "best_day": f"{first.day} {first.strftime('%b')} · +{best}",
        "profile": {"visits": visits, "bio_taps": round(0.035 * visits), "address_taps": round(0.006 * visits)},
        "split": {"views": [views - other_views, other_views, views], "interactions": [inter - other_inter, other_inter, inter],
                  "reached": [sun_reached, None, viewers], "visits": [vis[0], vis[1], visits]},
    }


# ---------- 1. regression: the 27 v2 publications give back v2 ----------
for key, v2 in V2.items():
    got = period(key, BASE, [])
    for field in ("views", "views_by_type", "interactions", "interactions_by_type", "interactions_detail", "net_followers",
                  "followers_end", "follows", "unfollows", "growth_pct", "best_day", "profile", "follower_share"):
        check(f"v2 {key} {field}", got[field], v2[field])
    for field in ("views", "interactions", "visits"):
        check(f"v2 {key} split {field}", got["split"][field], v2["split"][field])
    check(f"v2 {key} sun reached", got["split"]["reached"][0], v2["split"]["reached"][0])
WIN = in_period("win")
net_b, fol_b, lk_b, cm_b = followers_series(BASE)
for i, (label, lc, gain, perday, end) in enumerate(D["weekly_followers_v2"]):
    ds = WIN[7 * i: 7 * i + 7] if i < 7 else WIN[49:]
    check(f"v2 week {label}", (sum(lk_b[d] + cm_b[d] for d in ds), sum(net_b[d] for d in ds), f"{sum(net_b[d] for d in ds) / len(ds):.1f}", fol_b[ds[-1]]),
          (lc, gain, perday, end))

# ---------- 2. v3: all 30 publications; July = Instagram's last 30 days (2-31 Jul) ----------
P3 = {key: period(key, ALL, NEW, pre=(key == "jul")) for key in V2}
JUL_LAUNCH = period("jul", ALL, NEW)  # 5-31 Jul, the July part of the launch window
net, fol, lk, cm = followers_series(ALL)
check("followers on 4 July", fol[PRE[-1]], D["followers_start"]["value"])
weekly = []
for i, (label, *_rest) in enumerate(D["weekly_followers_v2"]):
    ds = WIN[7 * i: 7 * i + 7] if i < 7 else WIN[49:]
    g = sum(net[d] for d in ds)
    weekly.append([label, sum(lk[d] + cm[d] for d in ds), g, f"{g / len(ds):.1f}", fol[ds[-1]]])

views_d = daily(ALL, "views")
views_d = {d: views_d[d] + stories[d] for d in DAYS}
for key, p in P3.items():
    ds = [d for d in DAYS if p["start"] <= d.isoformat() <= p["end"]]
    check(f"{key} daily views add up", sum(views_d[d] for d in ds), p["views"])
    check(f"{key} reach is the largest of all", p["viewers"] >= max(total([x], "reach", ds) for x in ALL), True)

# Columns of the cover table: 2-4 Jul (before the launch) and 1 Sep, so that
# window = July (30 days) - 2-4 Jul + August + 1 Sep for every additive figure.
pre_net = sum(net[d] for d in PRE)
P3["pre"] = {"views": PRE_STORIES, "views_by_type": {"posts": 0, "reels": 0, "stories": PRE_STORIES, "live": 0},
             "interactions_detail": {"likes": 0, "comments": 0, "shares": 0, "saves": 0, "story_replies": PRE_REPLIES},
             "interactions": PRE_REPLIES, "net_followers": pre_net, "follows": round(pre_net / 0.84),
             "profile": {"visits": PRE_VISITS, "bio_taps": 0, "address_taps": 0}, "followers_end": fol[PRE[-1]]}
P3["pre"]["unfollows"] = P3["pre"]["follows"] - pre_net
J, G, Wn, R = P3["jul"], P3["aug"], P3["win"], P3["pre"]
for f in ("views", "interactions", "net_followers"):
    check(f"July (30 days) - 2-4 Jul = 5-31 Jul: {f}", J[f] - R[f], JUL_LAUNCH[f])
check("July (30 days) - 2-4 Jul = 5-31 Jul: visits", J["profile"]["visits"] - R["profile"]["visits"], JUL_LAUNCH["profile"]["visits"])
sep = lambda f: Wn[f] - (J[f] - R[f]) - G[f]
check("1 Sep views", sep("views"), views_d[SEP1])
check("1 Sep net followers", sep("net_followers"), net[SEP1])
check("1 Sep interactions", sep("interactions"), sum(total(ALL, m, [SEP1]) for m in METRICS4) + st["sep1"]["replies"])
for f in ("bio_taps", "address_taps"):
    check(f"1 Sep {f} not negative", Wn["profile"][f] - (J["profile"][f] - R["profile"][f]) - G["profile"][f] >= 0, True)

# Business Suite: gross follows per day, split in proportion to the daily net gain
follows = dict(zip(PRE, alloc(R["follows"], [net[d] for d in PRE])))
follows.update(zip(WIN, alloc(Wn["follows"], [net[d] for d in WIN])))

win = in_period("win")
formats = {}
for name, pred in (("Reel", is_reel), ("Post", lambda p: p["format"] == "Post"), ("Carousel", lambda p: p["format"] == "Carousel")):
    formats[name] = {"published": sum(1 for p in ALL if pred(p)), "views": total(ALL, "views", win, pred),
                     "interactions": sum(total(ALL, m, win, pred) for m in METRICS4)}
formats["Stories"] = {"published": None, "views": P3["win"]["views_by_type"]["stories"], "interactions": P3["win"]["interactions_by_type"]["stories"]}
check("formats views", formats["Reel"]["views"] + formats["Post"]["views"] + formats["Carousel"]["views"],
      P3["win"]["views_by_type"]["reels"] + P3["win"]["views_by_type"]["posts"])

cumulative = {}
for p in ALL:
    run, acc = [], 0
    for x in alloc(p["views"], DECAY):
        acc += x
        run.append(acc)
    cumulative[p["id"]] = run

if errors:
    raise SystemExit("Inconsistent data:\n  " + "\n  ".join(errors))

C = dict(D)
C["periods"] = P3
C["weekly_followers"] = weekly
out = {
    "campaign": C,
    "daily": {
        "days": [d.isoformat() for d in DAYS],
        "views": [views_d[d] for d in DAYS],
        "net_followers": [net[d] for d in DAYS],
        "followers": [fol[d] for d in DAYS],
        "follows": [follows[d] for d in DAYS],
    },
    "formats": formats,
    "cumulative": cumulative,
}
js = "// Generated by scripts/model.py from data/campaign.json. Do not edit by hand.\nwindow.DATA = " + json.dumps(out, ensure_ascii=False) + ";\n"
(ROOT / "src" / "data.js").write_text(js, encoding="utf-8")
print("All checks passed (v2 reproduced from 27 publications; v3 computed from 30). Wrote src/data.js")
for key, v2 in V2.items():
    p = P3[key]
    print(f"  {key}: views {v2['views']:,} -> {p['views']:,} | reached {p['viewers']:,} | interactions {v2['interactions']:,} -> {p['interactions']:,}"
          f" | net followers +{v2['net_followers']:,} -> +{p['net_followers']:,} | end {p['followers_end']:,} | non-followers {v2['follower_share']['non_followers']} -> {p['follower_share']['non_followers']}")
