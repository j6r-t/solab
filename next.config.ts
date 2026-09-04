import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost:3000',
    'clubby-halina-subadministratively.ngrok-free.dev', // Your current ngrok URL
    
    // Add more ngrok URLs as needed:
    // 'your-ngrok-url.ngrok-free.dev',
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
