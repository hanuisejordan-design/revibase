import { describe, expect, it } from "vitest";
import { createSummarySchema } from "@/features/summaries/schema";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("createSummarySchema", () => {
  it("accepte un titre et un chapitre", () => {
    const r = createSummarySchema.safeParse({ title: "  Fiche signalisation  ", chapterId: UUID });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.title).toBe("Fiche signalisation");
      expect(r.data.chapterId).toBe(UUID);
    }
  });

  it("accepte un chapitre vide (null)", () => {
    const r = createSummarySchema.safeParse({ title: "Fiche", chapterId: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.chapterId).toBeNull();
  });

  it("refuse un titre vide", () => {
    expect(createSummarySchema.safeParse({ title: "  ", chapterId: "" }).success).toBe(false);
  });

  it("refuse un chapitre non-UUID", () => {
    expect(createSummarySchema.safeParse({ title: "Fiche", chapterId: "abc" }).success).toBe(false);
  });
});
