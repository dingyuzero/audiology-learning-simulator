import { BONE_FREQUENCIES, type AudiologyCase, type Ear, type Route, type StudentThreshold } from "../domain/types";

export function oppositeEar(ear: Ear): Ear {
  return ear === "right" ? "left" : "right";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function nearestFrequencyValue(values: Partial<Record<number, number>>, frequencyHz: number): number {
  const direct = values[frequencyHz];
  if (typeof direct === "number") {
    return direct;
  }

  const frequencies = Object.keys(values).map(Number);
  if (frequencies.length === 0) {
    return 120;
  }

  const nearest = frequencies.reduce((best, candidate) => {
    const bestDistance = Math.abs(best - frequencyHz);
    const candidateDistance = Math.abs(candidate - frequencyHz);
    return candidateDistance < bestDistance ? candidate : best;
  }, frequencies[0]);

  return values[nearest] ?? 120;
}

export function hiddenThreshold(
  caseData: AudiologyCase,
  ear: Ear,
  route: Route,
  frequencyHz: number,
  transducer?: string
): number {
  const thresholds = route === "air" ? caseData.hiddenAudiology.air[ear] : caseData.hiddenAudiology.bone[ear];
  let value = nearestFrequencyValue(thresholds, frequencyHz);

  if (
    caseData.teachingTags.includes("earCanalCollapse") &&
    transducer === "supra" &&
    route === "air" &&
    ear === "left" &&
    frequencyHz <= 1000
  ) {
    value += 15;
  }

  return value;
}

export function cochlearThreshold(caseData: AudiologyCase, ear: Ear, frequencyHz: number): number {
  const boneThreshold = nearestFrequencyValue(caseData.hiddenAudiology.bone[ear], frequencyHz);
  const airThreshold = nearestFrequencyValue(caseData.hiddenAudiology.air[ear], frequencyHz);
  return Math.min(boneThreshold, airThreshold);
}

export function getInterauralAttenuation(route: Route, transducer: string): number {
  if (route === "bone") {
    return 0;
  }
  if (transducer === "insert") {
    return 60;
  }
  return 40;
}

export function maskingEffect(maskingLevelDb: number, nonTestAirThreshold: number): number {
  return clamp(maskingLevelDb - Math.max(0, nonTestAirThreshold - 10), 0, 75);
}

export function thresholdKey(ear: Ear, route: Route, frequencyHz: number): string {
  return `${ear}:${route}:${frequencyHz}`;
}

export function latestThresholds(thresholds: StudentThreshold[]): Map<string, StudentThreshold> {
  const map = new Map<string, StudentThreshold>();
  thresholds.forEach((threshold) => {
    map.set(thresholdKey(threshold.ear, threshold.route, threshold.frequencyHz), threshold);
  });
  return map;
}

export function getStudentThreshold(
  thresholds: StudentThreshold[],
  ear: Ear,
  route: Route,
  frequencyHz: number
): StudentThreshold | undefined {
  return latestThresholds(thresholds).get(thresholdKey(ear, route, frequencyHz));
}

export function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export function calculatePta(thresholds: StudentThreshold[], ear: Ear, route: Route = "air"): number | null {
  const usable = [500, 1000, 2000]
    .map((frequencyHz) => getStudentThreshold(thresholds, ear, route, frequencyHz))
    .filter((threshold): threshold is StudentThreshold => threshold !== undefined)
    .filter((threshold) => !threshold.noResponse)
    .map((threshold) => threshold.levelDbHl);

  return usable.length === 3 ? average(usable) : null;
}

export function classifyDegree(pta: number | null): string {
  if (pta === null) {
    return "资料不足";
  }
  if (pta <= 25) {
    return "正常或接近正常";
  }
  if (pta <= 40) {
    return "轻度";
  }
  if (pta <= 55) {
    return "中度";
  }
  if (pta <= 70) {
    return "中重度";
  }
  if (pta <= 90) {
    return "重度";
  }
  return "极重度";
}

export function classifyType(thresholds: StudentThreshold[], ear: Ear): string {
  const paired = BONE_FREQUENCIES.map((frequencyHz) => {
    const air = getStudentThreshold(thresholds, ear, "air", frequencyHz);
    const bone = getStudentThreshold(thresholds, ear, "bone", frequencyHz);
    if (!air || !bone || air.noResponse || bone.noResponse) {
      return null;
    }
    return { air: air.levelDbHl, bone: bone.levelDbHl };
  }).filter((item): item is { air: number; bone: number } => Boolean(item));

  if (paired.length < 2) {
    return "性质待补充";
  }

  const gaps = paired.map((item) => item.air - item.bone);
  const averageGap = average(gaps) ?? 0;
  const boneAverage = average(paired.map((item) => item.bone)) ?? 0;
  const airAverage = average(paired.map((item) => item.air)) ?? 0;

  if (airAverage <= 25 && boneAverage <= 25) {
    return "未见明显听力损失";
  }
  if (averageGap >= 15 && boneAverage <= 25) {
    return "传导性模式";
  }
  if (averageGap >= 15 && boneAverage > 25) {
    return "混合性模式";
  }
  if (airAverage > 25 && averageGap < 15) {
    return "感音神经性模式";
  }
  return "性质需结合更多资料";
}

export function classifyConfiguration(thresholds: StudentThreshold[], ear: Ear): string {
  const low = getStudentThreshold(thresholds, ear, "air", 500)?.levelDbHl;
  const mid = getStudentThreshold(thresholds, ear, "air", 1000)?.levelDbHl;
  const high = getStudentThreshold(thresholds, ear, "air", 4000)?.levelDbHl;
  const veryHigh = getStudentThreshold(thresholds, ear, "air", 8000)?.levelDbHl;

  if ([low, mid, high].some((value) => typeof value !== "number")) {
    return "构型待补充";
  }

  const lowValue = low as number;
  const midValue = mid as number;
  const highValue = high as number;

  if (highValue - lowValue >= 25) {
    return "高频下降";
  }
  if (lowValue - highValue >= 20) {
    return "低频较差";
  }
  if (typeof veryHigh === "number" && highValue - midValue >= 25 && highValue - veryHigh >= 15) {
    return "高频切迹";
  }
  if (Math.max(lowValue, midValue, highValue) - Math.min(lowValue, midValue, highValue) <= 15) {
    return "平坦型";
  }
  return "不规则构型";
}
