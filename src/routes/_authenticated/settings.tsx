import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Upload, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "./route";
import { useRole, useSettings } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Réglages — Dentics" }] }),
  component: Settings,
});

function Settings() {
  const { data: me } = useRole();
  const { data: s } = useSettings();
  const qc = useQueryClient();
  const isDoctor = me?.role === "doctor";
  const [f, setF] = useState({ doctor_name: "", clinic_name: "", address: "", phone: "", matricule: "", stamp_data: "", signature_data: "" });
  useEffect(() => { if (s) setF({ doctor_name: s.doctor_name, clinic_name: s.clinic_name, address: s.address ?? "", phone: s.phone ?? "", matricule: s.matricule ?? "", stamp_data: s.stamp_data ?? "", signature_data: s.signature_data ?? "" }); }, [s]);

  async function save() {
    const { error } = await supabase.from("clinic_settings").update({ ...f, stamp_data: f.stamp_data || null, signature_data: f.signature_data || null, updated_at: new Date().toISOString() }).eq("id", s?.id ?? "");
    if (error) { toast.error(error.message); return; }
    toast.success("Réglages enregistrés");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  async function onImg(file: File, key: "stamp_data" | "signature_data") {
    if (file.size > 3_000_000) { toast.error("Image trop lourde (max 3 Mo)"); return; }
    const url = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
    setF((x) => ({ ...x, [key]: url }));
  }

  const field = (k: keyof typeof f, label: string) => (
    <div className="space-y-1.5"><Label>{label}</Label><Input disabled={!isDoctor} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );

  return (
    <>
      <PageHeader title="Réglages" subtitle="Informations imprimées sur vos documents" actions={isDoctor && <Button className="rounded-xl" onClick={save}>Enregistrer</Button>} />
      {!isDoctor && <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><Lock className="size-4" /> Seul le médecin peut modifier ces réglages.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface grid gap-4 p-6">
          <h2 className="font-semibold">Cabinet</h2>
          {field("doctor_name", "Nom du médecin")}
          {field("clinic_name", "Nom du cabinet")}
          {field("address", "Adresse")}
          {field("phone", "Téléphone")}
          {field("matricule", "Matricule fiscal / Code CNAM")}
        </section>
        <section className="surface p-6">
          <h2 className="font-semibold">Cachet et signature</h2>
          <p className="mt-1 text-sm text-muted-foreground">Appliqués automatiquement sur reçus, factures et ordonnances. Un fond blanc ou transparent (PNG) rend mieux.</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {(["stamp_data", "signature_data"] as const).map((k) => (
              <label key={k} className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-3 text-sm text-muted-foreground ${isDoctor ? "cursor-pointer hover:bg-muted" : ""}`}>
                <input disabled={!isDoctor} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onImg(e.target.files[0], k)} />
                {f[k] ? <img src={f[k]} alt="" className="max-h-full max-w-full object-contain" /> : <><Upload className="size-5" />{k === "stamp_data" ? "Cachet" : "Signature"}</>}
              </label>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
