// index.js
const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

// Endpoint that cron-job.org will call
// Debug endpoint to see what's on the dashboard (after login)
app.get("/debug-dashboard", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ],
    });
    const page = await browser.newPage();
    
    // Login first
    await page.goto("https://dashboard.katabump.com/auth/login", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    
    await page.waitForSelector('input[name="email"]', { timeout: 30000 });
    await page.type('input[name="email"]', "chebonfavour@gmail.com");
    await page.waitForSelector('input[name="password"]', { timeout: 30000 });
    await page.type('input[name="password"]', "w.9Hx_M7P95Fde9");
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    ]);
    
    // Now go to dashboard
    await page.goto("https://dashboard.katabump.com/", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/katabump-dashboard.png' });
    
    // Get all buttons
    const buttons = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
      return elements.map(el => ({
        tag: el.tagName,
        type: el.type,
        id: el.id,
        className: el.className,
        text: el.textContent?.trim().substring(0, 50),
        onclick: el.onclick ? 'has onclick' : null
      }));
    });
    
    await browser.close();
    
    res.json({ 
      message: "Dashboard debug info retrieved",
      screenshot: "/tmp/katabump-dashboard.png",
      buttons: buttons
    });
  } catch (err) {
    res.status(500).send("Dashboard debug failed: " + err.message);
  }
});

// Debug endpoint to see what's on the login page
app.get("/debug", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ],
    });
    const page = await browser.newPage();
    
    await page.goto("https://dashboard.katabump.com/auth/login", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/katabump-login.png' });
    
    // Get all input fields
    const inputs = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('input'));
      return elements.map(el => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
        className: el.className
      }));
    });
    
    await browser.close();
    
    res.json({ 
      message: "Debug info retrieved",
      screenshot: "/tmp/katabump-login.png",
      inputs: inputs
    });
  } catch (err) {
    res.status(500).send("Debug failed: " + err.message);
  }
});

app.get("/renew", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ],
    });
    const page = await browser.newPage();

    // 1. Go to KataBump login page
    await page.goto("https://dashboard.katabump.com/auth/login", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 2. Wait for and fill in login form
    await page.waitForSelector('input[name="email"]', { timeout: 30000 });
    await page.type('input[name="email"]', "chebonfavour@gmail.com");
    
    await page.waitForSelector('input[name="password"]', { timeout: 30000 });
    await page.type('input[name="password"]', "w.9Hx_M7P95Fde9");

    // 3. Submit login
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    ]);

    // 4. Navigate to server dashboard
    await page.goto("https://dashboard.katabump.com/", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 5. Scroll down to find the "Your servers" table and click the red "See" button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click the "See" link using page.evaluate to find element by text
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const seeLink = links.find(link => link.textContent.trim() === 'See');
      if (!seeLink) throw new Error('See button not found');
      seeLink.click();
    });
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 });

    // 6. On the server page, scroll down to find the "Renew server" button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 7. Click the "Renew server" button
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      const renewButton = elements.find(el => 
        el.textContent.toLowerCase().includes('renew')
      );
      if (!renewButton) throw new Error('Renew button not found');
      renewButton.click();
    });
    
    // Wait a bit to ensure renewal completes
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();

    console.log("✅ Server renewed successfully!");
    res.send("✅ Server renewed successfully!");
  } catch (err) {
    console.error("❌ Renewal failed:", err);
    res.status(500).send("❌ Renewal failed: " + err.message);
  }
});

// Start Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Renewal service running on port ${PORT}`);
});
