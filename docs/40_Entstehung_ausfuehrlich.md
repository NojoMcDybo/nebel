# nebel. ausführlich: Entstehung, Entscheidungen und Grundlagen

*Ausführliche Fassung, Stand 10.11.2026. Die Kurzfassung ohne Formeln steht in [nebel. kompakt](41_Entstehung_kompakt.md).*

nebel. ist ein Typ-1-Diabetes-Simulator im Browser. Er richtet sich an Angehörige und Freunde von Menschen mit Typ-1-Diabetes und soll ihnen erfahrbar machen, was ein Tag mit dieser Krankheit verlangt: die Daueraufmerksamkeit, die Verzögerung zwischen Entscheidung und Wirkung und die Unsicherheit einer Zahl, die nie ganz stimmt. Die App läuft ohne Installation unter https://nojomcdybo.github.io/nebel/ (deutsch) und https://nojomcdybo.github.io/nebel/en/ (englisch). Quelltext und Dokumentation liegen offen unter https://github.com/NojoMcDybo/nebel.

nebel. ist ein Lernsystem und kein Medizinprodukt. Es gibt keine Dosierungsempfehlung, keinen Bolusrechner und keine Möglichkeit, eigene Werte einzugeben. Keine Zahl aus der Simulation darf eine echte Therapieentscheidung beeinflussen.

Hier steht, wie das Projekt entstanden ist und warum welche Entscheidung fiel. Dazu kommen das Modell, die berücksichtigten Faktoren, die Kalibrierungen an Studien und die Grenzen. Im Text verweisen Autor und Jahr auf die Quellen am Ende.

---

## 1. Ausgangspunkt

### 1.1 Für wen

Die primäre Zielgruppe sind Partnerinnen und Partner, Eltern, Geschwister, Freundinnen und Freunde, Mitbewohner und Trainer im Verein. Später, nachrangig, auch Lehramtsstudierende und Lehrkräfte mit Blick auf den Schulsport. Nicht gemeint sind Menschen mit Typ-1-Diabetes selbst, medizinisches Fachpersonal und jede Form von Therapieentscheidung.

Angehörige sehen das Ergebnis, nicht den Prozess: den Blick aufs Handy beim Essen, die schlechte Laune um drei Uhr nachts, das abgesagte Treffen. Was ihnen fehlt, sind fünf Einsichten. Aus ihnen wurden die Lernziele:

| Nr. | Lernziel | Woran man es merkt |
|---|---|---|
| 1 | Die Belastung ist dauerhaft und lässt sich nicht abschalten | Nach der Sitzung wird der Aufwand beschrieben, nicht ein Einzelereignis |
| 2 | Wirkung kommt verzögert, entschieden wird unter Unsicherheit | Man kann benennen, warum eine Korrektur zu spät kam |
| 3 | Die angezeigte Zahl ist nicht der Körper | Sensorwert und tatsächliche Glukose werden unterschieden |
| 4 | Variabilität ist keine Nachlässigkeit | Zwei verschiedene Verläufe bei gleicher Handlung lassen sich erklären |
| 5 | Bewegung ist nicht einfach „Zucker runter“ | Der Unterschied zwischen moderater und harter Belastung ist bekannt |

Das erste Lernziel stammt aus einem eigenen Selbstversuch. Am stärksten blieb dabei der Nebenprozess im Kopf hängen, der nie aufhört. Einzelne Ausnahmesituationen wogen weniger. Deshalb steht die Dauerbelastung im Mittelpunkt und nicht das Drama.

Aus den Lernzielen folgen Ausschlüsse: keine Punkte für „gute Werte“ (das würde genau die Bewertungshaltung verstärken, die Angehörige ohnehin mitbringen), keine Belohnung für Zeit im Zielbereich, keine Dosierungstipps und keine Simulation einer konkreten realen Person.

### 1.2 Die ersten Dokumente und der Prototyp

Am Anfang standen ein interaktiver Prototyp (`index.html`) mit einer eigenen, vereinfachten Rechenlogik und drei Konzeptdokumente vom 14.09.2026: eine wissenschaftliche Grundlegung der Engine, eine Gleichungs- und Parameterspezifikation und ein Risiko-Review mit 15 inhaltlichen Scheitergründen. Der Prototyp prägte Bedienung und Gestaltung. Seine Formeln und Zeitkonstanten gelten ausdrücklich nicht als physiologische Grundlage.

---

## 2. Zeitleiste

| Datum | Schritt |
|---|---|
| 14.09.2026 | Drei Konzeptdokumente: Grundlegung, Gleichungsspezifikation V1, Risiko-Review |
| 15.09.2026 | Entscheidung für das erweiterte Hovorka-Modell (ExtHovorka) als Engine-Kern |
| 22.09.2026 | Widerspruchsprüfung der Dokumente (W1 bis W12). Referenzimplementierung py-mgipsim gefunden. Zielgruppe, Lernziele, Echtzeit-Modus, Hunger als Bedürfnis, Pädiatrie-Recherche, rechtliche Einordnung, Apache-2.0-Lizenz. Engine gebaut: 84 Tests, numerischer Abgleich gegen py-mgipsim bestanden |
| 23.09.2026 | Prototyp-Oberfläche auf die geprüfte Engine umgestellt. Sensorverzögerung auf 5 min kalibriert. Erst das publizierte Dexcom-G6-Fehlermodell, dann ein eigenes Sensormodell V2 |
| 23./24.09.2026 | Fehler im Belastungsszenario gefunden, der Dokumentationszahlen verfälscht hatte. Vier Adapterfehler behoben. Widerspruch W13 (Tagesplan) aufgelöst |
| 26.09.2026 | Rückblick deckt Druck auf den Sensor auf. Insulinaufnahme auf 50 min kalibriert. Kalibrierung zentral in der Engine. Zehn wählbare Personen. Vorhersage in der Auswertung. Dexcom-Trendpfeile. Fett und Eiweiß in der Engine |
| 12.10.2026 | Veröffentlichung vorbereitet: GitHub Pages, eigene GPL-Datei für die Parametersätze, lokale Schriften, Seite „Rechtliches“, Bau-Pipeline, englisches README |
| 28.10.2026 | Antwort der py-mgipsim-Autoren: keine Einwände. Hinweisfenster vor der ersten Nutzung. Repository öffentlich, Release v1.0.0. Englische Fassung unter `/en/`, Release v1.1.0 |
| 09.11.2026 | Sprachwahl im Hinweisfenster. Reserven füllen sich beim Essen, Hinweis „Heißhunger“. Bewegungssystem abgeglichen, Training absagbar. Lange Nachwirkung der Bewegung kalibriert |
| 10.11.2026 | Wischgeste für das iPhone überarbeitet. Diese Texte zur Entstehung auf der Startseite, auf Deutsch und Englisch |
| 11.11.2026 | Web-App für den iPhone-Startbildschirm. Trainingsarten wechseln harte und lockere Minuten, Bewegung erscheint in der Wirkungskarte, Sensor streut weniger. Release v1.2.0 |

---

## 3. Grundsatzentscheidungen

| Frage | Entscheidung | Datum |
|---|---|---|
| Zielgruppe | Angehörige und Freunde; Schulsport später | 22.09. |
| Engine-Kern | ExtHovorka, 16 Zustände, herzfrequenzgetrieben | 15.09. |
| Therapieform | Insulinpumpe (CSII), offener Regelkreis | 09/2026 |
| Architektur | Eigenständiges TypeScript-Modul mit Testsuite, ohne Oberfläche lauffähig | 22.09. |
| Referenzimplementierung | py-mgipsim nur als numerisches Vergleichsorakel, kein Code übernommen | 22.09. |
| Einheiten | Intern SI (mmol/L, mmol, mU), Umrechnung nur an der Anzeigegrenze | 22.09. |
| Tageszeit | Kein Tagesrhythmus, kein Dawn-Phänomen in V1 | 22.09. |
| Echtzeit-Modus | Kernfunktion, trägt Lernziel 1 | 22.09. |
| Kinder | Nicht in V1, weil kein passender Parametersatz existiert | 22.09. |
| Hunger | Bedürfnis in der Erlebnisschicht, kein neuer physiologischer Zustand | 22.09. |
| Personen | Zehn erfundene Figuren auf zehn veröffentlichten Modellkörpern | 26.09. |
| Eigenes Profil | Keine Werteingabe | 26.09. |
| Kalibrierung | Sensorverzögerung 5 min, Insulinaufnahme 50 min, zentral an einer Stelle | 26.09. |
| Fett und Eiweiß | In der Engine, ohne neuen Zustand | 26.09. |
| Trendpfeil | Sieben Stufen wie Dexcom G6 | 26.09. |
| Veröffentlichung | Öffentliches Repository, App auf GitHub Pages, Parametersätze als eigene GPL-Datei | 12.10. |
| Lange Nachwirkung der Bewegung | Als Eingang ohne neuen Zustand, an DirecNet kalibriert | 09.11. |

