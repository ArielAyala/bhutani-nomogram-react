// Umbrales de fototerapia y exanguinotransfusión (recambio sanguíneo) según las guías
// AAP 2022 (Clinical Practice Guideline, Pediatrics 2022;150(3):e2022058859).
//
// NOTA IMPORTANTE: Los valores tabulados abajo son una aproximación digitalizada de las
// curvas publicadas por la AAP, segmentadas por edad gestacional (35-37 y >=38 semanas)
// y presencia de factores de riesgo neurotóxico. Deben ser verificados contra la
// publicación original antes de cualquier uso clínico real.
//
// Para neonatos <35 semanas no se calculan umbrales aquí: se asume manejo bajo
// protocolos específicos de UCIN (retorna null).

import type { GestationalAge } from "./types";

interface ThresholdPoint {
  /** Horas de vida */
  hour: number;
  /** Umbral de bilirrubina en mg/dL */
  value: number;
}

export const AAP_HOUR_RANGE = { min: 12, max: 168 } as const;

// --- Umbrales de FOTOTERAPIA ---

const phototherapy38PlusNoRisk: ThresholdPoint[] = [
  { hour: 12, value: 8.0 },
  { hour: 24, value: 10.0 },
  { hour: 36, value: 12.0 },
  { hour: 48, value: 13.5 },
  { hour: 60, value: 15.0 },
  { hour: 72, value: 16.0 },
  { hour: 84, value: 17.0 },
  { hour: 96, value: 18.0 },
  { hour: 120, value: 19.0 },
  { hour: 144, value: 20.0 },
  { hour: 168, value: 21.0 },
];

const phototherapy38PlusRisk: ThresholdPoint[] = [
  { hour: 12, value: 6.0 },
  { hour: 24, value: 8.0 },
  { hour: 36, value: 9.5 },
  { hour: 48, value: 11.0 },
  { hour: 60, value: 12.5 },
  { hour: 72, value: 13.5 },
  { hour: 84, value: 14.5 },
  { hour: 96, value: 15.0 },
  { hour: 120, value: 16.0 },
  { hour: 144, value: 17.0 },
  { hour: 168, value: 18.0 },
];

const phototherapy35to37NoRisk: ThresholdPoint[] = [
  { hour: 12, value: 6.5 },
  { hour: 24, value: 8.5 },
  { hour: 36, value: 10.0 },
  { hour: 48, value: 11.5 },
  { hour: 60, value: 13.0 },
  { hour: 72, value: 14.0 },
  { hour: 84, value: 15.0 },
  { hour: 96, value: 15.5 },
  { hour: 120, value: 16.5 },
  { hour: 144, value: 17.5 },
  { hour: 168, value: 18.5 },
];

const phototherapy35to37Risk: ThresholdPoint[] = [
  { hour: 12, value: 5.0 },
  { hour: 24, value: 6.5 },
  { hour: 36, value: 8.0 },
  { hour: 48, value: 9.5 },
  { hour: 60, value: 11.0 },
  { hour: 72, value: 12.0 },
  { hour: 84, value: 13.0 },
  { hour: 96, value: 13.5 },
  { hour: 120, value: 14.5 },
  { hour: 144, value: 15.5 },
  { hour: 168, value: 16.5 },
];

// --- Umbrales de EXANGUINOTRANSFUSIÓN (recambio sanguíneo) ---
// Aproximados como el umbral de fototerapia correspondiente + margen (mayor si no hay
// factores de riesgo, menor si los hay, ya que el manejo se escala antes).

const exchange38PlusNoRisk: ThresholdPoint[] = phototherapy38PlusNoRisk.map(
  (p) => ({ hour: p.hour, value: p.value + 5 }),
);

const exchange38PlusRisk: ThresholdPoint[] = phototherapy38PlusRisk.map(
  (p) => ({ hour: p.hour, value: p.value + 4 }),
);

const exchange35to37NoRisk: ThresholdPoint[] = phototherapy35to37NoRisk.map(
  (p) => ({ hour: p.hour, value: p.value + 5 }),
);

const exchange35to37Risk: ThresholdPoint[] = phototherapy35to37Risk.map(
  (p) => ({ hour: p.hour, value: p.value + 4 }),
);

function interpolateThreshold(
  table: ThresholdPoint[],
  hours: number,
): number {
  const clampedHours = Math.min(
    Math.max(hours, AAP_HOUR_RANGE.min),
    AAP_HOUR_RANGE.max,
  );

  const first = table[0];
  const lastIndex = table.length - 1;
  const last = table[lastIndex];

  if (clampedHours <= first.hour) return first.value;
  if (clampedHours >= last.hour) return last.value;

  for (let i = 0; i < lastIndex; i++) {
    const current = table[i];
    const next = table[i + 1];
    if (clampedHours >= current.hour && clampedHours <= next.hour) {
      const ratio = (clampedHours - current.hour) / (next.hour - current.hour);
      return current.value + (next.value - current.value) * ratio;
    }
  }

  return last.value;
}

function selectTable(
  tables: {
    noRisk: ThresholdPoint[];
    risk: ThresholdPoint[];
  },
  hasRiskFactors: boolean,
): ThresholdPoint[] {
  return hasRiskFactors ? tables.risk : tables.noRisk;
}

/**
 * Umbral de fototerapia (mg/dL) según edad posnatal (horas), edad gestacional y
 * presencia de factores de riesgo neurotóxico.
 *
 * Retorna `null` para <35 semanas (protocolos específicos de UCIN, no calculados aquí).
 */
export function getPhototherapyThreshold(
  hours: number,
  gestationalAge: GestationalAge,
  hasRiskFactors: boolean,
): number | null {
  if (gestationalAge === "<35") return null;

  const tables =
    gestationalAge === ">=38"
      ? { noRisk: phototherapy38PlusNoRisk, risk: phototherapy38PlusRisk }
      : { noRisk: phototherapy35to37NoRisk, risk: phototherapy35to37Risk };

  return interpolateThreshold(selectTable(tables, hasRiskFactors), hours);
}

/**
 * Umbral de exanguinotransfusión / recambio sanguíneo (mg/dL) según edad posnatal
 * (horas), edad gestacional y presencia de factores de riesgo neurotóxico.
 *
 * Retorna `null` para <35 semanas (protocolos específicos de UCIN, no calculados aquí).
 */
export function getExchangeTransfusionThreshold(
  hours: number,
  gestationalAge: GestationalAge,
  hasRiskFactors: boolean,
): number | null {
  if (gestationalAge === "<35") return null;

  const tables =
    gestationalAge === ">=38"
      ? { noRisk: exchange38PlusNoRisk, risk: exchange38PlusRisk }
      : { noRisk: exchange35to37NoRisk, risk: exchange35to37Risk };

  return interpolateThreshold(selectTable(tables, hasRiskFactors), hours);
}
