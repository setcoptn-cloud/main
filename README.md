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
- **Figures:** `Nihel_Sun_Insights_v2_SIMULATION.pdf`, transcribed into `data/campaign.json`. Nothing is added.
- **Thumbnails:** cropped from the account's public grid (`assets/source/`), matched by date order and format.

## Rebuild

```sh
python3 scripts/crop_thumbs.py   # assets/thumbs/*.jpg
python3 scripts/model.py         # derives daily series, checks every total, writes src/data.js
node scripts/render.js           # PDF + PNGs into output/
```

`model.py` re-runs rules 1, 2 and 5 of the source and stops if any total differs from the source document. It checks views by type, likes, comments, net followers, followers at end, growth %, best day, the weekly follower table and every ER.
