# Nebel — Widerspruchsprüfung der Dokumentation & Changelog

Stand: 2026-09-22
Geprüfte Dokumente: `Nebel_Scientific_Engine_Foundation (1).docx` (14.09.), `Nebel_Equation_and_Parameter_Specification_V1_v2.docx` (14.09.), `Nebel_Engine_Content_Risk_Review_V1.docx` (14.09.)

Anlass: Die Entscheidung **Engine-Kern = ExtHovorka (Rashid et al. 2019, AG Cinar, 16 Zustände, herzfrequenzgetrieben)** fiel am 15.09. — also **nach** allen drei Dokumenten. Die Dokumente beschreiben daher eine andere Engine, als inzwischen beschlossen ist.

Die Originaldokumente bleiben unverändert als historischer Stand liegen. Korrigierter Stand: `10_Engine_Spec_V2_ExtHovorka.md`.

---

## 1. Gefundene Widersprüche

### W1 — Modellfamilien-Mix (kritisch)
Die Spec V1 kombiniert drei verschiedene Modellfamilien in einer Gleichungsmenge:

| Spec-Abschnitt | Tatsächliche Herkunft |
|---|---|
| §4 Glukose (`Gp, Gt, k1, k2, VG`) | Dalla Man / UVA-Padova |
| §5 Utilisation (`Vm0, Vmx, Km, F_cns`) | Dalla Man / UVA-Padova |
| §6 Insulin (`S1, S2, tmaxI, VI, ke`) | Hovorka |
| §7 Insulinwirkung (`X1–X3, ka1–3, Sf1–3`) | Hovorka |
| §9 Mahlzeit (`Ra1, Ag, tmaxG`) | Hovorka (Gut-Absorption) |
| §10 Bewegung (`Y, Z, f(Y)`) | Dalla Man / Breton 2009 |

Das verletzt §17 derselben Spec: *„Es ist nicht zulässig, Parameter oder Gleichungen verschiedener Modelle ohne explizite Harmonisierung zu mischen."*

**Korrektur:** Vollständiger Ersatz durch ExtHovorka. Eine Familie, ein Einheitensystem, eine Parameterquelle.

### W2 — Zwei Insulin-Wirkpfade ohne Kopplung
Spec §7 definiert `X1` (Transport) und `X3` (EGP-Suppression), aber in den Glukosegleichungen §4/§5 taucht nur `X` über `Vm(X)` auf. Zwei von drei Wirkpfaden hingen mathematisch in der Luft.

**Korrektur:** In ExtHovorka sind alle drei gekoppelt — `x1` im Transportterm `x1·Q1`, `x2` im Disposalterm `x2·Q2`, `x3` als `EGP0·(1−x3)`. Widerspruch entfällt mit dem Modellwechsel.

### W3 — Undefinierter Term `E`
`E` (renale Ausscheidung) steht in `dGp/dt`, während das Risk Review renale Glukoseverluste als *„weiter Research nötig"* führt. Ein V1-Gleichungsterm ohne Definition.

**Korrektur:** ExtHovorka definiert renale Clearance explizit: `FR = 0.003·(G − 9)·VG` für `G ≥ 9 mmol/L`, sonst 0. Research-Punkt ist damit geschlossen.

### W4 — Verwaiste Parameter `beta` und `gamma`
Beide stehen in der Exercise-Parametertabelle §10, kommen aber in keiner dort notierten Gleichung vor.

**Befund:** Sie stammen aus dem Dalla-Man/Breton-Exercise-Modell. Die Referenzimplementierung von ExtHovorka schleppt ebenfalls zwei tote Parameter im Vektor mit (`beta`, `a`) — sie werden entpackt, aber in keiner Gleichung verwendet.

**Korrektur:** Nicht portieren. In der Registry als *deprecated / nicht verwendet* markiert, damit sie nicht wieder auftauchen.

### W5 — Einheiten nicht entschieden
Spec §3: *„mg/dL in der Beobachtungsschicht; interne Modellgrößen entsprechend der gewählten Quellform"*. Das ist keine Entscheidung, sondern eine Verschiebung — und unhaltbar, sobald Dalla Man (mg/dL) und Hovorka (mmol) im selben Modell stehen.

**Korrektur:** ExtHovorka rechnet durchgängig SI: Glukose `mmol/L`, Glukosemassen `mmol`, Insulin `mU` / `mU/L`, Kohlenhydrate `mmol/min`, Zeit `min`. Umrechnung nach `mg/dL` (Faktor 18.0182) **ausschließlich** an der UI-Grenze.

### W6 — Foundation §14 widerspricht der Modellentscheidung
Foundation empfiehlt *„custom compact engine inspired by Hovorka and Dalla Man, benchmarked against UVA/Padova"*. Beschlossen ist stattdessen ein publiziertes, vollständig spezifiziertes Modell.

**Korrektur:** §14 ist überholt. Nebel baut keine eigene Modellfamilie, sondern implementiert ExtHovorka und beschränkt Eigenleistung bewusst auf die Beobachtungs- und Erlebnisschicht.

### W7 — Minimal-Zustandsliste unvollständig
Foundation §5 listet acht bis neun Zustände als V1-Minimum. ExtHovorka hat 16 — u. a. getrennte schnelle/langsame Kohlenhydratabsorption (4 Zustände) und drei Bewegungszustände.

**Korrektur:** Ersetzt durch die konkrete Zustandstabelle in der V2-Spec.

### W8 — Circadianität: V1 oder nicht?
Foundation §9 sieht einen parametrisierten Tageszeit-Modifikator für V1 vor. Das Risk Review führt tageszeitabhängige Insulinsensitivität unter *„weiter Research nötig"* und Dawn Phenomenon unter *„später"*, markiert Tageszeit in der Bereichstabelle aber als **V1**. Drei Aussagen, zwei Richtungen.

**Korrektur:** ExtHovorka enthält **keinen** Circadian-Term. V1-Entscheidung: Uhrzeit ist Event-Metadatum und UI-Achse, **kein** physiologischer Modifikator. Kein Dawn-Phänomen in V1.
Wichtig zur Abgrenzung: ExtHovorka hat stattdessen eine **glukoseabhängige** Insulinsensitivität (nichtlineares `tanh`-Mapping, erhöhte Sensitivität im Hypobereich, reduzierte im Hyperbereich). Das ist keine Tageszeitabhängigkeit und darf im UI nicht als solche erklärt werden.

### W9 — CGM-Schicht existiert im Quellmodell nicht
Foundation §10 und Spec §11 fordern Interstitium, Filterung und Rauschen. ExtHovorka liefert nur das Interstitium: `dIG/dt = (G − IG)/tsub`. Kein Sensormodell, kein Rauschen, kein Filter in der Referenzimplementierung.

Zusätzlich: Foundation §10 nennt eine physiologische Verzögerung von *„~5–10 min"* (ISPAD). ExtHovorka setzt `tsub = 15 min`. Direkter Zahlenwiderspruch.

**Korrektur, erweitert am 23.09.2026:** Zwei Werte, getrennt geführt. Die Engine behält 15 min als Quellwert, damit der Orakelabgleich aussagekräftig bleibt. Die Anwendung kalibriert auf **5 min** (seit 26.09. zentral im Nebel-Parametersatz, `engine/src/calibration.ts`), gestützt auf die ISPAD-Angabe von 5–10 min — die Kalibrierung ist also besser belegt als der Quellwert. Zulässig, weil `tsub` ausschließlich in die Beobachtungsschicht fällt: `IG` wird von keinem anderen Zustand gelesen, die Physiologie bleibt unberührt. Die übrige Sensorschicht (Filter, Rauschen, Abtastung) bleibt Nebel-Eigenleistung und ist als Annahme markiert.

### W10 — MDI vs. CSII
Alle drei Dokumente sprechen generisch von „subkutanem Insulin" und „Basal + Bolus". Beschlossen ist Pumpentherapie (CSII).

**Korrektur:** `uInsulin` ist in ExtHovorka ein kontinuierlicher Strom in `mU/min` — das bildet Pumpentherapie direkt ab: Basalrate als stückweise konstantes Tagesprofil, Bolus als kurzer Impuls, Temp-Basal als Skalierung, Pumpenstopp als `uInsulin = 0`. V1 = **Open-Loop CSII**, kein AID-Algorithmus.

### W11 — Klinische Schwellen in der falschen Einheit
ADA-Schwellen sind in den Dokumenten in mg/dL geführt (<70, <54), die Engine rechnet mmol/L.

**Korrektur:** Level 1 Hypo `< 3.9 mmol/L`, Level 2 `< 3.0 mmol/L`. Nicht verwechseln mit der Modellschwelle `4.5 mmol/L`, ab der ExtHovorka die ZNS-Glukoseaufnahme `F01` linear herunterregelt — das ist Physiologie, keine klinische Klassifikation.

### W12 — Bestätigt, kein Widerspruch
Die Angabe „16 Zustände, herzfrequenzgetrieben" trifft exakt zu und wurde an der Referenzimplementierung verifiziert.

### W13 — Tagesplan: entschieden dagegen, im Prototyp vorhanden, im Adapter halb (24.09.2026)
`06_Echtzeit_Modus.md` und `08_Beduerfnisse_und_Hunger.md` halten fest: kein vorgegebener Tagesablauf, ein Bedürfnismodell statt eines Plans, „nichts passiert hinter seinem Rücken". Der Prototyp dagegen hat Bewegung aus einem Tagesplan: angekündigtes Training, unangekündigte Alltagsbewegung. Der Adapter erzeugte den Plan und zählte in der Anzeige auf das Training herunter, führte ihn aber nie aus. Drei Aussagen, und die Anwendung zeigte etwas an, das nie passierte.

**Korrektur:** Die Entscheidung in 06/08 betrifft die Mahlzeiten. Die entstehen weiter nur aus dem Bedürfnis, nicht aus einem Drehbuch. Bewegung kommt wieder aus dem Plan, wie im Prototyp: Training wird angekündigt, damit man sich vorbereiten kann, und bei einem Sensorwert unter 80 oder über 280 verschoben, nach drei Versuchen abgesagt. Alltagsbewegung passiert ohne Ankündigung. Das widerspricht dem Satz „nichts passiert hinter seinem Rücken" bewusst: Der Bus wartet auch im echten Leben nicht. **Bestätigt am 09.11.2026** mit Nojos Auftrag, die offenen Punkte des Bewegungssystems umzusetzen. Zurücknehmen hieße: `_runPlan` im Adapter entfernen und den Plan nicht mehr anzeigen.

---

## 2. Neue Informationen (22.09.)

### Referenzimplementierung gefunden
**py-mgipsim** — Open-Source-Python-Bibliothek der Cinar-Gruppe (Illinois Tech), enthält das Modell wörtlich als Modul `T1DM.ExtHovorka`.

- Repository: https://github.com/illinoistech-itm/py-mgipsim
- Paper: Siket, Rashid & Cinar (2025), *J Diabetes Sci Technol* — https://pubmed.ncbi.nlm.nih.gov/40110887/
- Ursprungspaper des Simulators: Rashid et al. (2019), *Computers & Chemical Engineering* — https://pubmed.ncbi.nlm.nih.gov/32863472/

