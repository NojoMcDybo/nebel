# Nebel — Dokumentation

## Lesereihenfolge

1. `00_Widerspruchspruefung_und_Changelog.md` — was in der alten Dokumentation widersprüchlich war, wie es korrigiert wurde, was neu dazugekommen ist
2. `05_Zielgruppe_und_Lernziele.md` — für wen Nebel gebaut wird und was daraus für die Engine folgt
3. `06_Echtzeit_Modus.md` — Betrieb über einen echten Tag und was daraus für die Engine folgt
4. `07_Paediatrie_Rechercheergebnis.md` — warum V1 keine Kinderwerte enthält
5. `08_Beduerfnisse_und_Hunger.md` — warum Hunger simuliert wird und warum er nicht in die Engine gehört
6. `09_Personen.md` — die zehn wählbaren Personen: was echt ist, was erfunden, warum kein eigenes Profil
7. `10_Engine_Spec_V2_ExtHovorka.md` — die gültige technische Spezifikation der Engine
8. `11_Fett_und_Eiweiss.md` — Fett und Eiweiß: Recherche, Umsetzung in der Engine, Kalibrierung an Studien, Grenzen
9. `20_Parameter_Registry.md` — alle 35 Modellparameter mit Einheiten, Werten, Ranges und Kalibrierstatus, dazu Sensormodell, Nebel-Kalibrierung und Fett/Eiweiß
10. `30_Rechtliche_Einordnung.md` — Medizinprodukterecht, Produkthaftung, GPL-Abgrenzung, Bedingungen für eine Veröffentlichung und wie die App veröffentlicht wird (Abschnitt 7)
11. `40_Entstehung_ausfuehrlich.md` — Entstehung, Entscheidungen, Modell, Kalibrierung, Sensor, Recht und alle Quellen in einem Text. Steht auch in der App (`entstehung.html`), englisch als `40_Entstehung_ausfuehrlich.en.md`
12. `41_Entstehung_kompakt.md` — die Kurzfassung ohne Formeln, aufklappbar auf der Startseite der App, englisch als `41_Entstehung_kompakt.en.md`

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
| Engine-Kern | ExtHovorka (Rashid et al. 2019, AG Cinar), 16 Zustände, herzfrequenzgetrieben | 15.09.2026 |
| Therapieform | Pumpentherapie CSII, Open Loop; seit 13.11.2026 wahlweise Pen (MDI) und an der Pumpe Basal-IQ (Abschalten bei drohendem Tief) | 09/2026 |
| Architektur | Separates TypeScript-Modul mit Testsuite, headless lauffähig | 22.09.2026 |
| Referenzimplementierung | py-mgipsim nur als numerisches Vergleichsorakel, kein Codeport (GPL-3.0) | 22.09.2026 |
| Einheiten | Intern SI (mmol/L, mmol, mU), Umrechnung nur an der UI-Grenze | 22.09.2026 |
| Circadianität | Nicht in V1 | 22.09.2026 |
| Echtzeit-Modus | Kernfeature, trägt das Hauptlernziel; Sandbox läuft auf einer Kopie | 22.09.2026 |
| Pädiatrie | Nicht in V1 — kein einsetzbarer Parametersatz vorhanden | 22.09.2026 |
| Hunger | Bedürfnis in der Erlebnisschicht, kein 17. Zustand. Leberglykogen ist V2-Kandidat | 22.09.2026 |
| Personen | Zehn erfundene Figuren auf zehn veröffentlichten Körpern, wählbar auf der Startseite; Standard Lena (Subjekt 10) | 26.09.2026 |
| Eigenes Profil | Keine Werteingabe (Zweckbestimmung, DSGVO). Später Ähnlichkeits-Fragen ohne Zahlen | 26.09.2026 |
| Nebel-Kalibrierung | `tsub` 5 min, `tmaxI` 50 min, zentral in `engine/src/calibration.ts` | 26.09.2026 |
| Fett und Eiweiß | In der Engine, ohne neuen Zustand: Magenverzögerung, Fett-Insulinresistenz ab 20 g pro Mahlzeit, späte Glukose aus Eiweiß. Kalibriert an Wolpert 2013 und Paterson 2016 | 26.09.2026 |
| Trendpfeil | Sieben feste Stufen wie Dexcom G6, mit Schrägpfeilen; dahinter die Differenz zum vorigen Wert | 26.09.2026 |
| Veröffentlichung | Repository öffentlich, App auf GitHub Pages über eine Action. Zehn Parametersätze als eigene GPL-Datei, Schriften lokal, Impressum aus Repository-Variablen | 12.10.2026 |
| Tagesplan (W13) | Mahlzeiten aus dem Bedürfnis, Bewegung aus dem Tagesplan: Training angekündigt und absagbar, Alltagsbewegung unangekündigt | 24.09.2026, bestätigt 09.11.2026 |
| Hinweisfenster | Vor der ersten Nutzung: nur Lernsystem, kein Medizinprodukt, keine Insulindosierung. Ohne Bestätigung bleibt die App gesperrt (Bitte der py-mgipsim-Autoren) | 28.10.2026 |
| Englische Fassung | App zusätzlich unter `/en/`. Quelle bleibt deutsch, Texte in `engine/scripts/i18n-en.mjs`, verbindlich ist die deutsche Rechtsseite | 28.10.2026 |
| Startseite | Kein Hero-Text, keine Kachel „Deine Therapiewerte“. KE-Faktor und Korrektur nur auf der Personenkarte | 28.10.2026 |
| Reserven | Essen füllt die Reserven mit der tatsächlich gegessenen Menge. „Heißhunger“ nur als Hinweis, kein Multiplikator | 09.11.2026 |
| Bewegungsgrenzen | Warnung und Verschiebung lesen dieselben Grenzen: unter 80 und über 280 mg/dL | 09.11.2026 |
| Lange Nachwirkung der Bewegung | Eingang `engine/src/afterEffect.ts` ohne neuen Zustand, `p7` bleibt Quelle. Abklingzeit 600 min, Stärke an DirecNet 2005 kalibriert | 09.11.2026 |
| Wischgeste | Ein Zug endet nur beim Verlust am Pager selbst, Schwung aus einem 170-ms-Fenster wie bei Embla, keine Sperre der Randgeste | 10.11.2026 |
| Texte zur Entstehung | Kurzfassung aufklappbar auf der Startseite, ausführliche Fassung als eigene Seite, deutsch und englisch. Quelle sind `docs/40` und `docs/41`, der Bau setzt das Markdown um | 10.11.2026 |
| Hell/Dunkel | Wahl gespeichert (`nebel.theme`) und auf allen Seiten beider Sprachen gültig, Standard hell. Statusleiste folgt über `theme-color` | 11.11.2026 |
| Blutzuckeranzeige | Zahl mittig, Pfeil und Differenz rechts daneben. Keine Puls- oder Skalierungsanimation an der Zahl | 11.11.2026 |
| Trainingsarten | Belastungsmuster statt gleichmäßiger Linie: Intervalle, Kraft und Mannschaftssport wechseln hart und locker und senken etwa halb so stark wie ein Dauerlauf (Guelfi 2005, Yardley 2013) | 11.11.2026 |
| Bewegung in der Analyse | Eigene Linie mit Vorzeichen in der Wirkungskarte, Nachwirkung zählt zur Bewegung | 11.11.2026 |
| Sensorstreuung | `a0` 0,97 ± 0,04 (0,89–1,05), Drift 3,5 mg/dL; MARD 5,0 % statt 6,3 % | 11.11.2026 |
| Reserven beim Aufwachen | Start um 7 Uhr mit 55 % statt 100 % („hungrig aufgewacht“) | 11.11.2026 |
| Content-Security-Policy | Jede Seite trägt eine CSP als `<meta>`; Inline-Skripte nur mit Hash, den der Bau rechnet. Nichts außer der eigenen Herkunft | 11.11.2026 |
| Blätter als Dialoge | Geschlossene Blätter sind unsichtbar und nicht fokussierbar; offen ruht die Seite dahinter, der Fokus kehrt zum Knopf zurück | 11.11.2026 |
| Zeichnen nach Bedarf | Die Verlaufskurve wird nur gezeichnet, wenn sich ein Pixel ändert; Avatare ruhen unter einer aufgelegten Ebene | 11.11.2026 |
| Rechtsgrundlage Impressum | § 18 Abs. 1 MStV, vorsorglich § 5 DDG; Datenschutz- und Änderungsdatum fest statt Baudatum (Rechtscheck, Doc 31) | 12.11.2026 |
| iPhone-App | Eigenständige App im selben Repo (`mobile/`), Website bleibt unverändert; Plan in Doc 50 | 12.11.2026 |
| Echter Puls | Einzige erlaubte echte Eingabe: Puls, nur in der App, steuert nur die Bewegung der simulierten Person, bleibt auf dem Gerät. Glukose, Insulin, Bolus weiter verboten | 12.11.2026 |
| Einheit | Wählbar mg/dL oder mmol/L im neuen Einstellungsblatt; ohne Wahl mmol/L bei englischer Browsersprache aus GB, AU, NZ, CA, IE, ZA. Gerechnet wird weiter in mg/dL (Reddit-Feedback) | 13.11.2026 |
| Unterzucker im Alltag | Nur im ganzen Alltag. Wach und Sensor unter 70: Zeit hält an, ein Fenster nennt die Situation (Bahn, Meeting, Kasse …) und lässt nur 15 g Traubenzucker zu. Danach 15 min sitzen, Bewegung und Schlafen gesperrt, dann erneut prüfen | 13.11.2026 |
| Alter der Personen | Bei den vier niedrigsten Maximalpulsen bis 10 Jahre älter (Streuung von 220 − Alter), höchstens 43. Älter geben die 20 Datensätze nicht her | 13.11.2026 |
| Gerät oder ganzer Alltag | Einstellung „Simulation“, Standard „Gerät“: nur Blutzucker, Sensor, Entscheidungen. „Ganzer Alltag“ schaltet Unterzucker-Situationen und Sprüche von außen zu. So bleibt der erste Eindruck ein ruhiges Gerät | 13.11.2026 |
| Sprüche von außen | Nur im ganzen Alltag. Echte Sätze aus Erfahrungsberichten (Forum diabetes.co.uk, asweetlife.org), ohne Kommentar und Pointe, je einer höchstens alle 90 simulierten Minuten, jeder nur einmal | 13.11.2026 |
| Körpergefühl | Im ganzen Alltag zeigen Hinweise wie „zittrig, schwitzig“ oder „durstig, müde“, was das **Blut** macht; das Unterzucker-Fenster kommt auch, wenn der Sensor noch nichts zeigt (Reddit-Feedback) | 13.11.2026 |
| Achterbahn | Im ganzen Alltag wandert die Insulinempfindlichkeit (sd 0,25, alle 4 h), und mit 10 % je Tag knickt der Katheter; gewechselt wird nach 2 h über 250. Registry Abschnitt 10 | 13.11.2026 |
| Unterzucker-Fenster | Höchstens dreimal je Unterzucker; erst wenn der Wert wieder über der Grenze war, zählt es neu | 13.11.2026 |
| Ideen für später | Person mit hohem Insulinbedarf (etwa 1 IE auf 5 g statt heute 14–24,5 g), damit sichtbar wird, dass 10 IE je Person etwas anderes bedeuten; Kohlenhydrate schätzen nach Mahlzeitenbild; MDI (inzwischen umgesetzt, siehe unten); Zyklus. Details docs/00, Nachtrag 29 | 13.11.2026 |
| Unterzucker macht langsam | Im ganzen Alltag reagieren Essen, Insulin, Bewegung und Schlafen bei Blut unter 70 erst nach 0,7 s, unter 55 nach 1,5 s. Bei Blut über 250 antwortet man gereizt auf Sprüche (Reddit-Feedback) | 13.11.2026 |
| Tagesplan und Einladungen | Im ganzen Alltag zeigt morgens eine Karte, was ansteht (Spontanes wie „Bus verpasst“ nicht). An 60 % der Tage kommt eine Einladung (Pizza, Kuchen, Sushi, Popcorn): Zeit hält an, „Mitessen“ oder „Lieber nicht“. Die Kohlenhydrate nennt niemand, im Protokoll steht nur der Name, erst der Rückblick zeigt die Menge | 13.11.2026 |
| Pen (MDI) als Therapie | In den Einstellungen „Insulin: Pumpe oder Pen“. Pen: Langzeitinsulin einmal am Tag, gleichmäßig über 24 h (Glargin laut Lepore 2000 spitzenlos, fast 24 h); keine Basalrate, kein verzögerter Bolus, kein Katheterknick. Wechsel beginnt neu. Anlass: Hinweis eines Moderators von r/diabetes_t1, dass kaum noch jemand Open-Loop-Pumpe nutzt. AID bewusst nicht (Regler echter Systeme nicht offen, automatische Korrekturen wären ein Bolusrechner) | 13.11.2026 |
| Basal-IQ als Option | An der Pumpe abschaltbar: Basal aus, wenn in 30 min unter 80 mg/dL vorhergesagt oder Sensor unter 70; weiter bei steigendem Wert oder Vorhersage ab 80, höchstens 2 h Pause in 2,5 h (FDA 510(k) K193483, PROLOG-Studie). Erste Stufe der Automatik, die nur weniger Insulin gibt, darum kein Bolusrechner. Control-IQ und andere AID weiter bewusst nicht | 13.11.2026 |
| Anzeige unter dem Sensorwert | „letzter Messwert vor X min“ statt „dein Körper vor etwa …“: zeigt, wie alt die Zahl ist; die Sensorverzögerung steht weiter in den Erklärtexten | 14.11.2026 |
