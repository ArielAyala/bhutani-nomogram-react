// Datos del Nomograma de Bhutani (Bhutani VK et al. Pediatrics 1999;104(1):6-14).
//
// NOTA IMPORTANTE: Los valores tabulados abajo son una digitalización aproximada de las
// curvas de percentiles P40/P75/P95 del nomograma original, útil para fines de desarrollo
// y demostración. Antes de un uso clínico real, estos puntos deben ser verificados y
// ajustados contra la publicación original o una fuente validada (p. ej. BiliTool).

import type { RiskZone } from "./types";

export interface BhutaniPoint {
  /** Horas de vida */
  hour: number;
  /** Percentil 40, en mg/dL */
  p40: number;
  /** Percentil 75, en mg/dL */
  p75: number;
  /** Percentil 95, en mg/dL */
  p95: number;
}

/** Rango válido de interpolación del nomograma, en horas de vida. */
export const BHUTANI_HOUR_RANGE = { min: 12, max: 168 } as const;

export const bhutaniPercentileData: BhutaniPoint[] = [
  { hour: 12, p40: 2.0, p75: 3.0, p95: 4.5 },
  { hour: 18, p40: 3.0, p75: 4.3, p95: 6.0 },
  { hour: 24, p40: 4.0, p75: 5.5, p95: 7.5 },
  { hour: 36, p40: 5.5, p75: 7.5, p95: 9.8 },
  { hour: 48, p40: 6.8, p75: 9.0, p95: 11.5 },
  { hour: 60, p40: 7.8, p75: 10.2, p95: 13.0 },
  { hour: 72, p40: 8.6, p75: 11.2, p95: 14.0 },
  { hour: 84, p40: 9.2, p75: 11.8, p95: 14.6 },
  { hour: 96, p40: 9.7, p75: 12.2, p95: 15.0 },
  { hour: 108, p40: 10.0, p75: 12.5, p95: 15.3 },
  { hour: 120, p40: 10.3, p75: 12.7, p95: 15.5 },
  { hour: 132, p40: 10.5, p75: 12.9, p95: 15.6 },
  { hour: 144, p40: 10.7, p75: 13.0, p95: 15.7 },
  { hour: 156, p40: 10.8, p75: 13.1, p95: 15.8 },
  { hour: 168, p40: 10.9, p75: 13.2, p95: 15.8 },
];

/**
 * Interpola linealmente los percentiles P40/P75/P95 del nomograma de Bhutani
 * para una edad posnatal dada, en horas de vida.
 *
 * Si `hours` está fuera del rango tabulado (12-168 h), el valor se recorta
 * (clamp) al extremo más cercano; no se extrapola fuera de la curva.
 */
export function interpolateBhutani(hours: number): {
  p40: number;
  p75: number;
  p95: number;
} {
  const clampedHours = Math.min(
    Math.max(hours, BHUTANI_HOUR_RANGE.min),
    BHUTANI_HOUR_RANGE.max,
  );

  if (clampedHours <= bhutaniPercentileData[0].hour) {
    const first = bhutaniPercentileData[0];
    return { p40: first.p40, p75: first.p75, p95: first.p95 };
  }

  const lastIndex = bhutaniPercentileData.length - 1;
  const last = bhutaniPercentileData[lastIndex];
  if (clampedHours >= last.hour) {
    return { p40: last.p40, p75: last.p75, p95: last.p95 };
  }

  for (let i = 0; i < lastIndex; i++) {
    const current = bhutaniPercentileData[i];
    const next = bhutaniPercentileData[i + 1];
    if (clampedHours >= current.hour && clampedHours <= next.hour) {
      const ratio =
        (clampedHours - current.hour) / (next.hour - current.hour);
      return {
        p40: current.p40 + (next.p40 - current.p40) * ratio,
        p75: current.p75 + (next.p75 - current.p75) * ratio,
        p95: current.p95 + (next.p95 - current.p95) * ratio,
      };
    }
  }

  // No debería llegar aquí; fallback defensivo.
  return { p40: last.p40, p75: last.p75, p95: last.p95 };
}

/**
 * Determina la zona de riesgo Bhutani para un recién nacido de >= 35 semanas
 * de edad gestacional, dada su edad posnatal (horas) y bilirrubina (mg/dL).
 */
export function getBhutaniZone(
  hours: number,
  bilirubinMgdL: number,
): RiskZone {
  const { p40, p75, p95 } = interpolateBhutani(hours);

  if (bilirubinMgdL > p95) return "high";
  if (bilirubinMgdL > p75) return "intermediate-high";
  if (bilirubinMgdL > p40) return "intermediate-low";
  return "low";
}
