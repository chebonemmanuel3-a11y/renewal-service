const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/renew", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    // Step 1: Login
    await page.goto("https://dashboard.katabump.com/auth/login", { waitUntil: "networkidle2" });
    await page.type("input[type=email]", "YOUR_EMAIL");       // email field
    await page.type("input[type=password]", "YOUR_PASSWORD"); // password field
    await page.click("button[type=submit]");                  // login button
    await page.waitForNavigation();

    // Step 2: Dashboard
    await page.goto("https://dashboard.katabump.com/dashboard", { waitUntil: "networkidle2" });

    // Step 3: Click the red "See" button
    await page.click("button.btn.btn-danger"); // red 'See' button
    await page.waitForNavigation();

    // Step 4: Scroll and click "Renew"
    await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
    await page.click("button.btn.btn-primary"); // adjust if Renew button has a different class
    await page.waitForTimeout(2000);

    await browser.close();
    res.send("✅ Katabump server renewed successfully!");
  } catch (err) {
    console.error("Renewal failed:", err);
    res.status(500).send("❌ Renewal failed: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Renewal service running on port ${PORT}`);
});