### 3.1 Warum ein publiziertes Modell

Die erste Gleichungsspezifikation mischte drei Modellfamilien: Glukose und Verbrauch aus dem UVA/Padova-Modell (Dalla Man), Insulin und Insulinwirkung aus Hovorka, Bewegung aus Dalla Man und Breton. Das verletzte ihre eigene Regel, Modelle nicht ohne ausdrückliche Harmonisierung zu vermischen (Widerspruch W1). Dazu kamen Wirkpfade ohne Kopplung (W2), ein undefinierter Nierenterm (W3), verwaiste Parameter (W4), offene Einheiten (W5), eine Empfehlung für eine eigene Modellfamilie (W6), eine zu kurze Zustandsliste (W7), widersprüchliche Aussagen zur Tageszeit (W8), ein fehlendes Sensormodell und eine widersprüchliche Sensorverzögerung (W9), unklare Therapieform (W10) und Schwellen in der falschen Einheit (W11).

Statt die Mischung zu reparieren, ersetzt nebel. sie ganz durch ein einziges veröffentlichtes Modell: das erweiterte Hovorka-Modell der Gruppe um Ali Cinar am Illinois Institute of Technology (Hovorka et al. 2004; Rashid et al. 2019; Siket, Rashid & Cinar 2025). Die Gründe:

- Ein vollständig spezifiziertes Modell statt einer Kombination aus drei Familien.
- Bewegung gehört zum Modell selbst. Das zählt, weil Sport fest zu nebel. gehört (Lernziel 5).
- Es gibt 20 publizierte Parametersätze virtueller Patienten, mit Basalrate, KE-Faktor, Korrekturfaktor, Ruhepuls, HbA1c und Körpermaßen. nebel. muss keine Therapieparameter erfinden.
- Mit py-mgipsim existiert eine quelloffene Referenzimplementierung, gegen die sich die eigene Umsetzung numerisch prüfen lässt.

Eigenleistung beschränkt sich bewusst auf drei Schichten, die das Quellmodell nicht hat: den Sensor (Beobachtung), die Pumpe und das Erleben. In die Physiologie greift nebel. nur an wenigen, einzeln begründeten Stellen ein (Abschnitt 6).

### 3.2 Architektur: Schichten als Einbahnstraßen

```
EREIGNISSE    Mahlzeit · Insulin · Herzfrequenz
   ↓
PHYSIOLOGIE   16 Zustände, SI-Einheiten, deterministisch      ExtHovorka, publiziert
   ↓
BEOBACHTUNG   Interstitium · Sensorfehler · 5-min-Raster       nebel.
   ↓
ERLEBNIS      Anzeige, Alarme, Bedürfnisse, Auswertung        nebel.
```

Regeln, die im Code durchgesetzt werden:

1. **Echtzeit zuerst.** Die Engine rechnet in Häppchen. Jede Erweiterung muss eine Nachholrechnung überstehen, ohne das Ergebnis zu ändern.
2. **Kein Code aus py-mgipsim.** Umgesetzt wird aus den Veröffentlichungen. py-mgipsim dient nur in der Testsuite als Vergleich.
3. **Keine Patientendaten im Repository.** Die 20 Parametersätze werden zur Testzeit aus einem lokalen, nicht versionierten Ordner gelesen.
4. **Kein erfundener Parameter.** Jede Zahl steht mit Quelle oder als ausgewiesene Annahme im Parameterregister.
5. **Beobachtung ändert nie Physiologie.** Ein Messfehler verändert nie den simulierten Körper.
6. **Determinismus.** Gleiche Person, gleicher Zufallswert und gleiche Ereignisse ergeben bitgleich denselben Verlauf.

### 3.3 Therapieform

nebel. bildet eine Insulinpumpe im offenen Regelkreis ab: Basalprofil, Bolus, verzögerter Bolus, temporäre Basalrate und Pumpenstopp. Das Modell nimmt Insulin als kontinuierlichen Strom an, das passt direkt zur Pumpe. Ein automatischer Regelalgorithmus (AID) ist nicht enthalten.

### 3.4 Was bewusst fehlt

- Kein Tagesrhythmus der Insulinempfindlichkeit, kein Dawn-Phänomen. ExtHovorka hat keinen solchen Term. Die Uhrzeit ist Anzeige und Ereignismerkmal, kein physiologischer Faktor.
- Kein Glukagon- und Gegenregulationsmodell.
- Keine Multiplikatoren für Stress, Krankheit, Schlaf, Alkohol oder Zyklus.
- Kein Leberglykogen als eigener Zustand (Abschnitt 8.2).
- Keine Kinder und Jugendlichen (Abschnitt 11).
- Kein Bolusrechner und keine Eingabe eigener Werte (Abschnitt 10).

---

## 4. Das physiologische Modell

### 4.1 Zustände und Eingänge

ExtHovorka beschreibt den Körper mit 16 Zuständen:

| Gruppe | Zustände |
|---|---|
| Insulin unter der Haut und im Blut | `S1`, `S2` (subkutan, mU), `I` (Plasma, mU/L) |
| Insulinwirkung | `x1` (Glukosetransport), `x2` (Verbrauch im Gewebe), `x3` (Bremsen der Leber) |
| Glukose | `Q1` (zentral, mmol), `Q2` (peripher, mmol), `IG` (Gewebeflüssigkeit, mmol/L) |
| Kohlenhydrate im Darm | je zwei Kompartimente für schnelle und langsame Kohlenhydrate |
| Bewegung | `EEfast` (schnelle Antwort), `EEhigh` (Anteil über der ventilatorischen Schwelle), `EElong` (kurzer Nacheffekt) |

Eingänge sind schnelle und langsame Kohlenhydrate (mmol/min), Insulin (mU/min) und die Herzfrequenz (bpm). nebel. ergänzt zwei optionale Eingänge, die ohne Angabe neutral sind: zusätzliche Glukose aus Eiweiß und einen Faktor auf die Insulinempfindlichkeit (`siFactor`), über den Fett und die lange Nachwirkung der Bewegung wirken.

### 4.2 Gleichungen in Kurzform

Insulinaufnahme und Plasmainsulin:

```
dS1/dt = uInsulin − S1/tmaxI
dS2/dt = (S1 − S2)/tmaxI
dI/dt  = S2/(VI · tmaxI) − ke · I
```

Glukoseabhängige Insulinempfindlichkeit: Im Unterzucker steigt sie, im Überzucker sinkt sie (`tanh`-Abbildung, normiert auf 5 mmol/L, und ein linearer Abschlag oberhalb von 5,55 mmol/L). Das ist keine Tageszeitabhängigkeit und wird in der App auch nicht so erklärt.

```
dx1/dt = kb1' · I − ka1 · x1        kb' = kb · SIhypo · SIhyper · siFactor
dx2/dt = kb2' · I − ka2 · x2
dx3/dt = kb3' · I − ka3 · x3
```

Leber, Gehirn, Niere:

```
EGP  = max(0, EGP0 · (1 − x3) · (1 + p1 · EEfast + p2 · EEhigh))
F01n = BW · F01, unter 4,5 mmol/L linear gesenkt
FR   = 0,003 · (G − 9) · VG ab 9 mmol/L, sonst 0
```

Glukosebilanz:

```
dQ1/dt = − x1·Q1 + k12·Q2 − F01n − FR + Aufnahme aus dem Darm + EGP − p3·EEfast   [+ Glukose aus Eiweiß]
dQ2/dt =   x1·Q1 − k12·Q2 − x2·Q2 + p3·EEfast − p4·EEfast − p5·x2·EElong
dIG/dt = (G − IG)/tsub
```

