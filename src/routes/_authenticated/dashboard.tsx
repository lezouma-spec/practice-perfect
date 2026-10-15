import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, CalendarDays, MessageCircle, Package, Plus, Cake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./route";
import { waLink, useSettings } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Aujourd'hui — Dentics" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: settings } = useSettings();
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const now = new Date();
      const tomorrowStart = startOfDay(new Date(Date.now() + 86400000));
      const [today, tomorrow, req, inv, pts] = await Promise.all([
        supabase.from("appointments").select("id, starts_at, ends_at, reason, status, patients(id, full_name, phone)").gte("starts_at", startOfDay(now).toISOString()).lte("starts_at", endOfDay(now).toISOString()).neq("status", "cancelled").order("starts_at"),
        supabase.from("appointments").select("id, starts_at, patients(full_name, phone)").gte("starts_at", tomorrowStart.toISOString()).lte("starts_at", endOfDay(tomorrowStart).toISOString()).eq("status", "scheduled").order("starts_at"),
        supabase.from("booking_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("inventory_items").select("id, name, quantity, min_quantity"),
        supabase.from("patients").select("id, full_name, phone, birth_date").not("birth_date", "is", null),
      ]);
      const md = format(now, "MM-dd");
      return {
        today: today.data ?? [],
        tomorrow: tomorrow.data ?? [],
        pending: req.count ?? 0,
        low: (inv.data ?? []).filter((i) => Number(i.quantity) <= Number(i.min_quantity)),
        birthdays: (pts.data ?? []).filter((p) => p.birth_date?.slice(5) === md),
      };
    },
  });

  const clinic = settings?.clinic_name ?? "le cabinet";

  return (
    <>
      <PageHeader
        title={format(new Date(), "EEEE d MMMM", { locale: fr }).replace(/^./, (c) => c.toUpperCase())}
        subtitle="Votre journée en un coup d'œil"
        actions={<Button asChild className="rounded-xl"><Link to="/calendar"><Plus /> Rendez-vous</Link></Button>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={CalendarDays} label="Rendez-vous aujourd'hui" value={data?.today.length ?? "–"} to="/calendar" />
        <Stat icon={Bell} label="Demandes en attente" value={data?.pending ?? "–"} to="/requests" />
        <Stat icon={Package} label="Stock bas" value={data?.low.length ?? "–"} to="/inventory" warn={!!data?.low.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="surface p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Programme du jour</h2>
          {data?.today.length === 0 && <p className="py-8 text-center text-muted-foreground">Aucun rendez-vous aujourd'hui.</p>}
          <ul className="divide-y">
            {data?.today.map((a) => (
              <li key={a.id} className="flex items-center gap-4 py-3">
                <span className="w-14 font-display text-lg font-semibold text-primary">{format(new Date(a.starts_at), "HH:mm")}</span>
                <div className="min-w-0 flex-1">
                  <Link to="/patients/$id" params={{ id: a.patients!.id }} className="font-medium hover:text-primary">{a.patients?.full_name}</Link>
                  <p className="truncate text-sm text-muted-foreground">{a.reason || "Consultation"}</p>
                </div>
                {a.status === "done" && <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs text-success">Terminé</span>}
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="surface p-5">
            <h2 className="mb-1 font-semibold">Rappels de demain</h2>
            <p className="mb-3 text-xs text-muted-foreground">Un clic ouvre WhatsApp avec le message prêt.</p>
            {data?.tomorrow.length === 0 && <p className="text-sm text-muted-foreground">Rien à rappeler.</p>}
            <ul className="space-y-2">
              {data?.tomorrow.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{format(new Date(a.starts_at), "HH:mm")} · {a.patients?.full_name}</span>
                  <Button asChild size="sm" variant="outline" className="rounded-lg">
                    <a target="_blank" rel="noreferrer" href={waLink(a.patients?.phone, `Bonjour ${a.patients?.full_name}, rappel de votre rendez-vous demain à ${format(new Date(a.starts_at), "HH:mm")} chez ${clinic}. Merci de confirmer.`)}>
                      <MessageCircle /> Envoyer
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
          {!!data?.birthdays.length && (
            <section className="surface p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold"><Cake className="size-4 text-primary" /> Anniversaires</h2>
              <ul className="space-y-2">
                {data.birthdays.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.full_name}</span>
                    <Button asChild size="sm" variant="outline" className="rounded-lg">
                      <a target="_blank" rel="noreferrer" href={waLink(p.phone, `Joyeux anniversaire ${p.full_name} ! Toute l'équipe de ${clinic} vous souhaite une excellente journée.`)}><MessageCircle /> Souhaiter</a>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, to, warn }: { icon: React.ElementType; label: string; value: number | string; to: string; warn?: boolean }) {
  return (
    <Link to={to} className="surface group flex items-center gap-4 p-5 transition-shadow hover:shadow-lift">
      <span className={`grid size-11 place-items-center rounded-xl ${warn ? "bg-warning-soft text-warning" : "bg-primary-soft text-primary"}`}><Icon className="size-5" /></span>
      <div>
        <p className="font-display text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}
