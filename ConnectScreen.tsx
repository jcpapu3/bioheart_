import { useState } from 'react';
import { Button, Card } from './ui';
import { bluetooth, isNative } from '../services/dataSource';
import { load, save } from '../services/storage';
import type { Connection, Device } from '../types';

export function ConnectScreen({ onConnected }: { onConnected: (c: Connection) => void }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const last = load<Device | null>('bh_last_device', null);

  const scan = async () => {
    setError('');
    setScanning(true);
    try {
      const list = await bluetooth.scan();
      list.sort((a, b) => Number(/hc-0/i.test(b.name)) - Number(/hc-0/i.test(a.name)));
      setDevices(list);
      if (!list.length) setError('No se encontró nada. Verifica que el Arduino esté encendido y el HC-05 parpadee.');
    } catch (e: any) {
      setError(e?.message || 'No se pudo buscar. Activa el Bluetooth y acepta los permisos.');
    } finally {
      setScanning(false);
    }
  };

  const connect = async (d: Device) => {
    setError('');
    setBusy(`Conectando con ${d.name}...`);
    try {
      await bluetooth.connect(d.address);
      setBusy('Verificando que lleguen datos...');
      const ok = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 7000);
        bluetooth
          .startStream(() => {
            clearTimeout(timer);
            resolve(true);
          })
          .catch(() => resolve(false));
      });
      await bluetooth.stopStream();
      if (!ok) {
        await bluetooth.disconnect();
        throw new Error('Conectó, pero no llegan datos. Revisa que el Arduino tenga el programa cargado y el HC-05 a 9600 baudios.');
      }
      save('bh_last_device', d);
      setBusy('');
      onConnected({ mode: 'bt', device: d });
    } catch (e: any) {
      setBusy('');
      setError(
        e?.message?.includes('Conectó')
          ? e.message
          : `No se pudo conectar con ${d.name}. Empareja primero el HC-05 en Ajustes > Bluetooth (clave 1234).`,
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Paso 1 — Conectar el dispositivo">
        <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>Enciende el Arduino (el HC-05 debe parpadear).</li>
          <li>En Ajustes de Android &gt; Bluetooth, empareja <b>HC-05</b> (clave <b>1234</b> o 0000).</li>
          <li>Vuelve aquí y pulsa <b>Buscar</b>.</li>
        </ol>

        {!isNative && (
          <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            El Bluetooth solo funciona en la app instalada en el celular. Aquí puedes probar el modo demostración.
          </p>
        )}

        {isNative && (
          <div className="space-y-3">
            {last && (
              <Button variant="primary" className="w-full" disabled={!!busy} onClick={() => connect(last)}>
                Reconectar con {last.name}
              </Button>
            )}
            <Button className="w-full" disabled={scanning || !!busy} onClick={scan}>
              {scanning ? 'Buscando (5 s)...' : 'BUSCAR DISPOSITIVOS'}
            </Button>

            {devices.map((d) => (
              <button
                key={d.address}
                disabled={!!busy}
                onClick={() => connect(d)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left active:bg-blue-50"
              >
                <span>
                  <span className="block font-semibold text-gray-900">{d.name}</span>
                  <span className="block text-xs text-gray-500">{d.address}</span>
                </span>
                <span className="text-blue-600">Conectar →</span>
              </button>
            ))}

            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer">¿No aparece? Escribir dirección manual</summary>
              <div className="mt-2 flex gap-2">
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value.toUpperCase())}
                  placeholder="00:11:22:33:44:55"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2"
                />
                <Button
                  variant="secondary"
                  disabled={!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(manual) || !!busy}
                  onClick={() => connect({ name: 'HC-05', address: manual })}
                >
                  Conectar
                </Button>
              </div>
            </details>
          </div>
        )}

        {busy && <p className="mt-4 text-center text-sm font-medium text-blue-700">⏳ {busy}</p>}
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </Card>

      <Button variant="secondary" className="w-full" onClick={() => onConnected({ mode: 'demo' })}>
        Probar sin Arduino (modo demostración)
      </Button>
    </div>
  );
}
