import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PROVIDERS = [
  { id: "google", label: "Google 로 계속하기", variant: "google" as const, env: "AUTH_GOOGLE_ID" },
  { id: "kakao", label: "카카오로 계속하기", variant: "kakao" as const, env: "AUTH_KAKAO_ID" },
  { id: "naver", label: "네이버로 계속하기", variant: "naver" as const, env: "AUTH_NAVER_ID" },
];

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/chat");

  const enabled = PROVIDERS.filter((p) => process.env[p.env]);

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>
            소셜 계정으로 옷장 챗을 시작하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {enabled.length === 0 && (
            <p className="text-sm text-amber-600">
              아직 OAuth provider 가 설정되지 않았습니다. <br />
              <code>.env.local</code> 에 키를 추가하세요.
            </p>
          )}
          {enabled.map((p) => (
            <form
              key={p.id}
              action={async () => {
                "use server";
                await signIn(p.id, { redirectTo: "/chat" });
              }}
            >
              <Button type="submit" variant={p.variant} className="w-full">
                {p.label}
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
