import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { UploadForm } from "@/components/closet/upload-form";
import { ItemCard } from "@/components/closet/item-card";
import { OutfitBuilder } from "@/components/closet/outfit-builder";

const FILTERS = [
  { value: "", label: "전체" },
  { value: "TOP", label: "상의" },
  { value: "BOTTOM", label: "하의" },
  { value: "OUTER", label: "외투" },
  { value: "SHOES", label: "신발" },
  { value: "ACC", label: "악세서리" },
] as const;

const CATEGORY_VALUES = ["TOP", "BOTTOM", "OUTER", "SHOES", "ACC"] as const;
type Cat = (typeof CATEGORY_VALUES)[number];

function isCategory(v: string): v is Cat {
  return (CATEGORY_VALUES as readonly string[]).includes(v);
}

export default async function ClosetPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id;
  const { cat = "" } = await searchParams;
  const where = isCategory(cat) ? { userId, category: cat } : { userId };

  const items = await prisma.clothingItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">옷장</h1>
        <p className="mt-1 text-sm text-zinc-500">
          등록된 옷 {items.length}벌
          {cat && ` (필터: ${FILTERS.find((f) => f.value === cat)?.label})`}
        </p>
      </header>

      <UploadForm />

      <OutfitBuilder
        items={items
          .filter((i) => i.type === "OWNED")
          .map((i) => ({ id: i.id, imageUrl: i.imageUrl, category: i.category }))}
      />

      <nav className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (f.value || "") === cat;
          return (
            <Link
              key={f.value}
              href={f.value ? `/closet?cat=${f.value}` : "/closet"}
              className={`rounded-full border px-3 py-1 text-sm ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            아직 등록된 옷이 없습니다. 위 폼에서 추가해보세요.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={{
                id: item.id,
                imageUrl: item.imageUrl,
                category: item.category,
                type: item.type,
                colors: item.colors,
                style: item.style,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
