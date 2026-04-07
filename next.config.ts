import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/assistants/:id/archive",
        destination: "/api/assistants/:id?action=archive",
      },
      {
        source: "/api/assistants/:id/publish",
        destination: "/api/assistants/:id?action=publish",
      },
      {
        source: "/api/assistants/:id/duplicate",
        destination: "/api/assistants/:id?action=duplicate",
      },
    ];
  },
};

export default nextConfig;
