"use client";

import { useState } from "react";
import PatientForm from "@/components/PatientForm";
import RiskCard from "@/components/RiskCard";
import BhutaniChart from "@/components/BhutaniChart";
import ThemeToggle from "@/components/ThemeToggle";
import ExportButton from "@/components/ExportButton";
import { evaluatePatient } from "@/lib/clinical-logic";
import type { ClinicalResult, PatientData } from "@/lib/types";

export default function Home() {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [result, setResult] = useState<ClinicalResult | null>(null);

  function handleSubmit(data: PatientData) {
    setPatientData(data);
    setResult(evaluatePatient(data));
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-100 dark:bg-slate-900">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Evaluación Clínico-Nomográmica de Ictericia Neonatal
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Basado en el Nomograma de Bhutani y las Guías AAP 2022.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div id="patient-report" className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PatientForm onSubmit={handleSubmit} />
            <div className="flex flex-col gap-6">
              <RiskCard result={result} />
              <BhutaniChart patientData={patientData} result={result} />
            </div>
          </div>
        </div>

        <ExportButton targetId="patient-report" disabled={!result} />
      </main>
    </div>
  );
}