Bewegung, getrieben von der Herzfrequenzreserve `HRR = (HF − Ruhepuls)/(Maximalpuls − Ruhepuls)`:

```
dEEfast/dt = p6 · (HRR − EEfast)
dEEhigh/dt = p8 · (HRRhigh − EEhigh)        HRRhigh: Anteil oberhalb der ventilatorischen Schwelle
dEElong/dt = p6 · EEfast − p7 · EElong
```

Moderate Belastung senkt den Wert über `p3` und `p4`. Harte Belastung oberhalb der ventilatorischen Schwelle treibt über `p2` die Leber an und kann den Wert steigen lassen. Das ist der Mechanismus hinter Lernziel 5.

Numerische Schutzgrenzen ohne physiologische Bedeutung: Glukose zwischen 1 und 32 mmol/L, Leberproduktion nicht negativ.

### 4.3 Parameter

35 Parameter, davon 16 je Person verschieden und 19 für alle gleich. Die Spannweiten im Register sind die beobachteten Werte über die 20 Datensätze, keine Populationsverteilungen. Zwei Parameter (`beta`, `a`) sind Reste eines älteren Bewegungsmodells, werden in keiner Gleichung verwendet und sind nicht übernommen.

Auffällig: Die Bewegungsantwort unterscheidet sich zwischen den Personen fast ausschließlich über `p3`, `p4`, `p5`, Ruhe- und Maximalpuls und die ventilatorische Schwelle. `p3` allein spannt einen Faktor 13. Dieselbe moderate Einheit senkt den Wert je nach Person um 2 bis 89 mg/dL.

Alle 20 Datensätze sind Erwachsene mit HbA1c zwischen 5,7 und 7,6 %. Alter und Geschlecht stehen nicht darin. Jede Basalrate hält ohne Essen exakt 108 mg/dL, weil sie darauf gefittet ist.

### 4.4 Numerik

Schrittweite 1 min, explizites Euler-Verfahren, Ereignisse an exakten Zeitgrenzen. Geprüft gegen RK4 und gegen halbe und viertel Schrittweite, Langzeitläufe über sieben Tage. Das Basalgleichgewicht wird über 72 Stunden ausintegriert statt algebraisch gelöst: Bei einer gefitteten Basalrate hat die Bilanz eine Nullstelle ohne Vorzeichenwechsel, an der jedes Bisektionsverfahren scheitert. Nebeneffekt: Der geschlossene Ausdruck der Referenz musste nicht angefasst werden.

---

## 5. Validierung

### 5.1 Numerischer Abgleich mit der Referenz

Vor jeder eigenen Erweiterung wurde geprüft, dass die Umsetzung exakt das publizierte Modell rechnet. Ein Skript lädt nur die Gleichungsfunktion von py-mgipsim, führt sie aus und schreibt eine Zahlentabelle. Kein Code wandert ins Projekt.

| Prüfung | Ergebnis |
|---|---|
| Ableitungen an 120 zufälligen Zuständen, drei Personen | Abweichung kleiner als 1e-12 relativ |
| 24 Stunden mit Mahlzeit, Bolus und Belastung | Abweichung kleiner als 1e-9 mmol/L |
| Gegenprobe mit einem um 1 % verstimmten Parameter | fällt auf, der Vergleich ist also scharf |

Unabhängig davon bestätigt: Die publizierte Basalrate von Patient 1 (1,14 U/h) hält im Modell zwölf Stunden lang exakt 6,0 mmol/L. Ein Einheitenfehler um den Faktor 60 oder 1000 wäre sofort sichtbar gewesen.

### 5.2 Testsuite

149 automatische Tests, dazu 65 Prüfpunkte für die Verbindung zwischen App und Engine. Geprüft werden unter anderem: Gleichungen und Einheiten, Insulin, Mahlzeit, Bewegung, renale Schwelle, Unterzucker, Unterschiede zwischen Personen, Sensormodell, Nachholrechnung (24 Stunden am Stück und in beliebigen Teilstücken sind bitgleich), verlustfreies Speichern und Laden, die Kalibrierungen gegen ihre Studien und die Neutralität aller Erweiterungen. Jeder Push auf den Hauptzweig lässt die Tests laufen, bevor die Seite neu veröffentlicht wird.

### 5.3 Fehler, die die Prüfung gefunden hat

- **Belastungsszenario.** Die Herzfrequenz ist eine linear interpolierte Spur. Die Hilfsfunktion für einen Belastungsblock setzte keinen Ruhepunkt davor. Zwischen zwei Blöcken stieg der Puls deshalb den ganzen Tag an. Die Sensorgenauigkeit im Register war dadurch falsch berechnet („viermal so ungenau im Tiefen“ statt richtig „doppelt“). Korrigiert und mit einem Regressionstest abgesichert.
- **Geplante Bewegung lief nie.** Die Anzeige zählte auf ein Training herunter, das nie stattfand.
- **Überlappende Einheiten änderten die Vergangenheit**, weil eine neue Stützstelle die Interpolation davor verschob. Jetzt hält ein Anker den zuletzt gerechneten Wert fest.
- **Speichern verlor die Physiologie.** Gespeichert wurde nur die Anzeige. Jetzt werden Zustand, Eingaben und Reserven gesichert.
- **Jede Sitzung sah gleich aus**, weil der Zufallswert fest war. Jetzt würfelt jede neue Sitzung ihren eigenen.
- **Essen füllte die Reserven nie auf**, „Heißhunger“ erschien nie. Beides war geschrieben, aber nicht angeschlossen.

### 5.4 Ein offener Befund

Bei täglicher Belastung ohne Anpassung von Essen oder Insulin fallen manche Personen über Tage an den numerischen Boden. Die Referenz zeigt dasselbe, die Umsetzung ist also korrekt. Ob diese Stärke physiologisch stimmt, ist offen. Unter 40 mg/dL zeigt der Sensor deshalb „LO“, und der Bereich gilt als Modellrand.

---

## 6. Wo nebel. die Quelle korrigiert

Wo ein Quellwert nachweislich nicht zur Wirklichkeit passt, korrigiert nebel. ihn mit Beleg. Geänderte Parameter stehen an genau einer Stelle (`engine/src/calibration.ts`). Zusätzliche Eingänge wie Fett, Eiweiß und die lange Nachwirkung liegen in eigenen Modulen und sind ohne ihre Eingabe neutral. Die Engine kennt zwei Parametersätze: die Quelle für den Abgleich und die Gleichungstests, den nebel.-Satz für App, Viewer und Kalibrierskripte. Beide werden nie vermischt.

### 6.1 Sensorverzögerung: 15 → 5 Minuten

ExtHovorka verzögert die Glukose im Gewebe mit `tsub` = 15 min. Die ISPAD-Leitlinie gibt 5 bis 10 min an (Tauschmann et al. 2022), das G6-Fehlermodell schätzt 3,8 min (Vettoretti et al. 2019). nebel. nutzt 5 min. Das ist zulässig, weil `IG` von keinem anderen Zustand gelesen wird. Die Korrektur betrifft nur die Beobachtung, nicht den Körper.

### 6.2 Insulinaufnahme: `tmaxI` 50 Minuten

Beim Testen wirkte eine Einheit ohne Essen kaum. Mit den Quellwerten (58 bis 131 min) senkte 1 U nach einer Stunde um 2 mg/dL, am stärksten wirkte sie nach 1,7 h, der Tiefpunkt kam nach 6 h. Die Fachinformation von Insulin aspart nennt Wirkbeginn nach 10 bis 20 min, Maximum nach 1 bis 3 h, Wirkdauer 3 bis 5 h und eine Plasmaspitze nach etwa 40 min.

| `tmaxI` | Plasmaspitze | stärkster Abfall | Tiefpunkt | 1 U senkt um (Median) |
|---|---|---|---|---|
| Quelle (58 bis 131 min) | 122 min | 1,7 h | 6,1 h | 29 mg/dL |
| 40 min | 49 min | 0,8 h | 3,0 h | 32 mg/dL |
| **50 min** | **59 min** | **1,0 h** | **3,5 h** | **31 mg/dL** |
| 55 min | 64 min | 1,1 h | 3,7 h | 31 mg/dL |

