import { createFileRoute, Link, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { CalendarDays, Users, Bell, Package, Wallet, BarChart3, FileUp, Settings, LogOut, Stethoscope, LayoutDashboard, FileStack, Menu, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole, useSettings } from "@/lib/clinic";
import { useT, LangToggle } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

const NAV = [
  { to: "/dashboard", label: "Aujourd'hui", icon: LayoutDashboard, group: "CABINET" },
  { to: "/calendar", label: "Agenda", icon: CalendarDays, group: "CABINET" },
  { to: "/patients", label: "Patients", icon: Users, group: "CABINET" },
  { to: "/requests", label: "Demandes", icon: Bell, group: "CABINET" },
  { to: "/revenue", label: "Revenus", icon: Wallet, group: "GESTION" },
  { to: "/analytics", label: "Statistiques", icon: BarChart3, group: "GESTION" },
  { to: "/inventory", label: "Stock", icon: Package, group: "GESTION" },
  { to: "/templates", label: "Modèles", icon: FileStack, group: "OUTILS" },
  { to: "/import", label: "Import", icon: FileUp, group: "OUTILS" },
  { to: "/settings", label: "Réglages", icon: Settings, group: "OUTILS" },
] as const;

function Layout() {
  const { data: me } = useRole();
  const { data: clinic } = useSettings();
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = NAV.filter(n => n.to !== "/revenue" || me?.role === "doctor");
  const navigation = <nav className="space-y-1">{items.map((n, i) => <div key={n.to}>
    {(i === 0 || items[i - 1]?.group !== n.group) && <p className="px-3 pb-2 pt-5 text-[10px] font-semibold text-muted-foreground">{n.group}</p>}
    <Link to={n.to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-muted" activeProps={{ className: "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" }}><n.icon className="size-[18px]" />{t(n.label)}</Link>
  </div>)}</nav>;
  async function logout() { await supabase.auth.signOut(); router.invalidate(); }
  const brand = <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-semibold"><span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Stethoscope className="size-5" /></span>Dentics<span className="text-xs font-normal text-muted-foreground">PRO</span></Link>;
  return <div className="min-h-screen bg-background">
    <aside className="no-print fixed inset-y-0 start-0 hidden w-60 flex-col border-e bg-sidebar px-4 py-6 lg:flex">
      <div className="px-2">{brand}<p className="mt-5 truncate border-y py-3 text-xs font-medium text-muted-foreground">{clinic?.clinic_name ?? "Mon cabinet"}</p></div>
      <div className="flex-1">{navigation}</div>
      <div className="border-t pt-4"><p className="truncate px-2 text-xs text-muted-foreground">{me?.email}</p><div className="mt-3 flex items-center justify-between"><LangToggle /><Button variant="ghost" size="icon" aria-label="Déconnexion" title="Déconnexion" onClick={logout}><LogOut /></Button></div></div>
    </aside>
    <header className="no-print flex h-16 items-center justify-between border-b bg-card px-5 lg:ms-60 sm:px-8">
      <div className="lg:hidden">{brand}</div><div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex"><span>{clinic?.clinic_name ?? "Mon cabinet"}</span><ChevronRight className="size-3" /><span className="text-foreground">Espace professionnel</span></div>
      <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex"><span className="size-2 rounded-full bg-success" />Cabinet connecté</div>
      <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Ouvrir le menu" className="lg:hidden"><Menu /></Button></SheetTrigger><SheetContent side="left" className="overflow-y-auto"><SheetTitle>Dentics · {clinic?.clinic_name}</SheetTitle>{navigation}<Button variant="ghost" onClick={logout}><LogOut />Déconnexion</Button></SheetContent></Sheet>
    </header>
    <main className="pb-24 lg:ps-60 lg:pb-10 print:p-0"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8"><Outlet /></div></main>
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-card py-2 lg:hidden">{items.slice(0, 4).map(n => <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary" }}><n.icon className="size-5" />{t(n.label)}</Link>)}<Button variant="ghost" size="icon" aria-label="Tous les outils" onClick={() => setOpen(true)}><Menu /></Button></nav>
  </div>;
}

export function PageHeader({ title, subtitle, actions, className }: { title: string; subtitle?: string | undefined; actions?: ReactNode; className?: string | undefined }) {
  const { t } = useT();
  return <div className={cn("no-print mb-7 flex flex-wrap items-end justify-between gap-4 animate-fade-up", className)}><div><h1 className="text-2xl font-semibold sm:text-3xl">{t(title)}</h1>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{t(subtitle)}</p>}</div>{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}</div>;
}