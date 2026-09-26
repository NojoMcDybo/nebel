# Nebel — Zielgruppe und Lernziele

Stand: 2026-09-22. Diese Entscheidung geht der Engine vor: sie bestimmt, welche Mechanismen sichtbar gemacht werden müssen und welche nur korrekt im Hintergrund laufen.

## Primäre Zielgruppe

**Angehörige und Freunde von Menschen mit Typ-1-Diabetes.** Partner, Eltern, Geschwister, enge Freunde, Mitbewohner, Trainerinnen und Trainer im Verein.

Sekundär, später: Lehramtsstudierende und Lehrkräfte mit Blick auf Schulsport.

Nicht Zielgruppe: Menschen mit Typ-1-Diabetes selbst (die brauchen kein Empathiewerkzeug), medizinisches Fachpersonal, Therapieentscheidungen jeder Art.

## Was diese Gruppe nicht versteht — und warum

Angehörige sehen das Ergebnis, nicht den Prozess. Sie sehen den Blick aufs Handy beim Essen, die schlechte Laune um 3 Uhr nachts, das abgesagte Treffen. Was sie nicht sehen:

1. **Die Dauerbelastung ohne Ereignis.** Es passiert nichts Dramatisches — und trotzdem läuft im Kopf permanent ein Nebenprozess. Das ist der stärkste Eindruck aus dem eigenen Selbstversuch und muss das Zentrum der Erfahrung sein, nicht die Ausnahmesituation.
2. **Die Verzögerung.** Eine Entscheidung wirkt in 20 bis 90 Minuten. Man handelt gegen eine Zukunft, die man nicht kennt. Angehörige bewerten Entscheidungen im Rückblick, wo alles offensichtlich wirkt.
3. **Die Unsicherheit der Zahl.** Der CGM-Wert ist eine gefilterte, verzögerte Schätzung von etwas anderem als Blutglukose. „Du hast doch den Wert gesehen" ist deshalb ein Vorwurf, der auf einem Missverständnis beruht.
4. **Dass gleiches Handeln unterschiedlich ausgeht.** Gleiche Mahlzeit, gleicher Bolus, anderer Tag, anderes Ergebnis. Für Außenstehende sieht das nach Nachlässigkeit aus.
5. **Dass Richtiges sich falsch anfühlt.** Essen müssen ohne Hunger. Sport abbrechen, obwohl es gut läuft. Nachts aufstehen, obwohl alles im Zielbereich aussah.

## Lernziele in Reihenfolge

| # | Lernziel | Woran man es misst |
|---|---|---|
| 1 | Die Belastung ist dauerhaft und nicht abschaltbar | Nutzer beschreibt nach der Sitzung den Aufwand, nicht ein Einzelereignis. Träger dieses Lernziels ist der Echtzeit-Modus, siehe `06_Echtzeit_Modus.md` |
| 2 | Wirkung ist verzögert, Entscheidungen fallen unter Unsicherheit | Nutzer kann benennen, warum eine Korrektur zu spät kam |
| 3 | Die angezeigte Zahl ist nicht der Körper | Nutzer unterscheidet Sensorwert und tatsächliche Glukose |
| 4 | Variabilität ist keine Nachlässigkeit | Nutzer erklärt zwei unterschiedliche Verläufe bei gleicher Handlung |
| 5 | Bewegung ist nicht einfach „Zucker runter" | Nutzer kennt den Unterschied zwischen moderat und hochintensiv |

Lernziel 5 bleibt fest verankert — sowohl wegen der Sportrelevanz als auch, weil Bewegung der Bereich ist, in dem Angehörige am häufigsten falsch beraten („iss doch was Süßes, dann geht's schon").

## Was daraus für die Engine folgt

| Folge | Konsequenz |
|---|---|
| Lernziel 1 verlangt Zeit, nicht Dramatik | Die Simulation muss über Stunden und Tage laufen, nicht über Einzelszenen. Langzeitstabilität der Numerik ist ein Produktmerkmal, kein Detail |
| Lernziel 2 verlangt echte Verzögerung | Keine Sofortwirkung an irgendeiner Stelle. Die Insulinwirkung ist die zentrale Zeitskala der ganzen Erfahrung: Beginn nach 10–20 min, am stärksten nach etwa einer Stunde, vorbei nach drei bis vier. **Korrigiert 26.09.2026:** Hier stand `tmaxI` ≈ 110 min aus den Quellsubjekten. Das ist zu träge, siehe Changelog Nachtrag 9 |
| Lernziel 3 verlangt die getrennte Beobachtungsschicht | Der Analyse-Screen muss `G` und `Gsensor` gegeneinander zeigen können. Damit wird die Nebel-Eigenleistung CGM-Schicht zum Kern, nicht zur Kür |
| Lernziel 4 verlangt Determinismus **und** Variabilität | Gleicher Seed = gleicher Verlauf (Sandbox), aber verschiedene Subjekte und verschiedene Tage unterscheiden sich sichtbar |
| Lernziel 5 verlangt das vollständige Bewegungsmodul | Inklusive `p2`-Pfad für hochintensive Belastung, sonst fehlt der Anstieg beim harten Training |

## Was das ausschließt

- Keine Gamification mit Punktestand für „gute Werte". Das dreht Lernziel 4 ins Gegenteil und erzeugt genau die Bewertungshaltung, die Angehörige ohnehin mitbringen.
- Keine Belohnung für Time-in-Range. Ein guter Tag darf langweilig aussehen — das Farbkonzept des Prototyps macht das bereits richtig.
- Keine Dosierungsempfehlungen, auch nicht als „Tipp".
- Keine Simulation einer konkreten realen Person. Nutzer könnten sonst Rückschlüsse auf ihren Angehörigen ziehen, die das Modell nicht trägt.

## Offene Frage

V1 simuliert eine **erwachsene** Person (alle 20 verfügbaren Parametersätze sind Erwachsene, HbA1c 5.7–7.6 %). Eltern von Kindern mit Typ-1-Diabetes sind aber eine der größten Angehörigengruppen. Entweder wird die Einschränkung offen kommuniziert, oder es braucht eine belegte pädiatrische Parametrisierung — die frei zu skalieren wäre genau der Fehler Nr. 6 aus dem Risk Review.

Entscheidung für V1: offen kommunizieren. Pädiatrie ist ein eigener Research-Block, kein Schieberegler.

**Recherche abgeschlossen am 22.09.2026:** Es existiert kein pädiatrischer Parametersatz, der sich in ExtHovorka einsetzen lässt. Details und geprüfte Quellen in `07_Paediatrie_Rechercheergebnis.md`. Pädiatrie ist damit nicht Teil von V1.
