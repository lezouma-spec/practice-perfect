import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft, CalendarPlus, MessageCircle, Pencil, Printer, Plus, Receipt, FileText, Pill, Trash2, ClipboardList, Phone, Cake, IdCard, AlertTriangle, Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientDialog } from "./patients.index";
import { AppointmentDialog, newDraft, type ApptDraft } from "@/components/AppointmentDialog";
import { PayBadge } from "@/components/PayBadge";
import { MEDICATIONS, PLAN_TYPES, TREATMENT_TYPES, payStatus, tnd, useRole, useSettings, waLink } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/patients/$id")({
  head: () => ({ meta: [{ title: "Dossier patient — Dentics" }] }),
  component: PatientPage,
});

function PatientPage() {
  const { id } = Route.useParams();
  const { data: me } = useRole();
  const { data: settings } = useSettings();
  const isDoctor = me?.role === "doctor";
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [rxOpen, setRxOpen] = useState(false);
  const [appt, setAppt] = useState<ApptDraft | null>(null);

  const { data } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const [p, v, plans, rx, ap] = await Promise.all([
        supabase.from("patients").select("*").eq("id", id).single(),
        supabase.from("visits").select("*").eq("patient_id", id).order("visit_date", { ascending: false }),
        supabase.from("treatment_plans").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
        supabase.from("prescriptions").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").eq("patient_id", id).order("starts_at", { ascending: false }).limit(20),
      ]);
      if (p.error) throw p.error;
      return { p: p.data, visits: v.data ?? [], plans: plans.data ?? [], rx: rx.data ?? [], appts: ap.data ?? [] };
    },
  });
  if (!data) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  const { p, visits, plans, rx, appts } = data;
  const cost = visits.reduce((s, v) => s + Number(v.cost), 0);
  const paid = visits.reduce((s, v) => s + Number(v.amount_paid), 0);
  const balance = cost - paid;
  const next = appts.find((a) => a.status === "scheduled" && new Date(a.starts_at) > new Date());
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${p.share_token}` : "";
  const clinic = settings?.clinic_name ?? "le cabinet";
  const waMsg = `Bonjour ${p.full_name}, ${clinic} vous informe :${next ? ` prochain rendez-vous le ${format(new Date(next.starts_at), "EEEE d MMMM 'à' HH:mm", { locale: fr })}.` : ""}${balance > 0 ? ` Solde restant : ${tnd(balance)}.` : ""} Détails : ${shareUrl}`;

  async function del(table: "visits" | "treatment_plans" | "prescriptions", rid: string) {
    if (!confirm("Supprimer définitivement ?")) return;
    const { error } = await supabase.from(table).delete().eq("id", rid);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["patient", id] });
  }
  async function delPatient() {
    if (!confirm(`Supprimer le dossier de ${p.full_name} et tout son historique ?`)) return;
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries();
    navigate({ to: "/patients" });
  }
  async function pay(vid: string, amount: number) {
    const { error } = await supabase.from("visits").update({ amount_paid: amount }).eq("id", vid);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["patient", id] });
  }

  return (
    <div className="animate-fade-up">
      <Link to="/patients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Patients</Link>

      <div className="surface p-6">
        <div className="flex flex-wrap items-start gap-5">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary-soft font-display text-2xl font-semibold text-primary">{p.full_name.slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold">{p.full_name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {p.phone && <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 hover:text-primary"><Phone className="size-4" />{p.phone}</a>}
              {p.birth_date && <span className="flex items-center gap-1.5"><Cake className="size-4" />{format(new Date(p.birth_date), "d MMM yyyy", { locale: fr })}</span>}
              {p.cnam_number && <span className="flex items-center gap-1.5"><IdCard className="size-4" />CNAM {p.cnam_number}</span>}
            </div>
            {p.allergies && <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-danger-soft px-3 py-1 text-sm text-destructive"><AlertTriangle className="size-4" />Allergies : {p.allergies}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Solde</p>
            <p className={`font-display text-2xl font-semibold ${balance > 0 ? "text-warning" : "text-success"}`}>{tnd(balance)}</p>
            {visits.length > 0 && <PayBadge status={payStatus(cost, paid)} />}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
          <Button variant="outline" className="rounded-xl" onClick={() => setAppt(newDraft(new Date(Date.now() + 86400000), id))}><CalendarPlus /> Rendez-vous</Button>
          <Button asChild variant="outline" className="rounded-xl"><a href={waLink(p.phone, waMsg)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
          <Button variant="outline" className="rounded-xl" onClick={() => setEdit(true)}><Pencil /> Modifier</Button>
          <Button asChild variant="outline" className="rounded-xl"><Link to="/print/$kind/$id" params={{ kind: "patient", id }}><Printer /> Imprimer le dossier</Link></Button>
          {isDoctor && <Button variant="ghost" className="rounded-xl text-destructive" onClick={delPatient}><Trash2 /> Supprimer</Button>}
        </div>
      </div>

      <Tabs defaultValue="visits" className="mt-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="visits" className="rounded-lg">Soins ({visits.length})</TabsTrigger>
          <TabsTrigger value="plans" className="rounded-lg">Plan ({plans.filter((x) => x.status === "planned").length})</TabsTrigger>
          <TabsTrigger value="rx" className="rounded-lg">Ordonnances</TabsTrigger>
          <TabsTrigger value="appts" className="rounded-lg">RDV</TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="mt-4 space-y-3">
          <Button className="rounded-xl" onClick={() => setVisitOpen(true)}><Plus /> Ajouter un soin</Button>
          {visits.length === 0 && <Empty text="Aucun soin enregistré." />}
          {visits.map((v) => (
            <div key={v.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{format(new Date(v.visit_date), "d MMMM yyyy", { locale: fr })}</p>
                  <p className="font-semibold">{v.treatment}{v.tooth ? ` · dent ${v.tooth}` : ""}</p>
                  {v.details && <p className="mt-1 text-sm text-muted-foreground">{v.details}</p>}
                  {v.medications && <p className="mt-1 flex items-center gap-1.5 text-sm"><Pill className="size-4 text-primary" />{v.medications}</p>}
                </div>
                <div className="text-right">
                  <p className="font-display font-semibold">{tnd(v.cost)}</p>
                  <PayBadge status={payStatus(Number(v.cost), Number(v.amount_paid))} label={`${tnd(v.amount_paid)} payé`} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {Number(v.amount_paid) < Number(v.cost) && <Button size="sm" variant="outline" className="rounded-lg" onClick={() => pay(v.id, Number(v.cost))}><Check /> Marquer payé</Button>}
                <Button asChild size="sm" variant="outline" className="rounded-lg"><Link to="/print/$kind/$id" params={{ kind: "receipt", id: v.id }}><Receipt /> Reçu{v.cnam_eligible ? " CNAM" : ""}</Link></Button>
                <Button asChild size="sm" variant="outline" className="rounded-lg"><Link to="/print/$kind/$id" params={{ kind: "invoice", id: v.id }}><FileText /> Facture</Link></Button>
                {isDoctor && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del("visits", v.id)}><Trash2 /></Button>}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="plans" className="mt-4 space-y-3">
          {isDoctor ? <PlanForm patientId={id} /> : <p className="text-sm text-muted-foreground">Seul le médecin peut modifier le plan de traitement.</p>}
          {plans.length === 0 && <Empty text="Aucun traitement planifié." />}
          {plans.map((pl) => (
            <div key={pl.id} className="surface flex items-center gap-4 p-4">
              <ClipboardList className={`size-5 ${pl.status === "done" ? "text-success" : "text-primary"}`} />
              <div className="flex-1">
                <p className={`font-medium ${pl.status === "done" ? "text-muted-foreground line-through" : ""}`}>{pl.treatment_type}</p>
                {pl.details && <p className="text-sm text-muted-foreground">{pl.details}</p>}
              </div>
              {isDoctor && pl.status === "planned" && (
                <Button size="sm" variant="outline" className="rounded-lg" onClick={async () => { await supabase.from("treatment_plans").update({ status: "done" }).eq("id", pl.id); qc.invalidateQueries({ queryKey: ["patient", id] }); }}>Fait</Button>
              )}
              {isDoctor && <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del("treatment_plans", pl.id)}><Trash2 /></Button>}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="rx" className="mt-4 space-y-3">
          <Button className="rounded-xl" onClick={() => setRxOpen(true)}><Plus /> Nouvelle ordonnance</Button>
          {rx.length === 0 && <Empty text="Aucune ordonnance." />}
          {rx.map((r) => {
            const items = (r.items as { name: string; posology: string }[]) ?? [];
            return (
              <div key={r.id} className="surface flex items-center gap-4 p-4">
                <Pill className="size-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{format(new Date(r.created_at), "d MMMM yyyy", { locale: fr })}</p>
                  <p className="truncate font-medium">{items.map((i) => i.name).join(", ")}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-lg"><Link to="/print/$kind/$id" params={{ kind: "prescription", id: r.id }}><Printer /> Imprimer</Link></Button>
                {isDoctor && <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del("prescriptions", r.id)}><Trash2 /></Button>}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="appts" className="mt-4">
          <div className="surface divide-y">
            {appts.length === 0 && <Empty text="Aucun rendez-vous." />}
            {appts.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>{format(new Date(a.starts_at), "EEE d MMM yyyy · HH:mm", { locale: fr })} — {a.reason}</span>
                <span className="text-muted-foreground">{({ scheduled: "Prévu", done: "Terminé", cancelled: "Annulé", no_show: "Absent" } as Record<string, string>)[a.status]}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PatientDialog open={edit} onOpenChange={setEdit} initial={edit ? { ...p, phone: p.phone ?? "" } as never : undefined} />
      <VisitDialog open={visitOpen} onOpenChange={setVisitOpen} patientId={id} />
      <RxDialog open={rxOpen} onOpenChange={setRxOpen} patientId={id} />
      <AppointmentDialog open={!!appt} onOpenChange={(o) => !o && setAppt(null)} draft={appt} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</p>;
}

function PlanForm({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [type, setType] = useState(PLAN_TYPES[0] ?? "Autre");
  const [details, setDetails] = useState("");
  async function add() {
    const { error } = await supabase.from("treatment_plans").insert({ patient_id: patientId, treatment_type: type, details: details.trim().slice(0, 500) || null });
    if (error) { toast.error(error.message); return; }
    setDetails("");
    qc.invalidateQueries({ queryKey: ["patient", patientId] });
  }
  return (
    <div className="surface flex flex-wrap gap-2 p-4">
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>{PLAN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
      </Select>
      <Input className="min-w-48 flex-1" placeholder="Détails (dent, matériau…)" value={details} onChange={(e) => setDetails(e.target.value)} />
      <Button className="rounded-xl" onClick={add}><Plus /> Planifier</Button>
    </div>
  );
}

function VisitDialog({ open, onOpenChange, patientId }: { open: boolean; onOpenChange: (o: boolean) => void; patientId: string }) {
  const qc = useQueryClient();
  const empty = { visit_date: format(new Date(), "yyyy-MM-dd"), treatment: TREATMENT_TYPES[0] ?? "Consultation", tooth: "", details: "", medications: "", cost: "", amount_paid: "", cnam_eligible: true };
  const [f, setF] = useState(empty);
  async function save() {
    const cost = Number(f.cost || 0), paid = Number(f.amount_paid || 0);
    if (!Number.isFinite(cost) || !Number.isFinite(paid) || cost < 0 || paid < 0 || paid > cost) { toast.error("Montants invalides"); return; }
    const { error } = await supabase.from("visits").insert({
      patient_id: patientId, visit_date: f.visit_date, treatment: f.treatment, tooth: f.tooth || null, details: f.details || null,
      medications: f.medications || null, cost, amount_paid: paid, cnam_eligible: f.cnam_eligible,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Soin enregistré");
    setF(empty);
    qc.invalidateQueries();
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader><DialogTitle>Nouveau soin</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={f.visit_date} onChange={(e) => setF({ ...f, visit_date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Dent(s)</Label><Input placeholder="ex. 36" value={f.tooth} onChange={(e) => setF({ ...f, tooth: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Traitement</Label>
            <Select value={f.treatment} onValueChange={(v) => setF({ ...f, treatment: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TREATMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Détails</Label><Textarea rows={2} value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Médicaments donnés</Label><Input value={f.medications} onChange={(e) => setF({ ...f, medications: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Coût (DT)</Label><Input type="number" step="0.001" min="0" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Montant payé (DT)</Label><Input type="number" step="0.001" min="0" value={f.amount_paid} onChange={(e) => setF({ ...f, amount_paid: e.target.value })} /></div>
          <label className="flex items-center gap-3 sm:col-span-2"><Switch checked={f.cnam_eligible} onCheckedChange={(c) => setF({ ...f, cnam_eligible: c })} /> Éligible CNAM</label>
        </div>
        <Button className="mt-2 h-11 rounded-xl" onClick={save}>Enregistrer</Button>
      </DialogContent>
    </Dialog>
  );
}

function RxDialog({ open, onOpenChange, patientId }: { open: boolean; onOpenChange: (o: boolean) => void; patientId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [items, setItems] = useState<{ name: string; posology: string }[]>([]);
  const [custom, setCustom] = useState("");
  const [notes, setNotes] = useState("");
  async function save() {
    if (!items.length) { toast.error("Ajoutez au moins un médicament"); return; }
    const { data, error } = await supabase.from("prescriptions").insert({ patient_id: patientId, items, notes: notes || null }).select("id").single();
    if (error) { toast.error(error.message); return; }
    setItems([]); setNotes("");
    qc.invalidateQueries({ queryKey: ["patient", patientId] });
    onOpenChange(false);
    navigate({ to: "/print/$kind/$id", params: { kind: "prescription", id: data.id } });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader><DialogTitle>Nouvelle ordonnance</DialogTitle></DialogHeader>
        <Select value="" onValueChange={(v) => { const m = MEDICATIONS.find((x) => x.name === v); if (m) setItems([...items, { ...m }]); }}>
          <SelectTrigger><SelectValue placeholder="Ajouter un médicament courant…" /></SelectTrigger>
          <SelectContent>{MEDICATIONS.map((m) => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input placeholder="Autre médicament" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <Button variant="outline" onClick={() => { if (custom.trim()) { setItems([...items, { name: custom.trim(), posology: "" }]); setCustom(""); } }}><Plus /></Button>
        </div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="rounded-xl border p-3">
              <div className="flex items-center justify-between"><p className="font-medium">{it.name}</p>
                <button className="text-muted-foreground hover:text-destructive" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="size-4" /></button></div>
              <Input className="mt-2" placeholder="Posologie" value={it.posology} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, posology: e.target.value } : x)))} />
            </div>
          ))}
        </div>
        <Textarea placeholder="Remarques (facultatif)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button className="h-11 rounded-xl" onClick={save}><Printer /> Enregistrer et imprimer</Button>
      </DialogContent>
    </Dialog>
  );
}
