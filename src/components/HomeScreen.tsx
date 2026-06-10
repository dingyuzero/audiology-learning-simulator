import { BookOpen, ClipboardList, MousePointerClick, Play, ShieldCheck } from "lucide-react";
import type { AudiologyCase, Mode } from "../domain/types";

interface HomeScreenProps {
  cases: AudiologyCase[];
  selectedCaseId: string;
  onCaseChange: (caseId: string) => void;
  onStart: (mode: Mode) => void;
}

const modes: Array<{
  mode: Mode;
  title: string;
  eyebrow: string;
  description: string;
  points: string[];
  icon: typeof BookOpen;
}> = [
  {
    mode: "teaching",
    title: "教学模式",
    eyebrow: "一步一步跟练",
    description: "用手指提示和点击路径带学生完成测前准备、给声、阈值记录和报告提交。",
    points: ["显示下一步", "可一键执行推荐操作", "适合第一次上手"],
    icon: MousePointerClick
  },
  {
    mode: "practice",
    title: "自由练习",
    eyebrow: "自己完整操作",
    description: "隐藏步骤引导，保留病例、设备、听力图、过程回放和提交后的练习反馈。",
    points: ["不显示点击路径", "可反复换病例", "适合课后巩固"],
    icon: BookOpen
  },
  {
    mode: "exam",
    title: "考核模式",
    eyebrow: "按评分点完成",
    description: "固定同病例随机种子，不给步骤提示；提交后按流程、数据和报告解释计分。",
    points: ["显示评分维度", "隐藏教学提示", "提交后查看分数"],
    icon: ShieldCheck
  }
];

export function HomeScreen({ cases, selectedCaseId, onCaseChange, onStart }: HomeScreenProps) {
  const selectedCase = cases.find((item) => item.id === selectedCaseId) ?? cases[0];

  return (
    <div className="home-screen">
      <main className="home-main" aria-label="模式首页">
        <section className="home-intro">
          <div className="home-mark">
            <ClipboardList size={26} />
          </div>
          <div>
            <p className="eyebrow">Audiology Training</p>
            <h1>测听学习模拟工具</h1>
            <p>选择病例和训练方式后，直接进入模拟测听室。</p>
          </div>
        </section>

        <section className="home-case-panel" aria-label="病例选择">
          <label className="case-picker">
            <span>本次病例</span>
            <select value={selectedCaseId} onChange={(event) => onCaseChange(event.target.value)}>
              {cases.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} · {item.title}
                </option>
              ))}
            </select>
          </label>
          <div className="home-case-summary">
            <strong>{selectedCase.title}</strong>
            <span>{selectedCase.visibleProfile.age} 岁 · {selectedCase.visibleProfile.sex} · {selectedCase.difficulty}</span>
          </div>
        </section>

        <section className="home-mode-grid" aria-label="选择模式">
          {modes.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.mode} type="button" className={`home-mode-card ${item.mode}`} onClick={() => onStart(item.mode)}>
                <span className="home-mode-icon">
                  <Icon size={24} />
                </span>
                <span className="home-mode-copy">
                  <span>{item.eyebrow}</span>
                  <strong>{item.title}</strong>
                  <em>{item.description}</em>
                </span>
                <span className="home-mode-points">
                  {item.points.map((point) => (
                    <span key={point}>{point}</span>
                  ))}
                </span>
                <span className="home-start">
                  <Play size={17} />
                  开始
                </span>
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
}
