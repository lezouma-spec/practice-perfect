import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Upload, Lock, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "./route";
import { useRole, useSettings } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Réglages — Dentics" }, { name: "description", content: "Réglages — Dentics : espace professionnel de votre cabinet dentaire." }, { property: "og:title", content: "Réglages — Dentics" }, { property: "og:description", content: "Réglages — Dentics : gestion de votre cabinet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Settings,
});

function Settings() {
  const { data: me } = useRole();
  const { data: s } = useSettings();
  const qc = useQueryClient();
  const isDoctor = me?.role === "doctor";
  const [hours, setHours] = useState({ opens_at: "09:00", closes_at: "17:00", working_days: [1,2,3,4,5], slot_minutes: 30, timezone: "Africa/Tunis", booking_enabled: true, booking_notice_hours: 2 });
  const [f, setF] = useState({ doctor_name: "", clinic_name: "", address: "", phone: "", matricule: "", stamp_data: "", signature_data: "" });
  useEffect(() => { if (s) { setHours({ opens_at: s.opens_at.slice(0,5), closes_at: s.closes_at.slice(0,5), working_days: s.working_days, slot_minutes: s.slot_minutes, timezone: s.timezone, booking_enabled: s.booking_enabled, booking_notice_hours: s.booking_notice_hours }); setF({ doctor_name: s.doctor_name, clinic_name: s.clinic_name, address: s.address ?? "", phone: s.phone ?? "", matricule: s.matricule ?? "", stamp_data: s.stamp_data ?? "", signature_data: s.signature_data ?? "" }); } }, [s]);

  async function save() {
    if (hours.opens_at >= hours.closes_at || !hours.working_days.length) { toast.error("Vérifiez les jours et horaires d’ouverture."); return; }
    const { error } = await supabase.from("clinic_settings").update({ ...hours, ...f, stamp_data: f.stamp_data || null, signature_data: f.signature_data || null, updated_at: new Date().toISOString() }).eq("id", s?.id ?? "");
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
      <section className="mt-8 border-t pt-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Réservation en ligne</h2><label className="flex items-center gap-3 text-sm"><Switch disabled={!isDoctor} checked={hours.booking_enabled} onCheckedChange={v=>setHours({...hours,booking_enabled:v})} />Activer les réservations</label></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2"><Label>Ouverture</Label><Input type="time" value={hours.opens_at} onChange={e=>setHours({...hours,opens_at:e.target.value})} /></div>
          <div className="space-y-2"><Label>Fermeture</Label><Input type="time" value={hours.closes_at} onChange={e=>setHours({...hours,closes_at:e.target.value})} /></div>
          <div className="space-y-2"><Label>Durée de consultation</Label><Select value={String(hours.slot_minutes)} onValueChange={v=>setHours({...hours,slot_minutes:Number(v)})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[15,30,45,60].map(m=><SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Délai minimum (heures)</Label><Input type="number" min={0} max={168} value={hours.booking_notice_hours} onChange={e=>setHours({...hours,booking_notice_hours:Number(e.target.value)})} /></div>
          <div className="space-y-2"><Label>Fuseau horaire</Label><Select value={hours.timezone} onValueChange={v=>setHours({...hours,timezone:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Africa/Tunis","Africa/Algiers","Africa/Casablanca","Europe/Paris","Europe/London","America/New_York"].map(z=><SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2 sm:col-span-2"><Label>Jours d’ouverture</Label><div className="flex flex-wrap gap-2">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d,i)=><Button key={d} size="sm" variant={hours.working_days.includes(i+1)?"default":"outline"} onClick={()=>setHours({...hours,working_days:hours.working_days.includes(i+1)?hours.working_days.filter(v=>v!==i+1):[...hours.working_days,i+1]})}>{d}</Button>)}</div></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" disabled={!s} onClick={async()=>{try {await navigator.clipboard.writeText(`${window.location.origin}/book?clinic=${s?.id}`);toast.success("Lien de réservation copié");} catch {toast.error("Copie impossible");}}}><Copy />Copier le lien patient</Button>{s && <Button asChild variant="outline"><a href={`/book?clinic=${s.id}`} target="_blank" rel="noreferrer"><ExternalLink />Voir ma page de réservation</a></Button>}</div>
      </section>
    </>
  );
}
