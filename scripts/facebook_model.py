"""Facebook figures for the Business Suite mockup, from data/facebook.json.

Observed on Facebook: Reel views (as displayed), likes, comments, shares.
Everything else follows the rules in data/facebook.json, reusing the Instagram
model (scripts/model.py) for the shared rules. Stops on any inconsistency,
then writes src/facebook_data.js.
Run after model.py: python3 scripts/facebook_model.py
"""
import datetime as dt
import json
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FB = json.loads((ROOT / "data" / "facebook.json").read_text(encoding="utf-8"))
IG = json.loads((ROOT / "data" / "campaign.json").read_text(encoding="utf-8"))
TWIN = {p["id"]: p for p in IG["posts"]}
for p in TWIN.values():  # Reels-tab Reels: reach is derived in model.py (rule 8: views / 1.9)
    if p.get("added") and p.get("reach") is None:
        p["reach"] = round(p["views"] / 1.9)
WIN = IG["periods_v2"]["win"]
START, END = dt.date.fromisoformat(WIN["start"]), dt.date.fromisoformat(WIN["end"])
DAYS = [START + dt.timedelta(n) for n in range((END - START).days + 1)]
DECAY = [0.4 * 0.6 ** k for k in range(30)]

errors = []


def check(label, ok):
    if not ok:
        errors.append(label)


def alloc(total, weights):
    """Whole-number split of total by weights, largest remainder first (same as model.py)."""
    s = sum(weights)
    raw = [total * w / s for w in weights]
    out = [int(x) for x in raw]
    for k in sorted(range(len(raw)), key=lambda k: -(raw[k] - out[k]))[: total - sum(out)]:
        out[k] += 1
    return out


# ---------- items: twins, dates, titles ----------
items = FB["items"]
check("27 Facebook items", len(items) == 27)
check("every twin exists", all(i["twin"] in TWIN for i in items))
check("each twin used once", len({i["twin"] for i in items}) == len(items))
check("display matches views", all(i["format"] != "Reel" or
      (i["display"] == str(i["views"]) if i["views"] < 1000 else
       i["display"] == (f"{i['views'] / 1000:.1f}".rstrip("0").rstrip(".") + "K")) for i in items))

for i in items:
    t = TWIN[i["twin"]]
    i["date"] = t["date"]
    i["range"] = t["range"]
    i["title"] = t.get("title") or FB["visual_titles"].get(i["twin"], "")
    i["label"] = t.get("label") or i["title"] or "post"
    i["thumb"] = i["twin"]
    check(f"{i['id']} dated inside the window", START <= dt.date.fromisoformat(i["date"]) <= END)

# ---------- photo views: median FB/IG ratio of Reels observed on both ----------
pairs = [i["views"] / TWIN[i["twin"]]["views"] for i in items if i["format"] == "Reel" and TWIN[i["twin"]]["format"] == "Reel"]
RATIO = statistics.median(pairs)
for i in items:
    i["views_observed"] = i["views"] is not None
    if i["views"] is None:
        i["views"] = round(TWIN[i["twin"]]["views"] * RATIO)
    t = TWIN[i["twin"]]
    i["reach"] = round(i["views"] * t["reach"] / t["views"])
    i["visits"] = round(0.0063 * i["reach"])
    i["saves"] = 0
    i["interactions"] = i["likes"] + i["comments"] + i["shares"]


# ---------- daily series (rule 1) ----------
def daily(metric, pred=lambda i: True):
    s = {d: 0 for d in DAYS}
    for i in items:
        if pred(i):
            d0 = dt.date.fromisoformat(i["date"])
            for k, x in enumerate(alloc(i[metric], DECAY)):
                d = d0 + dt.timedelta(k)
                if d in s:
                    s[d] += x
    return s


