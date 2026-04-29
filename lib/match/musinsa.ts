import type { MatchProvider } from "./types";

// 무신사는 공식 API 가 없고, JS 렌더링 + anti-bot 으로 단순 fetch 가 차단됨.
// 추후 Playwright 워커로 별도 프로세스에서 스크래핑하도록 구현 예정.
// 현재는 placeholder — ready() = false 로 응답하면 라우트에서 스킵.
export const musinsaProvider: MatchProvider = {
  source: "MUSINSA",
  ready() {
    return false;
  },
  async search() {
    return [];
  },
};
