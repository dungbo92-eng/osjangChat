import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Category } from "@prisma/client";
import {
  buildComplementQuery,
  buildSimilarQuery,
  matchProviders,
  type ExternalMatch,
} from "@/lib/match";

export const runtime = "nodejs";
export const maxDuration = 60;

interface MatchBody {
  itemId: string;
  mode: "similar" | "complement";
  /** complement 모드일 때 어울릴 카테고리 (없으면 기본 페어 사용) */
  targetCategory?: Category;
  limit?: number;
}

const DEFAULT_PAIR: Record<Category, Category> = {
  TOP: "BOTTOM",
  BOTTOM: "TOP",
  OUTER: "BOTTOM",
  SHOES: "BOTTOM",
  ACC: "TOP",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const body = (await req.json()) as MatchBody;
  if (!body.itemId) {
    return NextResponse.json({ error: "itemId 필요" }, { status: 400 });
  }

  const item = await prisma.clothingItem.findUnique({ where: { id: body.itemId } });
  if (!item || item.userId !== session.user.id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const limit = Math.min(Math.max(body.limit ?? 6, 1), 12);
  let query: string;
  let target: Category | null = null;

  if (body.mode === "complement") {
    target = body.targetCategory ?? DEFAULT_PAIR[item.category];
    query = await buildComplementQuery({
      category: item.category,
      colors: item.colors,
      style: item.style,
      targetCategory: target,
    });
  } else {
    query = buildSimilarQuery({
      category: item.category,
      colors: item.colors,
      style: item.style,
    });
  }

  const ready = matchProviders.filter((p) => p.ready());
  if (ready.length === 0) {
    return NextResponse.json(
      {
        error:
          "활성화된 매칭 provider 가 없습니다. .env.local 에 NAVER_SEARCH_CLIENT_ID/SECRET 을 채워주세요.",
        query,
      },
      { status: 503 },
    );
  }

  const results: ExternalMatch[] = [];
  const errors: { source: string; message: string }[] = [];

  await Promise.all(
    ready.map(async (p) => {
      try {
        const r = await p.search(query, limit);
        results.push(...r);
      } catch (e) {
        errors.push({
          source: p.source,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }),
  );

  // 캐시: ExternalProduct 에 upsert (url unique)
  await Promise.all(
    results.map((r) =>
      prisma.externalProduct.upsert({
        where: { url: r.url },
        update: {
          imageUrl: r.imageUrl,
          title: r.title,
          price: r.price,
        },
        create: {
          source: r.source,
          url: r.url,
          imageUrl: r.imageUrl,
          title: r.title,
          price: r.price,
        },
      }),
    ),
  );

  return NextResponse.json({
    query,
    targetCategory: target,
    results: results.slice(0, limit),
    errors,
  });
}
