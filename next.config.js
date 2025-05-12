/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: "/paulyoon.xyz",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
