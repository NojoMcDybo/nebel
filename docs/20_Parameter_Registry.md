# Nebel — Parameter Registry V1 (ExtHovorka)

Stand: 2026-09-22
Quelle aller Werte: ExtHovorka / py-mgipsim, 20 virtuelle Patienten (`Patient_1..20.json`)
Ranges sind **beobachtete Werte über diese 20 Subjekte**, keine publizierten Populationsverteilungen. Das ist ein Unterschied und wird nicht verwischt.

Kalibrierstatus-Legende:
- **Q** = Quellwert, unverändert übernommen
- **QF** = Quellwert, populationsfest (in allen 20 Subjekten identisch)
- **N** = Nebel-Annahme, von uns gesetzt
- **X** = im Quellmodell vorhanden, aber unbenutzt — nicht portieren

---

## 1. Subjektspezifische Parameter (16)

| Parameter | Einheit | Bedeutung | min | median | max | Status |
|---|---|---|---|---|---|---|
| `kb1` | 1/min² pro mU/L | Verstärkung Insulinwirkung Transport | 2.577e-5 | 7.286e-5 | 1.163e-4 | Q |
| `kb2` | 1/min² pro mU/L | Verstärkung Insulinwirkung Utilisation | 5.048e-6 | 6.452e-6 | 1.018e-5 | Q |
| `kb3` | 1/min pro mU/L | Verstärkung Insulinwirkung EGP-Suppression | 1.898e-4 | 8.254e-4 | 1.710e-3 | Q |
| `EGP0` | mmol/min | Endogene Glukoseproduktion bei null Insulinwirkung | 0.563 | 1.547 | 2.875 | Q |
| `F01` | mmol/min/kg | Nicht-insulinabhängige Glukoseaufnahme pro kg | 2.444e-3 | 8.425e-3 | 2.037e-2 | Q |
| `tmaxI` | min | Zeitkonstante der subkutanen Insulinabsorption | 57.9 | 109.0 | 130.7 | Q |
| `p3` | mmol/min | Bewegungsgetriebener Glukosefluss ins periphere Kompartiment | 1.886 | 9.699 | 25.72 | Q |
| `p4` | mmol/min | Bewegungsgetriebener peripherer Verbrauch | 1.598 | 2.851 | 4.844 | Q |
| `p5` | mmol | Verlängerter Nacheffekt der Belastung (über `x2`) | 0.944 | 3.212 | 5.169 | Q |
| `BW` | kg | Körpergewicht | 61.5 | 73.3 | 88.2 | Q |
| `HRrest` | bpm | Ruheherzfrequenz | 54.8 | 66.0 | 77.7 | Q |
| `HRmax` | bpm | Maximale Herzfrequenz | 187.2 | 194.6 | 203.6 | Q |
| `VG` | L | Verteilungsvolumen Glukose | 9.84 | 11.72 | 14.10 | Q |
| `VI` | L | Verteilungsvolumen Insulin | 7.38 | 8.79 | 10.58 | Q |
| `VT_HRR` | – | Ventilatorische Schwelle als Anteil der HF-Reserve | 0.640 | 0.786 | 0.866 | Q |
| `beta` | – | **Unbenutzt** — Rest des alten Exercise-Modells | 2.636 | 5.067 | 6.898 | X |

Bemerkenswert für Nebel: Die individuelle Bewegungsantwort variiert fast ausschließlich über `p3`, `p4`, `p5`, `HRrest`, `HRmax` und `VT_HRR`. `p3` spannt den Faktor 13 zwischen dem schwächsten und dem stärksten Responder — das ist die quantitative Grundlage für die im Risk Review geforderte „heterogene Reaktion auf Belastung".

## 2. Populationsfeste Parameter (19)

