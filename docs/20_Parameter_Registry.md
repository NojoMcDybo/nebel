# Nebel — Parameter Registry V1 (ExtHovorka)

Stand: 2026-09-24
Quelle aller Werte: ExtHovorka / py-mgipsim, 20 virtuelle Patienten (`Patient_1..20.json`)
Ranges sind **beobachtete Werte über diese 20 Subjekte**, keine publizierten Populationsverteilungen. Das ist ein Unterschied und wird nicht verwischt.

Kalibrierstatus-Legende:
- **Q** = Quellwert, unverändert übernommen
- **QF** = Quellwert, populationsfest (in allen 20 Subjekten identisch)
- **N** = Nebel-Annahme, von uns gesetzt
- **X** = im Quellmodell vorhanden, aber unbenutzt — nicht portieren

---

## 1. Subjektspezifische Parameter (16)

| Parameter | Einheit | Bedeutung | min | median | max | Status |
|---|---|---|---|---|---|---|
| `kb1` | 1/min² pro mU/L | Verstärkung Insulinwirkung Transport | 2.577e-5 | 7.286e-5 | 1.163e-4 | Q |
| `kb2` | 1/min² pro mU/L | Verstärkung Insulinwirkung Utilisation | 5.048e-6 | 6.452e-6 | 1.018e-5 | Q |
| `kb3` | 1/min pro mU/L | Verstärkung Insulinwirkung EGP-Suppression | 1.898e-4 | 8.254e-4 | 1.710e-3 | Q |
| `EGP0` | mmol/min | Endogene Glukoseproduktion bei null Insulinwirkung | 0.563 | 1.547 | 2.875 | Q |
| `F01` | mmol/min/kg | Nicht-insulinabhängige Glukoseaufnahme pro kg | 2.444e-3 | 8.425e-3 | 2.037e-2 | Q |
| `tmaxI` | min | Zeitkonstante der subkutanen Insulinabsorption | 57.9 | 109.0 | 130.7 | Q — **im Nebel-Parametersatz 50 min für alle (N, an Fachinformation kalibriert, Abschnitt 7)** |
| `p3` | mmol/min | Bewegungsgetriebener Glukosefluss ins periphere Kompartiment | 1.886 | 9.699 | 25.72 | Q |
| `p4` | mmol/min | Bewegungsgetriebener peripherer Verbrauch | 1.598 | 2.851 | 4.844 | Q |
| `p5` | mmol | Verlängerter Nacheffekt der Belastung (über `x2`) | 0.944 | 3.212 | 5.169 | Q |
| `BW` | kg | Körpergewicht | 61.5 | 73.3 | 88.2 | Q |
| `HRrest` | bpm | Ruheherzfrequenz | 54.8 | 66.0 | 77.7 | Q |
| `HRmax` | bpm | Maximale Herzfrequenz | 187.2 | 194.6 | 203.6 | Q |
| `VG` | L | Verteilungsvolumen Glukose | 9.84 | 11.72 | 14.10 | Q |
| `VI` | L | Verteilungsvolumen Insulin | 7.38 | 8.79 | 10.58 | Q |
| `VT_HRR` | – | Ventilatorische Schwelle als Anteil der HF-Reserve | 0.640 | 0.786 | 0.866 | Q |
| `beta` | – | **Unbenutzt** — Rest des alten Exercise-Modells | 2.636 | 5.067 | 6.898 | X |

Bemerkenswert für Nebel: Die individuelle Bewegungsantwort variiert fast ausschließlich über `p3`, `p4`, `p5`, `HRrest`, `HRmax` und `VT_HRR`. `p3` spannt den Faktor 13 zwischen dem schwächsten und dem stärksten Responder — das ist die quantitative Grundlage für die im Risk Review geforderte „heterogene Reaktion auf Belastung".

## 2. Populationsfeste Parameter (19)

