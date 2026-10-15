import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Camera, FileSpreadsheet, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./route";
import { PatientDialog } from "./patients.index";
import { extractPatientFromImage } from "@/lib/ocr.functions";

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({ meta: [{ title: "Import — Dentics" }] }),
  component: ImportPage,
});

type Row = { full_name: string; phone: string | null; birth_date: string | null; address: string | null; cnam_number: string | null };

const pick = (r: Record<string, unknown>, keys: string[]) => {
  const k = Object.keys(r).find((k) => keys.some((x) => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(x)));
  const v = k ? r[k] : null;
  return v == null || v === "" ? null : String(v).trim();
};
function toDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${(m[2] ?? "").padStart(2, "0")}-${(m[1] ?? "").padStart(2, "0")}`;
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

function ImportPage() {
  const qc = useQueryClient();
  const ocr = useServerFn(extractPatientFromImage);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [draft, setDraft] = useState<Record<string, string> | undefined>();
  const [raw, setRaw] = useState("");

  async function onExcel(file: File) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    const first = wb.SheetNames[0];
    const sheet = first ? wb.Sheets[first] : undefined;
    if (!sheet) throw new Error("Fichier vide");
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    const parsed = json.map((r) => {
      const dateKey = Object.keys(r).find((k) => /naiss|birth|date/i.test(k));
      return {
        full_name: pick(r, ["nom", "name", "patient"]) ?? "",
        phone: pick(r, ["tel", "phone", "mobile", "gsm"]),
        birth_date: toDate(dateKey ? r[dateKey] : null),
        address: pick(r, ["adresse", "address", "ville"]),
        cnam_number: pick(r, ["cnam", "assur"]),
      };
    }).filter((r) => r["full_name"].length >= 2).slice(0, 5000);
    setRows(parsed);
    if (!parsed.length) toast.error("Aucune colonne « Nom » reconnue");
  }

  async function importRows() {
    setBusy(true);
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from("patients").insert(rows.slice(i, i + 200).map((r) => ({ ...r, full_name: r["full_name"].slice(0, 120) })));
      if (error) { setBusy(false); return toast.error(error.message); }
    }
    setBusy(false);
    toast.success(`${rows.length} patients importés`);
    setRows([]);
    qc.invalidateQueries();
  }

  async function onPhoto(file: File) {
    setOcrBusy(true);
    try {
      const image = await resize(file);
      const r = await ocr({ data: { image } });
      setRaw(r["raw_text"] ?? "");
      setDraft({
        full_name: r["full_name"] ?? "", phone: r["phone"] ?? "", birth_date: r["birth_date"] ?? "", address: r["address"] ?? "",
        allergies: r["allergies"] ?? "", notes: [r["notes"], r["raw_text"] ? `Texte lu : ${r["raw_text"]}` : ""].filter(Boolean).join("\n").slice(0, 2000),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lecture impossible");
    }
    setOcrBusy(false);
  }

  return (
    <>
      <PageHeader title="Import" subtitle="Ajoutez des patients en masse ou depuis une photo" />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><FileSpreadsheet className="size-5" /></span>
          <h2 className="mt-4 font-semibold">Fichier Excel</h2>
          <p className="mt-1 text-sm text-muted-foreground">Colonnes reconnues : Nom, Téléphone, Date de naissance, Adresse, CNAM.</p>
          <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted">
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && onExcel(e.target.files[0])} />
            Choisir un fichier .xlsx / .csv
          </label>
          {rows.length > 0 && (
            <>
              <div className="mt-4 max-h-60 overflow-auto rounded-xl border text-sm">
                <table className="w-full"><thead className="sticky top-0 bg-muted text-left"><tr><th className="p-2">Nom</th><th>Téléphone</th><th>Naissance</th></tr></thead>
                  <tbody>{rows.slice(0, 100).map((r, i) => <tr key={i} className="border-t"><td className="p-2">{r["full_name"]}</td><td>{r["phone"]}</td><td>{r["birth_date"]}</td></tr>)}</tbody></table>
              </div>
              <Button className="mt-4 w-full rounded-xl" disabled={busy} onClick={importRows}>{busy && <Loader2 className="animate-spin" />}Importer {rows.length} patients</Button>
            </>
          )}
        </section>

        <section className="surface p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><Camera className="size-5" /></span>
          <h2 className="mt-4 flex items-center gap-2 font-semibold">Photo d'une fiche manuscrite <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">Meilleur effort</span></h2>
          <p className="mt-1 text-sm text-muted-foreground">Prenez la fiche en photo : le texte est lu et pré-remplit le formulaire.</p>
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-xs"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />La lecture automatique peut se tromper. Vérifiez toujours chaque champ avant d'enregistrer.</p>
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary p-4 text-sm font-medium text-primary-foreground">
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
            {ocrBusy ? <><Loader2 className="size-4 animate-spin" /> Lecture en cours…</> : <><Sparkles className="size-4" /> Prendre / choisir une photo</>}
          </label>
          {raw && <p className="mt-3 line-clamp-4 text-xs text-muted-foreground">Texte lu : {raw}</p>}
        </section>
      </div>
      <PatientDialog open={!!draft} onOpenChange={(o) => !o && setDraft(undefined)} initial={draft} />
    </>
  );
}

async function resize(file: File): Promise<string> {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = img.width * scale; c.height = img.height * scale;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Lecture impossible");
  ctx.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(img.src);
  return c.toDataURL("image/jpeg", 0.85);
}
