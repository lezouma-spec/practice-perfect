import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const extractPatientFromImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { image: string }) =>
    z.object({ image: z.string().startsWith("data:image/").max(8_000_000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Service de lecture indisponible");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Tu lis des fiches patients manuscrites d\'un cabinet dentaire tunisien (français/arabe). Réponds UNIQUEMENT en JSON: {"full_name":string|null,"phone":string|null,"birth_date":"YYYY-MM-DD"|null,"address":string|null,"allergies":string|null,"notes":string|null,"raw_text":string}. N\'invente rien; null si illisible.',
          },
          { role: "user", content: [{ type: "text", text: "Extrais les informations de cette fiche." }, { type: "image_url", image_url: { url: data.image } }] },
        ],
      }),
    });
    if (res.status === 429) throw new Error("Trop de demandes, réessayez dans un instant.");
    if (res.status === 402) throw new Error("Crédits IA épuisés.");
    if (!res.ok) throw new Error("Lecture impossible");
    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    try {
      return JSON.parse(content.replace(/^```json|```$/g, "").trim()) as Record<string, string | null>;
    } catch {
      return { raw_text: content } as Record<string, string | null>;
    }
  });
