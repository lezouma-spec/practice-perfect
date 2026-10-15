import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Phone, Check, X, Copy, Inbox } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSettings } from "@/lib/clinic";
import { AppointmentDialog, newDraft, type ApptDraft } from "@/components/AppointmentDialog";
import { PageHeader } from "./route";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "Demandes — Dentics" }, { name: "description", content: "Demandes — Dentics : espace professionnel de votre cabinet dentaire." }, { property: "og:title", content: "Demandes — Dentics" }, { property: "og:description", content: "Demandes — Dentics : gestion de votre cabinet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Requests,
});

function Requests() {
  const qc = useQueryClient();
  const { data: clinic } = useSettings();
  const [draft, setDraft] = useState<ApptDraft | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: async () => (await supabase.from("booking_requests").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  const pending = data.filter((r) => r.status === "pending");

  async function resolve(r: (typeof data)[number], status: "confirmed" | "dismissed") {
    if (status === "confirmed") {
      const { data: exist } = await supabase.from("patients").select("id").eq("phone", r.phone).maybeSingle();
      let patientId = exist?.id;
      if (!patientId) { const result = await supabase.from("patients").insert({ full_name: r.full_name, phone: r.phone }).select("id").single(); if (result.error) { toast.error(result.error.message); return; } patientId = result.data.id; }
      setDraft(newDraft(new Date(new Date(Date.now() + 86400000).setHours(9, 0, 0, 0)), patientId));
    }
    const { error } = await supabase.from("booking_requests").update({ status }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "confirmed" ? "Patient ajouté — fixez le créneau dans l'agenda" : "Demande écartée");
    qc.invalidateQueries();
  }

  const link = typeof window !== "undefined" ? `${window.location.origin}/book?clinic=${clinic?.id ?? ""}` : "/book";

  return (
    <>
      <PageHeader title="Demandes de rendez-vous" subtitle="Appelez le patient, puis confirmez."
        actions={<Button variant="outline" className="rounded-xl" onClick={async () => { try { await navigator.clipboard.writeText(link); toast.success("Lien de réservation copié"); } catch { toast.error("Copie impossible"); } }}><Copy /> Lien public</Button>} />
      {pending.length === 0 && (
        <div className="surface flex flex-col items-center gap-2 p-12 text-muted-foreground"><Inbox className="size-8" />Aucune demande en attente.</div>
      )}
      <div className="space-y-3">
        {pending.map((r) => (
          <div key={r.id} className="surface flex flex-wrap items-center gap-4 p-5 animate-fade-up">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.full_name}</p>
              <p className="text-sm text-muted-foreground">{r.phone} · {formatDistanceToNow(new Date(r.created_at), { locale: fr, addSuffix: true })}</p>
              {r.preferred && <p className="mt-1 text-sm">Préférence : {r.preferred}</p>}
            </div>
            <Button asChild variant="outline" className="rounded-xl"><a href={`tel:${r.phone}`}><Phone /> Appeler</a></Button>
            <Button className="rounded-xl" onClick={() => resolve(r, "confirmed")}><Check /> Confirmé</Button>
            <Button variant="ghost" size="icon" onClick={() => resolve(r, "dismissed")} aria-label="Écarter"><X /></Button>
          </div>
        ))}
      </div>
      <AppointmentDialog open={!!draft} onOpenChange={(o) => { if (!o) setDraft(null); }} draft={draft} />
    </>
  );
}
