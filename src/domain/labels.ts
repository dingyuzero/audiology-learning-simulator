import type { Ear, Mode, Reliability, Route, Stimulus, Transducer } from "./types";

export const earLabel: Record<Ear, string> = {
  right: "右耳",
  left: "左耳"
};

export const routeLabel: Record<Route, string> = {
  air: "气导",
  bone: "骨导"
};

export const transducerLabel: Record<Transducer, string> = {
  supra: "压耳式耳机",
  insert: "插入式耳机",
  bone: "骨导振子"
};

export const stimulusLabel: Record<Stimulus, string> = {
  steady: "纯音",
  pulsed: "脉冲",
  warble: "啭音"
};

export const modeLabel: Record<Mode, string> = {
  teaching: "教学",
  practice: "自由练习",
  exam: "考核"
};

export const reliabilityLabel: Record<Reliability, string> = {
  good: "可靠",
  fair: "基本可靠",
  poor: "需谨慎"
};

export function formatDb(level: number) {
  return `${level} dB HL`;
}
