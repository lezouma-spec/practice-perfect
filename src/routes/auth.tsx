import { useT, LangToggle } from "@/lib/i18n";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Stethoscope, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Dentics" },
      { name: "description", content: "Connexion de l'équipe du cabinet." },
      { property: "og:title", content: "Connexion — Dentics" },
      { property: "og:description", content: "Connexion de l'équipe du cabinet." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useT();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error("Email ou mot de passe incorrect");
      navigate({ to: "/dashboard" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
      setLoading(false);
      if (error) return toast.error(error.message);
      if (data.session) navigate({ to: "/dashboard" });
      else toast.success("Vérifiez votre email pour confirmer le compte.");
    }
  }

  return (
    <div className="bg-hero grid min-h-screen place-items-center px-4">
      <div className="surface w-full max-w-sm p-8 animate-fade-up">
        <Link to="/" className="mb-6 flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Stethoscope className="size-5" /></span>
          Dentics
        </Link>
        <div className="mb-2 flex justify-end"><LangToggle /></div>
        <h1 className="text-2xl font-semibold">{mode === "in" ? t("Bon retour") : t("Créer un compte")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "in" ? t("Accédez à l'espace du cabinet.") : "Le premier compte créé devient le compte Médecin ; les suivants sont Secrétaire."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5"><Label>{t("Email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>{t("Mot de passe")}</Label><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button className="h-11 w-full rounded-xl" disabled={loading}>{loading && <Loader2 className="animate-spin" />}{mode === "in" ? t("Se connecter") : t("Créer le compte")}</Button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? t("Nouveau membre ? Créer un compte") : t("Déjà un compte ? Se connecter")}
        </button>
      </div>
    </div>
  );
}
