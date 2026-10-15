import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "./route";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Statistiques — Dentics" }] }),
  component: Analytics,
});

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function Analytics() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const since = subMonths(new Date(), 12).toISOString();
      const [v, a] = await Promise.all([
        supabase.from("visits").select("treatment, visit_date").gte("visit_date", since.slice(0, 10)),
        supabase.from("appointments").select("starts_at").gte("starts_at", since).neq("status", "cancelled"),
      ]);
      return { visits: v.data ?? [], appts: a.data ?? [] };
    },
  });
  const counts: Record<string, number> = {};
  data?.visits.forEach((v) => (counts[v.treatment] = (counts[v.treatment] ?? 0) + 1));
  const top = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), 11 - i), key = format(d, "yyyy-MM");
    return { m: format(d, "MMM", { locale: fr }), RDV: data?.appts.filter((a) => a.starts_at.startsWith(key)).length ?? 0 };
  });
  const byDay = DAYS.map((d, i) => ({ d, RDV: data?.appts.filter((a) => new Date(a.starts_at).getDay() === i).length ?? 0 })).slice(1).concat([]);
  const byHour = Array.from({ length: 11 }, (_, i) => ({ h: `${8 + i}h`, RDV: data?.appts.filter((a) => new Date(a.starts_at).getHours() === 8 + i).length ?? 0 }));

  return (
    <>
      <PageHeader title="Statistiques" subtitle="Les 12 derniers mois" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Soins les plus fréquents">
          {top.length === 0 ? <p className="py-16 text-center text-muted-foreground">Pas encore de données.</p> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart><Pie data={top} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3}>{top.map((_, i) => <Cell key={i} fill={COLORS[i % 5]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-2 text-sm">{top.map((t, i) => <li key={t.name} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: COLORS[i % 5] }} /><span className="flex-1 truncate">{t.name}</span><b>{t.value}</b></li>)}</ul>
            </div>
          )}
        </Card>
        <Card title="Rendez-vous par mois"><Chart data={months} x="m" /></Card>
        <Card title="Jours les plus chargés"><Chart data={byDay} x="d" /></Card>
        <Card title="Heures les plus chargées"><Chart data={byHour} x="h" /></Card>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="surface p-5"><h2 className="mb-4 font-semibold">{title}</h2>{children}</section>;
}
function Chart({ data, x }: { data: object[]; x: string }) {
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey={x} tickLine={false} axisLine={false} fontSize={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={30} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
          <Bar dataKey="RDV" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
