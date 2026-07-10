const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Read a sample chart JSON from the backend or mock it
  const chart = {
    metadata: { calculationTimeMs: 100 },
    planets: [{ name: 'Sun', sign: 'Aries', degree: 10, house: 1, retrograde: false }],
    houses: [],
    aspects: []
  };

  const result = await page.evaluate((chartData) => {
    try {
      localStorage.setItem('astra:chart_response', JSON.stringify(chartData));
      const saved = localStorage.getItem('astra:chart_response');
      return { success: !!saved, error: null };
    } catch (e) {
      return { success: false, error: e.toString() };
    }
  }, chart);

  console.log('LocalStorage Save Result:', result);

  await browser.close();
})();
