import { StatusPill } from "@/components/status-pill";
import type { ReadinessStatus } from "@/lib/types";

export function ReadinessBadge({ status }: { status: ReadinessStatus }) {
  return <StatusPill status={status} />;
}
