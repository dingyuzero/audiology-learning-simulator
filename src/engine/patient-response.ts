import type { AudiologyCase, AudiometerSettings, Ear, PatientResponse } from "../domain/types";
import { clamp, cochlearThreshold, getInterauralAttenuation, hiddenThreshold, maskingEffect, oppositeEar } from "./audiology";
import { rangeFromRandom, seededRandom } from "./random";

interface SimulateOptions {
  eventIndex: number;
  sessionSeed: string;
  instructionReady: boolean;
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

export function simulatePatientResponse(
  caseData: AudiologyCase,
  settings: AudiometerSettings,
  options: SimulateOptions
): PatientResponse {
  const nonTestEar = oppositeEar(settings.ear);
  const notes: string[] = [];
  const interauralAttenuation = getInterauralAttenuation(settings.route, settings.transducer);
  const randomBase = `${options.sessionSeed}:${options.eventIndex}:${settings.ear}:${settings.route}:${settings.frequencyHz}:${settings.levelDbHl}:${settings.maskingLevelDb}`;

  const testThreshold = hiddenThreshold(
    caseData,
    settings.ear,
    settings.route,
    settings.frequencyHz,
    settings.transducer
  );
  const nonTestCochlearThreshold = cochlearThreshold(caseData, nonTestEar, settings.frequencyHz);
  const nonTestAirThreshold = hiddenThreshold(caseData, nonTestEar, "air", settings.frequencyHz, settings.transducer);
  const nonTestMaskingEffect = settings.maskingEnabled
    ? maskingEffect(settings.maskingLevelDb, nonTestAirThreshold)
    : 0;

  let crossThreshold = nonTestCochlearThreshold + interauralAttenuation + nonTestMaskingEffect;
  if (settings.route === "bone") {
    crossThreshold = nonTestCochlearThreshold + nonTestMaskingEffect;
  }

  const heardBy: Ear | "none" =
    settings.levelDbHl >= Math.min(testThreshold, crossThreshold)
      ? testThreshold <= crossThreshold
        ? settings.ear
        : nonTestEar
      : "none";

  const effectiveThreshold = Math.min(testThreshold, crossThreshold);
  const sensationLevel = settings.levelDbHl - effectiveThreshold;
  const isNearThreshold = sensationLevel >= -5 && sensationLevel <= 10;
  const tinnitusInterference = caseData.behavior.tinnitusFrequencies.includes(settings.frequencyHz);
  const eventFatigue = Math.max(0, options.eventIndex - caseData.behavior.fatigueAfterEvents);
  const fatigueFactor = clamp(1 - eventFatigue / 90, 0.62, 1);
  const instructionFactor = options.instructionReady ? 1 : caseData.behavior.instructionSensitivity;
  const slope = tinnitusInterference ? 6.5 : 4.5;

  let probability = sigmoid((sensationLevel - 1) / slope);
  probability *= caseData.behavior.cooperation * fatigueFactor * instructionFactor;
  probability -= caseData.behavior.falseNegativeRate;

  if (heardBy === "none") {
    probability = caseData.behavior.falsePositiveRate * (tinnitusInterference ? 1.8 : 1);
  }

  if (settings.stimulus === "pulsed") {
    probability += 0.04;
  }

  probability = clamp(probability, 0.01, 0.99);

  const responseRandom = seededRandom(`${randomBase}:response`);
  const responded = responseRandom < probability;
  const delayRandom = seededRandom(`${randomBase}:delay`);
  const latencyMs = responded
    ? rangeFromRandom(delayRandom, caseData.behavior.responseDelayMs[0], caseData.behavior.responseDelayMs[1])
    : null;

  if (heardBy === nonTestEar) {
    notes.push("cross-hearing-risk");
  }
  if (settings.maskingEnabled) {
    notes.push("masking-active");
  }
  if (settings.route === "bone" && !settings.maskingEnabled) {
    notes.push("bone-unmasked-non-specific");
  }
  if (settings.maskingEnabled && settings.maskingLevelDb - interauralAttenuation >= testThreshold + 5) {
    notes.push("overmasking-risk");
  }
  if (isNearThreshold) {
    notes.push("near-threshold");
  }
  if (tinnitusInterference) {
    notes.push("tinnitus-interference");
  }
  if (eventFatigue > 0) {
    notes.push("fatigue");
  }

  const uncomfortable = caseData.hiddenAudiology.uncomfortableLevel?.[settings.ear]?.[settings.frequencyHz];
  if (typeof uncomfortable === "number" && settings.levelDbHl >= uncomfortable) {
    notes.push("loudness-discomfort");
  }

  return {
    responded,
    latencyMs,
    probability: Math.round(probability * 100) / 100,
    effectiveThreshold,
    heardBy: responded ? heardBy : "none",
    notes
  };
}

