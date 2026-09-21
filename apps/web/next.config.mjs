/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@brainrank/engine", "@brainrank/tokens", "blobatar", "@blobatar/react"]
};

export default nextConfig;
