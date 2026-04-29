# 옷장 챗 (osjangChat)

내 옷장과 대화하는 AI 코디 추천 웹앱.

- **챗봇**: Groq (Llama 3.3 70B) 스트리밍
- **비전 태깅**: Groq Vision (Llama 4 Scout)
- **임베딩**: 로컬 CLIP via `@xenova/transformers` *(Phase 4)*
- **인증**: Auth.js v5 — Google / Kakao / Naver
- **DB**: Supabase Postgres + pgvector + Prisma 6
- **스택**: Next.js 16 (App Router, Turbopack 기본) · React 19 · TailwindCSS v4

전체 플랜은 `C:/Users/lee/.claude/plans/breezy-herding-locket.md` 참조.

---

## 시작하기

### 1. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 에 다음을 채우세요. **최소한** 다음 4개는 필수:

| 키 | 어디서 받나 |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | [Supabase](https://supabase.com) 프로젝트 → Settings → Database |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `GROQ_API_KEY` | https://console.groq.com/keys (무료) |
| OAuth provider 1개 이상 | Google / Kakao / Naver Developers 콘솔 |

OAuth Redirect URI 는 모두 `http://localhost:3000/api/auth/callback/<provider>` 형식.

### 2. DB 마이그레이션

Supabase 콘솔에서 `pgvector` extension 을 먼저 활성화한 뒤:

```bash
npx prisma migrate dev --name init
```

### 3. 개발 서버

```bash
npm run dev
```

http://localhost:3000

---

## 디렉토리

```
app/
├── (auth)/login/        # 로그인 페이지
├── (app)/               # 인증 필요한 영역 (사이드바 레이아웃)
│   ├── chat/
│   ├── closet/
│   └── lookbook/
└── api/
    ├── auth/[...nextauth]/   # Auth.js 핸들러
    └── chat/                 # Groq 스트리밍 프록시

lib/
├── ai/                  # AI provider 어댑터 (groq.ts / clip 추후)
├── auth/naver-provider.ts
├── prisma.ts
├── env.ts
└── utils.ts

prisma/schema.prisma
auth.ts                  # NextAuth v5 config
```

---

## 단계별 진행 상태

- [x] **Phase 1** — 골격 (Prisma, Auth.js, AI 어댑터)
- [x] **Phase 2** — 옷장 CRUD + Supabase Storage 업로드
- [x] **Phase 3** — Groq 스트리밍 챗 + 옷장 컨텍스트 주입
- [x] **Phase 4** — Groq Vision 자동 태깅 (CLIP 임베딩은 Phase 6 외부 매칭에 필요할 때 도입)
- [x] **Phase 5** — Open-Meteo 날씨 + 룩북 저장 + 챗→코디북 직접 저장
- [x] **Phase 6** — Naver Shopping API 매칭 (Musinsa Playwright 추후)
- [ ] **배포** — Vercel ([DEPLOY.md](./DEPLOY.md) 참고)

---

## 검증 (Phase 1 완료 시점)

1. `.env.local` 채우고 `npm run dev`
2. `/` → "로그인하고 시작하기" 보임
3. `/login` → 설정한 provider 버튼 → OAuth 라운드트립 → `/chat` 진입
4. 사이드바 (채팅·옷장·코디북) + 로그아웃 동작
5. `/closet` 에서 빈 옷장 화면, `/lookbook` 진입 가능
