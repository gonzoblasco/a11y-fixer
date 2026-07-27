import { chromium, type Browser, type Page } from 'playwright';
import type { AuthenticatedRoute } from './config.schema.js';

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
 * Apply authentication to a page before navigating to an authenticated route.
 *
 * Supports three auth types:
 * - cookie: sets a cookie on the page context
 * - header: sets extra HTTP headers for all requests
 * - token: sets an Authorization header
 *
 * For cookies, the domain is extracted from the target URL.
 */
export async function applyAuth(
  page: Page,
  auth: AuthenticatedRoute['auth'],
  targetUrl: string,
): Promise<void> {
  switch (auth.type) {
    case 'cookie': {
      const hostname = new URL(targetUrl).hostname;
      const cookies = auth.value.split(';').map((pair) => {
        const [name, ...rest] = pair.trim().split('=');
        return {
          name: name.trim(),
          value: rest.join('=').trim(),
          domain: hostname,
          path: '/',
        };
      });
      await page.context().addCookies(cookies);
      break;
    }

    case 'header': {
      const headers: Record<string, string> = {};
      for (const line of auth.value.split('\n')) {
        const [name, ...rest] = line.split(':');
        if (name && rest.length > 0) {
          headers[name.trim()] = rest.join(':').trim();
        }
      }
      await page.setExtraHTTPHeaders(headers);
      break;
    }

    case 'token': {
      await page.setExtraHTTPHeaders({
        Authorization: `Bearer ${auth.value}`,
      });
      break;
    }
  }
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
