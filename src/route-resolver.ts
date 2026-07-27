import type { Config } from './config.schema.js';

/**
 * Resolve the list of routes to scan for a given PR.
 *
 * Combines core routes (always scanned) with routes detected
 * from the list of changed files. Deduplicates and returns
 * a sorted list of unique routes.
 */
export function resolveRoutes(config: Config, changedFiles: string[]): string[] {
  const routes = new Set<string>();

  // Always include core routes
  for (const route of config.routes.core) {
    routes.add(normalizeRoute(route));
  }

  // Detect routes from changed files
  for (const file of changedFiles) {
    const detected = detectRouteFromFile(file);
    if (detected) {
      routes.add(detected);
    }
  }

  return Array.from(routes).sort();
}

/**
 * Normalize a route: ensure it starts with / and doesn't end with / (except root).
 */
function normalizeRoute(route: string): string {
  let normalized = route.trim();
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * Detect a URL route from a file path, supporting Next.js App Router.
 *
 * Returns the detected route or null if the file is not a page/route.
 */
export function detectRouteFromFile(filePath: string): string | null {
  // Normalize path separators
  const normalized = filePath.replace(/\\/g, '/');

  // Only consider files in src/app/ (Next.js App Router)
  if (!normalized.startsWith('src/app/')) {
    return null;
  }

  // Skip non-page files
  const basename = normalized.split('/').pop() ?? '';
  if (
    !basename.endsWith('page.tsx') &&
    !basename.endsWith('page.ts') &&
    !basename.endsWith('page.jsx') &&
    !basename.endsWith('page.js')
  ) {
    return null;
  }

  // Skip API routes
  if (normalized.includes('/api/')) {
    return null;
  }

  // Extract the route path from src/app/.../page.*
  // src/app/page.tsx → /
  // src/app/dashboard/page.tsx → /dashboard
  // src/app/projects/[id]/page.tsx → /projects/:id
  const pageMatch = normalized.match(/^src\/app\/(.+\/)?page\.(tsx|ts|jsx|js)$/);
  if (!pageMatch) {
    return null;
  }

  let routePath = pageMatch[1] ?? '';

  // Remove trailing slash
  if (routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1);
  }

  // Handle dynamic segments: [param] → :param
  routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');

  // Root page
  if (routePath === '') {
    return '/';
  }

  return `/${routePath}`;
}
