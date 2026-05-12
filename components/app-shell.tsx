import Link from "next/link";
import { ArrowLeft, BookOpenCheck, CalendarDays, GraduationCap, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/tutor", label: "Tutor", icon: GraduationCap },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/admin/webinars", label: "Webinars", icon: CalendarDays },
  { href: "/admin/paths", label: "Paths", icon: BookOpenCheck }
];

export function AppShell({
  children,
  title,
  eyebrow,
  userName,
  userRole,
  backHref,
  backLabel = "Back"
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
  userName?: string;
  userRole?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card p-5 lg:block">
        <Link href="/tutor" className="flex items-center gap-3 text-lg font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </span>
          Tutor Readiness
        </Link>
        <nav className="mt-8 grid gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        {userName ? (
          <div className="absolute bottom-5 left-5 right-5 rounded-md border bg-background p-3">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs capitalize text-muted-foreground">{userRole}</p>
            <form action={signOut} className="mt-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </form>
          </div>
        ) : null}
      </aside>
      <main className="lg:pl-64">
        <header className="border-b bg-card">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6">
            {backHref ? (
              <Button asChild variant="ghost" size="sm" className="w-fit px-0 text-muted-foreground hover:bg-transparent">
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
              </Button>
            ) : null}
            <p className="text-sm font-medium text-primary">{eyebrow}</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-5 py-6">{children}</div>
      </main>
    </div>
  );
}
