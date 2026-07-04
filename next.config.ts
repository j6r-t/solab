import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost:3000',
    'clubby-halina-subadministratively.ngrok-free.dev',
    // ...
  ],
};

export default nextConfig;
