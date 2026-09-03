const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const dir = process.argv[2];
  const files = process.argv.slice(3);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  for (const file of files) {
    errors.length = 0;
    const url = 'file://' + path.resolve(dir, file).replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    // scroll through in steps so any scroll-triggered reveal animations fire
    const height = await page.evaluate(() => document.body.scrollHeight);
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), (height * i) / steps);
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    const outName = file.replace(/\.html$/, '.png');
    await page.screenshot({ path: path.join(dir, 'out-' + outName), fullPage: true });
    console.log(file + ' -> out-' + outName + (errors.length ? ' ERRORS: ' + errors.join(' | ') : ' OK'));
  }
  await browser.close();
}

main();
