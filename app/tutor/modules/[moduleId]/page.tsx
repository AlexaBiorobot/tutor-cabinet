import { redirect } from "next/navigation";
import { CheckCircle2, ExternalLink, FileText, Video } from "lucide-react";
import { completeModule } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionProfile, getTutorModuleData } from "@/lib/supabase/data";

export default async function TutorModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");

  const { module, progress } = await getTutorModuleData(user.id, moduleId);
  if (!module) redirect("/tutor");

  const status = progress?.status ?? "not_started";

  return (
    <AppShell
      title={module.title}
      eyebrow="Training module"
      userName={profile?.full_name}
      userRole={profile?.role}
      backHref="/tutor"
      backLabel="Tutor dashboard"
    >
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription className="mt-2">{module.summary}</CardDescription>
              </div>
              <StatusPill status={status} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            {module.imageUrl ? (
              <img src={module.imageUrl} alt="" className="max-h-80 w-full rounded-md border object-cover" />
            ) : null}
            {module.body ? (
              <div className="whitespace-pre-wrap text-sm leading-6 text-foreground">{module.body}</div>
            ) : null}
            {module.videoUrl ? (
              <Button asChild className="w-fit">
                <a href={module.videoUrl} target="_blank" rel="noreferrer">
                  <Video className="h-4 w-4" />
                  Open video
                </a>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Completion</CardTitle>
              <CardDescription>Mark the module complete when the content is reviewed.</CardDescription>
            </CardHeader>
            <CardContent>
              {status === "passed" ? (
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Complete
                </div>
              ) : (
                <form action={completeModule}>
                  <input type="hidden" name="moduleId" value={module.id} />
                  <Button type="submit" className="w-full">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark complete
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {module.resourceLinks.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Materials</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {module.resourceLinks.map((link, index) => (
                  <Button key={link} asChild variant="outline" className="justify-start">
                    <a href={link} target="_blank" rel="noreferrer">
                      <FileText className="h-4 w-4" />
                      Material {index + 1}
                      <ExternalLink className="ml-auto h-4 w-4" />
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
