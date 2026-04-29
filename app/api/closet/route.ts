import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";
import { Category, ItemType } from "@prisma/client";
import { getAiProvider } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

function isValidCategory(v: string): v is Category {
  return v in Category;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const items = await prisma.clothingItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const categoryRaw = String(form.get("category") || "");
  const type = String(form.get("type") || "OWNED");
  const sourceUrl = String(form.get("sourceUrl") || "") || null;
  const autoTag = String(form.get("autoTag") || "1") === "1";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file 필수" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: `이미지 타입 허용: ${ALLOWED_MIME.join(", ")}` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "파일이 8MB 를 초과했습니다." }, { status: 400 });
  }
  if (type !== "OWNED" && type !== "WISH") {
    return NextResponse.json({ error: "type 은 OWNED|WISH" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const objectKey = `${session.user.id}/${crypto.randomUUID()}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sb = supabaseAdmin();
  const upload = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(objectKey, bytes, { contentType: file.type, upsert: false });

  if (upload.error) {
    return NextResponse.json(
      { error: `업로드 실패: ${upload.error.message}` },
      { status: 500 },
    );
  }

  const { data: pub } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(objectKey);

  // 자동 태깅 (Groq Vision)
  let finalCategory: Category | null = isValidCategory(categoryRaw) ? categoryRaw : null;
  let colors: string[] = [];
  let style: string[] = [];
  let season: string[] = [];

  if (autoTag) {
    try {
      const tags = await getAiProvider().tagClothing({ imageUrl: pub.publicUrl });
      if (!finalCategory && isValidCategory(tags.category)) {
        finalCategory = tags.category;
      }
      colors = Array.isArray(tags.colors) ? tags.colors.slice(0, 5) : [];
      style = Array.isArray(tags.style) ? tags.style.slice(0, 5) : [];
      season = Array.isArray(tags.season) ? tags.season.slice(0, 4) : [];
    } catch (e) {
      console.error("[closet] auto-tag failed:", e);
      // 태깅 실패해도 업로드는 살린다
    }
  }

  if (!finalCategory) {
    // 자동 태깅 실패 + 사용자가 카테고리 미지정 → 기본값
    finalCategory = "TOP" as Category;
  }

  const item = await prisma.clothingItem.create({
    data: {
      userId: session.user.id,
      type: type as ItemType,
      category: finalCategory,
      imageUrl: pub.publicUrl,
      sourceUrl,
      colors,
      style,
      season,
    },
  });

  return NextResponse.json({ item });
}
