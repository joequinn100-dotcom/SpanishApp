import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Packages Next must require from node_modules at runtime rather than bundle.
   *
   * `pdfjs-dist` resolves its worker by path at load time; once bundled, that
   * path points into `.next/server/chunks` where the worker file does not
   * exist, and every PDF upload fails with "Setting up fake worker failed".
   *
   * `better-sqlite3` is a native addon and cannot be bundled at all.
   */
  serverExternalPackages: ['pdfjs-dist', 'better-sqlite3'],
};

export default nextConfig;
