import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OutfitDeleteButton } from "@/components/lookbook/outfit-delete-button";

export const dynamic = "force-dynamic";

export default async function LookbookPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const outfits = await prisma.outfit.findMany({
    where: { userId, savedToLookbook: true },
    include: { items: { include: { item: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">코디북</h1>
        <p className="mt-1 text-sm text-zinc-500">저장된 코디 {outfits.length}개</p>
      </header>

      {outfits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            <p className="mb-3">아직 저장된 코디가 없습니다.</p>
            <Button asChild variant="outline">
              <Link href="/closet">옷장에서 코디 만들기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {outfits.map((o) => (
            <Card key={o.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {o.contextPlace || new Date(o.createdAt).toLocaleDateString("ko-KR")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {o.items.map((oi) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={oi.itemId}
                      src={oi.item.imageUrl}
                      alt={oi.item.category}
                      className="aspect-square w-full rounded object-cover"
                    />
                  ))}
                </div>
                <div className="mt-3 flex justify-end">
                  <OutfitDeleteButton id={o.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
