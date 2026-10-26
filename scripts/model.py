"""Rebuild the day-by-day series from data/campaign.json and verify every total.

Implements rules 1, 2 and 5 of the source document. The script stops with an
error if any derived total differs from the figure printed in the source, then
writes src/data.js for the mockup.
Run: python3 scripts/model.py
"""
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = json.loads((ROOT / "data" / "campaign.json").read_text(encoding="utf-8"))

START = dt.date(2026, 7, 5)
DAYS = [START + dt.timedelta(n) for n in range(59)]  # 5 Jul - 1 Sep
DECAY = [0.4 * 0.6 ** k for k in range(30)]


def alloc(total, weights):
    """Whole-number split of total by weights, largest remainder first."""
    s = sum(weights)
    raw = [total * w / s for w in weights]
    out = [int(x) for x in raw]
    for k in sorted(range(len(raw)), key=lambda k: -(raw[k] - out[k]))[: total - sum(out)]:
        out[k] += 1
    return out


def spread(metric, formats):
    series = {d: 0 for d in DAYS}
    for p in D["posts"]:
        if p["format"] not in formats:
            continue
        day0 = dt.date.fromisoformat(p["date"])
        for k, x in enumerate(alloc(p[metric], DECAY)):
            d = day0 + dt.timedelta(k)
            if d in series:
                series[d] += x
    return series


ALL = {"Reel", "Post", "Carousel"}
reels = spread("views", {"Reel"})
posts = spread("views", {"Post", "Carousel"})
likes = spread("likes", ALL)
comments = spread("comments", ALL)

stories = {}
jul = [d for d in DAYS if d.month == 7]
aug = [d for d in DAYS if d.month == 8]
st = D["stories"]
heavy = set(st["jul"]["heavy_days"])
for d, x in zip(jul, alloc(st["jul"]["views"], [st["jul"]["heavy_weight"] if d.isoformat() in heavy else 1 for d in jul])):
    stories[d] = x
for d, x in zip(aug, alloc(st["aug"]["views"], [1] * len(aug))):
    stories[d] = x
stories[dt.date(2026, 9, 1)] = st["sep1"]["views"]

views = {d: reels[d] + posts[d] + stories[d] for d in DAYS}

acc = float(D["followers_start"]["value"])
prev = D["followers_start"]["value"]
net, followers = {}, {}
for d in DAYS:
    acc += 52.8 + (likes[d] + comments[d]) / 50
    cur = round(acc)
    net[d], followers[d], prev = cur - prev, cur, cur


def in_period(key):
    p = D["periods"][key]
    a, b = dt.date.fromisoformat(p["start"]), dt.date.fromisoformat(p["end"])
    return [d for d in DAYS if a <= d <= b]


errors = []


def check(label, got, want):
    if got != want:
        errors.append(f"{label}: model {got} != source {want}")


for key, p in D["periods"].items():
    ds = in_period(key)
    vt = p["views_by_type"]
    check(f"{key} reels", sum(reels[d] for d in ds), vt["reels"])
    check(f"{key} posts", sum(posts[d] for d in ds), vt["posts"])
    check(f"{key} stories", sum(stories[d] for d in ds), vt["stories"])
    check(f"{key} views", sum(vt.values()), p["views"])
    check(f"{key} views split", p["split"]["views"][0] + p["split"]["views"][1], p["views"])
    it = p["interactions_by_type"]
    check(f"{key} interactions by type", sum(it.values()), p["interactions"])
    check(f"{key} interactions detail", sum(p["interactions_detail"].values()), p["interactions"])
    check(f"{key} likes", sum(likes[d] for d in ds), p["interactions_detail"]["likes"])
    check(f"{key} comments", sum(comments[d] for d in ds), p["interactions_detail"]["comments"])
    check(f"{key} net followers", sum(net[d] for d in ds), p["net_followers"])
    check(f"{key} follows - unfollows", p["follows"] - p["unfollows"], p["net_followers"])
    check(f"{key} followers end", followers[ds[-1]], p["followers_end"])
    base = followers[ds[0]] - net[ds[0]]
    check(f"{key} growth %", f"+{100 * p['net_followers'] / base:.1f}%", p["growth_pct"])
    check(f"{key} visits split", p["split"]["visits"][0] + p["split"]["visits"][1], p["profile"]["visits"])
    best = max(net[d] for d in ds)
    first = next(d for d in ds if net[d] == best)
    check(f"{key} best day", f"{first.day} {first.strftime('%b')} · +{best}", p["best_day"])

check("window = Jul + Aug + 1 Sep views",
      D["periods"]["jul"]["views"] + D["periods"]["aug"]["views"] + views[dt.date(2026, 9, 1)],
      D["periods"]["win"]["views"])
