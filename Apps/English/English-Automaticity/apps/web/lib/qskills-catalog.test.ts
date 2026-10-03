import { describe, expect, test } from "bun:test";

import { formatQSkillsAssetLabel } from "./qskills-catalog";

describe("QSkills catalog labels", () => {
  test("turns publisher filenames into readable activity labels", () => {
    expect(
      formatQSkillsAssetLabel(
        "Level-1/QSkills-for-Success-3rd-LS-Level-1-Audio/Q3e_LS1_U01_02_NotetakingSkill_ActivityA.mp3",
      ),
    ).toBe("Activity 02 · Notetaking Skill Activity A");
  });
});
