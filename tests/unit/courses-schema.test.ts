import { describe, expect, it } from "vitest";
import { createCourseSchema, joinCourseSchema } from "@/features/courses/schema";

describe("createCourseSchema", () => {
  it("accepte un nom valide et le nettoie", () => {
    const result = createCourseSchema.safeParse({ name: "  Promo Conduite 2026  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Promo Conduite 2026");
  });

  it("refuse un nom d'une seule lettre", () => {
    expect(createCourseSchema.safeParse({ name: "A" }).success).toBe(false);
  });
});

describe("joinCourseSchema", () => {
  it("met le code en majuscules et retire les espaces", () => {
    const result = joinCourseSchema.safeParse({ code: "  ab12cd34 " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe("AB12CD34");
  });

  it("refuse un code trop court", () => {
    expect(joinCourseSchema.safeParse({ code: "abc" }).success).toBe(false);
  });
});
