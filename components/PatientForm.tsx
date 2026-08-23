"use client";

import { useState } from "react";
import type {
  BilirubinUnit,
  GestationalAge,
  MeasurementType,
  PatientData,
  RiskFactors,
} from "@/lib/types";

const MIN_HOURS = 12;
const MAX_HOURS = 148;

const initialRiskFactors: RiskFactors = {
  coombs: false,
  g6pd: false,
  clinicalInstability: false,
  albumin: false,
};

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
}

interface FormErrors {
  postnatalAgeHours?: string;
  bilirubinValue?: string;
}

export default function PatientForm({ onSubmit }: PatientFormProps) {
  const [postnatalAgeHours, setPostnatalAgeHours] = useState<string>("");
  const [bilirubinValue, setBilirubinValue] = useState<string>("");
  const [bilirubinUnit, setBilirubinUnit] = useState<BilirubinUnit>("mgdL");
  const [measurementType, setMeasurementType] =
    useState<MeasurementType>("TSB");
  const [gestationalAge, setGestationalAge] = useState<GestationalAge>(
    ">=38"
  );
  const [riskFactors, setRiskFactors] =
    useState<RiskFactors>(initialRiskFactors);
  const [errors, setErrors] = useState<FormErrors>({});

  function toggleRiskFactor(key: keyof RiskFactors) {
    setRiskFactors((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    const hours = Number(postnatalAgeHours);
    const bilirubin = Number(bilirubinValue);

    if (postnatalAgeHours.trim() === "" || Number.isNaN(hours)) {
      nextErrors.postnatalAgeHours = "Ingresa la edad posnatal en horas.";
    } else if (hours < MIN_HOURS || hours > MAX_HOURS) {
      nextErrors.postnatalAgeHours = `El valor debe estar entre ${MIN_HOURS} y ${MAX_HOURS} horas.`;
    }

    if (bilirubinValue.trim() === "" || Number.isNaN(bilirubin)) {
      nextErrors.bilirubinValue = "Ingresa el nivel de bilirrubina.";
    } else if (bilirubin <= 0) {
      nextErrors.bilirubinValue = "El valor debe ser mayor a 0.";
    }

    return nextErrors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const data: PatientData = {
      postnatalAgeHours: Number(postnatalAgeHours),
      bilirubinValue: Number(bilirubinValue),
      bilirubinUnit,
      measurementType,
      gestationalAge,
      riskFactors,
    };

    onSubmit(data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      aria-label="Formulario de datos clínicos del paciente"
    >
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Parámetros Clínicos
      </h2>

      {/* Edad Posnatal */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="postnatalAgeHours"
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Edad Posnatal (horas de vida)
        </label>
        <input
          id="postnatalAgeHours"
          name="postnatalAgeHours"
          type="number"
          min={MIN_HOURS}
          max={MAX_HOURS}
          step="1"
          value={postnatalAgeHours}
          onChange={(e) => setPostnatalAgeHours(e.target.value)}
          aria-describedby="postnatalAgeHours-error"
          aria-invalid={Boolean(errors.postnatalAgeHours)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          placeholder={`${MIN_HOURS} - ${MAX_HOURS}`}
        />
        {errors.postnatalAgeHours && (
          <p
            id="postnatalAgeHours-error"
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.postnatalAgeHours}
          </p>
        )}
      </div>

      {/* Nivel de Bilirrubina */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="bilirubinValue"
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Nivel de Bilirrubina
        </label>
        <div className="flex gap-2">
          <input
            id="bilirubinValue"
            name="bilirubinValue"
            type="number"
            min={0}
            step="0.1"
            value={bilirubinValue}
            onChange={(e) => setBilirubinValue(e.target.value)}
            aria-describedby="bilirubinValue-error"
            aria-invalid={Boolean(errors.bilirubinValue)}
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Valor"
          />
          <select
            aria-label="Unidad de bilirrubina"
            value={bilirubinUnit}
            onChange={(e) => setBilirubinUnit(e.target.value as BilirubinUnit)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="mgdL">mg/dL</option>
            <option value="umolL">µmol/L</option>
          </select>
        </div>
        {errors.bilirubinValue && (
          <p
            id="bilirubinValue-error"
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.bilirubinValue}
          </p>
        )}
      </div>

      {/* Tipo de Medición */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Tipo de Medición
        </legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="measurementType"
              value="TcB"
              checked={measurementType === "TcB"}
              onChange={() => setMeasurementType("TcB")}
            />
            Bilirrubina Transcutánea (TcB)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="measurementType"
              value="TSB"
              checked={measurementType === "TSB"}
              onChange={() => setMeasurementType("TSB")}
            />
            Bilirrubina Sérica Total (TSB)
          </label>
        </div>
      </fieldset>

      {/* Edad Gestacional */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="gestationalAge"
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Edad Gestacional al Nacer
        </label>
        <select
          id="gestationalAge"
          name="gestationalAge"
          value={gestationalAge}
          onChange={(e) =>
            setGestationalAge(e.target.value as GestationalAge)
          }
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="<35">&lt; 35 semanas (Prematuro)</option>
          <option value="35-37">35 - 37.6 semanas (Prematuro tardío)</option>
          <option value=">=38">&ge; 38 semanas (A término)</option>
        </select>
        {gestationalAge === "<35" && (
          <p
            role="alert"
            className="text-sm text-amber-700 dark:text-amber-400"
          >
            Advertencia: para neonatos &lt;35 semanas se aplican protocolos
            específicos de UCIN y una tabla reducida de fototerapia.
          </p>
        )}
      </div>

      {/* Factores de Riesgo Neurotóxico */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Factores de Riesgo Neurotóxico
        </legend>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={riskFactors.coombs}
            onChange={() => toggleRiskFactor("coombs")}
          />
          Prueba de Coombs directa positiva / Incompatibilidad ABO o Rh
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={riskFactors.g6pd}
            onChange={() => toggleRiskFactor("g6pd")}
          />
          Deficiencia de G6PD o hemólisis conocida
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={riskFactors.clinicalInstability}
            onChange={() => toggleRiskFactor("clinicalInstability")}
          />
          Inestabilidad clínica en las últimas 24 h (Sepsis, asfixia,
          acidosis)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={riskFactors.albumin}
            onChange={() => toggleRiskFactor("albumin")}
          />
          Albúmina sérica &lt; 3.0 g/dL
        </label>
      </fieldset>

      <button
        type="submit"
        className="mt-2 rounded-md bg-sky-600 px-4 py-2 font-medium text-white transition-colors hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:bg-sky-500 dark:hover:bg-sky-600"
      >
        Evaluar
      </button>
    </form>
  );
}
