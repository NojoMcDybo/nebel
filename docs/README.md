# Nebel — Dokumentation

## Lesereihenfolge

1. `00_Widerspruchspruefung_und_Changelog.md` — was in der alten Dokumentation widersprüchlich war, wie es korrigiert wurde, was neu dazugekommen ist
2. `05_Zielgruppe_und_Lernziele.md` — für wen Nebel gebaut wird und was daraus für die Engine folgt
3. `06_Echtzeit_Modus.md` — Betrieb über einen echten Tag und was daraus für die Engine folgt
4. `07_Paediatrie_Rechercheergebnis.md` — warum V1 keine Kinderwerte enthält
5. `08_Beduerfnisse_und_Hunger.md` — warum Hunger simuliert wird und warum er nicht in die Engine gehört
6. `10_Engine_Spec_V2_ExtHovorka.md` — die gültige technische Spezifikation der Engine
7. `20_Parameter_Registry.md` — alle 35 Parameter mit Einheiten, Werten, Ranges und Kalibrierstatus
8. `30_Rechtliche_Einordnung.md` — Medizinprodukterecht, Produkthaftung, GPL-Abgrenzung, Bedingungen für eine Veröffentlichung

## Status der Altdokumente

Die drei `.docx` im Projektwurzelverzeichnis bleiben unverändert als historischer Stand vom 14.09.2026 liegen:

| Datei | Status |
|---|---|
| `Nebel_Scientific_Engine_Foundation (1).docx` | **Teilweise gültig.** Evidenzhierarchie, Literaturregister und Parametergovernance gelten weiter. §14 (Modellempfehlung) und §5 (Zustandsminimum) sind überholt. |
| `Nebel_Equation_and_Parameter_Specification_V1_v2.docx` | **Ersetzt** durch `10_Engine_Spec_V2_ExtHovorka.md`. Die Gleichungen darin mischen drei Modellfamilien und dürfen nicht implementiert werden. |
| `Nebel_Engine_Content_Risk_Review_V1.docx` | **Gültig.** Die 15 Scheitergründe und die Bewertungslogik bleiben in Kraft. Der Status der Research-Liste ist in `00_...` aktualisiert. |

`index.html` ist ausschließlich UX- und Interaktionsprototyp. Keine Formel, kein Koeffizient und keine Zeitkonstante daraus ist physiologische Grundlage.

## Entscheidungen auf einen Blick

| Frage | Entscheidung | Datum |
|---|---|---|
| Primäre Zielgruppe | Angehörige und Freunde von Menschen mit Typ-1-Diabetes; Schulsport/Lehramt später | 22.09.2026 |
| Engine-Kern | ExtHovorka (Hobbs/Cinar), 16 Zustände, herzfrequenzgetrieben | 15.09.2026 |
| Therapieform | Pumpentherapie CSII, Open Loop | 09/2026 |
| Architektur | Separates TypeScript-Modul mit Testsuite, headless lauffähig | 22.09.2026 |
| Referenzimplementierung | py-mgipsim nur als numerisches Vergleichsorakel, kein Codeport (GPL-3.0) | 22.09.2026 |
| Einheiten | Intern SI (mmol/L, mmol, mU), Umrechnung nur an der UI-Grenze | 22.09.2026 |
| Circadianität | Nicht in V1 | 22.09.2026 |
| Echtzeit-Modus | Kernfeature, trägt das Hauptlernziel; Sandbox läuft auf einer Kopie | 22.09.2026 |
| Pädiatrie | Nicht in V1 — kein einsetzbarer Parametersatz vorhanden | 22.09.2026 |
| Hunger | Bedürfnis in der Erlebnisschicht, kein 17. Zustand. Leberglykogen ist V2-Kandidat | 22.09.2026 |
