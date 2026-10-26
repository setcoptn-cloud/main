"""Crop one thumbnail per publication from the three Instagram feed screenshots.

The feed is reverse-chronological (5 columns x 2 rows per screenshot). The
mapping below was checked against the format of every publication in the
campaign table (Reel icon, carousel icon, or none for a static post).
Run: python3 scripts/crop_thumbs.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "source"
OUT = ROOT / "assets" / "thumbs"

# (file, column left edges, row top edges, tile width, tile height)
SHEETS = {
    "feed_1_newest.webp": ([5, 286, 568, 850, 1131], [0, 379], 277, 369),
    "feed_2.webp": ([1, 282, 564, 845, 1127], [2, 377], 276, 369),
    "feed_3_oldest.webp": ([10, 291, 573, 855, 1136], [0, 374], 277, 369),
}

# Row-major order inside each screenshot; None = outside the 5 Jul - 1 Sep window.
MAPPING = {
    "feed_1_newest.webp": [None, "S24", "S23", "S22", "S21", "O3", "S20", "O2", "O1", "S19"],
    "feed_2.webp": ["S18", "S17", "S16", "S15", "S14", "S13", "S12", "S11", "S10", "S09"],
    "feed_3_oldest.webp": ["S08", "S07", "S06", "S05", "S04", "S03", "S02", "S01", None, None],
}


# Reels tab screenshot (2 columns): Reels hidden from the profile grid.
# Boxes stop above the view-count overlay at the bottom of each tile.
REELS_TAB = {"R3": (2, 6, 279, 400), "R2": (285, 6, 558, 400), "R1": (2, 450, 279, 836)}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (cols, rows, w, h) in SHEETS.items():
        im = Image.open(SRC / name).convert("RGB")
        ids = MAPPING[name]
        for i, pid in enumerate(ids):
            if pid is None:
                continue
            x, y = cols[i % 5], rows[i // 5]
            # skip the top 32 px, where the feed grid draws its own Reel/carousel badge
            tile = im.crop((x + 2, y + 32, x + w - 2, y + h - 2))
            tile.save(OUT / f"{pid}.jpg", quality=90)
    tab = Image.open(SRC / "reels_tab.png").convert("RGB")
    for pid, box in REELS_TAB.items():
        tab.crop(box).save(OUT / f"{pid}.jpg", quality=90)
    print("thumbnails:", len(list(OUT.glob("*.jpg"))))


if __name__ == "__main__":
    main()
