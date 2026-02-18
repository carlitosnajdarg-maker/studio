
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Activa el modo estático para que funcione en el Firebase Hosting gratuito (Plan Spark)
  output: 'export',
  images: {
    unoptimized: true, // Necesario para el modo estático
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
