# @nebel/engine

Physiologische Engine für Nebel. Implementiert das erweiterte Hovorka-Modell (ExtHovorka, 16 Zustände) nach `../docs/10_Engine_Spec_V2_ExtHovorka.md`.

## Regeln

0. **Echtzeit zuerst denken.** Die Engine laeuft in Haeppchen, nicht am Stueck. Jede Erweiterung muss eine Nachholintegration ueberstehen, ohne das Ergebnis zu aendern. Deshalb ist der Zufall zaehlerbasiert und der Zustand serialisierbar.

1. **Kein Code aus py-mgipsim.** Die Referenzimplementierung steht unter GPL-3.0. Implementiert wird aus den publizierten Gleichungen; py-mgipsim dient ausschließlich als numerisches Vergleichsorakel in der Testsuite.
2. **Keine Patientendaten im Repo.** Die 20 Parametersätze werden zur Testzeit aus einem lokalen Klon unter `vendor/` gelesen. `vendor/` ist in `.gitignore`.
3. **Kein erfundener Parameter.** Jede Zahl stammt aus `../docs/20_Parameter_Registry.md` oder ist dort als Nebel-Annahme eingetragen.
4. **Schichten sind Einbahnstrassen.** Beobachtung aendert nie Physiologie. Die Beduerfnisschicht (`scenario/`) liest den Zustandsvektor nicht und schreibt ihn nicht — sie erzeugt hoechstens Events.
5. **Beobachtung aendert nie Physiologie.** Rauschen und Filter wirken ausschließlich in `observation.ts`.
6. **Determinismus.** Gleicher Subjekt-, Seed- und Eventstrom liefert bitgleich denselben Verlauf.

## Orakel einrichten

```
npm run oracle:fetch      # holt die Referenzimplementierung nach vendor/
npm run oracle:reference  # erzeugt daraus die Referenzwerte
```

Ohne diesen Schritt schlagen die Physiologie-Tests mit einer eindeutigen Meldung fehl. Das ist beabsichtigt.

## Kommandos

```
npm test          # Validierungsmatrix
npm run typecheck
```

## Implementierungsstand

Alle Module implementiert, 84 Tests gruen — einschliesslich Validierungsstufe 0, dem numerischen Abgleich gegen py-mgipsim.

**Ergebnis des Abgleichs:** Die Ableitungen stimmen ueber 120 zufaellige Zustandspunkte und drei Subjekte auf besser als 1e-12 relativ ueberein, eine 24-Stunden-Trajektorie mit Mahlzeit, Bolus und Belastungsblock auf besser als 1e-9 mmol/L. Eine Gegenprobe mit einem um 1 % verstimmten Parameter faellt auf — der Vergleich ist also scharf und nicht aus einem trivialen Grund gruen.

Damit sind auch die Groessenordnungen bestaetigt, nicht nur das qualitative Verhalten.

| Modul | Status |
|---|---|
| `units.ts` | fertig |
| `state.ts` | fertig, inkl. Serialisierung |
| `events.ts` | fertig, inkl. `exerciseBlock` |
| `parameters.ts` | fertig |
| `pump.ts` | fertig — Basalprofil, Bolus, Temp-Basal, gesetzte Basalrate, IOB als Anzeigegroesse |
| `model.ts` | fertig — 16 Gleichungen, Gleichgewicht per Relaxation |
| `solver.ts` | fertig — Euler und RK4 |
| `simulate.ts` | fertig |
| `calibration.ts` | fertig — Nebel-Kalibrierung (`tsub` 5 min, `tmaxI` 50 min) mit Beleg; `nebelParameters()` fuer App und Werkzeuge, Quellwerte bleiben fuer das Orakel |
| `observation.ts` | fertig — Sensormodell V2 (Standard) und G6-Fehlermodell (Vettoretti 2019) zum Vergleich, zaehlerbasiert, 5-min-Raster |
| `realtime.ts` | fertig — Nachholintegration, Append-only, Sandbox-Fork |
| `scenario/needs.ts` | fertig — Reserven und Hunger, Szenarioschicht |
| `nutrition.ts` | fertig — Fett und Eiweiss als Eingaenge ohne neuen Zustand: Magenverzoegerung, Fett-Insulinresistenz (`siFactor`), spaete Glukose aus Eiweiss (`uProteinGlucose`), Essdauer. Ohne diese Angaben exakt die Quelle. `../docs/11_Fett_und_Eiweiss.md` |
| `scenario/nutrition-check.ts` | fertig — Studienszenarien Wolpert, Paterson, Smart, O'Connell zur Kalibrierung und Gegenprobe |

