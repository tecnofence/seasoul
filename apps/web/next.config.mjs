/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { remotePatterns: [{ hostname: 'files.seasoul.ao', protocol: 'https' }] },
}

export default nextConfig
