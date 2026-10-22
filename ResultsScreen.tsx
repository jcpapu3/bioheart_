import { Button, Card, EcgChart } from './ui';
import { Chat } from './Chat';
import { DISCLAIMER } from '../config';
import type { Level, Measurement, Settings } from '../types';

const levelStyle: Record<Level, { box: string; emoji: string; label: string }> = {
  stable: { box: 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30', emoji: '🟢', label: 'ESTABLE' },
  review: { box: 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30', emoji: '🟡', label: 'REVISAR' },
  attention: { box: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30', emoji: '🔴', label: 'ATENCIÓN' },
};

const qualityText = { good: '🟢 Buena', moderate: '🟡 Moderada', poor: '🔴 Insuficiente' };

function Stat({ label, value, sub, icon, tone = 'text-ink' }: { label: string; value: string; sub?: string; icon: string; tone?: string }) {
  return (
    <div className="rounded-3xl border border-line bg-card p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted"><span>{icon}</span>{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function ResultsScreen({
  m,
  settings,
  onNew,
  onVoiceToggle,
  onOpenSettings,
}: {
  m: Measurement;
  settings: Settings;
  onNew: () => void;
  onVoiceToggle: () => void;
  onOpenSettings: () => void;
}) {
  const lv = levelStyle[m.level];
  return (
    <div className="space-y-4">
      <p className="rounded-lg border-l-4 border-red-500 bg-rose-500/10 p-3 text-xs font-medium text-rose-300">⚠️ {DISCLAIMER}</p>

      <div className="text-center">
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold ${lv.box}`}>
          <span className="text-xl">{lv.emoji}</span> NIVEL {lv.label}
        </span>
        <h2 className="mt-4 text-xl font-bold leading-snug text-ink">{m.headline}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon="❤️" tone="text-heart" label="Frecuencia cardíaca" value={m.bpm > 0 ? `${m.bpm}` : '--'} sub="latidos por minuto" />
        <Stat icon="〰️" tone="text-cyan-300" label="Variabilidad" value={m.sdnn > 0 ? `${m.sdnn} ms` : '--'} sub="SDNN" />
        <Stat icon="📶" label="Calidad de señal" value={qualityText[m.quality]} sub={`${Math.round(m.qualityScore * 100)} / 100`} />
        <Stat icon="💓" label="Latidos detectados" value={String(m.beats)} sub={`en ${m.durationSec} s`} />
      </div>

      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
          m.level === 'stable' ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-200'
        }`}
      >
        <span>⚠</span> {m.level === 'stable' ? 'Sin alertas' : m.level === 'review' ? 'Hay datos por revisar' : 'Atención: consulta a un profesional'}
      </div>

      {m.notes.length > 0 && (
        <Card title="Observaciones">
          <ul className="space-y-2 text-sm text-slate-300">
            {m.notes.map((n, i) => (
              <li key={i} className="flex gap-2"><span>•</span><span>{n}</span></li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Señal ECG (últimos 6 s)">
        <EcgChart data={m.waveform} height={140} />
        {m.sdnn > 0 && (
          <p className="mt-2 text-xs text-muted">Variabilidad: SDNN {m.sdnn} ms · RMSSD {m.rmssd} ms</p>
        )}
        {m.bpm > 0 && (
          <p className="mt-1 text-xs text-muted">
            Regularidad de intervalos: {m.regularity >= 0.85 ? 'Buena' : m.regularity >= 0.7 ? 'Moderada' : 'Baja'} ({Math.round(m.regularity * 100)}%)
          </p>
        )}
      </Card>

      <Card title="Consejos">
        <ul className="space-y-2 text-sm text-slate-300">
          {m.advice.map((a, i) => (
            <li key={i} className="flex gap-2"><span className="text-cyan-400">✓</span><span>{a}</span></li>
          ))}
        </ul>
      </Card>

      <Chat m={m} settings={settings} onVoiceToggle={onVoiceToggle} onOpenSettings={onOpenSettings} />

      <Button variant="primary" className="w-full" onClick={onNew}>NUEVA MEDICIÓN</Button>
    </div>
  );
}
