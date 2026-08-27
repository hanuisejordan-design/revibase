import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "@/features/auth/schema";

describe("signUpSchema", () => {
  it("accepte des données valides et normalise l'e-mail", () => {
    const result = signUpSchema.safeParse({
      displayName: "  Thomas  ",
      email: "  Thomas@Example.COM ",
      password: "motdepasse1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Thomas");
      expect(result.data.email).toBe("thomas@example.com");
    }
  });

  it("refuse un mot de passe trop court", () => {
    const result = signUpSchema.safeParse({
      displayName: "Thomas",
      email: "thomas@example.com",
      password: "court",
    });
    expect(result.success).toBe(false);
  });

  it("refuse un nom d'une seule lettre", () => {
    const result = signUpSchema.safeParse({
      displayName: "T",
      email: "thomas@example.com",
      password: "motdepasse1",
    });
    expect(result.success).toBe(false);
  });

  it("refuse un e-mail invalide", () => {
    const result = signUpSchema.safeParse({
      displayName: "Thomas",
      email: "pas-un-email",
      password: "motdepasse1",
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepte e-mail + mot de passe non vides", () => {
    const result = signInSchema.safeParse({
      email: "thomas@example.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("refuse un mot de passe vide", () => {
    const result = signInSchema.safeParse({ email: "thomas@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});
