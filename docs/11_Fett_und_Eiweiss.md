# Nebel — Fett und Eiweiß: Recherche und Umsetzung

Stand: 26.09.2026. Die Recherche entstand vormittags, die Umsetzung abends.

**Frage (Nojo):** Lässt sich die Wirkung von Fett und Eiweiß abbilden, ohne die Engine umzuschreiben, also nur über veränderte Kohlenhydratwerte?
**Entscheidung (Nojo, 26.09.2026):** Die Engine wird umgebaut, beide Stufen des Vorschlags. Siehe Abschnitt „Umsetzung“.

## Kurzantwort der Recherche

| Wirkung | Über Kohlenhydrate abbildbar? | Wie |
|---|---|---|
| **Eiweiß:** später zusätzlicher Zucker | **Ja, als Näherung vertretbar** | Größere Eiweißmengen als verzögerte, langsame Glukosezufuhr einspeisen. Physiologisch kommt der Zucker aus der Leber (Glukoneogenese), nicht aus dem Darm. Für den Blutzucker macht das fast keinen Unterschied. |
| **Fett, Teil 1:** langsamere Magenentleerung | **Ja, ohne Engine-Änderung** | Die Kohlenhydrate *derselben* Mahlzeit gestreckt und verzögert einspeisen. Die Engine nimmt beliebige Eingabeverläufe an. |
| **Fett, Teil 2:** über Stunden verminderte Insulinempfindlichkeit | **Nein, nicht ehrlich** | Braucht eine kleine Engine-Erweiterung: vorübergehend gesenkte Insulinsensitivität nach fettreichen Mahlzeiten. |

Fett über „zusätzliche Kohlenhydrate“ nachzubilden, würde in einem Standardszenario ähnliche Kurven liefern. Es würde aber den falschen Mechanismus lehren: Fett ist kein versteckter Zucker, es macht das Insulin schwächer. Der Unterschied zeigt sich genau dann, wenn jemand nachspritzt. Zusätzliches Insulin hebt zusätzliche Kohlenhydrate auf, gegen Insulinresistenz wirkt es schwächer. Außerdem würden „KH aktiv“ und die Wirkungskurve auf Seite 3 Zucker zeigen, der nie gegessen wurde.

## Belege

### Gelesen

1. **Wolpert HA, Atakov-Castillo A, Smith SA, Steil GM (2013).** Dietary fat acutely increases glucose concentrations and insulin requirements in patients with type 1 diabetes. *Diabetes Care* 36(4):810–816.
   - Design: 7 Erwachsene im geschlossenen Regelkreis. Gleiche Kohlenhydrate und gleiches Eiweiß, Abendessen mit 60 g gegen 10 g Fett.
   - Ergebnis: mehr Insulin (12,6 gegen 9,0 U, etwa +40 %; einzeln −17 % bis +108 %) und trotzdem mehr Hyperglykämie.
   - Erhöhter Insulinbedarf 5–10 h nach der Mahlzeit. Die Autoren deuten das als fettinduzierte Insulinresistenz über freie Fettsäuren, nicht nur als verzögerte Aufnahme.
   - https://diabetesjournals.org/care/article/36/4/810/37916
   - Gelesen wurde nur der Abstract. Die Methoden sind nicht gelesen (PMC zeigt ein Captcha, diabetesjournals antwortet mit 403). Deshalb ist unbekannt, über welches Zeitfenster die 12,6 und 9,0 U gezählt wurden und ob Basalinsulin darin steckt.
