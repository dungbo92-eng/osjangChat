import { prisma } from "@/lib/prisma";

const CATEGORY_LABEL: Record<string, string> = {
  TOP: "상의",
  BOTTOM: "하의",
  OUTER: "외투",
  SHOES: "신발",
  ACC: "악세서리",
};

/**
 * LLM system prompt 에 주입할 옷장 요약 텍스트.
 * - 80벌 이하: 각 아이템에 [item:ID] 마커 포함 → LLM 이 추천 시 그대로 인용 가능.
 * - 80벌 초과: 카테고리 카운트만 압축 (마커 생략).
 */
export async function buildClosetContext(userId: string): Promise<string> {
  const items = await prisma.clothingItem.findMany({
    where: { userId, type: "OWNED" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  if (items.length === 0) {
    return "사용자의 옷장은 아직 비어 있습니다. 옷을 등록하라고 안내해도 좋습니다.";
  }

  if (items.length > 80) {
    const counts: Record<string, number> = {};
    for (const it of items) {
      const cat = CATEGORY_LABEL[it.category] || it.category;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const summary = Object.entries(counts)
      .map(([k, v]) => `${k} ${v}벌`)
      .join(", ");
    return `사용자의 옷장 요약: 총 ${items.length}벌 (${summary}). (개별 ID 생략 — 너무 많음)`;
  }

  const byCat: Record<string, string[]> = {};
  for (const it of items) {
    const cat = CATEGORY_LABEL[it.category] || it.category;
    const desc = [
      it.colors.join("/") || null,
      it.style.join("/") || null,
    ]
      .filter(Boolean)
      .join(", ");
    (byCat[cat] ??= []).push(`[item:${it.id}] ${desc || "(미분류)"}`);
  }

  const lines = Object.entries(byCat).map(
    ([cat, descs]) => `- ${cat}:\n  ${descs.join("\n  ")}`,
  );
  return ["사용자가 보유한 옷 목록:", ...lines].join("\n");
}

export const CHAT_SYSTEM_PROMPT_BASE = `너는 한국어로 답하는 친근한 패션 코디 어시스턴트 "옷장 챗"이다.

응답 규칙:
- 사용자의 실제 옷장 보유 아이템을 인지하고, 가능하면 그 안에서 추천한다.
- 추천하는 옷이 옷장 목록에 있으면 반드시 [item:ID] 마커를 본문에 그대로 포함시켜라. (예: "흰 티 [item:cm123abc] 와 청바지 [item:cm456def] 추천")
- 옷장에 없는 외부 아이템을 언급할 땐 마커를 쓰지 말고 일반 텍스트로만.
- 너무 길게 늘어놓지 말고, 핵심 추천 + 짧은 이유 위주로.
- 모르는 정보(날씨, 일정 등)는 사용자에게 한 번에 하나씩 짧게 묻는다.
- 마크다운 헤더 남발 금지. 자연스러운 대화체.`;
