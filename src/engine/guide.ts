import {
  BONE_FREQUENCIES,
  EARS,
  STANDARD_FREQUENCIES,
  type AudiologyCase,
  type AudiometerSettings,
  type Ear,
  type PrepState,
  type Route,
  type StudentThreshold,
  type TestEvent
} from "../domain/types";
import { earLabel, routeLabel } from "../domain/labels";
import { getStudentThreshold } from "./audiology";

export type GuideAction =
  | "complete-prep"
  | "setup-air-start"
  | "give-tone"
  | "lower-10"
  | "raise-10"
  | "record-threshold"
  | "setup-target"
  | "setup-masking"
  | "auto-report"
  | "submit-report"
  | "review-report";

export interface GuideTarget {
  ear: Ear;
  route: Route;
  frequencyHz: number;
  masking?: boolean;
}

export interface LearnerProfile {
  title: string;
  audience: string;
  firstClick: string;
  flow: string[];
}

export interface GuideStep {
  profile: LearnerProfile;
  phaseTitle: string;
  instruction: string;
  clickPath: string[];
  actionLabel: string;
  action: GuideAction;
  target?: GuideTarget;
  progressLabel: string;
  progressPercent: number;
  focusPanel: "patient" | "device" | "audiogram" | "report";
  checklist: Array<{ label: string; done: boolean }>;
}

const AIR_ORDER = [1000, 2000, 4000, 8000, 500, 250] as const;
const BONE_ORDER = [1000, 2000, 4000, 500, 250] as const;

function profileForCase(caseData: AudiologyCase): LearnerProfile {
  const tags = caseData.teachingTags;

  if (tags.includes("unreliable")) {
    return {
      title: "反应不稳定人群",
      audience: "紧张、提前按键或漏按的学生病例",
      firstClick: "先点“任务说明”，再用 1000 Hz 做熟悉化，不急着记录阈值。",
      flow: ["说明任务", "1000 Hz 熟悉化", "识别假阳性/漏按", "复测确认", "谨慎报告可靠性"]
    };
  }

  if (tags.includes("noResponse")) {
    return {
      title: "无反应/输出上限人群",
      audience: "单侧极重度或多频率无反应病例",
      firstClick: "先完成测前准备，再从较好耳开始，差耳高强度前打开掩蔽意识。",
      flow: ["较好耳起测", "差耳气导", "必要掩蔽", "无反应标记", "报告说明上限"]
    };
  }

  if (tags.includes("asymmetry") || tags.includes("mixed")) {
    return {
      title: "单侧不对称/混合性人群",
      audience: "左右耳差异大、容易发生交叉听觉的病例",
      firstClick: "先点较好耳做基线，再测差耳；看到双耳差距大时优先考虑掩蔽。",
      flow: ["较好耳基线", "差耳气导", "观察双耳差距", "加掩蔽", "骨导确认"]
    };
  }

  if (tags.includes("conductive") || tags.includes("boneMasking") || tags.includes("airBoneGap")) {
    return {
      title: "中耳/传导性人群",
      audience: "耳闷、鼓膜异常或气骨导差训练病例",
      firstClick: "先做气导，再切骨导；出现气骨导差时不要忘记骨导掩蔽。",
      flow: ["气导全频", "切换骨导", "观察气骨导差", "骨导掩蔽", "报告性质"]
    };
  }

  if (tags.includes("tinnitus") || tags.includes("noiseNotch")) {
    return {
      title: "耳鸣/噪声暴露人群",
      audience: "高频耳鸣、噪声切迹或高频下降病例",
      firstClick: "先从 1000 Hz 熟悉化，再补测 3000/6000 Hz，高频点要复核。",
      flow: ["1000 Hz 起测", "常规气导", "补测高频", "复核耳鸣频率", "描述构型"]
    };
  }

  if (tags.includes("highFrequencySlope")) {
    return {
      title: "老年/反应较慢人群",
      audience: "高频下降、反应潜伏期较长的病例",
      firstClick: "先给足说明和等待时间，从 1000 Hz 开始，不要把反应慢误判为未听到。",
      flow: ["说明任务", "1000 Hz 起测", "等待反应", "测高频", "描述高频下降"]
    };
  }

  return {
    title: "标准配合成人",
    audience: "适合第一次练习的基础病例",
    firstClick: "先点完测前准备，再把听力计设为右耳、气导、1000 Hz、40 dB。",
    flow: ["测前准备", "右耳 1000 Hz", "升5降10", "记录阈值", "换频/换耳"]
  };
}

