import { describe, expect, it } from "vitest";
import { createClassSchema, joinClassSchema } from "@/features/classes/schema";

describe("createClassSchema", () => {
  it("accepte un nom valide et le nettoie", () => {
    const result = createClassSchema.safeParse({ name: "  Promo Conduite 2026  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Promo Conduite 2026");
  });

  it("refuse un nom d'une seule lettre", () => {
    expect(createClassSchema.safeParse({ name: "A" }).success).toBe(false);
  });
});

describe("joinClassSchema", () => {
  it("met le code en majuscules et retire les espaces", () => {
    const result = joinClassSchema.safeParse({ code: "  ab12cd34 " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe("AB12CD34");
  });

  it("refuse un code trop court", () => {
    expect(joinClassSchema.safeParse({ code: "abc" }).success).toBe(false);
  });
});
