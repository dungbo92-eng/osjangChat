import type { ExternalMatch, MatchProvider } from "./types";

// Naver Shopping Open API
// https://developers.naver.com/docs/serviceapi/search/shopping/shopping.md
// 무료 25,000 req/day. 별도 "검색" 권한이 있는 앱 필요.

interface NaverShoppingItem {
  title: string;          // 검색 강조 마크업 포함 — 제거 필요
  link: string;
  image: string;
  lprice: string;         // 최저가, "0" 가능
  hprice: string;
  mallName: string;
  productId: string;
  brand: string;
  maker: string;
  category1?: string;
  category2?: string;
}

function stripTags(s: string): string {
  return s.replace(/<\/?b>/g, "").replace(/&amp;/g, "&");
}

export const naverShoppingProvider: MatchProvider = {
  source: "NAVER",
  ready() {
    return Boolean(
      process.env.NAVER_SEARCH_CLIENT_ID && process.env.NAVER_SEARCH_CLIENT_SECRET,
    );
  },
  async search(query: string, limit: number): Promise<ExternalMatch[]> {
    const cid = process.env.NAVER_SEARCH_CLIENT_ID;
    const csec = process.env.NAVER_SEARCH_CLIENT_SECRET;
    if (!cid || !csec) return [];

    const url = new URL("https://openapi.naver.com/v1/search/shop.json");
    url.searchParams.set("query", query);
    url.searchParams.set("display", String(Math.min(limit, 20)));
    url.searchParams.set("sort", "sim");

    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": cid,
        "X-Naver-Client-Secret": csec,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Naver Shopping ${res.status}: ${text.slice(0, 200)}`);
    }
    const j = (await res.json()) as { items?: NaverShoppingItem[] };
    return (j.items ?? []).slice(0, limit).map((it) => {
      const price = parseInt(it.lprice, 10);
      return {
        source: "NAVER" as const,
        url: it.link,
        imageUrl: it.image,
        title: stripTags(it.title),
        price: Number.isFinite(price) && price > 0 ? price : undefined,
        brand: it.brand || it.maker || it.mallName || undefined,
      };
    });
  },
};
