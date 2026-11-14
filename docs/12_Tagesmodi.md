# Tagesmodi

Stand 14.11.2026. Ein Tagesmodus ist ein ganztägiger Zustand, der in den Einstellungen gewählt wird. Er gilt für die ganze Sitzung, ein Wechsel beginnt neu. Code: `app/adapter.js` (Konstanten `PREG`, `LUTEAL_SI`, `SLEEP_KB2`, `HEAT_ABS`, `ALC_SI`), Prüfung: `engine/scripts/check-adapter.cjs`, Block „Tagesmodi“.

Nicht dabei: Krankheit und Stress. Dafür fehlen belastbare Zahlen, die sich ins Modell übertragen lassen.

Alle Quellen laut PubMed geprüft.

## Werte

| Modus | Quelle | Personen | Befund | Umsetzung im Modell |
|---|---|---|---|---|
| Schwangerschaft (Woche 6–40) | García-Patterson 2010, [doi:10.1007/s00125-009-1633-z](https://doi.org/10.1007/s00125-009-1633-z) | 65 Frauen | Bedarf mit Spitze in Woche 9, Tiefpunkt in Woche 16, Spitze in Woche 37, dazwischen +4,08 % pro Woche; 8 von 9 schweren Unterzuckern vor Woche 16 | Bedarf r(Woche) linear zwischen [0 → 1], [9 → 1,05], [16 → 0,765], [37 → 1,42], [42 → 1,42]; kb1–kb3 × 1/r |
| | Dori-Dayan 2024, [doi:10.1002/dmrr.3771](https://doi.org/10.1002/dmrr.3771) | 185 Schwangerschaften | +42,1 % bis zur Geburt | Woche 37 = 1,42; Woche 16 = 1,42 / (1 + 21 × 4,08 %) |
| Zweite Zyklushälfte | Hossmann 2026, [doi:10.2337/dc26-0692](https://doi.org/10.2337/dc26-0692) | 77 Personen, 380 Zyklen | Insulin +2,6 % in der Lutealphase, −2,6 % in der Follikelphase gegenüber dem Mittel; 84,7 % folgen dem Muster | kb1–kb3 × 0,974 |
| | Tsiaple 2026, [doi:10.1016/j.diabres.2026.113654](https://doi.org/10.1016/j.diabres.2026.113654) | Metaanalyse, 18 Studien | Lutealphase: weniger Zeit im Zielbereich, Zeit unter dem Zielbereich gleich | nur Richtung, Prüfung |
| | Diaz 2022, [doi:10.1089/dia.2022.0154](https://doi.org/10.1089/dia.2022.0154) | 16 Frauen | Klemme, Empfindlichkeit über den Zyklus | Hintergrund |
| Nach 4 h Schlaf | Donga 2010, [doi:10.2337/dc09-2317](https://doi.org/10.2337/dc09-2317) | 7 Personen | Glukoseinfusion in der Klemme −21 %, periphere Aufnahme 25,5 → 22,0, Leberproduktion unverändert | kb2 × 0,79 (nur die periphere Aufnahme) |
| Hitzetag | Koivisto 1981, [doi:10.1016/0026-0495(81)90122-0](https://doi.org/10.1016/0026-0495(81)90122-0) | 6 Personen | Bei 35 statt 20 °C verschwindet Normalinsulin 50–60 % schneller aus dem Unterhautgewebe, Glukose 1–2 mmol/L tiefer | tmaxI / 1,55 |
| Morgen nach Alkohol | Turner 2001, [doi:10.2337/diacare.24.11.1888](https://doi.org/10.2337/diacare.24.11.1888) | 6 Männer | 0,75 g/kg Wein am Vorabend; nachts gleich; nach dem Frühstück Spitze 8,9 statt 15 mmol/L; ab 10 Uhr bei 5 Personen Unterzucker | Empfindlichkeit × 1,26 von 7 bis 13 Uhr am ersten Tag |
| | García 2021, [doi:10.1136/bmjdrc-2021-002399](https://doi.org/10.1136/bmjdrc-2021-002399) | 12 Personen | Alkohol zum Essen: über 6 h kein Effekt | Grund, warum der Modus erst am Morgen danach wirkt |
| | Ranjan 2018, [doi:10.2337/dc17-1458](https://doi.org/10.2337/dc17-1458) | 12 Personen | Glukagon wirkt nach Alkohol schwächer | nicht umgesetzt (Nebel hat kein Glukagon) |

Al-Qaissi 2018 (Hitze, schnelle Analoga) ließ sich in PubMed nicht finden und wird nicht verwendet.

## Annahmen (NEBEL-ANNAHME)

- **Basal gilt als eingestellt** (Schwangerschaft, Zyklus, kurze Nacht). Im Modell kippt der Nüchternwert schon bei wenigen Prozent Empfindlichkeit: −2,6 % ohne Anpassung heben das Tagesmittel einer Testperson von 151 auf 211 mg/dL, Woche 34 auf 557. Das ist eine Eigenschaft des Modells (schwache Glukosewirkung ohne Insulin), keine des Körpers. Darum wird die Basalrate so gesucht, dass der Startwert der von vorher bleibt, wie bei titriertem Basal oder einem AID-System. KE- und Korrekturfaktor bleiben die alten, der Modus zeigt sich rund ums Essen. Die Personenkarte zeigt die eingestellte Basalrate.
- **Woche 9 = 1,05.** Die Höhe der ersten Spitze ist in den Quellen nicht beziffert.
- **Kurze Nacht gilt den ganzen Tag.** Gemessen wurde am Morgen danach.
- **Hitze gilt für heutige Insuline.** Gemessen wurde mit Normalinsulin.
- **Alkohol: Wirkung als Empfindlichkeit, 7 bis 13 Uhr, ohne Anpassung der Basalrate** (für einen Morgen stellt niemand um). ALC_SI ist so gewählt, dass nach 60 g Frühstück mit passendem Bolus um 8 Uhr 8 der 9 Figuren unter 3,5 mmol/L fallen (5 von 6 bei Turner). Die Spitze sinkt damit nur um 13 % statt um 41 %. Für die volle Senkung bräuchte das Modell × 2,15, und dann fielen alle Figuren bis an die Modellgrenze von 18 mg/dL. Der Unterzucker ist der klinisch wichtige Befund, darum hat er Vorrang.

## Prüfung (Richtung gegenüber einem normalen Tag)

Patient_4, Seed 31, drei Mahlzeiten (60/70/70 g) mit Bolus nach Datensatztherapie, 24 h, Mittelwert:

| Modus | Mittel (mg/dL) | erwartet |
|---|---|---|
| normal | 151 | — |
| Woche 12 / 16 / 34 | 132 / 85 / 209 | tiefer / am tiefsten / höher |
| Zweite Zyklushälfte | 157 | etwas höher |
| Nach 4 h Schlaf | 169 | höher |
| Hitzetag | 145 | tiefer |
| Morgen nach Alkohol | 60, tiefster Wert 21 | tiefer, mit Unterzucker |

Dazu: Modus im Spielstand, fremder Modus wird nicht übernommen, unbekannte Werte werden zu „normal“, Wochen werden auf 6–40 begrenzt.
