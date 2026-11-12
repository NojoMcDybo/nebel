# nebel. Rechtscheck vom 12.11.2026

**Keine Rechtsberatung.** Das ist eine strukturierte Risikoeinschätzung. Vor einer breiten Verbreitung (Verbände, Presse, Uni) gilt weiter die Empfehlung aus `30_Rechtliche_Einordnung.md`: einmal von der Rechtsabteilung der Uni Münster oder der Verbraucherzentrale NRW ansehen lassen.

**Geprüft:** die Live-Seite https://nojomcdybo.github.io/nebel/ am 12.11.2026 (zuletzt gebaut 12.11., 00:41 Uhr). Dazu gehören `index.html`, `rechtliches.html`, `entstehung.html`, die englischen Fassungen, `personen-daten.js`, Lizenzdateien und Antwort-Header. Die uncommitteten Änderungen im Arbeitsordner (CSP, pages.yml-Rechte, Minify) sind **nicht** live und nicht Teil der Prüfung.

**Methode:** Die Skills `legal-risk-assessment` (Schwere × Wahrscheinlichkeit, Ampel) und `compliance-check` (anwendbare Regeln, Anforderungen erfüllt/nicht erfüllt) aus Anthropics Legal-Plugin ([knowledge-work-plugins/legal](https://github.com/anthropics/knowledge-work-plugins/tree/main/legal)). Die Schwere ist auf eine Privatperson umgerechnet: Kosten, Aufwand, Ruf. Unternehmensumsatz spielt keine Rolle.

---

## 1. Ergebnis

**Weiterbetreiben, mit kleinen Nachbesserungen.** Nichts ist rot oder orange. Die tragenden Entscheidungen halten: kein Medizinprodukt, keine Drittanbieter, offene Lizenz ohne Geld. Handlungsbedarf gibt es bei Pflichttexten. Einige Auslöser würden die Lage ändern, sie stehen in Abschnitt 5.

| Ampel | Anzahl | Worum es geht |
|---|---|---|
| Rot (16–25) | 0 | |
| Orange (10–15) | 0 | |
| Gelb (5–9) | 3 | Zweckbestimmung (beherrscht), Privatanschrift im Netz, Anfragen echter Betroffener |
| Grün (1–4) | 11 | Rest, davon 4 mit kleiner Korrektur |

---

## 2. Risikoregister

S = Schwere 1–5, W = Wahrscheinlichkeit 1–5, Wert = S × W.

| ID | Risiko | Bereich | S | W | Wert | Ampel | Stand / Maßnahme |
|---|---|---|---|---|---|---|---|
| R1 | Zweckbestimmung kippt, nebel. wird Medizinprodukt | MDR | 5 | 1 | 5 | gelb | Beherrscht. Produktregel „kein Bolusrechner, keine eigenen Werte, keine reale Person“ halten. Wortwahl bei jeder Bewerbung prüfen |
| R2 | Privatanschrift dauerhaft öffentlich | persönlich | 3 | 2 | 6 | gelb | Deine Entscheidung, Optionen in 3.3 |
| R3 | Echte Betroffene fragen per Mail oder Issue nach Therapie | Haftung | 3 | 2 | 6 | gelb | Standardantwort, Hinweis im Issue-Formular (5.4) |
| R4 | Impressum und Datenschutz fehlen auf den Entstehungsseiten | DDG/MStV, DSGVO | 2 | 2 | 4 | grün | **Korrigieren**, 3.1 |
| R5 | Datenschutzerklärung lückenhaft | DSGVO Art. 13, 21 | 2 | 2 | 4 | grün | **Korrigieren**, 3.2 |
| R6 | Neue Produkthaftung ab 9.12.2026 | ProdHaftG | 4 | 1 | 4 | grün | Ausnahme für nichtkommerzielle freie Software. Bedingung: kein Geld in irgendeiner Form |
| R7 | Haftung für Gesundheitsinformationen | § 823 BGB | 4 | 1 | 4 | grün | Hinweisfenster und Zweckbestimmung tragen |
| R8 | Datenschutzrahmen EU–USA fällt | DSGVO Art. 45 | 2 | 2 | 4 | grün | Beobachten: EuGH C-703/25 P |
| R9 | GitHub-Konto übernommen, Seite manipuliert | Verkehrspflicht | 4 | 1 | 4 | grün | 2FA, Branch-Schutz, CSP (liegt lokal bereit) |
| R10 | Parameterdaten (GPL, Datenbankrecht) | UrhG, GPL | 2 | 1 | 2 | grün | Zustimmung der Autoren liegt vor. Kleine Ergänzung im Dateikopf, 3.5 |
| R11 | Pflicht zur KI-Kennzeichnung von Texten | KI-VO Art. 50 | 2 | 1 | 2 | grün | Ausnahme greift bei menschlicher Redaktion, 5.6 |
| R12 | Datumsangaben sind Baudatum statt Änderungsdatum | GPL §5a, Genauigkeit | 1 | 2 | 2 | grün | **Korrigieren**, 3.4 |
| R13 | Marken und Arzneimittelnamen (Dexcom, NovoRapid) | MarkenG, HWG | 1 | 1 | 1 | grün | Nur beschreibend und als Quelle, nicht geschäftlich |
| R14 | Veralteter MDCG-Link (2019-11 statt Rev.1) | Genauigkeit | 1 | 1 | 1 | grün | Link auf Rev.1 vom Juni 2025 umstellen |

---

## 3. Befunde mit Handlungsbedarf

### 3.1 Kein Link auf Impressum und Datenschutz in den Entstehungsseiten (R4)

`entstehung.html` und `en/making-of.html` verlinken nur „zur Simulation“. Von dort sind es zwei Klicks bis zum Impressum. Die Rechtsprechung lässt zwei Klicks meist noch durchgehen. Bei der Datenschutzerklärung ist das schwächer, denn die Informationen nach Art. 13 DSGVO sollen beim Aufruf jeder Seite greifbar sein. Die Hülle `app/text.html` hat keinen Fuß mit dem Rechtliches-Link, die App-Seiten schon (auch im Hinweisfenster, das ist gut).

**Maßnahme:** In `app/text.html` denselben Fußlink wie in der App setzen, für DE `rechtliches.html` und für EN `legal.html`.

### 3.2 Datenschutzerklärung: fünf Lücken (R5)

Insgesamt ist der Text sauber: keine Cookies, keine Drittanbieter, ehrlich zu GitHub. Es fehlen aber:

1. **Kontakt per E-Mail.** Wer an die Impressumsadresse schreibt, liefert Name, Adresse und Inhalt. Dafür braucht es Zweck, Rechtsgrundlage (Art. 6 Abs. 1 lit. f DSGVO), Speicherdauer (bis die Sache erledigt ist) und den Hinweis, dass der Maildienst (iCloud, Apple) die Nachricht technisch verarbeitet.
2. **Speicherdauer der GitHub-Protokolle** (Art. 13 Abs. 2 lit. a). Mindestens das Kriterium nennen: „Wie lange GitHub die Zugriffsdaten speichert, legt GitHub fest; ich habe darauf keinen Einfluss und keinen Zugriff.“
3. **Rolle von GitHub.** Der Text klingt, als verarbeite GitHub im Auftrag. GitHub schreibt aber in seinem Privacy Statement, dass es für seine Dienste selbst Verantwortlicher ist. Die Pages-Doku sagt, dass jede Besucher-IP aus Sicherheitsgründen protokolliert wird. Ein Auftragsverarbeitungsvertrag ist für kostenlose Konten nach meinem Stand nicht vorgesehen (nicht verifiziert). Ehrlicher und angreifbarer zugleich wäre eine Formulierung wie „GitHub verarbeitet diese Daten nach eigenen Angaben in eigener Verantwortung“. Die Frage, ob eine gemeinsame Verantwortung entsteht, ist ungeklärt. Für eine Privatseite ist sie praktisch folgenlos.
4. **Widerspruchsrecht hervorheben.** Art. 21 Abs. 4 DSGVO verlangt, dass auf das Widerspruchsrecht „in einer verständlichen und von anderen Informationen getrennten Form“ hingewiesen wird. Derzeit steht es in der Aufzählung. Eine eigene Zeile oder ein eigener Absatz genügt.
5. **Browser-Speicher vollständig nennen.** Der Text nennt Spielstand und Personenwahl. Tatsächlich gibt es vier Schlüssel: `nebel.state.v1`, `nebel.person.v1`, `nebel.hinweis.v1` (Bestätigung des Hinweises) und `nebel.theme` (hell/dunkel). Alle vier fallen unter § 25 Abs. 2 Nr. 2 TDDDG, weil die Nutzerin sie durch eigene Wahl auslöst. Die Aufzählung sollte trotzdem vollständig sein.

### 3.3 Impressum: Rechtsgrundlage und Privatanschrift (R2)

- **Rechtsgrundlage.** § 5 DDG gilt für „geschäftsmäßige, in der Regel gegen Entgelt angebotene“ Dienste. Das ist nebel. nicht. Einschlägig ist **§ 18 Abs. 1 MStV**: Wer ein Angebot betreibt, das nicht ausschließlich persönlichen oder familiären Zwecken dient, nennt Name und Anschrift. Vorschlag: „Angaben gemäß § 18 Abs. 1 MStV (vorsorglich auch § 5 DDG)“. Optional kommt eine Zeile „Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: [Name, Anschrift wie oben]“ hinzu. Ob die Entstehungstexte journalistisch-redaktionell sind, ist zweifelhaft. Die Zeile kostet nichts und nimmt die Frage vom Tisch.
- **Privatanschrift.** Sie ist Pflicht und muss ladungsfähig sein, ein Postfach genügt nicht. Die Wohnadresse steht damit offen im Netz und wird von Archiven erfasst. Optionen:
  - so lassen,
  - eine c/o-Adresse oder einen Impressumsdienst nutzen (rechtlich umstritten, aber verbreitet; vorher prüfen lassen),
  - mit Uni-Anbindung (5.1) die Uni als Anbieterin, dann deren Adresse.
- **E-Mail.** Für eine schnelle Kontaktaufnahme genügt die Mailadresse. Eine Alias-Adresse (z. B. „E-Mail-Adresse verbergen“ von iCloud oder eine eigene Projektadresse) hält Spam von der Hauptadresse fern. Rechtlich muss nichts geändert werden.

### 3.4 Datumsangaben sind das Baudatum (R12)

- `personen-daten.js` vermerkt „Geaendert (2026-11-12, nebel.)“. GPL §5a verlangt einen Hinweis auf die Änderung „und ein zugehöriges Datum“. Das Baudatum wechselt mit jedem Push, obwohl sich an der Auswahl nichts ändert (`build-viewer.mjs`, Zeile 218: `new Date()`). Besser ist ein festes Datum der tatsächlichen Änderung, z. B. das Datum, an dem die Auswahl entstand, oder das Datum des letzten Commits, der die Auswahl berührt.
- „Stand dieser Seite“ in `rechtliches.html` ist ebenfalls `{{BUILD_DATE}}`. Bei einer Datenschutzerklärung erwartet man das Datum der letzten inhaltlichen Änderung. Fest eintragen oder aus dem letzten Commit der Vorlage ziehen.

### 3.5 Parameterdatei: zwei Ergänzungen (R10)

Der Dateikopf ist gut: Herkunft, Commit, Lizenz, Änderung. Ergänzen:

- einen Satz zum Gewährleistungsausschluss der GPL („ohne jede Gewährleistung, siehe GPL-3.0 §§ 15–16“), wie die GPL ihn für weitergegebene Werke vorsieht,
- eine Urheberzeile, z. B. „© die Autorinnen und Autoren von py-mgipsim, Illinois Institute of Technology“. Im Ursprungsprojekt steht keine eigene Copyright-Zeile, also muss nichts erhalten bleiben. Die Zeile macht nur klar, wem die Daten gehören.

Außerdem, ohne Code:

- **Die Antwortmail von Ali Cinar als PDF sichern**, außerhalb des öffentlichen Repos. Sie ist der beste Beleg für die Erlaubnis.
- **Die Autoren baten um den Link.** Laut Projektnotiz ist die Antwort noch nicht verschickt. Das ist keine Rechtspflicht, aber Teil der Absprache.

Zur Einordnung des schlimmsten Falls: Selbst wenn man App und Datendatei nicht als „Aggregat“, sondern als ein gemeinsames Werk ansähe, entstünde kein Verstoß. Apache 2.0 ist mit GPL-3.0 vereinbar, der gesamte Quelltext liegt offen, und die Rechte am eigenen Code hast du selbst. Schlimmstenfalls müsste man die Gesamtseite als GPL-3.0 bezeichnen.

---

## 4. Geprüft und in Ordnung

| Regel | Anwendbar? | Anforderung | Status |
|---|---|---|---|
| MDR (EU) 2017/745, MDCG 2019-11 Rev.1 | Ja, Abgrenzung | Kein medizinischer Zweck in Kennzeichnung, Anleitung, Bewerbung | **erfüllt.** Hinweisfenster sperrt bis zur Bestätigung, Zweckbestimmung auf Start-, Rechts- und Entstehungsseite, kein Eingabefeld für eigene Werte, kein Bolusrechner. Zielgruppe ausdrücklich ohne Menschen mit T1D und ohne Fachpersonal |
| TDDDG § 25 | Ja | Speicherzugriffe nur einwilligungsfrei, wenn unbedingt erforderlich | **erfüllt.** Keine Cookies (GitHub setzt keine), vier lokale Schlüssel aus eigener Wahl der Nutzerin |
| DSGVO, Drittanbieter | Ja | Keine Übermittlung an Dritte ohne Grundlage | **erfüllt.** Keine Fremdabrufe: Schriften lokal, keine Skripte, Bilder oder Frames von fremden Servern (live nachgeprüft). Externe Links (DOI, Quellen) laden erst beim Klick |
| DSGVO Art. 9 | Nein | Gesundheitsdaten | **erfüllt.** Nur erfundene Personen, kein Eingabefeld |
| TLS | Ja (praktisch) | Verschlüsselte Übertragung | **erfüllt.** HTTPS mit HSTS durch GitHub |
| Produkthaftung alt (bis 8.12.2026) | Nein | | § 1 Abs. 2 Nr. 3 ProdHaftG: kein Vertrieb mit wirtschaftlichem Zweck, keine berufliche Tätigkeit |
| Produkthaftung neu (ab 9.12.2026) | Nein, solange kostenlos | | Ausnahme für freie Software außerhalb einer Geschäftstätigkeit (RL 2024/2853 Art. 2 Abs. 2). Der Bundestag hat das Gesetz am 8.10.2026 beschlossen. Zustimmung des Bundesrats und Verkündung habe ich nicht verifiziert |
| Schriften (SIL OFL 1.1) | Ja | Lizenztext beilegen, reservierte Namen beachten | **erfüllt.** Lizenztexte liegen bei. Weder DM Mono noch Plus Jakarta Sans haben einen reservierten Schriftnamen, Teilmengen sind also unproblematisch |
| Apache 2.0 (eigener Code) | Ja | Lizenztext | **erfüllt.** `lizenzen/Apache-2.0.txt`, Repo-Lizenz erkannt |
| Fremder Code (Embla, Swiper) | Nein | | Nur die Idee (Geschwindigkeitsfenster) übernommen, kein Code. Ideen sind nicht geschützt, die Quellen sind trotzdem genannt |
| Abbildungen aus Papern | Nein | | Keine übernommen. Zitiert wird mit Autor, Jahr und DOI |
| MarkenG, HWG | Nein | | „Dexcom G6“, „Libre“, „NovoRapid“ kommen nur als Verweis und Quelle vor. Markenrecht greift erst im geschäftlichen Verkehr, Heilmittelwerberecht erst bei Werbung mit Absatzzweck |
| UWG (Abmahnungen) | Nein | | Ohne geschäftliche Handlung gibt es keine Mitbewerber, die abmahnen könnten. Übrig bleiben Einzelansprüche nach DSGVO und Hinweise an die Aufsichtsbehörde, beide wegen R4/R5 unwahrscheinlich |
| Digital Services Act | Nein | | nebel. speichert keine Inhalte Dritter. GitHub ist Host, auch für Issues |
| Cyber Resilience Act | Nein | | Nichtkommerzielle freie Software, zudem kein Produkt auf dem Markt |
| BFSG (Barrierefreiheit) | Nein | | Kein Wirtschaftsakteur, keine Verbraucherdienstleistung im Sinne des Gesetzes. Bei Uni-Anbindung siehe 5.1 |
| Jugendschutz (JMStV) | Nein | | Keine entwicklungsbeeinträchtigenden Inhalte |
| GitHub-Nutzungsbedingungen für Pages | Ja | Keine kommerzielle Nutzung, keine sensiblen Transaktionen | **erfüllt** |
| Haftungsausschluss-Textbausteine | | | **Bewusst weglassen.** „Haftung für Links/Inhalte“-Textbausteine ändern an der Rechtslage nichts. Die ehrliche Zweckbestimmung wirkt stärker |

---

## 5. Weiter gedacht: Was die Lage ändern würde

Die Lage ist heute stabil. Diese Ereignisse würden sie ändern. Wenn eins davon eintritt, diesen Abschnitt erneut prüfen.

### 5.1 Uni-Kontext (Abschlussarbeit, Lehrveranstaltung, Uni-Hosting)
- Wird die Seite von der Uni betrieben oder als Uni-Angebot verlinkt, gelten für öffentliche Stellen in NRW die Barrierefreiheitsregeln (BITV NRW): Erklärung zur Barrierefreiheit, Feedback-Weg, WCAG-Niveau.
- Verantwortliche im Sinne von Impressum und Datenschutz wäre dann ggf. die Uni. Das ist die sauberste Lösung für das Anschrift-Problem (3.3).
- Bei einer Prüfungsleistung gelten die Regeln der Prüfungsordnung zur Kennzeichnung von KI-Hilfe. Das ist keine Website-Rechtsfrage, kann aber die Arbeit gefährden. Die Entstehungstexte erwähnen KI-Unterstützung bisher nicht.
- Produkthaftung bleibt außen vor, solange kein Geld fließt.

### 5.2 Geld in jeder Form
Spendenbutton, GitHub Sponsors, Ko-fi, bezahlter Workshop mit nebel., Einbindung in ein kostenpflichtiges Angebot, Sponsoring durch einen Hersteller. Jede Form davon gefährdet die Ausnahme von der Produkthaftung und macht aus Erwähnungen von Marken und Arzneimitteln womöglich eine geschäftliche Handlung (UWG, MarkenG, HWG). Preisgelder oder Stipendien für das Projekt vorher prüfen lassen. Derzeit gibt es keine `FUNDING.yml` im Repo. Gut.

### 5.3 Bewerbung und Weitergabe
Die Zweckbestimmung hängt an jeder Formulierung, auch außerhalb der Seite: Posts, Vorträge, Texte für Diabetes-Verbände, App-Store-Beschreibungen. Gefährlich sind Sätze wie „hilft beim Diabetes-Management“, „für frisch diagnostizierte Kinder“ oder „übe deine Bolus-Entscheidungen“. Unbedenklich: „zeigt Angehörigen, wie sich ein Tag mit Typ 1 anfühlt“.

### 5.4 Anfragen echter Betroffener (R3)
Die Mailadresse im Impressum und die offenen GitHub-Issues laden Fragen wie „Wie viel soll ich spritzen?“ ein, manchmal mit echten Werten. Keine individuelle Therapieberatung geben, auch nicht gut gemeint. Vorbereiten:
- eine Standardantwort („nebel. ist ein Lernsystem, für deine Therapie ist dein Diabetesteam da“),
- ein Issue-Formular mit dem Hinweis, keine eigenen Gesundheitsdaten zu posten.

Eigene Gesundheitsdaten in einem öffentlichen Issue sind ein Thema zwischen der Person und GitHub, aber unschön im eigenen Projekt.

### 5.5 Forks
Jemand forkt nebel. und baut einen Bolusrechner ein. Dann ist **diese Person** Herstellerin. Apache 2.0 schließt Gewährleistung und Haftung so weit aus, wie deutsches Recht das zulässt. Nach Schenkungsrecht bleibt die Haftung im Wesentlichen auf Vorsatz und grobe Fahrlässigkeit beschränkt. Die Zweckbestimmung im README schützt zusätzlich. Nichts zu tun.

### 5.6 KI-Verordnung, Art. 50 Abs. 4
Seit 2.8.2026 gilt: Wer KI-erzeugten Text veröffentlicht, um die Öffentlichkeit über Angelegenheiten von öffentlichem Interesse zu informieren, muss das kennzeichnen. Die Digital-Omnibus-Verordnung hat diese Pflicht nicht verschoben. Ausnahme: Der Text wurde von einem Menschen geprüft oder redigiert, und eine natürliche Person trägt die redaktionelle Verantwortung. Das trifft auf die Entstehungstexte zu, solange du sie wirklich liest und verantwortest. Eine freiwillige Zeile wie „mit KI-Unterstützung geschrieben, von mir geprüft“ wäre zusätzlich ehrlich und passt zum offenen Stil des Projekts. Pflicht ist sie nicht.

### 5.7 Datenschutzrahmen EU–USA (R8)
Das EU-Gericht hat den Angemessenheitsbeschluss am 3.9.2025 bestätigt (T-553/23, Latombe). Die Berufung liegt beim EuGH (C-703/25 P), ein Termin ist nicht bekannt. Fällt der Rahmen, muss der Absatz zu GitHub angepasst werden. Die Seite selbst muss nicht offline. Dann wäre zu klären, worauf GitHub die Übermittlung stattdessen stützt, etwa auf Standardvertragsklauseln.

### 5.8 Kontosicherheit (R9)
Eine Gesundheits-Lernseite, auf der jemand nach einer Kontoübernahme falsche Inhalte einspielt, wäre der größte praktische Schaden. Prüfen: 2FA am GitHub-Konto, Branch-Schutz für `main`, die lokal vorbereitete CSP veröffentlichen.

### 5.9 Eigene Domain oder anderer Host
Dann den Datenschutztext für den neuen Host neu schreiben, einen Auftragsverarbeitungsvertrag abschließen (die meisten Hoster bieten das an) und Server-Logs und deren Speicherdauer selbst festlegen. Vorteil: echte Sicherheits-Header (z. B. `frame-ancestors`) werden möglich.

---

## 6. Nächste Schritte

| # | Schritt | Wer | Aufwand |
|---|---|---|---|
| 1 | Rechtliches-Link in `app/text.html` (R4) | Claude | erledigt 12.11. (Nachtrag 26), nicht live |
| 2 | Datenschutztext DE/EN um 3.2 ergänzen (R5) | Claude, Freigabe Nojo | erledigt 12.11., nicht live |
| 3 | Impressum-Rechtsgrundlage § 18 MStV (3.3) | Claude | erledigt 12.11., nicht live |
| 4 | Feste Datumsangaben statt Baudatum (R12) | Claude | erledigt 12.11., nicht live |
| 5 | Dateikopf `personen-daten.js` ergänzen (3.5) | Claude | erledigt 12.11., nicht live |
| 6 | MDCG-Link auf Rev.1 (R14) | Claude | erledigt 12.11., nicht live |
| 7 | Anschrift: so lassen oder c/o (R2) | Nojo | Entscheidung |
| 8 | Antwortmail an py-mgipsim mit Link, Zustimmungsmail sichern | Nojo | klein |
| 9 | 2FA und Branch-Schutz prüfen (R9) | Nojo | klein |
| 10 | Vor breiter Verbreitung: einmal Rechtsabteilung Uni oder Verbraucherzentrale | Nojo | mittel |

**Erneut prüfen:** bei jedem Auslöser aus Abschnitt 5, spätestens nach dem EuGH-Urteil zu C-703/25 P und sonst in einem Jahr.

---

## Quellen

- Anthropic Legal-Plugin, Skills `legal-risk-assessment` und `compliance-check`: https://github.com/anthropics/knowledge-work-plugins/tree/main/legal
- GitHub, „What is GitHub Pages“, Abschnitt Data collection: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub General Privacy Statement (Rolle als Verantwortlicher, DPF-Teilnahme, Speicherdauer): https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement
- DPF-Berufung Latombe, C-703/25 P: [WilmerHale](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework), [heise](https://heise.de/-10965203), [Digital Policy Alert](https://digitalpolicyalert.org/event/35459-latombe-filed-appeal-against-general-court-dismissal-of-challenge-to-european-unionunited-states-data-protection-framework-adequacy-decision-in-latombe-v-commission)
- Produkthaftung neu: [Bundestag, Beschlussempfehlung Drs. 21/8429](https://dserver.bundestag.de/btd/21/084/2108429.pdf), [Bundestag Textarchiv KW 41/2026](https://www.bundestag.de/dokumente/textarchiv/2026/kw41-de-produkthaftungsrecht-1222456), [MTR Legal](https://www.mtrlegal.com/neues-produkthaftungsrecht-gilt-ab-dezember-2026/index.md), [Greenberg Traurig](https://www.gtlaw.com/de/insights/2026/1/new-german-product-liability-regime-broader-scope-potentially-higher-exposure)
- KI-Verordnung Art. 50 und Digital Omnibus: [Goodwin](https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force), [Houthoff](https://www.houthoff.com/insights/news/ai-act-transparency-obligations-and-the-ai-omnibus-regulation/), [Jones Walker](https://www.joneswalker.com/en/insights/blogs/ai-law-blog/yes-august-2-still-matters-the-eu-approved-a-high-risk-ai-delay-but-most-trans.html)
- MDCG 2019-11 Rev.1 (Juni 2025): [Europäische Kommission](https://health.ec.europa.eu/latest-updates/update-mdcg-2019-11-rev1-qualification-and-classification-software-regulation-eu-2017745-and-2025-06-17_en), [Emergo by UL](https://www.emergobyul.com/news/european-revision-primary-software-guidance-mdcg-2019-11-revision-1-small-changes-meaningful)
- Gesetzestexte: § 5 DDG, § 18 MStV, § 25 TDDDG, Art. 13, 21, 45 DSGVO, GPL-3.0 §§ 4, 5, 15, 16, SIL OFL 1.1
