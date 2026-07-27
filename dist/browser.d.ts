import { type Browser, type Page } from 'playwright';
import type { AuthenticatedRoute } from './config.schema.js';
export interface BrowserManager {
    browser: Browser;
    page: Page;
}
/**
 * Create a headless Chromium browser instance.
 * Configures sensible defaults for CI environments.
 */
export declare function createBrowser(): Promise<Browser>;
/**
 * Create a new page with sensible defaults.
 */
export declare function createPage(browser: Browser): Promise<Page>;
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
export declare function applyAuth(page: Page, auth: AuthenticatedRoute['auth'], targetUrl: string): Promise<void>;
/**
 * Navigate to a URL and wait for the page to load.
 * Throws on timeout or navigation failure.
 */
export declare function navigateToRoute(page: Page, url: string): Promise<void>;
/**
 * Close the browser and clean up resources.
 */
export declare function closeBrowser(browser: Browser): Promise<void>;
//# sourceMappingURL=browser.d.ts.map