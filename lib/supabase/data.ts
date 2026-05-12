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
  body?: string;
  estimated_minutes: number;
  video_url?: string | null;
  image_url?: string | null;
  resource_links?: string[] | null;
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
  profiles?: DbProfile | DbProfile[] | null;
};

type DbProfile = {
  id?: string;
  full_name: string;
  email: string;
  role?: "tutor" | "admin";
};

type DbAssignment = {
  tutor_id: string;
  training_path_id: string;
  profiles?: DbProfile | DbProfile[] | null;
  training_paths?: DbPath | DbPath[] | null;
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
    supabase.from("modules").select("id, title, summary, body, estimated_minutes, video_url, image_url, resource_links, quizzes(id)"),
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
    supabase.from("modules").select("id, title, summary, body, estimated_minutes, video_url, image_url, resource_links, quizzes(id)"),
    supabase.from("module_progress").select("tutor_id, module_id, status"),
    supabase.from("webinar_registrations").select("id, tutor_id, webinar_id, status")
  ]);

  return {
    rows: ((assignmentRows ?? []) as DbAssignment[]).map((row) => {
      const profile = firstOrSelf(row.profiles);
      const path = firstOrSelf(row.training_paths);

      return {
        tutor: {
          id: profile?.id ?? row.tutor_id,
          name: profile?.full_name ?? "Tutor",
          email: profile?.email ?? "",
          role: "tutor"
        } satisfies Tutor,
        path: mapPath(path ?? null)
      };
    }),
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

export async function getAdminPathData() {
  const supabase = await createClient();
  const [{ data: pathRows }, { data: moduleRows }, { data: webinarRows }, { data: tutorRows }, { data: assignmentRows }] =
    await Promise.all([
      supabase
        .from("training_paths")
        .select("id, title, description, training_path_steps(id, step_type, module_id, webinar_id, is_required, position)")
        .order("created_at", { ascending: false }),
      supabase.from("modules").select("id, title, summary, body, estimated_minutes, video_url, image_url, resource_links, quizzes(id)").order("title"),
      supabase.from("webinars").select("id, title, description, trainer, starts_at, duration_minutes, capacity, meeting_link").order("starts_at"),
      supabase.from("profiles").select("id, full_name, email, role").eq("role", "tutor").order("full_name"),
      supabase
        .from("path_assignments")
        .select("tutor_id, training_path_id, profiles!path_assignments_tutor_id_fkey(id, full_name, email)")
    ]);

  return {
    paths: ((pathRows ?? []) as DbPath[]).map(mapPath).filter(Boolean) as TrainingPath[],
    modules: ((moduleRows ?? []) as DbModule[]).map(mapModule),
    webinars: ((webinarRows ?? []) as DbWebinar[]).map(mapWebinar),
    tutors: ((tutorRows ?? []) as (DbProfile & { id: string })[]).map(
      (row) =>
        ({
          id: row.id,
          name: row.full_name,
          email: row.email,
          role: "tutor"
        }) satisfies Tutor
    ),
    assignments: ((assignmentRows ?? []) as DbAssignment[]).map((row) => {
      const profile = firstOrSelf(row.profiles);

      return {
        tutorId: row.tutor_id,
        pathId: row.training_path_id,
        tutorName: profile?.full_name ?? "Tutor",
        tutorEmail: profile?.email ?? ""
      };
    })
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
    body: row.body,
    estimatedMinutes: row.estimated_minutes,
    videoUrl: row.video_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    resourceLinks: row.resource_links ?? [],
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
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    id: row.id,
    tutorId: row.tutor_id,
    webinarId: row.webinar_id,
    status: row.status,
    tutorName: profile?.full_name,
    tutorEmail: profile?.email
  };
}

function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}
