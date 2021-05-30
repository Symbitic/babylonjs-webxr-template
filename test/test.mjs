import fs from 'fs';
import http from 'http';
import path from 'path';
import chalk from 'chalk';
import pixelmatch from 'pixelmatch';
import puppeteer from 'puppeteer';
import { PNG } from 'pngjs';
import handler from 'serve-handler';

const PORT = process.env.PORT || 8080;

process.env.CHROME_BIN = puppeteer.executablePath();

const distDir = path.resolve(process.cwd(), 'dist');
const testDir = path.resolve(process.cwd(), 'test');

const server = http.createServer((req, res) => {
  return handler(req, res, { public: distDir });
});

function imageMatch(expectedFile, actualFile) {
  const expected = PNG.sync.read(fs.readFileSync(expectedFile));
  const actual = PNG.sync.read(fs.readFileSync(actualFile));
  const { width, height } = expected;
  const diff = new PNG({ width, height });
  const pixelDiff = pixelmatch(expected.data, actual.data, diff.data, width, height, { threshold: 0.6 });

  if (pixelDiff > 100) {
      return false;
  }
  return true;
}

async function main() {
  const expectedFile = path.join(testDir, 'expected.png');
  const actualFile = path.join(testDir, 'actual.png');

  server.listen(PORT);

  const browser = await puppeteer.launch({
    dumpio: true,
    args: [
      '--window-size=800,600',
    ],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:8080/');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: actualFile });

  await browser.close();

  const ret = imageMatch(expectedFile, actualFile);
  if (!ret) {
    throw new Error(`Actual image does not match expected image`);
  }
}

main()
  .then(() => {
    console.log(chalk.bold.green(`Test succeeded!`));
    server.close();
    process.exit(0);
  })
  .catch((err) => {
    server.close();
    console.error(chalk.bold.red(`Test failed: ${err.message}!`));
    process.exit(1);
  });
