# Vercel 배포 가이드

로컬 검증이 끝났다면 이 문서를 따라 Vercel 무료 티어로 배포할 수 있습니다.

## 사전 준비

- [x] GitHub 계정
- [x] Vercel 계정 (https://vercel.com — GitHub로 가입 가능)
- [x] 로컬에서 `npm run dev` 정상 동작
- [x] `.env.local` 채워져 있음

---

## 1. GitHub 에 코드 push

이 워크트리(`E:\osjangChat\.claude\worktrees\peaceful-lalande-519194`) 에서:

```bash
git status              # 변경사항 확인
git add -A
git commit -m "phase 1-6 prototype"
```

GitHub 에 새 저장소(예: `osjang-chat`)를 만들고:

```bash
git remote add origin https://github.com/<your-id>/osjang-chat.git
git branch -M main
git push -u origin main
```

> ⚠️ **`.env.local` 와 `.env` 가 push 되지 않는지 확인** — `.gitignore` 에 이미 막혀있지만 `git status` 에서 다시 봐주세요.

---

## 2. Vercel 에 import

1. https://vercel.com/new
2. GitHub 저장소 선택 → `osjang-chat` Import
3. **Framework Preset**: Next.js (자동 감지)
4. **Root Directory**: 그대로 (저장소 루트)
5. **Build Command**: `npm run build` (자동, postinstall 에서 prisma generate 됨)
6. **Environment Variables** 추가 (아래 표 참고)
7. **Deploy** 클릭

### 필수 환경변수

| 키 | 값 | 출처 |
|---|---|---|
| `DATABASE_URL` | `.env.local` 그대로 | Supabase Pooler (6543) |
| `DIRECT_URL` | `.env.local` 그대로 | Supabase Direct (5432) |
| `AUTH_SECRET` | `.env.local` 그대로 | (재사용) |
| `AUTH_URL` | `https://<your-vercel-domain>.vercel.app` | **3번 단계 후에 채움** |
| `AUTH_TRUST_HOST` | `true` | Auth.js 가 Vercel 도메인 신뢰 |
| `GROQ_API_KEY` | `.env.local` 그대로 | |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | `.env.local` 그대로 | |
| `SUPABASE_URL` | `.env.local` 그대로 | |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` 그대로 | |
| `SUPABASE_STORAGE_BUCKET` | `clothing` | |
| `NAVER_SEARCH_CLIENT_ID` / `_SECRET` | `.env.local` 그대로 | |

> 💡 **팁**: Vercel 대시보드의 환경변수 입력란에 `.env.local` 한 번에 붙여넣으면 자동 파싱됨.

---

## 3. 첫 배포 후 — OAuth Redirect URI 갱신

Vercel 이 `https://<random>.vercel.app` 도메인을 부여합니다. 이걸 OAuth 측에 등록해야 로그인이 됩니다.

### Google Cloud Console
https://console.cloud.google.com/apis/credentials → OAuth 클라이언트 → 편집
- **승인된 리디렉션 URI** 에 추가:
  ```
  https://<your-domain>.vercel.app/api/auth/callback/google
  ```

### (선택) Naver / Kakao
같은 방식으로 콜백 URL 등록.

### Vercel 환경변수 갱신
- `AUTH_URL` 을 실제 배포 도메인으로 설정
- Vercel 대시보드 → Settings → Environment Variables → 저장 후 **Redeploy**

---

## 4. 배포 검증

1. `https://<your-domain>.vercel.app` 접속
2. Google 로그인 라운드트립
3. 옷 업로드 (Supabase Storage 동작 확인)
4. 챗 메시지 + 위치 권한 (HTTPS 라 모바일에서도 잘 됨)
5. 코디 저장, 매칭 검색 — 모든 기능 정상

---

## Troubleshooting

### `prisma generate` 가 빌드에서 실패
`postinstall` 스크립트가 `package.json` 에 있는지 확인. Vercel 은 install 단계에서 자동 실행.

### `auth/error` URLMismatch
Google Console 의 redirect URI 와 Vercel 배포 도메인이 다름 → URI 추가 후 OAuth 재시도.

### Supabase Storage CORS
public 버킷이라 일반적으로 문제 없음. 만약 image load 가 막히면 Supabase → Storage → Policies 점검.

### Cold start 가 느림
Vercel 무료 티어 + Prisma + Pooler 첫 호출이 ~1.5s. 정상.

### Groq Vision 모델 ID 변경
`lib/ai/groq.ts` 의 `DEFAULT_VISION_MODEL` 상수 수정 후 재배포.

---

## 비용 (예상)

| 서비스 | 사용량 | 비용 |
|---|---|---|
| Vercel | Hobby (무료) | 0원 |
| Supabase | 500MB DB + 1GB Storage 무료 | 0원 |
| Groq | 14,400 req/day 무료 | 0원 |
| Naver Search | 25,000 req/day 무료 | 0원 |

**프로토타입 월 0원** 유지 가능.
