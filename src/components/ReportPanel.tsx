import { ClipboardCheck, FileText, RefreshCw, Send, Star } from "lucide-react";
import type {
  AudiologyCase,
  Mode,
  ReportInterpretation,
  SimulatedReport,
  StudentThreshold,
  TestEvent
} from "../domain/types";
import { calculatePta } from "../engine/audiology";
import { coverageSummary } from "../engine/scoring";
import { modeLabel, reliabilityLabel } from "../domain/labels";

interface ReportPanelProps {
  caseData: AudiologyCase;
  mode: Mode;
  events: TestEvent[];
  thresholds: StudentThreshold[];
  interpretation: ReportInterpretation;
  report: SimulatedReport | null;
  onInterpretationChange: (interpretation: ReportInterpretation) => void;
  onAutoFill: () => void;
  onGenerate: () => void;
}

export function ReportPanel({
  caseData,
  mode,
  events,
  thresholds,
  interpretation,
  report,
  onInterpretationChange,
  onAutoFill,
  onGenerate
}: ReportPanelProps) {
  const coverage = coverageSummary(thresholds);
  const rightPta = calculatePta(thresholds, "right");
  const leftPta = calculatePta(thresholds, "left");

  return (
    <section className="panel report-panel" aria-label="模拟报告">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Report</p>
          <h2>模拟测试报告</h2>
        </div>
        <div className="status-pill">
          <FileText size={15} />
          {modeLabel[mode]}
        </div>
      </div>

      <div className="report-metrics">
        <div>
          <span>气导覆盖</span>
          <strong>{coverage.airCount}/{coverage.airTotal}</strong>
        </div>
        <div>
          <span>骨导覆盖</span>
          <strong>{coverage.boneCount}/{coverage.boneTotal}</strong>
        </div>
        <div>
          <span>掩蔽记录</span>
          <strong>{coverage.maskedCount}</strong>
        </div>
        <div>
          <span>PTA 右/左</span>
          <strong>{rightPta ?? "-"} / {leftPta ?? "-"}</strong>
        </div>
      </div>

      <div className="interpretation-grid">
        <label>
          <span>右耳结论</span>
          <input
            value={interpretation.right}
            onChange={(event) => onInterpretationChange({ ...interpretation, right: event.target.value })}
          />
        </label>
        <label>
          <span>左耳结论</span>
          <input
            value={interpretation.left}
            onChange={(event) => onInterpretationChange({ ...interpretation, left: event.target.value })}
          />
        </label>
        <label>
          <span>可靠性</span>
          <select
            value={interpretation.reliability}
            onChange={(event) =>
              onInterpretationChange({
                ...interpretation,
                reliability: event.target.value as ReportInterpretation["reliability"]
              })
            }
          >
            <option value="good">{reliabilityLabel.good}</option>
            <option value="fair">{reliabilityLabel.fair}</option>
            <option value="poor">{reliabilityLabel.poor}</option>
          </select>
        </label>
        <label className="wide">
          <span>备注</span>
          <textarea
            value={interpretation.comments}
            onChange={(event) => onInterpretationChange({ ...interpretation, comments: event.target.value })}
          />
        </label>
      </div>

      <div className="action-row">
        {mode !== "exam" && (
          <button type="button" onClick={onAutoFill} title="自动填写报告">
            <RefreshCw size={17} />
            自动填写
          </button>
        )}
        <button className="primary-action" type="button" onClick={onGenerate} title="提交报告">
          <Send size={17} />
          提交报告
        </button>
      </div>

      {report && (
        <div className="score-area">
          <div className="score-hero">
            <div>
              <span>总分</span>
              <strong>{report.score.total}/{report.score.max}</strong>
            </div>
            <p>{caseData.answer.expectedPattern}</p>
          </div>

          <div className="score-grid">
            {report.score.sections.map((section) => (
              <div key={section.label} className="score-section">
                <div>
                  <strong>{section.label}</strong>
                  <span>{section.score}/{section.max}</span>
                </div>
                <meter min={0} max={section.max} value={section.score} />
                <p>{section.findings[0]}</p>
              </div>
            ))}
          </div>

          <div className="feedback-block">
            <div className="subhead">
              <ClipboardCheck size={16} />
              <span>教学反馈</span>
            </div>
            <ul>
              {report.teachingFeedback.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {(mode === "teaching" || (mode === "practice" && report)) && (
        <div className="teacher-notes">
          <div className="subhead">
            <Star size={16} />
            <span>病例要点</span>
          </div>
          {caseData.answer.keyPoints.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </div>
      )}
    </section>
  );
}
