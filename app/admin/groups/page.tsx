import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionProfile } from "@/lib/supabase/data";

export default async function GroupsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/tutor");

  return (
    <AppShell title="Groups" eyebrow="Admin workspace" userName={profile?.full_name} userRole={profile?.role}>
      <Card>
        <CardHeader>
          <CardTitle>Tutor groups and segments</CardTitle>
          <CardDescription>Create manual groups and use them for bulk module assignment.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next step: add group create/edit/archive and group membership management.
        </CardContent>
      </Card>
    </AppShell>
  );
}
