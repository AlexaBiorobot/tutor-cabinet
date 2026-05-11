import type {
  LearningStatus,
  Module,
  ModuleProgress,
  PathAssignment,
  TrainingPath,
  TrainingPathStep,
  Tutor,
  Webinar,
  WebinarRegistration
} from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type DbPath = {
  id: string;
  title: string;
  description: string;
  training_path_steps?: DbStep[];
};

type DbStep = {
  id: string;
  step_type: "module" | "webinar";
  module_id: string | null;
  webinar_id: string | null;
  is_required: boolean;
  position: number;
};

type DbModule = {
  id: string;
  title: string;
  summary: string;
  estimated_minutes: number;
  quizzes?: { id: string }[];
};

type DbWebinar = {
  id: string;
  title: string;
  description: string;
  trainer: string;
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  meeting_link: string;
};

type DbRegistration = {
  id: string;
  tutor_id: string;
  webinar_id: string;
  status: WebinarRegistration["status"];
  profiles?: { full_name: string; email: string } | null;
};

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

export async function getTutorDashboardData(tutorId: string) {
  const supabase = await createClient();

  const [
    { data: assignmentRows },
    { data: moduleRows },
    { data: progressRows },
    { data: webinarRows },
    { data: registrationRows }
  ] = await Promise.all([
    supabase
      .from("path_assignments")
      .select(
        "tutor_id, training_path_id, training_paths(id, title, description, training_path_steps(id, step_type, module_id, webinar_id, is_required, position))"
      )
      .eq("tutor_id", tutorId),
    supabase.from("modules").select("id, title, summary, estimated_minutes, quizzes(id)"),
    supabase.from("module_progress").select("tutor_id, module_id, status").eq("tutor_id", tutorId),
    supabase.from("webinars").select("id, title, description, trainer, starts_at, duration_minutes, capacity, meeting_link"),
    supabase.from("webinar_registrations").select("id, tutor_id, webinar_id, status").eq("tutor_id", tutorId)
  ]);

  const assignments = (assignmentRows ?? []).map((row: any) => ({
    tutorId: row.tutor_id,
    pathId: row.training_path_id
  })) satisfies PathAssignment[];

  const paths = (assignmentRows ?? [])
    .map((row: any) => mapPath(row.training_paths))
    .filter(Boolean) as TrainingPath[];

  return {
    assignments,
    paths,
    modules: ((moduleRows ?? []) as DbModule[]).map(mapModule),
    moduleProgress: ((progressRows ?? []) as { tutor_id: string; module_id: string; status: LearningStatus }[]).map(
      (row) => ({
        tutorId: row.tutor_id,
        moduleId: row.module_id,
        status: row.status as ModuleProgress["status"]
      })
    ),
    webinars: ((webinarRows ?? []) as DbWebinar[]).map(mapWebinar),
    webinarRegistrations: ((registrationRows ?? []) as DbRegistration[]).map(mapRegistration)
  };
}

export async function getAdminDashboardData() {
  const supabase = await createClient();

  const [
    { data: assignmentRows },
    { data: moduleRows },
    { data: progressRows },
    { data: registrationRows }
  ] = await Promise.all([
    supabase
      .from("path_assignments")
      .select(
        "tutor_id, training_path_id, profiles!path_assignments_tutor_id_fkey(id, full_name, email), training_paths(id, title, description, training_path_steps(id, step_type, module_id, webinar_id, is_required, position))"
      ),
    supabase.from("modules").select("id, title, summary, estimated_minutes, quizzes(id)"),
    supabase.from("module_progress").select("tutor_id, module_id, status"),
    supabase.from("webinar_registrations").select("id, tutor_id, webinar_id, status")
  ]);

  return {
    rows: (assignmentRows ?? []).map((row: any) => ({
      tutor: {
        id: row.profiles?.id ?? row.tutor_id,
        name: row.profiles?.full_name ?? "Tutor",
        email: row.profiles?.email ?? "",
        role: "tutor"
      } satisfies Tutor,
      path: mapPath(row.training_paths)
    })),
    modules: ((moduleRows ?? []) as DbModule[]).map(mapModule),
    moduleProgress: ((progressRows ?? []) as { tutor_id: string; module_id: string; status: LearningStatus }[]).map(
      (row) => ({
        tutorId: row.tutor_id,
        moduleId: row.module_id,
        status: row.status as ModuleProgress["status"]
      })
    ),
    webinarRegistrations: ((registrationRows ?? []) as DbRegistration[]).map(mapRegistration)
  };
}

export async function getAdminWebinarData() {
  const supabase = await createClient();
  const [{ data: webinarRows }, { data: registrationRows }] = await Promise.all([
    supabase.from("webinars").select("id, title, description, trainer, starts_at, duration_minutes, capacity, meeting_link"),
    supabase
      .from("webinar_registrations")
      .select("id, tutor_id, webinar_id, status, profiles!webinar_registrations_tutor_id_fkey(full_name, email)")
  ]);

  return {
    webinars: ((webinarRows ?? []) as DbWebinar[]).map(mapWebinar),
    registrations: ((registrationRows ?? []) as DbRegistration[]).map(mapRegistration)
  };
}

function mapPath(row: DbPath | null): TrainingPath | null {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    steps: (row.training_path_steps ?? []).map(mapStep).sort((a, b) => a.order - b.order)
  };
}

function mapStep(row: DbStep): TrainingPathStep {
  return {
    id: row.id,
    type: row.step_type,
    moduleId: row.module_id ?? undefined,
    webinarId: row.webinar_id ?? undefined,
    required: row.is_required,
    order: row.position
  };
}

function mapModule(row: DbModule): Module {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    estimatedMinutes: row.estimated_minutes,
    quizId: row.quizzes?.[0]?.id
  };
}

function mapWebinar(row: DbWebinar): Webinar {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    trainer: row.trainer,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    capacity: row.capacity,
    meetingLink: row.meeting_link
  };
}

function mapRegistration(row: DbRegistration): WebinarRegistration & {
  id?: string;
  tutorName?: string;
  tutorEmail?: string;
} {
  return {
    id: row.id,
    tutorId: row.tutor_id,
    webinarId: row.webinar_id,
    status: row.status,
    tutorName: row.profiles?.full_name,
    tutorEmail: row.profiles?.email
  };
}
