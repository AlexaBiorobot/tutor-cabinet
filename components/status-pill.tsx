import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  registered: "Registered",
  attended: "Attended",
  partially_attended: "Partially attended",
  no_show: "No-show",
  excused: "Excused",
  passed: "Passed",
  needs_revision: "Needs revision",
  ready: "Ready"
};

const tones: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-sky-100 text-sky-800",
  registered: "bg-cyan-100 text-cyan-800",
  attended: "bg-emerald-100 text-emerald-800",
  passed: "bg-emerald-100 text-emerald-800",
  ready: "bg-emerald-100 text-emerald-800",
  partially_attended: "bg-amber-100 text-amber-800",
  no_show: "bg-red-100 text-red-800",
  excused: "bg-stone-100 text-stone-700",
  needs_revision: "bg-orange-100 text-orange-800"
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tones[status], className)}>
      {labels[status] ?? status}
    </span>
  );
}