| Parameter | Einheit | Bedeutung | Wert | Status |
|---|---|---|---|---|
| `ke` | 1/min | Insulin-Eliminationsrate | 0.138 | QF |
| `k12` | 1/min | Transferrate peripher → zentral | 0.066 | QF |
| `ka1` | 1/min | Abklingrate Insulinwirkung Transport | 0.006 | QF |
| `ka2` | 1/min | Abklingrate Insulinwirkung Utilisation | 0.06 | QF |
| `ka3` | 1/min | Abklingrate Insulinwirkung EGP | 0.03 | QF |
| `AG` | – | Bioverfügbare Kohlenhydratfraktion | 0.8 | QF |
| `tmaxG` | min | Zeitkonstante langsame KH-Absorption | 40 | QF |
| `tmaxGFast` | min | Zeitkonstante schnelle KH-Absorption | 20 | QF |
| `tsub` | min | Verzögerung Plasma → Interstitium | 15 → **5** | QF / N ⚠ |
| `aSI` | – | Formparameter nichtlineare Insulinsensitivität | −1.9 | QF |
| `b` | mmol/L | Skalenparameter des `tanh`-Mappings | 0.28 | QF |
| `c` | – | Offset des `tanh`-Mappings | 7 | QF |
| `dSI` | – | Verschiebung des `tanh`-Mappings | −12 | QF |
| `p1` | – | EGP-Erhöhung durch moderate Belastung | 2.73 | QF |
| `p2` | – | EGP-Erhöhung durch hochintensive Belastung | 8.23 | QF |
| `p6` | 1/min | Zeitkonstante schnelle Bewegungsantwort | 0.18 | QF |
| `p7` | 1/min | Abklingrate des Nacheffekts | 0.1 | QF |
| `p8` | 1/min | Zeitkonstante hochintensiver Pfad | 0.1 | QF |
| `a` | – | **Unbenutzt** — Rest des alten Exercise-Modells | 0.16–0.86 | X |

⚠ **Der einzige Parameter mit zwei Werten — bewusst, und getrennt geführt.**

| | Wert | Verwendung |
|---|---|---|
| Quellwert (ExtHovorka) | 15 min | Engine und Orakelabgleich. Unverändert, sonst wäre Validierungsstufe 0 wertlos |
| Nebel-Kalibrierung | 5 min | Nur in der Anwendung (`app/adapter.js`), für die angezeigte Sensorverzögerung |

Begründung: ISPAD gibt die physiologische Verzögerung mit 5 bis 10 min an, der Quellwert von 15 min liegt darüber. Die Kalibrierung ist damit **besser belegt** als der Quellwert, nicht schlechter.

Zulässig ist der Eingriff, weil `tsub` ausschließlich in die Beobachtungsschicht fällt: `IG` wird von keinem anderen Zustand gelesen, `dIG/dt = (G − IG)/tsub` ist eine Einbahnstraße. Die Physiologie bleibt unberührt, und Abschnitt 8 der Spec führt die Beobachtungsschicht ohnehin als Nebel-Eigenleistung.

Kein Freibrief: Für jeden Parameter **innerhalb** der Physiologie gilt weiterhin, dass der Quellwert unverändert bleibt.

## 3. Modellkonstanten (nicht parametrisiert)

| Konstante | Wert | Bedeutung |
|---|---|---|
| F01-Schwelle | 4.5 mmol/L | Unterhalb: lineare Reduktion der ZNS-Aufnahme |
| Renale Schwelle | 9 mmol/L | Oberhalb: zusätzliche Elimination |
| Renale Steigung | 0.003 | Faktor in `FR` |
| Hyper-SI-Steigung | 0.018 | Faktor in `SIhyper` |
| SI-Normierungspunkt | 5 mmol/L | Bezugspunkt des `tanh`-Mappings |
| Hyper-SI-Bezugspunkt | 5.55 mmol/L | Nullpunkt von `SIhyper` |
| `Q1`-Klammerung | [VG, 32·VG] | Numerischer Schutz, **keine** Physiologie |

## 4. Demografie der 20 Subjekte

