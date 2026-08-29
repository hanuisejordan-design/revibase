import { describe, expect, it } from "vitest";
import { createGroupSchema, joinGroupSchema } from "@/features/groups/schema";

describe("createGroupSchema", () => {
  it("accepte un nom valide et le nettoie", () => {
    const result = createGroupSchema.safeParse({ name: "  Centre de formation Nord  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Centre de formation Nord");
  });

  it("refuse un nom d'une seule lettre", () => {
    expect(createGroupSchema.safeParse({ name: "A" }).success).toBe(false);
  });
});

describe("joinGroupSchema", () => {
  it("met le code en majuscules et retire les espaces", () => {
    const result = joinGroupSchema.safeParse({ code: "  ab12cd34 " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe("AB12CD34");
  });

  it("refuse un code trop court", () => {
    expect(joinGroupSchema.safeParse({ code: "abc" }).success).toBe(false);
  });
});
