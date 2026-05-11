import type {
  Admin,
  Module,
  ModuleProgress,
  PathAssignment,
  Quiz,
  TrainingPath,
  Tutor,
  Webinar,
  WebinarRegistration
} from "@/lib/types";

export const currentTutorId = "tutor-1";

export const currentAdmin: Admin = {
  id: "admin-1",
  name: "Maya Chen",
  email: "maya@example.com",
  role: "admin"
};

export const tutors: Tutor[] = [
  { id: "tutor-1", name: "Elena Rivera", email: "elena@example.com", role: "tutor" },
  { id: "tutor-2", name: "Sam Patel", email: "sam@example.com", role: "tutor" },
  { id: "tutor-3", name: "Jordan Lee", email: "jordan@example.com", role: "tutor" }
];

export const modules: Module[] = [
  {
    id: "module-1",
    title: "Tutoring Foundations",
    summary: "Core expectations, session structure, and student support principles.",
    estimatedMinutes: 35,
    quizId: "quiz-1"
  },
  {
    id: "module-2",
    title: "Safety and Escalation",
    summary: "How to document concerns and escalate support needs.",
    estimatedMinutes: 25,
    quizId: "quiz-2"
  },
  {
    id: "module-3",
    title: "Assessment Readiness",
    summary: "Using formative checks to personalize learning plans.",
    estimatedMinutes: 30
  }
];

export const quizzes: Quiz[] = [
  {
    id: "quiz-1",
    moduleId: "module-1",
    title: "Foundations Check",
    passingScore: 80,
    questions: [
      {
        id: "q-1",
        prompt: "What should a tutor do at the start of each session?",
        options: ["Skip the plan", "Set goals with the learner", "Assign homework immediately"],
        answerIndex: 1
      }
    ]
  },
  {
    id: "quiz-2",
    moduleId: "module-2",
    title: "Escalation Check",
    passingScore: 80,
    questions: [
      {
        id: "q-2",
        prompt: "When should a safety concern be documented?",
        options: ["Only at month end", "Immediately after identifying it", "Only if repeated twice"],
        answerIndex: 1
      }
    ]
  }
];

export const webinars: Webinar[] = [
  {
    id: "webinar-1",
    title: "Live Practice Lab",
    description: "Trainer-led roleplay for first-session coaching scenarios.",
    trainer: "Ari Morgan",
    startsAt: "2026-05-18T16:00:00.000Z",
    durationMinutes: 90,
    capacity: 24,
    meetingLink: "https://meet.example.com/practice-lab"
  },
  {
    id: "webinar-2",
    title: "Assessment Calibration",
    description: "Review learner artifacts and align scoring expectations.",
    trainer: "Nadia Brooks",
    startsAt: "2026-05-22T18:00:00.000Z",
    durationMinutes: 60,
    capacity: 16,
    meetingLink: "https://meet.example.com/calibration"
  }
];

export const trainingPaths: TrainingPath[] = [
  {
    id: "path-1",
    title: "New Tutor Readiness",
    description: "Required onboarding path for tutors before first learner assignment.",
    steps: [
      { id: "step-1", type: "module", moduleId: "module-1", required: true, order: 1 },
      { id: "step-2", type: "module", moduleId: "module-2", required: true, order: 2 },
      { id: "step-3", type: "webinar", webinarId: "webinar-1", required: true, order: 3 },
      { id: "step-4", type: "module", moduleId: "module-3", required: false, order: 4 }
    ]
  },
  {
    id: "path-2",
    title: "Assessment Specialist",
    description: "Optional path for tutors who administer diagnostic assessments.",
    steps: [
      { id: "step-5", type: "module", moduleId: "module-3", required: true, order: 1 },
      { id: "step-6", type: "webinar", webinarId: "webinar-2", required: true, order: 2 }
    ]
  }
];

export const pathAssignments: PathAssignment[] = [
  { tutorId: "tutor-1", pathId: "path-1" },
  { tutorId: "tutor-2", pathId: "path-1" },
  { tutorId: "tutor-3", pathId: "path-1" },
  { tutorId: "tutor-3", pathId: "path-2" }
];

export const moduleProgress: ModuleProgress[] = [
  { tutorId: "tutor-1", moduleId: "module-1", status: "passed", score: 92 },
  { tutorId: "tutor-1", moduleId: "module-2", status: "in_progress" },
  { tutorId: "tutor-2", moduleId: "module-1", status: "needs_revision", score: 62 },
  { tutorId: "tutor-3", moduleId: "module-1", status: "passed", score: 88 },
  { tutorId: "tutor-3", moduleId: "module-2", status: "passed", score: 94 },
  { tutorId: "tutor-3", moduleId: "module-3", status: "passed" }
];

export const webinarRegistrations: WebinarRegistration[] = [
  { tutorId: "tutor-1", webinarId: "webinar-1", status: "registered" },
  { tutorId: "tutor-2", webinarId: "webinar-1", status: "no_show" },
  { tutorId: "tutor-3", webinarId: "webinar-1", status: "attended" },
  { tutorId: "tutor-3", webinarId: "webinar-2", status: "registered" }
];
