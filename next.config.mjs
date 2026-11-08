/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ffmpeg-static', 'node-cron', '@prisma/client', 'prisma'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/production.db'],
    '/api/video/render': ['./node_modules/ffmpeg-static/**/*'],
    '/api/video/render/route': ['./node_modules/ffmpeg-static/**/*'],
  },
};

export default nextConfig;
