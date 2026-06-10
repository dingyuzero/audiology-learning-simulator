import { Clock3, Waves } from "lucide-react";
import type { TestEvent } from "../domain/types";
import { earLabel, routeLabel } from "../domain/labels";

const noteLabels: Record<string, string> = {
  "cross-hearing-risk": "交叉听觉",
  "masking-active": "掩蔽",
  "bone-unmasked-non-specific": "骨导非耳特异",
  "overmasking-risk": "过掩蔽风险",
  "near-threshold": "近阈",
  "tinnitus-interference": "耳鸣干扰",
  fatigue: "疲劳",
  "loudness-discomfort": "不适"
};

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function EventLog({ events }: { events: TestEvent[] }) {
  const latest = events.slice(-12).reverse();

  return (
    <section className="panel event-panel" aria-label="过程日志">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>过程回放</h2>
        </div>
        <div className="status-pill">
          <Clock3 size={15} />
          {events.length} 次给声
        </div>
      </div>
      {latest.length === 0 ? (
        <div className="empty-state">暂无给声事件</div>
      ) : (
        <div className="event-list">
          {latest.map((event) => (
            <div key={event.id} className={event.response.responded ? "event-item responded" : "event-item"}>
              <div className="event-main">
                <Waves size={16} />
                <strong>
                  {earLabel[event.settings.ear]} {routeLabel[event.settings.route]} {event.settings.frequencyHz} Hz · {event.settings.levelDbHl} dB
                </strong>
              </div>
              <div className="event-meta">
                <span>{formatElapsed(event.elapsedSeconds)}</span>
                <span>{event.response.responded ? `响应 ${event.response.latencyMs} ms` : "未响应"}</span>
                {event.settings.maskingEnabled && <span>噪声 {event.settings.maskingLevelDb} dB</span>}
              </div>
              {event.response.notes.length > 0 && (
                <div className="note-tags">
                  {event.response.notes.slice(0, 4).map((note) => (
                    <span key={note}>{noteLabels[note] ?? note}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

