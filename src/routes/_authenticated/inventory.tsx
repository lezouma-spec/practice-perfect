import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "./route";
import { useRole } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Stock — Dentics" }, { name: "description", content: "Stock — Dentics : espace professionnel de votre cabinet dentaire." }, { property: "og:title", content: "Stock — Dentics" }, { property: "og:description", content: "Stock — Dentics : gestion de votre cabinet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Inventory,
});

function Inventory() {
  const qc = useQueryClient();
  const { data: me } = useRole();
  const [f, setF] = useState({ name: "", unit: "", quantity: "", min_quantity: "" });
  const { data = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => (await supabase.from("inventory_items").select("*").order("name")).data ?? [],
  });
  const low = data.filter((i) => Number(i.quantity) <= Number(i.min_quantity));

  async function adjust(id: string, q: number) {
    await supabase.from("inventory_items").update({ quantity: Math.max(0, q) }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["inventory"] });
  }
  async function add() {
    if (!f.name.trim()) { toast.error("Nom requis"); return; }
    const { error } = await supabase.from("inventory_items").insert({ name: f.name.trim().slice(0, 100), unit: f.unit || "unité", quantity: Number(f.quantity || 0), min_quantity: Number(f.min_quantity || 5) });
    if (error) { toast.error(error.message); return; }
    setF({ name: "", unit: "", quantity: "", min_quantity: "" });
    qc.invalidateQueries({ queryKey: ["inventory"] });
  }
  async function del(id: string) {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("inventory_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["inventory"] });
  }

  return (
    <>
      <PageHeader title="Stock" subtitle="Consommables du cabinet" />
      {low.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-warning-soft p-4 text-sm">
          <AlertTriangle className="size-5 text-warning" />
          <span><b>{low.length} article(s) à commander :</b> {low.map((i) => i.name).join(", ")}</span>
        </div>
      )}
      <div className="surface mb-4 grid gap-2 p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <Input placeholder="Article" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input placeholder="Unité" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
        <Input type="number" placeholder="Quantité" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
        <Input type="number" placeholder="Seuil d'alerte" value={f.min_quantity} onChange={(e) => setF({ ...f, min_quantity: e.target.value })} />
        <Button className="rounded-xl" onClick={add}><Plus /> Ajouter</Button>
      </div>
      <div className="surface divide-y">
        {data.map((i) => {
          const isLow = Number(i.quantity) <= Number(i.min_quantity);
          const pct = Math.min(100, (Number(i.quantity) / Math.max(1, Number(i.min_quantity) * 3)) * 100);
          return (
            <div key={i.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{i.name}</p>
                <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full transition-all ${isLow ? "bg-warning" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Alerte à {Number(i.min_quantity)} {i.unit}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="rounded-lg" onClick={() => adjust(i.id, Number(i.quantity) - 1)}><Minus /></Button>
                <span className={`w-20 text-center font-display font-semibold ${isLow ? "text-warning" : ""}`}>{Number(i.quantity)} <span className="text-xs font-normal text-muted-foreground">{i.unit}</span></span>
                <Button size="icon" variant="outline" className="rounded-lg" onClick={() => adjust(i.id, Number(i.quantity) + 1)}><Plus /></Button>
              </div>
              {me?.role === "doctor" && <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(i.id)}><Trash2 /></Button>}
            </div>
          );
        })}
      </div>
    </>
  );
}
