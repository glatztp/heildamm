import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@{{projectName}}/ui"],
};

export default nextConfig;
