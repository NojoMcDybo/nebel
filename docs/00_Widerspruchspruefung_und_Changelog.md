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

**Offen:**
- Impressumsangaben eintragen.
- Repository öffentlich schalten und Pages aktivieren.
- Mail an die Autorinnen und Autoren von py-mgipsim senden.
- Die Texte vor breiter Verbreitung einmal juristisch ansehen lassen.
