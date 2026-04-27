/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  optimizePackageImports: ['@stripe/stripe-js'],
};

module.exports = nextConfig;
