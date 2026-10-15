import { useT, LangToggle } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>) => ({ clinic: typeof s["clinic"] === "string" ? s["clinic"] : "" }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Demander un rendez-vous — Dentics" },
      { name: "description", content: "Demandez un rendez-vous chez votre dentiste ; le cabinet vous rappelle pour confirmer." },
      { property: "og:title", content: "Demander un rendez-vous" },
      { property: "og:description", content: "Laissez votre nom et numéro, nous vous rappelons pour confirmer." },
    ],
  }),
  component: Book,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Nom trop court").max(100),
  phone: z.string().trim().regex(/^[+\d\s]{8,20}$/, "Numéro invalide"),
  preferred: z.string().trim().max(200).optional(),
});

function Book() {
  const { t } = useT();
  const { clinic } = Route.useSearch();
  const { data: practice } = useQuery({ queryKey: ["public-clinic", clinic], enabled: !!clinic, queryFn: async () => { const result = await supabase.rpc("public_clinic", { c: clinic }); if (result.error) throw result.error; return result.data[0] ?? null; } });
  const [form, setForm] = useState({ full_name: "", phone: "", preferred: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(form);
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "Champs invalides"); return; }
    if (!practice) { toast.error("Lien de cabinet invalide"); return; }
    setLoading(true);
    const { error } = await supabase.from("booking_requests").insert({ clinic_id: clinic, full_name: p.data.full_name, phone: p.data.phone, preferred: p.data.preferred || null });
    setLoading(false);
    if (error) { toast.error("Envoi impossible, réessayez."); return; }
    setDone(true);
  }

  return (
    <div className="bg-hero grid min-h-screen place-items-center px-4">
      <div className="surface w-full max-w-md p-8 animate-fade-up">
        <Link to="/" className="mb-6 flex items-center gap-2 font-display font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Stethoscope className="size-4" /></span> Dentics
        </Link>
        <div className="-mt-12 mb-6 flex justify-end"><LangToggle /></div>
        {!clinic ? <><h1 className="text-2xl font-semibold">Votre cabinet dentaire</h1><p className="mt-3 text-muted-foreground">Demandez le lien de rendez-vous à votre cabinet.</p><Button asChild className="mt-5"><Link to="/">Retour à Dentics</Link></Button></> : done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto size-12 text-success" />
            <h1 className="mt-4 text-2xl font-semibold">{t("Demande envoyée")}</h1>
            <p className="mt-2 text-muted-foreground">{t("Le cabinet vous appellera très bientôt pour confirmer votre rendez-vous.")}</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm font-medium text-primary">{practice?.clinic_name}</p><h1 className="text-2xl font-semibold">{t("Demander un rendez-vous")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("Ce n'est pas encore une réservation : nous vous rappelons pour confirmer.")}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5"><Label>{t("Nom et prénom")}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>{t("Téléphone")}</Label><Input inputMode="tel" placeholder="20 123 456" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>{t("Disponibilités (facultatif)")}</Label><Input placeholder="Ex. mardi après-midi" value={form.preferred} onChange={(e) => setForm({ ...form, preferred: e.target.value })} /></div>
              <Button className="h-11 w-full rounded-xl" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Envoyer la demande</Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
