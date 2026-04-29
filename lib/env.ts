function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  authSecret: () => required("AUTH_SECRET"),
  groqApiKey: () => required("GROQ_API_KEY"),

  google: {
    id: () => optional("AUTH_GOOGLE_ID"),
    secret: () => optional("AUTH_GOOGLE_SECRET"),
  },
  kakao: {
    id: () => optional("AUTH_KAKAO_ID"),
    secret: () => optional("AUTH_KAKAO_SECRET"),
  },
  naver: {
    id: () => optional("AUTH_NAVER_ID"),
    secret: () => optional("AUTH_NAVER_SECRET"),
  },
  supabase: {
    url: () => optional("SUPABASE_URL"),
    serviceRoleKey: () => optional("SUPABASE_SERVICE_ROLE_KEY"),
    storageBucket: () => process.env.SUPABASE_STORAGE_BUCKET || "clothing",
  },
};
