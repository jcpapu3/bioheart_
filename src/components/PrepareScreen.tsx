import { useState } from 'react';
import { Button, Card } from './ui';

const electrodes = [
  { tag: 'RA', color: 'bg-red-500', title: 'Pecho derecho', text: 'Parte alta, lado derecho (debajo de la clavícula).' },
  { tag: 'LA', color: 'bg-blue-500', title: 'Pecho izquierdo', text: 'Parte alta, lado izquierdo (debajo de la clavícula).' },
  { tag: 'RL', color: 'bg-green-500', title: 'Referencia', text: 'Costillas inferiores, lado derecho.' },
];

export function PrepareScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [ready, setReady] = useState(false);

  return (
    <div className="space-y-4">
      <Card title="Paso 2 — Prepara la medición">
        <div className="relative mx-auto mb-5 h-56 w-44">
          <svg viewBox="0 0 160 200" className="h-full w-full" fill="none" stroke="#cbd5e1" strokeWidth="3">
            <circle cx="80" cy="28" r="20" />
            <path d="M40 70 Q80 55 120 70 L130 160 Q80 180 30 160 Z" />
          </svg>
          <span className="absolute left-[24%] top-[36%] flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow">RA</span>
          <span className="absolute right-[24%] top-[36%] flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white shadow">LA</span>
          <span className="absolute left-[30%] top-[68%] flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white shadow">RL</span>
        </div>

        <div className="space-y-2">
          {electrodes.map((e) => (
            <div key={e.tag} className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
              <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold text-white ${e.color}`}>{e.tag}</span>
              <div>
                <p className="font-semibold text-gray-900">{e.title}</p>
                <p className="text-sm text-gray-600">{e.text}</p>
              </div>
            </div>
          ))}
        </div>

        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-600">
          <li>Limpia y seca la piel antes de pegar los electrodos.</li>
          <li>Siéntate, relájate y no hables durante la medición.</li>
        </ul>

        <label className="mt-4 flex items-center gap-3 text-sm font-medium text-gray-800">
          <input type="checkbox" checked={ready} onChange={(e) => setReady(e.target.checked)} className="h-5 w-5" />
          Ya me coloqué los electrodos
        </label>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>← Atrás</Button>
        <Button variant="primary" className="flex-1" disabled={!ready} onClick={onNext}>CONTINUAR →</Button>
      </div>
    </div>
  );
}
