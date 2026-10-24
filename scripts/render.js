// Render src/index.html to a vector PDF, one PNG per page, and one PNG per phone screen.
// Run: node scripts/render.js   (uses the preinstalled Playwright + Chromium)
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "output");
const URL = "file://" + path.join(ROOT, "src", "index.html");

(async () => {
  for (const d of ["pages", "screens"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  const browser = await chromium.launch();

  const load = async (scale) => {
    const page = await browser.newPage({ viewport: { width: 1680, height: 1000 }, deviceScaleFactor: scale });
    await page.goto(URL);
    await page.waitForSelector("body[data-ready='1']");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    return page;
  };

  const pdfPage = await load(1);
  await pdfPage.pdf({ path: path.join(OUT, "Nihel_Sun_Insights_v3_mockup.pdf"), width: "1680px", height: "1000px", printBackground: true, preferCSSPageSize: true });

  const pages = await pdfPage.$$(".page");
  const p2 = await load(2);
  const big = await p2.$$(".page");
  for (let i = 0; i < big.length; i++) {
    await big[i].screenshot({ path: path.join(OUT, "pages", `page-${String(i + 1).padStart(2, "0")}.png`) });
  }
  const p3 = await load(3);
  for (const ph of await p3.$$(".phone")) {
    const name = await ph.getAttribute("data-name");
    await ph.screenshot({ path: path.join(OUT, "screens", `${name}.png`) });
  }
  console.log(`PDF: ${pages.length} pages; page PNGs: ${big.length}; screen PNGs: ${(await p3.$$(".phone")).length}`);
  await browser.close();
})();
