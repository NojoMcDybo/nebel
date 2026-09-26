# Nebel — Engine Specification V2 (ExtHovorka)

Status: V2 Engineering Specification, 2026-09-22
Ersetzt: `Nebel_Equation_and_Parameter_Specification_V1_v2.docx`
Ergänzt (nicht ersetzt): `Nebel_Scientific_Engine_Foundation (1).docx` — dessen Evidenzhierarchie und Literaturregister bleiben gültig.

Zweck: Forschungs- und Bildungsprototyp. Kein Medizinprodukt, kein klinisch validiertes Dosierungssystem, keine Dosierungsempfehlung.

---

## 0. Zielgruppe

Nebel richtet sich primär an **Angehörige und Freunde** von Menschen mit Typ-1-Diabetes, sekundär und später an Schulsport-Kontexte. Siehe `05_Zielgruppe_und_Lernziele.md`. Zwei Folgen für diese Spezifikation: die Beobachtungsschicht (Abschnitt 8) ist kein Anhängsel, sondern trägt ein eigenes Lernziel, und Langzeitstabilität über Tage ist ein Produktmerkmal, kein numerisches Detail.

## 1. Modellentscheidung

Nebel V1 implementiert das **erweiterte Hovorka-Modell (ExtHovorka)** der Cinar-Gruppe: 16 Zustände, herzfrequenzgetriebene Bewegungsmodellierung, nichtlineare glukoseabhängige Insulinsensitivität, getrennte schnelle und langsame Kohlenhydratabsorption, renale Clearance.

Begründung gegenüber der V1-Eigenkonstruktion:

- Ein vollständig spezifiziertes, publiziertes Modell statt einer Kombination aus drei Modellfamilien
- Bewegung ist strukturell enthalten, nicht angeflanscht — entscheidend, weil Sport fester Bestandteil von Nebel bleiben soll
- 20 publizierte Parametersätze realer Probanden statt frei gewählter Individualisierung
- Eine Open-Source-Referenzimplementierung existiert und kann als numerisches Vergleichsorakel dienen

Nebel baut **keine** eigene Modellfamilie. Eigenleistung ist bewusst auf die Beobachtungsschicht (CGM), die Pumpenschicht (CSII) und die Erlebnisschicht beschränkt.

## 2. Schichten

```
EVENTS        Mahlzeit (schnell/langsam) · Insulin (Basal/Bolus) · Herzfrequenz
   ↓
PHYSIOLOGIE   16 Zustände, SI-Einheiten, deterministisch      ← ExtHovorka, publiziert
   ↓
BEOBACHTUNG   Interstitium · Sensorfilter · Rauschen · 5-min-Raster   ← Nebel-Eigenleistung
   ↓
ERLEBNIS      Anzeige, Alarme, Entscheidungen, Analyse-Sandbox        ← Nebel
```

Harte Regel: Die Beobachtungsschicht darf den physiologischen Zustand **nie** zurück beeinflussen. Rauschen ist Messfehler, nicht Körper.

## 3. Einheiten

| Größe | Einheit |
|---|---|
| Zeit | min |
| Glukosekonzentration | mmol/L |
| Glukosemasse | mmol |
| Insulinmenge / -strom | mU, mU/min |
| Plasmainsulin | mU/L |
| Kohlenhydrat-Input | mmol/min |
| Herzfrequenz | bpm |
| Körpergewicht | kg |

Intern durchgängig SI. Umrechnung `mg/dL = mmol/L × 18.0182` und `mmol KH = g KH / 0.180156` ausschließlich an der UI-Grenze, in genau einem Modul.

## 4. Zustandsvektor (16)

Reihenfolge ist normativ — Tests hängen daran.

