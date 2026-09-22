/**
 * Rauchtest: laesst ein paar Alltagsszenarien laufen und druckt den Verlauf.
 * Kein Ersatz fuer die Testsuite — dient dem Augenschein, ob die Physiologie
 * qualitativ stimmt. Aufruf: npm run smoke
 */
import { simulate } from "../src/simulate.js";
import { flatBasalProfile } from "../src/pump.js";
import { DEFAULT_SENSOR } from "../src/observation.js";
import { withPopulationConstants } from "../src/parameters.js";
import { mmollToMgdl } from "../src/units.js";
import { readFileSync } from "node:fs";
const raw = JSON.parse(readFileSync("../vendor/py-mgipsim/pymgipsim/VirtualPatient/Models/T1DM/ExtHovorka/Patients/Patient_1.json","utf8"));
const m = raw.model_parameters, d = raw.demographic_info;
const p = withPopulationConstants({kb1:m.kb1,kb2:m.kb2,kb3:m.kb3,EGP0:m.EGP0,F01:m.F01,tmaxI:m.tmaxI,p3:m.p3,p4:m.p4,p5:m.p5,BW:m.BW,HRrest:m.HRrest,HRmax:m.HRmax,VG:m.VG,VI:m.VI,VT_HRR:m.VT_HRR});
const therapy = { basalRateUPerH: d.basal, carbRatioGPerU: d.carb_insulin_ratio, correctionFactor: d.correction_bolus };
const carbs = 60, bolus = carbs / therapy.carbRatioGPerU;
const run = (label: string, events: any[], p3?: number, p4?: number) => {
  const pp = p3 ? { ...p, p3, p4: p4! } : p;
  const r = simulate({ durationMin: 720, stepMin: 1, parameters: pp, therapy,
    pump: flatBasalProfile(therapy.basalRateUPerH), events, sensor: DEFAULT_SENSOR, solver: "rk4" });
  const at = (min: number) => mmollToMgdl(r.G[min - 1]!).toFixed(0);
  console.log(`${label.padEnd(34)} 0h=${at(1)} 1h=${at(60)} 2h=${at(120)} 3h=${at(180)} 5h=${at(300)} 8h=${at(480)} 12h=${at(720)} mg/dL`);
};
console.log(`Patient_1: BW ${p.BW.toFixed(0)} kg, Basal ${therapy.basalRateUPerH.toFixed(2)} U/h, KE-Faktor ${therapy.carbRatioGPerU}, Bolus fuer ${carbs} g = ${bolus.toFixed(1)} U`);
run("nur Basal", []);
run("60 g ohne Bolus", [{kind:"meal",t:60,fastCarbsG:carbs,slowCarbsG:0}]);
run("60 g + Bolus gleichzeitig", [{kind:"meal",t:60,fastCarbsG:carbs,slowCarbsG:0},{kind:"bolus",t:60,units:bolus}]);
run("60 g + Bolus 15 min vorher", [{kind:"meal",t:60,fastCarbsG:carbs,slowCarbsG:0},{kind:"bolus",t:45,units:bolus}]);
const hrMod = p.HRrest + 0.5*(p.HRmax-p.HRrest), hrHard = p.HRrest + 0.95*(p.HRmax-p.HRrest);
run("45 min moderater Sport", [{kind:"heartRate",t:60,bpm:hrMod},{kind:"heartRate",t:104,bpm:hrMod},{kind:"heartRate",t:105,bpm:p.HRrest}]);
run("15 min Intervalle hart", [{kind:"heartRate",t:60,bpm:hrHard},{kind:"heartRate",t:74,bpm:hrHard},{kind:"heartRate",t:75,bpm:p.HRrest}]);
run("60 min Sport, starker Responder", [{kind:"heartRate",t:60,bpm:hrMod},{kind:"heartRate",t:119,bpm:hrMod},{kind:"heartRate",t:120,bpm:p.HRrest}], 9.7, 4.8);
