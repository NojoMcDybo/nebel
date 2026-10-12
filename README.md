# Nebel

Browserbasierter Typ-1-Diabetes-Simulator für **Angehörige und Freunde** von Menschen mit Typ-1-Diabetes.

**Ausprobieren:** https://nojomcdybo.github.io/nebel/ — im Browser, auch auf dem Handy, ohne Installation.

## Zweckbestimmung

Nebel dient ausschließlich der **Bildung und dem Perspektivwechsel**. Es simuliert eine fiktive erwachsene Person mit Typ-1-Diabetes, damit Angehörige und Freunde nachvollziehen können, welcher Aufwand, welche Verzögerungen und welche Unsicherheit im Alltag mit dieser Erkrankung stecken.

Nebel ist ausdrücklich **nicht** bestimmt zur Diagnose, Verhütung, Überwachung, Vorhersage, Prognose, Behandlung oder Linderung einer Krankheit. Es ist **kein Medizinprodukt** im Sinne der Verordnung (EU) 2017/745 und wird auch nicht als solches beworben.

- Nebel gibt **keine** Dosierungsempfehlungen und keine individuelle Beratung.
- Nebel verarbeitet **keine** echten Gesundheitsdaten. Eine Eingabe eigener Blutzucker-, Insulin- oder Mahlzeitenwerte aus dem realen Leben ist nicht vorgesehen.
- Die Simulation bildet **zehn erfundene erwachsene Personen** ab. Kinder, Jugendliche und schlecht eingestellte Verläufe sind nicht abgedeckt.
- Keine Zahl aus Nebel darf einer realen Therapieentscheidung zugrunde gelegt werden. Dafür ist das Diabetesteam zuständig.

Rechtliche Einordnung und Bedingungen für eine Veröffentlichung: `docs/30_Rechtliche_Einordnung.md`.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `docs/` | Zielgruppe, Engine-Spezifikation, Parameter-Registry, Widerspruchsprüfung |
| `engine/` | Physiologische Engine als eigenständiges TypeScript-Modul, headless testbar |
| `app/` | Die App: Oberfläche (`template.html`), Adapter auf die Engine, Personen, Seite „Rechtliches“ |
| `.github/workflows/pages.yml` | Prüft, baut und veröffentlicht die App auf GitHub Pages |
| `index.html` | UX- und Interaktionsprototyp. **Keine** physiologische Quelle |
| `*.docx` | Historischer Dokumentationsstand 14.09.2026, siehe `docs/README.md` |

## Einstieg

Beginne mit `docs/README.md`.

## Stand

Engine fertig und gegen die Referenzimplementierung geprüft (133 Tests), dazu Sensormodell, Fett und Eiweiß. Die App läuft auf der Engine, mit zehn Personen, Echtzeitmodus und 12-Stunden-Vorhersage in der Auswertung. Details und Änderungsverlauf: `docs/00_Widerspruchspruefung_und_Changelog.md`.

## Selbst bauen

```
cd engine
npm install
npm run oracle:fetch   # holt py-mgipsim (GPL-3.0) nach engine/vendor/, nicht ins Repo
npm test
npm run viewer         # baut engine/dist/site/ (die App) und engine/dist/nebel-viewer.html
```

`engine/dist/site/index.html` lässt sich direkt im Browser öffnen.

## Lizenz und Herkunft

Code und Dokumentation stehen unter der Apache-Lizenz 2.0, siehe `LICENSE`.

Die physiologische Engine implementiert das erweiterte Hovorka-Modell (ExtHovorka) nach den Veröffentlichungen von Hobbs et al. (2019) und Siket, Rashid & Cinar (2025). Die Referenzimplementierung [py-mgipsim](https://github.com/illinoistech-itm/py-mgipsim) steht unter GPL-3.0 und wird in der Testsuite als numerisches Vergleichsorakel verwendet. Es wurde kein Code daraus übernommen; weder die Bibliothek noch ihre Parameterdatensätze sind Teil dieses Repositorys.

**Die veröffentlichte App** liefert zehn der zwanzig Parametersätze von py-mgipsim mit, als eigene Datei `personen-daten.js` **unter GPL-3.0**, mit Herkunft, Lizenztext und Änderungsvermerk. Der übrige Code der App steht unter Apache 2.0. Schriften: DM Mono und Plus Jakarta Sans, SIL Open Font License 1.1. Begründung: `docs/30_Rechtliche_Einordnung.md`, Abschnitt 7.
