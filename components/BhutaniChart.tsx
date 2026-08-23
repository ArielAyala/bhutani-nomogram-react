"use client";

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import {
  BHUTANI_HOUR_RANGE,
  bhutaniPercentileData,
} from "@/lib/bhutani-data";
import { getPhototherapyThreshold } from "@/lib/aap-thresholds";
import { hasAnyRiskFactor, toMgdL } from "@/lib/clinical-logic";
import type { ClinicalResult, PatientData, RiskZone } from "@/lib/types";

interface BhutaniChartProps {
  patientData: PatientData | null;
  result: ClinicalResult | null;
}

const riskZoneLabels: Record<RiskZone, string> = {
  low: "Bajo Riesgo",
  "intermediate-low": "Riesgo Intermedio-Bajo",
  "intermediate-high": "Riesgo Intermedio-Alto",
  high: "Alto Riesgo",
  unknown: "Zona no determinada",
};

interface ChartRow {
  hour: number;
  p40: number;
  p75: number;
  p95: number;
  phototherapy?: number;
  /** Solo definido en el punto exacto del paciente. */
  patientBilirubin?: number;
}

function buildChartData(patientData: PatientData | null): ChartRow[] {
  const showPhototherapy =
    patientData != null && patientData.gestationalAge !== "<35";
  const riskFactorsPresent = patientData
    ? hasAnyRiskFactor(patientData.riskFactors)
    : false;

  const rows: ChartRow[] = bhutaniPercentileData.map((point) => ({
    hour: point.hour,
    p40: point.p40,
    p75: point.p75,
    p95: point.p95,
    phototherapy: showPhototherapy
      ? (getPhototherapyThreshold(
          point.hour,
          patientData!.gestationalAge,
          riskFactorsPresent,
        ) ?? undefined)
      : undefined,
  }));

  if (!patientData) return rows;

  // Inserta un punto exacto para la edad posnatal del paciente, para que la
  // curva de fototerapia y el punto del paciente se alineen en el mismo x.
  const clampedHour = Math.min(
    Math.max(patientData.postnatalAgeHours, BHUTANI_HOUR_RANGE.min),
    BHUTANI_HOUR_RANGE.max,
  );
  const bilirubinMgdL = toMgdL(
    patientData.bilirubinValue,
    patientData.bilirubinUnit,
  );

  const existingIndex = rows.findIndex((r) => r.hour === clampedHour);
  const phototherapyAtHour = showPhototherapy
    ? (getPhototherapyThreshold(
        clampedHour,
        patientData.gestationalAge,
        riskFactorsPresent,
      ) ?? undefined)
    : undefined;

  if (existingIndex >= 0) {
    rows[existingIndex] = {
      ...rows[existingIndex],
      patientBilirubin: bilirubinMgdL,
    };
  } else {
    // Encuentra el índice de inserción para mantener el eje X ordenado.
    const insertAt = rows.findIndex((r) => r.hour > clampedHour);
    const interpolated = bhutaniPercentileData.reduce(
      (acc, _point, i, arr) => {
        if (i === arr.length - 1) return acc;
        const current = arr[i];
        const next = arr[i + 1];
        if (clampedHour >= current.hour && clampedHour <= next.hour) {
          const ratio =
            (clampedHour - current.hour) / (next.hour - current.hour);
          return {
            p40: current.p40 + (next.p40 - current.p40) * ratio,
            p75: current.p75 + (next.p75 - current.p75) * ratio,
            p95: current.p95 + (next.p95 - current.p95) * ratio,
          };
        }
        return acc;
      },
      { p40: 0, p75: 0, p95: 0 },
    );

    const newRow: ChartRow = {
      hour: clampedHour,
      ...interpolated,
      phototherapy: phototherapyAtHour,
      patientBilirubin: bilirubinMgdL,
    };

    if (insertAt === -1) {
      rows.push(newRow);
    } else {
      rows.splice(insertAt, 0, newRow);
    }
  }

  return rows;
}

function CustomTooltip({
  active,
  payload,
  patientData,
  result,
}: TooltipContentProps<ValueType, NameType> & {
  patientData: PatientData | null;
  result: ClinicalResult | null;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0].payload as ChartRow;

  return (
    <div className="rounded-md border border-slate-300 bg-white p-3 text-sm shadow-md dark:border-slate-600 dark:bg-slate-800">
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {row.hour} horas de vida
      </p>
      <p className="text-slate-600 dark:text-slate-300">
        P40: {row.p40.toFixed(1)} mg/dL · P75: {row.p75.toFixed(1)} mg/dL · P95:{" "}
        {row.p95.toFixed(1)} mg/dL
      </p>
      {row.phototherapy != null && (
        <p className="text-orange-600 dark:text-orange-400">
          Umbral fototerapia: {row.phototherapy.toFixed(1)} mg/dL
        </p>
      )}
      {row.patientBilirubin != null && patientData && (
        <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
          Paciente: {row.patientBilirubin.toFixed(1)} mg/dL —{" "}
          {result ? riskZoneLabels[result.riskZone] : "sin evaluar"}
        </p>
      )}
    </div>
  );
}

export default function BhutaniChart({
  patientData,
  result,
}: BhutaniChartProps) {
  const data = buildChartData(patientData);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Nomograma de Bhutani
      </h2>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis
              dataKey="hour"
              type="number"
              domain={[BHUTANI_HOUR_RANGE.min, BHUTANI_HOUR_RANGE.max]}
              label={{ value: "Horas de vida", position: "insideBottom", offset: -4 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: "Bilirrubina (mg/dL)", angle: -90, position: "insideLeft" }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip {...props} patientData={patientData} result={result} />
              )}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="p40"
              name="P40 (Bajo riesgo)"
              stroke="#16a34a"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="p75"
              name="P75 (Riesgo intermedio)"
              stroke="#ca8a04"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="p95"
              name="P95 (Alto riesgo)"
              stroke="#dc2626"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            {patientData && patientData.gestationalAge !== "<35" && (
              <Line
                type="monotone"
                dataKey="phototherapy"
                name="Umbral fototerapia"
                stroke="#ea580c"
                strokeDasharray="6 4"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            )}
            {patientData && (
              <Scatter
                dataKey="patientBilirubin"
                name="Paciente"
                fill="#0f172a"
                shape="diamond"
                legendType="diamond"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {!patientData && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Completa el formulario y presiona &quot;Evaluar&quot; para ver la
          posición del paciente en el gráfico.
        </p>
      )}
    </div>
  );
}