function allPrepDone(prep: PrepState) {
  return Object.values(prep).every(Boolean);
}

function sameTarget(settings: AudiometerSettings, target: GuideTarget) {
  return (
    settings.ear === target.ear &&
    settings.route === target.route &&
    settings.frequencyHz === target.frequencyHz &&
    (!target.masking || settings.maskingEnabled)
  );
}

function targetLabel(target: GuideTarget) {
  const masking = target.masking ? " + 掩蔽" : "";
  return `${earLabel[target.ear]} ${routeLabel[target.route]} ${target.frequencyHz} Hz${masking}`;
}

function currentPointEvents(settings: AudiometerSettings, events: TestEvent[]) {
  return events.filter(
    (event) =>
      event.settings.ear === settings.ear &&
      event.settings.route === settings.route &&
      event.settings.frequencyHz === settings.frequencyHz &&
      event.settings.maskingEnabled === settings.maskingEnabled
  );
}

function findNextAirTarget(thresholds: StudentThreshold[]): GuideTarget | null {
  for (const ear of EARS) {
    for (const frequencyHz of AIR_ORDER) {
      if (!getStudentThreshold(thresholds, ear, "air", frequencyHz)) {
        return { ear, route: "air", frequencyHz };
      }
    }
  }
  return null;
}

function findNextBoneTarget(thresholds: StudentThreshold[]): GuideTarget | null {
  for (const ear of EARS) {
    for (const frequencyHz of BONE_ORDER) {
      if (!BONE_FREQUENCIES.includes(frequencyHz)) {
        continue;
      }
      if (!getStudentThreshold(thresholds, ear, "bone", frequencyHz)) {
        return { ear, route: "bone", frequencyHz };
      }
    }
  }
  return null;
}

function findMissingMaskingTarget(caseData: AudiologyCase, thresholds: StudentThreshold[]): GuideTarget | null {
  const missing = caseData.answer.requiredMasking.find((item) => {
    const threshold = getStudentThreshold(thresholds, item.ear, item.route, item.frequencyHz);
    return !threshold?.masked;
  });

  return missing ? { ear: missing.ear, route: missing.route, frequencyHz: missing.frequencyHz, masking: true } : null;
}

function guideChecklist(prep: PrepState, events: TestEvent[], thresholds: StudentThreshold[], reportReady: boolean) {
  const airDone = EARS.every((ear) => STANDARD_FREQUENCIES.every((frequencyHz) => getStudentThreshold(thresholds, ear, "air", frequencyHz)));
  const boneStarted = thresholds.some((threshold) => threshold.route === "bone");
  const maskedStarted = thresholds.some((threshold) => threshold.masked);

  return [
    { label: "测前准备", done: allPrepDone(prep) },
    { label: "开始给声", done: events.length > 0 },
    { label: "气导关键频率", done: airDone },
    { label: "骨导/掩蔽意识", done: boneStarted || maskedStarted },
    { label: "报告提交", done: reportReady }
  ];
}

function progressFromChecklist(checklist: Array<{ done: boolean }>) {
  const done = checklist.filter((item) => item.done).length;
  return Math.round((done / checklist.length) * 100);
}

