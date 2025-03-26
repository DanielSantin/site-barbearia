/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ["mongoose"],
  },
  // I'm removing output: 'export' as recommended since your app uses server features
};

export default nextConfig;