| # | Symbol | Bedeutung | Einheit |
|---|---|---|---|
| 1 | `S1` | Subkutanes Insulin, Kompartiment 1 | mU |
| 2 | `S2` | Subkutanes Insulin, Kompartiment 2 | mU |
| 3 | `I` | Plasmainsulin | mU/L |
| 4 | `x1` | Insulinwirkung: Glukosetransport/-verteilung | 1/min |
| 5 | `x2` | Insulinwirkung: periphere Utilisation | 1/min |
| 6 | `x3` | Insulinwirkung: Suppression der EGP | dimensionslos |
| 7 | `Q1` | Zentrale Glukosemasse | mmol |
| 8 | `Q2` | Periphere Glukosemasse | mmol |
| 9 | `IG` | Interstitielle Glukose | mmol/L |
| 10 | `D1Slow` | Langsame KH, Kompartiment 1 | mmol |
| 11 | `D2Slow` | Langsame KH, Kompartiment 2 | mmol |
| 12 | `D1Fast` | Schnelle KH, Kompartiment 1 | mmol |
| 13 | `D2Fast` | Schnelle KH, Kompartiment 2 | mmol |
| 14 | `EEfast` | Schnelle Bewegungsantwort | normiert 0–1 |
| 15 | `EEhigh` | Anteil oberhalb der ventilatorischen Schwelle | normiert 0–1 |
| 16 | `EElong` | Verzögerter Nacheffekt der Belastung | normiert |

Abgeleitet: `G = Q1 / VG` [mmol/L].

## 5. Eingänge

| Signal | Einheit | Bedeutung |
|---|---|---|
| `uFastCarbs` | mmol/min | Schnell resorbierbare Kohlenhydrate |
| `uSlowCarbs` | mmol/min | Langsam resorbierbare Kohlenhydrate |
| `uHR` | bpm | Herzfrequenz — der Bewegungstreiber |
| `uInsulin` | mU/min | Basalrate + Bolus, kombiniert |

## 6. Gleichungen

### 6.1 Insulinabsorption und Plasmainsulin
```
dS1/dt = uInsulin − S1 / tmaxI
dS2/dt = (S1 − S2) / tmaxI
dI/dt  = S2 / (VI · tmaxI) − ke · I
```

### 6.2 Nichtlineare Insulinsensitivität
Mit `G = Q1/VG`:
```
SIhypo  = (aSI · tanh(G/b + dSI) + c) / (aSI · tanh(5/b + dSI) + c)
SIhyper = 1 − 0.018 · (G − 5.55)
kb1' = kb1 · SIhypo · SIhyper
kb2' = kb2 · SIhypo · SIhyper
kb3' = kb3 · SIhypo · SIhyper
```
Normiert auf `G = 5 mmol/L`. Bedeutung: Insulinsensitivität steigt im Hypobereich und sinkt im Hyperbereich. Dies ist **keine** Tageszeitabhängigkeit und darf im UI nicht als solche erklärt werden.

### 6.3 Insulinwirkung
```
dx1/dt = kb1' · I − ka1 · x1
dx2/dt = kb2' · I − ka2 · x2
dx3/dt = kb3' · I − ka3 · x3
```

### 6.4 Nicht-insulinabhängige Aufnahme (ZNS)
```
F01n = BW · F01
falls G < 4.5:  F01n = F01n · G / 4.5
```

### 6.5 Renale Clearance
```
FR = 0.003 · (G − 9) · VG    für G ≥ 9
FR = 0                        sonst
```

### 6.6 Kohlenhydratabsorption
```
dD1Slow/dt = AG · uSlowCarbs − D1Slow / tmaxG
dD2Slow/dt = (D1Slow − D2Slow) / tmaxG
dD1Fast/dt = AG · uFastCarbs − D1Fast / tmaxGFast
dD2Fast/dt = (D1Fast − D2Fast) / tmaxGFast

UGe = D2Slow / tmaxG + D2Fast / tmaxGFast
```

### 6.7 Endogene Glukoseproduktion
```
EGP = max(0, EGP0 · (1 − x3) · (1 + p1 · EEfast + p2 · EEhigh))
```
Bewegung erhöht die Leberfreisetzung; hochintensive Belastung stärker (`p2 > p1`). Das ist der Mechanismus hinter dem Glukoseanstieg bei intensivem Sport.

