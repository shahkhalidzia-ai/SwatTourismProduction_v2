const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'puppeteer-core'));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const framesDir = path.join(__dirname, '..', 'docs', 'tourist_tour_frames');
if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

let frameIndex = 0;
async function captureFrame(page, label, delayMs = 700) {
  frameIndex++;
  const filename = `frame_${String(frameIndex).padStart(3, '0')}.png`;
  const filepath = path.join(framesDir, filename);
  await new Promise(r => setTimeout(r, delayMs));
  await page.screenshot({ path: filepath, type: 'png' });
  console.log(`[Frame ${frameIndex}] ${label} -> ${filename}`);
  return { frame: frameIndex, filename, label };
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

async function runTour() {
  console.log('Launching browser from:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    defaultViewport: { width: 1366, height: 850 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const manifest = [];

  try {
    // 1. OPEN APP
    console.log('Navigating to http://localhost:5174/?role=tourist...');
    await page.goto('http://localhost:5174/?role=tourist', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    // Ensure Tourist role
    manifest.push(await captureFrame(page, 'Tourist Portal: Home Tab Hero Banner & Overview', 1000));

    // 2. HOME TAB: Scroll through Valleys & Destinations
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
    manifest.push(await captureFrame(page, 'Home: Active Weather Advisories & Featured Valleys', 800));

    await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
    manifest.push(await captureFrame(page, 'Home: Verified Valley Stays & Cultural Attractions', 800));

    // Open Kalam Destination Card
    const clickedKalam = await clickByText(page, 'h3, h4, div, button', 'Kalam');
    if (clickedKalam) {
      await new Promise(r => setTimeout(r, 600));
      manifest.push(await captureFrame(page, 'Destination Modal: Kalam Valley Overview, Live Weather & Photos', 800));
      // Close modal
      await clickByText(page, 'button', 'Close');
      await page.evaluate(() => {
        const xBtn = document.querySelector('svg.lucide-x, button[aria-label="Close"]');
        if (xBtn) xBtn.closest('button')?.click();
      });
      await new Promise(r => setTimeout(r, 400));
    }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 400));

    // 3. EXPLORE TAB
    console.log('Navigating to Explore Tab...');
    await clickByText(page, 'button, a', 'Explore');
    await new Promise(r => setTimeout(r, 900));
    manifest.push(await captureFrame(page, 'Explore Tab: Categories & Verified Listings Catalog', 800));

    // Category filter: Transport
    await clickByText(page, 'button', 'Transport');
    await new Promise(r => setTimeout(r, 600));
    manifest.push(await captureFrame(page, 'Explore Filter: 4x4 Mountain Cruisers & Jeeps'));

    // Category filter: Hotels
    await clickByText(page, 'button', 'Hotels & Stays');
    await new Promise(r => setTimeout(r, 600));
    manifest.push(await captureFrame(page, 'Explore Filter: Verified Luxury Hotels & Riverside Chalets'));

    // Open Hotel Details modal (Swat Serena Hotel)
    const clickedDetails = await clickByText(page, 'button', 'View');
    if (clickedDetails) {
      await new Promise(r => setTimeout(r, 800));
      manifest.push(await captureFrame(page, 'Hotel Details Modal: Swat Serena Rooms, Amenities & Pricing Breakdown', 1000));
      await page.evaluate(() => {
        const xBtn = document.querySelector('svg.lucide-x, button[aria-label="Close"]');
        if (xBtn) xBtn.closest('button')?.click();
      });
      await new Promise(r => setTimeout(r, 400));
    }

    // 4. TRIPS TAB: Itinerary, Bookings & Rate/Reviews
    console.log('Navigating to Trips Tab...');
    await clickByText(page, 'button, a', 'Trips');
    await new Promise(r => setTimeout(r, 1000));
    manifest.push(await captureFrame(page, 'Trips Tab: Multi-Day Swat Itinerary & Stay Planner', 1000));

    // Scroll down in Itinerary to show stops & driver info
    await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
    manifest.push(await captureFrame(page, 'Itinerary Days: Assigned 4x4 Driver, Stay Continuity & Stops'));

    // Test '+ Hotel' modal
    await clickByText(page, 'button', '+ Hotel');
    await new Promise(r => setTimeout(r, 700));
    manifest.push(await captureFrame(page, 'Trip Builder: Add Hotel & Room Type Selector Modal', 800));
    await page.evaluate(() => {
      const xBtn = document.querySelector('svg.lucide-x, button[aria-label="Close"]');
      if (xBtn) xBtn.closest('button')?.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Switch to Sub-tab 2: Bookings View
    await clickByText(page, 'button', 'Bookings');
    await new Promise(r => setTimeout(r, 800));
    manifest.push(await captureFrame(page, 'Trip View 2: Bookings List, Reservation Vouchers & Payment Status', 800));

    // Test Rate & Review modal
    const clickedRate = await clickByText(page, 'button', 'Rate & Review') || await clickByText(page, 'button', 'Conclude Stay');
    if (clickedRate) {
      await new Promise(r => setTimeout(r, 800));
      manifest.push(await captureFrame(page, 'Rate & Review Dialog: Interactive 5-Star Rating, Title & Guest Comments', 1000));
      await page.evaluate(() => {
        const xBtn = document.querySelector('svg.lucide-x, button[aria-label="Close"]');
        if (xBtn) xBtn.closest('button')?.click();
      });
      await new Promise(r => setTimeout(r, 400));
    }

    // Switch to Sub-tab 3: Details & Route
    await clickByText(page, 'button', 'Details & Route');
    await new Promise(r => setTimeout(r, 800));
    manifest.push(await captureFrame(page, 'Trip View 3: Complete Trip Breakdown, Rule 4 Guarantee & Share Text', 800));

    // 5. SAFETY TAB
    console.log('Navigating to Safety Tab...');
    await clickByText(page, 'button, a', 'Safety');
    await new Promise(r => setTimeout(r, 1000));
    manifest.push(await captureFrame(page, 'Safety Tab: Highway & Pass Road Statuses & Weather Advisories', 900));

    // Open SOS Emergency Modal
    await clickByText(page, 'button', 'SOS');
    await new Promise(r => setTimeout(r, 800));
    manifest.push(await captureFrame(page, 'Emergency SOS Modal: Real-Time GPS Distress Alert Dispatch', 900));
    await page.evaluate(() => {
      const xBtn = document.querySelector('svg.lucide-x, button[aria-label="Close"]');
      if (xBtn) xBtn.closest('button')?.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 6. PROFILE TAB
    console.log('Navigating to Profile Tab...');
    await clickByText(page, 'button, a', 'Profile');
    await new Promise(r => setTimeout(r, 1000));
    manifest.push(await captureFrame(page, 'Profile Tab: Tourist Preferences, Budget, Travel Style & Language', 900));

    console.log(`Tour finished successfully! Total frames captured: ${manifest.length}`);
    const manifestPath = path.join(framesDir, 'tour_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('Saved manifest to:', manifestPath);

  } catch (err) {
    console.error('Error during tour execution:', err);
  } finally {
    await browser.close();
  }
}

runTour();
