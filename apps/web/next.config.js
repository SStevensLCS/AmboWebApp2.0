/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ambo/database", "@ambo/utils"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Rewrite /register API calls to /oauth/register for MCP OAuth compatibility.
  // Claude.ai ignores OAuth metadata endpoints and constructs paths at the root.
  // The /register page.tsx still serves GET requests normally.
  async rewrites() {
    return [
      {
        source: "/register",
        destination: "/oauth/register",
        has: [{ type: "header", key: "content-type", value: "application/json" }],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;
