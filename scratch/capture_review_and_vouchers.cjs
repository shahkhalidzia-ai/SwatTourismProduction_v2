const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'puppeteer-core'));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const framesDir = path.join(__dirname, '..', 'docs', 'tourist_tour_frames');

async function captureFrame(page, index, label) {
  const filename = `frame_${String(index).padStart(3, '0')}.png`;
  const filepath = path.join(framesDir, filename);
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: filepath, type: 'png' });
  console.log(`[Frame ${index}] ${label} -> ${filename}`);
  return { frame: index, filename, label };
}

async function clickByText(page, tag, textSub) {
  return page.evaluate((tag, textSub) => {
    const elements = Array.from(document.querySelectorAll(tag));
    const el = elements.find(e => e.textContent && e.textContent.includes(textSub));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.click();
      return true;
    }
    return false;
  }, tag, textSub);
}

async function runExtra() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    defaultViewport: { width: 1366, height: 850 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:5174/?role=tourist', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Go to Trips tab
    await clickByText(page, 'button, a', 'Trips');
    await new Promise(r => setTimeout(r, 900));

    // Go to Bookings tab
    await clickByText(page, 'button', 'Bookings');
    await new Promise(r => setTimeout(r, 900));

    // Open Voucher modal
    const voucherBtn = await clickByText(page, 'button', 'View Voucher');
    if (voucherBtn) {
      await captureFrame(page, 17, 'Booking Reservation Voucher Modal: QR Code, Check-in Code & Policy');
      await page.evaluate(() => {
        const xBtn = document.querySelector('svg.lucide-x, button[aria-label="Close"]');
        if (xBtn) xBtn.closest('button')?.click();
      });
      await new Promise(r => setTimeout(r, 500));
    }

    // Open Rate & Review
    const rateBtn = await clickByText(page, 'button', 'Rate & Review') || await clickByText(page, 'button', 'Conclude Stay');
    if (rateBtn) {
      await captureFrame(page, 18, 'Hotel Stay Review & Rating: Interactive 5-Star Selection & Guest Feedback');
      await page.evaluate(() => {
        const xBtn = document.querySelector('svg.lucide-x, button[aria-label="Close"]');
        if (xBtn) xBtn.closest('button')?.click();
      });
      await new Promise(r => setTimeout(r, 500));
    }

    // Open My Trips / All Trips
    const allTripsBtn = await clickByText(page, 'button', 'All Trips') || await clickByText(page, 'button', 'My Trips');
    if (allTripsBtn) {
      await captureFrame(page, 19, 'My Trips Management: Upcoming vs Past Completed Trips with Direct Review Triggers');
    }

    console.log('Extra frames captured!');
  } finally {
    await browser.close();
  }
}

runExtra();
