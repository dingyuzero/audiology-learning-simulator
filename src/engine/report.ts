import { EARS, type AudiologyCase, type PrepState, type ReportInterpretation, type SimulatedReport, type StudentThreshold, type TestEvent } from "../domain/types";
import { earLabel } from "../domain/labels";
import { calculatePta, classifyConfiguration, classifyDegree, classifyType } from "./audiology";
import { scoreSession } from "./scoring";

function estimateReliability(events: TestEvent[], thresholds: StudentThreshold[]): ReportInterpretation["reliability"] {
  const falsePositiveLike = events.filter(
    (event) => event.response.responded && event.settings.levelDbHl + 10 < event.response.effectiveThreshold
  ).length;
  const nearThresholdEvents = events.filter((event) => event.response.notes.includes("near-threshold")).length;
  const thresholdCount = thresholds.length;

  if (falsePositiveLike >= 4 || (thresholdCount > 0 && nearThresholdEvents / Math.max(1, events.length) > 0.45)) {
    return "poor";
  }
  if (falsePositiveLike >= 2 || events.some((event) => event.response.notes.includes("fatigue"))) {
    return "fair";
  }
  return "good";
}

export function buildAutoInterpretation(events: TestEvent[], thresholds: StudentThreshold[]): ReportInterpretation {
  const sides = EARS.reduce(
    (result, ear) => {
      const pta = calculatePta(thresholds, ear);
      const degree = classifyDegree(pta);
      const type = classifyType(thresholds, ear);
      const configuration = classifyConfiguration(thresholds, ear);
      result[ear] = `${earLabel[ear]}：${degree}，${type}，${configuration}`;
      return result;
    },
    {} as Record<(typeof EARS)[number], string>
  );

  const reliability = estimateReliability(events, thresholds);
  return {
    right: sides.right,
    left: sides.left,
    reliability,
    comments: "教学模拟报告，请结合阈值表、听力图和过程回放复核。"
  };
}

export function buildTeachingFeedback(caseData: AudiologyCase, thresholds: StudentThreshold[], events: TestEvent[]): string[] {
  const feedback: string[] = [];
  feedback.push(caseData.answer.summary);

  const requiredMaskingMissing = caseData.answer.requiredMasking.filter((item) => {
    return !thresholds.some(
      (threshold) =>
        threshold.ear === item.ear &&
        threshold.route === item.route &&
        threshold.frequencyHz === item.frequencyHz &&
        threshold.masked
    );
  });

  if (requiredMaskingMissing.length > 0) {
    feedback.push(`还有 ${requiredMaskingMissing.length} 个必要掩蔽点未记录，优先复习交叉听觉和平台判断。`);
  }

  if (events.some((event) => event.response.notes.includes("cross-hearing-risk"))) {
    feedback.push("过程中出现交叉听觉风险信号，回放中已保留对应给声事件。");
  }

  if (events.some((event) => event.response.notes.includes("tinnitus-interference"))) {
    feedback.push("耳鸣干扰频率附近建议增加阈值确认并在报告中说明可靠性。");
  }

  if (thresholds.some((threshold) => threshold.noResponse)) {
    feedback.push("无反应记录已进入报告，注意不要把设备输出上限写成真实阈值。");
  }

  if (feedback.length < 4) {
    feedback.push(...caseData.answer.keyPoints.slice(0, 3));
  }

  return [...new Set(feedback)].slice(0, 6);
}

export function generateReport(
  caseData: AudiologyCase,
  prep: PrepState,
  events: TestEvent[],
  thresholds: StudentThreshold[],
  interpretation: ReportInterpretation
): SimulatedReport {
  const score = scoreSession(caseData, prep, events, thresholds, interpretation);
  return {
    caseId: caseData.id,
    generatedAt: new Date().toISOString(),
    thresholds,
    interpretation,
    score,
    teachingFeedback: buildTeachingFeedback(caseData, thresholds, events)
  };
}

