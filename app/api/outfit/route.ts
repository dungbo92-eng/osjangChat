import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface CreateBody {
  itemIds: string[];
  contextPlace?: string | null;
  contextWeather?: unknown;
  savedToLookbook?: boolean;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const body = (await req.json()) as CreateBody;
  if (!Array.isArray(body.itemIds) || body.itemIds.length === 0) {
    return NextResponse.json({ error: "itemIds 가 비어있음" }, { status: 400 });
  }

  // 본인 옷만 통과
  const owned = await prisma.clothingItem.findMany({
    where: { userId, id: { in: body.itemIds } },
    select: { id: true },
  });
  if (owned.length === 0) {
    return NextResponse.json({ error: "본인 소유 아이템 없음" }, { status: 400 });
  }

  const outfit = await prisma.outfit.create({
    data: {
      userId,
      contextPlace: body.contextPlace ?? null,
      contextWeather: (body.contextWeather as object | null) ?? undefined,
      contextTime: new Date(),
      savedToLookbook: body.savedToLookbook ?? true,
      items: {
        create: owned.map((o) => ({ itemId: o.id })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ outfit });
}
