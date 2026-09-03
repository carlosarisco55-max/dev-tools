const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const filePath = process.argv[2];
  const outDir = process.argv[3] || __dirname;
  if (!filePath) {
    console.error('Uso: node shot.js <ruta-html> <carpeta-salida>');
    process.exit(1);
  }
  const url = 'file://' + path.resolve(filePath).replace(/\\/g, '/');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800); // dejar que arranquen animaciones/fuentes

  // 1) hero, tal cual carga
  await page.screenshot({ path: path.join(outDir, '01-hero.png') });

  // 2) mitad del scroll (sección pinned / cubo 3D)
  const height = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate((h) => window.scrollTo(0, h * 0.28), height);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '02-pinned-cube.png') });

  // 3) panel líquido
  await page.evaluate((h) => window.scrollTo(0, h * 0.62), height);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '03-liquid.png') });

  // 4) features / parallax
  await page.evaluate((h) => window.scrollTo(0, h * 0.8), height);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '04-features.png') });

  // 5) final
  await page.evaluate((h) => window.scrollTo(0, h), height);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '05-final.png') });

  console.log('OK. Errores de página capturados:', errors.length);
  errors.forEach((e) => console.log(' -', e));

  await browser.close();
}

main().catch((e) => { console.error('FALLO:', e); process.exit(1); });