2. **Faggionato E, Schiavon M, Ekhlaspour L, Kingman RS, Sherr JL, Forlenza GP, Buckingham BA, Dalla Man C (2026).** Quantifying the effect of fat and protein on the postprandial glucose excursion in individuals with type 1 diabetes using an automated insulin delivery system. *J Diabetes Sci Technol*, OnlineFirst.
   - Orales Minimalmodell (MI-OMM) auf 353 Mahlzeiten von 120 Menschen.
   - Viel Fett und Eiweiß verlangsamten Magenentleerung und Glukose-Erscheinungsrate (P < .01) und senkten die Insulinsensitivität (P < .05). Das sind die beiden Mechanismen, die Nebel jetzt rechnet.
   - Effektgrößen lagen im abrufbaren Teil nicht vor.
   - https://doi.org/10.1177/19322968261440943
3. **Cai Y et al. (2023).** The effect of the modified fat-protein unit algorithm … a randomized crossover trial. *Nutr Metab* 20:43.
   - Modifizierte Fett-Protein-Einheit: 200 kcal aus Fett und Eiweiß entsprechen dem Insulin für 10 g Kohlenhydrate.
   - Bei eiweiß- und fettreichen Mahlzeiten spät (240–300 min) etwa 1,1 mmol/L niedriger. Bei normalen Mahlzeiten deutlich mehr Unterzuckerungen (etwa ein Drittel gegen keine).
   - Die Gleichsetzung mit Kohlenhydraten ist ein Dosierungs-Faustwert mit großer Streuung, keine physiologische Größe.
   - https://doi.org/10.1186/s12986-023-00757-w
4. **Margaritis K et al. (2025).** Dietary fat and protein intake and their impact on glycemic control in pediatric type 1 diabetes: a narrative review. *Children* 12:1664.
   - Eiweiß wirkt verzögert, 3–5 h nach der Mahlzeit.
   - Fett-Protein-Einheiten verbessern späte Werte, aber mit individueller Streuung und gelegentlichen Unterzuckerungen.
   - https://doi.org/10.3390/children12121664
5. **O'Connell SM, O'Toole NMA, Cronin CN, Saat-Murphy C, McElduff P, King BR, Smart CE, Shafat A (2021).** Does dietary fat cause a dose dependent glycemic response in youth with type 1 diabetes? *Pediatr Diabetes* 22(8):1108–1114. *Neu am 26.09. abends.*
   - Design: 30 Kinder und Jugendliche (8–18 J.) tranken an sechs Abenden 20 g Glukose oder 1, 13, 26, 39 bzw. 51 g Fett, fast ohne Kohlenhydrate und Eiweiß, ohne Insulin. Gemessen wurde 8 h mit CGM.
   - Ergebnis: Die Fettwirkung ist dosisproportional und ab 4 h signifikant (p = 0,026). Sie bleibt es bis 8 h.
   - Je 10 g Fett steigt der Blutzucker ab 330 min im Mittel um 0,28 mmol/L (95-%-KI 0,15–0,39).
   - Keine Schwelle im geprüften Bereich.
   - Abstract gelesen: https://research.universityofgalway.ie/en/publications/does-dietary-fat-cause-a-dose-dependent-glycemic-response-in-yout-4/ (Wiley: https://onlinelibrary.wiley.com/doi/10.1111/pedi.13273)
6. **Paterson MA, Smart CEM, Lopez PE et al. (2016).** Influence of dietary protein on postprandial blood glucose levels in individuals with Type 1 diabetes mellitus using intensive insulin therapy. *Diabet Med*, doi 10.1111/dme.13011.
   - Design: 27 Teilnehmende (7–40 J.). Molkeneiweiß (0, 12,5, 25, 50, 75, 100 g) oder Glukose (10, 20 g) in Wasser, ohne Insulin, 4 h nach dem Abendessen, 300 min beobachtet.
   - 60–120 min: 25, 75 und 100 g *senkten* den Blutzucker (100 g: 95-%-KI −1,74 bis −0,71 mmol/L).
   - 180–240 min: 75 g (KI 0,01–1,41; P = 0,045) und 100 g (KI 0,40–1,73; P = 0,002) höher.
   - 240–300 min: 75 g (KI 0,93–2,36) und 100 g (KI 1,04–2,41) höher, P < 0,001.
   - Bis 50 g gab es keinen signifikanten späten Anstieg.
   - Nur als Zusammenfassung gelesen, nicht im Original: https://www.diabetesincontrol.com/influence-of-protein-on-glycemic-control/
