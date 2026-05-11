import { BookOpenCheck, Plus, Route, UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { modules, pathAssignments, trainingPaths, tutors, webinars } from "@/lib/mock-data";
import { getSessionProfile } from "@/lib/supabase/data";

export default async function AdminPathsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/tutor");

  return (
    <AppShell title="Training paths and content" eyebrow="Curriculum builder">
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          {trainingPaths.map((path) => {
            const assignments = pathAssignments.filter((item) => item.pathId === path.id);
            return (
              <Card key={path.id}>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{path.title}</CardTitle>
                    <CardDescription className="mt-2">{path.description}</CardDescription>
                  </div>
                  <StatusPill status="in_progress" />
                </CardHeader>
                <CardContent className="grid gap-5">
                  <div className="grid gap-3">
                    {path.steps
                      .sort((a, b) => a.order - b.order)
                      .map((step) => {
                        const module = modules.find((item) => item.id === step.moduleId);
                        const webinar = webinars.find((item) => item.id === step.webinarId);
                        return (
                          <div key={step.id} className="flex items-center justify-between rounded-md border bg-background p-4">
                            <div className="flex items-start gap-3">
                              <span className="grid h-8 w-8 place-items-center rounded-md bg-secondary">
                                {step.type === "module" ? (
                                  <BookOpenCheck className="h-4 w-4" />
                                ) : (
                                  <Route className="h-4 w-4" />
                                )}
                              </span>
                              <div>
                                <h3 className="font-medium">{module?.title ?? webinar?.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Step {step.order} - {step.type} - {step.required ? "Required" : "Optional"}
                                </p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">Edit</Button>
                          </div>
                        );
                      })}
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Assigned tutors</h3>
                    <div className="flex flex-wrap gap-2">
                      {assignments.map((assignment) => {
                        const tutor = tutors.find((item) => item.id === assignment.tutorId);
                        return tutor ? (
                          <span key={tutor.id} className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold">
                            {tutor.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-5 content-start">
          <Card>
            <CardHeader>
              <CardTitle>Create path</CardTitle>
              <CardDescription>Build ordered module and webinar requirements.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3">
                <label className="grid gap-1 text-sm font-medium">
                  Title
                  <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Description
                  <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <Button type="button">
                  <Plus className="h-4 w-4" />
                  Create path
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assign path</CardTitle>
              <CardDescription>Connect tutors to training paths.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3">
                <select className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {tutors.map((tutor) => (
                    <option key={tutor.id}>{tutor.name}</option>
                  ))}
                </select>
                <select className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {trainingPaths.map((path) => (
                    <option key={path.id}>{path.title}</option>
                  ))}
                </select>
                <Button type="button" variant="secondary">
                  <UserPlus className="h-4 w-4" />
                  Assign tutor
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
