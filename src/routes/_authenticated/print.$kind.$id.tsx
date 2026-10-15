import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { tnd, useSettings, payStatus, PAY_LABEL } from "@/lib/clinic";
import { useT } from "@/lib/i18n";
import { TemplateBody, TEMPLATE_KINDS } from "@/components/DocTemplates";

export const Route = createFileRoute("/_authenticated/print/$kind/$id")({
  validateSearch: (s: Record<string, unknown>): { days?: string; text?: string; lines?: string } => ({
    days: typeof s.days === "string" ? s.days.slice(0, 4) : undefined,
    text: typeof s.text === "string" ? s.text.slice(0, 2000) : undefined,
    lines: typeof s.lines === "string" ? s.lines.slice(0, 3000) : undefined,
  }),
  head: () => ({ meta: [{ title: "Impression — Dentics" }] }),
  component: PrintPage,
});

const TITLES: Record<string, string> = { receipt: "Reçu de soins", invoice: "Facture", prescription: "Ordonnance", patient: "Dossier patient", certificate: "Certificat médical", quote: "Devis", postop: "Conseils post-opératoires", consent: "Consentement éclairé" };

function PrintPage() {
  const { kind, id } = Route.useParams();
  const router = useRouter();
  const search = Route.useSearch();
  const { t, lang } = useT();
  const { data: s } = useSettings();
  const { data } = useQuery({
    queryKey: ["print", kind, id],
    queryFn: async () => {
      if (kind === "receipt" || kind === "invoice") {
        const { data } = await supabase.from("visits").select("*, patients(*)").eq("id", id).single();
        return { visit: data, patient: data?.patients };
      }
      if (kind === "prescription") {
        const { data } = await supabase.from("prescriptions").select("*, patients(*)").eq("id", id).single();
        return { rx: data, patient: data?.patients };
      }
      if (TEMPLATE_KINDS.includes(kind)) {
        const { data } = await supabase.from("patients").select("*").eq("id", id).single();
        return { patient: data };
      }
      const [p, v, pl] = await Promise.all([
        supabase.from("patients").select("*").eq("id", id).single(),
        supabase.from("visits").select("*").eq("patient_id", id).order("visit_date"),
        supabase.from("treatment_plans").select("*").eq("patient_id", id).eq("status", "planned"),
      ]);
      return { patient: p.data, visits: v.data ?? [], plans: pl.data ?? [] };
    },
  });

  const p = data?.patient;
  const docNo = id.slice(0, 8).toUpperCase();
  const date = data?.visit?.visit_date ?? data?.rx?.created_at ?? new Date().toISOString();

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.history.back()}><ArrowLeft /> {t("Retour")}</Button>
        <Button className="rounded-xl" onClick={() => window.print()}><Printer /> {t("Imprimer / PDF")}</Button>
      </div>
      <p className="no-print mb-4 text-center text-xs text-muted-foreground">Pour un PDF, choisissez « Enregistrer au format PDF » dans la fenêtre d'impression.</p>

      <article dir={lang === "ar" ? "rtl" : "ltr"} className="print-sheet surface mx-auto flex min-h-[1000px] max-w-[794px] flex-col p-12 text-[14px]">
        <header className="flex items-start justify-between border-b-2 border-primary pb-5">
          <div>
            <h2 className="text-xl font-semibold">{s?.doctor_name}</h2>
            <p className="text-muted-foreground">{t("Médecin dentiste")}</p>
            {s?.matricule && <p className="text-xs text-muted-foreground">Matricule / Code CNAM : {s.matricule}</p>}
          </div>
          <div className="text-end text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">{s?.clinic_name}</p>
            <p>{s?.address}</p>
            <p>{s?.phone}</p>
          </div>
        </header>

        <div className="mt-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">{t(TITLES[kind] ?? "")}</h1>
            {kind !== "patient" && !TEMPLATE_KINDS.includes(kind) && <p className="text-sm text-muted-foreground">N° {docNo}</p>}
          </div>
          <p className="text-sm">{t("Le")} {format(new Date(date), "d MMMM yyyy", { locale: fr })}</p>
        </div>

        {p && (
          <div className="mt-6 rounded-xl bg-muted px-5 py-4">
            <p><span className="text-muted-foreground">{t("Patient")} : </span><b>{p.full_name}</b></p>
            <div className="flex flex-wrap gap-x-6 text-sm text-muted-foreground">
              {p.birth_date && <span>Né(e) le {format(new Date(p.birth_date), "dd/MM/yyyy")}</span>}
              {p.cnam_number && <span>N° CNAM : {p.cnam_number}</span>}
              {p.phone && <span>Tél : {p.phone}</span>}
            </div>
          </div>
        )}

        <div className="mt-8 flex-1">
          {(kind === "receipt" || kind === "invoice") && data?.visit && (
            <>
              <table className="w-full text-left">
                <thead><tr className="border-b text-sm text-muted-foreground"><th className="py-2">{t("Désignation")}</th><th>{t("Dent")}</th><th className="text-right">{t("Montant")}</th></tr></thead>
                <tbody>
                  <tr className="border-b"><td className="py-3">{data.visit.treatment}{data.visit.details ? <span className="block text-sm text-muted-foreground">{data.visit.details}</span> : null}</td><td>{data.visit.tooth}</td><td className="text-right">{tnd(data.visit.cost)}</td></tr>
                </tbody>
              </table>
              <div className="ml-auto mt-4 w-64 space-y-1 text-sm">
                <div className="flex justify-between"><span>{t("Total")}</span><b>{tnd(data.visit.cost)}</b></div>
                <div className="flex justify-between"><span>{t("Payé")}</span><span>{tnd(data.visit.amount_paid)}</span></div>
                <div className="flex justify-between border-t pt-1"><span>{t("Reste")}</span><b>{tnd(Number(data.visit.cost) - Number(data.visit.amount_paid))}</b></div>
                <p className="pt-1 text-right text-xs text-muted-foreground">Statut : {PAY_LABEL[payStatus(Number(data.visit.cost), Number(data.visit.amount_paid))]}</p>
              </div>
              {kind === "receipt" && data.visit.cnam_eligible && (
                <p className="mt-8 inline-block rounded-lg border-2 border-primary px-4 py-2 font-semibold text-primary">{t("✓ Acte éligible au remboursement CNAM")}</p>
              )}
            </>
          )}

          {kind === "prescription" && data?.rx && (
            <ol className="space-y-5">
              {(data.rx.items as { name: string; posology: string }[]).map((it, i) => (
                <li key={i}><p className="font-semibold">{i + 1}. {it.name}</p><p className="ml-5 text-muted-foreground">{it.posology}</p></li>
              ))}
              {data.rx.notes && <p className="mt-6 text-sm italic">{data.rx.notes}</p>}
            </ol>
          )}

          {TEMPLATE_KINDS.includes(kind) && p && <TemplateBody kind={kind} lang={lang} patient={p} doctor={s?.doctor_name ?? ""} search={search} />}

          {kind === "patient" && data && "visits" in data && (
            <>
              {p?.allergies && <p className="mb-4"><b>Allergies :</b> {p.allergies}</p>}
              <h3 className="mb-2 font-semibold">{t("Historique des soins")}</h3>
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b text-muted-foreground"><th className="py-2">{t("Date")}</th><th>{t("Soin")}</th><th>{t("Médicaments")}</th><th className="text-right">{t("Coût")}</th><th className="text-right">{t("Payé")}</th></tr></thead>
                <tbody>
                  {data.visits!.map((v) => (
                    <tr key={v.id} className="border-b"><td className="py-2">{format(new Date(v.visit_date), "dd/MM/yyyy")}</td><td>{v.treatment}{v.tooth ? ` (${v.tooth})` : ""}</td><td>{v.medications}</td><td className="text-right">{tnd(v.cost)}</td><td className="text-right">{tnd(v.amount_paid)}</td></tr>
                  ))}
                </tbody>
              </table>
              {!!data.plans?.length && (<><h3 className="mb-2 mt-6 font-semibold">{t("Traitements prévus")}</h3><ul className="list-disc pl-5">{data.plans.map((pl) => <li key={pl.id}>{pl.treatment_type}{pl.details ? ` — ${pl.details}` : ""}</li>)}</ul></>)}
            </>
          )}
        </div>

        <footer className="mt-10 flex items-end justify-end gap-6">
          <div className="text-center">
            <p className="mb-2 text-sm text-muted-foreground">{t("Cachet et signature")}</p>
            <div className="flex h-28 items-center justify-center gap-2">
              {s?.stamp_data && <img src={s.stamp_data} alt="Cachet" className="max-h-28 max-w-40 object-contain" />}
              {s?.signature_data && <img src={s.signature_data} alt="Signature" className="max-h-24 max-w-40 object-contain" />}
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
