import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileCheck2, FileSignature, ClipboardList, Calculator, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "./route";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({ meta: [{ title: "Modèles — Dentics" }] }),
  component: Templates,
});

const KINDS = [
  { kind: "certificate", label: "Certificat médical", icon: FileCheck2 },
  { kind: "quote", label: "Devis", icon: Calculator },
  { kind: "postop", label: "Conseils post-opératoires", icon: ClipboardList },
  { kind: "consent", label: "Consentement éclairé", icon: FileSignature },
];

function Templates() {
  const { t } = useT();
  const navigate = useNavigate();
  const [kind, setKind] = useState("certificate");
  const [patient, setPatient] = useState("");
  const [days, setDays] = useState("1");
  const [text, setText] = useState("");
  const [lines, setLines] = useState("Détartrage|60\nObturation composite 36|90");
  const { data: patients = [] } = useQuery({
    queryKey: ["patients-min"],
    queryFn: async () => (await supabase.from("patients").select("id, full_name, phone").order("full_name")).data ?? [],
  });

  function go() {
    if (!patient) { toast.error("Choisissez un patient"); return; }
    navigate({ to: "/print/$kind/$id", params: { kind, id: patient }, search: { days, text: text || undefined, lines: kind === "quote" ? lines : undefined } });
  }

  return (
    <>
      <PageHeader title="Modèles" subtitle="Documents prêts à imprimer" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KINDS.map((k) => (
          <button key={k.kind} onClick={() => setKind(k.kind)}
            className={cn("surface flex flex-col items-start gap-3 p-5 text-start transition-all hover:shadow-lift", kind === k.kind && "ring-2 ring-primary")}>
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><k.icon className="size-5" /></span>
            <span className="font-medium">{t(k.label)}</span>
          </button>
        ))}
      </div>
      <section className="surface mt-6 grid max-w-xl gap-4 p-6">
        <div className="space-y-1.5"><Label>{t("Patient")}</Label>
          <Select value={patient} onValueChange={setPatient}>
            <SelectTrigger><SelectValue placeholder="Choisir un patient" /></SelectTrigger>
            <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {kind === "certificate" && <div className="space-y-1.5"><Label>Jours de repos</Label><Input type="number" min="0" value={days} onChange={(e) => setDays(e.target.value)} /></div>}
        {kind === "quote" && <div className="space-y-1.5"><Label>Lignes (désignation|montant, une par ligne)</Label><Textarea rows={5} value={lines} onChange={(e) => setLines(e.target.value)} /></div>}
        {kind === "consent" && <div className="space-y-1.5"><Label>Acte concerné</Label><Input placeholder="ex. l'extraction de la dent 48" value={text} onChange={(e) => setText(e.target.value)} /></div>}
        {(kind === "certificate" || kind === "postop") && <div className="space-y-1.5"><Label>Remarque (facultatif)</Label><Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} /></div>}
        <Button className="h-11 rounded-xl" onClick={go}><Printer /> {t("Imprimer / PDF")}</Button>
      </section>
    </>
  );
}
