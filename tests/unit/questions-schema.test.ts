import { describe, expect, it } from "vitest";
import { createQuestionSchema, parseSort } from "@/features/questions/schema";

const CHAPTER = "11111111-1111-4111-8111-111111111111";

describe("createQuestionSchema", () => {
  it("accepte une question valide et normalise le corps vide", () => {
    const result = createQuestionSchema.safeParse({
      title: "  Que signifie un carré violet ?  ",
      body: "   ",
      chapterId: CHAPTER,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Que signifie un carré violet ?");
      expect(result.data.body).toBeNull();
      expect(result.data.chapterId).toBe(CHAPTER);
    }
  });

  it("refuse un titre trop court", () => {
    expect(
      createQuestionSchema.safeParse({ title: "Quoi", body: "", chapterId: CHAPTER }).success,
    ).toBe(false);
  });

  it("refuse une question sans chapitre", () => {
    expect(
      createQuestionSchema.safeParse({ title: "Une vraie question ?", body: "", chapterId: "" })
        .success,
    ).toBe(false);
  });

  it("refuse un chapterId qui n'est pas un UUID", () => {
    expect(
      createQuestionSchema.safeParse({ title: "Une vraie question ?", body: "", chapterId: "abc" })
        .success,
    ).toBe(false);
  });
});

describe("parseSort", () => {
  it("renvoie la valeur si connue, sinon 'recent'", () => {
    expect(parseSort("popular")).toBe("popular");
    expect(parseSort("unanswered")).toBe("unanswered");
    expect(parseSort(undefined)).toBe("recent");
    expect(parseSort("n'importe quoi")).toBe("recent");
  });
});