7. **Paterson M, Bell KJ, O'Connell SM, Smart CE, Shafat A, King B (2015).** The role of dietary protein and fat in glycaemic control in type 1 diabetes: implications for intensive diabetes management. *Curr Diab Rep* 15(9):61. Review. *Neu am 26.09. abends.*
   - Enthält die Zahlen aus Smart 2013 (Kinder, 30 g Kohlenhydrate mit Insulin nach KE-Faktor). Blutzucker nach 5 h gegenüber der fett- und eiweißarmen Mahlzeit:
     - +35 g Fett: +2,3 mmol/L. In den ersten 90 min gedämpft.
     - +40 g Eiweiß: +2,4 mmol/L.
     - Beides: +5,4 mmol/L, die Wirkungen addieren sich.
   - Eiweiß ab etwa 28 g in gemischten Mahlzeiten: anhaltend höhere Werte ab 2–3 h, über 5 h hinaus.
   - Eiweiß allein ab etwa 75 g: Anstieg ab 100 min, Gipfel nach 5 h.
   - Fettreiche Mahlzeiten erhöhen bei Jugendlichen mit Typ 1 GLP-1, GIP und Ghrelin (Lodefalk 2010, im Review zitiert).
   - https://link.springer.com/article/10.1007/s11892-015-0630-5
8. **Lupoli R, Pisano F, Capaldo B (2019).** Postprandial glucose control in type 1 diabetes: importance of the gastric emptying rate. *Nutrients* 11(7):1559. *Neu am 26.09. abends.*
   - Fett in der Mahlzeit senkt die Antwort der ersten 2–3 h und verschiebt den Gipfel nach hinten.
   - Eigene Daten der Autoren: Bei verzögerter Magenentleerung liegt der Gipfel im Mittel 27 min später.
   - Der Satz, 50 g Fett hätten den Insulinbedarf im geschlossenen Regelkreis verdoppelt, ist dort ohne erkennbare Primärquelle. Nicht verwendet.
   - https://www.mdpi.com/2072-6643/11/7/1559

### Nicht gelesen — Zahlen daraus nicht verwendet

Stand 26.09. abends:

- Europe PMC ist im Rate-Limit (429), auch über die REST-Schnittstelle.
- PubMed und PMC zeigen ein Captcha.
- Wiley und diabetesjournals antworten mit 403.

| Quelle | Warum wichtig | Grund |
|---|---|---|
| Smart CE et al. 2013, *Diabetes Care* 36(12):3897–3902, Original | Zeitverläufe, Streuung | 403; Zahlen nur aus Paterson 2015 |
| Wolpert 2013, Methodenteil | Zeitfenster der Insulinsummen, Mahlzeitenzusammensetzung | Captcha, 403 |
| Bell KJ et al. 2015, *Diabetes Care* 38:1008 | Übersicht Fett, Eiweiß, glykämischer Index | 403 |
| Lodefalk M et al. 2008, *Diabet Med* (Fett und Magenentleerung bei Jugendlichen) | Größe der Magenverzögerung | Wiley 403, Europe PMC 429 |
| „Impact of dietary protein on postprandial glycaemic control and insulin requirements in Type 1 diabetes: a systematic review“ (PubMed 31454430) | Eiweiß in gemischten Mahlzeiten bei Erwachsenen | Captcha, 429 |
| Borie-Swinburne C et al. 2013, *J Hum Nutr Diet* (Eiweiß) | Erwachsene, gemischte Mahlzeit | nur Titel gesehen |
| *Diabetes Care* 2025;48(4):509 (Eiweiß) | aktueller Stand | nicht abgerufen |

