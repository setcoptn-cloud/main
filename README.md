# Nihel Sun · Instagram Insights mockup (v3)

Illustrative mockup of Instagram Insights screens for the Nihel Sun care launch
(5 July – 1 September 2026), for an MSc thesis appendix. **All data are simulated**
and every screen says so. This is not an Instagram or Meta export.

## Deliverables (`output/`)

| File | Content |
| --- | --- |
| `Nihel_Sun_Insights_v3_mockup.pdf` | 8 vector pages, 1680 × 1000 px: cover and reconciliation, then Overview/Content and Audience for July, August and the whole window, then method and publications table |
| `pages/page-NN.png` | Each page at 2× |
| `screens/<period>-<tab>-<n>.png` | Each phone screen alone at 3× (1125 × 2436), ready to place as a thesis figure |
| `Nihel_Meta_Business_Suite_mockup.pdf` | 8 pages: Meta Business Suite desktop Insights (Instagram, launch window) — content overview, top content formats, results, all content, post detail, audience; `pages/business-NN.png` and `screens/bs-*.png` |
| `Nihel_Sun_Monthly_Recap_v3.pdf` | 1-page monthly recap (July, August, launch window), same data; `pages/recap-01.png` and `screens/recap-*.png` |

## Sources

- **Layout:** `exemple_de_meta_business_instagram.pdf` (real Instagram Insights screenshots, dark mode): header, tabs, metric cards, line chart, bar rules, chips, list rows and colours are taken from it.
- **Figures:** `Nihel_Sun_Insights_v2_SIMULATION.pdf` (27 publications, `periods_v2` in `data/campaign.json`) plus three Reels visible only in the Reels tab (`3_reels.pdf`: 5, 20 and 25 July; views, likes and comments observed). The v3 figures are computed from all 30 publications with the v2 rules.
- **Thumbnails:** cropped from the account's public grid and Reels tab (`assets/source/`), matched by date order and format.

## Rebuild

```sh
python3 scripts/crop_thumbs.py   # assets/thumbs/*.jpg
python3 scripts/model.py         # derives daily series, checks every total, writes src/data.js
node scripts/render.js           # PDF + PNGs into output/
node scripts/audit.js            # reads every chart back from the pages and checks it against the data
```

`model.py` first checks that the rules give back every v2 total from the 27 v2 publications, then computes the v3 figures from all 30; it stops on any mismatch. It checks views by type, likes, comments, net followers, followers at end, growth %, best day, the weekly follower table and every ER.

`audit.js` converts every drawn line point back to a number (from its position between the gridlines) and compares it with the data, checks each axis and date label, every bar length, and that no panel or footnote is cut off. It fails if anything is off.
