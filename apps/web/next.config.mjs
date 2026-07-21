import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the shared workspace packages from source.
  transpilePackages: ['@aegis/crypto', '@aegis/types'],
  webpack: (config) => {
    // libsodium-wrappers-sumo ships a broken ESM entry (it imports a sibling
    // .mjs that isn't packaged). Force the working CJS build for the bundler.
    config.resolve.alias['libsodium-wrappers-sumo'] = require.resolve(
      'libsodium-wrappers-sumo',
    );
    return config;
  },
};

export default nextConfig;
