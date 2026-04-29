import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatView, type ItemSummary } from "@/components/chat/chat-view";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [recent, items] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.clothingItem.findMany({
      where: { userId, type: "OWNED" },
      select: { id: true, imageUrl: true, category: true, colors: true },
    }),
  ]);

  const initial = recent
    .reverse()
    .filter((m) => m.role !== "system")
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const itemMap: Record<string, ItemSummary> = {};
  for (const it of items) {
    itemMap[it.id] = {
      id: it.id,
      imageUrl: it.imageUrl,
      category: it.category,
      colors: it.colors,
    };
  }

  return <ChatView initial={initial} itemMap={itemMap} />;
}
