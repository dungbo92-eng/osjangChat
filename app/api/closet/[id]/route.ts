import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await ctx.params;

  const item = await prisma.clothingItem.findUnique({ where: { id } });
  if (!item || item.userId !== session.user.id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Storage 객체 키 추출 (publicUrl 마지막 segments)
  const match = item.imageUrl.match(/\/object\/public\/[^/]+\/(.+)$/);
  if (match) {
    await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([match[1]]);
  }

  await prisma.clothingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