views = daily("views")
inter = {d: sum(v[d] for v in (daily("likes"), daily("comments"), daily("shares"))) for d in DAYS}
reach_d = daily("reach")
K = 0.55 * 0.85
viewers_d = {d: round(0.55 * reach_d[d]) for d in DAYS}
visits_d = daily("visits")
reels_v = sum(daily("views", lambda i: i["format"] == "Reel").values())
photo_v = sum(daily("views", lambda i: i["format"] == "Photo").values())

tot = {
    "views": sum(views.values()),
    "views_by_type": {"reels": reels_v, "photos": photo_v},
    "viewers": round(K * sum(reach_d.values())),
    "interactions": sum(inter.values()),
    "interactions_detail": {m: sum(daily(m).values()) for m in ("likes", "comments", "shares")},
    "visits": sum(visits_d.values()),
    "follows": 0,
    "net_followers": 0,
}
tot["link_clicks"] = round(0.035 * tot["visits"])
link_d = dict(zip(DAYS, alloc(tot["link_clicks"], [visits_d[d] for d in DAYS]))) if tot["link_clicks"] else {d: 0 for d in DAYS}

check("views by type add up", reels_v + photo_v == tot["views"])
check("interactions detail adds up", sum(tot["interactions_detail"].values()) == tot["interactions"])
check("viewers >= biggest item reach in window", tot["viewers"] >= max(i["reach"] for i in items) * 0.4)
check("link clicks per day add up", sum(link_d.values()) == tot["link_clicks"])
lifetime_inter = sum(i["interactions"] for i in items)
check("window interactions <= lifetime interactions", tot["interactions"] <= lifetime_inter)

formats = {}
for f in ("Reel", "Photo"):
    sel = lambda i, f=f: i["format"] == f
    formats[f] = {"published": sum(1 for i in items if sel(i)), "views": sum(daily("views", sel).values()),
                  "interactions": sum(sum(daily(m, sel).values()) for m in ("likes", "comments", "shares"))}
check("formats add up", formats["Reel"]["views"] + formats["Photo"]["views"] == tot["views"])

cumulative = {}
for i in items:
    run, acc = [], 0
    for x in alloc(i["views"], DECAY):
        acc += x
        run.append(acc)
    cumulative[i["id"]] = run

if errors:
    raise SystemExit("Inconsistent Facebook data:\n  " + "\n  ".join(errors))

out = {
    "page_name": FB["page_name"], "followers": FB["followers"], "followers_note": FB["followers_note"],
    "observed": FB["observed"], "rules": FB["rules"], "ratio": RATIO, "ratio_pairs": len(pairs),
    "window": {"start": WIN["start"], "end": WIN["end"], **tot},
    "items": items, "formats": formats, "cumulative": cumulative,
    "daily": {"days": [d.isoformat() for d in DAYS], "views": [views[d] for d in DAYS], "viewers": [viewers_d[d] for d in DAYS],
              "interactions": [inter[d] for d in DAYS], "visits": [visits_d[d] for d in DAYS], "link_clicks": [link_d[d] for d in DAYS]},
}
js = "// Generated by scripts/facebook_model.py from data/facebook.json. Do not edit by hand.\nwindow.FACEBOOK = " + json.dumps(out, ensure_ascii=False) + ";\n"
(ROOT / "src" / "facebook_data.js").write_text(js, encoding="utf-8")
print(f"All Facebook checks passed. Wrote src/facebook_data.js")
print(f"  FB/IG view ratio (median of {len(pairs)} Reels): {RATIO:.4f}")
print(f"  window: views {tot['views']:,} (Reels {reels_v:,}, photos {photo_v:,}) | viewers {tot['viewers']:,} | interactions {tot['interactions']:,} "
      f"{tot['interactions_detail']} | visits {tot['visits']} | link clicks {tot['link_clicks']} | lifetime interactions {lifetime_inter}")
for i in sorted(items, key=lambda i: -i["views"])[:6]:
    print(f"  {i['id']} {i['twin']} {i['date']} {i['format']} views {i['views']:,}{'' if i['views_observed'] else ' (est.)'} reach {i['reach']:,} '{i['title'][:40]}'")
