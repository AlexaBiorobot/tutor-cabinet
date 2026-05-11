import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, CalendarCheck, Plus, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProgressRing } from "@/components/progress-ring";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateReadiness } from "@/lib/readiness";
import { getAdminDashboardData, getSessionProfile } from "@/lib/supabase/data";

export default async function AdminDashboard() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/tutor");

  const { rows: assignmentRows, modules, moduleProgress, webinarRegistrations } = await getAdminDashboardData();
  const rows = assignmentRows.map(({ tutor, path }) => {
    if (!path) return null;
    const readiness = calculateReadiness({
      path,
      modules,
      moduleProgress: moduleProgress.filter((item) => item.tutorId === tutor.id),
      webinarRegistrations: webinarRegistrations.filter((item) => item.tutorId === tutor.id)
    });

    return { tutor, path, readiness };
  }).filter(Boolean);

  const readyCount = rows.filter((row) => row?.readiness.status === "ready").length;
  const revisionCount = rows.filter((row) => row?.readiness.status === "needs_revision").length;
  const averageCompletion =
    rows.length === 0 ? 0 : Math.round(rows.reduce((sum, row) => sum + (row?.readiness.percent ?? 0), 0) / rows.length);

  return (
    <AppShell title="Admin readiness overview" eyebrow="Admin workspace">
      <section className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Assigned paths</CardTitle>
            <CardDescription>Active tutor assignments</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{rows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ready tutors</CardTitle>
            <CardDescription>All required steps complete</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{readyCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Needs revision</CardTitle>
            <CardDescription>Blocked by quiz or attendance</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{revisionCount}</CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Progress by tutor</CardTitle>
              <CardDescription>Readiness is computed from required modules, quizzes, and webinars.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/paths">
                <Plus className="h-4 w-4" />
                New path
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tutor</th>
                    <th className="px-4 py-3 font-medium">Training path</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-card">
                  {rows.map((row) =>
                    row ? (
                      <tr key={`${row.tutor.id}-${row.path.id}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{row.tutor.name}</div>
                          <div className="text-xs text-muted-foreground">{row.tutor.email}</div>
                        </td>
                        <td className="px-4 py-3">{row.path.title}</td>
                        <td className="px-4 py-3">
                          {row.readiness.completedRequired}/{row.readiness.totalRequired} required
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={row.readiness.status} />
                        </td>
                      </tr>
                    ) : null
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 content-start">
          <Card>
            <CardHeader>
              <CardTitle>Admin actions</CardTitle>
              <CardDescription>Create content and manage live training.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/admin/paths">
                  <BarChart3 className="h-4 w-4" />
                  Manage paths
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/admin/webinars">
                  <CalendarCheck className="h-4 w-4" />
                  Mark attendance
                </Link>
              </Button>
              <Button variant="outline" className="justify-start">
                <UserPlus className="h-4 w-4" />
                Assign tutors
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average completion</CardTitle>
              <CardDescription>Across active assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressRing value={averageCompletion} />
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
