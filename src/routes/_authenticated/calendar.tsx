import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { addDays, addWeeks, format, isSameDay, startOfDay, startOfWeek, setHours, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageHeader } from "./route";
import { AppointmentDialog, newDraft, type ApptDraft } from "@/components/AppointmentDialog";
import { useRole } from "@/lib/clinic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Agenda — Dentics" }] }),
  component: CalendarPage,
});

const START = 8, END = 19, PX = 56; // px per hour

function CalendarPage() {
  const { data: me } = useRole();
  const [view, setView] = useState<"day" | "week">(typeof window !== "undefined" && window.innerWidth < 768 ? "day" : "week");
  const [cursor, setCursor] = useState(startOfDay(new Date()));
  const [draft, setDraft] = useState<ApptDraft | null>(null);
  const days = view === "day" ? [cursor] : Array.from({ length: 6 }, (_, i) => addDays(startOfWeek(cursor, { weekStartsOn: 1 }), i));
  const from = days[0], to = addDays(days[days.length - 1], 1);

  const { data: appts = [] } = useQuery({
    queryKey: ["appts", from.toISOString(), to.toISOString()],
    queryFn: async () =>
      (await supabase.from("appointments").select("id, patient_id, starts_at, ends_at, reason, status, patients(full_name)").gte("starts_at", from.toISOString()).lt("starts_at", to.toISOString()).neq("status", "cancelled")).data ?? [],
  });

  const move = (n: number) => setCursor(view === "day" ? addDays(cursor, n) : addWeeks(cursor, n));

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={view === "day" ? format(cursor, "EEEE d MMMM yyyy", { locale: fr }) : `Semaine du ${format(from, "d MMMM", { locale: fr })}`}
        actions={
          <>
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "day" | "week")} className="rounded-xl border p-0.5">
              <ToggleGroupItem value="day" className="rounded-lg px-3">Jour</ToggleGroupItem>
              <ToggleGroupItem value="week" className="rounded-lg px-3">Semaine</ToggleGroupItem>
            </ToggleGroup>
            <div className="flex rounded-xl border">
              <Button variant="ghost" size="icon" onClick={() => move(-1)}><ChevronLeft /></Button>
              <Button variant="ghost" onClick={() => setCursor(startOfDay(new Date()))}>Aujourd'hui</Button>
              <Button variant="ghost" size="icon" onClick={() => move(1)}><ChevronRight /></Button>
            </div>
            <Button className="rounded-xl" onClick={() => setDraft(newDraft(setHours(cursor, 9)))}><Plus /> Nouveau</Button>
          </>
        }
      />
      <div className="surface overflow-x-auto">
        <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, minWidth: view === "day" ? 0 : undefined }}>
          <div className="border-b" />
          {days.map((d) => (
            <div key={d.toISOString()} className={cn("border-b border-l px-3 py-3 text-center", isSameDay(d, new Date()) && "bg-primary-soft")}>
              <p className="text-xs uppercase text-muted-foreground">{format(d, "EEE", { locale: fr })}</p>
              <p className="font-display text-lg font-semibold">{format(d, "d")}</p>
            </div>
          ))}
          <div className="relative">
            {Array.from({ length: END - START }, (_, i) => (
              <div key={i} style={{ height: PX }} className="pr-2 pt-1 text-right text-xs text-muted-foreground">{START + i}:00</div>
            ))}
          </div>
          {days.map((d) => (
            <div key={d.toISOString()} className="relative border-l" style={{ height: PX * (END - START) }}>
              {Array.from({ length: (END - START) * 2 }, (_, i) => (
                <button key={i} aria-label="Ajouter" onClick={() => setDraft(newDraft(new Date(d.getTime() + (START * 60 + i * 30) * 60000)))}
                  className={cn("block w-full transition-colors hover:bg-primary-soft/60", i % 2 === 1 ? "border-b" : "border-b border-dashed border-border/50")} style={{ height: PX / 2 }} />
              ))}
              {appts.filter((a) => isSameDay(new Date(a.starts_at), d)).map((a) => {
                const s = new Date(a.starts_at);
                const top = ((s.getHours() - START) * 60 + s.getMinutes()) * (PX / 60);
                const h = Math.max(22, differenceInMinutes(new Date(a.ends_at), s) * (PX / 60) - 2);
                return (
                  <button key={a.id}
                    onClick={() => setDraft({ id: a.id, patient_id: a.patient_id, date: format(s, "yyyy-MM-dd"), time: format(s, "HH:mm"), duration: differenceInMinutes(new Date(a.ends_at), s), reason: a.reason ?? "", status: a.status })}
                    className={cn("absolute inset-x-1 overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-xs shadow-soft transition-transform hover:scale-[1.01]",
                      a.status === "done" ? "border-success bg-success-soft" : a.status === "no_show" ? "border-destructive bg-danger-soft" : "border-primary bg-primary-soft")}
                    style={{ top, height: h }}>
                    <p className="font-semibold">{format(s, "HH:mm")} · {a.patients?.full_name}</p>
                    <p className="truncate text-muted-foreground">{a.reason}</p>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <AppointmentDialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)} draft={draft} canDelete={me?.role === "doctor"} />
    </>
  );
}
