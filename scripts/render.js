// Render the mockup documents to vector PDFs, one PNG per page, and one PNG per phone screen.
// Run: node scripts/render.js   (uses the preinstalled Playwright + Chromium)
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "output");
const DOCS = [
  { html: "index.html", pdf: "Nihel_Sun_Insights_v3_mockup.pdf", pages: "pages", prefix: "page" },
  { html: "recap.html", pdf: "Nihel_Sun_Monthly_Recap_v3.pdf", pages: "pages", prefix: "recap" },
  { html: "business.html", pdf: "Nihel_Meta_Business_Suite_mockup.pdf", pages: "pages", prefix: "business" },
  { html: "facebook.html", pdf: "Nihel_Meta_Business_Suite_Facebook_mockup.pdf", pages: "pages", prefix: "facebook" },
  { html: "overview.html", pdf: "Nihel_Meta_Business_Suite_Overview_IG_FB.pdf", pages: "pages", prefix: "overview" },
];

(async () => {
  for (const d of ["pages", "screens"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  const browser = await chromium.launch();

  const load = async (html, scale) => {
    const page = await browser.newPage({ viewport: { width: 1840, height: 1100 }, deviceScaleFactor: scale });
    page.setDefaultTimeout(120000); // a cold Chromium start can exceed the 30 s default
    await page.goto("file://" + path.join(ROOT, "src", html));
    await page.waitForSelector("body[data-ready='1']");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("load"); // "networkidle" is unreliable on file:// pages
    await page.waitForTimeout(500);
    return page;
  };

  for (const doc of DOCS) {
    const pdfPage = await load(doc.html, 1);
    await pdfPage.pdf({ path: path.join(OUT, doc.pdf), width: "1840px", height: "1100px", printBackground: true, preferCSSPageSize: true });

    const p2 = await load(doc.html, 2);
    const pages = await p2.$$(".page");
    for (let i = 0; i < pages.length; i++) {
      await pages[i].screenshot({ path: path.join(OUT, doc.pages, `${doc.prefix}-${String(i + 1).padStart(2, "0")}.png`) });
    }
    // single screens: 2x like a real iPhone 11 screenshot (828 x 1792), square corners
    const p3 = await load(doc.html, 2);
    await p3.evaluate(() => document.querySelectorAll(".phone, .bs").forEach((e) => { e.style.borderRadius = "0"; e.style.boxShadow = "none"; }));
    const phones = await p3.$$(".phone, .bs");
    for (const ph of phones) {
      await ph.screenshot({ path: path.join(OUT, "screens", `${await ph.getAttribute("data-name")}.png`) });
    }
    console.log(`${doc.pdf}: ${pages.length} page(s), ${phones.length} screen PNGs`);
  }
  await browser.close();
})();
