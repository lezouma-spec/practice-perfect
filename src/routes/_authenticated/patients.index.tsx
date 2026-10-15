import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, UserPlus, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "./route";
import { payStatus, PAY_LABEL, tnd } from "@/lib/clinic";
import { PayBadge } from "@/components/PayBadge";

export const Route = createFileRoute("/_authenticated/patients/")({
  head: () => ({ meta: [{ title: "Patients — Dentics" }, { name: "description", content: "Patients — Dentics : espace professionnel de votre cabinet dentaire." }, { property: "og:title", content: "Patients — Dentics" }, { property: "og:description", content: "Patients — Dentics : gestion de votre cabinet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Patients,
});

export const patientSchema = z.object({
  full_name: z.string().trim().min(2, "Nom requis").max(120),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  cnam_number: z.string().trim().max(40).optional().or(z.literal("")),
  allergies: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

function Patients() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => (await supabase.from("patients").select("id, full_name, phone, birth_date, visits(cost, amount_paid)").order("full_name")).data ?? [],
  });
  const list = data.filter((p) => p.full_name.toLowerCase().includes(q.toLowerCase()) || (p.phone ?? "").includes(q));

  return (
    <>
      <PageHeader title="Patients" subtitle={`${data.length} dossiers`} actions={<Button className="rounded-xl" onClick={() => setOpen(true)}><UserPlus /> Nouveau patient</Button>} />
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-11 rounded-xl pl-10" placeholder="Rechercher par nom ou téléphone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="surface divide-y">
        {list.length === 0 && <p className="p-10 text-center text-muted-foreground">Aucun patient.</p>}
        {list.map((p) => {
          const cost = p.visits.reduce((s, v) => s + Number(v.cost), 0);
          const paid = p.visits.reduce((s, v) => s + Number(v.amount_paid), 0);
          const st = payStatus(cost, paid);
          return (
            <Link key={p.id} to="/patients/$id" params={{ id: p.id }} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/60">
              <span className="grid size-10 place-items-center rounded-full bg-primary-soft font-semibold text-primary">{p.full_name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.full_name}</p>
                <p className="text-sm text-muted-foreground">{p.phone || "—"}</p>
              </div>
              {p.visits.length > 0 && <PayBadge status={st} label={st === "paid" ? PAY_LABEL.paid : tnd(cost - paid)} />}
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
      <PatientDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function PatientDialog({ open, onOpenChange, initial, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: (Partial<z.infer<typeof patientSchema>> & { id?: string }) | undefined; onSaved?: ((patient: { id: string; full_name: string }) => void) | undefined }) {
  const qc = useQueryClient();
  const empty = { full_name: "", phone: "", birth_date: "", address: "", cnam_number: "", allergies: "", notes: "" };
  const [f, setF] = useState({ ...empty, ...stripNulls(initial) });
  const [saving, setSaving] = useState(false);
  const [key, setKey] = useState(initial);
  if (key !== initial) { setKey(initial); setF({ ...empty, ...stripNulls(initial) }); }

  async function save() {
    const p = patientSchema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "Champs invalides"); return; }
    setSaving(true);
    const row = { full_name: p.data.full_name, phone: p.data.phone || null, birth_date: p.data.birth_date || null, address: p.data.address || null, cnam_number: p.data.cnam_number || null, allergies: p.data.allergies || null, notes: p.data.notes || null };
    const result = initial?.id
      ? await supabase.from("patients").update(row).eq("id", initial.id).select("id, full_name").single()
      : await supabase.from("patients").insert(row).select("id, full_name").single();
    setSaving(false);
    if (result.error) { toast.error(result.error.message); return; }
    onSaved?.(result.data);
    if (!initial?.id) setF(empty);
    toast.success("Patient enregistré");
    qc.invalidateQueries();
    onOpenChange(false);
  }

  const field = (k: keyof typeof empty, label: string, type = "text") => (
    <div className="space-y-1.5"><Label>{label}</Label><Input type={type} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader><DialogTitle>{initial?.id ? "Modifier le patient" : "Nouveau patient"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("full_name", "Nom et prénom")}</div>
          {field("phone", "Téléphone (WhatsApp)", "tel")}
          {field("birth_date", "Date de naissance", "date")}
          {field("cnam_number", "N° CNAM")}
          {field("allergies", "Allergies")}
          <div className="sm:col-span-2">{field("address", "Adresse")}</div>
          <div className="sm:col-span-2">{field("notes", "Notes")}</div>
        </div>
        <Button className="mt-2 h-11 rounded-xl" disabled={saving} onClick={save}>Enregistrer</Button>
      </DialogContent>
    </Dialog>
  );
}

function stripNulls(o?: object) {
  return Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k, v ?? ""]));
}
