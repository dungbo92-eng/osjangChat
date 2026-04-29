"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchPanel } from "./match-panel";

interface Item {
  id: string;
  imageUrl: string;
  category: string;
  type: string;
  colors: string[];
  style: string[];
}

const CATEGORY_LABEL: Record<string, string> = {
  TOP: "상의",
  BOTTOM: "하의",
  OUTER: "외투",
  SHOES: "신발",
  ACC: "악세서리",
};

export function ItemCard({ item }: { item: Item }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("삭제할까요?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/closet/${item.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    });
  }

  return (
    <Card className="overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.imageUrl}
        alt={item.category}
        className="aspect-square w-full object-cover"
      />
      <CardContent className="space-y-2 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium">{CATEGORY_LABEL[item.category] || item.category}</span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] dark:bg-zinc-800">
            {item.type === "WISH" ? "위시" : "보유"}
          </span>
        </div>
        {(item.colors.length > 0 || item.style.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {item.colors.slice(0, 3).map((c, i) => (
              <span
                key={`c${i}`}
                className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              >
                {c}
              </span>
            ))}
            {item.style.slice(0, 3).map((s, i) => (
              <span
                key={`s${i}`}
                className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <MatchPanel itemId={item.id} />

        <Button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          variant="ghost"
          size="sm"
          className="w-full justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          {isPending ? "삭제 중…" : "삭제"}
        </Button>
      </CardContent>
    </Card>
  );
}
