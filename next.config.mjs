/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.ngrok-free.app", "*.trycloudflare.com"],
  cacheComponents: true,
  // Preserve existing Link prefetch behaviour during the Next 16.4 upgrade.
  partialPrefetching: false,
  redirects() {
    // Programme discovery is paused. Keep payment confirmations and member access available.
    return [
      { source: "/programmes", destination: "/coaching", permanent: false },
      { source: "/programmes/:slug", destination: "/coaching", permanent: false },
    ];
  },
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    // A response header also covers pages whose child metadata enables indexing.
    if (process.env.VERCEL_ENV !== "production") return [{ source: "/:path*", headers: noindex }];
    return [
      "admin",
      "dashboard",
      "account",
      "auth",
      "login",
      "signup",
      "email",
      "unsubscribe",
      "instructor",
      "r",
      "gift/redeem",
      "retreats/balance",
      "retreats/checkout",
      "retreats/:slug/checkout",
    ].map((path) => ({ source: `/${path}/:path*`, headers: noindex }));
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
