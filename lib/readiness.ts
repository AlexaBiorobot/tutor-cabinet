import type {
  Module,
  ModuleProgress,
  ReadinessStatus,
  TrainingPath,
  WebinarRegistration
} from "@/lib/types";

type ReadinessInput = {
  path: TrainingPath;
  modules: Module[];
  moduleProgress: ModuleProgress[];
  webinarRegistrations: WebinarRegistration[];
};

export function calculateReadiness({
  path,
  modules,
  moduleProgress,
  webinarRegistrations
}: ReadinessInput) {
  const requiredSteps = path.steps.filter((step) => step.required);
  const completedRequired = requiredSteps.filter((step) => {
    if (step.type === "module" && step.moduleId) {
      const module = modules.find((item) => item.id === step.moduleId);
      const progress = moduleProgress.find((item) => item.moduleId === step.moduleId);
      if (!module?.quizId) return progress?.status === "passed";
      return progress?.status === "passed";
    }

    if (step.type === "webinar" && step.webinarId) {
      const registration = webinarRegistrations.find((item) => item.webinarId === step.webinarId);
      return registration?.status === "attended";
    }

    return false;
  });

  const blocked = requiredSteps.some((step) => {
    if (step.type === "module" && step.moduleId) {
      return moduleProgress.find((item) => item.moduleId === step.moduleId)?.status === "needs_revision";
    }

    if (step.type === "webinar" && step.webinarId) {
      const status = webinarRegistrations.find((item) => item.webinarId === step.webinarId)?.status;
      return status === "no_show" || status === "partially_attended";
    }

    return false;
  });

  const started =
    moduleProgress.some((item) => item.status !== "not_started") ||
    webinarRegistrations.some((item) => item.status === "registered" || item.status === "attended");

  let status: ReadinessStatus = "not_started";
  if (blocked) status = "needs_revision";
  else if (requiredSteps.length > 0 && completedRequired.length === requiredSteps.length) status = "ready";
  else if (started) status = "in_progress";

  return {
    status,
    completedRequired: completedRequired.length,
    totalRequired: requiredSteps.length,
    percent:
      requiredSteps.length === 0 ? 0 : Math.round((completedRequired.length / requiredSteps.length) * 100)
  };
}
