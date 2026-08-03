declare module "next-pwa" {
  import type { NextConfig } from "next";
  
  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    buildExcludes?: (string | RegExp)[];
    cacheStartUrl?: boolean;
    dynamicStartUrl?: boolean;
    dynamicStartUrlRedirect?: string;
    fallbacks?: Record<string, string>;
    cacheOnFrontEndNav?: boolean;
    subdomainPrefix?: string;
    reloadOnOnline?: boolean;
    customWorkerDir?: string;
  }

  function withPWA(
    config?: PWAConfig
  ): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}