for i, (label, lc, gain, perday, end) in enumerate(D["weekly_followers"]):
    ds = DAYS[7 * i: 7 * i + 7] if i < 7 else DAYS[49:]
    check(f"week {label} likes+comments", sum(likes[d] + comments[d] for d in ds), lc)
    check(f"week {label} gain", sum(net[d] for d in ds), gain)
    check(f"week {label} followers", followers[ds[-1]], end)
check("posts in table", len(D["posts"]), 27)
for p in D["posts"]:
    er = 100 * (p["likes"] + p["comments"] + p["shares"] + p["saves"]) / p["reach"]
    check(f"ER {p['id']}", f"{er:.2f}%", p["er"])

# Business Suite screens: gross follows per day (unfollows are a fixed 16% share,
# so each month's follows are split in proportion to that month's daily net gain).
follows = {}
for key in ("jul", "aug"):
    ds = in_period(key)
    for d, x in zip(ds, alloc(D["periods"][key]["follows"], [net[d] for d in ds])):
        follows[d] = x
sep1 = dt.date(2026, 9, 1)
follows[sep1] = D["periods"]["win"]["follows"] - D["periods"]["jul"]["follows"] - D["periods"]["aug"]["follows"]
check("window follows", sum(follows.values()), D["periods"]["win"]["follows"])

# Views and interactions by format over the window (rule 1 applied per format).
win = in_period("win")
formats = {}
for fmt_name in ("Reel", "Post", "Carousel"):
    v = spread("views", {fmt_name})
    inter = sum(sum(spread(m, {fmt_name})[d] for d in win) for m in ("likes", "comments", "shares", "saves"))
    formats[fmt_name] = {
        "published": sum(1 for p in D["posts"] if p["format"] == fmt_name),
        "views": sum(v[d] for d in win),
        "interactions": inter,
    }
wt = D["periods"]["win"]
check("format reels views", formats["Reel"]["views"], wt["views_by_type"]["reels"])
check("format posts views", formats["Post"]["views"] + formats["Carousel"]["views"], wt["views_by_type"]["posts"])
check("format reels interactions", formats["Reel"]["interactions"], wt["interactions_by_type"]["reels"])
check("format posts interactions", formats["Post"]["interactions"] + formats["Carousel"]["interactions"], wt["interactions_by_type"]["posts"])
formats["Stories"] = {"published": None, "views": wt["views_by_type"]["stories"], "interactions": wt["interactions_by_type"]["stories"]}

# Cumulative views of single posts over their 30 days (post detail screen).
cumulative = {}
for p in D["posts"]:
    run, acc_v = [], 0
    for x in alloc(p["views"], DECAY):
        acc_v += x
        run.append(acc_v)
    cumulative[p["id"]] = run
    check(f"cumulative {p['id']}", run[-1], p["views"])

# Accounts reached (rule 4 with the v3 correction): the viral Reel's non-follower
# reach (75%) is counted in full instead of going through the overlap factor.
def reach_in(pid, ds):
    p = next(x for x in D["posts"] if x["id"] == pid)
    day0, days = dt.date.fromisoformat(p["date"]), set(ds)
    return sum(x for k, x in enumerate(alloc(p["reach"], DECAY)) if day0 + dt.timedelta(k) in days)


for key, p in D["periods"].items():
    ds = in_period(key)
    overlap = 0.55 * (0.85 if key == "win" else 1)
    extra = round((1 - overlap) * 0.75 * reach_in("O2", ds))
    check(f"{key} accounts reached (v3 correction)", p["viewers"], p["viewers_v2"] + extra)
    check(f"{key} reached in split table", p["split"]["reached"][2], p["viewers"])
    biggest = max(reach_in(x["id"], ds) for x in D["posts"])
    if p["viewers"] < biggest:
        errors.append(f"{key}: accounts reached {p['viewers']} < one post's reach {biggest}")

if errors:
    raise SystemExit("Inconsistent data:\n  " + "\n  ".join(errors))

out = {
    "campaign": D,
    "daily": {
        "days": [d.isoformat() for d in DAYS],
        "views": [views[d] for d in DAYS],
        "net_followers": [net[d] for d in DAYS],
        "followers": [followers[d] for d in DAYS],
        "follows": [follows[d] for d in DAYS],
    },
    "formats": formats,
    "cumulative": cumulative,
}
js = "// Generated by scripts/model.py from data/campaign.json. Do not edit by hand.\nwindow.DATA = " + json.dumps(out, ensure_ascii=False) + ";\n"
(ROOT / "src" / "data.js").write_text(js, encoding="utf-8")
print("All checks passed. Wrote src/data.js")
for key in D["periods"]:
    ds = in_period(key)
    print(f"  {key}: max daily views {max(views[d] for d in ds):,}, max daily net followers {max(net[d] for d in ds)}")
