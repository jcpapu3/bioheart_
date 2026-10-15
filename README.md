# Bio-Heart (app Android)

App de 4 pasos (conexión → electrodos → escaneo → resultados) que se conecta por **Bluetooth clásico (HC-05)** al Arduino, con un **asistente de IA con voz**. Basada en la app de tu amigo (ECG BioChip).

## 1. Arduino
Carga `arduino/BioHeart.ino` (instala la librería *SparkFun MAX3010x*). El RX del HC-05 va con divisor de voltaje (1k + 2k).

## 2. Generar el APK (sin Android Studio)
1. Crea una cuenta en github.com y un repositorio nuevo (privado está bien).
2. Sube **todo el contenido de esta carpeta** (arrastra los archivos y carpetas a la página del repo, incluida la carpeta oculta `.github`).
   - Si `.github` no se subió: *Add file → Create new file*, nombre `.github/workflows/build-apk.yml` y pega el contenido de ese archivo.
3. Ve a la pestaña **Actions** → **Compilar APK** (corre solo al subir; si no, *Run workflow*).
4. Espera ~5-8 min. Entra a la ejecución terminada y baja **BioHeart-APK** (abajo, en *Artifacts*). Dentro está `app-debug.apk`.
5. Pásalo al celular e instálalo (permite "instalar apps de origen desconocido").

## 3. Usarla
1. En Android: Ajustes → Bluetooth → empareja **HC-05** (clave 1234 o 0000).
2. Abre Bio-Heart → ⚙ → pega tu **API key de Anthropic** (console.anthropic.com). Se guarda solo en el celular.
3. Paso 1: *Buscar dispositivos* → toca el HC-05. Sin Arduino puedes usar el *modo demostración*.
4. Al terminar el escaneo (60 s) aparece el resultado y el asistente te habla y te pregunta datos (edad, síntomas, café/ejercicio...). 🎤 para contestarle con la voz.

## Ajustes rápidos
- Duración del escaneo: `SCAN_SECONDS` en `src/config.ts`.
- Modelo de IA: ⚙ en la app (Haiku = rápido y barato).
- Probar el procesamiento del ECG sin hardware: `npm install && npm run test:ecg`.

⚠️ Prototipo educativo. No es un dispositivo médico.
