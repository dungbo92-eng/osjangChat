import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      // Supabase Storage public URLs (Phase 2 에서 호스트 추가)
      { protocol: "https", hostname: "**.supabase.co" },
      // OG 이미지 추출 시 임의 호스트 — 보안상 운영 시 좁히기 권장
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
