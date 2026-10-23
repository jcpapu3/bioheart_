import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

const native = Capacitor.isNativePlatform();

/** Quita markdown/símbolos para que la voz suene natural. */
const clean = (t: string) => t.replace(/[*_#`>~]/g, '').replace(/\s+/g, ' ').trim();

/** Habla en voz alta. Devuelve true si se pudo reproducir; false si el celular no tiene voz disponible. */
export async function speak(text: string): Promise<boolean> {
  const t = clean(text);
  if (!t) return true;
  if (native) {
    for (const lang of ['es-MX', 'es-ES', 'es-US', 'es']) {
      try {
        await TextToSpeech.stop();
        await TextToSpeech.speak({ text: t, lang, rate: 1.0, pitch: 1.0, volume: 1.0, category: 'playback' });
        return true;
      } catch {
        /* prueba con otro idioma */
      }
    }
  }
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'es-MX';
      window.speechSynthesis.speak(u);
      return true;
    }
  } catch {
    /* sin voz disponible */
  }
  return false;
}

export const VOICE_HELP =
  'No se pudo reproducir la voz. En Ajustes de Android busca "Salida de texto a voz" y elige "Servicios de voz de Google" con idioma Español; sube también el volumen multimedia.';

export async function stopSpeaking(): Promise<void> {
  try {
    if (native) await TextToSpeech.stop();
    else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch {
    /* nada */
  }
}

export async function micAvailable(): Promise<boolean> {
  if (!native) return false;
  try {
    return (await SpeechRecognition.available()).available;
  } catch {
    return false;
  }
}

/** Abre el reconocimiento de voz de Android y devuelve lo que dijo la persona. */
export async function listen(): Promise<string> {
  const perm = await SpeechRecognition.requestPermissions();
  if (perm.speechRecognition !== 'granted') throw new Error('Sin permiso de micrófono.');
  const r = await SpeechRecognition.start({
    language: 'es-MX',
    maxResults: 1,
    prompt: 'Habla ahora',
    partialResults: false,
    popup: true,
  });
  return r.matches?.[0] ?? '';
}
