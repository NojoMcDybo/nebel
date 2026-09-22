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

**Korrektur:** `tsub = 15 min` bleibt als Quellwert stehen und wird als solcher gekennzeichnet. Die gesamte Sensorschicht (Filter, Rauschen, Abtastung alle 5 min) ist **Nebel-Eigenleistung** und wird explizit als Nebel-Annahme markiert — nicht als Physiologie.

### W10 — MDI vs. CSII
Alle drei Dokumente sprechen generisch von „subkutanem Insulin" und „Basal + Bolus". Beschlossen ist Pumpentherapie (CSII).

**Korrektur:** `uInsulin` ist in ExtHovorka ein kontinuierlicher Strom in `mU/min` — das bildet Pumpentherapie direkt ab: Basalrate als stückweise konstantes Tagesprofil, Bolus als kurzer Impuls, Temp-Basal als Skalierung, Pumpenstopp als `uInsulin = 0`. V1 = **Open-Loop CSII**, kein AID-Algorithmus.

### W11 — Klinische Schwellen in der falschen Einheit
ADA-Schwellen sind in den Dokumenten in mg/dL geführt (<70, <54), die Engine rechnet mmol/L.

**Korrektur:** Level 1 Hypo `< 3.9 mmol/L`, Level 2 `< 3.0 mmol/L`. Nicht verwechseln mit der Modellschwelle `4.5 mmol/L`, ab der ExtHovorka die ZNS-Glukoseaufnahme `F01` linear herunterregelt — das ist Physiologie, keine klinische Klassifikation.

### W12 — Bestätigt, kein Widerspruch
Die Angabe „16 Zustände, herzfrequenzgetrieben" trifft exakt zu und wurde an der Referenzimplementierung verifiziert.

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
| Model Validity Envelope | offen | **offen** — muss geschrieben werden, erste Bausteine: `G ∈ [1, 32] mmol/L`, HR ∈ `[HRrest, HRmax]`, Schrittweite ≤ 1 min |

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
