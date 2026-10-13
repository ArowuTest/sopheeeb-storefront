import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables a trusted Manus Preview URL to establish the Next development websocket.
  allowedDevOrigins: [
    "3000-i4zvprzhywpqzkoe3m1df-5a3ddb93.us1.manus.computer",
    "127.0.0.1",
    "localhost",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
