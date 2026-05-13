import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionProfile } from "@/lib/supabase/data";

export default async function ReviewsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/tutor");

  return (
    <AppShell title="Reviews" eyebrow="Admin workspace" userName={profile?.full_name} userRole={profile?.role}>
      <Card>
        <CardHeader>
          <CardTitle>Open answer reviews</CardTitle>
          <CardDescription>Review submitted open answers and leave trainer feedback.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next step: connect submissions with approved, needs revision, and rejected statuses.
        </CardContent>
      </Card>
    </AppShell>
  );
}