| Parameter | Einheit | Bedeutung | Wert | Status |
|---|---|---|---|---|
| `ke` | 1/min | Insulin-Eliminationsrate | 0.138 | QF |
| `k12` | 1/min | Transferrate peripher → zentral | 0.066 | QF |
| `ka1` | 1/min | Abklingrate Insulinwirkung Transport | 0.006 | QF |
| `ka2` | 1/min | Abklingrate Insulinwirkung Utilisation | 0.06 | QF |
| `ka3` | 1/min | Abklingrate Insulinwirkung EGP | 0.03 | QF |
| `AG` | – | Bioverfügbare Kohlenhydratfraktion | 0.8 | QF |
| `tmaxG` | min | Zeitkonstante langsame KH-Absorption | 40 | QF |
| `tmaxGFast` | min | Zeitkonstante schnelle KH-Absorption | 20 | QF |
| `tsub` | min | Verzögerung Plasma → Interstitium | 15 → **5** | QF / N ⚠ |
| `aSI` | – | Formparameter nichtlineare Insulinsensitivität | −1.9 | QF |
| `b` | mmol/L | Skalenparameter des `tanh`-Mappings | 0.28 | QF |
| `c` | – | Offset des `tanh`-Mappings | 7 | QF |
| `dSI` | – | Verschiebung des `tanh`-Mappings | −12 | QF |
| `p1` | – | EGP-Erhöhung durch moderate Belastung | 2.73 | QF |
| `p2` | – | EGP-Erhöhung durch hochintensive Belastung | 8.23 | QF |
| `p6` | 1/min | Zeitkonstante schnelle Bewegungsantwort | 0.18 | QF |
| `p7` | 1/min | Abklingrate des Nacheffekts | 0.1 | QF |
| `p8` | 1/min | Zeitkonstante hochintensiver Pfad | 0.1 | QF |
| `a` | – | **Unbenutzt** — Rest des alten Exercise-Modells | 0.16–0.86 | X |

⚠ **Der einzige Parameter mit zwei Werten — bewusst, und getrennt geführt.**

| | Wert | Verwendung |
|---|---|---|
| Quellwert (ExtHovorka) | 15 min | Engine und Orakelabgleich. Unverändert, sonst wäre Validierungsstufe 0 wertlos |
| Nebel-Kalibrierung | 5 min | Nur in der Anwendung (`app/adapter.js`), für die angezeigte Sensorverzögerung |

Begründung: ISPAD gibt die physiologische Verzögerung mit 5 bis 10 min an, der Quellwert von 15 min liegt darüber. Die Kalibrierung ist damit **besser belegt** als der Quellwert, nicht schlechter.

Zulässig ist der Eingriff, weil `tsub` ausschließlich in die Beobachtungsschicht fällt: `IG` wird von keinem anderen Zustand gelesen, `dIG/dt = (G − IG)/tsub` ist eine Einbahnstraße. Die Physiologie bleibt unberührt, und Abschnitt 8 der Spec führt die Beobachtungsschicht ohnehin als Nebel-Eigenleistung.

Kein Freibrief: Für jeden Parameter **innerhalb** der Physiologie gilt weiterhin, dass der Quellwert unverändert bleibt.

## 3. Modellkonstanten (nicht parametrisiert)

| Konstante | Wert | Bedeutung |
|---|---|---|
| F01-Schwelle | 4.5 mmol/L | Unterhalb: lineare Reduktion der ZNS-Aufnahme |
| Renale Schwelle | 9 mmol/L | Oberhalb: zusätzliche Elimination |
| Renale Steigung | 0.003 | Faktor in `FR` |
| Hyper-SI-Steigung | 0.018 | Faktor in `SIhyper` |
| SI-Normierungspunkt | 5 mmol/L | Bezugspunkt des `tanh`-Mappings |
| Hyper-SI-Bezugspunkt | 5.55 mmol/L | Nullpunkt von `SIhyper` |
| `Q1`-Klammerung | [VG, 32·VG] | Numerischer Schutz, **keine** Physiologie |

