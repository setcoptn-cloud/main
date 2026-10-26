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

START = dt.date(2026, 7, 5)
DAYS = [START + dt.timedelta(n) for n in range(59)]  # 5 Jul - 1 Sep
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

is_reel = lambda p: p["format"] == "Reel"
is_post = lambda p: p["format"] in ("Post", "Carousel")
is_other = lambda p: p["range"] == "other"


def followers_series(posts):
    """Rule 5: +52.8 a day + 1 per 50 likes and comments received that day."""
    lk, cm = daily(posts, "likes"), daily(posts, "comments")
    acc = float(D["followers_start"]["value"])
    prev = D["followers_start"]["value"]
    net, fol = {}, {}
    for d in DAYS:
        acc += 52.8 + (lk[d] + cm[d]) / 50
        cur = round(acc)
        net[d], fol[d], prev = cur - prev, cur, cur
    return net, fol, lk, cm


def pct(s):
    return float(s.rstrip("%")) / 100


def period(key, posts, added):
    """All figures of one period. `added` = publications added on top of v2."""
    v2, ds = V2[key], in_period(key)
    k = 0.55 * (0.85 if key == "win" else 1)
    net, fol, lk, cm = followers_series(posts)

    vt = {"posts": total(posts, "views", ds, is_post), "reels": total(posts, "views", ds, is_reel),
          "stories": v2["views_by_type"]["stories"], "live": 0}
    views = sum(vt.values())
    other_views = total(posts, "views", ds, is_other)
    det = {m: total(posts, m, ds) for m in METRICS4}
    det["story_replies"] = v2["interactions_detail"]["story_replies"]
    inter = sum(det.values())
    i4 = lambda pred: sum(total(posts, m, ds, pred) for m in METRICS4)
    ibt = {"posts": i4(is_post), "reels": i4(is_reel), "stories": det["story_replies"], "live": 0}
    other_inter = i4(is_other)

    # rule 4 + v3 correction: non-follower reach (75%) of the 15 Aug Reel and of the
    # added Reels counts in full; their follower reach goes through the overlap factor.
    o2 = next(p for p in posts if p["id"] == "O2")
    add_reach = lambda p: total([p], "reach", ds) * (0.75 + 0.25 * k)
    viewers = round(v2["viewers"] + (1 - k) * 0.75 * total([o2], "reach", ds) + sum(add_reach(p) for p in added))
    sun_reached = round(v2["split"]["reached"][0] + sum(add_reach(p) for p in added if not is_other(p)))

    # views from non-followers: added Reels are 75% non-followers, like the 15 Aug Reel
    added_views = sum(total([p], "views", ds) for p in added)
    nf = round((pct(v2["follower_share"]["non_followers"]) * v2["views"] + 0.75 * added_views) / views * 1000) / 10
    fs = dict(v2["follower_split_by_type"])
    if vt["reels"]:
        fs["reels"] = round((fs["reels"] * v2["views_by_type"]["reels"] + 0.25 * added_views) / vt["reels"], 4)

    # rule 7: profile visits; taps are a share of visits
    add_vis = lambda pred: sum(total([p], "visits", ds) for p in added if pred(p))
    vis = [v2["split"]["visits"][0] + add_vis(lambda p: not is_other(p)), v2["split"]["visits"][1] + add_vis(is_other)]
    visits = vis[0] + vis[1]

    n = sum(net[d] for d in ds)
    end = fol[ds[-1]]
    best = max(net[d] for d in ds)
    first = next(d for d in ds if net[d] == best)
    follows = round(n / 0.84)
    return {
        "label": v2["label"], "short": v2["short"], "start": v2["start"], "end": v2["end"], "range": v2["range"],
        "since": v2["since"], "cities": v2["cities"], "note": D["period_notes_v3"][key] if added else v2["note"],
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
net_b, fol_b, lk_b, cm_b = followers_series(BASE)
for i, (label, lc, gain, perday, end) in enumerate(D["weekly_followers_v2"]):
    ds = DAYS[7 * i: 7 * i + 7] if i < 7 else DAYS[49:]
    check(f"v2 week {label}", (sum(lk_b[d] + cm_b[d] for d in ds), sum(net_b[d] for d in ds), f"{sum(net_b[d] for d in ds) / len(ds):.1f}", fol_b[ds[-1]]),
          (lc, gain, perday, end))

# ---------- 2. v3: all 30 publications ----------
P3 = {key: period(key, ALL, NEW) for key in V2}
net, fol, lk, cm = followers_series(ALL)
weekly = []
for i, (label, *_rest) in enumerate(D["weekly_followers_v2"]):
    ds = DAYS[7 * i: 7 * i + 7] if i < 7 else DAYS[49:]
    g = sum(net[d] for d in ds)
    weekly.append([label, sum(lk[d] + cm[d] for d in ds), g, f"{g / len(ds):.1f}", fol[ds[-1]]])

views_d = daily(ALL, "views")
views_d = {d: views_d[d] + stories[d] for d in DAYS}
for key, p in P3.items():
    ds = in_period(key)
    check(f"{key} daily views add up", sum(views_d[d] for d in ds), p["views"])
    check(f"{key} reach is the largest of all", p["viewers"] >= max(total([x], "reach", ds) for x in ALL), True)
for f in ("views", "interactions", "net_followers"):
    check(f"window {f} = Jul + Aug + 1 Sep", P3["win"][f], P3["jul"][f] + P3["aug"][f] + (
        views_d[SEP1] if f == "views" else net[SEP1] if f == "net_followers" else
        sum(total(ALL, m, [SEP1]) for m in METRICS4) + st["sep1"]["replies"]))

# Business Suite: gross follows per day, split in proportion to the daily net gain
follows = {}
for key in ("jul", "aug"):
    ds = in_period(key)
    follows.update(zip(ds, alloc(P3[key]["follows"], [net[d] for d in ds])))
follows[SEP1] = P3["win"]["follows"] - P3["jul"]["follows"] - P3["aug"]["follows"]

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
for key, p in P3.items():
    v2 = V2[key]
    print(f"  {key}: views {v2['views']:,} -> {p['views']:,} | reached {p['viewers']:,} | interactions {v2['interactions']:,} -> {p['interactions']:,}"
          f" | net followers +{v2['net_followers']:,} -> +{p['net_followers']:,} | end {p['followers_end']:,} | non-followers {v2['follower_share']['non_followers']} -> {p['follower_share']['non_followers']}")
