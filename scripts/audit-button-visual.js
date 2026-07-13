/**
 * Playwright visual audit for Booking.com buttons.
 * Tests that every .booking-com-button renders as a blue 260×56 rectangle.
 * Run after deploy: node scripts/audit-button-visual.js
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.AUDIT_BASE || 'http://localhost:9876';

const TEST_PAGES = [
  { url: '/', label: 'Homepage' },
  { url: '/best-hotels-in-da-nang.html', label: 'Best Hotels (main)' },
  { url: '/where-to-stay-in-da-nang.html', label: 'Where to Stay' },
  { url: '/luxury-hotels-da-nang.html', label: 'Luxury Hotels' },
  { url: '/da-nang-beach-hotels.html', label: 'Beach Hotels' },
  { url: '/best-hotels-near-my-khe-beach.html', label: 'My Khe Beach' },
  { url: '/a-la-carte-da-nang.html', label: 'Hotel Review (A La Carte)' },
  { url: '/hyatt-regency-da-nang.html', label: 'Hotel Review (Hyatt)' },
  { url: '/hotels.html', label: 'Hotels Hub' },
];

const VIEWPORTS = [
  { width: 1440, height: 900, label: 'desktop-1440' },
  { width: 390,  height: 844, label: 'mobile-390' },
];

const SCREENSHOT_DIR = path.join(__dirname, '../.button-audit-screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const EXPECTED = {
  borderRadius: 8,
  height: 56,
  desktopWidth: 260,
  bgBlue: '#003b95',
};

function rgbToHex(rgb) {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return rgb;
  return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

async function auditPage(page, url, label, viewport) {
  const failures = [];
  const pass = [];

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 });

  const buttons = await page.locator('.booking-com-button').all();

  if (buttons.length === 0) {
    failures.push(`NO .booking-com-button found on ${url}`);
    return { failures, pass, count: 0 };
  }

  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];

    // Skip hidden buttons (mobile menu, hidden sections)
    const isVisible = await btn.isVisible();
    if (!isVisible) continue;

    const box  = await btn.boundingBox();
    const styles = await btn.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        br: cs.borderRadius,
        w:  cs.width,
        h:  cs.height,
        display: cs.display,
      };
    });

    const issues = [];
    const h = box ? Math.round(box.height) : 0;
    const w = box ? Math.round(box.width) : 0;
    const bg = rgbToHex(styles.bg);

    if (h < 50 || h > 62) issues.push(`height=${h}px (expected ~56)`);
    if (viewport.width >= 768 && (w < 220 || w > 300)) issues.push(`width=${w}px (expected ~260)`);
    if (!bg.startsWith('#00') && !bg.startsWith('#003')) issues.push(`bg=${bg} (expected blue)`);
    if (bg === '#ffffff' || bg === '#fff') issues.push(`WHITE background!`);
    if (bg.toLowerCase().includes('c86') || bg.toLowerCase().includes('c8604a')) issues.push(`CORAL background!`);

    // Check logo img exists and is visible
    const logo = await btn.locator('img.booking-com-button__logo').first();
    const logoVisible = await logo.isVisible().catch(() => false);
    if (!logoVisible) issues.push('logo img NOT visible');

    // Check label exists
    const labelEl = await btn.locator('.booking-com-button__label').first();
    const labelText = await labelEl.textContent().catch(() => '');
    if (!labelText.toLowerCase().includes('check')) issues.push(`label="${labelText}" (expected "Check prices")`);

    // Check for circular shape
    const br = styles.br;
    if (br && (br.includes('50%') || (parseInt(br) > 30 && parseInt(br) < 999))) {
      issues.push(`border-radius=${br} (looks circular/pill)`);
    }

    const id = `${label}[${i}] @${viewport.label}`;
    if (issues.length > 0) {
      failures.push(`FAIL ${id}: ${issues.join(', ')}`);
    } else {
      pass.push(`OK   ${id}: ${w}×${h} bg=${bg}`);
    }
  }

  // Take screenshot
  const slug = label.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${slug}-${viewport.label}.png`),
    fullPage: false,
  });

  return { failures, pass, count: buttons.length };
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let totalFail = 0;
  let totalPass = 0;
  let totalButtons = 0;

  console.log('\n══ Booking.com Button Visual Audit ══\n');

  for (const vp of VIEWPORTS) {
    for (const pg of TEST_PAGES) {
      try {
        const { failures, pass, count } = await auditPage(page, pg.url, pg.label, vp);
        totalButtons += count;
        totalFail += failures.length;
        totalPass += pass.length;

        if (failures.length > 0) {
          console.log(`\n❌ ${pg.label} @ ${vp.label} (${count} buttons):`);
          failures.forEach(f => console.log('  ' + f));
        } else {
          console.log(`✓  ${pg.label} @ ${vp.label} (${count} buttons) — all OK`);
        }
      } catch (e) {
        console.log(`⚠  ${pg.label} @ ${vp.label}: ERROR — ${e.message}`);
        totalFail++;
      }
    }
  }

  await browser.close();

  console.log('\n══ FINAL AUDIT REPORT ══');
  console.log(`BOOKING.COM CTAS AUDITED     : ${totalButtons}`);
  console.log(`BUTTONS PASSING              : ${totalPass}`);
  console.log(`FAILURES                     : ${totalFail}`);
  console.log(`Screenshots saved to         : ${SCREENSHOT_DIR}`);

  if (totalFail === 0) {
    console.log('\n✅ PASS — All buttons visually correct.\n');
    process.exit(0);
  } else {
    console.log('\n❌ FAIL — See issues above.\n');
    process.exit(1);
  }
})();
