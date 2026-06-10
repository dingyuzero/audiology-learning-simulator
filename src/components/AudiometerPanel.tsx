import {
  Activity,
  Bone,
  Check,
  Ear,
  Headphones,
  Save,
  Shield,
  Volume2,
  X
} from "lucide-react";
import {
  AIR_FREQUENCIES,
  BONE_FREQUENCIES,
  type AudiometerSettings,
  type Ear as EarSide,
  type PatientResponse,
  type Route,
  type Stimulus,
  type Transducer
} from "../domain/types";
import { earLabel, formatDb, routeLabel, stimulusLabel, transducerLabel } from "../domain/labels";

interface AudiometerPanelProps {
  settings: AudiometerSettings;
  lastResponse: PatientResponse | null;
  onSettingsChange: (settings: AudiometerSettings) => void;
  onGiveTone: () => void;
  onMarkThreshold: () => void;
  onMarkNoResponse: () => void;
}

function ButtonGroup<T extends string>({
  options,
  value,
  onChange
}: {
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          className={option.value === value ? "selected" : ""}
          disabled={option.disabled}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function AudiometerPanel({
  settings,
  lastResponse,
  onSettingsChange,
  onGiveTone,
  onMarkThreshold,
  onMarkNoResponse
}: AudiometerPanelProps) {
  const frequencies = settings.route === "bone" ? BONE_FREQUENCIES : AIR_FREQUENCIES;

  const update = (patch: Partial<AudiometerSettings>) => {
    onSettingsChange({ ...settings, ...patch });
  };

  const setRoute = (route: Route) => {
    const nextFrequency = route === "bone" && !BONE_FREQUENCIES.includes(settings.frequencyHz as never) ? 1000 : settings.frequencyHz;
    update({
      route,
      frequencyHz: nextFrequency,
      transducer: route === "bone" ? "bone" : settings.transducer === "bone" ? "supra" : settings.transducer
    });
  };

  return (
    <section className="panel device-panel" aria-label="模拟测听设备">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Audiometer</p>
          <h2>模拟听力计</h2>
        </div>
        <div className={lastResponse?.responded ? "status-pill response-on" : "status-pill"}>
          {lastResponse?.responded ? <Check size={15} /> : <X size={15} />}
          {lastResponse?.responded ? "有反应" : "未响应"}
        </div>
      </div>

      <div className="control-grid">
        <label className="control-block">
          <span><Ear size={15} />测试耳</span>
          <ButtonGroup<EarSide>
            value={settings.ear}
            onChange={(ear) => update({ ear })}
            options={[
              { value: "right", label: earLabel.right },
              { value: "left", label: earLabel.left }
            ]}
          />
        </label>

        <label className="control-block">
          <span><Activity size={15} />通路</span>
          <ButtonGroup<Route>
            value={settings.route}
            onChange={setRoute}
            options={[
              { value: "air", label: routeLabel.air },
              { value: "bone", label: routeLabel.bone }
            ]}
          />
        </label>

        <label className="control-block wide">
          <span><Headphones size={15} />换能器</span>
          <ButtonGroup<Transducer>
            value={settings.transducer}
            onChange={(transducer) => update({ transducer, route: transducer === "bone" ? "bone" : settings.route })}
            options={[
              { value: "supra", label: transducerLabel.supra, disabled: settings.route === "bone" },
              { value: "insert", label: transducerLabel.insert, disabled: settings.route === "bone" },
              { value: "bone", label: transducerLabel.bone }
            ]}
          />
        </label>
      </div>

      <div className="frequency-bank" aria-label="频率">
        {frequencies.map((frequency) => (
          <button
            key={frequency}
            type="button"
            className={settings.frequencyHz === frequency ? "frequency selected" : "frequency"}
            onClick={() => update({ frequencyHz: frequency })}
          >
            {frequency >= 1000 ? `${frequency / 1000}k` : frequency}
          </button>
        ))}
      </div>

      <div className="slider-block">
        <div className="slider-header">
          <span><Volume2 size={15} />给声强度</span>
          <strong>{formatDb(settings.levelDbHl)}</strong>
        </div>
        <input
          min={-10}
          max={120}
          step={5}
          type="range"
          value={settings.levelDbHl}
          onChange={(event) => update({ levelDbHl: Number(event.target.value) })}
        />
        <div className="step-row">
          <button type="button" onClick={() => update({ levelDbHl: Math.max(-10, settings.levelDbHl - 10) })}>-10</button>
          <button type="button" onClick={() => update({ levelDbHl: Math.max(-10, settings.levelDbHl - 5) })}>-5</button>
          <button type="button" onClick={() => update({ levelDbHl: Math.min(120, settings.levelDbHl + 5) })}>+5</button>
          <button type="button" onClick={() => update({ levelDbHl: Math.min(120, settings.levelDbHl + 10) })}>+10</button>
        </div>
      </div>

      <div className="control-grid compact">
        <label className="control-block wide">
          <span><Volume2 size={15} />刺激</span>
          <ButtonGroup<Stimulus>
            value={settings.stimulus}
            onChange={(stimulus) => update({ stimulus })}
            options={[
              { value: "pulsed", label: stimulusLabel.pulsed },
              { value: "steady", label: stimulusLabel.steady },
              { value: "warble", label: stimulusLabel.warble }
            ]}
          />
        </label>
      </div>

      <div className="masking-strip">
        <label className="toggle-line">
          <input
            type="checkbox"
            checked={settings.maskingEnabled}
            onChange={(event) => update({ maskingEnabled: event.target.checked })}
          />
          <span><Shield size={15} />窄带噪声掩蔽</span>
        </label>
        <div className={settings.maskingEnabled ? "slider-block nested enabled" : "slider-block nested"}>
          <div className="slider-header">
            <span>噪声级</span>
            <strong>{settings.maskingLevelDb} dB EM</strong>
          </div>
          <input
            disabled={!settings.maskingEnabled}
            min={0}
            max={100}
            step={5}
            type="range"
            value={settings.maskingLevelDb}
            onChange={(event) => update({ maskingLevelDb: Number(event.target.value) })}
          />
        </div>
      </div>

      <div className="action-row">
        <button className="primary-action" type="button" onClick={onGiveTone} title="给声">
          <Volume2 size={18} />
          给声
        </button>
        <button type="button" onClick={onMarkThreshold} title="记录阈值">
          <Save size={17} />
          记录阈值
        </button>
        <button type="button" onClick={onMarkNoResponse} title="标记无反应">
          <Bone size={17} />
          无反应
        </button>
      </div>

      {lastResponse && (
        <div className="response-readout">
          <div>
            <span>响应概率</span>
            <strong>{Math.round(lastResponse.probability * 100)}%</strong>
          </div>
          <div>
            <span>潜伏期</span>
            <strong>{lastResponse.latencyMs ? `${lastResponse.latencyMs} ms` : "-"}</strong>
          </div>
          <div>
            <span>模拟有效阈值</span>
            <strong>{lastResponse.effectiveThreshold} dB</strong>
          </div>
        </div>
      )}
    </section>
  );
}

