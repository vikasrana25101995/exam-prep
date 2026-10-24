/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // proxy.js buffers request bodies and silently truncates past this; must exceed the
    // 25MB import limit in src/modules/admin/constants (plus multipart overhead).
    proxyClientMaxBodySize: '30mb',
  },
};

export default nextConfig;
