import { Button, Card, EcgChart } from './ui';
import { Chat } from './Chat';
import { DISCLAIMER } from '../config';
import type { Level, Measurement, Settings } from '../types';

const levelStyle: Record<Level, { box: string; emoji: string; label: string }> = {
  stable: { box: 'bg-green-100 text-green-700', emoji: '🟢', label: 'ESTABLE' },
  review: { box: 'bg-yellow-100 text-yellow-700', emoji: '🟡', label: 'REVISAR' },
  attention: { box: 'bg-red-100 text-red-700', emoji: '🔴', label: 'ATENCIÓN' },
};

const qualityText = { good: '🟢 Buena', moderate: '🟡 Moderada', poor: '🔴 Insuficiente' };

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="my-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
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
      <p className="rounded-lg border-l-4 border-red-500 bg-red-50 p-3 text-xs font-medium text-red-800">⚠️ {DISCLAIMER}</p>

      <div className="text-center">
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold ${lv.box}`}>
          <span className="text-xl">{lv.emoji}</span> NIVEL {lv.label}
        </span>
        <h2 className="mt-3 text-lg font-bold text-gray-900">{m.headline}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Frecuencia cardíaca" value={m.bpm > 0 ? `${m.bpm} BPM` : '--'} />
        <Stat label="Variabilidad (SDNN)" value={m.sdnn > 0 ? `${m.sdnn} ms` : '--'} />
        <Stat label="Calidad de señal" value={qualityText[m.quality]} sub={`${Math.round(m.qualityScore * 100)} / 100`} />
        <Stat label="Latidos detectados" value={String(m.beats)} sub={`en ${m.durationSec} s`} />
      </div>

      {m.notes.length > 0 && (
        <Card title="Observaciones">
          <ul className="space-y-2 text-sm text-gray-700">
            {m.notes.map((n, i) => (
              <li key={i} className="flex gap-2"><span>•</span><span>{n}</span></li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Señal ECG (últimos 6 s)">
        <EcgChart data={m.waveform} height={140} />
        {m.sdnn > 0 && (
          <p className="mt-2 text-xs text-gray-500">Variabilidad: SDNN {m.sdnn} ms · RMSSD {m.rmssd} ms</p>
        )}
      </Card>

      <Card title="Consejos">
        <ul className="space-y-2 text-sm text-gray-700">
          {m.advice.map((a, i) => (
            <li key={i} className="flex gap-2"><span className="text-blue-600">✓</span><span>{a}</span></li>
          ))}
        </ul>
      </Card>

      <Chat m={m} settings={settings} onVoiceToggle={onVoiceToggle} onOpenSettings={onOpenSettings} />

      <Button variant="primary" className="w-full" onClick={onNew}>NUEVA MEDICIÓN</Button>
    </div>
  );
}
