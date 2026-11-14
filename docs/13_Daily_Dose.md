# Daily Dose of T1D

Stand 14.11.2026. Die tägliche Herausforderung, angefragt von Nojo über die App-Sitzung. Code: `app/template.html` (Block „Daily Dose“, reiner Teil zwischen `KS-PURE-BEGIN` und `KS-PURE-END`), Prüfung: `engine/scripts/check-adapter.cjs`, Block „Daily Dose“.

## Name

„Daily Dose of T1D“, ein Wortspiel mit „Daily“: die tägliche Dosis Typ-1-Alltag, passend zu Insulin. Gewählt von Nojo am 14.11.2026; der erste Entwurf hieß „Klarsicht“. Gezählt wird wie bei Wordle, „Daily Dose of T1D #1“ ist der 14.11.2026. Die Bewertungswörter (klar, diesig, neblig, Nebelbank) bleiben im Nebelbild.

Aus dem alten Namen bleiben bewusst: die Speichereinträge `nebel.klarsicht` und `nebel.klarsicht.lauf` (vorhandene Stände gehen nicht verloren), der Seed-Text `"klarsicht " + Datum` (die Tage bleiben dieselben) und der Sprung `#klarsicht` neben dem neuen `#daily` (ältere Mitteilungen zeigen darauf).

## Regeln

- **Ein Tag für alle.** Das Datum in Europe/Berlin bestimmt den Seed, und der Seed bestimmt:
  - die Person, eine der neun Figuren,
  - den Tagesmodus, der reihum wechselt (normal, Zyklus, kurze Nacht, Hitze, Alkohol, Schwangerschaft mit Woche 8–38),
  - Pen oder Pumpe.

  „Ganzer Alltag“ ist immer an. Die Einladungen kommen ebenfalls aus dem Seed. Bemerkungen und Snaps bleiben zufällig, weil sie den Ablauf nicht ändern.
- **Zyklus und Schwangerschaft** werden nur Figuren zugeteilt, die als Frauen beschrieben sind (Lena, Mira, Aylin, Jana, Sofia). Das ist eine NEBEL-ANNAHME, denn der Datensatz kennt kein Geschlecht.
- **Ein Versuch je Datum, kein Neustart.**
  - Im Lauf sind Personenwahl, Pen/Pumpe, Tagesmodus, Simulationsart und „Von vorn beginnen“ ausgeblendet.
  - Ein Wechsel führt ins freie Spiel, der Lauf bleibt gespeichert.
  - Ein angefangener Tag darf bis zum Ende des Folgetags fertig gespielt werden.
- **Tempo frei.** Der Lauf endet nach 24 Simulationsstunden (7:00 bis 7:00).
- **Pulsgurt erlaubt.** Die Karte zeigt dann „mit Gurt“ (`eng.beltT` gesetzt, App-Sitzung).
- **Getrennter Speicher.**
  - `nebel.klarsicht` hält Zustimmung, laufenden Tag und Verlauf.
  - `nebel.klarsicht.lauf` hält den Spielstand des Laufs.
  - Der Spielstand des freien Spiels (`nebel.state.v1`) wird nie berührt.
  - Die englische Fassung hat eigene Einträge.
- **Nichts über das Netz.** Geteilt wird nur, wenn der Nutzer selbst teilt (Bild über `navigator.share`, sonst Text in die Zwischenablage). Das steht so auch auf der Datenschutzseite.

## Bewertung

Grundlage ist der internationale Konsens (laut PubMed: Battelino 2019, Diabetes Care 42:1593, [doi:10.2337/dci19-0028](https://doi.org/10.2337/dci19-0028)): Ziel 70–180 mg/dL, mehr als 70 % im Ziel, weniger als 4 % unter 70. Gemessen wird das Blut (nicht der Sensor), alle 5 Minuten.

| Wort | Bedingung |
|---|---|
| klar | ≥ 70 % im Ziel und < 4 % unter 70 |
| diesig | ≥ 50 % im Ziel |
| neblig | < 50 % im Ziel |
| Nebelbank | mindestens ein Notfall |

- **Notfall:** Blut 15 Minuten am Stück unter 54 mg/dL. Das entspricht Stufe 2 im Konsens; die Dauer von 15 min folgt der Definition einer Episode.
- **Streifen:** 24 Felder, eins je Stunde. Ein Feld ist tief, wenn ein Wert unter 70 lag, hoch bei einem Stundenmittel über 180, sonst im Ziel.
- **Entscheidungen:** Mahlzeiten, Bolus, Langzeitinsulin, Basalrate, selbst gestartete Bewegung und Absagen. Geplante Bewegung zählt nicht.
- **Serie:** aufeinanderfolgende Tage bis heute oder gestern.

## Oberfläche

- **Beim ersten Öffnen** erscheint nach dem Hinweis die Frage „Daily Dose of T1D spielen?“ mit „Annehmen“ und „Später“.
- **In den Einstellungen** gibt es den Schalter „Täglich aus/an“ und die Knöpfe „Heute spielen“ und „Verlauf“.
- **Auf der Startseite** zeigt eine Leiste den heutigen Tag oder den laufenden Lauf.
- **Eine Karte für alles.** Ergebnis und Verlauf liegen auf derselben Karte, ein eigenes Verlaufsblatt gibt es nicht. Von oben nach unten:
  - „nebel. Daily Dose of T1D #N“ mit Datum, darunter Chips für Person, Modus und Pen/Pumpe (und „mit Gurt“),
  - der Anteil im Ziel mit dem Wort,
  - die Tageskurve im Stil der Auswertung: Zielband, Linien bei 70 und 180, Blut als Linie, Sensor als Punkte, logarithmische Achse 40–400,
  - darunter klein der Streifen aus 24 Stundenfeldern,
  - die Werte als Tabelle wie die Statistikliste der Auswertung: unter 70, Mittelwert, CV, Entscheidungen, Notfälle, Therapie,
  - der Verlauf: gespielt, Serie, längste Serie, Schnitt im Ziel,
  - kompakt nebeneinander der Kalender (zehn Wochen, Spalten sind Wochen, Zellen nach Anteil im Ziel getönt, Notfalltage rot umrandet) und die Verteilung in fünf Stufen (<50, 50–70, 70–80, 80–90, ≥90 %), der gezeigte Tag hervorgehoben.
- **Ohne gespielten Tag** zeigt „Verlauf“ nur den Verlaufsteil.
- **Kurve im Verlauf.** Jeder Eintrag speichert die Kurve: Minuten ab 7 Uhr, Blut und Sensor in ganzen mg/dL, alle 5 Minuten (rund 3 KB je Tag). So zeigen auch alte Tage sie. Einträge aus der ersten Fassung haben keine Kurve, dort bleibt das Chart leer.
- **Teilbild:** dieselbe Karte, dreifach groß auf Canvas (1080 px breit), in den Farben des aktuellen Designs.
- **Teiltext:** drei Zeilen, Felder 🟩 im Ziel, 🟨 hoch, 🟥 tief.

## Bewusst nicht

- Keine Rangliste und kein Server.
- Keine Belohnung über die Karte hinaus.
- Keine Nachholtage.
