import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/:key([a-f0-9]{16,64}).txt", destination: "/api/indexnow?key=:key" }];
  },
};

export default nextConfig;
