import { describe, expect, it } from "vitest";
import { createQuestionSchema, parseSort } from "@/features/questions/schema";

const CHAPTER = "11111111-1111-4111-8111-111111111111";
const base = { title: "Une vraie question ?", body: "", chapterId: CHAPTER };

describe("createQuestionSchema — question ouverte", () => {
  it("accepte une question valide et normalise le corps vide", () => {
    const result = createQuestionSchema.safeParse({
      title: "  Que signifie un carré violet ?  ",
      body: "   ",
      chapterId: CHAPTER,
      kind: "open",
      options: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Que signifie un carré violet ?");
      expect(result.data.body).toBeNull();
      expect(result.data.chapterId).toBe(CHAPTER);
      expect(result.data.kind).toBe("open");
    }
  });

  it("refuse un titre trop court", () => {
    expect(createQuestionSchema.safeParse({ ...base, title: "Quoi", kind: "open" }).success).toBe(
      false,
    );
  });

  it("refuse une question sans chapitre", () => {
    expect(createQuestionSchema.safeParse({ ...base, chapterId: "", kind: "open" }).success).toBe(
      false,
    );
  });
});

describe("createQuestionSchema — QCM / vrai-faux", () => {
  it("accepte un QCM avec 2 options dont une correcte", () => {
    const result = createQuestionSchema.safeParse({
      ...base,
      kind: "mcq",
      options: [
        { body: "Bonne", isCorrect: true },
        { body: "Mauvaise", isCorrect: false },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("refuse un QCM sans bonne réponse", () => {
    expect(
      createQuestionSchema.safeParse({
        ...base,
        kind: "mcq",
        options: [
          { body: "A", isCorrect: false },
          { body: "B", isCorrect: false },
        ],
      }).success,
    ).toBe(false);
  });

  it("refuse un QCM avec plusieurs bonnes réponses", () => {
    expect(
      createQuestionSchema.safeParse({
        ...base,
        kind: "mcq",
        options: [
          { body: "A", isCorrect: true },
          { body: "B", isCorrect: true },
        ],
      }).success,
    ).toBe(false);
  });

  it("refuse un QCM avec une seule option", () => {
    expect(
      createQuestionSchema.safeParse({
        ...base,
        kind: "mcq",
        options: [{ body: "A", isCorrect: true }],
      }).success,
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
