import { getAiProvider } from "@/lib/ai";
import type { Category } from "@prisma/client";

const CATEGORY_LABEL: Record<Category, string> = {
  TOP: "상의",
  BOTTOM: "하의",
  OUTER: "외투",
  SHOES: "신발",
  ACC: "악세서리",
};

/** 같은 카테고리(=비슷한 옷) 검색용 쿼리 */
export function buildSimilarQuery(item: {
  category: Category;
  colors: string[];
  style: string[];
}): string {
  const parts = [
    item.colors[0],
    item.style[0],
    CATEGORY_LABEL[item.category],
  ].filter(Boolean);
  return parts.join(" ").trim() || CATEGORY_LABEL[item.category];
}

/** "어울리는 X" 코디 보완용 — LLM 으로 1줄 query 생성 */
export async function buildComplementQuery(item: {
  category: Category;
  colors: string[];
  style: string[];
  targetCategory: Category;
}): Promise<string> {
  const provider = getAiProvider();
  const sys = `사용자 옷에 어울리는 다른 카테고리 아이템을 쇼핑몰에서 검색하기 위한 한국어 검색어를 한 줄(최대 15자)로만 만들어라.
형식 규칙:
- 출력은 검색어만. 따옴표·설명·이모지 금지.
- 색상 1개 + 스타일 1개 + 카테고리 형태 권장. 예: "베이지 와이드 슬랙스"`;

  const user = `보유 아이템: ${CATEGORY_LABEL[item.category]} (${[...item.colors, ...item.style].slice(0, 4).join(", ")})
어울리는 카테고리: ${CATEGORY_LABEL[item.targetCategory]}
검색어:`;

  let acc = "";
  for await (const chunk of provider.chatStream(
    [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    { temperature: 0.3 },
  )) {
    acc += chunk;
    if (acc.length > 60) break;
  }
  // 따옴표 제거 + 한 줄로
  return acc
    .split("\n")[0]
    .replace(/["“”']/g, "")
    .trim()
    .slice(0, 30);
}
