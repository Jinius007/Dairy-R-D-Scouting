import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dairy R&D Scouting',
    short_name: 'Dairy R&D',
    description:
      'A running repository of research and development across the global dairy sector.',
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: '#e8f0fb',
    theme_color: '#0f766e',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
