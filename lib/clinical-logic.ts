// Lógica clínica pura para la evaluación de ictericia neonatal.
// Combina las zonas de riesgo Bhutani (lib/bhutani-data.ts) con los umbrales de
// fototerapia / exanguinotransfusión de la AAP 2022 (lib/aap-thresholds.ts).

import { getBhutaniZone } from "./bhutani-data";
import {
  getExchangeTransfusionThreshold,
  getPhototherapyThreshold,
} from "./aap-thresholds";
import type { ClinicalResult, PatientData, RiskZone } from "./types";

/** Factor de conversión µmol/L -> mg/dL. */
const UMOLL_TO_MGDL = 17.1;

/** Margen (mg/dL) por debajo del umbral de recambio para disparar la escalación. */
const ESCALATION_MARGIN_MGDL = 2;

function toMgdL(value: number, unit: PatientData["bilirubinUnit"]): number {
  return unit === "umolL" ? value / UMOLL_TO_MGDL : value;
}

function hasAnyRiskFactor(riskFactors: PatientData["riskFactors"]): boolean {
  return (
    riskFactors.coombs ||
    riskFactors.g6pd ||
    riskFactors.clinicalInstability ||
    riskFactors.albumin
  );
}

function buildRecommendation(params: {
  gestationalAge: PatientData["gestationalAge"];
  riskZone: RiskZone;
  needsPhototherapy: boolean;
  escalationWarning: boolean;
}): string {
  const { gestationalAge, riskZone, needsPhototherapy, escalationWarning } =
    params;

  if (gestationalAge === "<35") {
    return "Advertencia: Para neonatos <35 semanas, aplicar protocolos específicos de unidad de cuidados intensivos neonatales (UCIN).";
  }

  if (escalationWarning) {
    return "ESCALACIÓN: valor cercano al umbral de recambio sanguíneo. Requiere evaluación urgente.";
  }

  if (needsPhototherapy) {
    return "Indicación de Fototerapia Inmediata.";
  }

  if (riskZone === "intermediate-low" || riskZone === "intermediate-high") {
    return "Repetir TSB en 8-12 horas.";
  }

  if (riskZone === "low") {
    return "Dar de alta con seguimiento en 48h.";
  }

  return "Seguimiento clínico según criterio médico.";
}

/**
 * Evalúa los datos de un paciente y determina la zona de riesgo Bhutani, los
 * umbrales AAP 2022 aplicables y la recomendación clínica correspondiente.
 */
export function evaluatePatient(data: PatientData): ClinicalResult {
  const bilirubinMgdL = toMgdL(data.bilirubinValue, data.bilirubinUnit);
  const riskFactorsPresent = hasAnyRiskFactor(data.riskFactors);

  // Las zonas de riesgo Bhutani solo se calculan para >= 35 semanas.
  const riskZone: RiskZone =
    data.gestationalAge === "<35"
      ? "unknown"
      : getBhutaniZone(data.postnatalAgeHours, bilirubinMgdL);

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

  const escalationWarning =
    exchangeThreshold != null &&
    bilirubinMgdL >= exchangeThreshold - ESCALATION_MARGIN_MGDL;

  const recommendation = buildRecommendation({
    gestationalAge: data.gestationalAge,
    riskZone,
    needsPhototherapy,
    escalationWarning,
  });

  return {
    riskZone,
    needsPhototherapy,
    escalationWarning,
    phototherapyThreshold,
    exchangeThreshold,
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
//     riskFactors: { coombs: false, g6pd: false, clinicalInstability: false, albumin: false },
//   })
//   Bhutani a las 24h: p40=4.0, p75=5.5, p95=7.5 -> 8 mg/dL > p95 => riskZone "high".
//   Umbral fototerapia 38+ sin riesgo a 24h = 10.0 mg/dL -> 8 < 10 => needsPhototherapy=false.
//   Umbral recambio 38+ sin riesgo a 24h = 15.0 mg/dL -> 8 no está a <2 mg/dL => escalationWarning=false.
//   riskZone="high" no está en {low, intermediate-low/high} explícitos con fototerapia negativa,
//   por lo que recommendation = "Seguimiento clínico según criterio médico."
//
// Caso B: 48h, 18 mg/dL, TSB, 35-37 sem, con Coombs positivo (factor de riesgo).
//   evaluatePatient({
//     postnatalAgeHours: 48,
//     bilirubinValue: 18,
//     bilirubinUnit: "mgdL",
//     measurementType: "TSB",
//     gestationalAge: "35-37",
//     riskFactors: { coombs: true, g6pd: false, clinicalInstability: false, albumin: false },
//   })
//   riskFactorsPresent = true.
//   Umbral fototerapia 35-37 con riesgo a 48h = 9.5 mg/dL -> 18 >= 9.5 => needsPhototherapy=true.
//   Umbral recambio 35-37 con riesgo a 48h = 13.5 mg/dL -> 18 >= 13.5 - 2 = 11.5 => escalationWarning=true.
//   recommendation = "ESCALACIÓN: valor cercano al umbral de recambio sanguíneo. Requiere evaluación urgente."
//   (Ambas condiciones de alerta clínica se cumplen; la escalación tiene prioridad sobre la
//   indicación simple de fototerapia, como corresponde a un caso más grave.)
//
// Caso C: cualquier valor, <35 sem (p. ej. 60h, 12 mg/dL, TcB).
//   evaluatePatient({
//     postnatalAgeHours: 60,
//     bilirubinValue: 12,
//     bilirubinUnit: "mgdL",
//     measurementType: "TcB",
//     gestationalAge: "<35",
//     riskFactors: { coombs: false, g6pd: false, clinicalInstability: false, albumin: false },
//   })
//   riskZone = "unknown", phototherapyThreshold = null, exchangeThreshold = null,
//   needsPhototherapy = false, escalationWarning = false.
//   recommendation = "Advertencia: Para neonatos <35 semanas, aplicar protocolos específicos
//   de unidad de cuidados intensivos neonatales (UCIN)."
