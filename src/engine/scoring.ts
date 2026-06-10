import {
  AIR_FREQUENCIES,
  BONE_FREQUENCIES,
  EARS,
  STANDARD_FREQUENCIES,
  type AudiologyCase,
  type PrepState,
  type ReportInterpretation,
  type ScoreResult,
  type ScoreSection,
  type StudentThreshold,
  type TestEvent
} from "../domain/types";
import { getStudentThreshold, hiddenThreshold, latestThresholds } from "./audiology";

function round(value: number): number {
  return Math.round(value);
}

function section(label: string, score: number, max: number, findings: string[]): ScoreSection {
  return {
    label,
    score: Math.max(0, Math.min(max, round(score))),
    max,
    findings
  };
}

export function scoreSession(
  caseData: AudiologyCase,
  prep: PrepState,
  events: TestEvent[],
  thresholds: StudentThreshold[],
  interpretation: ReportInterpretation
): ScoreResult {
  const sections: ScoreSection[] = [];
  const thresholdMap = latestThresholds(thresholds);

  const prepItems = Object.values(prep).filter(Boolean).length;
  sections.push(
    section("测前准备", (prepItems / Object.keys(prep).length) * 15, 15, [
      prepItems === Object.keys(prep).length ? "测前核对完整。" : `已完成 ${prepItems}/${Object.keys(prep).length} 项测前准备。`
    ])
  );

  const requiredAir = EARS.flatMap((ear) => STANDARD_FREQUENCIES.map((frequencyHz) => `${ear}:air:${frequencyHz}`));
  const completedAir = requiredAir.filter((key) => thresholdMap.has(key)).length;
  const oneKRepeat = events.filter((event) => event.settings.route === "air" && event.settings.frequencyHz === 1000).length >= 4;
  const airFindings = [`气导关键频率完成 ${completedAir}/${requiredAir.length}。`];
  if (!oneKRepeat) {
    airFindings.push("1000 Hz 复测或确认次数不足。");
  }
  sections.push(section("气导流程", (completedAir / requiredAir.length) * 16 + (oneKRepeat ? 4 : 0), 20, airFindings));

  const boneNeeded = EARS.flatMap((ear) => BONE_FREQUENCIES.map((frequencyHz) => `${ear}:bone:${frequencyHz}`));
  const completedBone = boneNeeded.filter((key) => thresholdMap.has(key)).length;
  const boneFindings = [`骨导频率完成 ${completedBone}/${boneNeeded.length}。`];
  const unmaskedBoneCount = thresholds.filter((item) => item.route === "bone" && !item.masked).length;
  if (unmaskedBoneCount > 0) {
    boneFindings.push("存在未掩蔽骨导记录，报告需说明非耳特异性。");
  }
  sections.push(section("骨导流程", (completedBone / boneNeeded.length) * 15, 15, boneFindings));

  const requiredMasking = caseData.answer.requiredMasking;
  const maskedHits = requiredMasking.filter((item) => {
    const threshold = getStudentThreshold(thresholds, item.ear, item.route, item.frequencyHz);
    return threshold?.masked;
  }).length;
  const maskingFindings =
    requiredMasking.length === 0
      ? ["本病例无强制掩蔽点；若使用掩蔽，应能解释原因。"]
      : [`必要掩蔽点完成 ${maskedHits}/${requiredMasking.length}。`];
  const unnecessaryMasking = thresholds.filter((item) => item.masked).length - maskedHits;
  if (unnecessaryMasking > 4 && requiredMasking.length === 0) {
    maskingFindings.push("掩蔽使用较多，需确认是否有明确指征。");
  }
  sections.push(
    section(
      "掩蔽判断",
      requiredMasking.length === 0 ? (unnecessaryMasking <= 4 ? 18 : 14) : (maskedHits / requiredMasking.length) * 20,
      20,
      maskingFindings
    )
  );

  let compared = 0;
  let close = 0;
  let largeMiss = 0;
  thresholds.forEach((threshold) => {
    if (threshold.noResponse) {
      return;
    }
    const expected = hiddenThreshold(caseData, threshold.ear, threshold.route, threshold.frequencyHz);
    compared += 1;
    const difference = Math.abs(threshold.levelDbHl - expected);
    if (difference <= 10) {
      close += 1;
    }
    if (difference >= 25) {
      largeMiss += 1;
    }
  });
  const dataFindings = compared === 0 ? ["尚未记录可评分阈值。"] : [`阈值在 10 dB 内 ${close}/${compared}。`];
  if (largeMiss > 0) {
    dataFindings.push(`${largeMiss} 个阈值偏差较大，建议回放定位原因。`);
  }
  const noResponseMarked = thresholds.some((item) => item.noResponse);
  if (caseData.teachingTags.includes("noResponse") && !noResponseMarked) {
    dataFindings.push("本病例应规范标记无反应或输出上限。");
  }
  sections.push(section("数据质量", compared > 0 ? (close / compared) * 15 - largeMiss * 1.5 : 0, 15, dataFindings));

  const comments = interpretation.comments.trim();
  const reliabilityMentioned = interpretation.reliability !== "good" || comments.includes("可靠") || comments.includes("复测");
  const reportKeywords = [caseData.answer.expectedPattern, ...caseData.teachingTags]
    .map((item) => item.toLowerCase())
    .filter(Boolean);
  const combinedInterpretation = `${interpretation.right} ${interpretation.left} ${comments}`.toLowerCase();
  const keywordHit = reportKeywords.some((keyword) => combinedInterpretation.includes(keyword));
  const reportFindings = [
    comments.length >= 12 ? "报告备注充分。" : "报告备注偏少。",
    reliabilityMentioned ? "已体现可靠性判断。" : "可靠性说明不足。"
  ];
  sections.push(
    section(
      "报告解释",
      (comments.length >= 12 ? 6 : 3) + (reliabilityMentioned ? 4 : 1) + (keywordHit ? 5 : 3),
      15,
      reportFindings
    )
  );

  const max = sections.reduce((total, item) => total + item.max, 0);
  const total = sections.reduce((sum, item) => sum + item.score, 0);
  return { total, max, sections };
}

export function coverageSummary(thresholds: StudentThreshold[]) {
  const airCount = thresholds.filter((item) => item.route === "air").length;
  const boneCount = thresholds.filter((item) => item.route === "bone").length;
  const maskedCount = thresholds.filter((item) => item.masked).length;
  const airTotal = AIR_FREQUENCIES.length * 2;
  const boneTotal = BONE_FREQUENCIES.length * 2;
  return { airCount, boneCount, maskedCount, airTotal, boneTotal };
}

