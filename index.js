const fs = require('fs');
const puppeteer = require('puppeteer');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const testDir = './test-img/';
const outDir = './out-img/';
const URL = 'https://www.google.com'

function writeImage(filename, image) {
  fs.writeFileSync(`${outDir}/${filename}.png`, PNG.sync.write(image));
}

function compareScreenshots(path1, path2, filename) {
  return new Promise((resolve, reject) => {
    console.log("compareScreenshots", path1, path2)
    const img1 = fs.createReadStream(path1).pipe(new PNG()).on('parsed', doneReading);
    const img2 = fs.createReadStream(path2).pipe(new PNG()).on('parsed', doneReading);

    let filesRead = 0;

    function doneReading() {
      if (++filesRead < 2) return;
      // Do the visual diff.
      const diff = new PNG({ width: img1.width, height: img2.height });
      const numDiffPixels = pixelmatch(
        img1.data, img2.data, diff.data, img1.width, img1.height,
        { threshold: 0.1 });

      writeImage(filename, diff)

      console.log("result: ", numDiffPixels, numDiffPixels / (1600 * 1200))
      resolve();
    }
  });
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function takeScreenshot(page, route) {
  const path = `${testDir}${encodeURIComponent(route)}.png`
  await page.goto(`${URL}${route}`);
  await delay(1000 * 8)
  await page.screenshot({ path });
  return path
}

let browser, page;

async function run() {
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  browser = await puppeteer.launch();
  page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1200 });
  const path1 = await takeScreenshot(page, '/search?q=react');
  const path2 = await takeScreenshot(page, '/search?q=vue');
  await compareScreenshots(path1, path2, "pc")
  // await page.setViewport({ width: 375, height: 800 });
  // const path3 = await takeScreenshot(page, '/search?q=react');
  // const path4 = await takeScreenshot(page, '/search?q=vue');
  // await compareScreenshots(path3, path4, "m")
  // await browser.close()
}

run().then(() => {
  console.log("done")
}).catch((e) => {
  console.error(e)
})


