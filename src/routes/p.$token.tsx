import { useT, LangToggle } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Wallet, Stethoscope, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";
import { fr, arTN } from "date-fns/locale";
import { getPatientShare } from "@/lib/public.functions";
import { tnd } from "@/lib/clinic";

export const Route = createFileRoute("/p/$token")({
  loader: ({ params }) => getPatientShare({ data: { token: params.token } }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Votre suivi — Cabinet dentaire" },
      { name: "description", content: "Votre prochain rendez-vous et votre solde." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Votre suivi dentaire" },
      { property: "og:description", content: "Prochain rendez-vous et solde." },
    ],
  }),
  component: Share,
  errorComponent: () => <div className="grid min-h-screen place-items-center text-muted-foreground">Lien invalide.</div>,
});

function Share() {
  const { t, lang } = useT();
  const d = Route.useLoaderData();
  if (!d) return <div className="grid min-h-screen place-items-center text-muted-foreground">Lien invalide ou expiré.</div>;
  return (
    <div className="bg-hero min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md space-y-4 animate-fade-up">
        <div className="flex items-center gap-2 font-display font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Stethoscope className="size-4" /></span>
          {d.clinic?.clinic_name}
        </div>
        <div className="flex justify-end"><LangToggle /></div>
        <h1 className="text-3xl font-semibold">{t("Bonjour")} {d.firstName}</h1>
        <div className="surface p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" /> {t("Prochain rendez-vous")}</div>
          <p className="mt-2 text-xl font-semibold">
            {d.next ? format(new Date(d.next.starts_at), "EEEE d MMMM 'à' HH:mm", { locale: lang === "ar" ? arTN : fr }) : "Aucun rendez-vous prévu"}
          </p>
          {d.next?.reason && <p className="text-muted-foreground">{d.next.reason}</p>}
        </div>
        <div className="surface p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="size-4" /> {t("Solde")}</div>
          <p className={`mt-2 text-xl font-semibold ${d.balance > 0 ? "text-warning" : "text-success"}`}>
            {d.balance > 0 ? `${tnd(d.balance)} ${t("restant")}` : "Tout est réglé ✓"}
          </p>
        </div>
        <div className="space-y-1 px-1 text-sm text-muted-foreground">
          <p>{d.clinic?.doctor_name}</p>
          {d.clinic?.address && <p className="flex items-center gap-2"><MapPin className="size-4" />{d.clinic.address}</p>}
          {d.clinic?.phone && <a href={`tel:${d.clinic.phone}`} className="flex items-center gap-2 text-primary"><Phone className="size-4" />{d.clinic.phone}</a>}
        </div>
      </div>
    </div>
  );
}
