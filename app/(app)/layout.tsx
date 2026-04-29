import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/chat", label: "채팅" },
  { href: "/closet", label: "옷장" },
  { href: "/lookbook", label: "코디북" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-1">
      <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/" className="mb-6 px-2 text-lg font-semibold">
          옷장 챗
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="px-2 text-xs text-zinc-500">{session.user.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              로그아웃
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
