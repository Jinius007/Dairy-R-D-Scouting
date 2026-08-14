/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async headers() {
    return [
      {
        source: '/dairy-rd-extension.zip',
        headers: [
          { key: 'Content-Type', value: 'application/zip' },
          {
            key: 'Content-Disposition',
            value: 'attachment; filename="dairy-rd-extension.zip"',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
