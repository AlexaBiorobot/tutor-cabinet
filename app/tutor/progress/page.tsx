import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionProfile } from "@/lib/supabase/data";

export default async function MyProgressPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");

  return (
    <AppShell title="My Progress" eyebrow="Tutor workspace" userName={profile?.full_name} userRole={profile?.role}>
      <Card>
        <CardHeader>
          <CardTitle>Progress overview</CardTitle>
          <CardDescription>Your module progress and completion status will be shown here.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next step: connect this page to module assignments and block progress.
        </CardContent>
      </Card>
    </AppShell>
  );
}
