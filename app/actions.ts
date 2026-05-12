"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  redirect(profile?.role === "admin" ? "/admin" : "/tutor");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function registerForWebinar(formData: FormData) {
  const webinarId = String(formData.get("webinarId") ?? "");
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !webinarId) redirect("/login");

  await supabase.from("webinar_registrations").insert({
    tutor_id: user.id,
    webinar_id: webinarId,
    status: "registered"
  });

  revalidatePath("/tutor");
}

export async function markAttendance(formData: FormData) {
  const registrationId = String(formData.get("registrationId") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!registrationId || !status) return;

  await supabase
    .from("webinar_registrations")
    .update({
      status,
      attendance_marked_by: user.id,
      attendance_marked_at: new Date().toISOString()
    })
    .eq("id", registrationId);

  revalidatePath("/admin");
  revalidatePath("/admin/webinars");
}

export async function createWebinar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("webinars").insert({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    trainer: String(formData.get("trainer") ?? ""),
    starts_at: new Date(String(formData.get("startsAt") ?? "")).toISOString(),
    duration_minutes: Number(formData.get("durationMinutes") ?? 60),
    capacity: Number(formData.get("capacity") ?? 20),
    meeting_link: String(formData.get("meetingLink") ?? ""),
    created_by: user.id
  });

  revalidatePath("/admin/webinars");
}

export async function createTrainingPath(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!title) return;

  await supabase.from("training_paths").insert({
    title,
    description,
    created_by: user.id
  });

  revalidatePath("/admin");
  revalidatePath("/admin/paths");
}

export async function createModuleWithQuiz(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const resourceLinks = String(formData.get("resourceLinks") ?? "")
    .split(/\r?\n/)
    .map((link) => link.trim())
    .filter(Boolean);
  const estimatedMinutes = Number(formData.get("estimatedMinutes") ?? 15);
  const quizTitle = String(formData.get("quizTitle") ?? "").trim();
  const questionPrompt = String(formData.get("questionPrompt") ?? "").trim();
  const optionA = String(formData.get("optionA") ?? "").trim();
  const optionB = String(formData.get("optionB") ?? "").trim();
  const optionC = String(formData.get("optionC") ?? "").trim();
  const correctOption = String(formData.get("correctOption") ?? "0");
  const passingScore = Number(formData.get("passingScore") ?? 80);
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!title) return;

  const { data: module } = await supabase
    .from("modules")
    .insert({
      title,
      summary,
      body,
      video_url: videoUrl || null,
      image_url: imageUrl || null,
      resource_links: resourceLinks,
      estimated_minutes: estimatedMinutes,
      created_by: user.id
    })
    .select("id")
    .single();

  if (module?.id && quizTitle && questionPrompt && optionA && optionB) {
    const { data: quiz } = await supabase
      .from("quizzes")
      .insert({
        module_id: module.id,
        title: quizTitle,
        passing_score: passingScore
      })
      .select("id")
      .single();

    if (quiz?.id) {
      const { data: question } = await supabase
        .from("quiz_questions")
        .insert({
          quiz_id: quiz.id,
          prompt: questionPrompt,
          position: 1
        })
        .select("id")
        .single();

      if (question?.id) {
        const options = [optionA, optionB, optionC].filter(Boolean);
        await supabase.from("quiz_options").insert(
          options.map((label, index) => ({
            question_id: question.id,
            label,
            is_correct: String(index) === correctOption,
            position: index + 1
          }))
        );
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/paths");
  revalidatePath("/tutor");
}

export async function assignTrainingPath(formData: FormData) {
  const tutorId = String(formData.get("tutorId") ?? "");
  const pathId = String(formData.get("pathId") ?? "");
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!tutorId || !pathId) return;

  await supabase.from("path_assignments").upsert(
    {
      tutor_id: tutorId,
      training_path_id: pathId,
      assigned_by: user.id
    },
    { onConflict: "tutor_id,training_path_id" }
  );

  revalidatePath("/admin");
  revalidatePath("/admin/paths");
}

export async function addTrainingPathStep(formData: FormData) {
  const pathId = String(formData.get("pathId") ?? "");
  const stepTarget = String(formData.get("stepTarget") ?? "");
  const required = formData.get("required") === "on";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!pathId || !stepTarget) return;

  const [stepType, targetId] = stepTarget.split(":");
  if ((stepType !== "module" && stepType !== "webinar") || !targetId) return;

  const { count } = await supabase
    .from("training_path_steps")
    .select("id", { count: "exact", head: true })
    .eq("training_path_id", pathId);

  await supabase.from("training_path_steps").insert({
    training_path_id: pathId,
    step_type: stepType,
    module_id: stepType === "module" ? targetId : null,
    webinar_id: stepType === "webinar" ? targetId : null,
    is_required: required,
    position: (count ?? 0) + 1
  });

  revalidatePath("/admin");
  revalidatePath("/admin/paths");
}