| Größe | min | median | max |
|---|---|---|---|
| Körpergewicht (kg) | 61.5 | 73.3 | 88.2 |
| Körpergröße (cm) | 165.5 | 170.4 | 179.8 |
| Basalrate (U/h) | 0.389 | 1.113 | 1.999 |
| Tagesbasal (U) | 6.53 | 16.01 | 35.18 |
| KE-Faktor (g KH pro U) | 14.0 | 18.1 | 24.5 |
| Korrekturfaktor | 27.8 | 48.0 | 74.3 |
| Ruhepuls (bpm) | 54.8 | 66.0 | 77.7 |
| HbA1c (%) | 5.65 | 6.45 | 7.61 |
| Taillenumfang (cm) | 76.2 | 84.6 | 105.5 |

Direkt nutzbar für die Pumpenschicht: Basalrate, KE-Faktor und Korrekturfaktor sind je Subjekt gegeben. Nebel muss keine Therapieparameter erfinden.

Nicht im Datensatz: Alter und Geschlecht. Alle 20 halten mit ihrer Basalrate exakt 108 mg/dL (6,0 mmol/L) — die Raten sind darauf gefittet, echte Tagesschwankung gibt es ohne Eingaben nicht.

Datensatzfehler: Das Feld `total_daily_basal` passt nicht zu `basal` × 24 (Verhältnis 1,02 bis 2,44, bei Patient 1 16,9 gegen 27,3 U). Bedeutung unklar; Nebel nutzt das Feld nicht.

### Verhalten im Nebel-Parametersatz (26.09.2026)

Gerechnet aus dem Gleichgewicht bei 108 mg/dL, ohne Sensorfehler. „60 g" = 24 g schnell + 36 g langsam, Bolus nach KE-Faktor 10 min vorher. „Sport" = 45 min bei 55 % der Herzfrequenzreserve, nüchtern. „Hart" = 20 min bei 90 %.

| P | kg | HbA1c | Basal U/h | 1 U senkt | 60 g + Bolus: Spitze / Tief | 60 g ohne Bolus | Sport moderat | Hart |
|---|---|---|---|---|---|---|---|---|
| 1 | 79 | 6,5 | 1,14 | 23 | 131 / 98 | 191 | −8 | +17 |
| 2 | 74 | 7,6 | 1,45 | 18 | 134 / 105 | 186 | 0 | +35 |
| 3 | 70 | 6,2 | 1,25 | 31 | 138 / 101 | 201 | −76 | +24 |
| 4 | 73 | 6,4 | 0,93 | 38 | 159 / 108 | 255 | −82 | +85 |
| 5 | 64 | 6,9 | 0,77 | 36 | 164 / 108 | 274 | −89 | 0 |
| 6 | 65 | 6,5 | 0,59 | 37 | 152 / 105 | 271 | −89 | 0 |
| 7 | 62 | 7,0 | 2,00 | 16 | 142 / 108 | 186 | −25 | +59 |
| 8 | 68 | 6,9 | 0,73 | 24 | 129 / 92 | 209 | −41 | +26 |
| 9 | 66 | 6,3 | 0,98 | 25 | 138 / 99 | 216 | −8 | +44 |
| 10 | 71 | 6,3 | 0,46 | 33 | 163 / 108 | 299 | −31 | +40 |
| 11 | 84 | 6,2 | 1,77 | 20 | 127 / 99 | 171 | −2 | +38 |
| 12 | 83 | 5,7 | 1,09 | 23 | 128 / 95 | 186 | −16 | +18 |
| 13 | 70 | 7,1 | 1,26 | 28 | 186 / 108 | 278 | −89 | +47 |
| 14 | 77 | 5,8 | 0,51 | 35 | 136 / 90 | 236 | −62 | +9 |
| 15 | 85 | 5,9 | 1,19 | 21 | 137 / 107 | 194 | −53 | +54 |
| 16 | 66 | 6,1 | 0,39 | 38 | 145 / 86 | 290 | −36 | +17 |
| 17 | 81 | 7,2 | 1,50 | 33 | 144 / 105 | 216 | −11 | +23 |
| 18 | 88 | 6,9 | 1,56 | 31 | 134 / 103 | 190 | −15 | +14 |
| 19 | 73 | 6,4 | 1,15 | 32 | 168 / 108 | 260 | −20 | +91 |
| 20 | 75 | 6,7 | 1,00 | 36 | 160 / 108 | 261 | −33 | +81 |
| **Median** | | | | **31** | **142** | **216** | **−33** | **+35** |

