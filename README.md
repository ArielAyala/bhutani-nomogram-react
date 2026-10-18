# Bhutani Nomogram - Neonatal Jaundice Assessment

> **Language:** This app is currently available **only in Spanish**. The interface, clinical messages and this documentation in Spanish are the reference versions. See [README.es.md](./README.es.md).

**Live demo:** [https://nomograma-bhutani.arielayala.me/](https://nomograma-bhutani.arielayala.me/)

Single-page web application (Next.js App Router) that assesses neonatal jaundice by combining the **Bhutani nomogram** (risk zones by postnatal age) with the **AAP 2004 guidelines** for phototherapy and exchange transfusion thresholds.

---

## Disclaimer - Educational Use Only

**This project is for educational purposes only.**

- It must **not** be used for medical diagnosis, treatment decisions, or clinical management of patients.
- The calculations may contain errors. The threshold and percentile data are an approximate digitization of published curves, not a clinically validated source.
- Do **not** rely solely on the output of this application. Any recommendation shown must be verified against the original publications and evaluated by a qualified healthcare professional, who holds the final clinical responsibility.
- The authors accept no liability for any use of this software or of its results.

---

## Features

- **Bhutani nomogram chart** with P40, P75 and P95 risk curves, and the patient's point plotted at the exact postnatal hour.
- **AAP 2004 thresholds** for phototherapy and exchange transfusion, based on gestational age and the presence of neurotoxicity risk factors.
- **Input units**: bilirubin in mg/dL or µmol/L (converted internally to mg/dL).
- **Measurement type**: transcutaneous (TcB) or total serum (TSB). A warning is shown for TcB, which is a screening method.
- **Gestational age**: <35 weeks, 35-37.6 weeks, and ≥38 weeks.
- **Neurotoxicity risk factors**: hemolytic disease, G6PD deficiency, asphyxia, significant lethargy, thermal instability, sepsis, serum albumin < 3.0 g/dL, and acidosis.
- **Additional clinical data**: ABO/Rh incompatibility (with rate-of-rise evaluation from a previous measurement), acute encephalopathy, and rehospitalization.
- **Recommendation engine** with a defined priority order (see below).
- **PDF export** of the full report (form, result card and chart), split across pages when needed.
- **Light / dark theme**.
- **Usage notice**: on the first visit in each browser, a modal shows the educational-use notice, which must be accepted with "Entendido" before using the app.

### Recommendation priority

1. Gestational age `<35` weeks: refer to NICU protocols (thresholds are not calculated).
2. Acute encephalopathy: urgent exchange transfusion.
3. Rate of rise above the limit for the incompatibility (ABO > 1 mg/dL/h, Rh > 0.5 mg/dL/h): exchange transfusion.
4. Bilirubin within the exchange range: exchange transfusion (or intensive phototherapy if the patient is a readmission).
5. Bilirubin at or above the phototherapy threshold: immediate phototherapy.
6. Intermediate Bhutani zone: repeat TSB in 8-12 hours.
7. Low Bhutani zone: discharge with follow-up at 48 hours.
8. Fallback: clinical follow-up per medical criteria.

---

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router) and React 19
- TypeScript
- Tailwind CSS 4 (dark mode with the `class` strategy)
- [Recharts](https://recharts.org) for the nomogram chart
- [jsPDF](https://github.com/parallax/jsPDF) and [html2canvas-pro](https://github.com/yorickshan/html2canvas-pro) for PDF export (loaded dynamically)
- ESLint

---

## Project Structure

```
app/
  page.tsx            # Main page: state and orchestration
  layout.tsx          # Root layout, metadata, anti-FOUC theme script
  globals.css
components/
  PatientForm.tsx     # Patient data form
  RiskCard.tsx        # Result card (risk zone, recommendation, warnings)
  BhutaniChart.tsx    # Nomogram chart
  ExportButton.tsx    # PDF export
  ThemeToggle.tsx     # Light / dark toggle
lib/
  clinical-logic.ts   # Pure logic: evaluatePatient()
  bhutani-data.ts     # Bhutani nomogram data and zone calculation
  aap-thresholds.ts   # AAP 2004 phototherapy and exchange curves
  types.ts            # Shared types
```

The `lib/` folder contains pure clinical logic with no UI. Components only receive already computed data through props.

---

## Getting Started

### Requirements

- Node.js 20 or later
- npm (or another package manager)

### Installation

```bash
git clone <repository-url>
cd bhutani-nomogram-react
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available scripts

| Command         | Description                                   |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Starts the development server                 |
| `npm run build` | Production build (includes TypeScript check)  |
| `npm run start` | Serves the production build                   |
| `npm run lint`  | Runs ESLint                                   |

Verification of the project is done with `npm run build` and `npm run lint`, plus the manual test cases documented at the end of `lib/clinical-logic.ts`.

---

## Clinical References

- Bhutani VK, Johnson L, Sivieri EM. *Predictive ability of a predischarge hour-specific serum bilirubin for subsequent significant hyperbilirubinemia in healthy term and near-term newborns.* Pediatrics. 1999;104(1):6-14.
- American Academy of Pediatrics Subcommittee on Hyperbilirubinemia. *Clinical practice guideline: management of hyperbilirubinemia in the newborn infant 35 or more weeks of gestation.* Pediatrics. 2004;114(1):297-316.

---

## Deploy

The application is a Next.js project and can be deployed to any platform that supports Next.js, such as [Vercel](https://vercel.com/new). See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---

## Contributing

Contributions are welcome. Please keep the project rules in mind:

- Clinical logic lives in `lib/`; thresholds must not be hardcoded in components.
- Changes to the clinical numbers must be documented as approximations in comments.
- Do not add unit tests or testing frameworks to the project.
