import { describe, expect, it } from "vitest";
import { createQuizSchema, submitQuizSchema } from "@/features/quizzes/schema";

describe("createQuizSchema", () => {
  it("accepte 'tous les chapitres' + un nombre en chaîne", () => {
    const result = createQuizSchema.safeParse({ chapterId: "", count: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chapterId).toBeNull();
      expect(result.data.count).toBe(10);
    }
  });

  it("refuse 0 question", () => {
    expect(createQuizSchema.safeParse({ chapterId: "", count: "0" }).success).toBe(false);
  });

  it("refuse plus de 50 questions", () => {
    expect(createQuizSchema.safeParse({ chapterId: "", count: "51" }).success).toBe(false);
  });
});

describe("submitQuizSchema", () => {
  it("accepte une liste de résultats", () => {
    const result = submitQuizSchema.safeParse({
      results: [
        { quizQuestionId: "11111111-1111-4111-8111-111111111111", knewIt: true },
        { quizQuestionId: "22222222-2222-4222-8222-222222222222", knewIt: false },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("refuse une liste vide", () => {
    expect(submitQuizSchema.safeParse({ results: [] }).success).toBe(false);
  });
});
