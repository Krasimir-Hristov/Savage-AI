import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false, // Security: don't expose X-Powered-By header
  images: {
    remotePatterns: [
      // Placeholder for future character avatars (Supabase Storage, CDN, etc.)
      // Example: { protocol: 'https', hostname: '**.supabase.co' }
    ],
  },
};

export default nextConfig;
