// Tipos compartidos para la evaluación clínico-nomográmica de ictericia neonatal
// basada en el Nomograma de Bhutani y las Guías AAP 2004 (Guías 1 y 2).

export type BilirubinUnit = "mgdL" | "umolL";

export type MeasurementType = "TcB" | "TSB";

export type GestationalAge = "<35" | "35-37" | ">=38";

/** Incompatibilidad materno-fetal que activa la regla de tasa de ascenso. */
export type Incompatibility = "none" | "ABO" | "Rh";

export interface RiskFactors {
  /** Enfermedad hemolítica (p. ej. Coombs directa positiva) */
  hemolyticDisease: boolean;
  /** Deficiencia de G6PD */
  g6pd: boolean;
  asphyxia: boolean;
  significantLethargy: boolean;
  thermalInstability: boolean;
  sepsis: boolean;
  /** Albúmina sérica < 3.0 g/dL */
  albumin: boolean;
  acidosis: boolean;
}

export interface PreviousBilirubin {
  /** Valor previo, en la misma unidad que bilirubinValue */
  value: number;
  /** Horas transcurridas desde la medición previa */
  hoursSince: number;
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
  acuteEncephalopathy: boolean;
  incompatibility: Incompatibility;
  previousBilirubin: PreviousBilirubin | null;
  /** Reingreso tras alta previa */
  rehospitalized: boolean;
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
  exchangeIndicated: boolean;
  phototherapyThreshold: number | null;
  exchangeThreshold: number | null;
  warnings: string[];
  recommendation: string;
}