### 6.8 Glukosekompartimente
```
dQ1/dt = − x1 · Q1 + k12 · Q2 − F01n − FR + UGe + EGP − p3 · EEfast
dQ2/dt =   x1 · Q1 − k12 · Q2 − x2 · Q2 + p3 · EEfast − p4 · EEfast − p5 · x2 · EElong
```
`p3` verschiebt Glukose bewegungsgetrieben ins periphere Kompartiment, `p4` beschreibt den Verbrauch dort, `p5` den verlängerten insulinsensitivierenden Nacheffekt.

### 6.9 Interstitium
```
dIG/dt = (G − IG) / tsub
```

### 6.10 Bewegung (herzfrequenzgetrieben)
```
HRR      = clamp((uHR − HRrest) / (HRmax − HRrest), 0, 1)
HRRhigh  = clamp((HRR − VT_HRR) / (1 − VT_HRR), 0, 1)

dEEfast/dt = p6 · (HRR − EEfast)
dEEhigh/dt = p8 · (HRRhigh − EEhigh)
dEElong/dt = p6 · EEfast − p7 · EElong
```
`VT_HRR` ist die individuelle ventilatorische Schwelle als Anteil der Herzfrequenzreserve. Erst oberhalb davon greift der hochintensive Pfad.

### 6.11 Numerische Schutzgrenzen (keine Physiologie)
```
Q1 ∈ [VG, 32 · VG]   entspricht G ∈ [1, 32] mmol/L
EGP ≥ 0
```
Gehört in den Model Validity Envelope, nicht in die Erklärungsschicht.

## 7. Pumpenschicht (CSII, Open Loop)

`uInsulin` ist ein kontinuierlicher Strom in mU/min. Darauf bildet die Pumpe ab:

| Bedienhandlung | Abbildung |
|---|---|
| Basalprofil | Stückweise konstante `uInsulin(t)` über 24 h, U/h → mU/min = `U/h · 1000 / 60` |
| Bolus | Rechteckimpuls über einen Zeitschritt: `uInsulin += Bolus_U · 1000 / Δt` |
| Temp-Basal | Skalierung des aktiven Basalsegments über ein Zeitfenster |
| Pumpenstopp | `uInsulin = 0` im Fenster |
| Verzögerter Bolus | Rechteck über die gewählte Dauer |

Nicht in V1: AID/Closed Loop, Kanülenokklusion, Katheterwechsel-Effekte, Insulindepot-Alterung.

Insulin-on-Board ist eine **abgeleitete Anzeigegröße** aus der Bolushistorie und ausdrücklich nicht identisch mit `S1 + S2` oder `I`. Beide dürfen im Code nicht vermischt werden.

## 8. Beobachtungsschicht (Nebel-Eigenleistung)

ExtHovorka endet bei `IG`. Alles Weitere ist Nebel-Annahme und wird als solche gekennzeichnet:

| Baustein | V1-Entscheidung |
|---|---|
| Physiologische Verzögerung | **5 min in der Anwendung**, kalibriert nach ISPAD (5–10 min). Der Quellwert 15 min bleibt in der Engine und wird für den Orakelabgleich verwendet. Zulässig, weil `tsub` nur die Beobachtungsschicht betrifft — `IG` wird von keinem anderen Zustand gelesen |
| Abtastung | 5-min-Raster, wie handelsübliche CGM |
| Rauschen und Kalibrierfehler | **Sensormodell V2** (seit 23.09.2026): fester Kalibriercharakter je Sensor nach Vettoretti et al. 2019, langsame Drift über Stunden, kleines Zittern, Anhebung nach dem Setzen und bei Bewegung. Das publizierte G6-Modell bleibt als Vergleich (`LAB_G6_SENSOR`); es springt von Wert zu Wert zu stark. Zählerbasiert, Nachholintegration bitgleich. Parameter, Belege und Kalibrierungsprüfung in `20_Parameter_Registry.md` Abschnitt 5 |
| Filterung | Im Fehlermodell nicht vorgesehen; Glättung bleibt implementiert, aber aus |
| Sensoralterung | Über die Drift der Verstärkung `a(t)`, Sensorwechsel nach 10 Tagen. Beim Start sitzt der Sensor schon 2–7 Tage, der erste Wechsel fällt frühestens auf Tag 3 |
| Druckartefakte | **Ja, seit 23.09.2026**: nur im Schlaf, frühestens ab der zweiten Nacht, etwa jede vierte Nacht (≈ 3 % der Nachtwerte, Baysal 2014). Nicht im Live-Protokoll — die Nutzerin muss selbst einschätzen, ob der Abfall echt ist. Der Rückblick deckt ihn auf |
| Messbereich | 40–400 mg/dL; außerhalb zeigt die Anzeige den Grenzwert |

