"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { value: "", label: "자동 분류" },
  { value: "TOP", label: "상의" },
  { value: "BOTTOM", label: "하의" },
  { value: "OUTER", label: "외투" },
  { value: "SHOES", label: "신발" },
  { value: "ACC", label: "악세서리" },
] as const;

const TYPES = [
  { value: "OWNED", label: "내 옷" },
  { value: "WISH", label: "위시" },
] as const;

export function UploadForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return setPreview(null);
    setPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (!(fd.get("file") instanceof File) || (fd.get("file") as File).size === 0) {
      setError("파일을 선택하세요.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/closet", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `업로드 실패 (${res.status})`);
        return;
      }
      formRef.current?.reset();
      setPreview(null);
      router.refresh();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">사진</label>
        <Input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          required
        />
        <p className="text-xs text-zinc-500">
          업로드 후 AI 가 카테고리·색상·스타일을 자동으로 태깅합니다 (5~10초 소요).
        </p>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="mt-2 h-32 w-32 rounded object-cover" />
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium">카테고리</label>
          <select
            name="category"
            defaultValue=""
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium">타입</label>
          <select
            name="type"
            defaultValue="OWNED"
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">원본 URL (위시 등록 시)</label>
        <Input type="url" name="sourceUrl" placeholder="https://..." />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "업로드 + 태깅 중…" : "옷장에 추가"}
      </Button>
    </form>
  );
}
