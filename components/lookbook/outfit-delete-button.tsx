"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OutfitDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("코디를 삭제할까요?")) return;
        start(async () => {
          const res = await fetch(`/api/outfit/${id}`, { method: "DELETE" });
          if (res.ok) router.refresh();
        });
      }}
      className="text-red-600"
    >
      {pending ? "삭제 중…" : "삭제"}
    </Button>
  );
}
