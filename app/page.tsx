import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="flex max-w-xl flex-col items-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">옷장 챗</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          내 옷장과 대화하는 AI 코디 추천. 사진 한 장만 올리면 자동 태깅하고,
          오늘 날씨에 어울리는 코디를 골라드립니다.
        </p>
        <div className="flex gap-3">
          {session?.user ? (
            <>
              <Button asChild size="lg">
                <Link href="/chat">채팅 시작</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/closet">옷장 보기</Link>
              </Button>
            </>
          ) : (
            <Button asChild size="lg">
              <Link href="/login">로그인하고 시작하기</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
