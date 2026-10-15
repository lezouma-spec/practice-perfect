import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Lock, Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "./route";
import { tnd, useRole } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/revenue")({
  head: () => ({ meta: [{ title: "Revenus — Dentics" }] }),
  component: Revenue,
});

function Revenue() {
  const { data: me } = useRole();
  if (me && me.role !== "doctor") return <div className="surface flex items-center gap-3 p-8 text-muted-foreground"><Lock /> Réservé au médecin.</div>;
  return <RevenueInner />;
}

function RevenueInner() {
  const qc = useQueryClient();
  const [f, setF] = useState({ label: "", amount: "", expense_date: format(new Date(), "yyyy-MM-dd") });
  const since = format(startOfMonth(subMonths(new Date(), 11)), "yyyy-MM-dd");
  const { data } = useQuery({
    queryKey: ["revenue"],
    queryFn: async () => {
      const [v, e] = await Promise.all([
        supabase.from("visits").select("visit_date, amount_paid").gte("visit_date", since),
        supabase.from("expenses").select("*").gte("expense_date", since).order("expense_date", { ascending: false }),
      ]);
      return { visits: v.data ?? [], expenses: e.data ?? [] };
    },
  });
  const today = format(new Date(), "yyyy-MM-dd");
  const month = today.slice(0, 7);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const incomeToday = sum((data?.visits ?? []).filter((v) => v.visit_date === today).map((v) => Number(v.amount_paid)));
  const incomeMonth = sum((data?.visits ?? []).filter((v) => v.visit_date.startsWith(month)).map((v) => Number(v.amount_paid)));
  const expMonth = sum((data?.expenses ?? []).filter((x) => x.expense_date.startsWith(month)).map((x) => Number(x.amount)));
  const chart = Array.from({ length: 12 }, (_, i) => {
    const m = format(subMonths(new Date(), 11 - i), "yyyy-MM");
    const inc = sum((data?.visits ?? []).filter((v) => v.visit_date.startsWith(m)).map((v) => Number(v.amount_paid)));
    const exp = sum((data?.expenses ?? []).filter((x) => x.expense_date.startsWith(m)).map((x) => Number(x.amount)));
    return { m: format(new Date(m + "-01"), "MMM", { locale: fr }), Revenus: inc, Dépenses: exp };
  });

  async function addExpense() {
    const amount = Number(f.amount);
    if (!f.label.trim() || !(amount > 0)) return toast.error("Libellé et montant requis");
    const { error } = await supabase.from("expenses").insert({ label: f.label.trim().slice(0, 100), amount, expense_date: f.expense_date });
    if (error) return toast.error(error.message);
    setF({ ...f, label: "", amount: "" });
    qc.invalidateQueries({ queryKey: ["revenue"] });
  }

  return (
    <>
      <PageHeader title="Revenus" subtitle="Encaissements réels, dépenses et bénéfice" />
      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi icon={Wallet} label="Aujourd'hui" value={tnd(incomeToday)} />
        <Kpi icon={TrendingUp} label="Ce mois" value={tnd(incomeMonth)} />
        <Kpi icon={TrendingDown} label="Dépenses du mois" value={tnd(expMonth)} />
        <Kpi icon={Wallet} label="Bénéfice du mois" value={tnd(incomeMonth - expMonth)} accent />
      </div>
      <section className="surface mt-6 p-5">
        <h2 className="mb-4 font-semibold">12 derniers mois</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={chart}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={50} />
              <Tooltip formatter={(v: number) => tnd(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
              <Bar dataKey="Revenus" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Dépenses" fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="surface mt-6 p-5">
        <h2 className="mb-4 font-semibold">Dépenses</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <Input placeholder="Libellé (loyer, fournitures…)" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
          <Input type="number" step="0.001" placeholder="Montant DT" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          <Input type="date" value={f.expense_date} onChange={(e) => setF({ ...f, expense_date: e.target.value })} />
          <Button className="rounded-xl" onClick={addExpense}><Plus /> Ajouter</Button>
        </div>
        <ul className="divide-y">
          {data?.expenses.slice(0, 30).map((x) => (
            <li key={x.id} className="flex items-center justify-between py-2.5 text-sm">
              <span>{format(new Date(x.expense_date), "dd/MM")} · {x.label}</span>
              <span className="flex items-center gap-2 font-medium">{tnd(x.amount)}
                <button className="text-muted-foreground hover:text-destructive" onClick={async () => { await supabase.from("expenses").delete().eq("id", x.id); qc.invalidateQueries({ queryKey: ["revenue"] }); }}><Trash2 className="size-4" /></button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`surface p-5 ${accent ? "bg-primary text-primary-foreground" : ""}`}>
      <Icon className={`size-5 ${accent ? "" : "text-primary"}`} />
      <p className="mt-3 font-display text-xl font-semibold">{value}</p>
      <p className={`text-sm ${accent ? "opacity-80" : "text-muted-foreground"}`}>{label}</p>
    </div>
  );
}