Lesart: Die größte Streuung liegt in der Bewegungsantwort (0 bis −89 mg/dL bei derselben moderaten Einheit), getragen von `p3`. Patient 1, das bisherige Standardsubjekt, ist bei Insulin und moderater Bewegung am schwachen Rand.

Einschränkung: Alle 20 Subjekte sind Erwachsene mit HbA1c zwischen 5.7 und 7.6 %. Kinder, Jugendliche und schlecht eingestellte Verläufe sind **nicht** abgedeckt. Das gehört in den Model Validity Envelope und in die Kommunikation gegenüber Nutzern.

Das trifft die Hauptzielgruppe direkt: Eltern von Kindern mit Typ-1-Diabetes sind die größte und am stärksten belastete Angehörigengruppe — und genau deren Situation bildet die Kohorte nicht ab. Kinderphysiologie (höherer Insulinbedarf pro kg, andere Absorptionszeiten, stärkere Variabilität) ist nicht durch Skalierung der Erwachsenenparameter zu erschlagen. V1 simuliert eine erwachsene Person; das muss im UI stehen, nicht im Kleingedruckten.

## 5. Sensorfehlermodell (Beobachtungsschicht)

Zwei Modelle im Code, eines in der Anwendung:

| Konstante | Modell | Verwendung |
|---|---|---|
| `REALISTIC_SENSOR` | **Nebel V2** (5.2) | App und Viewer, Standard |
| `LAB_G6_SENSOR` | publiziertes G6-Modell, unverändert (5.1) | Vergleich; im Viewer wählbar |

### 5.1 G6-Labormodell (Vettoretti 2019)

Quelle: Vettoretti et al. (2019), *Modeling the error of factory-calibrated continuous glucose monitoring sensors: application to Dexcom G6 sensor data*, Sensors 19(23):5320, Tabelle 1, Mediane der zweistufigen Identifikation. https://www.mdpi.com/1424-8220/19/23/5320

Modell: `CGM(t) = a(t) · IG(t) + b0 + v(t)`, mit `a(t) = a0 + a1·t + a2·t²` und `v(k) = α1·v(k−1) + α2·v(k−2) + w(k)`.

| Parameter | Einheit | Bedeutung | Median | IQR | Status |
|---|---|---|---|---|---|
| `a0` | – | Verstärkung beim Setzen | 0.95 | 0.91–0.99 | Q |
| `a1` | 1/Tag | lineare Drift der Verstärkung | 0.0039 | 0.0010–0.0072 | Q ⚠ |
| `a2` | 1/Tag² | quadratische Drift | −0.000027 | −0.000063–0.000009 | Q ⚠ |
| `b0` | mg/dL | Versatz | 0.14 | −2.19–2.54 | Q |
| `α1` | – | AR(2), erster Koeffizient | 0.62 | 0.56–0.70 | Q |
| `α2` | – | AR(2), zweiter Koeffizient | 0.22 | 0.14–0.31 | Q |
| `σ` | mg/dL | Standardabweichung des weißen Rauschens | 3.16 | 2.54–3.97 | Q |
| Tragedauer | Tage | danach neuer Sensor | 10 | – | Q |
| `τ` (Referenz) | min | Verzögerung Blut → Gewebe | 3.8 | 2.39–5.37 | Q — stützt `tsub = 5` |

⚠ **Zeiteinheit von `t` erschlossen, nicht abgelesen.** Das Paper definiert `t` als Zeit seit Setzen. Nur „Tage" ergibt eine plausible Verstärkung: in Minuten läge `a` nach einem Tag bei 6, in Stunden nach zehn Tagen bei 0,33. Gegen das PDF zu prüfen.

