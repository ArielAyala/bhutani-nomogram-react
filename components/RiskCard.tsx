import type { ClinicalResult, RiskZone } from "@/lib/types";

interface RiskCardProps {
  result: ClinicalResult | null;
}

const riskZoneStyles: Record<
  RiskZone,
  { label: string; className: string }
> = {
  low: {
    label: "Bajo Riesgo",
    className: "border-green-300 bg-green-50 text-green-800",
  },
  "intermediate-low": {
    label: "Riesgo Intermedio-Bajo",
    className: "border-yellow-300 bg-yellow-50 text-yellow-800",
  },
  "intermediate-high": {
    label: "Riesgo Intermedio-Alto",
    className: "border-orange-300 bg-orange-50 text-orange-800",
  },
  high: {
    label: "Alto Riesgo",
    className: "border-red-300 bg-red-50 text-red-800",
  },
  unknown: {
    label: "Zona no determinada",
    className: "border-slate-300 bg-slate-50 text-slate-700",
  },
};

export default function RiskCard({ result }: RiskCardProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
        <p className="font-medium">Sin evaluación aún</p>
        <p className="text-sm">
          Completa el formulario y presiona &quot;Evaluar&quot; para ver el
          resultado clínico.
        </p>
      </div>
    );
  }

  const zoneStyle = riskZoneStyles[result.riskZone];

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-6 shadow-sm ${zoneStyle.className}`}
    >
      <h2 className="text-lg font-semibold">Resultado Clínico</h2>
      <p className="text-xl font-bold">{zoneStyle.label}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="font-medium">Requiere fototerapia:</dt>
        <dd>{result.needsPhototherapy ? "Sí" : "No"}</dd>

        <dt className="font-medium">Umbral fototerapia:</dt>
        <dd>
          {result.phototherapyThreshold != null
            ? `${result.phototherapyThreshold} mg/dL`
            : "N/A"}
        </dd>

        <dt className="font-medium">Umbral recambio sanguíneo:</dt>
        <dd>
          {result.exchangeThreshold != null
            ? `${result.exchangeThreshold} mg/dL`
            : "N/A"}
        </dd>
      </dl>

      {result.escalationWarning && (
        <p
          role="alert"
          className="rounded-md border border-red-400 bg-red-100 p-2 text-sm font-semibold text-red-800"
        >
          Escalación de cuidados: valor cercano al umbral de recambio
          sanguíneo.
        </p>
      )}

      {result.recommendation && (
        <p className="mt-2 text-sm font-medium">{result.recommendation}</p>
      )}
    </div>
  );
}
