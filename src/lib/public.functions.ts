import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPatientShare = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => z.object({ token: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("patients").select("id, full_name, clinic_id").eq("share_token", data.token).maybeSingle();
    if (!p) return null;
    const [{ data: appts }, { data: visits }, { data: clinic }] = await Promise.all([
      supabaseAdmin.from("appointments").select("starts_at, reason").eq("patient_id", p.id).eq("status", "scheduled").gte("starts_at", new Date().toISOString()).order("starts_at").limit(1),
      supabaseAdmin.from("visits").select("cost, amount_paid").eq("patient_id", p.id),
      supabaseAdmin.from("clinic_settings").select("doctor_name, clinic_name, address, phone").eq("id", p.clinic_id).maybeSingle(),
    ]);
    const balance = (visits ?? []).reduce((s, v) => s + Number(v.cost) - Number(v.amount_paid), 0);
    return {
      firstName: p.full_name.split(" ")[0],
      next: appts?.[0] ?? null,
      balance,
      clinic,
    };
  });
