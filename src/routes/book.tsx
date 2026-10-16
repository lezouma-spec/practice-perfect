import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Loader2, Stethoscope, Phone, MapPin, Clock, ChevronLeft, ChevronRight, ArrowLeft, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>) => ({ clinic: typeof s["clinic"] === "string" ? s["clinic"] : "" }),
  head: () => ({ meta: [{ title: "Réserver une consultation — Dentics" }, { name: "description", content: "Choisissez un créneau disponible auprès de votre cabinet dentaire." }, { property: "og:title", content: "Consultation dentaire — Dentics" }, { property: "og:description", content: "Les disponibilités de votre dentiste, en temps réel." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Book,
});
function Book() {
  const { clinic } = Route.useSearch();
  const valid = /^[0-9a-f-]{36}$/i.test(clinic);
  const { data: practice, isLoading, isError } = useQuery({ queryKey: ["booking-clinic", clinic], enabled: valid, queryFn: async () => { const r = await supabase.rpc("booking_clinic", { c: clinic }); if (r.error) throw r.error; return r.data[0] ?? null; } });
  const { data: slots = [], refetch } = useQuery({ queryKey: ["available-slots", clinic], enabled: valid, refetchInterval: 30000, queryFn: async () => { const r = await supabase.rpc("available_slots", { c: clinic }); if (r.error) throw r.error; return r.data; } });
  const [chosen, setChosen] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const [details, setDetails] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const zone = practice?.timezone ?? "Africa/Tunis";
  const dateKey = (date: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
  const timeLabel = (date: string) => new Intl.DateTimeFormat("fr", { timeZone: zone, hour: "2-digit", minute: "2-digit" }).format(new Date(date));
  const longLabel = (date: string) => new Intl.DateTimeFormat("fr", { timeZone: zone, dateStyle: "full", timeStyle: "short" }).format(new Date(date));
  const dates = [...new Set(slots.map(s => dateKey(s.starts_at)))];
  const day = selectedDay || dates[0] || "";
  const nowKey = dateKey(new Date().toISOString());
  const baseMonth = new Date(`${nowKey.slice(0, 7)}-01T12:00:00Z`);
  baseMonth.setUTCMonth(baseMonth.getUTCMonth() + monthOffset);
  const year = baseMonth.getUTCFullYear(), month = baseMonth.getUTCMonth();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const padding = (baseMonth.getUTCDay() + 6) % 7;
  const monthLabel = baseMonth.toLocaleDateString("fr", { month: "long", year: "numeric", timeZone: "UTC" });
  async function reserve(e: React.FormEvent) {
    e.preventDefault();
    if (!chosen || name.trim().length < 2 || !/^[+\d\s]{8,20}$/.test(phone)) { toast.error("Vérifiez votre nom et votre téléphone."); return; }
    setBusy(true);
    const r = await supabase.rpc("reserve_slot", { c: clinic, chosen, patient_name: name.trim(), patient_phone: phone.trim() });
    setBusy(false);
    if (r.error) { toast.error("Ce créneau n’est plus disponible. Choisissez un autre horaire."); await refetch(); setDetails(false); setChosen(""); return; }
    setDone(true);
  }
  return <div className="min-h-screen bg-background">
    <header className="border-b bg-card"><div className="mx-auto flex h-18 max-w-5xl items-center justify-between px-5"><Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold"><Stethoscope className="size-6 text-primary" />Dentics</Link><span className="text-xs text-muted-foreground">Rendez-vous en ligne</span></div></header>
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : !valid || !practice || isError ? <div className="py-20 text-center"><h1 className="text-2xl font-semibold">Lien de cabinet indisponible</h1><p className="mt-3 text-muted-foreground">Contactez votre cabinet pour obtenir son lien de rendez-vous.</p><Button asChild variant="outline" className="mt-5"><Link to="/">Retour à Dentics</Link></Button></div> :
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="lg:border-e lg:pe-8"><span className="grid size-14 place-items-center rounded-lg bg-primary-soft text-primary"><Stethoscope className="size-7" /></span><p className="mt-5 text-sm font-medium text-primary">{practice.clinic_name}</p><h1 className="mt-2 text-2xl font-semibold">{practice.doctor_name || "Votre dentiste"}</h1><h2 className="mt-6 text-xl font-semibold">Consultation dentaire</h2><p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" />{practice.slot_minutes} minutes</p>{practice.address && <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" />{practice.address}</p>}{practice.phone && <a href={`tel:${practice.phone}`} className="mt-4 flex items-center gap-2 text-sm text-primary"><Phone className="size-4" />{practice.phone}</a>}<p className="mt-6 border-t pt-4 text-xs text-muted-foreground">Heure du cabinet · {zone}</p></aside>
        <section>
          {done ? <div className="py-10"><CheckCircle2 className="size-12 text-success" /><h2 className="mt-5 text-2xl font-semibold">Rendez-vous confirmé</h2><p className="mt-4 flex items-start gap-3 text-primary"><CalendarDays className="size-5 shrink-0" />{longLabel(chosen)}</p><p className="mt-3 text-sm text-muted-foreground">{name}, votre consultation est enregistrée auprès de {practice.doctor_name || practice.clinic_name}.</p>{practice.phone && <Button asChild variant="outline" className="mt-6"><a href={`tel:${practice.phone}`}><Phone />Contacter le cabinet</a></Button>}</div> : details ? <><Button variant="ghost" size="sm" onClick={() => setDetails(false)}><ArrowLeft />Retour aux créneaux</Button><h2 className="mt-4 text-2xl font-semibold">Vos coordonnées</h2><p className="mt-3 text-sm text-primary">{longLabel(chosen)}</p><form onSubmit={reserve} className="mt-6 max-w-md space-y-5"><div className="space-y-2"><Label htmlFor="booking-name">Nom et prénom</Label><Input id="booking-name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="booking-phone">Téléphone</Label><Input id="booking-phone" required type="tel" maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} /></div><Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Confirmer le rendez-vous</Button></form></> : <><h2 className="text-2xl font-semibold">Choisissez un créneau</h2><div className="mt-6 grid gap-7 sm:grid-cols-[1fr_150px]"><div><div className="mb-5 flex items-center justify-between"><h3 className="font-medium capitalize">{monthLabel}</h3><div className="flex"><Button size="icon" variant="ghost" disabled={monthOffset===0} aria-label="Mois précédent" onClick={() => setMonthOffset(0)}><ChevronLeft /></Button><Button size="icon" variant="ghost" disabled={monthOffset===1} aria-label="Mois suivant" onClick={() => setMonthOffset(1)}><ChevronRight /></Button></div></div><div className="grid grid-cols-7 gap-1 text-center">{["L", "M", "M", "J", "V", "S", "D"].map((d,i) => <span key={i} className="py-2 text-xs text-muted-foreground">{d}</span>)}{Array.from({length:padding},(_,i) => <span key={`pad-${i}`} />)}{Array.from({length:count},(_,i) => { const key = `${year}-${String(month+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`; return <Button key={key} variant={day===key ? "default" : dates.includes(key) ? "secondary" : "ghost"} disabled={!dates.includes(key)} className="h-10 px-0" aria-label={`Choisir le ${key}`} onClick={() => {setSelectedDay(key);setChosen("");}}>{i+1}</Button>; })}</div></div><div><h3 className="mb-3 text-sm font-medium">{day ? new Date(`${day}T12:00:00`).toLocaleDateString("fr",{day:"numeric",month:"long"}) : "Disponibilités"}</h3><div className="max-h-80 space-y-2 overflow-y-auto pe-1">{slots.filter(s=>dateKey(s.starts_at)===day).map(s=><Button key={s.starts_at} variant="outline" className={cn("w-full border-primary text-primary", chosen===s.starts_at && "bg-primary-soft")} onClick={()=>{setChosen(s.starts_at);setDetails(true);}}>{timeLabel(s.starts_at)}</Button>)}{!slots.length && <p className="text-sm text-muted-foreground">Aucun créneau disponible. Contactez le cabinet.</p>}</div></div></div></>}
        </section>
      </div>}
    </main>
  </div>;
}