Mit einem Parameter lassen sich Plasmaspitze und Wirkmaximum nicht gleichzeitig treffen. Vorrang hat die Wirkung, weil nur sie sichtbar ist. 50 min legen Maximum und Wirkdauer in die Grenzen der Fachinformation, die Plasmaspitze kommt etwa 20 min zu spät. Die Startseite sagt seitdem: „am stärksten nach etwa einer Stunde, vorbei nach drei bis vier“.

### 6.3 Lange Nachwirkung der Bewegung

**Befund.** Im Quellmodell klingt der Nacheffekt `EElong` mit 10 min ab. Eine Stunde moderates Training um 16 Uhr senkte die folgende Nacht im Median um nur 1 mg/dL. Gemessen sind 23 mg/dL: In der DirecNet-Studie lag das Nachtmittel nach Nachmittagstraining bei 131 statt 154 mg/dL, und nächtliche Unterzuckerungen waren häufiger (Tsalikian et al. 2005).

**Entscheidung.** `p7` bleibt Quelle, denn eine längere Abklingzeit hätte auch den Abfall während der Belastung verändert, der an Daten gefittet ist. Der lange Teil kommt als Eingang dazu, nach dem Muster der Fettresistenz:

```
L(t)     = ∫ HRR(s) · e^(−(t−s)/600) ds      abklingende Belastungsminuten
siFactor = siFactor_Fett · (1 + 0,0045 · L)
```

- **Abklingzeit 600 min** aus dem Bewegungsmodell von Dalla Man, Breton & Cobelli (2009), das die Insulinwirkung „schnell an, langsam ab“ beschreibt. Breton (2008) legte seine Werte so, dass der Unterschied nach 20 Stunden noch messbar ist.
- **Stärke 0,0045 je Belastungsminute**, kalibriert an DirecNet: nebel. −22 mg/dL im Median.
- **Gegenprobe Taplin et al. (2010):** 20 % weniger Basal über sechs Stunden hob den nächtlichen Tiefstwert nach Training deutlich an. In nebel. hebt dieselbe Maßnahme die Nacht um 20 mg/dL und gleicht die Nachwirkung damit fast aus (Quelle allein: +29 gegen −1).
- Gerechnet mit den zehn Personen, die nachmittags nicht unter 70 mg/dL fallen. Die anderen hätten im echten Leben gegessen.

**Folgen.** 60 min bei 55 % der Herzfrequenzreserve machen Insulin um 14 % wirksamer. Nach 10 Stunden ist gut ein Drittel davon übrig, nach 24 Stunden knapp ein Zehntel. Die App zeigt „Nachwirkung +X %“ und, solange die Reserven unter 62 % liegen, „Reserven · nachtanken“. Nächte nach dem Training fallen jetzt öfter tief, wie in den Studien.

**Grenzen.** Beide Studien untersuchten Kinder und Jugendliche, die Modellpersonen sind Erwachsene. Die Nachwirkung wächst linear mit Dauer mal Intensität, ohne Sättigung. Sie ist eine Größenordnung, keine Dosis.

### 6.4 Fett und Eiweiß

**Frage.** Lässt sich die Wirkung von Fett und Eiweiß nur über veränderte Kohlenhydratwerte abbilden? Für Eiweiß und für die Magenverzögerung durch Fett ja, für die fettbedingte Insulinresistenz nicht ehrlich. Fett als „versteckter Zucker“ würde den falschen Mechanismus lehren: Zusätzliches Insulin hebt zusätzliche Kohlenhydrate auf, gegen Resistenz wirkt es schwächer. Deshalb wurde die Engine erweitert, ohne neuen Zustand. Ohne Angaben zu Fett, Eiweiß und Essdauer rechnet sie exakt wie die Quelle.

**Essdauer.** Vorher kam jede Mahlzeit in einer Minute im Darm an, der Regler „Dauer der Mahlzeit“ hatte keine Wirkung. Jetzt werden die Kohlenhydrate gleichmäßig über die Essdauer geliefert.

**Fett bremst den Magen.** Die Kohlenhydrate derselben Mahlzeit laufen durch einen Magenspeicher mit der mittleren Verzögerung `min(120 min, 1 min je g Fett)`. Die Richtung ist belegt (Smart et al. 2013; Lupoli et al. 2019; Faggionato et al. 2026), die Größe ist eine Annahme.

**Fett senkt die Insulinempfindlichkeit.**

```
R(t)     = 0,020 · max(0, Fett − 20 g) · Glocke(t − t_Mahlzeit)     Gipfel nach 5,5 h
siFactor = 1/(1 + R)
```

