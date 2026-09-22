import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { SubjectParameters, TherapySettings } from "../src/parameters.js";
import { withPopulationConstants } from "../src/parameters.js";

const ORACLE_SUBPATH = "pymgipsim/VirtualPatient/Models/T1DM/ExtHovorka";

/**
 * Wurzel des Referenzdatensatzes. Standard: vendor/py-mgipsim im Engine-Ordner.
 * Liegt der Klon woanders (z. B. ausserhalb von OneDrive), setze NEBEL_ORACLE
 * auf das Wurzelverzeichnis des Klons.
 */
const ORACLE_ROOT = resolve(
  process.env.NEBEL_ORACLE ?? resolve(process.cwd(), "vendor/py-mgipsim"),
  ORACLE_SUBPATH,
);

export const oracleAvailable = (): boolean => existsSync(ORACLE_ROOT);

export const ORACLE_HINT =
  "Referenzdatensatz fehlt. 'npm run oracle:fetch' ausfuehren oder NEBEL_ORACLE auf einen vorhandenen Klon setzen. " +
  "Die Parametersaetze werden bewusst nicht im Repo gehalten (GPL-3.0).";

/** Laedt einen publizierten Parametersatz. Nie erfundene Werte. */
export const loadSubject = (n = 1): SubjectParameters => {
  if (!oracleAvailable()) throw new Error(ORACLE_HINT);
  const raw = JSON.parse(readFileSync(resolve(ORACLE_ROOT, `Patients/Patient_${n}.json`), "utf8"));
  const m = raw.model_parameters;
  return {
    kb1: m.kb1, kb2: m.kb2, kb3: m.kb3, EGP0: m.EGP0, F01: m.F01,
    tmaxI: m.tmaxI, p3: m.p3, p4: m.p4, p5: m.p5, BW: m.BW,
    HRrest: m.HRrest, HRmax: m.HRmax, VG: m.VG, VI: m.VI, VT_HRR: m.VT_HRR,
  };
};

export const loadTherapy = (n = 1): TherapySettings => {
  if (!oracleAvailable()) throw new Error(ORACLE_HINT);
  const raw = JSON.parse(readFileSync(resolve(ORACLE_ROOT, `Patients/Patient_${n}.json`), "utf8"));
  const d = raw.demographic_info;
  return {
    basalRateUPerH: d.basal,
    carbRatioGPerU: d.carb_insulin_ratio,
    correctionFactor: d.correction_bolus,
  };
};

export const subjectParams = (n = 1) => withPopulationConstants(loadSubject(n));

/** Referenzwerte aus py-mgipsim, erzeugt von scripts/oracle_reference.py. */
export interface OracleFixture {
  subjects: Record<string, {
    derivativeCases: {
      state: number[];
      inputs: { uFastCarbs: number; uSlowCarbs: number; uHR: number; uInsulin: number };
      d: number[];
    }[];
    trajectory: {
      startState: number[];
      basalMUPerMin: number;
      mealMmol: number;
      bolusMU: number;
      hrExercise: number;
      G: number[];
    };
  }>;
}

const REFERENCE_PATH = resolve(process.cwd(), "vendor/oracle-reference.json");

export const referenceAvailable = (): boolean => existsSync(REFERENCE_PATH);

export const REFERENCE_HINT =
  "Referenzwerte fehlen. 'npm run oracle:reference' ausfuehren (braucht python3 mit numpy).";

export const loadReference = (): OracleFixture => {
  if (!referenceAvailable()) throw new Error(REFERENCE_HINT);
  return JSON.parse(readFileSync(REFERENCE_PATH, "utf8")) as OracleFixture;
};

export const subjectNumber = (key: string): number => Number(key.replace("Patient_", ""));
