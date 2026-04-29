import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

// Naver Developers OAuth 2.0
// https://developers.naver.com/docs/login/api/api.md
export interface NaverProfile {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email?: string;
    name?: string;
    nickname?: string;
    profile_image?: string;
  };
}

export function naverProvider(
  options: OAuthUserConfig<NaverProfile>,
): OAuthConfig<NaverProfile> {
  return {
    id: "naver",
    name: "Naver",
    type: "oauth",
    authorization: {
      url: "https://nid.naver.com/oauth2.0/authorize",
      params: { response_type: "code" },
    },
    token: "https://nid.naver.com/oauth2.0/token",
    userinfo: "https://openapi.naver.com/v1/nid/me",
    profile(profile) {
      const r = profile.response;
      return {
        id: r.id,
        name: r.name ?? r.nickname ?? null,
        email: r.email ?? null,
        image: r.profile_image ?? null,
      };
    },
    style: { logo: "/naver.svg", bg: "#03C75A", text: "#fff" },
    options,
  };
}