- Gipfel nach 5,5 h: erhöhter Insulinbedarf 5 bis 10 h nach einer fettreichen Mahlzeit (Wolpert et al. 2013), signifikante Wirkung von 4 bis 8 h (O'Connell et al. 2021).
- Stärke kalibriert an Wolpert: 60 statt 10 g Fett verlangten rund 40 % mehr Insulin. nebel. trifft im Mittel der 20 Datensätze 1,43 (Studie 1,42).
- **Schwelle 20 g pro Mahlzeit.** Das ist keine Physiologie, O'Connell findet keine Schwelle. Es ist ein Bezugspunkt: KE-Faktor und Basalrate sind im echten Leben auf gewöhnliches Essen eingestellt, die Studien messen dagegen Kontraste zu fast fettfreien Mahlzeiten. Ohne Schwelle hätten drei gewöhnliche Mahlzeiten das Tagesmittel einer Person von 194 auf 295 mg/dL gehoben.

**Eiweiß liefert späte Glukose aus der Leber.**

```
Rate(t) = 0,19 · Eiweiß · Erlang₃(t − t_Mahlzeit; 90 min)      direkt ins Blut
```

- Ausbeute 0,19 g Glukose je g Eiweiß, kalibriert an vier Messpunkten von Paterson et al. (2016), alle innerhalb der Konfidenzintervalle.
- Zeitkonstante nach der in Reviews beschriebenen Wirkung 3 bis 5 Stunden nach dem Essen (Paterson et al. 2015; Margaritis et al. 2025), denn die Daten bestimmen sie nicht.
- Keine Schwelle. Gewöhnliches Eiweiß hebt einen Tag um etwa 15 mg/dL.

**Gegenproben.**

| Studie | Szenario | Studie | nebel. (Mittel 20) | Lesart |
|---|---|---|---|---|
| Smart et al. 2013 (Kinder) | +35 g Fett, nach 5 h | +2,3 mmol/L | +1,54 | nebel. darunter |
| | +40 g Eiweiß, nach 5 h | +2,4 mmol/L | +0,63 | nebel. deutlich darunter |
| | beides | +5,4 mmol/L | +2,24 | Wirkungen addieren sich, Richtung stimmt |
| O'Connell et al. 2021 (Kinder, reines Fett) | 26 g, ab 330 min | +0,70 | +0,96 | |
| | 51 g | +1,40 | +4,26 | nebel. überschätzt reines Fett |

Für gemischte Mahlzeiten mit Insulin, den Normalfall der App, trifft nebel. die Erwachsenenstudie. Reines Fett ohne Insulin überschätzt das Modell um das Zwei- bis Dreifache. In der App kommt Fett immer zusammen mit Kohlenhydraten.

**Nicht modelliert:** die frühe Senkung nach reinem Eiweiß, eine Sättigung bei großen Eiweißmengen, die Magenverzögerung durch Eiweiß, ein Bezug auf das Körpergewicht und hormonelle Wege (GLP-1, GIP, Glukagon).

**Nicht gelesene Quellen**, deren Zahlen deshalb nicht verwendet wurden: der Methodenteil von Wolpert 2013, Smart 2013 im Original, Bell et al. 2015, Lodefalk et al. 2008, ein systematisches Review zu Eiweiß (PubMed 31454430). Gründe waren Zugriffssperren (Rate-Limit, Captcha, 403).

---

## 7. Der Sensor

Lernziel 3 verlangt, dass die angezeigte Zahl nicht der Körper ist. ExtHovorka endet bei der Glukose im Gewebe. Alles danach ist nebel.-Eigenleistung und als solche gekennzeichnet.

### 7.1 Vom Labormodell zu Sensormodell V2

Zuerst lief das publizierte Fehlermodell des Dexcom G6 (Vettoretti et al. 2019): Verstärkung mit Drift über die Tragedauer, Versatz und autoregressives Rauschen. Es beschreibt den Fehler an einzelnen Referenzmessungen gut. In ruhigen Nachtphasen sprang die Anzeige aber von Wert zu Wert um ±3,5 mg/dL, 31 % aller Schritte waren 4 mg/dL oder größer. Das Muster 90 → 92 → 93 → 89 kennen Sensorträger als unrealistisch.

Sensormodell V2 trennt den Fehler deshalb nach Zeitskalen. Ein echter Sensor irrt kohärent: Er liegt über Stunden gleichmäßig daneben, große Abweichungen sind selten und haben eine Ursache.

```
CGM(t) = a(t) · IG(t) + b0 + Drift(t) + Niveau(t) · Zittern(k) − Druck(t)
```

| Baustein | Zeitskala | Wert | Herkunft |
|---|---|---|---|
| Kalibriercharakter (Verstärkung, Versatz) | je Sensor fest | Median 0,95 und 0,14 mg/dL | Vettoretti 2019, Streuung aus dem Interquartilsabstand |
| Verstärkungsdrift | Tage | wie G6-Modell | Vettoretti 2019 |
| Langsame Drift | Stunden | Streuung 4 mg/dL | Annahme |
| Zittern | 5 bis 10 min | Streuung 1,2 mg/dL | am unteren Rand der Spanne bei Camerlingo et al. 2023 |
| Erster Tag nach dem Setzen | Stunden | Rauschen ×2,5, klingt ab | Richtung nach Hanson et al. 2024 |
| Bewegung | Minuten | Zuschlag mit der Belastung | Richtung nach Camerlingo 2023 |
| Druck auf den Sensor | 30 bis 90 min | etwa jede vierte Nacht, 15 bis 40 mg/dL Abfall | Mensh et al. 2013; Häufigkeit aus Baysal et al. 2014 |
| Tragedauer | 10 Tage | danach Wechsel | G6 |

Die Struktur ist belegt, die Stärken von Drift, Zittern, Erster-Tag-Faktor und Bewegungszuschlag sind Kalibrierung. Der Zufall ist zählerbasiert, damit die Nachholrechnung bitgleich bleibt.

### 7.2 Prüfung

Über 20 Personen, je drei Tage mit Mahlzeiten, Bolus und täglichem Training:

| Variante | MARD | Spanne | unter 70 | ruhiger Schritt | Sprünge ≥ 4 mg/dL |
|---|---|---|---|---|---|
| nur Verzögerung | 0,7 % | 0,4 bis 1,3 | n. b. | ±0,4 | 0 % |
| G6-Labormodell | 5,3 % | 4,8 bis 6,0 | 12,8 % | ±3,5 | 32 % |
| **nebel. V2** | **6,2 %** | 2,5 bis 13,8 | 14,3 % | **±1,3** | **1 %** |

V2 ist im Mittel so genau wie das G6-Modell, aber anders verteilt: von Wert zu Wert ruhig, dafür unterscheiden sich Sensoren deutlich. Im Tiefen ist der Sensor etwa doppelt so ungenau wie im Zielbereich. Beide Werte liegen unter klinischen Angaben (Hanson et al. 2024: 8,9 % und 13,6 %), weil die Referenz hier die exakte Modellglukose ist. Die Parameter werden nicht auf eine Ziel-MARD getrimmt.

### 7.3 Gestaltungsentscheidungen

- **Der erste Tag bleibt ruhig.** Beim Start sitzt der Sensor schon 2 bis 7 Tage, der erste Wechsel kommt frühestens an Tag 3.
- **Ereignisse erst ab der zweiten Nacht.** Druck auf den Sensor nur im Schlaf.
- **Einschätzen statt Aufklären.** Ein Druckabfall sieht live aus wie ein echter Unterzucker und steht nicht im Protokoll. Erst der Rückblick deckt ihn auf: als markierter Bereich in der Kurve und als Eintrag mit angezeigtem Wert, echtem Blutwert und der eigenen Reaktion („du hast 15 g gegessen, auf einen Messfehler“). Gelernt wird an dem Moment, in dem man merkt, dass man einem Messfehler geglaubt und danach gehandelt hat.
- **Messbereich 40 bis 400 mg/dL**, außerhalb zeigt die Anzeige den Grenzwert.

### 7.4 Trendpfeil

Sieben Stufen wie in der Dexcom-App, mit Schrägpfeilen, nach der G6-Pfeiltabelle (Dexcom Canada): waagerecht unter 1 mg/dL pro Minute, schräg 1 bis 2, gerade 2 bis 3, Doppelpfeil ab 3. Dahinter steht die Differenz zum vorigen Wert, bei Gleichstand „0“.

### 7.5 Klinische Schwellen

Unterzucker Stufe 2 unter 54 mg/dL, Stufe 1 unter 70, Zielbereich 70 bis 180, Überzucker über 180 (ADA 2026). Davon getrennt sind die Modellschwellen 4,5 mmol/L (Gehirn) und 9 mmol/L (Niere). Symptome werden nicht aus einem einzelnen Wert abgeleitet.

---

## 8. Die Erlebnisschicht

### 8.1 Echtzeit-Modus

Lernziel 1, die passive Dauerbelastung, lässt sich in zehn Minuten nicht vermitteln. Sie entsteht, wenn der Simulator nicht aufhört, sobald man wegschaut. Im Echtzeit-Modus entspricht eine simulierte Minute einer echten. Daneben gibt es einen schnellen Modus zum Nachvollziehen.

Was das technisch verlangt:

- **Nachholrechnung.** Ist der Tab zu oder das Handy gesperrt, rechnet nichts. Beim Öffnen wird von der letzten Minute bis jetzt nachgerechnet. Acht Stunden sind 480 Schritte und dauern Millisekunden.
- **Zählerbasierter Zufall.** Das Rauschen kommt aus Zufallswert und Schrittnummer, nicht aus einem fortgeschriebenen Generator. Sonst hinge der Verlauf davon ab, wie oft man die App geöffnet hat.
- **Nur nach vorn.** Ereignisse lassen sich nur in Gegenwart oder Zukunft eintragen. Was-wäre-wenn läuft auf einer Kopie.
- **Misstrauen gegenüber der Uhr.** Eine rückwärts laufende Systemzeit erzeugt keine negativen Schritte, es wird gewartet.
- **Speichern im Browser:** Anker, Zufallswert, Person, Zustand, Eingaben, Reserven. Die Kurve selbst wird neu gerechnet.
- **Die Nacht.** Alarme an den Grenzen, auch nachts, vorher ausdrücklich abgefragt und jederzeit abschaltbar.

### 8.2 Hunger und Reserven

Ohne Hunger lernt man nur eine Handlung: spritzen. Hunger zwingt zur Handlung in die andere Richtung, essen, obwohl nichts zu korrigieren ist. Designregel: nebel. darf keine Bolus-Maschine werden.

Der Prototyp führte einen Leberglykogen-Zustand, der Gegenregulation und Leberproduktion beeinflusste. ExtHovorka hat kein Glykogen. Ihn einzubauen hieße, einen 17., unbelegten Zustand mitten in den Kern zu setzen. Deshalb wird Hunger als Bedürfnis in der Erlebnisschicht geführt:

- Die Reserve sinkt über die Zeit (voll bis leer in etwa zehn Stunden), schneller bei Belastung und in der Nachwirkung, und füllt sich mit der tatsächlich gegessenen Kohlenhydratmenge.
- Hinweise: „iss etwas“ unter 30 %, „hungrig aufgewacht“ morgens, „Mittagszeit“, „Abendessen“, „nachtanken“ nach Belastung, „Heißhunger“ bei Belastung und fast leeren Reserven.
- Physiologische Folgen entstehen nur über echte Kopplungen: Hunger plus Bewegung, Hunger plus bereits gegebener Bolus, Hunger plus falsche Basalrate. Nichtessen allein hat bei richtiger Basalrate keine Folge, denn dafür ist die Basalrate da.
- Alle Zeitkonstanten sind Annahmen und werden nie als physiologische Werte ausgegeben.

Der Hunger gehört der simulierten Person, nicht der Nutzerin. nebel. führt keine Kalorien- oder Gewichtslogik und bewertet keine Essensentscheidungen.

### 8.3 Bewegung aus dem Tagesplan

Mahlzeiten entstehen nur aus dem Bedürfnis, nicht aus einem Drehbuch. Bewegung kommt dagegen aus einem Tagesplan (Widerspruch W13, bestätigt am 09.11.2026): Training wird angekündigt, damit man sich vorbereiten kann. Liegt der Sensorwert unter 80 oder über 280 mg/dL, wird es verschoben, nach drei Versuchen abgesagt, und man kann es selbst absagen. Alltagsbewegung passiert ohne Ankündigung, wie der Bus, der auch im echten Leben nicht wartet.

### 8.4 Personen

Auf der Startseite wählt man, in wessen Körper man den Tag verbringt. Zehn Personen, jede auf einem der 20 Parametersätze:

| Person | Datensatz | Auffällig |
|---|---|---|
| Lena, 23 (Standard) | 10 | nah am Median in allem außer der Mahlzeit |
| Jonas, 22 | 4 | empfindlich auf Insulin, harter Sport hebt stark |
| Mira, 30 | 6 | Sport senkt maximal, harter Sport hebt nicht |
| Aylin, 31 | 7 | am unempfindlichsten auf Insulin |
| Malik, 25 | 8 | mittlerer Sport-Responder, flache Mahlzeiten |
| Tobias, 33 | 11 | Sport bewirkt fast nichts |
| Jana, 26 | 13 | höchste Spitze nach dem Essen |
| Finn, 19 | 14 | empfindlich, harter Sport hebt kaum |
| Sofia, 24 | 15 | kräftige Antwort auf Sport in beide Richtungen |
| David, 20 | 18 | Sport bewirkt wenig, flache Mahlzeiten |

Echt aus dem Datensatz sind Größe, Gewicht, Ruhepuls, HbA1c, Basalrate, KE-Faktor, Korrekturfaktor und alle Modellparameter. Erfunden und als erfunden gekennzeichnet sind Vorname, Alter (grob aus dem Maximalpuls), ein Satz zum Alltag und das Aussehen. Die Auswahl folgt einem Maximin-Verfahren über fünf Merkmale (Wirkung von 1 U, Spitze nach 60 g mit Bolus, moderater Sport, harter Sport, Gewicht): Jede weitere Person ist die, die von den bereits gewählten am weitesten entfernt liegt. Die Vergleichswerte („Was das ausmacht“) rechnet die Engine bei jedem Bau neu.

Ein eigenes Profil mit echten Werten gibt es bewusst nicht. Es würde die Zweckbestimmung kippen und Gesundheitsdaten verarbeiten. Außerdem lassen sich aus KE-Faktor und Korrekturfaktor die Modellparameter nicht eindeutig bestimmen, ein „persönliches“ Profil täuschte also Genauigkeit vor. Stattdessen der Hinweis, sich die ähnlichste Person zu suchen.

### 8.5 Auswertung und Vorhersage

Die dritte Ebene zeigt Zeit im Zielbereich, wie weit der Sensor danebenlag, aufgedeckte Sensorereignisse und eine Vorhersage: Wohin läuft der Wert in den nächsten zwölf Stunden, wenn keine Entscheidung mehr dazukommt? Was schon läuft, läuft weiter. Darunter die Wirkung in mg/dL pro Stunde, aufgeteilt in schnelle und langsame Kohlenhydrate, Eiweiß, Fett und Insulin. Gezeigt wird der tatsächliche Verbrauch und die gebremste Leber, nicht der bloße Transport zwischen Blut und Gewebe, der dreimal so groß wirken würde. Die App sagt dazu ausdrücklich: Diese Kurve kennt nur die Simulation, im echten Leben gibt es sie nicht.

### 8.6 Oberfläche

- **Drei Ebenen** (Start, Simulator, Auswertung), die sich wie Blätter übereinanderlegen. Was darunter liegt, bleibt stehen und wird unscharf.
- **Begrüßung:** Inhalte einer neuen Ebene erscheinen nacheinander, von links oben nach rechts unten. Ohne Skalierung, damit Text nicht unscharf zittert. Bei reduzierter Bewegung in den Systemeinstellungen ohne Animation.
- **Hinweisfenster** vor der ersten Nutzung, mit Sprachwahl. Ohne Bestätigung bleibt die App gesperrt.
- **Hell und dunkel**, auch die Diagramme blenden mit.
- **Englische Fassung** unter `/en/`. Die Quelle bleibt deutsch, der Bau ersetzt jeden Text durch sein englisches Gegenstück und bricht ab, wenn eines fehlt.
- **Texte zur Entstehung** auf der Startseite: die Kurzfassung zum Aufklappen, diese ausführliche Fassung als eigene Seite. Beide gibt es auch auf Englisch.

**Wischgeste, überarbeitet am 10.11.2026.** Auf dem iPhone reagierte das Wischen zwischen den Ebenen oft nicht oder ruckelig. Zum Vergleich wurde gelesen, wie zwei verbreitete Bibliotheken das Problem lösen: Embla Carousel (Drag-Erkennung und Geschwindigkeit) und Swiper (Touch-Ereignisse, Winkel, Randgesten). Gefunden und behoben:

1. Auf Touchgeräten hängt ein Finger zuerst implizit am berührten Element (W3C Pointer Events, „implicit pointer capture“). Beim Umhängen auf den Seitencontainer meldete das Element den Verlust, die Meldung lief zum Container hoch und beendete jeden Zug nach dem ersten Bild. Nur ein schneller erster Ruck schaltete noch um. Jetzt zählt nur noch der Verlust am Container selbst.
2. Seit es die Auswertung als dritte Ebene gibt, federte der Zug schon ab der zweiten Ebene wie an einem Rand. Die Auswertung folgte dem Finger nur mit einem Drittel des Tempos. Jetzt federt nur der echte Rand.
3. Die Wischgeschwindigkeit wird wie bei Embla über ein gleitendes Fenster von etwa 170 ms aus den Zeitstempeln der Ereignisse berechnet, statt aus dem Abstand zweier einzelner Bewegungen. Wer vor dem Loslassen länger verharrt, wischt nicht. Ein Wisch gegen die Zugrichtung führt zurück.
4. Gezeichnet wird höchstens einmal pro Bild, auch wenn mehrere Bewegungen ankommen.

Geprüft im Vorschaubrowser mit nachgestellter Touch-Bindung und gesteuerten Zügen. Auf einem echten iPhone ist die Änderung noch nicht getestet.

---

## 9. Welche Faktoren die Simulation berücksichtigt

**Körper (Physiologie)**

- Kohlenhydrate, schnell und langsam, mit Essdauer
- Fett: verzögerte Magenentleerung und über Stunden geschwächtes Insulin, ab 20 g pro Mahlzeit
- Eiweiß: späte Glukose aus der Leber
- Insulin: Bolus, verzögerter Bolus, Basalprofil, temporäre Basalrate, Pumpenstopp
- Insulinempfindlichkeit abhängig vom Glukosewert
- Leberproduktion, gebremst durch Insulin, angetrieben durch Bewegung
- Glukoseverbrauch des Gehirns, gesenkt im Unterzucker
- Ausscheidung über die Niere ab 162 mg/dL
- Bewegung über die Herzfrequenz: moderat senkt, hart über der ventilatorischen Schwelle kann heben, kurzer Nacheffekt und lange Nachwirkung über viele Stunden
- Der individuelle Körper: zehn Personen mit eigenen Parametern

**Messung (Sensor)**

- Verzögerung zwischen Blut und Gewebe
- Kalibriercharakter je Sensor, Drift über Stunden und Tage
- Zittern, stärker am ersten Tag und bei Bewegung
- Druck auf den Sensor im Schlaf
- Sensorwechsel nach zehn Tagen
- Messbereich 40 bis 400 mg/dL

**Alltag (Erleben)**

- Schätzfehler beim Essen: Die tatsächlich gegessene Menge weicht von der Eingabe ab
- Hunger und Reserven
- Angekündigtes Training und unangekündigte Alltagsbewegung
- Echtzeit, Nacht und Alarme

**Bewusst nicht berücksichtigt**

Tageszeit und Dawn-Phänomen, Stress, Krankheit, Schlafmangel, Alkohol, Zyklus, Leberglykogen als Zustand, Glukagon, Insulinalterung, Katheterprobleme, Kinderphysiologie.

---

## 10. Recht und Veröffentlichung

### 10.1 Kein Medizinprodukt

Ob Software ein Medizinprodukt ist, entscheidet nach Art. 2 Nr. 1 der Verordnung (EU) 2017/745 die Zweckbestimmung des Herstellers, nicht die Technik (MDCG 2019-11). Bildung, Simulation und Perspektivwechsel sind keine medizinischen Zwecke. Kippen würde das durch: Eingabe eigener Werte (Überwachung), einen Bolusrechner (Behandlung, vermutlich Klasse IIb), Vorhersage aus echten Daten, Nachbildung einer realen Person oder Werbung mit therapeutischem Nutzen. Die pädagogischen Ausschlüsse aus Abschnitt 1 sind damit zugleich die rechtliche Grundlage.

### 10.2 Haftung

Die neue Produkthaftungsrichtlinie (EU) 2024/2853 schließt Software ein, nimmt aber freie und quelloffene Software aus, die außerhalb einer Geschäftstätigkeit bereitgestellt wird. Eine offene, unentgeltliche Veröffentlichung senkt das Risiko also. Daraus folgt die Bedingung: keine Monetarisierung, keine Pro-Version, keine bezahlte Betreuung. Die allgemeine Haftung nach § 823 BGB bleibt, setzt aber eine Pflichtverletzung voraus. Eine klare Zweckbestimmung, die ihre Grenzen offen nennt, spricht gegen eine solche Pflichtverletzung.

### 10.3 Lizenzen und Daten

- Code und Dokumentation: Apache 2.0.
- py-mgipsim steht unter GPL-3.0. Gleichungen und Parameterwerte aus Veröffentlichungen sind nicht geschützt, Codestruktur schon. nebel. übernimmt keinen Code. Kein Clean-Room: Die Referenz wurde gelesen, die Variablennamen folgen der publizierten Notation. Das wird offen gesagt.
- Die zehn genutzten Parametersätze liegen als eigene Datei unter GPL-3.0 neben der App, mit Herkunft (fester Commit, Hash-Prüfung), Änderungsvermerk und Lizenztext. Als getrenntes Werk bilden sie mit der App ein „Aggregat“ (GPL-3.0 §5), die Lizenz erstreckt sich nicht auf den Rest. Ein mögliches Datenbankrecht (§ 87a UrhG) ist über GPL-3.0 §0 mit erfasst.
- Die Autoren von py-mgipsim haben am 28.10.2026 geantwortet: keine Einwände. Ihre zwei Bitten sind umgesetzt: Die App sagt ausdrücklich, dass sie nur ein Lernsystem ist und weder Medizinprodukt noch für Insulindosierung geeignet, und das ist das Erste, was man bestätigt.

### 10.4 Datenschutz

- Keine Cookies, kein Tracking, keine Gesundheitsdaten. Spielstand und Personenwahl liegen nur im Browser (§ 25 Abs. 2 Nr. 2 TDDDG).
- Schriften liegen lokal. Vorher kamen sie von Google Fonts, was die IP jedes Besuchers an Google schickte (dazu LG München I, Urteil vom 20.01.2022, Az. 3 O 17493/20).
- Hosting über GitHub Pages, das IP-Adressen aus Sicherheitsgründen protokolliert (Art. 6 Abs. 1 lit. f DSGVO).
- Das Impressum (§ 18 Abs. 1 MStV, vorsorglich § 5 DDG) kommt aus Repository-Variablen, damit keine Anschrift dauerhaft in der Git-Historie steht.

### 10.5 Bau und Veröffentlichung

Jeder Push auf den Hauptzweig startet eine GitHub Action: Referenz holen und prüfen, Referenzwerte erzeugen, Typen, Tests und App-Verbindung prüfen, im Veröffentlichungsmodus bauen, Seite veröffentlichen. Der Veröffentlichungsbau bricht ab, wenn Impressum oder Lizenztexte fehlen oder eine Seite etwas von fremden Servern lädt. Fällt ein Schritt durch, bleibt die alte Seite stehen.

Die rechtlichen Texte sind eine sorgfältige Vorlage, keine Rechtsberatung. Vor einer breiten Verbreitung sollen sie einmal juristisch geprüft werden.

---

## 11. Grenzen und offene Punkte

- **Nur Erwachsene.** Kein veröffentlichter Parametersatz für Kinder passt in ExtHovorka (geprüft: Wilinska et al. 2010, Félix et al. 2022, UVA/Padova S2013, eine virtuelle Population in PLOS ONE 2019). Erwachsenenwerte zu skalieren wäre Raten mit Kinderzahlen. Wiedervorlage, wenn ein passender Satz erscheint, eine Harmonisierung zwischen Modellfamilien vorliegt oder nebel. bewusst die Modellfamilie wechselt. Eltern von Kindern mit Typ-1-Diabetes sind eine der größten Angehörigengruppen. Die App sagt die Einschränkung deshalb offen.
- **Starke Sport-Responder.** Fünf der 20 Datensätze fallen bei 60 min moderater Belastung ohne Kohlenhydrate an den numerischen Boden. Das kommt aus der Quelle. Ob es realistisch ist, ist offen.
- **Korrekturfaktor der Datensätze** passt nicht bei jeder Person zum Modell (Verhältnis im Median 0,93, Spanne 0,37 bis 1,58). Der KE-Faktor ist noch nicht geprüft.
- **Reines Fett** wird überschätzt, **Eiweiß in gemischten Mahlzeiten** eher unterschätzt.
- **Lange Nachwirkung:** an Kinderstudien kalibriert, linear, ohne Sättigung.
- **Sensorstärken** (Drift, Zittern, Dauer und Tiefe der Druckabfälle) sind Annahmen und sollten an echten Sensorspuren geprüft werden.
- **Leberglykogen** bleibt Kandidat für eine spätere Version, wenn Dynamik und Kopplung belegt sind.
- **Ähnlichkeitsfragen ohne Zahlen** („Sport senkt bei mir stark, mittel, kaum“) als Weg zur passendsten Person sind geplant, nicht gebaut.
- **Wischgeste** noch nicht auf einem echten iPhone geprüft.
- **Smart 2013:** Der PubMed-Abstract nennt für die eiweißreiche Mahlzeit einen Anstieg von 2,4 gegen 0,5 mmol/L. Die Gegenprobe in Abschnitt 6.4 führt +2,4 als Differenz. Das ist am Original zu prüfen.

---

## 12. Quellen

Mit „PubMed“ markierte Angaben wurden am 09.11.2026 gegen PubMed abgeglichen.

### Modell und Referenzimplementierung

1. Hovorka R, Canonico V, Chassin LJ, et al. (2004). Nonlinear model predictive control of glucose concentration in subjects with type 1 diabetes. *Physiol Meas* 25(4):905–920. [DOI](https://doi.org/10.1088/0967-3334/25/4/010) (PubMed)
2. Rashid M, Samadi S, Sevil M, Hajizadeh I, Kolodziej P, Hobbs N, et al., Cinar A (2019). Simulation software for assessment of nonlinear and adaptive multivariable control algorithms: Glucose–insulin dynamics in type 1 diabetes. *Comput Chem Eng* 130:106565. [DOI](https://doi.org/10.1016/j.compchemeng.2019.106565) (PubMed)
3. Siket M, Rashid MM, Cinar A (2025). py-mgipsim: An open-source Python library for simulating type 1 diabetes with diverse meals and physical activities. *J Diabetes Sci Technol* 19(3):855–856. [DOI](https://doi.org/10.1177/19322968251328664) (PubMed)
4. py-mgipsim, Illinois Institute of Technology, GPL-3.0. https://github.com/illinoistech-itm/py-mgipsim (verwendeter Stand: Commit b985f8c)

### Insulin, Sensor und Schwellen

5. Fachinformation NovoRapid PumpCart (Insulin aspart), Abschnitte 5.1 und 5.2. https://www.medicines.org.uk/emc/product/7922/smpc
6. Tauschmann M, Forlenza G, Hood K, et al. (2022). ISPAD Clinical Practice Consensus Guidelines 2022: Diabetes technologies: Glucose monitoring. *Pediatr Diabetes* 23(8):1390–1405. [DOI](https://doi.org/10.1111/pedi.13451) (PubMed)
7. Vettoretti M, Battocchio C, Sparacino G, Facchinetti A (2019). Development of an error model for a factory-calibrated continuous glucose monitoring sensor with 10-day lifetime. *Sensors* 19(23):5320. [DOI](https://doi.org/10.3390/s19235320) (PubMed)
8. Camerlingo N, Siviero I, Vettoretti M, Sparacino G, Del Favero S, Facchinetti A (2023). Bayesian denoising algorithm dealing with colored, non-stationary noise in continuous glucose monitoring timeseries. *Front Bioeng Biotechnol* 11:1280233. [DOI](https://doi.org/10.3389/fbioe.2023.1280233)
9. Hanson K, Kipnes M, Tran H (2024). Comparison of point accuracy between two widely used continuous glucose monitoring systems. *J Diabetes Sci Technol* 18(3):598–607. [DOI](https://doi.org/10.1177/19322968231225676) (PubMed)
10. Mensh BD, Wisniewski NA, Neil BM, Burnett DR (2013). Susceptibility of interstitial continuous glucose monitor performance to sleeping position. *J Diabetes Sci Technol* 7(4):863–870. [DOI](https://doi.org/10.1177/193229681300700408) (PubMed)
11. Baysal N, Cameron F, Buckingham BA, et al. (2014). A novel method to detect pressure-induced sensor attenuations (PISA) in an artificial pancreas. *J Diabetes Sci Technol* 8(6):1091–1096. [DOI](https://doi.org/10.1177/1932296814553267) (PubMed)
12. Dexcom Canada. Using Dexcom G6 Trend Arrows. https://s3-us-west-2.amazonaws.com/dexcommisc/Canada+HCP/Using+the+Trend+Arrows_with+ranges_ENGLISH.pdf
13. American Diabetes Association (2026). Standards of Care in Diabetes, Abschnitt 6: Glycemic Goals, Hypoglycemia, and Hyperglycemic Crises. *Diabetes Care* 49(Suppl. 1):S132. https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927/

### Bewegung

14. Tsalikian E, Mauras N, Beck RW, et al. (Diabetes Research in Children Network, DirecNet) (2005). Impact of exercise on overnight glycemic control in children with type 1 diabetes mellitus. *J Pediatr* 147(4):528–534. [DOI](https://doi.org/10.1016/j.jpeds.2005.04.065) (PubMed)
15. Taplin CE, Cobry E, Messer L, McFann K, Chase HP, Fiallo-Scharer R (2010). Preventing post-exercise nocturnal hypoglycemia in children with type 1 diabetes. *J Pediatr* 157(5):784–788. [DOI](https://doi.org/10.1016/j.jpeds.2010.06.004) (PubMed)
16. Dalla Man C, Breton MD, Cobelli C (2009). Physical activity into the meal glucose-insulin model of type 1 diabetes: in silico studies. *J Diabetes Sci Technol* 3(1):56–67. [DOI](https://doi.org/10.1177/193229680900300107) (PubMed)
17. Breton MD (2008). Physical activity – the major unaccounted impediment to closed loop control. *J Diabetes Sci Technol* 2(1):169–174. [DOI](https://doi.org/10.1177/193229680800200127) (PubMed)

### Fett und Eiweiß

18. Wolpert HA, Atakov-Castillo A, Smith SA, Steil GM (2013). Dietary fat acutely increases glucose concentrations and insulin requirements in patients with type 1 diabetes. *Diabetes Care* 36(4):810–816. [DOI](https://doi.org/10.2337/dc12-0092) (PubMed)
19. Paterson MA, Smart CEM, Lopez PE, et al. (2016). Influence of dietary protein on postprandial blood glucose levels in individuals with type 1 diabetes mellitus using intensive insulin therapy. *Diabet Med* 33(5):592–598. [DOI](https://doi.org/10.1111/dme.13011) (PubMed)
20. Smart CEM, Evans M, O'Connell SM, et al. (2013). Both dietary protein and fat increase postprandial glucose excursions in children with type 1 diabetes, and the effect is additive. *Diabetes Care* 36(12):3897–3902. [DOI](https://doi.org/10.2337/dc13-1195) (PubMed)
21. O'Connell SM, O'Toole NMA, Cronin CN, et al. (2021). Does dietary fat cause a dose dependent glycemic response in youth with type 1 diabetes? *Pediatr Diabetes* 22(8):1108–1114. [DOI](https://doi.org/10.1111/pedi.13273) (PubMed)
22. Paterson M, Bell KJ, O'Connell SM, Smart CE, Shafat A, King B (2015). The role of dietary protein and fat in glycaemic control in type 1 diabetes: implications for intensive diabetes management. *Curr Diab Rep* 15(9):61. [DOI](https://doi.org/10.1007/s11892-015-0630-5)
23. Lupoli R, Pisano F, Capaldo B (2019). Postprandial glucose control in type 1 diabetes: importance of the gastric emptying rate. *Nutrients* 11(7):1559. [DOI](https://doi.org/10.3390/nu11071559)
24. Faggionato E, Schiavon M, Ekhlaspour L, et al., Dalla Man C (2026). Quantifying the effect of fat and protein on the postprandial glucose excursion in individuals with type 1 diabetes using an automated insulin delivery system. *J Diabetes Sci Technol*, OnlineFirst. [DOI](https://doi.org/10.1177/19322968261440943)
25. Cai Y, et al. (2023). The effect of the modified fat-protein unit algorithm … a randomized crossover trial. *Nutr Metab* 20:43. [DOI](https://doi.org/10.1186/s12986-023-00757-w)
26. Margaritis K, et al. (2025). Dietary fat and protein intake and their impact on glycemic control in pediatric type 1 diabetes: a narrative review. *Children* 12:1664. [DOI](https://doi.org/10.3390/children12121664)

### Kinder (Recherche ohne Übernahme)

27. Wilinska ME, Chassin LJ, Acerini CL, Allen JM, Dunger DB, Hovorka R (2010). Simulation environment to evaluate closed-loop insulin delivery systems in type 1 diabetes. *J Diabetes Sci Technol* 4(1):132–144. [DOI](https://doi.org/10.1177/193229681000400117) (PubMed)
28. Félix et al. (2022). ETH-Modell mit Bewegung, fünf Kinder aus der DiaActive-Studie. *PLOS Comput Biol*. [DOI](https://doi.org/10.1371/journal.pcbi.1010289)
29. Statistische virtuelle Population mit Bewegung (2019). *PLOS ONE*. [DOI](https://doi.org/10.1371/journal.pone.0217301)

### Recht

30. Verordnung (EU) 2017/745 über Medizinprodukte (MDR), Art. 2 Nr. 1.
31. MDCG 2019-11 rev.1 (Juni 2025): Guidance on qualification and classification of software in Regulation (EU) 2017/745 – MDR and Regulation (EU) 2017/746 – IVDR. https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf
32. Richtlinie (EU) 2024/2853 über die Haftung für fehlerhafte Produkte, Art. 2 Abs. 2.
33. GNU General Public License v3. https://www.gnu.org/licenses/gpl-3.0.html
34. LG München I, Urteil vom 20.01.2022, Az. 3 O 17493/20 (Google Fonts).
35. GitHub Docs: About GitHub Pages; GitHub General Privacy Statement. https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages

### Oberfläche

36. Embla Carousel, DragHandler und DragTracker. https://github.com/davidjerleke/embla-carousel
37. Swiper, Touch-Ereignisse (onTouchStart, onTouchMove, onTouchEnd). https://github.com/nolimits4web/swiper
38. W3C Pointer Events, Abschnitt „Implicit pointer capture“. https://www.w3.org/TR/pointerevents/

### Projektdokumentation

Alle Zahlen, Herleitungen und Prüfprotokolle stehen ausführlicher im [Projektordner docs/](https://github.com/NojoMcDybo/nebel/tree/main/docs): Changelog und Widerspruchsprüfung (00), Zielgruppe (05), Echtzeit-Modus (06), Pädiatrie (07), Bedürfnisse (08), Personen (09), Engine-Spezifikation (10), Fett und Eiweiß (11), Parameterregister (20), rechtliche Einordnung (30).
