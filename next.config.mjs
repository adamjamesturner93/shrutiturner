/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.ngrok-free.app"],
  cacheComponents: true,
  reactStrictMode: true,
};

export default nextConfig;
