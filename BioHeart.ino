/*
  Bio-Heart - Arduino Uno + AD8232 + MAX30102 + HC-05 + buzzer
  Envia por Bluetooth una linea cada 20 ms (50 Hz):  ecg,bpm,spo2\n

  Conexiones:
  AD8232:   OUTPUT -> A0 | LO+ -> D2 | LO- -> D3 | 3.3V -> 3.3V | GND -> GND
  MAX30102: VIN -> 3.3V (o 5V segun modulo) | SDA -> A4 | SCL -> A5 | GND -> GND
  HC-05:    TX -> D10 | RX -> D11 (con divisor de voltaje 1k/2k) | VCC -> 5V | GND -> GND
  Buzzer:   + -> D8 | - -> GND

  Librerias (Administrar bibliotecas): "SparkFun MAX3010x Pulse and Proximity Sensor Library"
*/

#include <Wire.h>
#include <SoftwareSerial.h>
#include "MAX30105.h"
#include "heartRate.h"

SoftwareSerial bt(10, 11);  // RX, TX
MAX30105 sensor;

const int PIN_ECG = A0;
const int PIN_LO_P = 2;
const int PIN_LO_N = 3;
const int PIN_BUZZER = 8;

// --- BPM ---
long lastBeat = 0;
float bpm = 0;
int bpmAvg = 0;
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;

// --- SpO2 (estimacion simple, no calibrada) ---
float dcRed = 0, dcIr = 0;
float acRed = 0, acIr = 0;
int spo2 = 0;

unsigned long lastSend = 0;
bool dedoPuesto = false;

void setup() {
  Serial.begin(115200);
  bt.begin(9600);  // velocidad por defecto del HC-05
  pinMode(PIN_LO_P, INPUT);
  pinMode(PIN_LO_N, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  if (!sensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 no encontrado");
    while (1);
  }
  sensor.setup(60, 4, 2, 100, 411, 4096);  // brillo, promedio, modo rojo+IR, 100 sps
}

void loop() {
  // Leer MAX30102
  sensor.check();
  while (sensor.available()) {
    long ir = sensor.getFIFOIR();
    long red = sensor.getFIFORed();
    sensor.nextSample();

    dedoPuesto = ir > 50000;

    if (dedoPuesto) {
      // BPM
      if (checkForBeat(ir)) {
        long delta = millis() - lastBeat;
        lastBeat = millis();
        bpm = 60.0 / (delta / 1000.0);
        if (bpm > 20 && bpm < 255) {
          rates[rateSpot++] = (byte)bpm;
          rateSpot %= RATE_SIZE;
          int sum = 0;
          for (byte i = 0; i < RATE_SIZE; i++) sum += rates[i];
          bpmAvg = sum / RATE_SIZE;
          tone(PIN_BUZZER, 1000, 40);  // beep en cada latido
        }
      }
      // SpO2: ratio AC/DC de rojo e infrarrojo
      dcRed = 0.95 * dcRed + 0.05 * red;
      dcIr = 0.95 * dcIr + 0.05 * ir;
      acRed = 0.95 * acRed + 0.05 * abs(red - dcRed);
      acIr = 0.95 * acIr + 0.05 * abs(ir - dcIr);
      if (dcRed > 0 && dcIr > 0 && acIr > 0) {
        float R = (acRed / dcRed) / (acIr / dcIr);
        int s = (int)(110.0 - 25.0 * R);
        spo2 = constrain(s, 80, 100);
      }
    } else {
      bpmAvg = 0;
      spo2 = 0;
    }
  }

  // Enviar cada 20 ms (50 Hz)
  if (millis() - lastSend >= 20) {
    lastSend = millis();
    int ecg = 0;
    if (digitalRead(PIN_LO_P) == 1 || digitalRead(PIN_LO_N) == 1) {
      ecg = -1;  // electrodos desconectados
    } else {
      ecg = analogRead(PIN_ECG);
    }
    bt.print(ecg);
    bt.print(",");
    bt.print(bpmAvg);
    bt.print(",");
    bt.println(spo2);
  }
}