Abgeleitete Größen: stationäre Streuung des Messrauschens 5,34 mg/dL, Lag-1-Autokorrelation 0,79.

**Korrektur 23.09.2026.** Hier stand vorher, dieses Rauschen sei „glatt und wandernd, nicht zappelig". Das war falsch gelesen. Die Autokorrelation hält den Fehler über längere Zeit auf einer Seite, aber von Wert zu Wert springt die Anzeige in ruhigen Nachtphasen um ±3,5 mg/dL, und 31 % aller Schritte sind 4 mg/dL oder größer (5.3). Das ist genau das Muster 90 → 92 → 93 → 89, das Sensorträger aus eigener Erfahrung als unrealistisch kennen: nach 93 kommt eher 92. Das Modell beschreibt den Fehler an punktuellen Referenzmessungen. Wie sich die Anzeige von einem 5-Minuten-Wert zum nächsten verhält, war nicht sein Gegenstand. Deshalb V2.

### 5.2 Nebel V2 (Anwendung)

Grundidee: Ein echter Sensor irrt **kohärent**. Er liegt über Stunden gleichmäßig daneben, von Wert zu Wert ändert sich wenig. Große Abweichungen sind selten und haben eine Ursache. V2 trennt den Fehler deshalb nach Zeitskala, statt ihn als ein Rauschen pro Wert zu würfeln:

`CGM(t) = a(t)·IG(t) + b0 + Drift(t) + Niveau(t)·Zittern(k) − Druck(t)`

| Baustein | Zeitskala | Wert | Status | Beleg |
|---|---|---|---|---|
| Kalibriercharakter `a0` | je Sensor fest | Median 0,95, Streuung 0,059, Grenzen 0,85–1,05 | Q (Median, IQR) + N (Normalverteilung, Grenzen) | Vettoretti 2019; Streuung = IQR / 1,349 |
| Kalibriercharakter `b0` | je Sensor fest | Median 0,14 mg/dL, Streuung 3,5 mg/dL | Q + N | dito |
| Verstärkungsdrift `a1`, `a2` | Tage | 0,0039 · −0,000027 | Q ⚠ | Vettoretti 2019, Zeiteinheit erschlossen (5.1) |
| Langsame Drift | Stunden | Streuung 4 mg/dL, Stützstellen alle 180 min | N | Struktur folgt der Beobachtung „kohärenter Fehler"; Stärke Nebel-Kalibrierung |
| Zittern | 5–10 min | Streuung 1,2 mg/dL, AR(1) ρ = 0,5 | N, am Rand von Q | Camerlingo et al. 2023: Rauschvarianz in G6-Spuren 0,4–25 mg²/dL², also Streuung 0,6–5 mg/dL, Mittel zweier Beispielspuren 2,0 und 3,2 mg/dL |
| Erster Tag nach dem Setzen | Stunden | ×2,5, klingt mit τ = 8 h ab | N | Richtung: Hanson et al. 2024, Libre 3 MARD Tag 1 12,8 %, Tag 2 8,6 % |
| Bewegung | Minuten | Zuschlag 1,5 × `EEfast` | N | Richtung: Camerlingo 2023 nennt Aktivität als Rauschquelle, ohne sie zu beziffern |
| Druck auf den Sensor | 30–90 min | p = 0,25 je Nacht, 00–05 Uhr, 15–40 mg/dL Abfall | Häufigkeit aus Q abgeleitet, Dauer und Tiefe N | Mensh et al. 2013: Liegen auf dem Sensor erzeugt Fehlwerte > 25 mg/dL, meist als plötzlicher Abfall. Baysal et al. 2014: rund 3 % der nächtlichen Werte betroffen |
| Tragedauer | – | 10 Tage | Q | G6 |
| Sensoralter beim Start | – | 2–7 Tage | N — Designentscheidung | siehe unten |