Die Anzeige zeigt nie `G`, sondern immer `Gsensor`. Der Unterschied zwischen beiden ist eines der Lernziele und muss im Analyse-Screen sichtbar gemacht werden können.

## 9. Klinische Schwellen (Anzeige, nicht Modell)

| Zustand | mmol/L | mg/dL |
|---|---|---|
| Hypoglykämie Level 2 | < 3.0 | < 54 |
| Hypoglykämie Level 1 | < 3.9 | < 70 |
| Zielbereich | 3.9 – 10.0 | 70 – 180 |
| Hyperglykämie | > 10.0 | > 180 |

Davon zu trennen: `4.5 mmol/L` (F01-Reduktion) und `9 mmol/L` (renale Schwelle) sind Modellschwellen, keine klinische Klassifikation. Symptome werden nicht deterministisch aus einem einzelnen Glukosewert abgeleitet.

## 10. Numerik

- Zielschrittweite 1 min, Euler explizit
- Konvergenztest gegen RK4 sowie gegen 0.5 min und 0.25 min
- Events werden an exakten Zeitgrenzen verarbeitet
- Identischer Subjekt-, Seed- und Eventstrom reproduziert exakt denselben Verlauf — Voraussetzung für den Analyse-Screen mit Sandbox
- Keine negativen Zustände
- Langzeitläufe (7 Tage) auf Stabilität geprüft

## 11. Parameterpolitik (aus V1 übernommen, weiterhin gültig)

- Jeder Parameter mit Name, Einheit, Definition, Quelle, Population, Nominalwert, Range, Konfidenz, Kalibrierstatus, Validierungsszenario
- Quellwerte und kalibrierte Nebel-Werte werden nie vermischt und nie gleichzeitig ausgegeben
- Keine Parameter ausschließlich als Codekonstanten
- Keine scheinpräzisen Individualparameter ohne Datenbasis

Siehe `20_Parameter_Registry.md`.

## 12. Validierungshierarchie (aus V1 übernommen)

| Stufe | Prüfung |
|---|---|
| 1 | Gleichungs- und Einheitenprüfung |
| 2 | Subsystemtests: Insulin, Mahlzeit, Bewegung, Glukose |
| 3 | Integrierte physiologische Szenarien |
| 4 | Population / individuelle Variabilität |
| 5 | Beobachtungsmodell |
| 6 | Pädagogische Szenarien und UX |

Ergänzt um Stufe 0: **numerischer Abgleich gegen py-mgipsim** für identische Parametersätze und Eventströme.

**Status: bestanden (22.09.2026).** Verglichen wurden drei Subjekte (Patient 1, 7, 14):

| Prüfung | Ergebnis |
|---|---|
| Ableitungen an 120 zufälligen Zustandspunkten | Abweichung < 1e-12 relativ |
| 24-h-Trajektorie mit Mahlzeit, Bolus und Belastungsblock, Euler 1 min | Abweichung < 1e-9 mmol/L |
| Gegenprobe mit 1 % verstimmtem `k12` | fällt auf — der Vergleich ist scharf |

Die Referenzwerte werden mit `npm run oracle:reference` erzeugt. Das Skript lädt ausschließlich die Gleichungsfunktion aus py-mgipsim und führt sie aus; übernommen wird kein Code, sondern eine Zahlentabelle unter `vendor/`, die gitignored ist. Damit sind die Größenordnungen der Engine belegt, nicht nur ihr qualitatives Verhalten.

Testfälle vor der Implementierung:

