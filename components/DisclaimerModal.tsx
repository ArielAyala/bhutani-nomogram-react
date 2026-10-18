"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// Clave versionada: si cambia el texto legal, subir la versión para volver a mostrar el aviso.
// Debe coincidir con DISCLAIMER_STORAGE_KEY usado en app/layout.tsx.
const DISCLAIMER_STORAGE_KEY = "disclaimer-accepted-v1";
const PENDING_ATTRIBUTE = "data-disclaimer-pending";
const CHANGE_EVENT = "disclaimer-change";

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(DISCLAIMER_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

// En el servidor (y durante la hidratación) se asume "aceptado" para no renderizar
// el modal abierto; el efecto lo abre en el cliente si corresponde.
function getServerSnapshot(): boolean {
  return true;
}

function acceptDisclaimer() {
  try {
    window.localStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
  } catch {
    // Si el almacenamiento no está disponible, el aviso volverá a mostrarse.
  }
  document.documentElement.removeAttribute(PENDING_ATTRIBUTE);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export default function DisclaimerModal() {
  const accepted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!accepted && !dialog.open) {
      dialog.showModal();
      document.documentElement.removeAttribute(PENDING_ATTRIBUTE);
    } else if (accepted && dialog.open) {
      dialog.close();
    }
  }, [accepted]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => event.preventDefault()}
      aria-labelledby="disclaimer-title"
      aria-describedby="disclaimer-body"
      className="m-auto max-h-[92dvh] w-[92vw] max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <h2
          id="disclaimer-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          Aviso de uso didáctico
        </h2>

        <div
          id="disclaimer-body"
          className="flex flex-col gap-3 text-sm text-slate-700 dark:text-slate-300"
        >
          <p>
            Esta aplicación tiene <strong>fines exclusivamente didácticos</strong>.
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              No debe utilizarse para diagnóstico médico, decisiones de
              tratamiento ni manejo clínico de pacientes.
            </li>
            <li>
              Los cálculos pueden contener errores. Los datos son una
              digitalización aproximada de curvas publicadas y no están
              validados clínicamente.
            </li>
            <li>
              No debe depender únicamente del valor que arroje la aplicación.
            </li>
            <li>
              Cualquier recomendación debe verificarse con las publicaciones
              originales y ser evaluada por un profesional de salud calificado,
              quien tiene la responsabilidad clínica final.
            </li>
            <li>
              Los autores no asumen responsabilidad alguna por el uso de este
              software ni de sus resultados.
            </li>
          </ul>
          <p>
            Al presionar <strong>«Entendido»</strong> confirmas que leíste y
            comprendiste este aviso.
          </p>
        </div>

        <div className="flex justify-stretch sm:justify-end">
          <button
            type="button"
            onClick={acceptDisclaimer}
            className="w-full rounded-md bg-sky-600 px-4 py-3 font-medium sm:w-auto sm:py-2 text-white transition-colors hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            Entendido
          </button>
        </div>
      </div>
    </dialog>
  );
}
