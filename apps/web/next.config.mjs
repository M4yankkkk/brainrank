/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@brainrank/engine", "@brainrank/tokens"]
};

export default nextConfig;
