import { describe, expect, it } from 'vitest';
import type { Config } from './config.schema.js';
import { detectRouteFromFile, resolveRoutes } from './route-resolver.js';

const defaultConfig: Config = {
  level: 'AA',
  max_impact: 'serious',
  max_new_violations: 5,
  routes: { core: ['/'] },
  ai: { enabled: false },
};

describe('detectRouteFromFile', () => {
  it('returns / for root page', () => {
    expect(detectRouteFromFile('src/app/page.tsx')).toBe('/');
  });

  it('returns /dashboard for nested page', () => {
    expect(detectRouteFromFile('src/app/dashboard/page.tsx')).toBe('/dashboard');
  });

  it('handles deeply nested routes', () => {
    expect(detectRouteFromFile('src/app/dashboard/settings/profile/page.tsx')).toBe(
      '/dashboard/settings/profile',
    );
  });

  it('handles dynamic segments', () => {
    expect(detectRouteFromFile('src/app/projects/[id]/page.tsx')).toBe('/projects/:id');
  });

  it('handles multiple dynamic segments', () => {
    expect(detectRouteFromFile('src/app/orgs/[orgId]/repos/[repoId]/page.tsx')).toBe(
      '/orgs/:orgId/repos/:repoId',
    );
  });

  it('returns null for API routes', () => {
    expect(detectRouteFromFile('src/app/api/auth/login/route.ts')).toBeNull();
  });

  it('returns null for non-page files', () => {
    expect(detectRouteFromFile('src/app/layout.tsx')).toBeNull();
    expect(detectRouteFromFile('src/app/loading.tsx')).toBeNull();
    expect(detectRouteFromFile('src/app/error.tsx')).toBeNull();
  });

  it('returns null for files outside src/app/', () => {
    expect(detectRouteFromFile('src/components/button.tsx')).toBeNull();
    expect(detectRouteFromFile('src/lib/utils.ts')).toBeNull();
  });

  it('handles page.js and page.jsx extensions', () => {
    expect(detectRouteFromFile('src/app/about/page.js')).toBe('/about');
    expect(detectRouteFromFile('src/app/contact/page.jsx')).toBe('/contact');
  });

  it('handles page.ts extension', () => {
    expect(detectRouteFromFile('src/app/blog/page.ts')).toBe('/blog');
  });
});

describe('resolveRoutes', () => {
  it('returns core routes when no files changed', () => {
    const config: Config = {
      ...defaultConfig,
      routes: { core: ['/', '/login', '/dashboard'] },
    };
    expect(resolveRoutes(config, [])).toEqual(['/', '/dashboard', '/login']);
  });

  it('includes detected routes from changed files', () => {
    const config: Config = {
      ...defaultConfig,
      routes: { core: ['/'] },
    };
    const changedFiles = ['src/app/settings/page.tsx', 'src/app/profile/page.tsx'];
    expect(resolveRoutes(config, changedFiles)).toEqual(['/', '/profile', '/settings']);
  });

  it('deduplicates core and detected routes', () => {
    const config: Config = {
      ...defaultConfig,
      routes: { core: ['/', '/dashboard'] },
    };
    const changedFiles = ['src/app/dashboard/page.tsx', 'src/app/settings/page.tsx'];
    expect(resolveRoutes(config, changedFiles)).toEqual(['/', '/dashboard', '/settings']);
  });

  it('ignores non-page files in changed files', () => {
    const config: Config = {
      ...defaultConfig,
      routes: { core: ['/'] },
    };
    const changedFiles = [
      'src/components/button.tsx',
      'src/lib/utils.ts',
      'src/app/api/health/route.ts',
    ];
    expect(resolveRoutes(config, changedFiles)).toEqual(['/']);
  });

  it('handles empty changed files array', () => {
    expect(resolveRoutes(defaultConfig, [])).toEqual(['/']);
  });

  it('normalizes core routes', () => {
    const config: Config = {
      ...defaultConfig,
      routes: { core: ['login', 'dashboard/'] },
    };
    expect(resolveRoutes(config, [])).toEqual(['/dashboard', '/login']);
  });

  it('sorts routes alphabetically', () => {
    const config: Config = {
      ...defaultConfig,
      routes: { core: ['/', '/zzz', '/aaa'] },
    };
    expect(resolveRoutes(config, [])).toEqual(['/', '/aaa', '/zzz']);
  });
});
