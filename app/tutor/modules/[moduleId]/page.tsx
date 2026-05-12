import { redirect } from "next/navigation";
import { CheckCircle2, ExternalLink, FileText, Send, Video } from "lucide-react";
import { completeModule, submitModuleQuiz } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionProfile, getTutorModuleData } from "@/lib/supabase/data";

export default async function TutorModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");

  const { module, progress, quiz } = await getTutorModuleData(user.id, moduleId);
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
            {quiz ? (
              <div className="border-t pt-5">
                <h2 className="text-lg font-semibold">{quiz.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Passing score: {quiz.passingScore}%</p>
                <form action={submitModuleQuiz} className="mt-4 grid gap-4">
                  <input type="hidden" name="moduleId" value={module.id} />
                  <input type="hidden" name="quizId" value={quiz.id} />
                  {quiz.questions.map((question, questionIndex) => (
                    <fieldset key={question.id} className="rounded-md border bg-background p-4">
                      <legend className="px-1 text-sm font-semibold">
                        {questionIndex + 1}. {question.prompt}
                      </legend>
                      <div className="mt-3 grid gap-2">
                        {question.options.map((option) => (
                          <label key={option.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <input required type="radio" name={`question_${question.id}`} value={option.id} />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <Button type="submit" className="w-fit">
                    <Send className="h-4 w-4" />
                    Submit quiz
                  </Button>
                </form>
              </div>
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
              ) : quiz ? (
                <p className="text-sm text-muted-foreground">Pass the quiz to complete this module.</p>
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
