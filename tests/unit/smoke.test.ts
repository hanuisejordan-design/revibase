import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils/cn";
import { ANSWER_STATUSES, COURSE_ROLES } from "@/constants/app";

describe("smoke", () => {
  it("cn fusionne les classes et résout les conflits Tailwind", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-medium")).toBe("text-sm font-medium");
  });

  it("les constantes de domaine sont bien définies", () => {
    expect(COURSE_ROLES).toEqual(["student", "trainer"]);
    expect(ANSWER_STATUSES[0]).toBe("validated");
  });
});
