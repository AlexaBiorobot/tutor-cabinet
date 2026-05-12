import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ExternalLink, FileText, PlayCircle, Video } from "lucide-react";
import { registerForWebinar } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { ProgressRing } from "@/components/progress-ring";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateReadiness } from "@/lib/readiness";
import { getSessionProfile, getTutorDashboardData } from "@/lib/supabase/data";
import { formatDateTime, formatDuration } from "@/lib/utils";

export default async function TutorDashboard() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");

  const { paths, modules, moduleProgress, webinars, webinarRegistrations } = await getTutorDashboardData(user.id);
  const assignedPaths = paths;
  const tutorModuleProgress = moduleProgress;
  const tutorWebinars = webinarRegistrations;
  const upcomingWebinars = webinars.map((webinar) => ({
    webinar,
    registration: tutorWebinars.find((item) => item.webinarId === webinar.id)
  }));

  return (
    <AppShell
      title="Tutor training dashboard"
      eyebrow="Tutor workspace"
      userName={profile?.full_name}
      userRole={profile?.role}
    >
      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="grid gap-5">
          {assignedPaths.map((path) => {
            if (!path) return null;
            const readiness = calculateReadiness({
              path,
              modules,
              moduleProgress: tutorModuleProgress,
              webinarRegistrations: tutorWebinars
            });

            return (
              <Card key={path.id}>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{path.title}</CardTitle>
                    <CardDescription className="mt-2">{path.description}</CardDescription>
                  </div>
                  <ProgressRing value={readiness.percent} />
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <StatusPill status={readiness.status} />
                    <span className="text-sm text-muted-foreground">
                      {readiness.completedRequired} of {readiness.totalRequired} required steps complete
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {path.steps
                      .sort((a, b) => a.order - b.order)
                      .map((step) => {
                        const module = modules.find((item) => item.id === step.moduleId);
                        const webinar = webinars.find((item) => item.id === step.webinarId);
                        const progress = tutorModuleProgress.find((item) => item.moduleId === step.moduleId);
                        const registration = tutorWebinars.find((item) => item.webinarId === step.webinarId);
                        const status = progress?.status ?? registration?.status ?? "not_started";

                        return (
                          <div
                            key={step.id}
                            className="grid gap-3 rounded-md border bg-background p-4 md:grid-cols-[1fr_auto] md:items-center"
                          >
                            <div className="flex gap-3">
                              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary">
                                {step.type === "module" ? (
                                  <PlayCircle className="h-4 w-4" />
                                ) : (
                                  <CalendarDays className="h-4 w-4" />
                                )}
                              </span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-medium">{module?.title ?? webinar?.title}</h3>
                                  {step.required ? (
                                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                                      Required
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {module?.summary ?? webinar?.description}
                                </p>
                                {module?.quizId ? (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Quiz required for completion
                                  </p>
                                ) : null}
                                {module ? (
                                  <div className="mt-3 grid gap-3">
                                    {module.imageUrl ? (
                                      <img
                                        src={module.imageUrl}
                                        alt=""
                                        className="max-h-44 w-full rounded-md border object-cover md:max-w-xl"
                                      />
                                    ) : null}
                                    {module.videoUrl ? (
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Button asChild size="sm" variant="outline">
                                          <a href={module.videoUrl} target="_blank" rel="noreferrer">
                                            <Video className="h-4 w-4" />
                                            Open video
                                          </a>
                                        </Button>
                                      </div>
                                    ) : null}
                                    {module.resourceLinks.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {module.resourceLinks.map((link, index) => (
                                          <Button key={link} asChild size="sm" variant="secondary">
                                            <a href={link} target="_blank" rel="noreferrer">
                                              <FileText className="h-4 w-4" />
                                              Material {index + 1}
                                            </a>
                                          </Button>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              <StatusPill status={status} />
                              {step.type === "module" ? (
                                <Button asChild size="sm" variant={status === "passed" ? "secondary" : "default"}>
                                  <Link href={`/tutor/modules/${module?.id}`}>
                                    {status === "passed" ? <CheckCircle2 className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                    {status === "passed" ? "Review" : "Continue"}
                                  </Link>
                                </Button>
                              ) : registration ? (
                                <Button asChild size="sm">
                                  <a href={webinar?.meetingLink}>
                                    <ExternalLink className="h-4 w-4" />
                                    Join
                                  </a>
                                </Button>
                              ) : (
                                <form action={registerForWebinar}>
                                  <input type="hidden" name="webinarId" value={webinar?.id} />
                                  <Button size="sm" variant="outline">Register</Button>
                                </form>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-5 content-start">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming webinars</CardTitle>
              <CardDescription>Registration unlocks the join link.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {upcomingWebinars.map(({ webinar, registration }) => (
                <div key={webinar.id} className="rounded-md border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{webinar.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(webinar.startsAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {webinar.trainer} - {formatDuration(webinar.durationMinutes)}
                      </p>
                    </div>
                    <StatusPill status={registration?.status ?? "not_started"} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    {registration ? (
                      <Button asChild size="sm">
                        <a href={webinar.meetingLink}>
                          <ExternalLink className="h-4 w-4" />
                          Join
                        </a>
                      </Button>
                    ) : (
                      <form action={registerForWebinar}>
                        <input type="hidden" name="webinarId" value={webinar.id} />
                        <Button size="sm" variant="outline">Register</Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Readiness rules</CardTitle>
              <CardDescription>Required webinars must be attended before readiness can move to ready.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Quiz revision or a missed required webinar will keep the path blocked until an admin updates the status.
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
