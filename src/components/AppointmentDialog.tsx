import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addMinutes } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TREATMENT_TYPES } from "@/lib/clinic";

export type ApptDraft = { id?: string; patient_id?: string; date: string; time: string; duration: number; reason: string; status?: string };

export function AppointmentDialog({ open, onOpenChange, draft, canDelete }: { open: boolean; onOpenChange: (o: boolean) => void; draft: ApptDraft | null; canDelete?: boolean }) {
  const qc = useQueryClient();
  const [f, setF] = useState<ApptDraft | null>(draft);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setF(draft); setSearch(""); }, [draft]);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-min"],
    queryFn: async () => (await supabase.from("patients").select("id, full_name, phone").order("full_name")).data ?? [],
  });

  if (!f) return null;
  const filtered = patients.filter((p) => p.full_name.toLowerCase().includes(search.toLowerCase()) || (p.phone ?? "").includes(search)).slice(0, 50);

  async function save() {
    if (!f?.patient_id) return toast.error("Choisissez un patient");
    setSaving(true);
    const starts = new Date(`${f.date}T${f.time}`);
    const row = { patient_id: f.patient_id, starts_at: starts.toISOString(), ends_at: addMinutes(starts, f.duration).toISOString(), reason: f.reason, status: f.status ?? "scheduled" };
    const { error } = f.id ? await supabase.from("appointments").update(row).eq("id", f.id) : await supabase.from("appointments").insert(row);
    setSaving(false);
    if (error) return toast.error(error.code === "23P01" ? "Ce créneau est déjà pris." : error.message);
    toast.success("Rendez-vous enregistré");
    qc.invalidateQueries();
    onOpenChange(false);
  }

  async function setStatus(status: string) {
    if (!f?.id) return;
    const { error } = await supabase.from("appointments").update({ status }).eq("id", f.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    onOpenChange(false);
  }

  async function remove() {
    if (!f?.id || !confirm("Supprimer ce rendez-vous ?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", f.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader><DialogTitle>{f.id ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Input placeholder="Rechercher nom ou téléphone…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={f.patient_id} onValueChange={(v) => setF({ ...f, patient_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir un patient" /></SelectTrigger>
              <SelectContent>{filtered.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}{p.phone ? ` · ${p.phone}` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-1.5"><Label>Date</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Heure</Label><Input type="time" step={900} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Durée</Label>
              <Select value={String(f.duration)} onValueChange={(v) => setF({ ...f, duration: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[15, 30, 45, 60, 90, 120].map((m) => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Motif</Label>
            <Select value={f.reason} onValueChange={(v) => setF({ ...f, reason: v })}>
              <SelectTrigger><SelectValue placeholder="Motif" /></SelectTrigger>
              <SelectContent>{TREATMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {f.id && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatus("done")}>Marquer terminé</Button>
              <Button size="sm" variant="outline" onClick={() => setStatus("no_show")}>Absent</Button>
              <Button size="sm" variant="outline" onClick={() => setStatus("cancelled")}>Annuler</Button>
              {canDelete && <Button size="sm" variant="ghost" className="text-destructive" onClick={remove}>Supprimer</Button>}
            </div>
          )}
          <Button className="h-11 w-full rounded-xl" onClick={save} disabled={saving}>Enregistrer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const newDraft = (d = new Date(), patient_id?: string): ApptDraft => ({ date: format(d, "yyyy-MM-dd"), time: format(d, "HH:mm"), duration: 30, reason: "Consultation", patient_id });
