// Curvas de fototerapia (Guía 1) y exanguinotransfusión (Guía 2) para RN >= 35 semanas,
// según AAP 2004 (Pediatrics 2004;114:297-316).
//
// NOTA IMPORTANTE: Los valores son una lectura aproximada de las gráficas (no tabulados);
// verificar contra la publicación original antes de uso clínico.
//
// Para neonatos <35 semanas no se calculan umbrales aquí: se asume manejo bajo
// protocolos específicos de UCIN (retorna null).

import type { GestationalAge } from "./types";

export type RiskCurve = "low" | "medium" | "high";

interface CurvePoint {
  /** Horas de vida */
  hour: number;
  /** Umbral de bilirrubina en mg/dL */
  value: number;
}

export const AAP_HOUR_RANGE = { min: 0, max: 168 } as const;

// Guía 1: fototerapia. Curva baja = >=38 sem sin factores; media = >=38 sem con factores
// o 35-37 sem sin factores; alta = 35-37 sem con factores.
const PHOTOTHERAPY_CURVES: Record<RiskCurve, CurvePoint[]> = {
  low: [
    { hour: 0, value: 5.0 },
    { hour: 24, value: 9.0 },
    { hour: 48, value: 13.0 },
    { hour: 72, value: 15.5 },
    { hour: 96, value: 17.2 },
    { hour: 120, value: 18.0 },
    { hour: 144, value: 18.0 },
    { hour: 168, value: 18.0 },
  ],
  medium: [
    { hour: 0, value: 6.5 },
    { hour: 24, value: 11.0 },
    { hour: 48, value: 15.2 },
    { hour: 72, value: 18.2 },
    { hour: 96, value: 20.0 },
    { hour: 120, value: 21.0 },
    { hour: 144, value: 21.2 },
    { hour: 168, value: 21.2 },
  ],
  high: [
    { hour: 0, value: 3.5 },
    { hour: 24, value: 7.0 },
    { hour: 48, value: 10.8 },
    { hour: 72, value: 13.3 },
    { hour: 96, value: 14.7 },
    { hour: 120, value: 15.0 },
    { hour: 144, value: 15.2 },
    { hour: 168, value: 15.2 },
  ],
};

// Guía 2: exanguinotransfusión, mismas categorías de riesgo que la Guía 1.
const EXCHANGE_CURVES: Record<RiskCurve, CurvePoint[]> = {
  low: [
    { hour: 0, value: 12.5 },
    { hour: 24, value: 15.5 },
    { hour: 48, value: 19.0 },
    { hour: 72, value: 21.0 },
    { hour: 96, value: 22.0 },
    { hour: 120, value: 22.2 },
    { hour: 144, value: 22.2 },
    { hour: 168, value: 22.2 },
  ],
  medium: [
    { hour: 0, value: 15.5 },
    { hour: 24, value: 18.5 },
    { hour: 48, value: 21.5 },
    { hour: 72, value: 23.5 },
    { hour: 96, value: 24.5 },
    { hour: 120, value: 25.0 },
    { hour: 144, value: 25.0 },
    { hour: 168, value: 25.0 },
  ],
  // Lectura incierta en 0 h (gráfica de baja resolución); verificar.
  high: [
    { hour: 0, value: 1.0 },
    { hour: 24, value: 7.0 },
    { hour: 48, value: 12.0 },
    { hour: 72, value: 15.5 },
    { hour: 96, value: 17.5 },
    { hour: 120, value: 18.5 },
    { hour: 144, value: 18.5 },
    { hour: 168, value: 18.5 },
  ],
};

function interpolateCurve(points: CurvePoint[], hours: number): number {
  const clampedHours = Math.min(
    Math.max(hours, AAP_HOUR_RANGE.min),
    AAP_HOUR_RANGE.max,
  );

  const lastIndex = points.length - 1;
  if (clampedHours <= points[0].hour) return points[0].value;
  if (clampedHours >= points[lastIndex].hour) return points[lastIndex].value;

  for (let i = 0; i < lastIndex; i++) {
    const current = points[i];
    const next = points[i + 1];
    if (clampedHours >= current.hour && clampedHours <= next.hour) {
      const ratio = (clampedHours - current.hour) / (next.hour - current.hour);
      return current.value + (next.value - current.value) * ratio;
    }
  }

  return points[lastIndex].value;
}

/**
 * Curva de riesgo AAP 2004 para la combinación de edad gestacional y factores.
 * Retorna `null` para <35 semanas.
 */
export function getRiskCurve(
  gestationalAge: GestationalAge,
  hasRiskFactors: boolean,
): RiskCurve | null {
  if (gestationalAge === "<35") return null;
  if (gestationalAge === ">=38") return hasRiskFactors ? "medium" : "low";
  return hasRiskFactors ? "high" : "medium";
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
  const curve = getRiskCurve(gestationalAge, hasRiskFactors);
  if (curve === null) return null;
  return interpolateCurve(PHOTOTHERAPY_CURVES[curve], hours);
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
  const curve = getRiskCurve(gestationalAge, hasRiskFactors);
  if (curve === null) return null;
  return interpolateCurve(EXCHANGE_CURVES[curve], hours);
}
