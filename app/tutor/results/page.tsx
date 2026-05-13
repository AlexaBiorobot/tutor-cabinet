import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionProfile } from "@/lib/supabase/data";

export default async function ResultsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");

  return (
    <AppShell title="Results" eyebrow="Tutor workspace" userName={profile?.full_name} userRole={profile?.role}>
      <Card>
        <CardHeader>
          <CardTitle>Quiz and review results</CardTitle>
          <CardDescription>Your quiz attempts, scores, and open answer feedback will be shown here.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next step: connect this page to quiz attempts and trainer reviews.
        </CardContent>
      </Card>
    </AppShell>
  );
}
