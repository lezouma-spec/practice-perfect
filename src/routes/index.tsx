import { useT, LangToggle } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dentics — Cabinet dentaire" },
      { name: "description", content: "Prenez rendez-vous en ligne ou accédez à l'espace du cabinet." },
      { property: "og:title", content: "Dentics — Cabinet dentaire" },
      { property: "og:description", content: "Prenez rendez-vous en ligne ou accédez à l'espace du cabinet." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useT();
  return (
    <div className="bg-hero flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Stethoscope className="size-5" /></span>
          Dentics
        </div>
        <div className="flex items-center gap-2"><LangToggle /><Button asChild variant="ghost"><Link to="/auth">{t("Espace cabinet")}</Link></Button></div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-24 animate-fade-up">
        <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-sm text-primary">
          <ShieldCheck className="size-4" /> Cabinet dentaire · Tunisie
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">{t("Des soins sereins, un rendez-vous en quelques secondes.")}</h1>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground">{t("Laissez votre nom et votre numéro, le cabinet vous rappelle pour confirmer.")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12 rounded-xl px-6"><Link to="/book"><CalendarCheck className="size-5" /> {t("Demander un rendez-vous")}</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6"><Link to="/auth">{t("Connexion équipe")}</Link></Button>
        </div>
      </main>
    </div>
  );
}
