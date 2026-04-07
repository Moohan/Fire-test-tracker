import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^\/procedures\/.*$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'eic-procedures-v1',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
};

export default withPWA(nextConfig);
