import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bhutani Nomogram — Evaluación de Ictericia Neonatal",
  description:
    "Evaluación clínico-nomográmica de ictericia neonatal basada en el Nomograma de Bhutani y las Guías AAP 2004.",
};

// Marca el documento como "pendiente de aviso" antes de hidratar, para ocultar el
// contenido hasta que el modal se abra. La clave debe coincidir con
// components/DisclaimerModal.tsx.
const DISCLAIMER_INIT_SCRIPT = `
(function () {
  try {
    if (window.localStorage.getItem("disclaimer-accepted-v1") !== "true") {
      document.documentElement.setAttribute("data-disclaimer-pending", "");
    }
  } catch (e) {}
})();
`;

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("theme");
    var theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: DISCLAIMER_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
