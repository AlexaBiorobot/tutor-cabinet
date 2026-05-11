import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { signIn } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use the tutor or admin account created in Supabase Auth.</CardDescription>
        </CardHeader>
        <CardContent>
          {params?.error ? (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {params.error}
            </div>
          ) : null}
          <form action={signIn} className="grid gap-3">
            <label className="grid gap-1 text-sm font-medium">
              Email
              <input
                name="email"
                type="email"
                required
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="name@example.com"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Password
              <input
                name="password"
                type="password"
                required
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="password"
              />
            </label>
            <Button type="submit" className="mt-2">Sign in</Button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <Link href="/tutor" className="text-primary hover:underline">Tutor preview</Link>
            <Link href="/admin" className="text-primary hover:underline">Admin preview</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
