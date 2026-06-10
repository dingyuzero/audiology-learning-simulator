import { AlertTriangle, Table2 } from "lucide-react";
import { EARS, type Ear, type Route, type StudentThreshold } from "../domain/types";
import { earLabel, routeLabel } from "../domain/labels";
import { latestThresholds } from "../engine/audiology";

interface AudiogramProps {
  thresholds: StudentThreshold[];
}

const FREQUENCIES = [125, 250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const DB_LINES = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
const CHART = { width: 760, height: 460, left: 58, top: 28, right: 24, bottom: 48 };

function xFor(frequency: number) {
  const index = FREQUENCIES.indexOf(frequency);
  const plotWidth = CHART.width - CHART.left - CHART.right;
  return CHART.left + (index / (FREQUENCIES.length - 1)) * plotWidth;
}

function yFor(level: number) {
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  return CHART.top + ((level + 10) / 130) * plotHeight;
}

function colorFor(ear: Ear) {
  return ear === "right" ? "#c53d3d" : "#2563eb";
}

function pointsFor(thresholds: StudentThreshold[], ear: Ear, route: Route) {
  const map = latestThresholds(thresholds);
  return FREQUENCIES.map((frequencyHz) => map.get(`${ear}:${route}:${frequencyHz}`))
    .filter((item): item is StudentThreshold => Boolean(item))
    .sort((a, b) => a.frequencyHz - b.frequencyHz);
}

function Symbol({ threshold }: { threshold: StudentThreshold }) {
  const x = xFor(threshold.frequencyHz);
  const y = yFor(threshold.levelDbHl);
  const color = colorFor(threshold.ear);
  const masked = threshold.masked;
  const size = threshold.route === "air" ? 9 : 11;

  if (threshold.noResponse) {
    return (
      <g>
        <text x={x - 7} y={y + 5} fill={color} fontSize="18" fontWeight="700">
          {threshold.ear === "right" ? "O" : "X"}
        </text>
        <path d={`M ${x + 12} ${y - 4} v 18 m -5 -5 l 5 5 l 5 -5`} stroke={color} strokeWidth="2" fill="none" />
      </g>
    );
  }

  if (threshold.route === "bone") {
    return (
      <g>
        <text x={x - 7} y={y + 6} fill={color} fontSize="20" fontWeight="700">
          {threshold.ear === "right" ? "<" : ">"}
        </text>
        {masked && <circle cx={x + 13} cy={y - 11} r="4" fill={color} />}
      </g>
    );
  }

  if (threshold.ear === "right") {
    return (
      <g>
        <circle cx={x} cy={y} r={size} fill="white" stroke={color} strokeWidth="3" />
        {masked && <rect x={x - 4} y={y - 4} width="8" height="8" fill={color} />}
      </g>
    );
  }

  return (
    <g>
      <path d={`M ${x - size} ${y - size} L ${x + size} ${y + size} M ${x + size} ${y - size} L ${x - size} ${y + size}`} stroke={color} strokeWidth="3" />
      {masked && <rect x={x - 4} y={y - 4} width="8" height="8" fill={color} />}
    </g>
  );
}

export function Audiogram({ thresholds }: AudiogramProps) {
  const map = latestThresholds(thresholds);

  return (
    <section className="panel audiogram-panel" aria-label="听力图">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Audiogram</p>
          <h2>工作听力图</h2>
        </div>
        <div className="legend">
          <span className="red-dot">右</span>
          <span className="blue-dot">左</span>
        </div>
      </div>

      <div className="chart-shell">
        <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} role="img" aria-label="听力图">
          <rect x="0" y="0" width={CHART.width} height={CHART.height} rx="8" fill="#fbfcfd" />
          {DB_LINES.map((level) => {
            const y = yFor(level);
            return (
              <g key={level}>
                <line x1={CHART.left} x2={CHART.width - CHART.right} y1={y} y2={y} stroke={level === 25 ? "#abb7c4" : "#e1e7ee"} strokeWidth={level === 25 ? 1.8 : 1} />
                <text x={CHART.left - 14} y={y + 4} textAnchor="end" fontSize="12" fill="#536273">
                  {level}
                </text>
              </g>
            );
          })}
          {FREQUENCIES.map((frequency) => {
            const x = xFor(frequency);
            return (
              <g key={frequency}>
                <line x1={x} x2={x} y1={CHART.top} y2={CHART.height - CHART.bottom} stroke="#e1e7ee" />
                <text x={x} y={CHART.height - 20} textAnchor="middle" fontSize="12" fill="#536273">
                  {frequency >= 1000 ? `${frequency / 1000}k` : frequency}
                </text>
              </g>
            );
          })}
          <text x="18" y="24" fontSize="12" fill="#536273">dB HL</text>
          <text x={CHART.width - 82} y={CHART.height - 8} fontSize="12" fill="#536273">Hz</text>

          {EARS.flatMap((ear) =>
            (["air", "bone"] as Route[]).map((route) => {
              const points = pointsFor(thresholds, ear, route).filter((point) => !point.noResponse);
              if (points.length < 2 || route === "bone") {
                return null;
              }
              return (
                <polyline
                  key={`${ear}-${route}`}
                  fill="none"
                  stroke={colorFor(ear)}
                  strokeDasharray="none"
                  strokeWidth="2"
                  points={points.map((point) => `${xFor(point.frequencyHz)},${yFor(point.levelDbHl)}`).join(" ")}
                />
              );
            })
          )}

          {Array.from(map.values()).map((threshold) => (
            <Symbol key={threshold.id} threshold={threshold} />
          ))}
        </svg>
      </div>

      <div className="threshold-table">
        <div className="subhead">
          <Table2 size={16} />
          <span>阈值记录</span>
        </div>
        {thresholds.length === 0 ? (
          <div className="empty-state">暂无阈值记录</div>
        ) : (
          <div className="threshold-scroll">
            <table>
              <thead>
                <tr>
                  <th>耳别</th>
                  <th>通路</th>
                  <th>频率</th>
                  <th>阈值</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(map.values())
                  .sort((a, b) => a.ear.localeCompare(b.ear) || a.route.localeCompare(b.route) || a.frequencyHz - b.frequencyHz)
                  .map((threshold) => (
                    <tr key={threshold.id}>
                      <td>{earLabel[threshold.ear]}</td>
                      <td>{routeLabel[threshold.route]}</td>
                      <td>{threshold.frequencyHz} Hz</td>
                      <td>{threshold.noResponse ? `${threshold.levelDbHl} dB 无反应` : `${threshold.levelDbHl} dB`}</td>
                      <td>
                        {threshold.masked ? "掩蔽" : "未掩蔽"}
                        {threshold.noResponse && <AlertTriangle size={13} />}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
