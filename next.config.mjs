/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.ngrok-free.app", "*.trycloudflare.com"],
  cacheComponents: true,
  redirects() {
    // Programme discovery is paused. Keep payment confirmations and member access available.
    return [
      { source: "/programmes", destination: "/coaching", permanent: false },
      { source: "/programmes/:slug", destination: "/coaching", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.ctfassets.net" },
      { protocol: "https", hostname: "images.contentful.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
