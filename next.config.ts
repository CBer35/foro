
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tenor.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configure the body parser to allow larger request bodies (e.g., for file uploads)
  // This applies to API routes and can influence Server Actions.
  // Note: Vercel (and other platforms) might have their own higher-level limits.
  // For Hobby plan on Vercel, the limit is 4.5MB for Serverless Functions.
  // For Pro plan, it can be configured up to a certain extent.
  // Setting this too high can have performance/security implications.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Adjust this value as needed, e.g., '10mb', '50mb'
    },
  },
};

export default nextConfig;
