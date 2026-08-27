import { describe, expect, it } from "vitest";
import { createCommentSchema } from "@/features/discussions/schema";

describe("createCommentSchema", () => {
  it("accepte un message et retire les espaces", () => {
    const result = createCommentSchema.safeParse({ body: "  Merci, c'est plus clair.  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.body).toBe("Merci, c'est plus clair.");
  });

  it("refuse un message vide", () => {
    expect(createCommentSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("refuse un message trop long", () => {
    expect(createCommentSchema.safeParse({ body: "x".repeat(5001) }).success).toBe(false);
  });
});