## Bekannte Eigenheiten

**Herzfrequenz ist eine interpolierte Spur.** Ereignisse sind Stuetzstellen, dazwischen wird linear interpoliert. Ein Belastungsblock braucht deshalb drei Punkte — dafuer gibt es `exerciseBlock(start, dauer, bpm, ruhepuls)`. Zwei Punkte ergeben eine ueber den ganzen Block abfallende Rampe und damit etwa die halbe Wirkung.

**Das Basalgleichgewicht wird ausintegriert, nicht algebraisch geloest.** Bei einer gefitteten Basalrate hat das Residuum der Glukosebilanz eine tangentiale Nullstelle — ohne Vorzeichenwechsel scheitert jedes Bisektionsverfahren. 72 Stunden Relaxation mit RK4 sind robust und kosten nichts.

**Referenzwerte erzeugen:** `npm run oracle:reference` (braucht python3 mit numpy). Laedt nur die Gleichungsfunktion aus py-mgipsim, fuehrt sie aus und schreibt eine Zahlentabelle nach `vendor/oracle-reference.json`. Kein Code wird uebernommen, die Ausgabe ist gitignored.

**App:** `npm run viewer` baut neben dem Viewer auch die App nach `dist/site/` (`index.html`, `personen-daten.js` mit den zehn Parametersaetzen unter GPL-3.0, `rechtliches.html`, `fonts/`, `lizenzen/`); `dist/nebel.html` leitet nur noch dorthin weiter. `npm run viewer -- --release` bricht ab, wenn Impressumsangaben (`NEBEL_IMPRESSUM_NAME`, `NEBEL_IMPRESSUM_ANSCHRIFT`, `NEBEL_IMPRESSUM_EMAIL`), Lizenztexte oder Schriften fehlen oder eine Seite fremde Server anfragt — so baut die GitHub Action. Die App ist der Prototyp aus `../index.html`, dessen Simulationskern durch einen Adapter auf diese Engine ersetzt wurde. Die Oberflaeche ist unveraendert: sie spricht weiterhin `eng.s.t`, `eng.lastSensor`, `eng.trace`, `eng.step()`. Der Adapter liegt in `../app/adapter.js`, die zusammengesetzte Vorlage in `../app/template.html`.

`npm run check:adapter` prueft den Adapter ohne Browser: haelt Basal den Wert, hebt eine Mahlzeit ihn, faellt IOB, leeren sich die Reserven unter Belastung, reagieren schwacher und starker Responder unterschiedlich.

**Viewer:** `npm run viewer` baut `dist/nebel-viewer.html` — eine einzelne, selbstenthaltene Datei zum Doppelklicken. Engine und alle 20 Subjektparameter sind eingebettet, damit die Seite ohne Server ueber `file://` laeuft. Weil die Parametersaetze darin stecken, landet sie in `dist/` und ist gitignored.

Der Viewer zeigt physiologische Glukose und Sensorwert als getrennte Kurven, den vollstaendigen 16er-Zustandsvektor am Zeiger und laesst Mahlzeit, Bolus, Belastung, Temp-Basal und Pumpenstopp an der Zeigerposition einsetzen. Er ist das Entwicklerwerkzeug fuer die Engine und die Vorlage fuer den spaeteren Analyse-Screen.

**Sensorkalibrierung:** `node scripts/cgm-calibration.cjs` vergleicht ueber alle 20 Subjekte nur Verzoegerung, G6-Labormodell und Sensormodell V2: MARD im Messbereich 40–400 mg/dL, nach Glukosebereich, und die Schrittweite von Wert zu Wert in ruhigen Nachtphasen.

**Fett und Eiweiss:** `node scripts/nutrition-calibration.cjs` rechnet die vier Studien nach (Referenzperson, Mittel der 20 Subjekte, die zehn Personen der App); mit `--fit` werden `fatResistancePerG` und `proteinGlucoseYield` neu kalibriert. Braucht `dist/engine.cjs` (`npm run check:adapter`) und den Referenzdatensatz.

**Rauchtest:** `npm run smoke` laesst sechs Alltagsszenarien laufen und druckt den Verlauf in mg/dL. Fuer den Augenschein, nicht als Beleg.
