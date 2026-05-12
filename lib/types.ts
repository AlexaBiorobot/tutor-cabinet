export type UserRole = "tutor" | "admin";

export type LearningStatus =
  | "not_started"
  | "in_progress"
  | "registered"
  | "attended"
  | "partially_attended"
  | "no_show"
  | "excused"
  | "passed"
  | "needs_revision";

export type ReadinessStatus = "not_started" | "in_progress" | "ready" | "needs_revision";

export type StepType = "module" | "webinar";

export type Tutor = {
  id: string;
  name: string;
  email: string;
  role: "tutor";
};

export type Admin = {
  id: string;
  name: string;
  email: string;
  role: "admin";
};

export type Module = {
  id: string;
  title: string;
  summary: string;
  body?: string;
  estimatedMinutes: number;
  videoUrl?: string;
  imageUrl?: string;
  resourceLinks: string[];
  quizId?: string;
};

export type Quiz = {
  id: string;
  moduleId: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
};

export type Webinar = {
  id: string;
  title: string;
  description: string;
  trainer: string;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  meetingLink: string;
};

export type TrainingPathStep = {
  id: string;
  type: StepType;
  required: boolean;
  order: number;
  moduleId?: string;
  webinarId?: string;
};

export type TrainingPath = {
  id: string;
  title: string;
  description: string;
  steps: TrainingPathStep[];
};

export type ModuleProgress = {
  tutorId: string;
  moduleId: string;
  status: Extract<LearningStatus, "not_started" | "in_progress" | "passed" | "needs_revision">;
  score?: number;
};

export type WebinarRegistration = {
  tutorId: string;
  webinarId: string;
  status: Extract<
    LearningStatus,
    "registered" | "attended" | "partially_attended" | "no_show" | "excused"
  >;
};

export type PathAssignment = {
  tutorId: string;
  pathId: string;
};
