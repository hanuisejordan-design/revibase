import { describe, expect, it } from "vitest";
import { createAnswerSchema } from "@/features/answers/schema";

describe("createAnswerSchema", () => {
  it("accepte une réponse et retire les espaces", () => {
    const result = createAnswerSchema.safeParse({ body: "  Parce que le carré violet…  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.body).toBe("Parce que le carré violet…");
  });

  it("refuse une réponse vide", () => {
    expect(createAnswerSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("refuse une réponse trop longue", () => {
    expect(createAnswerSchema.safeParse({ body: "x".repeat(5001) }).success).toBe(false);
  });
});
