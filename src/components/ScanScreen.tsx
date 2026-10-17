import { useEffect, useRef, useState } from 'react';
import { Button, Card, EcgChart } from './ui';
import { SCAN_SECONDS } from '../config';
import { bluetooth, demo } from '../services/dataSource';
import { analyzeEcg } from '../services/ecgProcessor';
import { buildMeasurement } from '../services/interpreter';
import type { Connection, Measurement, Packet } from '../types';

export function ScanScreen({
  conn,
  onDone,
  onCancel,
}: {
  conn: Connection;
  onDone: (m: Measurement) => void;
  onCancel: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [view, setView] = useState<number[]>([]);
  const [live, setLive] = useState({ bpm: 0, leadsOff: false });

  const packets = useRef<Packet[]>([]);
  const startedAt = useRef(0);
  const wake = useRef<any>(null);

  const stopSource = async () => {
    demo.stop();
    if (conn.mode === 'bt') await bluetooth.stopStream();
    try {
      await wake.current?.release();
    } catch {
      /* nada */
    }
  };

  useEffect(() => () => void stopSource(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setError('');
    packets.current = [];
    setElapsed(0);
    setView([]);
    try {
      wake.current = await (navigator as any).wakeLock?.request('screen');
    } catch {
      /* sin wake lock: no pasa nada */
    }
    const onPacket = (p: Packet) => packets.current.push(p);
    try {
      if (conn.mode === 'demo') demo.start(onPacket);
      else await bluetooth.startStream(onPacket);
    } catch (e: any) {
      setError(e?.message || 'No se pudo iniciar la lectura. ¿Sigue conectado el HC-05?');
      return;
    }
    startedAt.current = Date.now();
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(async () => {
      const secs = (Date.now() - startedAt.current) / 1000;
      const all = packets.current;
      const lastT = all.length ? all[all.length - 1].t : 0;
      let i = all.length;
      while (i > 0 && lastT - all[i - 1].t <= 3000) i--; // últimos 3 s para la gráfica
      const recent = all.slice(i);
      let j = all.length;
      while (j > 0 && lastT - all[j - 1].t <= 10000) j--; // últimos 10 s para el pulso en vivo
      const win = all.slice(j).filter((p) => p.ecg >= 0);
      const est = win.length > 300 ? analyzeEcg(win.map((p) => p.ecg), win.map((p) => p.t)).bpm : 0;
      setElapsed(Math.min(secs, SCAN_SECONDS));
      setView(recent.filter((p) => p.ecg >= 0).map((p) => p.ecg));
      setLive({
        bpm: est,
        leadsOff: recent.length > 20 && recent.slice(-25).every((p) => p.ecg === -1),
      });

      if (secs >= SCAN_SECONDS) {
        clearInterval(id);
        setRunning(false);
        await stopSource();
        const ecgPk = all.filter((p) => p.ecg >= 0);
        const leadsOffPct = all.length ? ((all.length - ecgPk.length) / all.length) * 100 : 100;
        const analysis = analyzeEcg(
          ecgPk.map((p) => p.ecg),
          ecgPk.map((p) => p.t),
          leadsOffPct / 100,
        );
        onDone(buildMeasurement(analysis, SCAN_SECONDS, leadsOffPct));
      }
    }, 200);
    return () => clearInterval(id);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = Math.max(0, Math.ceil(SCAN_SECONDS - elapsed));

  return (
    <div className="space-y-4">
      <Card title="Paso 3 — Escaneo">
        <div className="mb-4 text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-3xl ${running ? 'animate-pulse' : ''}`}>❤️</div>
          <p className="mt-3 text-4xl font-bold text-gray-900">
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${(elapsed / SCAN_SECONDS) * 100}%` }} />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {running ? 'Mantén el cuerpo quieto y no hables.' : 'Cuando estés listo, pulsa iniciar.'}
          </p>
        </div>

        <EcgChart data={view} />

        {running && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-xs font-medium text-blue-600">Pulso estimado</p>
              <p className="text-2xl font-bold text-gray-900">{live.bpm > 0 ? `${live.bpm} BPM` : '--'}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-xs font-medium text-blue-600">Electrodos</p>
              <p className="text-2xl font-bold text-gray-900">{live.leadsOff ? '⚠️ Sueltos' : '🟢 Bien'}</p>
            </div>
          </div>
        )}

        {running && live.leadsOff && (
          <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">⚠️ Electrodos desconectados. Revisa que estén bien pegados.</p>
        )}
        {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </Card>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={async () => {
            setRunning(false);
            await stopSource();
            onCancel();
          }}
        >
          {running ? 'CANCELAR' : '← Atrás'}
        </Button>
        {!running && (
          <Button variant="primary" className="flex-1" onClick={start}>
            INICIAR ESCANEO
          </Button>
        )}
      </div>
    </div>
  );
}
