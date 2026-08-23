"use client";

import { useState } from "react";
import PatientForm from "@/components/PatientForm";
import RiskCard from "@/components/RiskCard";
import BhutaniChart from "@/components/BhutaniChart";
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
    <div className="flex flex-1 flex-col bg-slate-100">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Evaluación Clínico-Nomográmica de Ictericia Neonatal
          </h1>
          <p className="text-sm text-slate-600">
            Basado en el Nomograma de Bhutani y las Guías AAP 2022.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PatientForm onSubmit={handleSubmit} />
          <RiskCard result={result} />
        </div>

        <BhutaniChart patientData={patientData} result={result} />
      </main>
    </div>
  );
}
