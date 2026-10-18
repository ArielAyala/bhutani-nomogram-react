# Nomograma de Bhutani - Evaluación de Ictericia Neonatal

> **Idioma:** Actualmente la aplicación está disponible **únicamente en español**. La interfaz, los mensajes clínicos y esta documentación en español son la versión de referencia. Ver [README.md](./README.md) para la versión en inglés.

**Demo en vivo:** [https://nomograma-bhutani.arielayala.me/](https://nomograma-bhutani.arielayala.me/)

Aplicación web de una sola página (Next.js App Router) que evalúa la ictericia neonatal combinando el **nomograma de Bhutani** (zonas de riesgo según la edad posnatal) con los **umbrales de fototerapia y exanguinotransfusión de las Guías AAP 2004**.

---

## Aviso legal - Uso exclusivamente didáctico

**Este proyecto tiene fines exclusivamente didácticos.**

- **No** debe utilizarse para diagnóstico médico, decisiones de tratamiento ni manejo clínico de pacientes.
- Los cálculos pueden contener errores. Los datos de percentiles y umbrales son una digitalización aproximada de curvas publicadas, no una fuente validada clínicamente.
- **No** se debe depender únicamente del valor que arroje la aplicación. Cualquier recomendación mostrada debe verificarse contra las publicaciones originales y ser evaluada por un profesional de salud calificado, quien tiene la responsabilidad clínica final.
- Los autores no asumen responsabilidad alguna por el uso de este software ni de sus resultados.

---

## Funcionalidades

- **Gráfica del nomograma de Bhutani** con las curvas de riesgo P40, P75 y P95, y el punto del paciente ubicado en su hora posnatal exacta.
- **Umbrales AAP 2004** de fototerapia y exanguinotransfusión, según la edad gestacional y la presencia de factores de riesgo neurotóxico.
- **Unidades de entrada**: bilirrubina en mg/dL o µmol/L (se convierte internamente a mg/dL).
- **Tipo de medición**: transcutánea (TcB) o sérica total (TSB). Se muestra una advertencia para TcB, que es un método de screening.
- **Edad gestacional**: <35 semanas, 35-37.6 semanas y ≥38 semanas.
- **Factores de riesgo neurotóxico**: enfermedad hemolítica, deficiencia de G6PD, asfixia, letargia significativa, inestabilidad térmica, sepsis, albúmina sérica < 3.0 g/dL y acidosis.
- **Datos clínicos adicionales**: incompatibilidad ABO/Rh (con evaluación de la tasa de ascenso a partir de una medición previa), encefalopatía aguda y reingreso.
- **Motor de recomendaciones** con un orden de prioridad definido (ver más abajo).
- **Exportación a PDF** del reporte completo (formulario, tarjeta de resultado y gráfica), dividido en páginas cuando es necesario.
- **Tema claro / oscuro**.

### Orden de prioridad de las recomendaciones

1. Edad gestacional `<35` semanas: remitir a protocolos de UCIN (los umbrales no se calculan).
2. Encefalopatía aguda: exanguinotransfusión urgente.
3. Tasa de ascenso superior al límite para la incompatibilidad (ABO > 1 mg/dL/h, Rh > 0.5 mg/dL/h): exanguinotransfusión.
4. Bilirrubina dentro del rango de exanguinotransfusión: exanguinotransfusión (o fototerapia intensiva si el paciente es un reingreso).
5. Bilirrubina igual o superior al umbral de fototerapia: fototerapia inmediata.
6. Zona intermedia de Bhutani: repetir TSB en 8-12 horas.
7. Zona baja de Bhutani: alta con seguimiento a las 48 horas.
8. Caso por defecto: seguimiento clínico según criterio médico.

---

## Stack tecnológico

- [Next.js](https://nextjs.org) 16 (App Router) y React 19
- TypeScript
- Tailwind CSS 4 (modo oscuro con la estrategia `class`)
- [Recharts](https://recharts.org) para la gráfica del nomograma
- [jsPDF](https://github.com/parallax/jsPDF) y [html2canvas-pro](https://github.com/yorickshan/html2canvas-pro) para la exportación a PDF (cargados dinámicamente)
- ESLint

---

## Estructura del proyecto

```
app/
  page.tsx            # Página principal: estado y orquestación
  layout.tsx          # Layout raíz, metadatos, script de tema anti-FOUC
  globals.css
components/
  PatientForm.tsx     # Formulario de datos del paciente
  RiskCard.tsx        # Tarjeta de resultado (zona de riesgo, recomendación, avisos)
  BhutaniChart.tsx    # Gráfica del nomograma
  ExportButton.tsx    # Exportación a PDF
  ThemeToggle.tsx     # Selector de tema claro / oscuro
lib/
  clinical-logic.ts   # Lógica pura: evaluatePatient()
  bhutani-data.ts     # Datos del nomograma de Bhutani y cálculo de zona
  aap-thresholds.ts   # Curvas AAP 2004 de fototerapia y exanguinotransfusión
  types.ts            # Tipos compartidos
```

La carpeta `lib/` contiene lógica clínica pura, sin interfaz. Los componentes solo reciben datos ya calculados mediante props.

---

## Primeros pasos

### Requisitos

- Node.js 20 o superior
- npm (u otro gestor de paquetes)

### Instalación

```bash
git clone <url-del-repositorio>
cd bhutani-nomogram-react
npm install
```

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### Scripts disponibles

| Comando         | Descripción                                        |
| --------------- | -------------------------------------------------- |
| `npm run dev`   | Inicia el servidor de desarrollo                   |
| `npm run build` | Build de producción (incluye verificación de TypeScript) |
| `npm run start` | Sirve el build de producción                       |
| `npm run lint`  | Ejecuta ESLint                                     |

La verificación del proyecto se realiza con `npm run build` y `npm run lint`, además de los casos de prueba manuales documentados al final de `lib/clinical-logic.ts`.

---

## Referencias clínicas

- Bhutani VK, Johnson L, Sivieri EM. *Predictive ability of a predischarge hour-specific serum bilirubin for subsequent significant hyperbilirubinemia in healthy term and near-term newborns.* Pediatrics. 1999;104(1):6-14.
- American Academy of Pediatrics Subcommittee on Hyperbilirubinemia. *Clinical practice guideline: management of hyperbilirubinemia in the newborn infant 35 or more weeks of gestation.* Pediatrics. 2004;114(1):297-316.

---

## Despliegue

La aplicación es un proyecto Next.js que puede desplegarse en cualquier plataforma compatible, como [Vercel](https://vercel.com/new). Consulta la [documentación de despliegue de Next.js](https://nextjs.org/docs/app/building-your-application/deploying).

---

## Contribuir

Las contribuciones son bienvenidas. Ten en cuenta las reglas del proyecto:

- La lógica clínica vive en `lib/`; los umbrales no deben estar codificados en los componentes.
- Los cambios en los valores clínicos deben documentarse como aproximaciones en los comentarios.
- No agregar pruebas unitarias ni frameworks de testing al proyecto.