**Belegt vs. gesetzt, ehrlich:** Die Struktur (fester Kalibriercharakter je Sensor, Drift über die Tragedauer, Rauschen, das bei Bewegung und nach dem Setzen steigt, nächtliche Druckabfälle) ist belegt. Die Stärken von Drift, Zittern, Erster-Tag-Faktor und Bewegungszuschlag sind Nebel-Kalibrierung. Das Zittern liegt bewusst am unteren Rand der belegten Spanne: Der ruhige Normalfall soll lesbar sein, und der Mittelwert aus Camerlingo 2023 stammt aus zwei Beispielspuren, nicht aus einer Population.

**Druck auf den Sensor, Herleitung der Häufigkeit:** 0,25 Nächte × 60 min mittlere Dauer ÷ 480 min Nacht = 3,1 % der Nachtwerte, passend zu Baysal 2014. Einschränkung: Baysal untersuchte Kinder von 3 bis 15 Jahren mit einer älteren Sensorgeneration. Die Zahl gibt die Größenordnung vor, keinen Punktwert.

**Designentscheidungen (Nutzervorgabe 23.09.2026):**

- **Der erste Tag bleibt ruhig.** Der Start der Simulation ist schon genug zu verarbeiten. Der Sensor sitzt beim Start bereits 2–7 Tage, der erste Wechsel fällt frühestens auf Tag 3.
- **Situative Ereignisse frühestens ab der zweiten Nacht**, zufällig. Druck auf den Sensor nur, wenn die Person schläft.
- **Einschätzungsleistung:** Der Druckabfall ist bewusst als plötzlicher Abfall modelliert, der wie eine echte Hypo aussehen kann. Die Nutzerin muss unterscheiden: echter Wechsel oder Messfehler? Im Live-Protokoll erscheint er nicht. Erst der Rückblick deckt ihn auf: als markierter Bereich in der Kurve, als Eintrag mit angezeigtem Wert gegen den echten Blutwert und mit der Reaktion der Nutzerin, falls sie darauf gegessen hat oder ein Tiefalarm kam.
- **Sensorwechsel** erscheint als Ereignis im Protokoll („Sensor gewechselt — die ersten Stunden rauscht er mehr"), weil man im echten Leben weiß, wann man ihn gesetzt hat.

**Umsetzung:** zählerbasiert wie der Rest der Beobachtungsschicht (`uniformAt`/`normalAt(seed, index)`), die Nachholintegration bleibt bitgleich. Drift als Catmull-Rom-Kurve durch Zufallsstützstellen, Zittern als AR(1) über eine abgeschnittene Impulsantwort. `engine/src/observation.ts`, Tests in `engine/tests/sensor-v2.test.ts`.

Quellen:

- Camerlingo N, Siviero I, Vettoretti M, Sparacino G, Del Favero S, Facchinetti A (2023). Bayesian denoising algorithm dealing with colored, non-stationary noise in continuous glucose monitoring timeseries. *Front Bioeng Biotechnol* 11:1280233. https://doi.org/10.3389/fbioe.2023.1280233
- Hanson K, Kipnes M, Tran H (2024). Comparison of point accuracy between two widely used continuous glucose monitoring systems. *J Diabetes Sci Technol*. https://doi.org/10.1177/19322968231225676
- Mensh BD, Wisniewski NA, Neil BM, Burnett DR (2013). Susceptibility of interstitial continuous glucose monitor performance to sleeping position. *J Diabetes Sci Technol* 7(4):863–870. https://doi.org/10.1177/193229681300700408
- Baysal N, Cameron F, Buckingham BA et al. (2014). A novel method to detect pressure-induced sensor attenuations (PISA) in an artificial pancreas. *J Diabetes Sci Technol* 8(6):1091–1096. https://doi.org/10.1177/1932296814553267

### 5.3 Kalibrierungsprüfung

`node scripts/cgm-calibration.cjs` — 20 Subjekte, je 3 Tage, drei Mahlzeiten mit Bolus nach KE-Faktor, täglich 45 min Belastung bei 55 % der Herzfrequenzreserve um 17 Uhr. MARD gegen die physiologische Glukose, nur im Messbereich 40–400 mg/dL (darunter zeigt ein echter Sensor LO). „Ruhig" heißt 02–05 Uhr ohne Druckereignisse, gemessen werden Schritte zwischen gerundeten Nachbarwerten.

| Variante | MARD | Spanne | < 70 | 70–180 | > 180 | Schritt ruhig | Sprünge ≥ 4 mg/dL |
|---|---|---|---|---|---|---|---|
| nur Verzögerung (5 min) | 0,7 % | 0,4–1,3 | – | – | – | ±0,4 | 0 % |
| G6-Labormodell | 5,3 % | 4,8–6,0 | 12,8 % | 5,2 % | 4,7 % | ±3,5 | 32 % |
| **Nebel V2** | **6,2 %** | 2,5–13,8 | 14,3 % | 6,2 % | 5,5 % | **±1,3** | **1 %** |

Gerechnet mit dem Nebel-Parametersatz (Abschnitt 7), Stand 26.09.2026. Mit den Quellwerten für `tmaxI` lagen die Zahlen fast gleich (V2 6,3 %, im Tief 13,3 %); die schnellere Insulinwirkung verschiebt sie nur am Rand.

Lesart:

- **V2 ist im Mittel so genau wie das G6-Modell, aber anders verteilt.** Von Wert zu Wert ruhig, dafür unterscheiden sich Sensoren deutlich voneinander (2,5 bis 13,8 %). Das entspricht der Erfahrung „meistens sehr präzise, ab und zu liegt ein Sensor daneben".
- **Im Tiefbereich ist der Sensor etwa doppelt so ungenau wie im Zielbereich** (14,3 % gegen 6,2 %): Verzögerung beim Abfall und ein absolut gleich großer Fehler auf einem kleinen Wert. Die Aussage der Startseite („am stärksten im Tiefen") bleibt gedeckt, in der Stärke „doppelt", nicht „viermal".
- **Beide MARD liegen unter klinischen Werten** (Hanson 2024: 8,9 % und 13,6 % für zwei aktuelle Systeme). Erwartbar: Klinische MARD misst gegen eine Laborreferenz mit eigenem Fehler; hier ist die Referenz die exakte Modellglukose. Die Parameter werden nicht auf eine Ziel-MARD getrimmt.

**Korrektur 23.09.2026 — die früheren Zahlen dieses Abschnitts waren falsch.** Hier stand für das G6-Modell eine MARD von 12,8 % (Spanne 4,9–17,7) und im Tiefbereich 21,9 %, „viermal so ungenau". Diese Zahlen stammten aus einem defekten Prüfszenario. `exerciseBlock()` setzte keinen Ruhepunkt vor den Block. Die Herzfrequenz ist eine linear interpolierte Spur, sie stieg deshalb zwischen den Blöcken aufeinanderfolgender Tage den ganzen Tag an (76 → 113 bpm). 14 von 20 Subjekten lagen 47–71 % der Zeit unter 70 mg/dL, viele am numerischen Boden von 18 mg/dL, wo jeder absolute Fehler relativ riesig wird. Behoben durch einen Ruheanker bei `start − 1`, abgesichert durch einen Regressionstest. Siehe Changelog, Nachtrag 6.

## 6. Offene Registry-Einträge (Nebel-Eigenleistung, noch zu belegen)

| Parameter | Bereich | Status | Zu klären |
|---|---|---|---|
| Filterzeitkonstante | Beobachtung | N | Im G6-Modell nicht vorgesehen, bleibt 0 |
| Drift, Zittern, Erster Tag, Bewegung (V2) | Beobachtung | N | Stärken gesetzt (5.2). Gegen echte Sensorspuren prüfen — reale Daten nur lokal und mit ausdrücklicher Zustimmung der Person |
| Druck auf den Sensor: Dauer, Tiefe | Beobachtung | N | Häufigkeit aus Baysal 2014 abgeleitet; Dauer 30–90 min und Tiefe 15–40 mg/dL noch ohne Beleg |
| Korrekturfaktor und KE-Faktor der App-Kacheln | Therapie | Q, aber ungeprüft | Stammen aus `demographic_info` des Datensatzes, nicht aus dem Modell. Prüfung 26.09. (1 U, 2 h nach 60 g ohne Bolus, größte Differenz zum Lauf ohne Korrektur): mit Quell-`tmaxI` Modell / Datensatz im Median 0,75, Spanne 0,27–1,41; mit `tmaxI` = 50 min im Median 0,93, Spanne 0,37–1,58. Patient 1 passt (33 gegen 28 mg/dL pro U), Patient 7 nicht (24 gegen 64). KE-Faktor noch nicht geprüft |
| Weitere Sensorereignisse | Beobachtung | offen | z. B. Störsubstanzen wie hochdosiertes Vitamin C (herstellerabhängig), frühestens an späteren Tagen |
| Abtastrate | Beobachtung | N | 5 min, Gerätekonvention |
| KH-Split schnell/langsam | Mahlzeit | N | Zuordnungsregel realer Mahlzeiten auf `uFastCarbs`/`uSlowCarbs` — braucht eine begründete Heuristik, keine Bauchzahl |
| Bolusdauer | Pumpe | N | Modellierung als Impuls über 1 min |
| `drainPerMin` | Reserven | N | Grundverbrauch, vorläufig 1/600 pro min (voll → leer in ~10 h) |
| `exerciseDrainPerMin` | Reserven | N | Zusatzverbrauch bei voller Belastung, vorläufig 3/600 |
| `afterEffectDrainPerMin` | Reserven | N | Zusatzverbrauch aus dem Nacheffekt, vorläufig 1/600 |
| `refillPerMmolCarb` | Reserven | N | Auffüllung pro mmol KH, vorläufig 1/280 |
| Anzeigeschwellen Reserven | Reserven | N | 0.30 / 0.70 / 0.62 / 0.60 sowie Heißhunger bei 0.28 — aus dem Prototyp übernommen |

Die Reserven-Parameter gehören zur Erlebnisschicht und dürfen nie als physiologische Werte ausgegeben werden. Sie sind bewusst grob und werden nach den ersten Testsitzungen nach Gefühl kalibriert — das ist bei einem Bedürfnismodell zulässig, bei einem physiologischen Parameter nicht.

Regel aus der V1-Spec, weiterhin bindend: Ein Parameter darf nicht gleichzeitig als Literaturwert und als empirisch optimierter Wert ausgegeben werden.

## 7. Nebel-Kalibrierung (`engine/src/calibration.ts`)

Wo ein Quellwert nachweislich nicht zur Wirklichkeit passt, wird er an genau einer Stelle korrigiert. Die Engine hat damit zwei Parametersätze:

| Parametersatz | Funktion | Wer nutzt ihn |
|---|---|---|
| Quelle | `withPopulationConstants(subject)` | Orakelabgleich, Tests der Gleichungen, Viewer auf Wunsch |
| **Nebel** | `nebelParameters(subject)` | App, Viewer (Standard), Kalibrierskripte |

| Parameter | Quelle | Nebel | Status | Beleg |
|---|---|---|---|---|
| `tsub` | 15 min | **5 min** | N, an Q kalibriert | ISPAD 5–10 min; Vettoretti 2019 τ = 3,8 min. Nur Beobachtungsschicht (W9) |
| `tmaxI` | 58–131 min | **50 min** für alle | N, an Q kalibriert | Fachinformation Insulin aspart: Maximum 1–3 h, Wirkdauer 3–5 h. Changelog Nachtrag 9 |

Abgesichert durch `tests/calibration.test.ts`: Die Kalibrierung verändert das Basalgleichgewicht nicht, legt die Wirkung von 1 U in die Grenzen der Fachinformation, und die Gegenprobe mit Quellwerten liegt außerhalb.