## Umsetzung (Engine)

Code: `engine/src/nutrition.ts`. Eingänge in `engine/src/model.ts`, Ereignis in `engine/src/events.ts`, Lauf in `engine/src/simulate.ts`. Studienszenarien in `engine/src/scenario/nutrition-check.ts`, Kalibrierung in `engine/scripts/nutrition-calibration.cjs`, Tests in `engine/tests/nutrition.test.ts`.

Grundsatz: **kein neuer Zustand.** Der 16er-Vektor bleibt, Fett und Eiweiß wirken über Eingänge. Die Mahlzeit bekommt drei optionale Felder:

```
MealEvent { …, fatG?: number, proteinG?: number, durationMin?: number }
```

### 1. Essdauer

Bisher kam jede Mahlzeit in einer Minute im Darm an. Das Feld „Dauer der Mahlzeit“ in der App hatte keine Wirkung, nur die Anzeige. Die Absorptionskonstante `tau` stand dort irrtümlich als „min“. Jetzt kommen die Kohlenhydrate gleichmäßig über die Essdauer verteilt an.

### 2. Fett bremst den Magen

Die Kohlenhydrate derselben Mahlzeit laufen durch einen exponentiellen Magenspeicher mit der mittleren Verzögerung

```
τ_Magen = min(120 min, 1,0 min/g · Fett)
```

Die angekommene Menge ist die exakte Faltung aus Gleichverteilung (Essdauer) und Exponentialverteilung. Integriert wird minutengenau über die Verteilungsfunktion, es geht nichts verloren (Test).

- **Status N.** Die Richtung ist belegt (Smart 2013, Lupoli 2019, Faggionato 2026), die Größe nicht, weil Lodefalk 2008 ungelesen ist.
- Nachgerechnet für Lena, 60 g KH, Bolus 10 min vorher: Mittel der ersten 90 min 137 mg/dL ohne Fett, 104 mit 35 g, 95 mit 60 g.

### 3. Fett senkt die Insulinsensitivität

```
R(t)     = k · max(0, Fett − 20 g) · Glocke(t − t_Mahlzeit)
Glocke(s) = (s/3τ)³ · e^(3 − s/τ)          Gipfel 1 bei s = 3τ
siFactor = 1 / (1 + R),   si' = si(G) · siFactor
k = 0,020 pro g,   τ = 110 min (Gipfel nach 5,5 h)
```

Der Faktor wirkt auf alle drei Insulinpfade (`kb1`, `kb2`, `kb3`). Mehrere Mahlzeiten addieren sich in `R`. Die Form `1/(1+R)` bleibt positiv und sättigt.

