# Nebel — Pädiatrische Parameter: Rechercheergebnis

Stand: 2026-09-22
Frage: Gibt es belegte Parametersätze für Kinder und Jugendliche, die sich in ExtHovorka einsetzen lassen?

**Antwort: nein.** Pädiatrie ist damit nicht Teil von V1.

## Was geprüft wurde

### Wilinska et al. (2010) — Cambridge-Simulator
Richtige Modellfamilie: Hovorka. Die Umgebung enthält 18 synthetische Subjekte und wurde gegen eine klinische Studie an **jungen Menschen** mit Typ-1-Diabetes validiert. Veröffentlicht sind Populationswerte, kein frei verfügbarer Satz je Subjekt; der Simulator selbst ist nicht quelloffen.

Entscheidender Punkt: Es ist der **einfache** Hovorka. Die ExtHovorka-Erweiterungen — herzfrequenzgetriebene Bewegung (`p1`–`p8`, `VT_HRR`), nichtlineare glukoseabhängige Insulinsensitivität (`aSI`, `b`, `c`, `dSI`), schnelle/langsame Kohlenhydrattrennung — existieren dort nicht und sind für Kinder auch nirgends sonst bestimmt worden. Man könnte also bestenfalls die Basisparameter übernehmen und müsste den gesamten Bewegungsteil erfinden. Das ist genau der Fehler Nr. 6 aus dem Risk Review.

https://doi.org/10.1177/193229681000400117

### Félix et al. (2022) — ETH-Modell mit Bewegung
Enthält tatsächlich Kinder: fünf Kinder im Alter von 8 bis 14 Jahren aus der DiaActive-Studie, individuell gefittet. Code und Daten sind offen (CC-BY, GitLab der ETH).

Aber: andere Modellfamilie (Cobelli-Minimalmodell), Bewegung über Akzelerometerzählungen statt Herzfrequenz, und es gibt keine pädiatrische Populationsparametrisierung, sondern fünf Einzelfits. Übertragbar auf ExtHovorka ist davon nichts.

https://journals.plos.org/ploscompbiol/article?id=10.1371%2Fjournal.pcbi.1010289

### UVA/Padova S2013
Enthält je 100 Kinder und 100 Jugendliche. Falsche Modellfamilie. Parameter aus UVA/Padova in ExtHovorka einzusetzen verletzt die Regel aus der Spec, Abschnitt 17 der V1: keine Vermischung ohne explizite Harmonisierung. Die Harmonisierung wäre eine eigene wissenschaftliche Arbeit.

### Statistische Virtualpopulation mit Bewegung (PLOS ONE 2019)
Hovorka-Insulinkinetik, Bewegung über das Hernandez-Ordonez-Modell, Parameter in Tabelle 2 veröffentlicht, Code offen. **Nur Erwachsene**, mittleres Gewicht 76,3 kg.

https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0217301

## Entscheidung

V1 simuliert eine erwachsene Person. Keine pädiatrische Parametrisierung, keine Skalierung von Erwachsenenwerten, kein Alters-Schieberegler.

Das wird im Produkt offen gesagt, nicht im Kleingedruckten versteckt — gerade weil Eltern von Kindern mit Typ-1-Diabetes eine große Angehörigengruppe sind und sonst eine Genauigkeit annehmen würden, die das Modell nicht hat.

## Wiedervorlage

Pädiatrie wird erst dann wieder aufgemacht, wenn eines davon eintritt:

1. Ein publizierter ExtHovorka-Parametersatz für Kinder oder Jugendliche erscheint.
2. Es liegt eine dokumentierte Harmonisierung zwischen der Hovorka- und der UVA/Padova-Familie vor.
3. Nebel wechselt bewusst und vollständig die Modellfamilie — was die gesamte Validierung neu aufrollt.

Alles andere wäre plausibles Raten mit Kinderzahlen. Genau davor warnt der eigene Risk Review.
