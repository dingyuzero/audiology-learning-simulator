import { GraduationCap, RotateCcw, ShieldCheck, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Audiogram } from "./components/Audiogram";
import { AudiometerPanel } from "./components/AudiometerPanel";
import { EventLog } from "./components/EventLog";
import { GuidedCoach, MobileGuideBar } from "./components/GuidedCoach";
import { PatientPanel } from "./components/PatientPanel";
import { ReportPanel } from "./components/ReportPanel";
import { CASES } from "./data/cases";
import { modeLabel } from "./domain/labels";
import type {
  AudiometerSettings,
  Mode,
  PrepState,
  ReportInterpretation,
  SimulatedReport,
  StudentThreshold,
  TestEvent
} from "./domain/types";
import { thresholdKey } from "./engine/audiology";
import { buildGuideStep, type GuideAction, type GuideStep } from "./engine/guide";
import { simulatePatientResponse } from "./engine/patient-response";
import { buildAutoInterpretation, generateReport } from "./engine/report";

const defaultPrep: PrepState = {
  caseReview: false,
  otoscopy: false,
  instructions: false,
  betterEar: false,
  transducerCheck: false
};

const defaultSettings: AudiometerSettings = {
  ear: "right",
  route: "air",
  frequencyHz: 1000,
  levelDbHl: 40,
  transducer: "supra",
  stimulus: "pulsed",
  maskingEnabled: false,
  maskingLevelDb: 40
};

const defaultInterpretation: ReportInterpretation = {
  right: "",
  left: "",
  reliability: "good",
  comments: ""
};

function createSessionSeed(caseId: string, mode: Mode) {
  return mode === "exam" ? `${caseId}:exam-fixed-seed` : `${caseId}:${Date.now()}`;
}

