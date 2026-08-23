"use client";

import { useState } from "react";

interface ExportButtonProps {
  /** id del contenedor DOM que se capturará para el PDF */
  targetId: string;
  disabled?: boolean;
}

export default function ExportButton({
  targetId,
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    const target = document.getElementById(targetId);
    if (!target) {
      setError("No se encontró el reporte para exportar.");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const [{ default: html2canvas }, { default: jsPDF }] =
        await Promise.all([import("html2canvas-pro"), import("jspdf")]);

      const isDark = document.documentElement.classList.contains("dark");

      const canvas = await html2canvas(target, {
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("reporte-ictericia-neonatal.pdf");
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al generar el PDF. Intenta nuevamente.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled || isExporting}
        className="flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
      >
        {isExporting ? "Generando PDF..." : "Exportar PDF / Imprimir ficha"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
