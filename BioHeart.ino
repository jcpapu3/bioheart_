/*
  Bio-Heart (solo ECG) - Arduino Uno + AD8232 + HC-05
  Envia por Bluetooth una linea por muestra, 100 veces por segundo:  valor_ecg
  Si los electrodos estan sueltos envia -1.

  Conexiones:
  AD8232:  OUTPUT -> A0 | LO+ -> D2 | LO- -> D3 | 3.3V -> 3.3V | GND -> GND
  HC-05:   TX -> D10 | RX -> D11 (con divisor de voltaje 1k/2k) | VCC -> 5V | GND -> GND

  No necesita librerias extra. Para ver la senal en el PC: Herramientas > Serial Plotter (115200).
*/

#include <SoftwareSerial.h>

SoftwareSerial bt(10, 11);  // RX, TX

const int PIN_ECG = A0;
const int PIN_LO_P = 2;
const int PIN_LO_N = 3;

unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  bt.begin(9600);  // velocidad por defecto del HC-05
  pinMode(PIN_LO_P, INPUT);
  pinMode(PIN_LO_N, INPUT);
}

void loop() {
  unsigned long now = millis();
  if (now - lastSend >= 10) {  // 100 Hz
    lastSend = now;
    int ecg;
    if (digitalRead(PIN_LO_P) == 1 || digitalRead(PIN_LO_N) == 1) {
      ecg = -1;  // electrodos desconectados
    } else {
      ecg = analogRead(PIN_ECG);
    }
    bt.println(ecg);
    Serial.println(ecg);
  }
}
