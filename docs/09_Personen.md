# Nebel — Personen

Stand: 26.09.2026

Auf der Startseite wählt man, in wessen Körper man den Tag verbringt. Neun Personen, jede auf einem der 20 veröffentlichten Parametersätze, dazu eine eigene Person (siehe unten). Das Menü hat zwei Ebenen: zuerst die objektiven Merkmale der Person, aufgeklappt „Was das ausmacht" — dieselben Handlungen, gemessen an diesem Körper, im Vergleich zu den neun Körpern. Der Lerneffekt liegt im Vergleich: gleiche Handlung, anderer Körper.

## Was echt ist und was erfunden

| Echt, aus dem Datensatz | Erfunden, in der App als erfunden gekennzeichnet |
|---|---|
| Größe, Gewicht, Ruhepuls, HbA1c | Vorname |
| Basalrate, KE-Faktor, Korrekturfaktor | Alter (grob nach 220 − Maximalpuls, mindestens 19; bei den vier niedrigsten Maximalpulsen bis rund 10 Jahre älter, im Rahmen der Streuung der Faustformel, höchstens 43) |
| alle Modellparameter, damit die ganze Physiologie | ein Satz Alltag |
| | Aussehen des Avatars |

Der Datensatz enthält weder Alter noch Geschlecht. Die Figuren machen die Körper greifbar, sie behaupten nichts darüber hinaus. Der Satz zum Alltag nennt bewusst nur Beruf oder Ausbildung — nichts, was eine Folge vorwegnimmt („läuft viel" würde die Sportantwort verraten).

## Die neun

| Person | Subjekt | Größe / Gewicht | Ruhepuls | Basal U/h | KE-Faktor | Auffällig in der Simulation |
|---|---|---|---|---|---|---|
| **Lena, 23** — studiert Grundschullehramt (Standard) | 10 | 170 cm / 71 kg | 67 | 0,46 | 14,0 | nah am Median in allem außer der Mahlzeit |
| Jonas, 22 — Ausbildung Mechatroniker | 4 | 169 / 73 | 73 | 0,93 | 23,0 | empfindlich auf Insulin, starker Sport-Responder, harter Sport hebt stark |
| Mira, 38 — Architektin | 6 | 169 / 65 | 58 | 0,59 | 15,5 | Sport senkt maximal, harter Sport hebt nicht |
| Aylin, 41 — Zahnärztin | 7 | 168 / 62 | 65 | 2,00 | 19,8 | am unempfindlichsten auf Insulin, hoher Basalbedarf |
| Malik, 25 — studiert Informatik | 8 | 173 / 68 | 65 | 0,73 | 15,2 | mittlerer Sport-Responder, flache Mahlzeiten |
| Tobias, 43 — fährt Linienbus | 11 | 175 / 84 | 64 | 1,77 | 19,8 | Sport bewirkt fast nichts |
| Jana, 34 — Erzieherin | 13 | 165 / 70 | 59 | 1,26 | 15,5 | höchste Spitze nach dem Essen, Sport senkt maximal |
| Sofia, 24 — Buchhandel | 15 | 166 / 85 | 67 | 1,19 | 18,5 | kräftige Antwort auf Sport in beide Richtungen |
| David, 20 — studiert BWL | 18 | 170 / 88 | 68 | 1,56 | 24,5 | Sport bewirkt wenig, flache Mahlzeiten |

Die Zahlen hinter „Was das ausmacht" stehen in `20_Parameter_Registry.md`, Abschnitt 4, und werden bei jedem Bau neu gerechnet (`responseProfile()` in `engine/src/scenario/profile.ts`, eingebettet von `scripts/build-viewer.mjs`). Sie ändern sich also mit, wenn sich Engine oder Kalibrierung ändern.

## Auswahl

Maximin-Auswahl über fünf Merkmale (Wirkung von 1 U, Spitze nach 60 g mit Bolus, moderater Sport, harter Sport, Körpergewicht), normiert auf die Spanne der 20, Start bei Patient 10 als typischster Person: Jede weitere Person ist die, die von den schon gewählten am weitesten entfernt liegt. Nicht dabei sind die Subjekte 1, 2, 3, 5, 9, 12, 16, 17, 19 und 20; sie liegen jeweils nah an einer gewählten Person. Subjekt 1 war bis zum 26.09. der Standard. Seit 14.11.2026 ohne Finn (Subjekt 14): Mira und Finn waren das ähnlichste Paar (Abstand 0,60 in den fünf Merkmalen), und mit Malik und David gibt es schon zwei Personen um die 20. Sein Platz gehört der eigenen Person.

## Avatare

Flache Portraits als Inline-SVG, eigene Zeichnung, keine Vorlage (`app/personas.js`). Unterschiedliche Hauttöne, Frisuren, Brillen, Bärte. Die Statur folgt dem BMI nur leicht über die Schulterbreite. Kein Körpermerkmal wird zur Aussage über die Person.

## Wechsel

Die Wahl wird im Browser gemerkt (und in der Adresse als `#person=…`). Ein Wechsel beginnt eine neue Sitzung, weil es ein anderer Körper ist; läuft die Sitzung schon länger als eine Stunde, fragt die App vorher nach. Im Simulator steht der Name neben dem Tag.

## Eigenes Profil — bewusst nicht

Nojos Frage: Sollen Menschen mit Diabetes ein eigenes Profil mit ihren Erfahrungswerten anlegen können, damit es für ihr Umfeld noch direkter wird? Nein, nicht als Werteingabe:

- `30_Rechtliche_Einordnung.md` nennt „Eingabe eigener realer Glukose- oder Insulinwerte" und „Nachbildung einer konkreten realen Person" als die zwei Punkte, an denen die Zweckbestimmung kippt und Nebel zum Medizinprodukt wird. Dazu kämen Gesundheitsdaten nach Art. 9 DSGVO.
- Fachlich lassen sich aus KE-Faktor und Korrekturfaktor die 15 Modellparameter nicht eindeutig bestimmen. Ein „persönliches" Profil täuschte Genauigkeit vor.

Stattdessen jetzt: der Hinweis unter dem Menü, sich die ähnlichste Person zu suchen und sie dem Umfeld zu zeigen. **Später (entschieden 26.09.):** Ähnlichkeits-Fragen ohne Zahlen („Sport senkt bei mir stark / mittel / kaum"), die zur passendsten der zehn führen. Vor dem Bau gegen `30_Rechtliche_Einordnung.md` prüfen: keine Speicherung, keine Zahlen, das Ergebnis bleibt eine der zehn erfundenen Personen.

## Eigene Person (14.11.2026)

Umsetzung der Ähnlichkeits-Fragen vom 26.09., auf dem zehnten Platz der Startseite.

- **Vier Fragen, je drei Antworten, keine Zahlen:** Insulin wirkt schwach / mittel / stark (Wirkung von 1 U), nach dem Essen steigt es wenig / mittel / stark (Spitze nach 60 g mit Bolus), Sport senkt kaum / mittel / stark (moderater Sport), Körperbau leicht / mittel / kräftig (Gewicht). Die Antworten zielen auf unteres Ende, Mitte, oberes Ende der Spanne der neun; gewählt wird der nächstliegende Körper. Alle neun sind erreichbar.
- **Das Ergebnis bleibt ein veröffentlichter Körper**, mit unveränderten Körper- und Therapiewerten. Die Karte sagt offen „Körper wie bei …“. Name und Aussehen wählt man selbst, das Alter kommt von der Figur dieses Körpers.
- **Abweichung vom 26.09.:** Damals hieß es „keine Speicherung“. Gespeichert werden jetzt Name, Aussehen und die vier Antworten im Browser (`nebel.eigen.v1`), sonst wäre die Person nach dem Neuladen weg. Die Antworten sind grob und verlassen das Gerät nicht; die Seite „Rechtliches“ nennt den Eintrag. Kein Feld nimmt eine Zahl an.
- Gegen `30_Rechtliche_Einordnung.md` geprüft: keine Eingabe realer Werte (nur drei Stufen), keine Nachbildung einer Person (Ergebnis ist einer von neun Datensätzen), kein Bolusrechner (das Blatt sagt es ausdrücklich).
