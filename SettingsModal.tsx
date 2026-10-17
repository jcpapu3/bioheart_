import { useState } from 'react';
import { Button, Card } from './ui';
import { MODELS } from '../config';
import type { Settings } from '../types';

export function SettingsModal({
  settings,
  onSave,
  onClose,
}: {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}) {
  const [s, setS] = useState(settings);
  const [show, setShow] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card title="Ajustes">
          <div className="space-y-4 text-sm">
            <div>
              <label className="mb-1 block font-medium text-gray-700">API key de Google Gemini (gratis)</label>
              <div className="flex gap-2">
                <input
                  type={show ? 'text' : 'password'}
                  value={s.apiKey}
                  onChange={(e) => setS({ ...s, apiKey: e.target.value.trim() })}
                  placeholder="AIza..."
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2"
                />
                <button className="rounded-lg bg-gray-100 px-3" onClick={() => setShow(!show)}>{show ? '🙈' : '👁'}</button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Se crea gratis en aistudio.google.com/apikey. Se guarda solo en este celular, no dentro de la app.
              </p>
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-700">Modelo</label>
              <select value={s.model} onChange={(e) => setS({ ...s, model: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 font-medium text-gray-700">
              <input type="checkbox" checked={s.voice} onChange={(e) => setS({ ...s, voice: e.target.checked })} className="h-5 w-5" />
              El asistente habla en voz alta
            </label>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={() => onSave(s)}>Guardar</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
