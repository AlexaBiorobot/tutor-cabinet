import { CalendarPlus, Check, Clock, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { tutors, webinars, webinarRegistrations } from "@/lib/mock-data";
import { formatDateTime, formatDuration } from "@/lib/utils";

const attendanceStatuses = ["attended", "partially_attended", "no_show", "excused"] as const;

export default function AdminWebinarsPage() {
  return (
    <AppShell title="Webinar management" eyebrow="Live training">
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          {webinars.map((webinar) => {
            const registrations = webinarRegistrations.filter((item) => item.webinarId === webinar.id);

            return (
              <Card key={webinar.id}>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{webinar.title}</CardTitle>
                    <CardDescription className="mt-2">{webinar.description}</CardDescription>
                  </div>
                  <StatusPill status={registrations.length >= webinar.capacity ? "needs_revision" : "registered"} />
                </CardHeader>
                <CardContent>
                  <div className="mb-5 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatDateTime(webinar.startsAt)}
                    </span>
                    <span>{formatDuration(webinar.durationMinutes)}</span>
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {registrations.length}/{webinar.capacity} registered
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Tutor</th>
                          <th className="px-4 py-3 font-medium">Current status</th>
                          <th className="px-4 py-3 font-medium">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-card">
                        {registrations.map((registration) => {
                          const tutor = tutors.find((item) => item.id === registration.tutorId);
                          return (
                            <tr key={`${registration.tutorId}-${registration.webinarId}`}>
                              <td className="px-4 py-3">
                                <div className="font-medium">{tutor?.name}</div>
                                <div className="text-xs text-muted-foreground">{tutor?.email}</div>
                              </td>
                              <td className="px-4 py-3">
                                <StatusPill status={registration.status} />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {attendanceStatuses.map((status) => (
                                    <Button key={status} size="sm" variant="outline">
                                      {registration.status === status ? <Check className="h-4 w-4" /> : null}
                                      {status.replace("_", " ")}
                                    </Button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Create webinar</CardTitle>
            <CardDescription>Fields match the Supabase `webinars` table.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3">
              {["Title", "Description", "Trainer", "Date and time", "Duration minutes", "Capacity", "Meeting link"].map(
                (label) => (
                  <label key={label} className="grid gap-1 text-sm font-medium">
                    {label}
                    <input
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder={label}
                    />
                  </label>
                )
              )}
              <Button type="button" className="mt-2">
                <CalendarPlus className="h-4 w-4" />
                Create webinar
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
