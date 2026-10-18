// Lógica clínica pura para la evaluación de ictericia neonatal.
// Combina las zonas de riesgo Bhutani (lib/bhutani-data.ts) con los umbrales de
// fototerapia / exanguinotransfusión de las Guías AAP 2004 (lib/aap-thresholds.ts).

import { getBhutaniZone } from "./bhutani-data";
import {
  getExchangeTransfusionThreshold,
  getPhototherapyThreshold,
} from "./aap-thresholds";
import type { ClinicalResult, PatientData } from "./types";

/** Factor de conversión µmol/L -> mg/dL. */
const UMOLL_TO_MGDL = 17.1;

/** Límite de tasa de ascenso (mg/dL/h) que indica recambio, por incompatibilidad. */
const RATE_OF_RISE_LIMITS = { ABO: 1, Rh: 0.5 } as const;

export function toMgdL(value: number, unit: PatientData["bilirubinUnit"]): number {
  return unit === "umolL" ? value / UMOLL_TO_MGDL : value;
}

export function hasAnyRiskFactor(
  riskFactors: PatientData["riskFactors"],
): boolean {
  return Object.values(riskFactors).some(Boolean);
}

/** Tasa de ascenso en mg/dL/h, o `null` si no hay medición previa válida. */
export function getRateOfRise(
  data: PatientData,
  bilirubinMgdL: number,
): number | null {
  const previous = data.previousBilirubin;
  if (!previous || previous.hoursSince <= 0) return null;

  const previousMgdL = toMgdL(previous.value, data.bilirubinUnit);
  return (bilirubinMgdL - previousMgdL) / previous.hoursSince;
}

/**
 * Evalúa los datos de un paciente y determina la zona de riesgo Bhutani, los
 * umbrales AAP 2004 aplicables, las indicaciones de fototerapia / recambio y la
 * recomendación clínica correspondiente.
 *
 * Orden de prioridad: <35 sem (UCIN) > encefalopatía aguda > tasa de ascenso >
 * BST en rango de recambio > fototerapia > zona intermedia > zona baja > fallback.
 */
export function evaluatePatient(data: PatientData): ClinicalResult {
  const bilirubinMgdL = toMgdL(data.bilirubinValue, data.bilirubinUnit);
  const warnings: string[] = [];

  if (data.measurementType === "TcB") {
    warnings.push(
      "La bilirrubina transcutánea (TcB) es un método de screening: confirmar con TSB antes de decidir el tratamiento.",
    );
  }

  if (data.gestationalAge === "<35") {
    return {
      riskZone: "unknown",
      needsPhototherapy: false,
      exchangeIndicated: false,
      phototherapyThreshold: null,
      exchangeThreshold: null,
      warnings,
      recommendation:
        "Advertencia: Para neonatos <35 semanas, aplicar protocolos específicos de unidad de cuidados intensivos neonatales (UCIN).",
    };
  }

  const riskFactorsPresent = hasAnyRiskFactor(data.riskFactors);
  const riskZone = getBhutaniZone(data.postnatalAgeHours, bilirubinMgdL);

  const phototherapyThreshold = getPhototherapyThreshold(
    data.postnatalAgeHours,
    data.gestationalAge,
    riskFactorsPresent,
  );

  const exchangeThreshold = getExchangeTransfusionThreshold(
    data.postnatalAgeHours,
    data.gestationalAge,
    riskFactorsPresent,
  );

  const needsPhototherapy =
    phototherapyThreshold != null && bilirubinMgdL >= phototherapyThreshold;

  const reachesExchangeThreshold =
    exchangeThreshold != null && bilirubinMgdL >= exchangeThreshold;

  const rate = getRateOfRise(data, bilirubinMgdL);
  const rapidRise =
    rate !== null &&
    data.incompatibility !== "none" &&
    rate > RATE_OF_RISE_LIMITS[data.incompatibility];

  if (rapidRise) {
    warnings.push(
      `Tasa de ascenso de ${rate.toFixed(2)} mg/dL/h supera el límite para incompatibilidad ${data.incompatibility}.`,
    );
  }

  let exchangeIndicated = false;
  let recommendation: string;

  if (data.acuteEncephalopathy) {
    exchangeIndicated = true;
    recommendation =
      "Recambio sanguíneo urgente: encefalopatía aguda por hiperbilirrubinemia.";
  } else if (rapidRise) {
    exchangeIndicated = true;
    recommendation =
      "Recambio sanguíneo indicado: tasa de ascenso de bilirrubina superior al límite.";
  } else if (reachesExchangeThreshold && data.rehospitalized) {
    recommendation =
      "Fototerapia intensiva. Repetir BST a las 2-3 h; considerar recambio si persiste en rango de recambio tras 6 h de fototerapia.";
  } else if (reachesExchangeThreshold) {
    exchangeIndicated = true;
    recommendation =
      "Recambio sanguíneo indicado: BST en rango de exanguinotransfusión.";
  } else if (needsPhototherapy) {
    recommendation = "Indicación de Fototerapia Inmediata.";
  } else if (riskZone === "intermediate-low" || riskZone === "intermediate-high") {
    recommendation = "Repetir TSB en 8-12 horas.";
  } else if (riskZone === "low") {
    recommendation = "Dar de alta con seguimiento en 48h.";
  } else {
    recommendation = "Seguimiento clínico según criterio médico.";
  }

  return {
    riskZone,
    needsPhototherapy,
    exchangeIndicated,
    phototherapyThreshold,
    exchangeThreshold,
    warnings,
    recommendation,
  };
}

