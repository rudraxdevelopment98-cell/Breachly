/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the shared workspace packages from source.
  transpilePackages: ['@aegis/crypto', '@aegis/types'],
};

export default nextConfig;
