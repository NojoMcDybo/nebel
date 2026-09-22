# Nebel — Rechtliche Einordnung

Stand: 2026-09-22

**Vorbemerkung:** Das hier ist eine Risikoeinschätzung, keine Rechtsberatung. Vor einer echten Veröffentlichung mit Reichweite — insbesondere, falls Nebel je Teil einer Abschlussarbeit oder einer kommerziellen Tätigkeit wird — gehört das einmal vor jemanden mit Zulassung. Die Uni Münster hat eine Rechtsabteilung, und die Verbraucherzentrale NRW berät zu Medizinprodukte- und Haftungsfragen.

---

## 1. Die entscheidende Frage: Medizinprodukt oder nicht

Das ist der einzige Punkt, an dem aus einem Studienprojekt ein regulatorisches Problem werden kann. Alles andere ist beherrschbar.

Nach Art. 2 Nr. 1 der Verordnung (EU) 2017/745 (MDR) ist Software ein Medizinprodukt, wenn sie vom Hersteller für einen der dort aufgezählten **medizinischen Zwecke** bestimmt ist: Diagnose, Verhütung, Überwachung, Vorhersage, Prognose, Behandlung oder Linderung von Krankheiten. Bildung, Simulation und Perspektivwechsel stehen nicht auf dieser Liste.

Der springende Punkt ist die **Zweckbestimmung**, nicht die Technik. Die MDCG-Leitlinie 2019-11 sagt das unmissverständlich: Ein und dieselbe Software ist Medizinprodukt oder nicht, je nachdem, wofür der Hersteller sie erklärt — maßgeblich sind Kennzeichnung, Anleitung und Bewerbung. Alle nachgelagerten Pflichten hängen an dieser einen Aussage.

Nebel ist damit **kein Medizinprodukt**, solange die Zweckbestimmung trägt. Sie trägt aber nur, wenn das Produkt sie nicht widerlegt.

### Was die Zweckbestimmung kippen würde

| Funktion | Wirkung |
|---|---|
| Eingabe eigener realer Glukose- oder Insulinwerte | Überwachung → Medizinprodukt |
| Berechnung eines Bolus für den Nutzer oder dessen Angehörigen | Behandlung → Medizinprodukt, vermutlich Klasse IIb nach Regel 11 |
| Vorhersage des eigenen Verlaufs aus echten Daten | Vorhersage → Medizinprodukt |
| Nachbildung einer konkreten realen Person | Individualbezug, Zweckbestimmung nicht mehr haltbar |
| Werbung mit „hilft, den Diabetes besser einzustellen" | Zweckbestimmung durch Bewerbung gekippt |

Was unbedenklich bleibt: eine fiktive Beispielperson, erfundene Ereignisse, Erklärungen zur Physiologie, Rückblick auf den simulierten Verlauf, Was-wäre-wenn innerhalb der Simulation.

**Diese Grenze ist im Projekt bereits als Produktregel verankert** (Spec V2, Abschnitt 13 und `08_Beduerfnisse_und_Hunger.md`): keine Dosierungsempfehlungen, keine Simulation einer realen Person. Das war ursprünglich eine pädagogische Entscheidung. Sie ist jetzt auch die rechtliche Grundlage und darf nicht aus Bequemlichkeit aufgeweicht werden.