Damit liegen vor: alle 16 Zustandsgleichungen, alle 35 Parameter, **20 virtuelle Patienten** als JSON (inkl. Basalrate, KE-Faktor, Korrekturfaktor, Ruhepuls, HbA1c, Körpermaße), Euler- und RK4-Solver.

### Lizenz — muss entschieden werden
py-mgipsim steht unter **GPL-3.0**. Ein direkter Port des Codes nach TypeScript wäre ein abgeleitetes Werk und würde Nebel zwingen, ebenfalls GPL-3.0 zu sein (Quelloffenlegung bei Weitergabe).

Empfohlenes Vorgehen: Implementierung **aus den publizierten Gleichungen** (Papers), py-mgipsim ausschließlich als **numerisches Vergleichsorakel** für die Testsuite. Gleichungen und Parameterwerte aus einer Veröffentlichung sind nicht urheberrechtlich geschützt; Codestruktur ist es. Kein Copy-Paste, keine übernommene Modulstruktur, keine übernommenen Variablennamen-Eigenheiten.

### Qualitätsmängel der Referenzimplementierung
Beim Portieren nicht blind übernehmen:

1. `States.py` führt eine veraltete Attributliste (`D1, D2, DH1, DH2, Efast, Eslow, Ehigh, Gsub`), die **nicht** mit der tatsächlichen Zustandsreihenfolge in `state_names` übereinstimmt. Maßgeblich ist die Reihenfolge im Rückgabevektor von `model()`.
2. Die Einheitenliste `state_units` ist unvollständig und teils unsinnig (Einträge wie `'S2'`, `'x1'` als „Einheit"). Einheiten müssen aus den Papers belegt werden, nicht aus dem Code.
3. `beta` und `a` sind tote Parameter (siehe W4).
4. Harte Klammerung von `Q1` auf `[VG, 32·VG]`, also `G ∈ [1, 32] mmol/L` — das ist eine numerische Schutzmaßnahme, keine Physiologie. Muss im Model Validity Envelope als solche geführt werden.

### Getroffene Projektentscheidungen (22.09.)
- **Architektur:** Engine als separates TypeScript-Modul mit eigener Testsuite, headless lauffähig. UI-Prototyp (`index.html`) wird erst danach angekoppelt.
- **Therapieform V1:** Open-Loop CSII (Basalprofil, Bolus, Temp-Basal, Pumpenstopp). Kein Closed-Loop-Algorithmus.

---

## 3. Status der priorisierten Research-Liste (Risk Review §5)

| Punkt | Vorher | Jetzt |
|---|---|---|
| Exercise-Modell verifizieren | offen | **geschlossen** — HR-Reserve-getrieben, 3 Zustände, Parameter p1–p8 + VT_HRR |
| Insulintypen | offen | **entschieden für V1** — generischer Insulininput (`mU/min`), ein PK-Profil über `tmaxI`; Pumpentherapie nutzt ohnehin nur ein Analogon |
| Insulinresistenz | offen | **geschlossen** — über `kb1–kb3` und das nichtlineare SI-Mapping abgebildet, kein separater Mechanismus nötig |
| Fett/Protein | offen | **teilweise** — ExtHovorka trennt schnelle (`tmaxGFast = 20 min`) und langsame (`tmaxG = 40 min`) Kohlenhydrate. Das ist ein Absorptions-Split, kein Fett/Protein-Modell. Weiterhin offen: Zuordnung realer Mahlzeiten auf diesen Split |
| Gegenregulation bei Hypo | offen | **offen** — ExtHovorka hat kein Glukagon. Stattdessen: `F01`-Reduktion unter 4.5 mmol/L. Für V1 ausreichend, als Grenze dokumentieren |
| Renale Glukoseverluste | offen | **geschlossen** — `FR`, Schwelle 9 mmol/L |
| Tageszeitabhängigkeit | offen | **entschieden** — nicht in V1 (siehe W8) |
| Individualisierung | offen | **geschlossen** — 20 publizierte Parametervektoren; keine frei erfundenen Kombinationen nötig |
| Model Validity Envelope | offen | **offen** — muss geschrieben werden, erste Bausteine: `G ∈ [1, 32] mmol/L`, HR ∈ `[HRrest, HRmax]`, Schrittweite ≤ 1 min. Ergänzt 23.09.: tägliche Belastung ohne Anpassung treibt einzelne Subjekte über Tage an den Boden (Nachtrag 6) |

---

## 4. Was unverändert gilt

Aus den Originaldokumenten bleiben in Kraft und wurden in die V2-Spec übernommen:

- Die Trennung Physiologie → Beobachtung → Interpretation → Entscheidung → verzögerte Konsequenz
- Parameterpolitik: Quellwert und kalibrierter Wert nie vermischen, jede Zahl mit Quelle und Konfidenz
- Validierungshierarchie in sechs Stufen, Tests vor Implementierung
- Die V1-Ausschlussliste (kein UVA/Padova-Klon, kein vollständiges Glukagonmodell, keine willkürlichen Stress-/Krankheits-Multiplikatoren, keine Dosierungsempfehlungen)
- Der wissenschaftliche Vorbehalt: Bildungs- und Forschungsprototyp, kein Medizinprodukt
- Die 15 inhaltlichen Scheitergründe aus dem Risk Review — insbesondere Nr. 1 („zu früh als realistisch behandeln") und Nr. 15 („unkontrolliertes Wachstum")

---

## 5. Nachtrag 22.09.2026 — Engine implementiert und gegen das Orakel geprüft

Die Engine ist gebaut: 84 Tests grün, `tsc --noEmit` sauber. Validierungsstufe 0 ist bestanden (Details in `10_Engine_Spec_V2_ExtHovorka.md`, Abschnitt 12).

Drei Befunde aus der Implementierung, die in keiner Quelle stehen:

**Das Basalgleichgewicht ist algebraisch nicht per Bisektion zu finden.** Bei einer auf den Zielwert gefitteten Basalrate hat das Residuum der Glukosebilanz eine tangentiale Nullstelle ohne Vorzeichenwechsel. Jedes Bisektionsverfahren landet am Rand. Der Zustand wird deshalb über 72 Stunden ausintegriert. Nebeneffekt: der geschlossene Ausdruck aus der Referenzimplementierung musste nicht angefasst werden, was die Lizenzabgrenzung sauber hält.

**Die Einheitenkette ist unabhängig bestätigt.** Die publizierte Basalrate von Patient 1 (1,14 U/h) hält im Modell exakt 6,0 mmol/L über zwölf Stunden. Ein Fehler um den Faktor 60 oder 1000 wäre sofort sichtbar gewesen.

**Herzfrequenzereignisse sind Stützstellen einer interpolierten Spur.** Zwei Punkte für einen Belastungsblock ergeben eine über den ganzen Block abfallende Rampe und damit etwa halbe Wirkung. Dafür gibt es `exerciseBlock()`. Wer das übersieht, verdächtigt die Bewegungsparameter.

Offene Frage aus dem Rauchtest, jetzt beantwortet: 60 g ohne Bolus führen bei Patient 1 nur auf rund 194 mg/dL, was für Typ-1 tief wirkt. Der Orakelabgleich zeigt, dass das keine Abweichung ist, sondern das Verhalten von ExtHovorka mit diesem Parametersatz. Wer eine höhere Spitze erwartet, muss das Subjekt wechseln, nicht die Engine.

---

## 6. Nachtrag 23./24.09.2026 — Sensormodell V2, ein Szenariofehler, drei Adapterfehler

**Sensormodell V2.** Auslöser war eine Beobachtung aus der Anwendung: Bei ruhigem Verlauf sprang der Sensorwert unrealistisch, etwa 90 → 92 → 93 → 89. Ursache: Das publizierte G6-Fehlermodell würfelt sein Rauschen pro Wert, 31 % der Schritte in ruhigen Phasen waren 4 mg/dL oder größer. V2 trennt den Fehler nach Zeitskala — fester Kalibriercharakter je Sensor, langsame Drift über Stunden, kleines Zittern — und ergänzt seltene Ereignisse mit Ursache: Druck auf den Sensor im Schlaf, Sensorwechsel mit unruhigem ersten Tag. Der erste Tag der Simulation bleibt frei davon; Ereignisse frühestens ab der zweiten Nacht. Details, Belege und Kalibrierung in `20_Parameter_Registry.md` Abschnitt 5. Das G6-Modell bleibt als `LAB_G6_SENSOR` zum Vergleich.

**Szenariofehler in `exerciseBlock()` — hat Zahlen in der Dokumentation verfälscht.** Die Herzfrequenz ist eine linear interpolierte Spur (Nachtrag 5). `exerciseBlock()` setzte einen Ruhepunkt nach dem Block, aber keinen davor. Zwischen zwei Blöcken an aufeinanderfolgenden Tagen stieg die Herzfrequenz deshalb den ganzen Tag an, von 76 auf 113 bpm. In der Kalibrierungsprüfung lagen 14 von 20 Subjekten 47–71 % der Zeit unter 70 mg/dL, viele am numerischen Boden. Die daraus berichteten Sensorzahlen (G6-MARD 12,8 %, im Tiefbereich 21,9 %, „viermal so ungenau") waren falsch und sind in der Registry korrigiert (jetzt 5,3 % und 12,2 %, „doppelt so ungenau"). Die Anwendung war ebenfalls betroffen: Wer zwei Einheiten in einer Sitzung startete, bekam zwischen ihnen eine ansteigende Herzfrequenz. Behoben durch einen Ruheanker bei `start − 1`, abgesichert durch einen Regressionstest. Der Zufallsgenerator wurde dabei mitgeprüft und ist in Ordnung.

**Befund, kein Implementierungsfehler: tägliche Belastung ohne Anpassung.** Patient 3 mit drei Mahlzeiten samt vollem Bolus und täglich 45 min Belastung um 17 Uhr: nachts am zweiten Tag 34 mg/dL, am dritten Tag am Boden von 18 mg/dL. Das Orakel (py-mgipsim, gleiches Szenario, Euler) liefert 35 mg/dL und danach negative Werte (−172 mg/dL), die Engine stimmt also mit der Quelle überein. Der Langzeiteffekt der Belastung summiert sich in ExtHovorka über Tage. Ob diese Stärke physiologisch plausibel ist, ist offen. Für die Anwendung gilt bis zur Klärung: Werte unter 40 mg/dL sind ein Modellrand, der Sensor zeigt dort LO. Das gehört in die Model Validity Envelope.

**Vier Adapterfehler, gefunden beim Prüfen:**

1. *Geplante Bewegung lief nie.* Siehe W13. Jetzt ausgeführt, mit Ankündigung, Verschieben und Absagen wie im Prototyp. Entschieden wird am Sensorwert, den die Person sieht, nicht an ihrem Blutzucker.
2. *Überlappende Einheiten änderten die Vergangenheit.* Eine neue Herzfrequenz-Stützstelle verändert wegen der Interpolation auch die Minuten vor ihr. Startete man eine Einheit mitten in einer laufenden, wich das Nachrechnen um 4,3 mg/dL vom Live-Verlauf ab. Jetzt hält ein Anker den zuletzt gerechneten Wert fest, bevor neu gesetzt wird. Nachrechnen ist wieder bitgleich.
3. *Speichern und Fortsetzen verlor die Physiologie.* Gespeichert wurde nur die Anzeige. Nach dem Neuladen kam der Zustandsvektor frisch aus dem Gleichgewicht, die Eingaben waren leer, und der Echtzeitmodus rechnete die verpasste Zeit von diesem falschen Zustand aus nach. Jetzt wird der Kern mitgespeichert, wie in `06_Echtzeit_Modus.md` spezifiziert: Zustandsvektor, alle Eingaben, Reserven. Alte Spielstände ohne Kern werden verworfen.
4. *Jede Sitzung sah gleich aus.* Der Zufall ist zählerbasiert, der Seed war fest. Damit hatte jede neue Sitzung denselben Tagesplan und denselben Sensor — beim Standard-Seed sechs Tage ohne ein einziges Druckereignis. `06_Echtzeit_Modus.md` verlangt einen Plan, der zwischen Durchläufen variiert (Lernziel 4). Jetzt würfelt jede neue Sitzung ihren Seed; gespeicherte Sitzungen bringen ihren mit.

Prüfstand: 112 Tests grün, `tsc` sauber, Adapterprüfung von 21 auf 28 Punkte erweitert (Plan läuft, Verschieben bei tiefem Wert, Nachrechnen bitgleich trotz Überlappung, eigener Seed je Sitzung, fremder Spielstand abgelehnt, Fortsetzen bitgleich). Gerendert: Druckereignis in Nacht 2 — Sensor fällt in 35 min von 85 auf 65, Körper bleibt bei 79.

---

## 7. Nachtrag 26.09.2026 — Rückblick deckt Druck auf den Sensor auf

Druckereignisse bleiben live unsichtbar, sonst gäbe es nichts einzuschätzen. Der Adapter schreibt sie aber mit, getrennt vom Protokoll (`eng.sensorFaults`): Beginn, Ende, tiefster angezeigter Wert, Blutwert in diesem Moment. Der Rückblick zeigt sie an drei Stellen:

- **Kachel** „Sensor gedrückt" mit der Anzahl
- **Kurve**: gestrichelt markierter Bereich „gedrückt". Liegt das letzte Ereignis innerhalb von 24 h, reicht das Kurvenfenster automatisch bis dorthin zurück
- **Liste**: „Sensor gedrückt, 65 min · angezeigt 60, Blut 103". Hat die Nutzerin im Ereignis gegessen, steht dahinter „du hast 15 g gegessen, auf einen Messfehler"; gab es einen Tiefalarm, „Tiefalarm ausgelöst, das Blut war nie tief"

Das ist die Lehre des Ereignisses: nicht, dass Sensoren irren, sondern dass man einem Messfehler geglaubt und danach gehandelt hat. Die Ereignisse überleben Speichern und Neuladen und stehen im JSON-Export unter `sensorfehler`.

Prüfstand: Adapterprüfung auf 33 Punkte (Ereignis mitgeschrieben, Sensor tiefer als Blut, nicht im Live-Protokoll, überlebt Speichern, wach kein Ereignis). Gerendert mit beiden Varianten: ohne Reaktion und mit Traubenzucker auf den Messfehler.

---

## 8. Nachtrag 26.09.2026 — Korrekturfaktor der App passt nicht zu jedem Modellkörper

Die App zeigt unter „Deine Therapiewerte" den Korrekturfaktor aus dem Datensatz (`demographic_info.correction_bolus`). Er ist nicht aus den Modellparametern abgeleitet. Nachgerechnet für alle 20 Subjekte: 1 U, gegeben 2 h nach 60 g ohne Bolus, größte Absenkung gegenüber dem Lauf ohne diese Einheit. Das Verhältnis Modell zu Datensatz liegt im Median bei 0,75, in der Spanne von 0,27 bis 1,41. Beim Standardsubjekt Patient 1 passt es (25 gegen 28 mg/dL pro U), bei Patient 7 liegt die Kachel um den Faktor 3,8 daneben (64 angezeigt, 17 im Modell). Die Messung hängt vom Ausgangswert ab, weil die Insulinsensitivität im Hyperbereich sinkt (bei 270 mg/dL auf 0,83). Offen: Kachel aus dem Modell ableiten oder die Abweichung als Lerninhalt erklären. Der KE-Faktor ist noch nicht geprüft. Eingetragen in Registry Abschnitt 6.

---

## 9. Nachtrag 26.09.2026 — Insulin zu träge: `tmaxI` in der App auf 50 min

**Auslöser.** Beim Testen wirkte 1 U ohne Essen kaum und ohne erkennbaren Wirkungsverlauf. Nachgerechnet mit den Quellwerten: Beim Standardsubjekt Patient 1 (`tmaxI` 114 min) senkt 1 U nach einer Stunde um 2 mg/dL, am stärksten wirkt sie nach 1,7 h, der Tiefpunkt kommt nach 6,3 h bei −18 mg/dL. Die Plasmainsulinspitze liegt bei 122 min. Über alle 20 Subjekte: stärkster Abfall nach 1,7 h, Tiefpunkt nach 6,1 h (Median).

**Widerspruch.** Die Fachinformation zu Insulin aspart (NovoRapid, Abschnitt 5.1 und 5.2) nennt Wirkbeginn nach 10–20 min, Maximum nach 1–3 h, Wirkdauer 3–5 h und eine Plasmaspitze nach 40 min (IQR 30–40). Die App selbst versprach „Maximum nach eineinhalb Stunden, Ende nach vier bis fünf". Das Modell war langsamer als beides. `05_Zielgruppe_und_Lernziele.md` nannte `tmaxI` ≈ 110 min sogar „die zentrale Zahl der ganzen Erfahrung" — übernommen, ohne gegen eine Fachinformation geprüft zu sein.

**Korrektur.** In der App gilt `tmaxI` = 50 min für alle Subjekte, im Adapter neben `tsub` als Nebel-Kalibrierung gekennzeichnet. Die Engine behält die Quellwerte, der Orakelabgleich bleibt unberührt. Das Basalgleichgewicht hängt nicht von `tmaxI` ab.

| `tmaxI` | Plasmaspitze (P1) | stärkster Abfall | Tiefpunkt | 1 U senkt um (Median) |
|---|---|---|---|---|
| Quelle (58–131) | 122 min | 1,7 h | 6,1 h | 29 mg/dL |
| 40 | 49 min | 0,8 h | 3,0 h | 32 mg/dL |
| **50** | **59 min** | **1,0 h** (0,8–1,1) | **3,5 h** (3,1–4,2) | **31 mg/dL** |
| 55 | 64 min | 1,1 h | 3,7 h | 31 mg/dL |

Mit einem einzigen Parameter trifft das Modell Plasmaspitze und Wirkmaximum der Fachinformation nicht gleichzeitig: Bei 40 min Plasmaspitze käme das Wirkmaximum schon nach 0,8 h. Die Wirkung folgt im Modell dem Plasmainsulin schneller als in der Wirklichkeit. Vorrang hat die Wirkung, weil nur sie sichtbar ist. 50 min legt Maximum und Wirkdauer in die Grenzen der Fachinformation und nimmt eine um etwa 20 min späte Plasmaspitze in Kauf.

Nebenwirkungen geprüft: 60 g mit Bolus nach KE-Faktor steigen im Median nur noch auf 142 statt 165 mg/dL, der Tiefstwert danach bleibt bei 105 (niedrigster 86). Der Korrekturfaktor der Kachel passt besser, im Median 0,93 statt 0,75, bei Patient 7 aber weiter um den Faktor 2,7 daneben (Nachtrag 8).

**Texte angepasst.** Startseite und Bolus-Hinweis sagen jetzt „am stärksten nach etwa einer Stunde, vorbei nach drei bis vier". Außerdem hat die Startseitenregel „Nichts wirkt für sich allein" noch Schlaf, Stress, Krankheit, Alkohol und Leberreserven als Einflüsse genannt, die es seit dem Umbau nicht mehr gibt. Sie beschreibt jetzt, was V1 tatsächlich kann: Bewegung macht Insulin für Stunden stärker (nachgerechnet: nach Nachmittagstraining liegt die Nacht bei 13 von 20 Subjekten 3–21 mg/dL tiefer, bei einigen nicht), dazu die Sensorereignisse.

Quelle: Fachinformation NovoRapid PumpCart, Abschnitte 5.1 und 5.2, https://www.medicines.org.uk/emc/product/7922/smpc

---

## 10. Nachtrag 26.09.2026 — Kalibrierung zentral in der Engine

Die Korrekturen für `tsub` und `tmaxI` standen nur im App-Adapter. Viewer, Kalibrierskripte und künftige Szenarien rechneten deshalb weiter mit der trägen Insulinaufnahme und 15 min Sensorverzögerung — App und Rest liefen auseinander. Jetzt stehen beide Korrekturen mit Beleg in `engine/src/calibration.ts`. `nebelParameters(subject)` liefert den Parametersatz, mit dem Nebel rechnet; App, Viewer und `cgm-calibration.cjs` nutzen ihn. Der Orakelabgleich und die Tests der Gleichungen nutzen ausdrücklich die Quellwerte, damit ein Rechenfehler weiter auffällt. Der Viewer kann zum Vergleich auf „Quelle" umschalten. Kalibrierzahlen in Registry 5.3 mit dem Nebel-Parametersatz neu gerechnet; sie verschieben sich nur am Rand. Neue Übersicht: Registry Abschnitt 7.

---

## 11. Nachtrag 26.09.2026 — Personenwahl auf der Startseite

Zehn wählbare Personen statt eines festen Subjekts, mit Avataren; Details in `09_Personen.md`. Standard ist jetzt Lena (Subjekt 10) statt Subjekt 1, weil Subjekt 1 bei Insulin und moderatem Sport am schwachen Rand liegt. Das Menü zeigt zuerst die objektiven Merkmale, aufgeklappt die Folgen im Vergleich zu den anderen neun. Die Folgen rechnet `responseProfile()` (neu, `engine/src/scenario/profile.ts`) beim Bau mit derselben Engine. Ein eigenes Profil mit echten Werten wird nicht gebaut (Zweckbestimmung, DSGVO, Scheingenauigkeit); später vielleicht Ähnlichkeits-Fragen ohne Zahlen. Prüfstand: 120 Tests, Adapterprüfung 39 Punkte.

---

## 12. Nachtrag 26.09.2026 — Vorhersage auf der Auswertungsseite, drei Darstellungsfehler, lebendigere Personenwahl

**Vorhersage.** Die Kurve der Auswertung zeigt jetzt die letzten Stunden und die nächsten zwölf: Sensorwerte und Blut bis jetzt, danach gestrichelt das Blut, wenn ab jetzt keine Entscheidung mehr dazukommt — keine Mahlzeit, kein Bolus, kein geplantes Training. Was schon läuft (verzögerter Bolus, laufende Bewegung, geänderte Basalrate), läuft weiter. Darunter die Wirkung in mg/dL pro Stunde: oben, was Essen gerade ins Blut bringt (Aufnahme aus dem Darm, `D2/tmax`), unten, was das Insulin aus den eigenen Entscheidungen gerade herausnimmt (Verbrauch im Gewebe `x2·Q2` und gebremste Leber `EGP0·x3`, über eine Kopie der Insulinkette nur für Bolus und Basalabweichung). Tippen auf „Essen" teilt in schnelle und langsame Kohlenhydrate. Dazu ein Satz: wo der Wert in zwölf Stunden liegt, tiefster und höchster Punkt, und ausdrücklich, dass nur die Simulation diese Kurve kennt.

Nicht der Transport `x1·Q1` als Insulinwirkung: Er verschiebt Zucker nur zwischen Blut und Gewebe, ein Teil kommt zurück; als Wirkung gezeigt wäre er dreimal so groß wie der tatsächliche Verbrauch. Ein erster Versuch mit Differenzen „mit minus ohne Entscheidung" wurde verworfen: Ohne Bolus bleibt der Wert stundenlang hoch, die Insulinwirkung sah dann noch nach acht Stunden riesig aus, obwohl das Insulin längst weg war.

**Fett und Eiweiß** kann die Aufteilung nicht zeigen, weil ExtHovorka sie nicht rechnet — gestrichen seit dem Umbau („V1 bleibt schlank"). Fettiges Essen läuft als langsame Kohlenhydrate; die App sagt das unter der Aufteilung. Eine echte Fett-/Eiweißwirkung bräuchte eine belegte Modellerweiterung und wäre eine Umkehr der damaligen Entscheidung. *(Überholt durch Nachtrag 15: Die Erweiterung ist gebaut, die Aufteilung zeigt jetzt auch Eiweiß und Fett.)*

Dafür im Adapter: Zustands-Schnappschuss alle 30 min (gut 24 h, mitgespeichert), Basaländerungen als Engine-Ereignis in der Eingabeliste statt als neues Pumpenprogramm (sonst ist die Basalgeschichte nicht nachrechenbar), gemeinsame Eingabefunktion für Lauf und Vorhersage. Geprüft: Die nachgerechnete Vergangenheit trifft den gelaufenen Wert auf 1e-6 mg/dL, die Vorhersage beginnt exakt beim aktuellen Blutzucker, Insulinwirkung hat ihr Maximum 1–3 h nach dem Bolus und ist nach 6 h auf 3 % abgeklungen, schnelle Kohlenhydrate wirken vor langsamen, ein geplantes, noch nicht begonnenes Training ändert die Vorhersage nicht, nach Neuladen ist sie identisch.

**Drei Darstellungsfehler auf der Simulatorseite:**

1. *Die Kacheln „Insulin aktiv / KH aktiv / im Ziel" lagen über dem Reservenbalken.* Selbst verursacht mit der Personenwahl: Die neuen Vergleichsleisten hießen `.strip` wie der Kachelstreifen des Simulators und gaben ihm feste Höhe und absolute Kinder. Umbenannt in `.cmpbar`. Zusätzlich stehen die Werte jetzt bündig, auch wenn „Insulin aktiv" auf schmalen Geräten umbricht.
2. *Der Titel der laufenden Bewegung war fast unsichtbar.* Aus dem Prototyp: Eine unbenutzte Regel `.live` (heller Text, 11 px) traf die Bewegungskarte, sobald sie „live" war — seit geplante Bewegung wirklich läuft (W13), passiert das ständig. Regel entfernt.
3. *Der Reservenwert war ein Farbklotz.* Aus dem Prototyp: Eine Regel gab Balken UND Zahl Hintergrund und Schrift in derselben Farbe. Getrennt.

Gegen Wiederholung: `build-viewer.mjs` prüft jetzt die Syntax aller Inline-Skripte und bricht den Bau ab — ein Schnittfehler beim Umbau hatte die Seite kurzzeitig komplett lahmgelegt.

**Personenwahl lebendiger.** Das Gerüst wird einmal gebaut und danach nur befüllt: Avatar springt beim Antippen, Ring blendet ein, die Karte gleitet über, die Vergleichspunkte wandern zur neuen Position, die Zahlen zählen um, und „Was das ausmacht" bleibt beim Durchklicken offen — so lassen sich Personen direkt vergleichen. Pfeiltasten wechseln die Person. Wer reduzierte Bewegung eingestellt hat, bekommt alles ohne Animation.

---

## 13. Nachtrag 26.09.2026 — Feinschliff nach Nojos Test

- **Avatare leben:** Kopf wiegt leicht, Oberkörper atmet, Augen blinzeln, jede Figur im eigenen Takt; beim Antippen grüßt der Kopf, in der Karte ebenso. Bei reduzierter Bewegung aus.
- **Auswahlrahmen bleibt beim Überfahren mit der Maus** (vorher ersetzte der Hover-Schatten den Rahmen).
- **Pluszeichen dreht ohne Ruckeln:** eigene Zeichenebene für das Kreuz, und die große Karte „Was das ausmacht" staucht beim Klicken nicht mehr.
- **Pfeiltasten in der Personenwahl blättern nicht mehr die Seite um.**
- **Startseite zu kurz:** Der Flex-Container streckte den Inhalt auf Fensterhöhe, der Abstand unter dem letzten Element fiel aus dem Scrollbereich; der Simulator-Knopf endete unter dem Seitenindikator. Betrifft alle drei Seiten, behoben.
- **Diagramme beim Wechsel hell/dunkel:** Canvas kennt keine CSS-Übergänge. Die Diagrammfarben werden jetzt in derselben halben Sekunde gemischt und jedes Bild neu gezeichnet, ohne die Vorhersage neu zu rechnen.
- **Kennzahlen der Auswertung kompakt:** eine Karte mit zwei Spalten statt acht Kacheln, gut halb so hoch.
- Die Vorhersagekurve beginnt nicht vor dem Start der Sitzung.

---

## 14. Nachtrag 26.09.2026 — Dexcom-Pfeile, Differenz, kompakte Regeln, Recherche Fett/Eiweiß

- **Trendpfeil:** fünf feste Stufen wie in der Dexcom-App — Doppelpfeil hoch, Pfeil hoch, waagerecht, Pfeil runter, Doppelpfeil runter — statt stufenloser Neigung. Grenzen nach der Dexcom-G6-Pfeiltabelle: stabil bis 1,8 mmol/L in 30 min (~1 mg/dL pro Minute), Doppelpfeil ab 5,0 mmol/L in 30 min (~3 mg/dL pro Minute). Die Schrägpfeile der Vorlage (1–2 mg/dL pro Minute) zählen hier zum einfachen Pfeil. *(Überholt durch Nachtrag 15: sieben Stufen mit Schrägpfeilen.)* Quelle: Dexcom Canada, „Using Dexcom G6 Trend Arrows", https://s3-us-west-2.amazonaws.com/dexcommisc/Canada+HCP/Using+the+Trend+Arrows_with+ranges_ENGLISH.pdf
- **Differenz zum vorigen Messwert** hinter dem Pfeil, z. B. „+15".
- **Fünf Regeln** als nummerierte Liste in einer Karte, eingeklappt etwa ein Drittel niedriger.
- **Recherche Fett und Eiweiß:** `11_Fett_und_Eiweiss.md`. Ergebnis: Eiweiß und die verzögernde Wirkung von Fett lassen sich über den Kohlenhydrat-Eingabeverlauf abbilden, die fettbedingte Insulinresistenz nicht. Entscheidung offen. *(Entschieden in Nachtrag 15: gebaut.)*

## 15. Nachtrag 26.09.2026 — Schrägpfeile, Fett und Eiweiß in der Engine

**Trendpfeil: sieben Stufen.** Wie die Dexcom-App, jetzt mit Schrägpfeilen. Grenzen nach derselben G6-Tabelle wie in Nachtrag 14, pro 30 min:

| Stufe | Steigung | Pfeil |
|---|---|---|
| ±3 | ab 3 mg/dL pro min (ab 5,0 mmol/L) | Doppelpfeil |
| ±2 | 2–3 (3,4–5,0) | gerade hoch/runter |
| ±1 | 1–2 (1,8–3,4) | schräg 45° |
| 0 | unter 1 (unter 1,8) | waagerecht |

- Die Differenz zum vorigen Messwert zeigt bei Gleichstand „0“ statt „±0“.
- Quelle: Dexcom Canada, „Using Dexcom G6 Trend Arrows“ (Link in Nachtrag 14).

**Fett und Eiweiß in der Engine.** Nojo hat entschieden, beide Stufen aus `11_Fett_und_Eiweiss.md` zu bauen. `engine/src/nutrition.ts` rechnet drei Wirkungen als Eingänge, ohne neuen Zustand:
- Fett verzögert die Magenentleerung.
- Fett senkt über Stunden die Insulinsensitivität: `siFactor` auf `kb1`–`kb3`, Gipfel nach 5,5 h.
- Eiweiß liefert späte Glukose aus der Leber: `uProteinGlucose` in `dQ1/dt`.

Kalibriert an Wolpert 2013 (Fett) und Paterson 2016 (Eiweiß), im Mittel der 20 Subjekte. Gegenproben an Smart 2013 und O'Connell 2021. Tabelle, Operationalisierung und Grenzen: Doc 11, Parameter: Registry §8.

**Neu gelesene Quellen:**
- O'Connell 2021 (*Pediatr Diabetes*): Fett allein, Dosis-Wirkung.
- Paterson 2015 (*Curr Diab Rep*): Review mit den Zahlen aus Smart 2013.
- Lupoli 2019 (*Nutrients*): Magenentleerung.
- Paterson 2016, nur als Zusammenfassung auf diabetesincontrol.com.

**Nicht lesbar** und in Doc 11 als ungelesen markiert: Smart 2013 im Original, der Wolpert-Methodenteil, Bell 2015, Lodefalk 2008 und ein systematisches Review zu Eiweiß (PubMed 31454430). Gründe: Europe PMC Rate-Limit (429), PubMed/PMC Captcha, Wiley und diabetesjournals 403.

**Widersprüche, gefunden und aufgelöst:**
- **„Dauer der Mahlzeit“ hatte keine Wirkung.** Der Regler im Essen-Blatt ging nie in die Engine. Das Protokoll zeigte statt der Essdauer die Absorptionskonstante des Typs (20/40/75) als „min“. Jetzt wird die Mahlzeit über die Essdauer verteilt geliefert, und das Protokoll zeigt die Essdauer.
- **„Fettig“ war als Vereinfachung gekennzeichnet** (`vereinfacht:true`, 100 % langsame KH). Das ist entfallen: Die Verzögerung kommt jetzt aus dem Fett, der KH-Anteil ist wie bei „gemischt“.
- **Adapter-Kommentar:** „Fett- und Proteinwelle“ stand als gestrichen. Jetzt steht dort, dass beide belegt zurück sind.
- **Seite 3, Hinweistext:** „Fett und Eiweiß rechnet das Modell nicht“. Ersetzt.
- **Spec §13:** „Keine Fett-/Proteinmetabolik“ ist teilweise aufgehoben und dort vermerkt.
- **Validierungsblock am Ende von `app/template.html`:** Er trug die Überschrift „Referenzwerte der kalibrierten Engine“, stammt aber aus der alten Prototyp-Engine mit Faktorsystem. Er ist jetzt als VERALTET markiert, mit Verweis auf die gültigen Referenzen. Die Zahlen bleiben als Geschichte stehen.

**Designentscheidung mit Folgen, bitte prüfen:** Die Fettresistenz zählt erst ab 20 g Fett pro Mahlzeit. Ohne diese Schwelle steigt Lenas Tagesmittel mit drei gewöhnlichen „gemischten“ Mahlzeiten von 194 auf 295 mg/dL. Eiweiß hat keine Schwelle, gewöhnliche Mengen heben Lenas Tag um etwa 15 mg/dL. Ob Eiweiß denselben Bezugspunkt bekommt, ist offen (Doc 11, „Offene Entscheidungen“).

**Tests:** 133 (vorher 120), `check:adapter` 59 Prüfungen. Neu dazu:
- Neutralität ohne Fett und Eiweiß
- Mengenerhalt bei Verzögerung
- Paterson in allen vier Konfidenzintervallen
- Wolpert-Faktor 1,37–1,47
- Richtung gegen Smart und O'Connell
- im Adapter: Fett hält Kohlenhydrate im Magen, spät höher, Summen stimmen

## 16. Nachtrag 12.10.2026 — Die App wird öffentlich

**Ziel:** Angehörige sollen die Simulation über einen Link öffnen können, ohne Installation. Adresse: `https://nojomcdybo.github.io/nebel/`. Rechtliche Begründung: `30_Rechtliche_Einordnung.md`, Abschnitt 7.

**Der Haken, bisher übersehen:** Die fertige App bettete alle 20 Parametersätze aus py-mgipsim ein. „Keine Parametersätze im Repository“ hätte für eine öffentliche Seite nichts genützt, denn sie hätte die Sätze an jeden Besucher verteilt. Jetzt:
- `engine/dist/site/personen-daten.js`: nur die zehn genutzten Sätze, als eigene Datei unter GPL-3.0, mit Herkunft (fester Commit), Änderungsvermerk und Lizenztext. Die App selbst bleibt Apache 2.0.
- `scripts/fetch-oracle.sh` holt py-mgipsim auf Commit `b985f8c` statt `main`, prüft einen Hash über die 20 Patientendateien und nimmt jetzt den Lizenztext mit. Der Hash ist identisch mit dem bisher benutzten Stand.

**Bau:**
- `npm run viewer` erzeugt jetzt `dist/site/` mit `index.html`, `personen-daten.js`, `rechtliches.html`, `fonts/` und `lizenzen/`. `dist/nebel.html` leitet nur noch dorthin weiter.
- Der Viewer bleibt eine Einzeldatei mit allen 20 Sätzen und bleibt lokal.
- `--release` bricht ab, wenn Impressumsangaben oder Lizenztexte fehlen oder eine Seite etwas von fremden Servern lädt.

**Widersprüche, gefunden und behoben:**
- **Google Fonts.** Die App lud ihre Schriften von Google. Das widerspricht der Aussage, Nebel verarbeite keine personenbezogenen Daten (`30_…`, Abschnitt 4), denn die IP jedes Besuchers ging an Google. Jetzt liegen die Schriften lokal (Fontsource, SIL OFL 1.1, als npm-Entwicklungsabhängigkeit). Geprüft: Die Seite fragt nur noch ihren eigenen Host an.
- **`30_Rechtliche_Einordnung.md` führte drei Bedingungen als offen**, die längst erfüllt waren: kein Bolusrechner, keine Eingabe echter Werte, Hinweis in der App. Status korrigiert.
- **Root-`README.md`, Abschnitt „Stand“:** „Physiologie noch nicht implementiert“ war seit dem 22.09. falsch. „Eine erwachsene Beispielperson“ stimmt seit der Personenwahl nicht mehr. Beides korrigiert, dazu Link zur App und Bauanleitung.

**Neu:**
- **Seite „Rechtliches“** (`app/rechtliches.html`): Zweck, Impressum, Datenschutz, Lizenzen und Herkunft. Verlinkt auf der Startseite und in der Auswertung. Die Impressumsangaben kommen aus Repository-Variablen, nicht aus dem Repo.
- **GitHub Action** `.github/workflows/pages.yml`: holen, Orakel, Typen, 133 Tests, Adapter, Bau mit `--release`, veröffentlichen.
  - Im Cloud-Container von Grund auf nachgestellt: frische Installation, festgehaltener Datensatz mit Hash, Referenzwerte, alle Prüfungen grün, Bau mit `--release` erfolgreich.
  - Nur der Tarball-Download war dort gesperrt, der Datensatz kam stattdessen per Git zum selben Commit.
- **Favicon** „n.“ als Inline-SVG, damit der Browser kein `favicon.ico` vergeblich anfragt.
- **Root-`README.md` auf Englisch** (Nojos Wunsch, 12.10.): Zweckbestimmung, Funktionen, Engine, Bauanleitung, Lizenzen. Die App und `docs/` bleiben deutsch, das README sagt das.

**Offen:**
- Impressumsangaben eintragen.
- Repository öffentlich schalten und Pages aktivieren.
- Mail an die Autorinnen und Autoren von py-mgipsim senden.
- Die Texte vor breiter Verbreitung einmal juristisch ansehen lassen.

## 16a. Nachtrag 28.10.2026 — Öffentlich, Hinweisfenster, englische Fassung (nachgetragen am 10.11.)

Dieser Tag stand bisher nur in `30_Rechtliche_Einordnung.md` (Abschnitte 7.1 und 7.3a) und im Git-Log. Nachgetragen nach der Regel, jede Entscheidung mit Datum hier und in `README.md` festzuhalten.

- **Antwort der py-mgipsim-Autoren** (Ali Cinar, 28.10.): keine Einwände gegen die Weitergabe der zehn Parametersätze. Zwei Bitten, beide umgesetzt: Die App sagt ausdrücklich, dass sie nur ein Lernsystem ist, kein Medizinprodukt und nicht für Insulindosierung, und das ist das Erste, was man bestätigt. Außerdem möchten sie den Link, sobald die Seite online ist.
- **Hinweisfenster „Bevor es losgeht“** vor der ersten Nutzung (`nebel.hinweis.v1`, `3413035`). Ohne Bestätigung bleibt die App gesperrt. Seit 09.11. mit Sprachwahl DE|EN (`1e5caba`).
- **Öffentlich:** Repository öffentlich, Pages über die Action, Release `v1.0.0`. Von den offenen Punkten aus Nachtrag 16 sind Impressumsvariablen, Freischaltung und Mail erledigt, die juristische Durchsicht nicht.
- **Englische Fassung** unter `/en/` mit englischem Hinweis- und Rechtstext (`en/legal.html`) und eigenem Browser-Speicher (`nebel.en.`), Release `v1.1.0` (`8b29a9f`). Die Quelle bleibt deutsch, der Bau ersetzt jeden Text über `engine/scripts/i18n-en.mjs` und meldet Lücken.
- **Startseite aufgeräumt** (`7b1c68d`): Hero-Text und Kachel „Deine Therapiewerte“ entfernt, KE-Faktor und Korrektur stehen nur noch auf der Personenkarte. Aktive Person markiert, Ziehen leichter, Begrüßungsanimationen. Danach die Regeln unter die Personenwahl, Wischen auch in der Bildmitte (`352f56a`).

## 17. Nachtrag 09.11.2026 — Reserven füllen sich beim Essen

**Behoben:**
- **Essen füllte die Reserven nicht auf.** `eat()` aus `scenario/needs.ts` war getestet, aber im Adapter nie aufgerufen. Die Reserve fiel deshalb nur, war nach rund 10 Stunden leer und zeigte ab dann dauerhaft „iss etwas“. Jetzt füllt `logMeal` sie mit der tatsächlich gegessenen Menge, nicht mit der Schätzung. Neu in `check:adapter`: „Essen füllt die Reserven“.
- **„Heißhunger“ erschien nie.** `isHeisshunger()` war geschrieben, aber nicht angeschlossen. Jetzt erscheint es als Hinweis in der Zustandsleiste, wenn Belastung (`EEfast > 0.35`) auf fast leere Reserven (`< 0.28`) trifft. Nur Anzeige, keine Physiologie: Der Multiplikator des Prototyps bleibt gestrichen.
- **App und Engine zeigten verschiedene Hinweise.** Die App kannte „Reserven · Abendessen“ (17:30–21 Uhr unter 0.55) aus dem Prototyp, `reserveLabel()` und `08_Beduerfnisse_und_Hunger.md` nicht. Ergänzt und getestet.

## 18. Nachtrag 09.11.2026 — Bewegungssystem abgeglichen, ruhigere Begrüßung

**Bewegung:**
- **W13 bestätigt.** Bewegung kommt aus dem Tagesplan, Mahlzeiten aus dem Bedürfnis.
- **Gleiche Grenzen.** Die Bewegungskarte warnte bei unter 90 und über 260, verschoben wurde erst unter 80 und über 280. Beide lesen jetzt `TRAIN_LOW`/`TRAIN_HIGH` im Adapter.
- **Training absagen.** Die Karte sagte „jetzt wäre die Zeit zu entscheiden“, bot aber nichts an. Ein angekündigtes Training lässt sich jetzt absagen, das Protokoll vermerkt „abgesagt — deine Entscheidung“. `check:adapter` prüft Ankündigung, Absage und dass die Einheit dann nicht stattfindet.
- **Abgesagte Trainings wurden weiter angekündigt.** `activity()` übersprang erledigte Einheiten nicht. Betraf auch den Reality-Modus, der geplante Trainings streicht.
- **Veraltete Texte.** Das Reality-Blatt nannte Dawn-Phänomen, Schlaf und Stress als weiterlaufend, die es in V1 nicht gibt. Der als veraltet markierte Prototyp-Kommentarblock am Ende der Vorlage ist entfernt, er bleibt in der Git-Geschichte.

**Begrüßung:**
- Keine Skalierung mehr, kürzerer Weg (12/8 px statt 26/18 px), die Bewegung endet bei 70 % der Dauer. Skalierter Text war bis zum Ende unscharf, der lange Auslauf ließ Text in Bruchteilen eines Pixels zittern.
- Der Inhalt einer neuen Ebene bleibt beim Hereinziehen verborgen und startet sofort beim Loslassen. Vorher stand er beim Hereinschieben fertig da, verschwand nach 260 ms und blendete neu ein.
- Diagramme decken sich über Web Animations auf statt über eine eigene Bildschleife.

## 19. Nachtrag 09.11.2026 — Lange Nachwirkung der Bewegung kalibriert

**Befund:** Die Karte „Nachwirkung“ verschwand rund 30 min nach dem Training. Das lag nicht an der Anzeige, sondern am Modell: `EElong` klingt mit `1/p7 = 10 min` ab (py-mgipsim, für alle Subjekte gleich). Nach 60 min bei 55 % der Herzfrequenzreserve um 16 Uhr lag die Nacht (22–6 Uhr) im Median nur 1 mg/dL tiefer als ohne Training. Gemessen sind es 23 mg/dL: DirecNet 2005, Nachtmittel 131 statt 154 mg/dL nach Nachmittagstraining ([DOI](https://doi.org/10.1016/j.jpeds.2005.04.065)).

**Entscheidung:** `p7` bleibt Quelle. Eine längere Abklingzeit in `EElong` hätte auch den Abfall *während* der Bewegung verändert, und der ist über `p3`–`p5` an Daten gefittet. Stattdessen kommt der lange Teil als Eingang dazu, nach dem Muster der Fettresistenz: `engine/src/afterEffect.ts` rechnet aus der Herzfrequenzspur eine abklingende Belastungssumme `L` und hebt `siFactor` um `1 + 0,0045 · L`. Kein neuer Zustand, ohne Herzfrequenz exakt die Quelle, der Orakelabgleich bleibt unberührt.

- **Abklingzeit 600 min:** Dalla Man, Breton, Cobelli 2009, Tabelle 1 (`T_ex`) ([DOI](https://doi.org/10.1177/193229680900300107)); Breton 2008 legt seine Werte so, dass der Unterschied nach 20 h noch signifikant ist ([DOI](https://doi.org/10.1177/193229680800200127)).
- **Stärke 0,0045 je Belastungsminute,** kalibriert an DirecNet: Nebel −22 mg/dL im Median. Gegenprobe Taplin 2010 ([DOI](https://doi.org/10.1016/j.jpeds.2010.06.004)): 20 % weniger Basal über 6 h hebt die Nacht um +20 mg/dL und gleicht die Nachwirkung damit zu gut 80 % aus (Quelle allein: +29 gegen −1). Gerechnet mit den 10 Subjekten, die am Nachmittag nicht unter 70 fallen. Die anderen hätten gegessen; unbehandelt bestimmt ihr Tief die Nacht.
- **Grenzen:** Beide Studien messen Kinder und Jugendliche, die Subjekte sind Erwachsene. Die Nachwirkung wächst linear mit Dauer × Intensität, ohne Sättigung. Status N, Richtung und Größenordnung, keine Dosis.
- **Folgen:** 60 min moderat heben die Insulinwirkung um 14 %. Nach 45 min Dauerlauf zeigt die Karte rund 12 h „Nachwirkung“ mit der aktuellen Stärke in Prozent, davon gut 5 h „Reserven · nachtanken“, solange die Reserven unter 62 % liegen (vorher an `EElong` gekoppelt, also nur Minuten). Nächte nach dem Training fallen jetzt öfter tief, wie in den Studien. Die Vorhersage rechnet die Nachwirkung mit; ihre Fettzerlegung nutzt nur den Fettanteil.
- **Profiltabelle** (Registry Abschnitt 4) neu gerechnet: „Sport moderat“ bis zu 8 mg/dL tiefer, „Hart“ bis zu 6 mg/dL weniger Anstieg.
- **Gesehen, nicht geändert:** Fünf der 20 Subjekte fallen bei 60 min moderat ohne Kohlenhydrate auf den numerischen Boden (18 mg/dL), zehn unter 70. Das kommt aus der Quelle (`p3`–`p5`), nicht aus der Nachwirkung, und gehört zur offenen Frage, ob die starken Responder realistisch sind.

**Abgesichert:** `tests/afterEffect.test.ts`: Neutralität, exakte Integration gegen ein numerisches Integral, Reihenfolge, Halbwertszeit, Kalibrierung gegen DirecNet und Taplin. `check:adapter`: „Nachwirkung hält Stunden … und klingt ab“, Nachrechnen weiter bitgleich.

## 20. Nachtrag 10.11.2026 — Wischgeste auf dem iPhone

**Befund:** Auf dem iPhone reagierte das Wischen oft nicht oder ruckelig. Drei Ursachen in `app/template.html`:
- **Zug endete nach dem ersten Bild.** Auf Touchgeräten hängt der Finger zuerst implizit am berührten Element (W3C Pointer Events, „implicit pointer capture“). Beim Umhängen auf den Pager meldet das Element `lostpointercapture`, das Ereignis blubbert zum Pager hoch und beendete den Zug. Nur ein schneller erster Ruck schaltete noch um. Jetzt zählt nur der Verlust am Pager selbst.
- **Gummiband ab Seite 1.** Aus der Zeit mit zwei Ebenen: Die Auswertung folgte dem Finger nur mit 32 % Tempo. Jetzt federt nur der echte Rand.
- **Unruhige Geschwindigkeit.** Statt aus zwei einzelnen Bewegungen kommt der Schwung wie bei Embla Carousel aus einem gleitenden Fenster von etwa 170 ms, mit den Zeitstempeln der Ereignisse. Länger als 170 ms verharren heißt kein Wisch, ein Wisch gegen die Zugrichtung führt zurück. Gezeichnet wird höchstens einmal pro Bild.

**Geprüft** im Vorschaubrowser mit nachgestellter Touch-Bindung und gesteuerten Zügen. Auf einem echten iPhone noch nicht. Nicht übernommen: Swipers Sperre der Randgeste per `preventDefault` auf `touchstart`, weil unklar ist, ob sie Safaris Zurück-Wischen verhindert, und sie Antippen am Rand schlucken würde.

## 21. Nachtrag 10.11.2026 — Texte zur Entstehung in der App, Quellenangaben korrigiert

**Texte zur Entstehung:**
- `40_Entstehung_ausfuehrlich.md` (mit Formeln und 38 Quellen) und `41_Entstehung_kompakt.md` (ohne Formeln), beide auch englisch als `*.en.md`. Sprachlich überarbeitet: keine Gedankenstriche, keine Figuren nach dem Muster „nicht X, sondern Y“, Spannen als „bis“. Literaturtitel und Seitenangaben bleiben wie im Original.
- **Startseite:** Karte „Wie nebel. entstanden ist“ unter den fünf Regeln. „Kurz erklärt“ klappt die Kurzfassung auf, „Ausführlich, mit allen Quellen“ öffnet `entstehung.html` (englisch `en/making-of.html`). Die ausführliche Fassung hat eine eigene Seite, weil ihre breiten Tabellen und Formeln im Pager nicht seitlich scrollen könnten: Waagerechte Züge gehören dort dem Wischen.
- **Eine Quelle:** Der Bau setzt das Markdown um (`engine/scripts/md.mjs`, nur die Teilmenge dieser Texte), die App enthält keine Kopie. Links zwischen den beiden Texten werden zu Seitenlinks. `tests/md.test.mjs` prüft den Umwandler und dass in keinem der vier Texte Markdown-Reste stehen. Jetzt 149 Tests.
- Zugeklappt ist die Kurzfassung `inert`, damit die Tab-Taste nicht in verborgenen Links landet.

**Quellenangaben korrigiert:**
- Das Simulator-Paper von 2019 hat laut PubMed Rashid als Erstautor, Hobbs ist Mitautor ([DOI](https://doi.org/10.1016/j.compchemeng.2019.106565)). Bisher stand „Hobbs et al.“. Korrigiert im Root-`README.md`, in `README.md` dieses Ordners, Spec §17, an zwei Stellen in diesem Dokument und auf beiden Rechtsseiten.
- Vettoretti 2019 heißt laut PubMed „Development of an error model for a factory-calibrated continuous glucose monitoring sensor with 10-day lifetime“ ([DOI](https://doi.org/10.3390/s19235320)). Korrigiert in der Registry, Abschnitt 5.1.
- **Offen:** Smart 2013. Der PubMed-Abstract nennt für die eiweißreiche Mahlzeit 2,4 gegen 0,5 mmol/L, die Gegenprobe in Doc 11 führt +2,4 als Differenz. Am Original prüfen.

## 22. Nachtrag 11.11.2026 — Web-App auf dem iPhone

- **Icon:** `app/apple-touch-icon.png` (180 px, weißes n auf Schwarz mit rotem Punkt, aus dem Favicon gerechnet). Der Bau kopiert es nach `/` und `/en/`.
- **Hell/Dunkel bleibt:** Schlüssel `nebel.theme` in `localStorage`, gemeinsam für Deutsch und Englisch. Die App, `entstehung.html`, `en/making-of.html` und beide Rechtsseiten lesen ihn vor dem ersten Bild. Ohne gespeicherte Wahl bleibt es hell, auch die Unterseiten folgen nicht mehr dem Systemmodus.
- **Statusleiste:** `theme-color` wechselt mit dem Theme (`#EDF1F1` / `#0E1213`). Ob iOS die Leiste einer gespeicherten Web-App daraufhin umfärbt, ist auf dem Gerät zu prüfen.
- **Kein Blinken mehr an der Zahl:** Der Puls bei jedem neuen Wert (kurz 50 % Deckkraft und Skalierung) und das Skalieren nach Aktionen sind entfernt. iOS rastert skalierten Text neu, das sah wie Flackern aus.
- **Zahl mittig:** Pfeil und Differenz stehen in einer eigenen rechten Spalte, die Zahl in der Mitte der Zeile.
- **Blätter wegwischen:** Alle unteren Blätter (Essen, Insulin, Bewegung, Basal, Realität) schließen per Zug nach unten, wenn ihr Inhalt oben steht. Ab 30 % Höhe oder mit Schwung, sonst gleiten sie zurück. Schieberegler sind ausgenommen.

## 23. Nachtrag 11.11.2026 — Trainingsarten, Bewegung in der Wirkung, Sensor

**Trainingsarten als Belastungsmuster** (`app/adapter.js`, `TRAINING`): Bisher war jede Einheit eine gleichmäßige Herzfrequenz. Intervalltraining lag mit 92 % der Herzfrequenzreserve durchgehend über der ventilatorischen Schwelle. Dort hebt der hochintensive Pfad (`p2`) die Leberabgabe, und der Wert stieg im Mittel über alle 20 Subjekte um 18 mg/dL. Krafttraining senkte stärker als ein Dauerlauf. Beides passt nicht zur Studienlage:
- Laut PubMed sank der Blutzucker bei 30 min Wechsel aus moderatem Radfahren und kurzen Sprints weniger als bei gleich langem moderatem Radfahren, −2,9 gegen −4,4 mmol/L, und blieb danach stabil (Guelfi 2005, [DOI](https://doi.org/10.2337/diacare.28.6.1289)). Grund: Die Leber gibt früher und mehr ab, die Aufnahme fällt nach dem Ende schnell ab (Guelfi 2007, [DOI](https://doi.org/10.1152/ajpendo.00533.2006)).
- Laut PubMed sank er bei 45 min Krafttraining in Sätzen um 1,6 mmol/L, bei 45 min Laufen um 3,4 mmol/L (Yardley 2013, [DOI](https://doi.org/10.2337/dc12-0963)).

Neu hat jede Trainingsart außer dem Dauerlauf ein Muster aus Minuten und Anteil der Herzfrequenzreserve, das sich bis zum Ende wiederholt: Intervalle 1 min 90 % / 2 min 50 %, Kraft 1 min 80 % / 2 min 20 % bei 45–60 min, Basketball 1 min 90 % / 3 min 60 %, Punktspiel 1 min 92 % / 3 min 65 %. Ergebnis im Mittel über 20 Subjekte (Dauerlauf 45 min: −39 mg/dL): Intervalle 33 min −19, Kraft 45 min −22, Basketball 90 min −24, Punktspiel 80 min −22 statt +16. Verhältnis zum Dauerlauf damit 0,5 bis 0,6, in den Studien 0,47 und 0,66. `i` bleibt die gefühlte Belastung für die Anzeige. Nicht abgebildet: die bei Yardley 4,5 bis 6 h nach Kraft tieferen Werte. Selbst gestartete Bewegung bleibt gleichmäßig.

**Bewegung in der Wirkungskarte:** Die Karte „Wirkung“ auf der Analyse-Seite zeigt eine dunkle Linie mit Vorzeichen: zusätzliche Leberabgabe durch Belastung minus Aufnahme der Muskeln (`p4`, `p5`) minus die Nachwirkung auf alles Insulin. Die Nachwirkung zählt damit zur Bewegung, die Insulinlinie rechnet nur noch mit der Fettresistenz. Chip „Bewegung“ und Erklärsatz erscheinen nur, wenn im Fenster Bewegung wirkt.

**Sensor ruhiger:** Kalibriercharakter `a0` Median 0,97 statt 0,95, Streuung 0,04 statt 0,059, Grenzen 0,89–1,05 statt 0,85–1,05, langsame Drift 3,5 statt 4 mg/dL. MARD gegen Blut über 20 Subjekte × 3 Tage 6,3 → 5,0 %, schlechtester Sensor 13,9 → 9,9 % (`scripts/cgm-calibration.cjs`). Begründung: Vettoretti 2019 beschreibt den G6, heutige Sensoren streuen weniger. Registry Abschnitt 5 nachgeführt.

## 24. Nachtrag 11.11.2026 — Reserven am Morgen, kleine Layoutfehler

**Reserven beim Aufwachen:** Der Tag begann um 7 Uhr mit vollen Reserven, obwohl die Leber die Nacht über gearbeitet hat. Neu startet die Reserve bei 55 %, die Karte sagt damit „hungrig aufgewacht“ (Schwelle 70 %). Szenarioschicht, keine Physiologie (docs/08).

**Layout:** Die Bewegungskarte und die Reserven blenden beim Seitenwechsel wieder mit ein (das Neuzeichnen hatte die Klasse `.gi` überschrieben). „Sensorabweichung“ darf umbrechen, damit dreistellige Werte wie „12.4 %“ passen. Der Satz unter der 12-Stunden-Vorhersage hat eine feste Höhe von vier Zeilen, damit wechselnde Werte nichts darunter verschieben. Im Hinweisfenster stehen die Rechtslinks 18 px unter dem Button (`.gate p` hatte den Abstand auf 0 gesetzt).

**Release `v1.2.0`** am 11.11.2026 auf `1ed8cff`: fasst die Nachträge 17 bis 24 zusammen (Nachwirkung der Bewegung, Trainingsarten, Bewegung in der Wirkungskarte, Reserven, Entstehungstexte, iPhone-Web-App, ruhigerer Sensor). Nachtrag 25 ist nicht enthalten.


## 25. Nachtrag 11.11.2026 — Durchsicht: Leistung, Bedienbarkeit, Sicherheit

**Leistung:** `paint()` läuft in jedem Bild. Bisher legte es dabei den Puffer der Verlaufskurve neu an (`canvas.width` setzen), zeichnete sie vollständig, schrieb acht Texte und setzte `--fade` an der Wurzel, was alle Stile der Seite neu rechnen ließ. Neu: Die Kurve wird nur gezeichnet, wenn sie sich um ein Gerätepixel verschoben hätte, ein Punkt noch einblendet oder Fenster, Größe oder Farben sich ändern. Texte werden nur bei Änderung geschrieben (`put`), `--fade` sitzt an `#readout`. Liegt eine Ebene über der Startseite, ruhen Avatare und Pfeile (`.covered`), sonst wurde die unscharfe Seite darunter in jedem Bild neu gerechnet. Die Engine wird minifiziert eingebettet (index.html 244 → 221 KB), zwei Schriften werden vorab geladen.

**Bedienbarkeit:** Geschlossene Blätter waren nur durchsichtig, ihre rund 25 Regler und Knöpfe blieben per Tab erreichbar und wurden vorgelesen. Sie sind jetzt `visibility:hidden`, offen sind sie Dialoge (`role="dialog"`), die Seite dahinter ist `inert`, der Fokus geht ins Blatt und beim Schließen zurück zum Knopf. Pfeiltasten blättern nicht mehr, während ein Regler, ein Blatt, der Hinweis oder die Nacht den Fokus hat. Der Hell/Dunkel-Schalter meldet `aria-checked` (zu `role="switch"` gehört nicht `aria-pressed`). Die Punkte des Seitenindikators haben eine Trefferfläche von mindestens 24 px. Die Diagramme tragen `role="img"` mit Beschriftung, Notfall und Nachtalarm werden angesagt. Ohne JavaScript steht ein Hinweis statt dreier übereinanderliegender Seiten.

**Fehler im Dunkelmodus:** Die zweite Zeile im Knopf „Zum Simulator“ hatte eine feste helle Farbe und stand im Dunkelmodus hell auf hell. Sie folgt jetzt `--rgb-paper`. Der Hinweis im Nachtbild ist lesbar (Kontrast 2,2 → 4,9), die Uhr bleibt gedimmt.

**Sicherheit:** Jede veröffentlichte Seite bekommt beim Bau eine Content-Security-Policy als `<meta>`: Standard `none`, Skripte nur von der eigenen Herkunft und inline nur mit SHA-256-Hash, keine Formulare, kein `<base>`. Anlass: Der Spielstand im `localStorage` wird über `innerHTML` in Protokoll und Auswertung geschrieben, und unter `github.io` teilen sich alle Projektseiten eines Kontos denselben Speicher. Die Rückmeldung (`toast`) schreibt Namen jetzt als Text. Im Workflow hat nur noch der Veröffentlichungsschritt Schreibrechte für Pages. Grenze: `frame-ancestors` lässt sich per `<meta>` nicht setzen, GitHub Pages erlaubt keine eigenen Kopfzeilen.

**Inhalt:** Beschreibung und Open-Graph-Angaben für Suchmaschinen und Vorschauen, `hreflang`-Verweise zwischen Deutsch und Englisch. Testzahl im README auf 149 nachgeführt.


## 26. Nachtrag 12.11.2026 — Rechtscheck der Live-Seite

Erweiterter Rechtscheck der veröffentlichten Seite, Bericht in `31_Rechtscheck_2026-11-12.md`. Ergebnis: nichts Rotes oder Oranges, vier kleine Korrekturen, hier umgesetzt.

**Fußlink:** `entstehung.html` und `en/making-of.html` hatten keinen Link auf Impressum und Datenschutz. Die Hülle `app/text.html` trägt ihn jetzt neben „zur Simulation“ (`legalHref`/`legal` in `TEXT`).

**Datenschutztext DE/EN:** GitHub verarbeitet die Zugriffsdaten nach eigenen Angaben als Verantwortlicher, Speicherdauer liegt bei GitHub. Alle vier Browser-Einträge mit Schlüssel (`state`, `person`, `hinweis`, `theme`; englisch mit `nebel.en.`). Neuer Absatz „Kontakt per E-Mail“ mit der Bitte, keine eigenen Gesundheitswerte zu schicken. Widerspruchsrecht als eigener, fett gesetzter Absatz (Art. 21 Abs. 4 DSGVO). Der Mailanbieter wird nicht genannt, weil die Adresse aus einer Repository-Variable kommt.

**Impressum:** Grundlage § 18 Abs. 1 MStV, vorsorglich § 5 DDG. § 5 DDG gilt nur für geschäftsmäßige, in der Regel entgeltliche Dienste. Auch in Doc 30 und im Entstehungstext 40 (DE/EN) nachgezogen.

**Feste Daten:** „Stand dieser Seite“ war das Baudatum (`{{BUILD_DATE}}`), steht jetzt fest im Text und wird bei Textänderungen von Hand nachgezogen. Der GPL-Änderungsvermerk in `personen-daten.js` nannte ebenfalls das Baudatum, jetzt `DATA_CHANGED = "2026-10-12"` (Tag der eigenen Datendatei, Commit 7ff2922). Dateikopf zusätzlich mit Urhebern und Gewährleistungsausschluss (GPL-3.0 §§ 15–16).

**MDCG 2019-11:** Verweise in Doc 30, 40 und 41 (DE/EN) zeigen auf rev.1 vom Juni 2025 statt auf die Fassung von 2019/2020.

Geprüft: Veröffentlichungsbau ohne Probleme, Typen sauber, Tests 144 grün, 4 übersprungen, 1 rot (Orakel-Referenzwerte fehlen lokal, braucht numpy, unverändert). Rechtsseiten, Fußlinks und MDCG-Links im Vorschaubrowser kontrolliert.

## 27. Nachtrag 12.11.2026 — iPhone-App und echter Puls

Der Echtzeit-Modus (Doc 06) braucht ein Gerät, das im Alltag mitläuft, und Alarme in der Nacht. Safari auf dem iPhone kann weder im Hintergrund rechnen noch zu einer berechneten Uhrzeit benachrichtigen noch Bluetooth. Darum entsteht eine eigenständige iPhone-App. Plan in `50_App_Plan.md`.

**Getrennt, aber im selben Repo:** Die App liegt in `mobile/`, baut über einen eigenen Workflow und teilt mit der Website nur die Engine (`engine/src`) und die Logik in `app/adapter.js` und `app/personas.js`. Die Website bleibt unverändert; `pages.yml` baut bei Änderungen nur in `mobile/` nicht neu. Ein eigenes Repo hätte die Engine kopiert, und Kalibrierung und Tests wären auseinandergelaufen.

**Ausnahme von „keine echten Werte“:** Puls ist ab jetzt als echte Eingabe erlaubt, nur in der App. Er steuert ausschließlich die Bewegung der simulierten Person über das vorhandene Ereignis `heartRate` (Doc 10, Nachwirkung in Nachtrag 19). Er wird nicht als Messwert der Nutzerin oder des Nutzers ausgewertet und verlässt das Gerät nicht. Glukose-, Insulin- und Bolus-Eingaben bleiben ausgeschlossen. Die Einordnung als Lernsystem ohne medizinische Zweckbestimmung (Doc 30) ändert sich dadurch nicht, weil aus dem Puls keine Aussage über die Person abgeleitet wird. Der Datenschutztext der App muss die Pulsdaten nennen, bevor die App an andere geht.

## 28. Nachtrag 13.11.2026 — Reddit-Feedback: Einheit, Unterzucker im Alltag, Alter

Anlass: erste Rückmeldungen in r/diabetes_t1 (24 Upvotes, rund 2.800 Aufrufe in der ersten Stunde). Fünf von neun Kommentaren wünschten mmol/L.

**Einstellungen:** Neuer Knopf oben neben dem Hell/Dunkel-Schalter öffnet ein Blatt mit Einheit, Darstellung und Sprache. Die Sprache wechselt wie der bisherige Link auf die andere Fassung, jede Sprache behält ihren eigenen Spielstand. Der EN/DE-Link oben entfällt dafür, im Hinweisfenster beim ersten Start bleibt die Sprachwahl. Der Knopf öffnet und schließt das Blatt, „Fertig“ bestätigt mit demselben Haken wie „Verstanden“ im Hinweisfenster. Alle Umschalter federn leicht über.

**mmol/L:** Gespeichert unter `nebel.unit` (für beide Sprachen). Ohne Wahl gilt mmol/L, wenn die Browsersprache `en-GB`, `-AU`, `-NZ`, `-CA`, `-IE` oder `-ZA` ist. Umgerechnet wird nur beim Anzeigen (Faktor 18,0182 wie `engine/src/units.ts`): Hauptwert, Differenz, Achsen, Nachtalarm, Protokoll, Auswertung, Vorhersagetext, Wirkungskarte, Personenkarte. Grenzen bleiben intern 70/180/250 mg/dL und erscheinen als 3,9/10,0/13,9. Die CSV-Ausgabe bleibt in mg/dL.

**Unterzucker im Alltag** (nur im ganzen Alltag, siehe unten)**:** Ist man wach und zeigt der Sensor unter 70, hält die Zeit an. Ein Fenster nennt die Lage nach Uhrzeit (volle Bahn, Meeting, Supermarktkasse, Präsentation, Bus, Kino, Nacht; im Training „mitten im Training“) und bietet nur „15 g Traubenzucker essen“. Danach 15 simulierte Minuten „Sitzen bleiben“: Bewegung und Schlafen sind gesperrt. Liegt der Sensor dann noch unter 70, kommt das Fenster wieder (15-15-Regel). Die Wirkung des Zuckers rechnet die Engine wie jede Mahlzeit; der Sensor zeigt den Anstieg erst verzögert. Im Reality-Modus läuft die Zeit weiter.

**Alter:** Die Altersangaben folgen 220 − Maximalpuls. Bei den vier niedrigsten Maximalpulsen ist die Streuung der Faustformel (rund 10 /min) nach oben genutzt: Mira 38, Aylin 41, Tobias 43, Jana 34. Älter geht ehrlich nicht, alle 20 Datensätze haben 187 bis 204 /min.

**Gerät oder ganzer Alltag:** Neue Einstellung „Simulation“. Standard ist „Gerät“: nur Blutzucker, Sensor und die eigenen Entscheidungen, damit der erste Eindruck ruhig bleibt. „Ganzer Alltag“ (`nebel.mode = alltag`) schaltet die Unterzucker-Situationen und die Sprüche von außen zu. Wer zurückschaltet, verliert eine laufende Sitzsperre.

**Sprüche von außen:** Sätze, die Menschen mit Typ 1 tatsächlich hören, gesammelt aus Erfahrungsberichten (Forum diabetes.co.uk, Thread „Type 1s: What stupid things have people said to you?“, Seiten 1–3; asweetlife.org „10 More Things Not to Say“) und sinngemäß übertragen. 22 Sätze in fünf Gruppen: beim Essen, beim Spritzen, wenn der Wert hoch ist (über 250), nach einem Unterzucker und einfach so tagsüber. Erscheinen als ruhige Karte oben mit Sprecher („Kollegin“, „Hausarzt“), sieben Sekunden lang, ohne Kommentar. Höchstens einer in 90 simulierten Minuten, jeder Satz nur einmal je Sitzung. „Zimt“ ist bewusst nicht dabei: In den gelesenen Berichten taucht er nicht auf.

**Zurückgestellt:** MDI (eigenes Langzeitinsulin nötig), Menstruationszyklus (ein Tag ist zu kurz, Studienlage dünn).

## 29. Nachtrag 13.11.2026 — Körpergefühl und Achterbahn

Anlass: zwei weitere Reddit-Kommentare. Der Körper merkt einen Unterzucker oft vor dem Sensor, und echter Diabetes fährt Achterbahn: Mal wirkt kein Bolus, dann fällt der Wert plötzlich.

**Körpergefühl** (nur ganzer Alltag): Symptom-Hinweise in der Zustandsleiste folgen dem Blut, nicht dem Sensor. Das Unterzucker-Fenster kommt auch bei Blut unter 62, wenn der Sensor noch normal zeigt, und sagt dann: „Dein Sensor zeigt noch nichts, aber dein Körper weiß es besser.“ Wer Unterzucker kaum spürt, ist nicht abgebildet.

**Achterbahn** (nur ganzer Alltag): Die Insulinempfindlichkeit wandert über den Tag (glatter Zufallsverlauf, Stützstellen alle 4 h, sd 0,25 log-normal, rein aus Zeit und Seed, damit Lauf und Vorhersage übereinstimmen). In der Wirkungskarte zählt die Drift zum Insulin, nicht zur Bewegung. Dazu mit 10 % je Tag ein geknickter Katheter zwischen 8 und 20 Uhr: Nur ein Zehntel des Insulins kommt an. Gewechselt wird, sobald der Sensor 2 h am Stück über 250 liegt (Kriterium aus Kanapka 2022), sonst nach 12 h; erst dann steht es im Protokoll. Messung über 20 Subjekte × 3 Seeds mit fehlerfreien Boli: Zeit im Ziel 93 % ohne, 65 % mit Achterbahn. Werte und Quellen in der Registry, Abschnitt 10. Adapter-Check: fünf neue Prüfungen (Drift aus ohne Alltag, Rahmen und Streuung, Knick treibt hoch, Wechsel).

**Grenze:** Wird der Modus mitten im Tag gewechselt, rechnet die Vorhersage die letzten Stunden mit dem neuen Modus nach.

**Unterzucker-Fenster:** höchstens dreimal je Unterzucker (die 15-15-Regel kann sonst wegen des nachhinkenden Sensors lange nerven). Der Zähler beginnt neu, sobald Sensor und Blut wieder über der Grenze liegen. Der Hinweis zur Einstellung „Ganzer Alltag“ nennt jetzt auch Katheterknick und wechselnde Insulinwirkung.

**Ideen für später** (Reddit, 13.11.2026), bewusst nicht umgesetzt:
- **Person mit hohem Insulinbedarf.** Heute liegen die Faktoren der zehn Personen bei 14–24,5 g je IE. Ein Kommentar wünscht etwa 1:5, damit klar wird, dass 10 IE bei der einen Person einen Unterzucker machen und bei der anderen eine halbe Mahlzeit abdecken. Die Personen stammen aus der festen Testgruppe des Modells; eine neue bräuchte eigene Kalibrierung und Prüfung.
- **Kohlenhydrate schätzen.** Mahlzeit als Bild, geschätzte statt exakte Gramm, Schätzfehler wirken auf den Bolus. Eigenes Vorhaben mit Bildmaterial und Lizenzfrage.
- **Weiter zurückgestellt:** MDI, Menstruationszyklus (siehe Nachtrag 28), Unterzucker-Wahrnehmungsstörung.

## 30. Nachtrag 13.11.2026 — Langsam, gereizt, Tagesplan und Einladungen

Anlass: zweite Runde Reddit-Kommentare. Unterzucker macht dumm und langsam, hohe Werte machen gereizt; die Ereignisse im Tag wirken zufällig; im echten Leben weiß man selten, was im Essen steckt.

Alles nur im Modus „Ganzer Alltag“:
- **Langsam:** Bei Blut unter 70 hängen die Knöpfe Essen, Insulin, Bewegung und Schlafen 0,7 s, unter 55 1,5 s (blass und leicht unscharf), dann reagieren sie. NEBEL-ANNAHME, nur Darstellung.
- **Gereizt:** Kommt bei Blut über 250 ein Spruch, antwortet man nach kurzer Zeit schroff („Nicht jetzt.“). Vier eigene Sätze, als Reaktion der gespielten Person, nicht als Zitat.
- **Tagesplan:** Zwischen 7 und 11 Uhr einmal am Tag eine Karte „Heute“ mit den geplanten Bewegungen, auf halbe Stunden gerundet. Treppenhaus und Bus verpasst sind als spontan markiert (`s:1` in ALLTAG) und stehen nicht drauf.
- **Einladungen:** An 60 % der Tage eine von vier (Pizza mittags, Kuchen im Büro, Sushi abends, Popcorn im Kino). Die Zeit hält an wie beim Unterzucker-Fenster. „Mitessen“ trägt das Essen unter seinem Namen ein, mit üblicher Menge und der Streuung des Mahlzeitentyps; Bolus schätzt man selbst. Das Protokoll zeigt nur den Namen, der Rückblick die tatsächlichen Gramm. Höchstens eine am Tag, verpasst nach 90 min (z. B. im Schlaf).

**Ideen für später** (zusätzlich zu Nachtrag 29):
- Fertige Gerichte statt Nährwerte, mit verborgenem Verlauf (Reddit).
- Ketoazidose und Krankheitstage: kein belegtes Modell, nah an Therapieentscheidungen.
- Schwangerschaft: passt nicht in einen Tag.
- Aus den 42 Faktoren von diaTribe (Adam Brown, geprüft 2018) fehlen machbar: Koffein, zu wenig Trinken, Tageszeit beim Sport. Bewusst nicht (unbelegte Multiplikatoren, siehe adapter.js): Stress, Schlafmangel, Krankheit, Alkohol, Unterzucker nach Unterzucker. Nicht in einem Tag: Steroide, Niacin, Zöliakie, Pubertät, Höhe, Temperatur, Sonnenbrand, abgelaufenes Insulin, Narbengewebe, Denkfehler.


**Release `v1.3.0`** am 13.11.2026 auf `70b7b4d`: fasst die Nachträge 25, 26 und 28 bis 30 zusammen (Durchsicht, Rechtscheck, Einstellungen mit mmol/L, Modus „Ganzer Alltag“ mit Unterzucker-Fenster, Körpergefühl, Achterbahn, langsamen Knöpfen, Tagesplan und Einladungen), dazu Sitemap und kanonische Adressen, Hell/Dunkel nur auf der Startseite und Hinweise über dem Verlauf. Nachtrag 27 (iPhone-App) ist nicht enthalten, die App ist noch nicht veröffentlicht.
