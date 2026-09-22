# Nebel

Browserbasierter Typ-1-Diabetes-Simulator für **Angehörige und Freunde** von Menschen mit Typ-1-Diabetes.

## Zweckbestimmung

Nebel dient ausschließlich der **Bildung und dem Perspektivwechsel**. Es simuliert eine fiktive erwachsene Person mit Typ-1-Diabetes, damit Angehörige und Freunde nachvollziehen können, welcher Aufwand, welche Verzögerungen und welche Unsicherheit im Alltag mit dieser Erkrankung stecken.

Nebel ist ausdrücklich **nicht** bestimmt zur Diagnose, Verhütung, Überwachung, Vorhersage, Prognose, Behandlung oder Linderung einer Krankheit. Es ist **kein Medizinprodukt** im Sinne der Verordnung (EU) 2017/745 und wird auch nicht als solches beworben.

- Nebel gibt **keine** Dosierungsempfehlungen und keine individuelle Beratung.
- Nebel verarbeitet **keine** echten Gesundheitsdaten. Eine Eingabe eigener Blutzucker-, Insulin- oder Mahlzeitenwerte aus dem realen Leben ist nicht vorgesehen.
- Die Simulation bildet **eine** erwachsene Beispielperson ab. Kinder, Jugendliche und schlecht eingestellte Verläufe sind nicht abgedeckt.
- Keine Zahl aus Nebel darf einer realen Therapieentscheidung zugrunde gelegt werden. Dafür ist das Diabetesteam zuständig.

Rechtliche Einordnung und Bedingungen für eine Veröffentlichung: `docs/30_Rechtliche_Einordnung.md`.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `docs/` | Zielgruppe, Engine-Spezifikation, Parameter-Registry, Widerspruchsprüfung |
| `engine/` | Physiologische Engine als eigenständiges TypeScript-Modul, headless testbar |
| `index.html` | UX- und Interaktionsprototyp. **Keine** physiologische Quelle |
| `*.docx` | Historischer Dokumentationsstand 14.09.2026, siehe `docs/README.md` |

## Einstieg

Beginne mit `docs/README.md`.

## Stand

Engine: Grundgerüst steht, Physiologie noch nicht implementiert. Die Validierungsmatrix existiert als Testsuite und schlägt absichtlich fehl, bis die jeweiligen Module gebaut sind.

## Lizenz und Herkunft

Code und Dokumentation stehen unter der Apache-Lizenz 2.0, siehe `LICENSE`.

Die physiologische Engine implementiert das erweiterte Hovorka-Modell (ExtHovorka) nach den Veröffentlichungen von Hobbs et al. (2019) und Siket, Rashid & Cinar (2025). Die Referenzimplementierung [py-mgipsim](https://github.com/illinoistech-itm/py-mgipsim) steht unter GPL-3.0 und wird **ausschließlich als numerisches Vergleichsorakel** in der Testsuite verwendet. Es wurde kein Code daraus übernommen; weder die Bibliothek noch ihre Parameterdatensätze sind Teil dieses Repositorys.