Quellen: [MDCG 2019-11 (Kommission)](https://health.ec.europa.eu/system/files/2020-09/md_mdcg_2019_11_guidance_en_0.pdf) · [Einordnung von Software unter MDR](https://openregulatory.com/mdcg/mdcg-2019-11)

## 2. Produkthaftung

Die neue EU-Produkthaftungsrichtlinie (EU) 2024/2853 bezieht Software ausdrücklich in die verschuldensunabhängige Produkthaftung ein — ein echter Unterschied zur alten Rechtslage. Die Umsetzung in deutsches Recht läuft, die Neufassung des ProdHaftG greift ab Ende 2026.

**Für Nebel wichtig: Art. 2 Abs. 2 der Richtlinie nimmt freie und quelloffene Software, die außerhalb einer Geschäftstätigkeit entwickelt oder bereitgestellt wird, vom Anwendungsbereich aus.** Im deutschen Entwurf findet sich das in § 2 Abs. 1 Nr. 3 ProdHaftG-E.

Das dreht die naive Intuition um: **Eine offene, unentgeltliche Veröffentlichung unter einer echten Open-Source-Lizenz senkt das Haftungsrisiko, sie erhöht es nicht.** Ein geschlossenes Projekt, das später gegen Geld oder als Teil eines Angebots bereitgestellt wird, fällt dagegen voll unter die Produkthaftung.

Die Privilegierung entfällt, sobald Geschäftstätigkeit ins Spiel kommt:

- Bereitstellung gegen Entgelt, auch in kleiner Form
- Bezahlter Support, Hosting oder Integration
- Bündelung mit Hardware oder kommerziellen Diensten
- Verwertung personenbezogener Daten zu anderen Zwecken als der Verbesserung der Sicherheit

Damit ist eine Bedingung gesetzt, die im Blick bleiben muss: **Nebel darf nicht monetarisiert werden**, solange es die Privilegierung behalten soll. Kein Spendenbutton, der als Gegenleistung wirkt, keine Pro-Version, keine bezahlte Betreuung.

Unberührt bleibt die allgemeine deliktische Haftung nach § 823 BGB. Die entfällt durch keine Lizenz und keinen Haftungsausschluss — wohl aber setzt sie eine Pflichtverletzung voraus, und eine klar kommunizierte Zweckbestimmung mit ehrlich benannten Grenzen ist genau das Gegenteil davon.

Quellen: [Produkthaftung und Open-Source-Software](https://www.ferner-alsdorf.de/produkthaftung-und-open-source-software/) · [Produkthaftungsrecht 2026 — FAQ](https://www.it-recht-kanzlei.de/produkthaftung-2026-faq.html) · [Einführung der Produkthaftung für Software (PwC Legal)](https://legal.pwc.de/de/news/fachbeitraege/einfuehrung-der-produkthaftung-fuer-software)

## 3. Lizenzrecht: das Verhältnis zu py-mgipsim

py-mgipsim steht unter GPL-3.0. Die GPL beschränkt die **Weitergabe** eines Werks und seiner abgeleiteten Werke — nicht dessen Ausführung.

Was Nebel tut:

- Die Gleichungen sind aus den **Veröffentlichungen** umgesetzt. Mathematische Gleichungen und Parameterwerte sind keine urheberrechtlich geschützten Werke.
- Kein Code, keine Modulstruktur und keine Kommentare wurden übernommen.
- `vendor/` ist gitignored. Weder die Bibliothek noch ihre 20 Parameterdatensätze liegen im Repository.
- Das Basalgleichgewicht wurde bewusst **anders** gelöst als in der Referenz: dort ein geschlossener algebraischer Ausdruck, hier numerische Relaxation. Das ist zugleich der technisch bessere Weg und ein belastbarer Beleg für eigenständige Umsetzung.

Wo die Kante liegt, ehrlich benannt:

1. **Kein Clean-Room.** Die Referenzimplementierung wurde beim Schreiben gelesen. Die Variablennamen folgen der publizierten Hovorka-Notation (`S1`, `Q1`, `x1`), sind also aus den Papern begründbar — aber die Behauptung „ohne Kenntnis der Quelle entstanden" wäre falsch und wird deshalb nicht aufgestellt. Risiko: gering, weil nichts Schutzfähiges übernommen wurde, aber nicht null.
2. **`scripts/oracle_reference.py`** lädt die Gleichungsfunktion der Bibliothek zur Laufzeit und führt sie aus. Das Skript selbst enthält keinen fremden Code; die Kombination entsteht erst auf dem Rechner desjenigen, der `npm run oracle:fetch` ausgeführt hat. Weitergegeben wird nur das eigene Skript. Nach dem Wortlaut der GPL („The act of running the Program is not restricted") ist das unproblematisch.
3. **Datenbankrecht.** Die 20 Parametersätze sind eine strukturierte Sammlung und könnten in der EU als Datenbank nach § 87a UrhG geschützt sein — unabhängig vom Urheberrecht an den einzelnen Zahlen. Weiterer Grund, sie nicht ins Repository zu legen. Die aktuelle Lösung ist auch aus dieser Sicht richtig.

Zu tun, wenn das Repository öffentlich wird: Die Herkunft muss im README stehen, inklusive Zitat der Paper und des Verhältnisses zu py-mgipsim. Das ist erledigt. Wissenschaftlich ist es ohnehin Pflicht.

## 4. Datenschutz

Aktuell verarbeitet Nebel keine personenbezogenen Daten. Die Simulation ist fiktiv, die Parameter stammen aus einem publizierten Datensatz synthetischer Subjekte.

Das ändert sich an drei Stellen, sobald die Erlebnisschicht gebaut wird:

| Vorhaben | Folge |
|---|---|
| Speicherung des Spielstands im Browser (`localStorage`) | Keine Verarbeitung durch den Betreiber, solange nichts übertragen wird. Unproblematisch |
| Push-Benachrichtigungen über einen Dienst | Verarbeitung personenbezogener Daten, Datenschutzerklärung nötig, Auftragsverarbeitung prüfen |
| Eingabe eigener realer Werte | Gesundheitsdaten nach Art. 9 DSGVO — besondere Kategorie, hohe Anforderungen. Und zugleich der Punkt, an dem die MDR-Zweckbestimmung kippt |

Die dritte Zeile ist zweimal derselbe Grund, es nicht zu tun. Für den Echtzeit-Modus heißt das konkret: Benachrichtigungen möglichst über die Browser-Notification-API lokal auslösen, nicht über einen Push-Dienst mit Serverkomponente.

Sobald eine öffentlich erreichbare Website existiert, greift außerdem die Impressumspflicht nach § 5 DDG. Bei einer nicht-kommerziellen privaten Seite ist sie eingeschränkt, aber sauberer ist ein Impressum von Anfang an.

## 5. Kleinere Punkte

- **Heilmittelwerbegesetz:** Greift bei Werbung für Verfahren und Behandlungen. Solange Nebel als Bildungsangebot und nicht als Hilfe bei der Therapie beworben wird, ist es nicht betroffen. Dieselbe Formulierungsdisziplin wie bei der Zweckbestimmung.
- **Name „Nebel":** Ein allgemeines deutsches Wort, markenrechtlich schwach und damit für Dritte schwer zu monopolisieren. Vor einer eigenen Marke wäre eine DPMA-Recherche nötig; für ein Studienprojekt kein Thema.
- **Abbildungen aus Papern:** Keine Tabellen oder Grafiken aus den Veröffentlichungen ins Repository kopieren. Text und Gleichungen referenzieren, nicht reproduzieren.

## 6. Empfehlung

**Zunächst privat.** Nicht aus Angst, sondern weil derzeit nichts für öffentlich spricht und ein Argument dagegen:

1. Die Zweckbestimmung ist heute belastbar, muss aber die **UI-Phase** überstehen. Genau dort entstehen die Funktionen, die sie kippen könnten — ein Bolusrechner ist als Bequemlichkeit schnell eingebaut. Ein öffentliches Repository dokumentiert jeden Zwischenstand dauerhaft und nachvollziehbar.
2. Öffentlich ist keine umkehrbare Entscheidung. Forks, Caches und Archive bleiben. Von privat auf öffentlich zu schalten ist dagegen ein Klick.
3. Es geht nichts verloren. GitHub Pages wird erst gebraucht, wenn die Oberfläche an der Engine hängt. Mitarbeitende gibt es keine.

**Bedingungen für den Wechsel auf öffentlich** — alle erfüllbar, die meisten bereits erledigt:

| Bedingung | Status |
|---|---|
| Zweckbestimmung prominent im README | erledigt |
| Echte Open-Source-Lizenz (Apache 2.0) | erledigt — Voraussetzung für die Haftungsprivilegierung |
| Herkunft und Verhältnis zu py-mgipsim dokumentiert | erledigt |
| Keine Parameterdatensätze im Repository | erledigt |
| Keine Dosierungsfunktion in der Oberfläche | offen bis zur UI-Phase |
| Keine Eingabe realer Gesundheitsdaten | offen bis zur UI-Phase |
| Disclaimer auch **in** der Anwendung, nicht nur im README | offen |
| Keine Monetarisierung | Entscheidung, laufend einzuhalten |

Die drei offenen Punkte betreffen ausschließlich die Erlebnisschicht. Sobald sie stehen, spricht nichts gegen eine Veröffentlichung — im Gegenteil: unter einer Open-Source-Lizenz und ohne Geschäftstätigkeit ist die offene Variante haftungsrechtlich die **günstigere**.
