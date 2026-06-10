import { ClipboardCheck, Ear, MessagesSquare, SearchCheck, UserRound } from "lucide-react";
import type { AudiologyCase, Mode, PrepState, TestEvent } from "../domain/types";
import { modeLabel } from "../domain/labels";

interface PatientPanelProps {
  caseData: AudiologyCase;
  mode: Mode;
  prep: PrepState;
  lastEvent: TestEvent | null;
  elapsedSeconds: number;
  onPrepChange: (prep: PrepState) => void;
}

const prepLabels: Array<{ key: keyof PrepState; label: string }> = [
  { key: "caseReview", label: "核对病例" },
  { key: "otoscopy", label: "耳镜信息" },
  { key: "instructions", label: "任务说明" },
  { key: "betterEar", label: "较好耳判断" },
  { key: "transducerCheck", label: "换能器检查" }
];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remaining = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export function PatientPanel({ caseData, mode, prep, lastEvent, elapsedSeconds, onPrepChange }: PatientPanelProps) {
  return (
    <section className="panel patient-panel" aria-label="模拟患者">
      <div className="patient-hero">
        <div className="patient-avatar" aria-hidden="true">
          <UserRound size={52} />
        </div>
        <div className="patient-summary">
          <p className="eyebrow">{caseData.id} · {modeLabel[mode]} · {formatTime(elapsedSeconds)}</p>
          <h2>{caseData.title}</h2>
          <p>{caseData.visibleProfile.age} 岁，{caseData.visibleProfile.sex}，{caseData.visibleProfile.demeanor}</p>
        </div>
      </div>

      <div className="chief-complaint">
        <MessagesSquare size={17} />
        <span>{caseData.visibleProfile.chiefComplaint}</span>
      </div>

      <div className="info-list">
        {caseData.visibleProfile.history.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>

      <div className="otoscopy-grid">
        <div>
          <strong><Ear size={15} />右耳</strong>
          <p>{caseData.visibleProfile.otoscopy.right}</p>
        </div>
        <div>
          <strong><Ear size={15} />左耳</strong>
          <p>{caseData.visibleProfile.otoscopy.left}</p>
        </div>
      </div>

      <div className="prep-list">
        <div className="subhead">
          <ClipboardCheck size={16} />
          <span>测前准备</span>
        </div>
        <div className="prep-grid">
          {prepLabels.map((item) => (
            <label key={item.key} className={prep[item.key] ? "prep-item checked" : "prep-item"}>
              <input
                type="checkbox"
                checked={prep[item.key]}
                onChange={(event) => onPrepChange({ ...prep, [item.key]: event.target.checked })}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={lastEvent?.response.responded ? "booth-signal active" : "booth-signal"}>
        <SearchCheck size={18} />
        <div>
          <span>患者响应灯</span>
          <strong>{lastEvent?.response.responded ? "按键响应" : "静默"}</strong>
        </div>
      </div>
    </section>
  );
}

