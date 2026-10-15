import { z } from "zod";

export const appointmentSchema = z.object({
  patient_id: z.string().uuid("Choisissez un patient"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide"),
  duration: z.number().int().min(15).max(120),
  reason: z.string().trim().min(1).max(200),
});
export function appointmentRow(draft: z.infer<typeof appointmentSchema>, status?: string) {
  const starts = new Date(`${draft.date}T${draft.time}`);
  if (!Number.isFinite(starts.getTime())) throw new Error("Date invalide");
  return { patient_id: draft.patient_id, starts_at: starts.toISOString(), ends_at: new Date(starts.getTime() + draft.duration * 60000).toISOString(), reason: draft.reason, ...(status ? { status } : {}) };
}