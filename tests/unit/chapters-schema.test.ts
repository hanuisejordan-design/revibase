import { describe, expect, it } from "vitest";
import { chapterNameSchema } from "@/features/chapters/schema";

describe("chapterNameSchema", () => {
  it("accepte un nom valide et retire les espaces", () => {
    const result = chapterNameSchema.safeParse({ name: "  Signalisation  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Signalisation");
  });

  it("refuse un nom vide", () => {
    expect(chapterNameSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("refuse un nom trop long", () => {
    expect(chapterNameSchema.safeParse({ name: "x".repeat(121) }).success).toBe(false);
  });
});
