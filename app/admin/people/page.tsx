import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionProfile } from "@/lib/supabase/data";

export default async function PeoplePage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/tutor");

  return (
    <AppShell title="People" eyebrow="Admin workspace" userName={profile?.full_name} userRole={profile?.role}>
      <Card>
        <CardHeader>
          <CardTitle>Tutor management</CardTitle>
          <CardDescription>People table, filters, bulk actions, and CSV upload will live here.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next step: connect this page to profiles, tutor groups, and bulk import validation.
        </CardContent>
      </Card>
    </AppShell>
  );
}
