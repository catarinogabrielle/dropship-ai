/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ffmpeg-static', 'bullmq', 'ioredis', 'node-cron'],
};

export default nextConfig;
