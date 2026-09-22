# Nebel

Browserbasierter Typ-1-Diabetes-Simulator für **Angehörige und Freunde** von Menschen mit Typ-1-Diabetes.
Bildungs- und Forschungsprototyp. Kein Medizinprodukt, keine Dosierungsempfehlung.

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
