import { describe, expect, it } from "vitest";
import { appointmentRow, appointmentSchema } from "@/lib/appointment-rules";
describe("Calendar appointment creation", () => {
  const draft = { patient_id: "10000000-0000-4000-8000-000000000001", date: "2026-10-19", time: "09:30", duration: 30, reason: "Consultation" };
  it("keeps a newly created client's ID on the appointment", () => { expect(appointmentRow(draft).patient_id).toBe(draft.patient_id); });
  it("preserves the existing status during edits", () => { expect(appointmentRow(draft)).not.toHaveProperty("status"); });
  it("creates the correct appointment length", () => { const r = appointmentRow(draft); expect(Date.parse(r.ends_at) - Date.parse(r.starts_at)).toBe(1800000); });
  it("rejects missing clients", () => { expect(appointmentSchema.safeParse({ ...draft, patient_id: "" }).success).toBe(false); });
});