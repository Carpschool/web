import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Keep this an explicit allowlist: app and authentication pages are private.
  return ['/', '/tos', '/privacy'].map((path) => ({
    url: new URL(path, 'https://carpschool.ca').href,
  }));
}
