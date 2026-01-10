/** @type {import('next').NextConfig} */

const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Ensure URL has protocol
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: getApiUrl(),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${getApiUrl()}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
