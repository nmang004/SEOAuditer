const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SWC minification is always enabled in Next.js 15+
  // swcMinify: true, // Removed as it's now default and deprecated
  
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  
  images: {
    domains: ['images.unsplash.com'],
    // Disable image optimization for static export
    unoptimized: true,
  },
  
  webpack: (config, { isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@lib': path.resolve(__dirname, 'src/lib'),
    };

    return config;
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  
  // Output source maps in production for better error tracking
  productionBrowserSourceMaps: true,
  
  // Enable server components
  experimental: {
    // Enable server actions (if needed)
    // serverActions: true,
  },
  
  // Handle trailing slashes for consistent URLs
  trailingSlash: true,
  
  // Disable static optimization for dynamic routes
  output: 'standalone',
};

module.exports = nextConfig;
