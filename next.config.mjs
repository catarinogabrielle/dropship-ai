/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ffmpeg-static', 'bullmq', 'ioredis', 'node-cron', '@prisma/client', 'prisma'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/production.db'],
  },
};

export default nextConfig;
