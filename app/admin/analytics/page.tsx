import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionProfile } from "@/lib/supabase/data";

export default async function AnalyticsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/tutor");

  return (
    <AppShell title="Analytics" eyebrow="Admin workspace" userName={profile?.full_name} userRole={profile?.role}>
      <Card>
        <CardHeader>
          <CardTitle>Module analytics</CardTitle>
          <CardDescription>Completion, quiz scores, pass rates, and open answers waiting for review.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next step: aggregate module assignments, block progress, quiz attempts, and open answer submissions.
        </CardContent>
      </Card>
    </AppShell>
  );
}