| Test | Erwartung |
|---|---|
| Baseline | Stabiler Zustand ohne Störung |
| Mahlzeit | Verzögerter Anstieg, kein Sprung |
| Bolus | Verzögerte Senkung, dann Erholung |
| Timing Mahlzeit/Bolus | Andere Reihenfolge, anderer Verlauf |
| Bewegung moderat | Abfall über `p3/p4`, Nacheffekt über `EElong` |
| Bewegung hochintensiv | Anstieg über `p2 · EEhigh` in der EGP |
| CGM bei schneller Änderung | `Gsensor` läuft `G` hinterher |
| Renale Schwelle | Ab 9 mmol/L zusätzliche Elimination |
| Hypo | F01-Reduktion unter 4.5 mmol/L greift |
| Population | 20 Patienten unterscheiden sich, bleiben plausibel |
| Replay | Gleicher Seed, gleiches Ergebnis |

## 13. Bewusst nicht in V1

- Kein UVA/Padova-Klon
- Kein Glukagon-/Gegenregulationsmodell
- Keine Fett-/Proteinmetabolik (der Schnell/Langsam-Split ist ein Absorptionsmodell, kein Makronährstoffmodell)
- Keine Stress-, Krankheits- oder Schlafmultiplikatoren
- Kein Circadian-Term, kein Dawn-Phänomen
- Keine Sensoralterung, kein Drift-/Druckartefaktmodell
- Kein Closed-Loop-Algorithmus
- Keine klinischen Dosierungsempfehlungen

## 14. Implementierungsreihenfolge

1. Zustandsobjekt, Einheiten, Konvertierungsmodul
2. Eventsystem (Mahlzeit, Insulin, Herzfrequenz)
3. Parameter-Registry und Laden der 20 Subjekte
4. Insulin- und Glukosekern isoliert, Test gegen py-mgipsim
5. Kohlenhydratabsorption
6. Bewegungsmodul
7. Beobachtungsschicht getrennt
8. Pumpenschicht (Basalprofil, Bolus, Temp-Basal)
9. Deterministische Replay- und Regressionstests
10. Erst danach UI-Kopplung

## 15. Wissenschaftlicher Vorbehalt

Diese Spezifikation ist eine technische Forschungs- und Bildungsgrundlage. Sie ist weder klinische Validierung noch medizinische Dosierungsanleitung. Die publizierten Modelle sind kontextabhängig; ihre Parameter wurden für bestimmte Populationen und Experimente bestimmt. Gute In-silico-Ergebnisse sagen nichts über In-vivo-Verhalten aus.

## 16. Lizenz

Die Referenzimplementierung py-mgipsim steht unter GPL-3.0. Nebel implementiert aus den publizierten Gleichungen und nutzt py-mgipsim ausschließlich als numerisches Vergleichsorakel. Kein Code wird übernommen. Diese Trennung ist einzuhalten und im Repository zu dokumentieren.

## 17. Literatur

- Hobbs et al. (2019). Simulation software for assessment of nonlinear and adaptive multivariable control algorithms: Glucose–insulin dynamics in Type 1 diabetes. *Computers & Chemical Engineering*. https://pubmed.ncbi.nlm.nih.gov/32863472/
- Siket, Rashid & Cinar (2025). py-mgipsim: An Open-Source Python Library for Simulating Type 1 Diabetes With Diverse Meals and Physical Activities. *J Diabetes Sci Technol*. https://pubmed.ncbi.nlm.nih.gov/40110887/
- Repository: https://github.com/illinoistech-itm/py-mgipsim
- Hovorka et al. (2004). Nonlinear model predictive control of glucose concentration in subjects with type 1 diabetes.
- ADA (2026). Standards of Care in Diabetes — Glycemic Goals, Hypoglycemia, and Hyperglycemic Crises. https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927/6-Glycemic-Goals-Hypoglycemia-and-Hyperglycemic
- ISPAD (2022). Clinical Practice Consensus Guidelines: Diabetes technologies — Glucose monitoring. https://pmc.ncbi.nlm.nih.gov/articles/PMC10107687/

Das vollständige Literaturregister der Foundation (Bergman, Dalla Man, UVA/Padova, DIABLOG, simglucose) bleibt als Evidenz- und Vergleichsbasis gültig, auch wenn diese Modelle nicht mehr Teil der Engine sind.
