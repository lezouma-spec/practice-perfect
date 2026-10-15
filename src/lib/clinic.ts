import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const TREATMENT_TYPES = [
  "Consultation", "Détartrage / Nettoyage", "Obturation (plombage)", "Extraction",
  "Traitement de canal", "Couronne", "Bridge", "Prothèse", "Blanchiment", "Radiographie", "Autre",
];

export const PLAN_TYPES = ["Obturation", "Extraction", "Nettoyage", "Traitement de canal", "Couronne", "Implant", "Prothèse", "Autre"];

export const MEDICATIONS = [
  { name: "Amoxicilline 1g", posology: "1 cp matin et soir pendant 7 jours" },
  { name: "Augmentin 1g", posology: "1 sachet matin et soir pendant 7 jours" },
  { name: "Paracétamol 1g", posology: "1 cp toutes les 6h si douleur (max 4/j)" },
  { name: "Ibuprofène 400mg", posology: "1 cp 3 fois/j après repas pendant 3 jours" },
  { name: "Métronidazole 500mg", posology: "1 cp 3 fois/j pendant 7 jours" },
  { name: "Spiramycine-Métronidazole", posology: "2 cp 2 fois/j pendant 6 jours" },
  { name: "Bain de bouche Chlorhexidine 0,12%", posology: "3 bains de bouche/j pendant 7 jours" },
  { name: "Prednisolone 20mg", posology: "2 cp le matin pendant 3 jours" },
];

export const tnd = (n: number | string | null | undefined) =>
  `${Number(n ?? 0).toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT`;

export type PayStatus = "paid" | "partial" | "owing";
export function payStatus(cost: number, paid: number): PayStatus {
  if (paid >= cost) return "paid";
  if (paid > 0) return "partial";
  return "owing";
}
export const PAY_LABEL: Record<PayStatus, string> = { paid: "Payé", partial: "Partiel", owing: "Dû" };

export function waLink(phone: string | null | undefined, text: string) {
  let d = (phone ?? "").replace(/\D/g, "");
  if (d.length === 8) d = "216" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export function useRole() {
  return useQuery({
    queryKey: ["role"],
    staleTime: Infinity,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { role: null as null | "doctor" | "secretary", email: "" };
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const roles = (data ?? []).map((r) => r.role);
      return { role: roles.includes("doctor") ? ("doctor" as const) : roles.includes("secretary") ? ("secretary" as const) : null, email: u.user.email ?? "" };
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
