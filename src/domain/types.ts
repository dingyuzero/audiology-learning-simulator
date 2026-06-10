export type Ear = "right" | "left";
export type Route = "air" | "bone";
export type Mode = "teaching" | "practice" | "exam";
export type Stimulus = "steady" | "pulsed" | "warble";
export type Transducer = "supra" | "insert" | "bone";
export type Reliability = "good" | "fair" | "poor";

export const EARS: Ear[] = ["right", "left"];

export const AIR_FREQUENCIES = [125, 250, 500, 1000, 2000, 3000, 4000, 6000, 8000] as const;
export const BONE_FREQUENCIES = [250, 500, 1000, 2000, 4000] as const;
export const STANDARD_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000] as const;

export type Frequency = (typeof AIR_FREQUENCIES)[number] | (typeof BONE_FREQUENCIES)[number];
export type ThresholdByFrequency = Partial<Record<number, number>>;
export type ThresholdsByEar = Record<Ear, ThresholdByFrequency>;

export interface VisibleProfile {
  age: number;
  sex: string;
  chiefComplaint: string;
  history: string[];
  otoscopy: Record<Ear, string>;
  demeanor: string;
}

export interface PatientBehavior {
  cooperation: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  responseDelayMs: [number, number];
  fatigueAfterEvents: number;
  tinnitusFrequencies: number[];
  instructionSensitivity: number;
}

export interface TeachingAnswer {
  summary: string;
  expectedPattern: string;
  keyPoints: string[];
  requiredMasking: Array<{
    ear: Ear;
    route: Route;
    frequencyHz: number;
    reason: string;
  }>;
}

export interface AudiologyCase {
  id: string;
  title: string;
  difficulty: "basic" | "intermediate" | "advanced";
  visibleProfile: VisibleProfile;
  hiddenAudiology: {
    air: ThresholdsByEar;
    bone: ThresholdsByEar;
    uncomfortableLevel?: ThresholdsByEar;
  };
  behavior: PatientBehavior;
  teachingTags: string[];
  answer: TeachingAnswer;
}

export interface AudiometerSettings {
  ear: Ear;
  route: Route;
  frequencyHz: number;
  levelDbHl: number;
  transducer: Transducer;
  stimulus: Stimulus;
  maskingEnabled: boolean;
  maskingLevelDb: number;
}

export interface PatientResponse {
  responded: boolean;
  latencyMs: number | null;
  probability: number;
  effectiveThreshold: number;
  heardBy: Ear | "none";
  notes: string[];
}

export interface TestEvent {
  id: string;
  timestamp: string;
  elapsedSeconds: number;
  caseId: string;
  settings: AudiometerSettings;
  response: PatientResponse;
}

export interface StudentThreshold {
  id: string;
  ear: Ear;
  route: Route;
  frequencyHz: number;
  levelDbHl: number;
  masked: boolean;
  noResponse: boolean;
  timestamp: string;
}

export interface PrepState {
  caseReview: boolean;
  otoscopy: boolean;
  instructions: boolean;
  betterEar: boolean;
  transducerCheck: boolean;
}

export interface ReportInterpretation {
  right: string;
  left: string;
  reliability: Reliability;
  comments: string;
}

export interface ScoreSection {
  label: string;
  score: number;
  max: number;
  findings: string[];
}

export interface ScoreResult {
  total: number;
  max: number;
  sections: ScoreSection[];
}

export interface SimulatedReport {
  caseId: string;
  generatedAt: string;
  thresholds: StudentThreshold[];
  interpretation: ReportInterpretation;
  score: ScoreResult;
  teachingFeedback: string[];
}
