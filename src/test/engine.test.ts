import { describe, expect, it } from "vitest";
import { getCaseById } from "../data/cases";
import type { AudiometerSettings, PrepState, ReportInterpretation, StudentThreshold, TestEvent } from "../domain/types";
import { calculatePta, classifyType } from "../engine/audiology";
import { simulatePatientResponse } from "../engine/patient-response";
import { scoreSession } from "../engine/scoring";

const prepComplete: PrepState = {
  caseReview: true,
  otoscopy: true,
  instructions: true,
  betterEar: true,
  transducerCheck: true
};

const interpretation: ReportInterpretation = {
  right: "右耳听阈基本正常",
  left: "左耳传导性模式",
  reliability: "good",
  comments: "可靠性良好，左耳气骨导差明显，已结合掩蔽记录复核。"
};

function settings(patch: Partial<AudiometerSettings>): AudiometerSettings {
  return {
    ear: "left",
    route: "air",
    frequencyHz: 1000,
    levelDbHl: 70,
    transducer: "supra",
    stimulus: "pulsed",
    maskingEnabled: false,
    maskingLevelDb: 40,
    ...patch
  };
}

function threshold(
  ear: StudentThreshold["ear"],
  route: StudentThreshold["route"],
  frequencyHz: number,
  levelDbHl: number,
  masked = false
): StudentThreshold {
  return {
    id: `${ear}-${route}-${frequencyHz}`,
    ear,
    route,
    frequencyHz,
    levelDbHl,
    masked,
    noResponse: false,
    timestamp: "2026-06-10T10:00:00+08:00"
  };
}

describe("patient response engine", () => {
  it("flags cross-hearing risk for an unmasked asymmetric air-conduction tone", () => {
    const caseData = getCaseById("C07");
    const response = simulatePatientResponse(caseData, settings({ levelDbHl: 70 }), {
      eventIndex: 1,
      sessionSeed: "test-seed",
      instructionReady: true
    });

    expect(response.effectiveThreshold).toBeLessThan(90);
    expect(response.notes).toContain("cross-hearing-risk");
  });

  it("raises the effective threshold when masking controls the non-test ear", () => {
    const caseData = getCaseById("C07");
    const response = simulatePatientResponse(
      caseData,
      settings({ levelDbHl: 90, maskingEnabled: true, maskingLevelDb: 90 }),
      {
        eventIndex: 2,
        sessionSeed: "test-seed",
        instructionReady: true
      }
    );

    expect(response.effectiveThreshold).toBe(90);
    expect(response.notes).not.toContain("cross-hearing-risk");
    expect(response.notes).toContain("masking-active");
  });
});

describe("audiology calculations", () => {
  it("calculates PTA and conductive pattern from student thresholds", () => {
    const thresholds = [
      threshold("left", "air", 500, 35),
      threshold("left", "air", 1000, 35),
      threshold("left", "air", 2000, 30),
      threshold("left", "air", 4000, 30),
      threshold("left", "bone", 500, 10, true),
      threshold("left", "bone", 1000, 10, true),
      threshold("left", "bone", 2000, 10, true),
      threshold("left", "bone", 4000, 15, true)
    ];

    expect(calculatePta(thresholds, "left")).toBe(33);
    expect(classifyType(thresholds, "left")).toBe("传导性模式");
  });
});

describe("scoring engine", () => {
  it("rewards required masking records", () => {
    const caseData = getCaseById("C05");
    const baseThresholds = [
      threshold("left", "air", 250, 40),
      threshold("left", "air", 500, 35),
      threshold("left", "air", 1000, 35),
      threshold("left", "air", 2000, 30),
      threshold("left", "air", 4000, 30),
      threshold("left", "air", 8000, 35),
      threshold("right", "air", 250, 10),
      threshold("right", "air", 500, 10),
      threshold("right", "air", 1000, 10),
      threshold("right", "air", 2000, 10),
      threshold("right", "air", 4000, 15),
      threshold("right", "air", 8000, 15),
      threshold("left", "bone", 500, 10),
      threshold("left", "bone", 1000, 10),
      threshold("left", "bone", 2000, 10)
    ];
    const maskedThresholds = baseThresholds.map((item) =>
      item.ear === "left" && item.route === "bone" && [500, 1000].includes(item.frequencyHz)
        ? { ...item, masked: true }
        : item
    );

    const withoutMasking = scoreSession(caseData, prepComplete, [] as TestEvent[], baseThresholds, interpretation);
    const withMasking = scoreSession(caseData, prepComplete, [] as TestEvent[], maskedThresholds, interpretation);

    expect(withMasking.total).toBeGreaterThan(withoutMasking.total);
  });
});