export function buildGuideStep({
  caseData,
  prep,
  settings,
  events,
  thresholds,
  interpretationReady,
  reportReady
}: {
  caseData: AudiologyCase;
  prep: PrepState;
  settings: AudiometerSettings;
  events: TestEvent[];
  thresholds: StudentThreshold[];
  interpretationReady: boolean;
  reportReady: boolean;
}): GuideStep {
  const profile = profileForCase(caseData);
  const checklist = guideChecklist(prep, events, thresholds, reportReady);
  const progressPercent = progressFromChecklist(checklist);

  const base = {
    profile,
    checklist,
    progressPercent
  };

  if (!allPrepDone(prep)) {
    return {
      ...base,
      phaseTitle: "第 1 步：测前准备",
      instruction: "先完成病例核对、耳镜信息、任务说明、较好耳判断和换能器检查。新手不要直接给声。",
      clickPath: ["模拟患者", "测前准备", "逐项勾选"],
      actionLabel: "一键完成测前准备",
      action: "complete-prep",
      progressLabel: "准备阶段",
      focusPanel: "patient"
    };
  }

  const startTarget: GuideTarget = { ear: "right", route: "air", frequencyHz: 1000 };
  if (events.length === 0 && !sameTarget(settings, startTarget)) {
    return {
      ...base,
      phaseTitle: "第 2 步：设置起始点",
      instruction: "第一次练习从右耳气导 1000 Hz 开始，强度先放在 40 dB，确认患者会按键。",
      clickPath: ["模拟听力计", "右耳", "气导", "1000 Hz", "40 dB"],
      actionLabel: "设为右耳 1000 Hz",
      action: "setup-air-start",
      target: startTarget,
      progressLabel: "设备设置",
      focusPanel: "device"
    };
  }

  if (events.length === 0) {
    return {
      ...base,
      phaseTitle: "第 3 步：第一次给声",
      instruction: "现在点击“给声”，观察患者响应灯。若有反应，下一步下降 10 dB；若无反应，下一步上升 10 dB。",
      clickPath: ["模拟听力计", "给声"],
      actionLabel: "给声",
      action: "give-tone",
      target: startTarget,
      progressLabel: "熟悉化",
      focusPanel: "device"
    };
  }

  const currentEvents = currentPointEvents(settings, events);
  const currentRecorded = Boolean(getStudentThreshold(thresholds, settings.ear, settings.route, settings.frequencyHz));
  const lastEvent = events[events.length - 1];

  if (!currentRecorded && currentEvents.length >= 2) {
    return {
      ...base,
      phaseTitle: "第 4 步：记录当前阈值",
      instruction: "当前频率已有多次给声。若你认为已达到上升法确认条件，点击“记录阈值”，再换下一个频率。",
      clickPath: ["模拟听力计", "记录阈值"],
      actionLabel: "记录阈值",
      action: "record-threshold",
      target: { ear: settings.ear, route: settings.route, frequencyHz: settings.frequencyHz, masking: settings.maskingEnabled },
      progressLabel: "阈值确认",
      focusPanel: "device"
    };
  }

  if (!currentRecorded && lastEvent.settings.frequencyHz === settings.frequencyHz && lastEvent.settings.ear === settings.ear) {
    if (
      lastEvent.settings.levelDbHl !== settings.levelDbHl ||
      lastEvent.settings.route !== settings.route ||
      lastEvent.settings.maskingEnabled !== settings.maskingEnabled
    ) {
      return {
        ...base,
        phaseTitle: "第 4 步：继续给声",
        instruction: "设备参数已经调整。现在点击“给声”，用新的强度观察患者响应。",
        clickPath: ["模拟听力计", "给声"],
        actionLabel: "给声",
        action: "give-tone",
        target: { ear: settings.ear, route: settings.route, frequencyHz: settings.frequencyHz, masking: settings.maskingEnabled },
        progressLabel: "升降法",
        focusPanel: "device"
      };
    }

    if (lastEvent.response.responded) {
      return {
        ...base,
        phaseTitle: "第 4 步：响应后下降",
        instruction: "患者刚才有反应。按常规训练，先下降 10 dB，再从不可听或接近不可听强度重新上升。",
        clickPath: ["模拟听力计", "-10", "给声"],
        actionLabel: "下降 10 dB",
        action: "lower-10",
        target: { ear: settings.ear, route: settings.route, frequencyHz: settings.frequencyHz, masking: settings.maskingEnabled },
        progressLabel: "升降法",
        focusPanel: "device"
      };
    }

    return {
      ...base,
      phaseTitle: "第 4 步：无响应后上升",
      instruction: "患者刚才没有反应。先上升 10 dB 找到可听水平；接近阈值后再按 5 dB 步进确认。",
      clickPath: ["模拟听力计", "+10", "给声"],
      actionLabel: "上升 10 dB",
      action: "raise-10",
      target: { ear: settings.ear, route: settings.route, frequencyHz: settings.frequencyHz, masking: settings.maskingEnabled },
      progressLabel: "升降法",
      focusPanel: "device"
    };
  }

  const nextAirTarget = findNextAirTarget(thresholds);
  if (nextAirTarget) {
    if (!sameTarget(settings, nextAirTarget)) {
      return {
        ...base,
        phaseTitle: "第 5 步：换频或换耳",
        instruction: `气导还没测完。下一步切到 ${targetLabel(nextAirTarget)}，再按同样的升 5 降 10 方法找阈值。`,
        clickPath: ["模拟听力计", targetLabel(nextAirTarget), "给声"],
        actionLabel: `切到 ${targetLabel(nextAirTarget)}`,
        action: "setup-target",
        target: nextAirTarget,
        progressLabel: "气导流程",
        focusPanel: "device"
      };
    }

    return {
      ...base,
      phaseTitle: "第 5 步：继续气导",
      instruction: `当前已经在 ${targetLabel(nextAirTarget)}。点击给声，继续完成该频率阈值确认。`,
      clickPath: ["模拟听力计", "给声"],
      actionLabel: "给声",
      action: "give-tone",
      target: nextAirTarget,
      progressLabel: "气导流程",
      focusPanel: "device"
    };
  }

  const maskingTarget = findMissingMaskingTarget(caseData, thresholds);
  if (maskingTarget) {
    return {
      ...base,
      phaseTitle: "第 6 步：必要掩蔽",
      instruction: `本病例存在必须练习的掩蔽点。下一步设置 ${targetLabel(maskingTarget)}，打开窄带噪声后重新确认阈值。`,
      clickPath: ["模拟听力计", targetLabel(maskingTarget), "打开窄带噪声", "给声"],
      actionLabel: `设置 ${targetLabel(maskingTarget)}`,
      action: "setup-masking",
      target: maskingTarget,
      progressLabel: "掩蔽训练",
      focusPanel: "device"
    };
  }

  const nextBoneTarget = findNextBoneTarget(thresholds);
  if (nextBoneTarget) {
    if (!sameTarget(settings, nextBoneTarget)) {
      return {
        ...base,
        phaseTitle: "第 6 步：切换骨导",
        instruction: `气导关键点已覆盖。下一步切到 ${targetLabel(nextBoneTarget)}，骨导结果要注意非耳特异性。`,
        clickPath: ["模拟听力计", "骨导", targetLabel(nextBoneTarget), "给声"],
        actionLabel: `切到 ${targetLabel(nextBoneTarget)}`,
        action: "setup-target",
        target: nextBoneTarget,
        progressLabel: "骨导流程",
        focusPanel: "device"
      };
    }

    return {
      ...base,
      phaseTitle: "第 6 步：继续骨导",
      instruction: `当前已经在 ${targetLabel(nextBoneTarget)}。点击给声并确认骨导阈值，必要时回到掩蔽步骤。`,
      clickPath: ["模拟听力计", "给声"],
      actionLabel: "给声",
      action: "give-tone",
      target: nextBoneTarget,
      progressLabel: "骨导流程",
      focusPanel: "device"
    };
  }

  if (!interpretationReady) {
    return {
      ...base,
      phaseTitle: "第 7 步：填写报告",
      instruction: "阈值记录已经比较完整。先自动填写报告草稿，再检查程度、性质、构型和可靠性是否合理。",
      clickPath: ["模拟测试报告", "自动填写"],
      actionLabel: "自动填写报告",
      action: "auto-report",
      progressLabel: "报告阶段",
      focusPanel: "report"
    };
  }

  if (!reportReady) {
    return {
      ...base,
      phaseTitle: "第 8 步：提交并看反馈",
      instruction: "报告草稿已存在。点击提交报告，查看分项评分、错误点和教学反馈。",
      clickPath: ["模拟测试报告", "提交报告"],
      actionLabel: "提交报告",
      action: "submit-report",
      progressLabel: "提交报告",
      focusPanel: "report"
    };
  }

  return {
    ...base,
    phaseTitle: "完成：查看复盘",
    instruction: "本病例已完成。查看听力图、过程回放和评分反馈；再换一个人群病例练习。",
    clickPath: ["过程回放", "评分反馈", "切换病例"],
    actionLabel: "查看报告",
    action: "review-report",
    progressLabel: "复盘",
    focusPanel: "report"
  };
}
