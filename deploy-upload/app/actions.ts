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

  redirect("/tutor");
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
