import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Crawling rules are not access control; Clerk still protects app routes.
      disallow: [
        '/sign-in', '/sign-up', '/auth', '/api', '/trpc',
        '/school', '/verify', '/role',
        '/home', '/homes', '/drives', '/requests', '/chats', '/rides',
        '/settings', '/admin',
      ],
    },
    sitemap: 'https://carpschool.ca/sitemap.xml',
  };
}
