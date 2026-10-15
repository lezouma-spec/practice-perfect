import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Users, Wallet, FileText, Package, BarChart3, ArrowUpRight, Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LangToggle } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import workspaceImage from "@/assets/dental-workspace.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dentics Pro — Votre espace de gestion dentaire" },
    { name: "description", content: "Votre cabinet, vos patients, votre agenda. Un espace professionnel indépendant pour chaque dentiste." },
    { property: "og:title", content: "Dentics Pro — Votre cabinet, simplement" },
    { property: "og:description", content: "Accédez à votre espace professionnel de gestion dentaire." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Index,
});
const tools = [
  { to: "/calendar", icon: CalendarDays, title: "Agenda", label: "Rendez-vous & disponibilités", color: "bg-primary-soft text-primary" },
  { to: "/patients", icon: Users, title: "Patients", label: "Dossiers & historique de soins", color: "bg-success-soft text-success" },
  { to: "/revenue", icon: Wallet, title: "Finances", label: "Encaissements & dépenses", color: "bg-warning-soft text-warning" },
  { to: "/templates", icon: FileText, title: "Documents", label: "Ordonnances, reçus & devis", color: "bg-accent text-accent-foreground" },
  { to: "/inventory", icon: Package, title: "Stock", label: "Consommables & alertes", color: "bg-primary-soft text-primary" },
  { to: "/analytics", icon: BarChart3, title: "Statistiques", label: "Activité de votre cabinet", color: "bg-success-soft text-success" },
] as const;
function Index() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user)); }, []);
  return <div className="min-h-screen bg-background">
    <header className="border-b bg-card"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8"><Link to="/" className="flex items-center gap-2.5 font-display text-2xl font-semibold"><span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Stethoscope className="size-6" /></span>Dentics<span className="text-xs font-medium text-muted-foreground">PRO</span></Link><div className="flex items-center gap-3"><LangToggle /><Button asChild variant="outline"><Link to={signedIn ? "/dashboard" : "/auth"}>{signedIn ? "Mon cabinet" : "Connexion"}<ArrowRight className="size-4" /></Link></Button></div></div></header>
    <main className="mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-8 sm:pt-14">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-xs font-semibold uppercase text-primary">ESPACE PROFESSIONNEL DENTAIRE</p><h1 className="font-display text-4xl font-semibold sm:text-5xl">Dentics Pro</h1><p className="mt-3 text-lg text-muted-foreground">Votre cabinet. Votre équipe. Votre journée.</p></div><Button asChild size="lg"><Link to={signedIn ? "/dashboard" : "/auth"}>{signedIn ? "Ouvrir mon cabinet" : "Créer mon cabinet"}<ArrowRight /></Link></Button></div>
      <div className="overflow-hidden rounded-lg"><img src={workspaceImage} alt="Cabinet dentaire contemporain aux meubles turquoise" width={1600} height={512} className="h-44 w-full object-cover sm:h-56" /></div>
      <div className="mb-5 mt-9 flex items-center justify-between"><h2 className="text-xl font-semibold">Votre espace de travail</h2><span className="text-xs text-muted-foreground">Tout au même endroit</span></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map(tool => <Link key={tool.to} to={tool.to} className="group rounded-lg border bg-card p-5 transition-shadow hover:shadow-lift"><div className="flex items-center justify-between"><span className={`grid size-11 place-items-center rounded-lg ${tool.color}`}><tool.icon className="size-5" /></span><ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div><h3 className="mt-4 text-lg font-semibold">{tool.title}</h3><p className="mt-1 text-sm text-muted-foreground">{tool.label}</p></Link>)}</div>
      <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t pt-5 text-xs text-muted-foreground"><p>Un espace indépendant pour chaque cabinet.</p><Button asChild variant="ghost" size="sm"><Link to="/auth">Accès professionnel<ArrowRight className="size-3" /></Link></Button></div>
    </main>
  </div>;
}
