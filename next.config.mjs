/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ffmpeg-static', 'node-cron', '@prisma/client', 'prisma'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/production.db'],
  },
};

export default nextConfig;
