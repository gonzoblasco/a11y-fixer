import { chromium, type Browser, type Page } from 'playwright';

const DEFAULT_TIMEOUT = 30_000; // 30 seconds
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };

export interface BrowserManager {
  browser: Browser;
  page: Page;
}

/**
 * Create a headless Chromium browser instance.
 * Configures sensible defaults for CI environments.
 */
export async function createBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
}

/**
 * Create a new page with sensible defaults.
 */
export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewportSize(DEFAULT_VIEWPORT);
  page.setDefaultTimeout(DEFAULT_TIMEOUT);
  page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT);
  return page;
}

/**
 * Navigate to a URL and wait for the page to load.
 * Throws on timeout or navigation failure.
 */
export async function navigateToRoute(page: Page, url: string): Promise<void> {
  const response = await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: DEFAULT_TIMEOUT,
  });

  if (!response) {
    throw new Error(`Navigation to ${url} returned no response`);
  }

  if (!response.ok()) {
    throw new Error(
      `Navigation to ${url} failed with status ${response.status()}`,
    );
  }
}

/**
 * Close the browser and clean up resources.
 */
export async function closeBrowser(browser: Browser): Promise<void> {
  await browser.close();
}
