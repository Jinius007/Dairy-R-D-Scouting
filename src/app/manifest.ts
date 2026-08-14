import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dairy R&D Scouting',
    short_name: 'Dairy R&D',
    description:
      'Daily and weekly dairy R&D briefing for your department. Install once, choose once, no login.',
    start_url: '/digest',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#e8f0fb',
    theme_color: '#0f766e',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
