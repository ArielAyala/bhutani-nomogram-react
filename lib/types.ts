// Tipos compartidos para la evaluación clínico-nomográmica de ictericia neonatal
// basada en el Nomograma de Bhutani y las Guías AAP 2022.

export type BilirubinUnit = "mgdL" | "umolL";

export type MeasurementType = "TcB" | "TSB";

export type GestationalAge = "<35" | "35-37" | ">=38";

export interface RiskFactors {
  /** Prueba de Coombs directa positiva / Incompatibilidad ABO o Rh */
  coombs: boolean;
  /** Deficiencia de G6PD o hemólisis conocida */
  g6pd: boolean;
  /** Inestabilidad clínica en las últimas 24 h (Sepsis, asfixia, acidosis) */
  clinicalInstability: boolean;
  /** Albúmina sérica < 3.0 g/dL */
  albumin: boolean;
}

export interface PatientData {
  /** Edad posnatal en horas de vida (12 a 148 h) */
  postnatalAgeHours: number;
  /** Nivel de bilirrubina, en la unidad indicada por bilirubinUnit */
  bilirubinValue: number;
  bilirubinUnit: BilirubinUnit;
  measurementType: MeasurementType;
  gestationalAge: GestationalAge;
  riskFactors: RiskFactors;
}

export type RiskZone =
  | "low"
  | "intermediate-low"
  | "intermediate-high"
  | "high"
  | "unknown";

export interface ClinicalResult {
  riskZone: RiskZone;
  needsPhototherapy: boolean;
  escalationWarning: boolean;
  phototherapyThreshold: number | null;
  exchangeThreshold: number | null;
  recommendation: string;
}