export function App() {
  const [selectedCaseId, setSelectedCaseId] = useState(CASES[0].id);
  const [mode, setMode] = useState<Mode>("practice");
  const [settings, setSettings] = useState<AudiometerSettings>(defaultSettings);
  const [prep, setPrep] = useState<PrepState>(defaultPrep);
  const [events, setEvents] = useState<TestEvent[]>([]);
  const [thresholds, setThresholds] = useState<StudentThreshold[]>([]);
  const [interpretation, setInterpretation] = useState<ReportInterpretation>(defaultInterpretation);
  const [report, setReport] = useState<SimulatedReport | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionSeed, setSessionSeed] = useState(createSessionSeed(CASES[0].id, "practice"));

  const caseData = useMemo(() => CASES.find((item) => item.id === selectedCaseId) ?? CASES[0], [selectedCaseId]);
  const lastEvent = events.length > 0 ? events[events.length - 1] : null;
  const lastResponse = lastEvent?.response ?? null;
  const interpretationReady = Boolean(interpretation.right || interpretation.left || interpretation.comments);
  const guide = useMemo(
    () =>
      buildGuideStep({
        caseData,
        prep,
        settings,
        events,
        thresholds,
        interpretationReady,
        reportReady: Boolean(report)
      }),
    [caseData, prep, settings, events, thresholds, interpretationReady, report]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((Date.now() - startedAt) / 1000);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const resetSession = (caseId = selectedCaseId, nextMode = mode) => {
    setSelectedCaseId(caseId);
    setSettings(defaultSettings);
    setPrep(defaultPrep);
    setEvents([]);
    setThresholds([]);
    setInterpretation(defaultInterpretation);
    setReport(null);
    setStartedAt(Date.now());
    setElapsedSeconds(0);
    setSessionSeed(createSessionSeed(caseId, nextMode));
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    resetSession(selectedCaseId, nextMode);
  };

  const handleCaseChange = (caseId: string) => {
    resetSession(caseId, mode);
  };

  const handleGiveTone = () => {
    const response = simulatePatientResponse(caseData, settings, {
      eventIndex: events.length + 1,
      sessionSeed,
      instructionReady: prep.instructions
    });
    const now = new Date();
    const event: TestEvent = {
      id: `${now.getTime()}-${events.length}`,
      timestamp: now.toISOString(),
      elapsedSeconds,
      caseId: caseData.id,
      settings,
      response
    };
    setEvents((current) => [...current, event]);
    setReport(null);
  };

  const upsertThreshold = (noResponse: boolean) => {
    const now = new Date();
    const threshold: StudentThreshold = {
      id: `${thresholdKey(settings.ear, settings.route, settings.frequencyHz)}:${now.getTime()}`,
      ear: settings.ear,
      route: settings.route,
      frequencyHz: settings.frequencyHz,
      levelDbHl: settings.levelDbHl,
      masked: settings.maskingEnabled,
      noResponse,
      timestamp: now.toISOString()
    };
    setThresholds((current) => [
      ...current.filter(
        (item) => thresholdKey(item.ear, item.route, item.frequencyHz) !== thresholdKey(threshold.ear, threshold.route, threshold.frequencyHz)
      ),
      threshold
    ]);
    setReport(null);
  };

  const scrollToPanel = (panel: GuideStep["focusPanel"]) => {
    const selectorByPanel: Record<GuideStep["focusPanel"], string> = {
      patient: ".patient-panel",
      device: ".device-panel",
      audiogram: ".audiogram-panel",
      report: ".report-panel"
    };
    window.setTimeout(() => {
      document.querySelector(selectorByPanel[panel])?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleAutoFill = () => {
    setInterpretation(buildAutoInterpretation(events, thresholds));
  };

  const handleGenerateReport = () => {
    const finalInterpretation =
      interpretation.right || interpretation.left || interpretation.comments
        ? interpretation
        : buildAutoInterpretation(events, thresholds);
    setInterpretation(finalInterpretation);
    setReport(generateReport(caseData, prep, events, thresholds, finalInterpretation));
  };

  const handleGuideAction = (action: GuideAction, currentGuide: GuideStep) => {
    const target = currentGuide.target;

    if (action === "complete-prep") {
      setPrep({
        caseReview: true,
        otoscopy: true,
        instructions: true,
        betterEar: true,
        transducerCheck: true
      });
      scrollToPanel("device");
      return;
    }

    if (action === "setup-air-start") {
      setSettings({
        ...settings,
        ear: "right",
        route: "air",
        frequencyHz: 1000,
        levelDbHl: 40,
        transducer: "supra",
        maskingEnabled: false
      });
      scrollToPanel("device");
      return;
    }

    if ((action === "setup-target" || action === "setup-masking") && target) {
      setSettings({
        ...settings,
        ear: target.ear,
        route: target.route,
        frequencyHz: target.frequencyHz,
        levelDbHl: target.route === "bone" ? 30 : 40,
        transducer: target.route === "bone" ? "bone" : settings.transducer === "bone" ? "supra" : settings.transducer,
        maskingEnabled: Boolean(target.masking),
        maskingLevelDb: target.masking ? Math.max(settings.maskingLevelDb, 50) : settings.maskingLevelDb
      });
      scrollToPanel("device");
      return;
    }

    if (action === "give-tone") {
      handleGiveTone();
      scrollToPanel("device");
      return;
    }

    if (action === "lower-10") {
      setSettings((current) => ({ ...current, levelDbHl: Math.max(-10, current.levelDbHl - 10) }));
      scrollToPanel("device");
      return;
    }

    if (action === "raise-10") {
      setSettings((current) => ({ ...current, levelDbHl: Math.min(120, current.levelDbHl + 10) }));
      scrollToPanel("device");
      return;
    }

    if (action === "record-threshold") {
      upsertThreshold(false);
      scrollToPanel("audiogram");
      return;
    }

    if (action === "auto-report") {
      handleAutoFill();
      scrollToPanel("report");
      return;
    }

    if (action === "submit-report") {
      handleGenerateReport();
      scrollToPanel("report");
      return;
    }

    scrollToPanel(currentGuide.focusPanel);
  };

  const currentWarnings = lastEvent?.response.notes.filter((note: string) =>
    ["cross-hearing-risk", "overmasking-risk", "bone-unmasked-non-specific", "tinnitus-interference"].includes(note)
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Stethoscope size={24} />
          </div>
          <div>
            <p className="eyebrow">Audiology Training</p>
            <h1>测听学习模拟工具</h1>
          </div>
        </div>

        <div className="top-controls">
          <label className="case-picker">
            <span>病例</span>
            <select value={selectedCaseId} onChange={(event) => handleCaseChange(event.target.value)}>
              {CASES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} · {item.title}
                </option>
              ))}
            </select>
          </label>

          <div className="mode-switch" aria-label="模式">
            {(["practice", "exam"] as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                className={mode === item ? "selected" : ""}
                onClick={() => handleModeChange(item)}
              >
                {item === "practice" ? <GraduationCap size={16} /> : <ShieldCheck size={16} />}
                {modeLabel[item]}
              </button>
            ))}
          </div>

          <button type="button" className="reset-button" onClick={() => resetSession()} title="重置会话">
            <RotateCcw size={17} />
            重置
          </button>
        </div>
      </header>

      <main className="workspace">
        <PatientPanel
          caseData={caseData}
          mode={mode}
          prep={prep}
          lastEvent={lastEvent}
          elapsedSeconds={elapsedSeconds}
          onPrepChange={setPrep}
        />

        <GuidedCoach mode={mode} guide={guide} warnings={currentWarnings ?? []} onAction={handleGuideAction} />

        <AudiometerPanel
          settings={settings}
          lastResponse={lastResponse}
          onSettingsChange={setSettings}
          onGiveTone={handleGiveTone}
          onMarkThreshold={() => upsertThreshold(false)}
          onMarkNoResponse={() => upsertThreshold(true)}
        />

        <Audiogram thresholds={thresholds} />

        <EventLog events={events} />

        <ReportPanel
          caseData={caseData}
          mode={mode}
          events={events}
          thresholds={thresholds}
          interpretation={interpretation}
          report={report}
          onInterpretationChange={setInterpretation}
          onAutoFill={handleAutoFill}
          onGenerate={handleGenerateReport}
        />
      </main>

      <MobileGuideBar mode={mode} guide={guide} onAction={handleGuideAction} />
    </div>
  );
}
