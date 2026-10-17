import { useEffect, useRef, useState } from 'react';
import { Button, Card } from './ui';
import { askAI, buildSystemPrompt } from '../services/aiService';
import { listen, micAvailable, speak, stopSpeaking } from '../services/voice';
import type { ChatMsg, Measurement, Settings } from '../types';

const HELLO: ChatMsg = { role: 'user', content: 'Hola, acabo de terminar mi medición.' };

export function Chat({
  m,
  settings,
  onVoiceToggle,
  onOpenSettings,
}: {
  m: Measurement;
  settings: Settings;
  onVoiceToggle: () => void;
  onOpenSettings: () => void;
}) {
  // history[0] es el saludo oculto que dispara la primera respuesta de la IA
  const [history, setHistory] = useState<ChatMsg[]>([HELLO]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mic, setMic] = useState(false);
  const [summary, setSummary] = useState('');
  const started = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);
  const voiceRef = useRef(settings.voice);
  voiceRef.current = settings.voice;

  const system = buildSystemPrompt(m);

  const ask = async (msgs: ChatMsg[]) => {
    setBusy(true);
    setError('');
    try {
      const reply = await askAI(settings.apiKey, settings.model, system, msgs);
      setHistory([...msgs, { role: 'assistant', content: reply }]);
      if (voiceRef.current) void speak(reply);
    } catch (e: any) {
      setError(e?.message || 'No se pudo contactar a la IA. ¿Hay internet?');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    micAvailable().then(setMic);
    if (settings.apiKey && !started.current) {
      started.current = true;
      void ask([HELLO]);
    }
    return () => void stopSpeaking();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, busy]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput('');
    void stopSpeaking();
    void ask([...history, { role: 'user', content: t }]);
  };

  const dictate = async () => {
    try {
      const t = await listen();
      if (t) send(t);
    } catch (e: any) {
      setError(e?.message || 'No se pudo usar el micrófono.');
    }
  };

  const makeSummary = async () => {
    setBusy(true);
    setError('');
    try {
      const ask2: ChatMsg[] = [
        ...history,
        {
          role: 'user',
          content:
            'Genera un resumen breve (máximo 6 líneas, texto plano) con los datos de la medición y lo que te conté sobre mí, para mostrárselo a un profesional de la salud. Termina recordando que es un prototipo educativo.',
        },
      ];
      setSummary(await askAI(settings.apiKey, settings.model, system, ask2));
    } catch (e: any) {
      setError(e?.message || 'No se pudo generar el resumen.');
    } finally {
      setBusy(false);
    }
  };

  if (!settings.apiKey) {
    return (
      <Card title="Asistente de IA">
        <p className="mb-3 text-sm text-gray-600">
          Para hablar con el asistente agrega tu API key gratis de Google Gemini en Ajustes. La clave se guarda solo en este celular.
        </p>
        <Button className="w-full" onClick={onOpenSettings}>⚙ Abrir ajustes</Button>
      </Card>
    );
  }

  const shown = history.slice(1);

  return (
    <Card title="Asistente de IA">
      <div className="mb-3 flex justify-end">
        <button onClick={onVoiceToggle} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
          {settings.voice ? '🔊 Voz activada' : '🔇 Voz apagada'}
        </button>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto">
        {shown.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {busy && <div className="w-fit rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-500">Escribiendo...</div>}
        <div ref={bottom} />
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          {shown.length === 0 && (
            <button className="ml-2 underline" onClick={() => ask([HELLO])}>Reintentar</button>
          )}
        </div>
      )}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        {mic && (
          <button type="button" onClick={dictate} disabled={busy} className="rounded-lg bg-gray-200 px-3 text-xl disabled:opacity-50" aria-label="Hablar">
            🎤
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu respuesta..."
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={busy || !input.trim()}>Enviar</Button>
      </form>

      {shown.length >= 4 && (
        <div className="mt-3">
          <Button variant="secondary" className="w-full" disabled={busy} onClick={makeSummary}>
            📝 Generar resumen para el médico
          </Button>
        </div>
      )}
      {summary && (
        <div className="mt-3 whitespace-pre-wrap rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-gray-800">{summary}</div>
      )}
    </Card>
  );
}