## 4. Demografie der 20 Subjekte

| Größe | min | median | max |
|---|---|---|---|
| Körpergewicht (kg) | 61.5 | 73.3 | 88.2 |
| Körpergröße (cm) | 165.5 | 170.4 | 179.8 |
| Basalrate (U/h) | 0.389 | 1.113 | 1.999 |
| Tagesbasal (U) | 6.53 | 16.01 | 35.18 |
| KE-Faktor (g KH pro U) | 14.0 | 18.1 | 24.5 |
| Korrekturfaktor | 27.8 | 48.0 | 74.3 |
| Ruhepuls (bpm) | 54.8 | 66.0 | 77.7 |
| HbA1c (%) | 5.65 | 6.45 | 7.61 |
| Taillenumfang (cm) | 76.2 | 84.6 | 105.5 |

Direkt nutzbar für die Pumpenschicht: Basalrate, KE-Faktor und Korrekturfaktor sind je Subjekt gegeben. Nebel muss keine Therapieparameter erfinden.

Einschränkung: Alle 20 Subjekte sind Erwachsene mit HbA1c zwischen 5.7 und 7.6 %. Kinder, Jugendliche und schlecht eingestellte Verläufe sind **nicht** abgedeckt. Das gehört in den Model Validity Envelope und in die Kommunikation gegenüber Nutzern.

Das trifft die Hauptzielgruppe direkt: Eltern von Kindern mit Typ-1-Diabetes sind die größte und am stärksten belastete Angehörigengruppe — und genau deren Situation bildet die Kohorte nicht ab. Kinderphysiologie (höherer Insulinbedarf pro kg, andere Absorptionszeiten, stärkere Variabilität) ist nicht durch Skalierung der Erwachsenenparameter zu erschlagen. V1 simuliert eine erwachsene Person; das muss im UI stehen, nicht im Kleingedruckten.

## 5. Offene Registry-Einträge (Nebel-Eigenleistung, noch zu belegen)

| Parameter | Bereich | Status | Zu klären |
|---|---|---|---|
| Sensorrauschen (Amplitude) | Beobachtung | N | Größenordnung aus CGM-Literatur belegen, nicht schätzen |
| Filterzeitkonstante | Beobachtung | N | Bewusst als Designentscheidung kennzeichnen |
| Abtastrate | Beobachtung | N | 5 min, Gerätekonvention |
| KH-Split schnell/langsam | Mahlzeit | N | Zuordnungsregel realer Mahlzeiten auf `uFastCarbs`/`uSlowCarbs` — braucht eine begründete Heuristik, keine Bauchzahl |
| Bolusdauer | Pumpe | N | Modellierung als Impuls über 1 min |
| `drainPerMin` | Reserven | N | Grundverbrauch, vorläufig 1/600 pro min (voll → leer in ~10 h) |
| `exerciseDrainPerMin` | Reserven | N | Zusatzverbrauch bei voller Belastung, vorläufig 3/600 |
| `afterEffectDrainPerMin` | Reserven | N | Zusatzverbrauch aus dem Nacheffekt, vorläufig 1/600 |
| `refillPerMmolCarb` | Reserven | N | Auffüllung pro mmol KH, vorläufig 1/280 |
| Anzeigeschwellen Reserven | Reserven | N | 0.30 / 0.70 / 0.62 / 0.60 sowie Heißhunger bei 0.28 — aus dem Prototyp übernommen |

Die Reserven-Parameter gehören zur Erlebnisschicht und dürfen nie als physiologische Werte ausgegeben werden. Sie sind bewusst grob und werden nach den ersten Testsitzungen nach Gefühl kalibriert — das ist bei einem Bedürfnismodell zulässig, bei einem physiologischen Parameter nicht.

Regel aus der V1-Spec, weiterhin bindend: Ein Parameter darf nicht gleichzeitig als Literaturwert und als empirisch optimierter Wert ausgegeben werden.
