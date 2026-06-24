import type { NextConfig } from 'next';
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Load repo-root .env so GOOGLE_CLIENT_ID (backend) is available to the UI without duplicating secrets.
const repoRoot = path.resolve(__dirname, '..');
loadEnvConfig(repoRoot);

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
  process.env.GOOGLE_CLIENT_ID?.trim() ||
  '';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: googleClientId,
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
