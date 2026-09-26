# Nebel — Widerspruchsprüfung der Dokumentation & Changelog

Stand: 2026-09-22
Geprüfte Dokumente: `Nebel_Scientific_Engine_Foundation (1).docx` (14.09.), `Nebel_Equation_and_Parameter_Specification_V1_v2.docx` (14.09.), `Nebel_Engine_Content_Risk_Review_V1.docx` (14.09.)

Anlass: Die Entscheidung **Engine-Kern = ExtHovorka (Hobbs/Cinar, 16 Zustände, herzfrequenzgetrieben)** fiel am 15.09. — also **nach** allen drei Dokumenten. Die Dokumente beschreiben daher eine andere Engine, als inzwischen beschlossen ist.

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

**Korrektur, erweitert am 23.09.2026:** Zwei Werte, getrennt geführt. Die Engine behält 15 min als Quellwert, damit der Orakelabgleich aussagekräftig bleibt. Die Anwendung kalibriert auf **5 min**, gestützt auf die ISPAD-Angabe von 5–10 min — die Kalibrierung ist also besser belegt als der Quellwert. Zulässig, weil `tsub` ausschließlich in die Beobachtungsschicht fällt: `IG` wird von keinem anderen Zustand gelesen, die Physiologie bleibt unberührt. Die übrige Sensorschicht (Filter, Rauschen, Abtastung) bleibt Nebel-Eigenleistung und ist als Annahme markiert.

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

**Korrektur:** Die Entscheidung in 06/08 betrifft die Mahlzeiten. Die entstehen weiter nur aus dem Bedürfnis, nicht aus einem Drehbuch. Bewegung kommt wieder aus dem Plan, wie im Prototyp: Training wird angekündigt, damit man sich vorbereiten kann, und bei einem Sensorwert unter 80 oder über 280 verschoben, nach drei Versuchen abgesagt. Alltagsbewegung passiert ohne Ankündigung. Das widerspricht dem Satz „nichts passiert hinter seinem Rücken" bewusst: Der Bus wartet auch im echten Leben nicht. **Zur Bestätigung durch den Projektinhaber offen.** Zurücknehmen heißt: `_runPlan` im Adapter entfernen und den Plan nicht mehr anzeigen.

---

## 2. Neue Informationen (22.09.)

### Referenzimplementierung gefunden
**py-mgipsim** — Open-Source-Python-Bibliothek der Cinar-Gruppe (Illinois Tech), enthält das Modell wörtlich als Modul `T1DM.ExtHovorka`.

- Repository: https://github.com/illinoistech-itm/py-mgipsim
- Paper: Siket, Rashid & Cinar (2025), *J Diabetes Sci Technol* — https://pubmed.ncbi.nlm.nih.gov/40110887/
- Ursprungspaper des Simulators: Hobbs et al. (2019), *Computers & Chemical Engineering* — https://pubmed.ncbi.nlm.nih.gov/32863472/

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

