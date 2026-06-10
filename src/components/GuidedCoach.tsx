import { ArrowRight, Award, BookOpen, CheckCircle2, ListChecks, MousePointerClick, Route } from "lucide-react";
import type { GuideAction, GuideStep } from "../engine/guide";
import type { Mode, ScoreResult } from "../domain/types";

interface GuidedCoachProps {
  mode: Mode;
  guide: GuideStep;
  warnings?: string[];
  score?: ScoreResult | null;
  onAction: (action: GuideAction, guide: GuideStep) => void;
}

const examRubric = [
  { label: "测前准备", max: 15, hint: "核对病例、耳镜信息、任务说明和换能器检查。" },
  { label: "气导流程", max: 20, hint: "完成关键频率、熟悉化、升 5 降 10 和 1000 Hz 复测。" },
  { label: "骨导流程", max: 15, hint: "完成骨导频率，识别非耳特异性结果。" },
  { label: "掩蔽判断", max: 20, hint: "识别交叉听觉风险，记录必要掩蔽阈值。" },
  { label: "数据质量", max: 15, hint: "阈值误差、漏测、无反应和可靠性处理。" },
  { label: "报告解释", max: 15, hint: "程度、性质、构型、PTA 和可靠性说明。" }
];

export function GuidedCoach({ mode, guide, warnings = [], score, onAction }: GuidedCoachProps) {
  if (mode === "exam") {
    const rows = score?.sections ?? examRubric.map((item) => ({ ...item, score: null, findings: [item.hint] }));

    return (
      <section className="panel teaching-panel exam-panel" aria-label="考核计分点">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Exam</p>
            <h2>考核计分点</h2>
          </div>
          <Award size={18} />
        </div>
        <div className="exam-box">
          <strong>{score ? `已提交：${score.total}/${score.max} 分` : "考核中不显示步骤答案"}</strong>
          <p>系统会记录每次给声、响应、阈值和报告。提交报告后显示分项得分与复盘。</p>
        </div>
        <div className="score-point-list">
          {rows.map((item) => (
            <div key={item.label} className="score-point">
              <div>
                <strong>{item.label}</strong>
                <span>{item.score === null ? `${item.max} 分` : `${item.score}/${item.max}`}</span>
              </div>
              {item.score !== null && <meter min={0} max={item.max} value={item.score} />}
              <p>{item.findings[0]}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (mode === "practice") {
    return (
      <section className="panel teaching-panel practice-panel" aria-label="自由练习">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Practice</p>
            <h2>自由练习</h2>
          </div>
          <BookOpen size={18} />
        </div>
        <div className="exam-box practice-box">
          <strong>不显示逐步引导</strong>
          <p>你可以按自己的流程完成测前准备、给声、记录阈值和报告。提交后仍会生成练习评分与教学反馈。</p>
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
            <span>练习进度</span>
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

  return (
    <section className="panel teaching-panel guide-panel" aria-label="教学引导">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Coach</p>
          <h2>教学引导</h2>
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
        <div className="step-pointer">
          <MousePointerClick size={17} />
          <span>下一步点这里</span>
        </div>
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
              <MousePointerClick size={13} />
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
          <span>这类病例的推荐顺序</span>
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
  if (mode !== "teaching") {
    return null;
  }

  return (
    <div className="mobile-guide-bar" aria-label="手机教学引导">
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
