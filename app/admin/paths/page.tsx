import { BookOpenCheck, Plus, Route, UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { addTrainingPathStep, assignTrainingPath, createModuleWithQuiz, createTrainingPath } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminPathData, getSessionProfile } from "@/lib/supabase/data";

export default async function AdminPathsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/tutor");

  const { paths: trainingPaths, modules, webinars, tutors, assignments } = await getAdminPathData();

  return (
    <AppShell
      title="Training paths and content"
      eyebrow="Curriculum builder"
      userName={profile?.full_name}
      userRole={profile?.role}
    >
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          {trainingPaths.map((path) => {
            const pathAssignments = assignments.filter((item) => item.pathId === path.id);
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
                      {pathAssignments.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No tutors assigned yet</span>
                      ) : null}
                      {pathAssignments.map((assignment) => (
                        <span key={assignment.tutorId} className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold">
                          {assignment.tutorName}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {trainingPaths.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No training paths yet</CardTitle>
                <CardDescription>Create the first path using the form on the right.</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-5 content-start">
          <Card>
            <CardHeader>
              <CardTitle>Create path</CardTitle>
              <CardDescription>Build ordered module and webinar requirements.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createTrainingPath} className="grid gap-3">
                <label className="grid gap-1 text-sm font-medium">
                  Title
                  <input name="title" required className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Description
                  <textarea name="description" className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <Button type="submit">
                  <Plus className="h-4 w-4" />
                  Create path
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create module</CardTitle>
              <CardDescription>Add self-paced content and an optional first quiz question.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createModuleWithQuiz} className="grid gap-3">
                <label className="grid gap-1 text-sm font-medium">
                  Module title
                  <input name="title" required className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Summary
                  <textarea name="summary" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Content
                  <textarea name="body" className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Estimated minutes
                  <input name="estimatedMinutes" type="number" min="1" defaultValue="15" className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>

                <div className="mt-2 border-t pt-3">
                  <h3 className="text-sm font-semibold">Optional quiz</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Leave these blank to create content without a quiz.</p>
                </div>
                <label className="grid gap-1 text-sm font-medium">
                  Quiz title
                  <input name="quizTitle" className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Passing score
                  <input name="passingScore" type="number" min="1" max="100" defaultValue="80" className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Question
                  <textarea name="questionPrompt" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Option A
                  <input name="optionA" className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Option B
                  <input name="optionB" className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Option C
                  <input name="optionC" className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Correct option
                  <select name="correctOption" className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                    <option value="0">Option A</option>
                    <option value="1">Option B</option>
                    <option value="2">Option C</option>
                  </select>
                </label>
                <Button type="submit" variant="outline">
                  <Plus className="h-4 w-4" />
                  Create module
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
              <form action={assignTrainingPath} className="grid gap-3">
                <select name="tutorId" required className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {tutors.map((tutor) => (
                    <option key={tutor.id} value={tutor.id}>{tutor.name}</option>
                  ))}
                </select>
                <select name="pathId" required className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {trainingPaths.map((path) => (
                    <option key={path.id} value={path.id}>{path.title}</option>
                  ))}
                </select>
                <Button type="submit" variant="secondary" disabled={tutors.length === 0 || trainingPaths.length === 0}>
                  <UserPlus className="h-4 w-4" />
                  Assign tutor
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add path step</CardTitle>
              <CardDescription>Add a module or required webinar to a path.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={addTrainingPathStep} className="grid gap-3">
                <select name="pathId" required className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {trainingPaths.map((path) => (
                    <option key={path.id} value={path.id}>{path.title}</option>
                  ))}
                </select>
                <select name="stepTarget" required className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Choose module or webinar</option>
                  {modules.map((module) => (
                    <option key={module.id} value={`module:${module.id}`}>Module - {module.title}</option>
                  ))}
                  {webinars.map((webinar) => (
                    <option key={webinar.id} value={`webinar:${webinar.id}`}>Webinar - {webinar.title}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input name="required" type="checkbox" defaultChecked className="h-4 w-4" />
                  Required step
                </label>
                <Button type="submit" variant="outline" disabled={trainingPaths.length === 0}>
                  <Plus className="h-4 w-4" />
                  Add step
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
