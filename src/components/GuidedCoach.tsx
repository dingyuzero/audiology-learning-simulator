import { ArrowRight, CheckCircle2, ClipboardList, ListChecks, MousePointerClick, Route } from "lucide-react";
import type { GuideAction, GuideStep } from "../engine/guide";
import type { Mode } from "../domain/types";

interface GuidedCoachProps {
  mode: Mode;
  guide: GuideStep;
  warnings?: string[];
  onAction: (action: GuideAction, guide: GuideStep) => void;
}

export function GuidedCoach({ mode, guide, warnings = [], onAction }: GuidedCoachProps) {
  if (mode === "exam") {
    return (
      <section className="panel teaching-panel guide-panel" aria-label="考核状态">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Exam</p>
            <h2>考核模式</h2>
          </div>
          <ClipboardList size={18} />
        </div>
        <div className="exam-box">
          <strong>不显示步骤引导</strong>
          <p>系统会记录每次给声、响应、阈值和报告，提交后生成评分与复盘。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel teaching-panel guide-panel" aria-label="新手引导">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Coach</p>
          <h2>新手引导</h2>
        </div>
        <div className="status-pill">{guide.progressPercent}%</div>
      </div>

      <div className="guide-profile">
        <div>
          <span>人群路线</span>
          <strong>{guide.profile.title}</strong>
          <p>{guide.profile.audience}</p>
        </div>
        <p>{guide.profile.firstClick}</p>
      </div>

      <div className="guide-progress" aria-label="学习进度">
        <span style={{ width: `${guide.progressPercent}%` }} />
      </div>

      <div className="guide-step-card">
        <div className="guide-phase">
          <MousePointerClick size={18} />
          <div>
            <span>{guide.progressLabel}</span>
            <strong>{guide.phaseTitle}</strong>
          </div>
        </div>
        <p>{guide.instruction}</p>
        <div className="click-path">
          {guide.clickPath.map((item, index) => (
            <span key={`${item}-${index}`}>
              {item}
              {index < guide.clickPath.length - 1 && <ArrowRight size={13} />}
            </span>
          ))}
        </div>
        <button className="primary-action guide-action" type="button" onClick={() => onAction(guide.action, guide)}>
          <MousePointerClick size={17} />
          {guide.actionLabel}
        </button>
      </div>

      <div className="guide-flow">
        <div className="subhead">
          <Route size={16} />
          <span>这类人群的顺序</span>
        </div>
        <div className="flow-steps">
          {guide.profile.flow.map((item, index) => (
            <span key={item}>
              {index + 1}. {item}
            </span>
          ))}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="warning-box">
          <strong>当前风险</strong>
          <p>{warnings.join(" · ")}</p>
        </div>
      )}

      <div className="guide-checklist">
        <div className="subhead">
          <ListChecks size={16} />
          <span>完成情况</span>
        </div>
        {guide.checklist.map((item) => (
          <div key={item.label} className={item.done ? "check-row done" : "check-row"}>
            <CheckCircle2 size={15} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MobileGuideBar({ mode, guide, onAction }: GuidedCoachProps) {
  if (mode === "exam") {
    return null;
  }

  return (
    <div className="mobile-guide-bar" aria-label="手机新手引导">
      <div>
        <span>{guide.progressLabel}</span>
        <strong>{guide.actionLabel}</strong>
      </div>
      <button type="button" className="primary-action" onClick={() => onAction(guide.action, guide)}>
        下一步
      </button>
    </div>
  );
}
