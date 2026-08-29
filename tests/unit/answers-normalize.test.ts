import { describe, expect, it } from "vitest";
import { isSameAnswer, normalizeAnswerBody } from "@/features/answers/normalize";

describe("normalizeAnswerBody", () => {
  it("neutralise casse, espaces multiples et ponctuation de fin", () => {
    expect(normalizeAnswerBody("  Le  carré   violet.  ")).toBe("le carré violet");
    expect(normalizeAnswerBody("Le carré violet !!!")).toBe("le carré violet");
    expect(normalizeAnswerBody("Le carré violet…")).toBe("le carré violet");
  });

  it("garde les accents et la ponctuation interne", () => {
    expect(normalizeAnswerBody("Arrêt, puis marche à vue")).toBe("arrêt, puis marche à vue");
  });

  it("renvoie une chaîne vide pour une entrée sans contenu", () => {
    expect(normalizeAnswerBody("   ...  ")).toBe("");
  });
});

describe("isSameAnswer", () => {
  it("rapproche deux formulations identiques au formatage près", () => {
    expect(isSameAnswer("Le carré violet.", "  le  CARRÉ violet  ")).toBe(true);
  });

  it("ne rapproche pas deux réponses avec une faute d'orthographe", () => {
    expect(isSameAnswer("le carré violet", "le carre violet")).toBe(false);
  });

  it("ne rapproche pas des réponses réellement différentes", () => {
    expect(isSameAnswer("marche à vue", "marche prudente")).toBe(false);
  });

  it("ne considère pas deux réponses vides comme identiques", () => {
    expect(isSameAnswer("...", "   ")).toBe(false);
  });
});
