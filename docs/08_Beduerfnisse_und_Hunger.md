# Nebel — Bedürfnisse: Hunger und Reserven

Stand: 2026-09-22. Betrifft die Erlebnis- und Szenarioschicht, nicht die Physiologie-Engine.

## Warum Hunger überhaupt drin ist

Ohne Hunger lernt der Nutzer genau eine Handlung: spritzen. Jede Abweichung nach oben wird mit Insulin beantwortet, jede nach unten ausgesessen. Das ist nicht nur falsch, es ist die gefährlichste Fehlvorstellung, die ein Angehöriger mitnehmen kann.

Hunger zwingt zur Handlung **in die andere Richtung**: essen, obwohl gerade nichts zu korrigieren ist. Damit wird aus einem Korrekturspiel ein Alltag mit zwei Hebeln, die sich gegenseitig bedingen.

Designregel: **Nebel darf keine Bolus-Maschine werden.** Jede Interaktionsentscheidung wird daran gemessen.

## Was der Prototyp macht

Der Prototyp führt einen Reservezustand `gly` (Leberglykogen, 0 bis 1) und leitet daraus die Anzeige ab:

| Bedingung | Anzeige |
|---|---|
| `gly < 0.30` | „Reserven · iss etwas" |
| morgens 6–10:30 Uhr und `gly < 0.70` | „Reserven · hungrig aufgewacht" |
| nach Belastung (`Z > 0.22`) und `gly < 0.62` | „Reserven · nachtanken" |
| mittags 11–14:30 Uhr und `gly < 0.60` | „Reserven · Mittagszeit" |
| Belastung `> 0.35` bei `gly < 0.28` | Kombinationsfaktor „Heißhunger" |

Entscheidend ist aber nicht die Anzeige, sondern die Rückkopplung: `gly` moduliert im Prototyp sowohl die endogene Glukoseproduktion als auch die Gegenregulation. Leere Reserven heißt dort: die Leber kann bei einer Hypo schlechter retten.

Das ist eine gute Idee. Und sie ist genau der Punkt, an dem es teuer wird.

## Das Problem: ExtHovorka hat kein Glykogen

Im neuen Engine-Kern ist `EGP0` eine Konstante, moduliert nur durch den Insulinwirkzustand `x3` und durch Bewegung (`p1`, `p2`). Es gibt keinen Speicherzustand, der sich leeren und wieder füllen kann.

Wer die Prototyp-Mechanik übernehmen will, braucht einen **17. Zustand** — eine Nebel-Eigenerweiterung mitten im physiologischen Kern. Das ist genau das, wovor der eigene Risk Review warnt: plausibel, unbelegt, und ab dann ist die Engine nicht mehr die publizierte.

## Was daraus folgt — ehrlich gerechnet

Die naheliegende Rechtfertigung wäre: „Wer nicht isst, dessen Glukose fällt." Das stimmt bei Pumpentherapie **nicht**. Eine korrekt eingestellte Basalrate hält den Wert ohne Nahrung stabil — das ist ihr Zweck. Nichtessen allein hat in ExtHovorka also keine Folge.

Folgen hat es nur in Kombination:

| Situation | Folge in ExtHovorka | belegt? |
|---|---|---|
| Hunger + Bewegung | Glukose fällt über `p3`/`p4`, Nacheffekt über `EElong` | ja, im Modell enthalten |
| Hunger + bereits abgegebener Bolus | Hypo, weil die Kohlenhydrate fehlen | ja |
| Hunger + falsch gesetzte Basalrate | Drift nach unten | ja |
| Leere Reserven → schwächere Gegenregulation | **nicht im Modell** | nein, bräuchte den 17. Zustand |

## Entscheidung für V1

**Hunger wird als Bedürfnis in der Erlebnisschicht geführt, nicht als physiologischer Zustand.**

- Ein Hungerzustand baut sich über die Zeit seit der letzten Kohlenhydratzufuhr und über den aufsummierten Energieverbrauch auf. Der Energieverbrauch kommt aus `EEfast` und `EElong` — die stehen bereits im Modell und sind belegt.
- Essen senkt den Hungerzustand proportional zur aufgenommenen Kohlenhydratmenge.
- Die Anzeige übernimmt die Logik des Prototyps (morgens, mittags, nach Belastung), weil die dort gut getroffen ist.
- Die physiologischen Folgen entstehen ausschließlich über die echten Kopplungen der Tabelle oben. Es wird kein zusätzlicher Effekt erfunden.
- Alle Zeitkonstanten des Hungeraufbaus sind **Nebel-Annahmen** und in der Registry als solche geführt.

Damit ist Hunger spürbar und handlungsrelevant, ohne dass ein unbelegter Mechanismus in den Kern wandert.

## V2-Kandidat: Leberglykogen als 17. Zustand

Nicht verworfen, nur vertagt. Bedingungen für die Wiedervorlage:

1. Eine belegte Beschreibung der Glykogendynamik (Entleerung durch Belastung und Fasten, Wiederauffüllung durch Kohlenhydrate) mit Zeitkonstanten aus der Literatur.
2. Eine belegte Kopplung an EGP und an die Gegenregulation.
3. Eine eigene Validierungsstufe — die bestehende Matrix deckt einen Zustand ab, den das Quellmodell nicht hat, nicht ab.

Bis dahin gilt: Der Prototyp hat diesen Mechanismus, die Engine nicht. Das ist eine bewusste Abweichung und keine Regression — und sie gehört in den Model Validity Envelope.

## Damit ist die offene Frage aus dem Echtzeit-Modus beantwortet

In `06_Echtzeit_Modus.md` stand offen, ob der simulierte Alltag ohne Nutzereingabe weiterläuft. Ein Bedürfnismodell ist die bessere Antwort als ein vorgegebener Tagesplan: Der Nutzer bekommt keinen Ablauf vorgesetzt, sondern einen Zustand, auf den er reagieren muss. Wegschauen hat Folgen, aber nichts passiert hinter seinem Rücken.

Ein Tagesplan bleibt optional für geführte Szenarien — etwa einen Demomodus für Vorträge.

**Präzisiert am 24.09.2026 (W13):** Das Bedürfnismodell ersetzt den Plan für Mahlzeiten. Bewegung kommt weiterhin aus einem Tagesplan, wie im Prototyp. Siehe Widerspruchsprüfung W13.

## Abgrenzung zum Nutzer

Der Hunger gehört der simulierten Person, nicht dem Nutzer. Nebel fordert niemanden auf, selbst etwas zu essen oder zu lassen, führt keine Kalorien- oder Gewichtslogik und bewertet keine Essensentscheidungen. Im Echtzeit-Modus über einen ganzen Tag ist diese Trennung nicht kosmetisch, sondern notwendig.
