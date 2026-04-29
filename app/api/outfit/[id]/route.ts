import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await ctx.params;

  const outfit = await prisma.outfit.findUnique({ where: { id } });
  if (!outfit || outfit.userId !== session.user.id) {
    return new NextResponse("Not Found", { status: 404 });
  }
  await prisma.outfit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