- **Gipfel 5,5 h:** Wolpert (Mehrbedarf 5–10 h), O'Connell (signifikant ab 4 h bis 8 h).
- **Schwelle 20 g pro Mahlzeit:** Das ist keine Physiologie, O'Connell findet keine Schwelle. Es ist ein Bezugspunkt.
  - KE-Faktor und Basalrate eines Menschen sind im echten Leben auf sein gewöhnliches Essen eingestellt, gewöhnliches Fett steckt schon darin.
  - Die Studien messen dagegen Kontraste zu fast fettfreien Mahlzeiten (Wolpert 10 g, O'Connell 1 g).
  - Ohne Schwelle summieren sich drei normale Mahlzeiten zu einem Tag mit dauerhaft geschwächtem Insulin.
  - Nachgerechnet für Lena, drei Tage, Mahlzeiten „gemischt“ (0,25 g Fett und 0,3 g Eiweiß pro g KH), Tagesmittel am 2. und 3. Tag: nur Kohlenhydrate 178 mg/dL; mit Fett und Eiweiß ohne Schwelle 295, Schwelle 10 g 227, Schwelle 20 g 194. Ohne Fettresistenz ergibt sich derselbe Wert, 194.
  - 20 g entspricht der Voreinstellung „gemischt“ bis 80 g KH. **Status N.**
- **Größe `k`:** kalibriert am Wolpert-Szenario im Mittel der 20 Subjekte (unten). **Status N, an Q kalibriert.**

### 4. Eiweiß liefert späte Glukose

```
Rate(t) = y · Eiweiß · Erlang₃(t − t_Mahlzeit; τ)      direkt ins Plasma (Q1)
y = 0,19 g Glukose pro g Eiweiß,   τ = 90 min (Gipfel der Rate nach 3 h, Mittel 4,5 h)
```

Neuer Eingang `uProteinGlucose` [mmol/min] in `dQ1/dt`. Die Glukose kommt aus der Leber, deshalb läuft sie nicht durch die Darmkompartimente.

- **`y`:** kleinste Quadrate auf die vier Paterson-Punkte (75 und 100 g, 180–240 und 240–300 min, jeweils Mitte des Konfidenzintervalls), im Mittel der 20 Subjekte. **Status N, an Q kalibriert.**
- **`τ`:** Die Daten bestimmen `τ` nicht. Die Fehlerquadrate fallen von τ = 50 bis 240 min nur flach (0,46 → 0,09 für Lena), und alle Werte liegen in den Konfidenzintervallen.
  - Größere `τ` verlangen eine immer höhere Ausbeute, bei τ = 240 min 0,68 g/g. Das ist unplausibel.
  - Gewählt wurde τ = 90 min nach der in den Reviews beschriebenen Wirkung 3–5 h nach dem Essen (Paterson 2015, Margaritis 2025). **Status N.**
- **Keine Schwelle.** Paterson 2016 zeigt bis 50 g keinen signifikanten Anstieg, das Review nennt ab 28 g in gemischten Mahlzeiten einen. Linear ohne Schwelle liegt in allen Konfidenzintervallen.
  - Folge: Gewöhnliches Eiweiß hebt einen Tag spürbar, aber nicht zerstörerisch.
  - Lena mit drei „gemischten“ Mahlzeiten, nur Eiweiß: 193 statt 178 mg/dL.
  - **Offen:** Soll Eiweiß denselben Bezugspunkt bekommen wie Fett? Siehe „Offene Entscheidungen“.

### Neutralität

Ohne `fatG`, `proteinG` und `durationMin` ist alles exakt wie vorher: Lieferung in einer Minute, `siFactor` 1, keine Zusatzglukose. Der Orakelabgleich gegen py-mgipsim bleibt unberührt, alle 120 alten Tests laufen unverändert. Dazu kommen 13 neue Tests in `tests/nutrition.test.ts`, zusammen 133.

### Nicht modelliert

- Die **frühe Senkung nach reinem Eiweiß** (Paterson: 100 g, 60–120 min, −1,2 mmol/L). Der Mechanismus ist ungeklärt. Nebel zeigt dort +0,3 mmol/L.
- **Sättigung beim Eiweiß.** Paterson misst bei 75 und 100 g fast dasselbe, Nebel rechnet linear.
- **Eiweiß verlangsamt die Magenentleerung.** Nicht gerechnet.
- **Körpergewicht.** Die Fettresistenz wird nicht auf das Gewicht bezogen.
- **Hormonelle Wege** (GLP-1, GIP, Glukagon). Nebel hat kein Glukagonmodell, Spec §13.

## Kalibrierung und Nachrechnung

Aufruf:
- `npm run check:adapter` baut `dist/engine.cjs`.
- `node scripts/nutrition-calibration.cjs` rechnet nach.
- `node scripts/nutrition-calibration.cjs --fit` kalibriert neu.

Die Studien berichten Kohortenmittel. Kalibriert und verglichen wird deshalb am Mittel der 20 Subjekte des Datensatzes. Gemessen wird die physiologische Glukose, ohne Sensor. Alle Werte in mmol/L (× 18 = mg/dL).

**Operationalisierung Wolpert (Nebel-Annahme):** Mit welchem Faktor `m` muss *alles* Insulin, Basal und Bolus, ab dem Bolus zwölf Stunden lang skaliert werden, damit 60 g Fett denselben mittleren Blutzucker ergeben wie 10 g?
- Angenommene Mahlzeit: 60 g KH (40 % schnell), 25 g Eiweiß, 15 min Essdauer, Bolus nach KE-Faktor 10 min vorher.
- Die Kohlenhydrat- und Eiweißmengen der Studie sind unbekannt.
- Den geschlossenen Regelkreis baut Nebel nicht nach.

| Studie | Szenario | Studie | Nebel, Mittel 20 | Lena | Rolle |
|---|---|---|---|---|---|
| Wolpert 2013 | +50 g Fett, Insulinfaktor `m` | 1,42 (einzeln 0,83–2,08) | **1,43** | 1,32 | Kalibrierung Fett |
| Paterson 2016 | 75 g Eiweiß, 180–240 min | 0,01…1,41 | **0,93** | 1,54 | Kalibrierung Eiweiß |
| | 75 g, 240–300 min | 0,93…2,36 | **1,26** | 2,10 | |
| | 100 g, 180–240 min | 0,40…1,73 | **1,25** | 2,05 | |
| | 100 g, 240–300 min | 1,04…2,41 | **1,69** | 2,81 | |
| | 100 g, 60–120 min | −1,74…−0,71 | 0,29 | 0,46 | nicht modelliert |
| Smart 2013 (Kinder) | +35 g Fett, nach 5 h | 2,3 | 1,54 | 1,05 | Gegenprobe |
| | +40 g Eiweiß, nach 5 h | 2,4 | 0,63 | 0,95 | Gegenprobe |
| | beides, nach 5 h | 5,4 | 2,24 | 2,08 | Gegenprobe |
| | Fett, erste 90 min | gedämpft | −0,70 | −1,07 | Richtung stimmt |
| O'Connell 2021 (Kinder, reines Fett) | 13 g, ab 330 min | 0,34 (0,18–0,47) | 0,00 | 0,00 | Gegenprobe |
| | 26 g | 0,70 (0,38–0,97) | 0,96 | 0,50 | |
| | 39 g | 1,06 (0,57–1,48) | 2,83 | 1,42 | |
| | 51 g | 1,40 (0,75–1,95) | 4,26 | 2,10 | |

Die zehn Personen der App liegen beim Wolpert-Faktor zwischen 1,32 (Lena) und 1,53 (David). Das ist innerhalb der Einzelspanne der Studie.

### Lesart

- **Gemischte Mahlzeiten mit Insulin**, der Normalfall der App: Nebel trifft die Erwachsenenstudie (Wolpert). Die Kinderstudie mit derselben Frage (Smart) zeigt für Fett etwa das 1,5-Fache. Beide Studien liegen in derselben Größenordnung.
- **Reines Fett ohne Insulin** (O'Connell): Nebel überschätzt große Mengen um das 2- bis 3-Fache. Bei 13 g rechnet Nebel wegen des Bezugspunkts nichts.
  - Im Modell ist der Nüchternzustand empfindlich für gesenkte Insulinsensitivität: Die Basalrate ist genau auf das Gleichgewicht gefittet, schon kleine Änderungen verschieben es weit. Das bekannte Verhalten aus `model.ts` („tangentiale Nullstelle“) ist eine plausible Ursache, geprüft ist sie nicht.
  - In der App kommt Fett immer mit Kohlenhydraten (mindestens 5 g), betroffen sind also nur reine Fett-Snacks.
  - Ein Faktor `k`, der beide Studientypen trifft, existiert in diesem Modell nicht. Zwei Varianten wurden geprüft, beide ohne Erfolg:
    - Glockenbreite τ = 80, 95 und 110 min: An O'Connell kalibriert (k ≈ 0,0075 ohne Schwelle) bleibt der Wolpert-Faktor jedes Mal bei 1,14.
    - Fettresistenz nur auf die Gewebepfade (`kb1`, `kb2`), ohne Leber: O'Connell 51 g ergibt weiterhin 2,5 mmol/L, und der Wolpert-Faktor sinkt auf 1,25.
- **Eiweiß:** kalibriert an Eiweiß allein (Paterson). In gemischten Mahlzeiten bei Kindern (Smart) wirkt es etwa viermal stärker. Nebel liegt am unteren Rand.
- **Streuung:** Zwischen den Personen unterscheidet sich die Eiweißwirkung um den Faktor 3 (Paterson 75 g, 240–300 min: 0,63–2,10 mmol/L). Die Personen mit viel Basalinsulin reagieren weniger.

### Offene Entscheidungen

1. **Bezugspunkt für Eiweiß** wie bei Fett? Derzeit keiner. Gewöhnliche Mengen heben Lenas Tagesmittel um etwa 15 mg/dL.
2. **Ungelesene Quellen nachholen**, vor allem den Wolpert-Methodenteil (Zeitfenster der Insulinsummen, davon hängt `k` ab) und Smart 2013 im Original.
3. **Reines Fett:** die Überschätzung hinnehmen (derzeit so) oder das Modell erweitern. Ein eigener Weg für Fett ohne Kohlenhydrate wäre ohne Mechanismus geraten.

## Was die App zeigt

- **Blatt „Essen eintragen“:** zwei neue Regler, Fett und Eiweiß (0–80 g, Schritt 5). Der Mahlzeitentyp setzt sie voraus, pro g Kohlenhydrate:

  | Typ | Beispiel | Anteil langsam | Fett | Eiweiß |
  |---|---|---|---|---|
  | schnell | Traubenzucker, Saft | 0 | 0 | 0 |
  | gemischt | Brot mit Belag, Nudeln mit Tomatensoße | 0,65 | 0,25 | 0,3 |
  | fettig | Pizza, Burger mit Pommes | 0,65 | 0,45 | 0,4 |

  Grobe Richtwerte, keine Nährwerttabelle.
  - „Fettig“ lief bisher als 100 % langsame Kohlenhydrate. Jetzt macht das Fett die Verzögerung selbst, der Kohlenhydrat-Anteil ist wie bei „gemischt“.
  - Wer die Regler bewegt, behält seine Werte, bis er den Typ wechselt.
  - Ein Hinweis beschreibt, was die Mengen im Körper tun. Keine Dosierung.
- **Schätzfehler:** Derselbe Zufallsfaktor trifft alle drei Nährstoffe. Eine größere Portion hat von allem mehr.
- **Protokoll und Rückblick:** Fett und Eiweiß stehen neben den Kohlenhydraten, im Rückblick als tatsächlich gegessene Menge.
- **KH aktiv:** Kohlenhydrate, die nach fettem Essen noch im Magen liegen, zählen jetzt mit. Eiweiß zählt nicht mit.
- **Seite 3, Wirkung aufgeklappt:** vier Linien.
  - schnelle KH: durchgezogen
  - langsame KH: gestrichelt
  - Eiweiß: gepunktet, in der Farbe der Nahrung
  - Fett: gestrichelt, in Insulinblau. Das ist der Zucker, den das Insulin wegen der Resistenz *nicht* herausnimmt.
  - Fett und Eiweiß sind flach, aber lang. Deshalb sind sie am Gipfel beschriftet, und der Text rechnet sie über das Fenster zusammen, z. B. „hält Fett etwa 170 mg/dL im Blut, die das Insulin sonst herausgenommen hätte“.
  - Keine zweite Skala: Die würde ihre Größe falsch erzählen.
  - Die Insulinkurve zeigt die tatsächliche, durch Fett geschwächte Wirkung.