// ---------------------------------------------------------------------------
// Casos de prueba (verificación manual — no se usa ningún framework de testing)
// ---------------------------------------------------------------------------
//
// Caso A: 24h, 8 mg/dL, TSB, >=38 sem, sin factores de riesgo.
//   evaluatePatient({
//     postnatalAgeHours: 24,
//     bilirubinValue: 8,
//     bilirubinUnit: "mgdL",
//     measurementType: "TSB",
//     gestationalAge: ">=38",
//     riskFactors: { hemolyticDisease: false, g6pd: false, asphyxia: false, significantLethargy: false, thermalInstability: false, sepsis: false, albumin: false, acidosis: false },
//     acuteEncephalopathy: false, incompatibility: "none", previousBilirubin: null, rehospitalized: false,
//   })
//   Curva baja (>=38 sem sin factores): fototerapia 9.0 mg/dL a 24h -> 8 < 9 => needsPhototherapy=false.
//   Exanguinotransfusión 15.5 mg/dL a 24h -> 8 < 15.5 => exchangeIndicated=false.
//   recommendation = "Seguimiento clínico según criterio médico." (salvo que la zona Bhutani sea intermedia/baja).
//
// Caso B: 48h, 18 mg/dL, TSB, 35-37 sem, con enfermedad hemolítica (factor de riesgo).
//   evaluatePatient({
//     postnatalAgeHours: 48,
//     bilirubinValue: 18,
//     bilirubinUnit: "mgdL",
//     measurementType: "TSB",
//     gestationalAge: "35-37",
//     riskFactors: { hemolyticDisease: true, g6pd: false, asphyxia: false, significantLethargy: false, thermalInstability: false, sepsis: false, albumin: false, acidosis: false },
//     acuteEncephalopathy: false, incompatibility: "none", previousBilirubin: null, rehospitalized: false,
//   })
//   Curva alta (35-37 sem con factores): fototerapia 10.8 mg/dL a 48h -> 18 >= 10.8 => needsPhototherapy=true.
//   Exanguinotransfusión 12.0 mg/dL a 48h -> 18 >= 12.0 => exchangeIndicated=true.
//   recommendation = "Recambio sanguíneo indicado: BST en rango de exanguinotransfusión."
//
// Caso C: cualquier valor, <35 sem (p. ej. 60h, 12 mg/dL, TcB).
//   evaluatePatient({
//     postnatalAgeHours: 60,
//     bilirubinValue: 12,
//     bilirubinUnit: "mgdL",
//     measurementType: "TcB",
//     gestationalAge: "<35",
//     riskFactors: { hemolyticDisease: false, g6pd: false, asphyxia: false, significantLethargy: false, thermalInstability: false, sepsis: false, albumin: false, acidosis: false },
//     acuteEncephalopathy: false, incompatibility: "none", previousBilirubin: null, rehospitalized: false,
//   })
//   riskZone = "unknown", phototherapyThreshold = null, exchangeThreshold = null,
//   needsPhototherapy = false, exchangeIndicated = false,
//   warnings = [aviso TcB], recommendation = "Advertencia: Para neonatos <35 semanas, aplicar protocolos específicos
//   de unidad de cuidados intensivos neonatales (UCIN)."
