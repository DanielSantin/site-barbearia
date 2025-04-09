/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {}, 
  },
  serverExternalPackages: ["mongoose"], 
};

export default nextConfig;