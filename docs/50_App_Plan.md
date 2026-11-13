# Nebel als iPhone-App — Plan

Stand: 2026-11-12. Entscheidungen in `docs/README.md` (Tabelle) und Nachtrag 27 in `00`. Die Website bleibt, wie sie ist.

## Warum eine App

Der Echtzeit-Modus (`06_Echtzeit_Modus.md`) lebt davon, dass Nebel im Alltag mitläuft: Handy in der Tasche, Alarm um 3:12 Uhr. Safari auf dem iPhone kann das nicht: kein Rechnen im Hintergrund, keine Mitteilung zu einer berechneten Uhrzeit, kein Bluetooth. Eine native App kann alles drei. Am PC ergibt der Modus keinen Sinn, weil der PC nicht mitkommt.

## Entschieden (12.11.2026)

- **Eigenständige App, selbes Repo, Ordner `mobile/`.** Geteilt wird nur Logik: `engine/src`, `app/adapter.js`, `app/personas.js`. Die Oberfläche der App ist eigenständig und wird aus `app/template.html` höchstens einmal kopiert, danach frei weiterentwickelt. Ein eigenes Repo hätte die Engine kopiert, Kalibrierung und Tests wären auseinandergelaufen.
- **Echter Puls ist erlaubt**, nur in der App, nur als `heartRate`-Ereignis für die Bewegung der simulierten Person, bleibt auf dem Gerät. Glukose, Insulin, Bolus bleiben verboten.

## Ausgangslage

- iPhone 13 mit iOS 26, PC mit Windows 11. **Kein Mac, keine Apple Watch.**
- Pulsband: Amazfit Helio Strap. Mit „Heart Rate Push“ in Zepp (Gerät → Helio Strap → Health Monitoring) meldet es sich zusätzlich als Standard-Pulsgurt: Heart Rate Service `0x180D`, Messung `0x2A37`, etwa 1 Wert/s, nur BPM, keine RR-Intervalle. Unter Windows bewiesen in `D:\Dev\helio` (`src-tauri/src/ble.rs`).
- Engine: `heartRate`-Ereignisse mit `bpm` gibt es schon (`engine/src/afterEffect.ts`, `heartRateReserve` in `model.ts`). Echtzeit-Sitzung in `engine/src/realtime.ts` (`RealtimeSession`, `advanceTo`, `appendEvent`).
- `app/adapter.js` und `app/personas.js` lesen Globale (`window.Nebel`, `window.SUBJECTS`), aber kein DOM. In einer WebView lauffähig.

## Technik

| Baustein | Wahl |
|---|---|
| Hülle | Capacitor **8.6.0** (`@capacitor/core`, `/cli`, `/ios`), exakt gepinnt. iOS-Projekt mit Swift Package Manager, kein CocoaPods |
| Bluetooth | `@capacitor-community/bluetooth-le` **8.3.0** (API geprüft: `getConnectedDevices`, `requestDevice`, `startNotifications`) |
| Mitteilungen | `@capacitor/local-notifications` (ab Phase 4) |
| Bündeln | esbuild, wie in `engine/` |
| Bundle-ID | `de.nojo.nebel`, Anzeigename `nebel.` |
| Bauen | GitHub Actions, macOS-Runner, unsignierte `.ipa` als Artefakt |
| Signieren | kostenlos über SideStore (7 Tage, höchstens 3 Apps). Developer Program (99 €/Jahr pro Konto, beliebig viele Apps) erst auf Nojos Wort |

Ordner:

```
mobile/
  package.json           Capacitor + Plugins, Skripte build/sync/test
  capacitor.config.ts    appId, appName, webDir "www"
  src/                   App-Oberfläche (TS)
  src/hr.ts              Parser 0x2A37 + Minutenmittel, ohne Capacitor-Abhängigkeit
  tests/                 vitest, auch Property-Tests für den Parser
  www/                   Bauergebnis (nicht committen)
  ios/App/...            von Capacitor erzeugt, committen
.github/workflows/mobile.yml
```

### Pulsquellen

Jede Quelle liefert nur BPM, die Engine bleibt gleich. Pro Minute ein `heartRate`-Ereignis (Mittel der Sekundenwerte).

1. **Bluetooth-Pulsgurt** (`0x180D`): Helio, Polar, Garmin HRM, Wahoo. Hauptquelle.
2. **Simuliert:** die heutigen Trainingsmuster. Gilt, wenn kein Gurt verbunden ist.
3. **Apple Health:** später (Phase 5), Werte kommen verzögert.
4. **Garmin über Haze:** später (Phase 5).

### Hintergrund und Alarme (Phase 4)

- **Vorausberechnete Alarme:** Die Engine ist deterministisch. Nach jedem Ereignis die nächsten Stunden vorausrechnen und lokale Mitteilungen für die Grenzüberschreitungen planen. Kein Server, kein Hintergrundlauf. Bei jedem neuen Ereignis neu planen.
- **Mit Gurt:** Hintergrundmodus `bluetooth-central` weckt die App bei jedem Pulswert. Die WebView schläft dabei; Engine und Alarmplanung müssen dann nativ in JavaScriptCore laufen. Heikelste Stelle des Projekts, vorher einen kleinen Test bauen.

## Gilt in jeder Phase

**Nicht anfassen:** `app/template.html`, `app/text.html`, `app/rechtliches*.html`, `engine/scripts/build-viewer.mjs`, die Website-Ausgabe. Nach jeder Phase prüfen: `cd engine && npm run viewer` baut, und die Ausgabe unterscheidet sich nicht vom Stand davor.

**Nie bauen:** Eingabe von Glukose, Insulin, Bolus oder anderen echten Körperwerten außer Puls. Pulsdaten nie übers Netz schicken. Kein App-Store-Upload, kein Kauf des Developer Program.

**Engine:** nur ändern, wenn eine Phase es verlangt, dann mit Test und Nachtrag in `00`. `cd engine && npm test` und `npm run typecheck` müssen grün bleiben (bekannte Ausnahme: Orakel-Test braucht numpy).

**Ablauf:** Nojo programmiert nicht selbst und testet nach jeder Phase auf dem iPhone. Jede Phase endet mit einer kurzen Testanleitung in einfachen Worten. Commit und Push nur auf Nojos Wort. Neue Abhängigkeiten in `D:\Dev\_tools\claude-setup\INVENTAR.md` nachtragen, falls sie dort hingehören.

**Unter Windows:** Installer nicht aus Claude heraus starten (landen im virtualisierten Paketordner). Nojo installiert selbst per Doppelklick.

## Phasen

### Phase 0 — Entscheidungen festhalten ✔ (12.11.2026)

Tabelle in `docs/README.md`, Nachtrag 27 in `00`.

### Phase 1 — Werkzeugkette und Puls-Test

Ziel: Beweisen, dass eine eigene App auf Nojos iPhone läuft und den Puls vom Helio Strap bekommt, **während Zepp verbunden bleibt**. Wenn das nicht geht, ändert sich der Plan (dann Puls nur über Apple Health oder Brücke über den PC).

**Nojo, einmalig:**
1. iTunes installieren, die Version von apple.com, nicht aus dem Microsoft Store.
2. iloader von github.com/nab138/iloader (Releases, `iloader-windows-x64.msi`) per Doppelklick installieren.
3. iPhone per Kabel anschließen, „Vertrauen“ tippen. In iloader mit der Apple-ID anmelden, SideStore installieren. iloader legt die Pairing-Datei mit an.
4. Auf dem iPhone: Einstellungen → Datenschutz & Sicherheit → Entwicklermodus an, Neustart. Einstellungen → Allgemein → VPN & Geräteverwaltung → der eigenen Apple-ID vertrauen.
5. In Zepp „Heart Rate Push“ am Helio Strap einschalten.

Nach einem iOS-Update kann die Pairing-Datei ungültig werden; dann Schritt 3 wiederholen.

**Bauen (Claude):**
1. `mobile/` anlegen wie oben, `npx cap add ios`. Falls das unter Windows scheitert: im Workflow einmal erzeugen, als Artefakt holen, committen.
2. `Info.plist`: `NSBluetoothAlwaysUsageDescription` = „nebel. liest deinen Puls vom Pulsgurt, damit sich die simulierte Person mitbewegt. Die Werte bleiben auf dem iPhone.“
3. `src/hr.ts`: Parser für `0x2A37` (Flags-Byte Bit 0: 0 = BPM als uint8 in Byte 1, 1 = uint16 little-endian in Byte 1–2; Rest ignorieren) und Minutenmittel. Tests mit vitest; Property-Test: jeder gültige 8- und 16-Bit-Wert kommt unverändert zurück, zu kurze Daten liefern `null` statt Absturz.
4. Eine Seite: großer BPM-Wert, Name des Geräts, Zeit des letzten Werts, Knopf „Pulsgurt verbinden“. Ablauf: `BleClient.initialize()`, zuerst `getConnectedDevices(["0000180d-0000-1000-8000-00805f9b34fb"])` (Gurt hängt schon an Zepp), sonst `requestDevice({ services: [...] })`; dann `startNotifications` auf `2a37`. Bei Abbruch automatisch neu verbinden. Letztes Gerät merken, beim Start direkt verbinden.
5. `.github/workflows/mobile.yml`: Auslöser `push` auf `main` mit `paths: [mobile/**, engine/src/**, app/adapter.js, app/personas.js]` und `workflow_dispatch`. Runner `macos-26` (oder neuester mit Xcode 26). Schritte: `npm ci` in `engine/` und `mobile/`, `npm run build`, `npx cap sync ios`, `xcodebuild archive` mit `CODE_SIGNING_ALLOWED=NO`, `App.app` in `Payload/` packen, als `nebel.ipa` zippen, `upload-artifact`. Rechte nur `contents: read`.
6. `pages.yml`: `paths-ignore: [mobile/**, .github/workflows/mobile.yml]` ergänzen, sonst nichts.

**Installieren (Nojo):** Artefakt `nebel.ipa` aus dem Actions-Lauf laden (auf dem PC entpacken). Entweder mit iloader installieren, oder die `.ipa` per NotchDrop aufs iPhone schicken und in SideStore über „+“ öffnen.

**Abnahme:**
- App startet, Knopf verbindet, BPM ändert sich etwa jede Sekunde.
- Zepp zeigt den Puls dabei weiter an.
- App schließen und neu öffnen: verbindet von selbst.
- Helio am PC läuft gleichzeitig weiter (falls an).
- Website-Bau unverändert, Engine-Tests grün.

### Phase 2 — Simulation in der App ✔ gebaut (13.11.2026), Test auf dem iPhone offen

Umgesetzt: `mobile/src/app.html` ist die einmalige Kopie von `app/template.html` (Stand 12.11.), die Website hatte Echtzeit-Modus, Speichern und Nachholen schon. Änderungen in der Kopie: nur Echtzeit (Tempo-Wahl, Entstehungskarte, Englisch-Link, Datenexport und Impressum-Links ausgeblendet), jede neue Sitzung stellt die Uhr auf die echte Tageszeit, der Anker (Simulationsminute zu Zeitstempel) wird mitgespeichert, sodass beim Öffnen keine Teilminute verloren geht (höchstens drei Tage nachgerechnet, danach neuer Anker). Speicher ist `localStorage` der WebView, nicht `@capacitor/preferences`. Der Pulsgurt-Test aus Phase 1 liegt weiter unter „Pulsgurt-Test“ (`puls.html`). `build.mjs` füllt die Platzhalter aus `engine/src`, `app/adapter.js`, `app/personas.js`; Parametersätze, Schriften und Lizenztexte kommen aus `engine/dist/site` (der Workflow erzeugt sie in einem Linux-Job). Geprüft im Vorschaufenster: 90 min Pause nachgerechnet ergibt denselben Blutzucker wie ein durchgehender Lauf (Abweichung nur durch Rundung im Speicher).

- Engine (esbuild-Bündel aus `engine/src/index.ts`), `adapter.js`, `personas.js`, Parameterdaten in die App. Oberfläche: Kurve, Essen, Personen, als einmalige Übernahme aus `template.html`, danach eigenständig.
- Echtzeit-Lauf nach Doc 06: Speichern (Anker, Seed, Subjekt, Zustand, Ereignisse, letzte Minute) mit `@capacitor/preferences` oder Dateien, Nachholen beim Öffnen.
- Hinweisfenster wie auf der Website (Bitte von Cinar: „nur Lernsystem, kein Medizinprodukt, keine Insulindosierung“ als Erstes beim Start).
- **Abnahme:** App schließen, eine Stunde später öffnen, Verlauf ist korrekt nachgerechnet. Gleiche Eingaben wie auf der Website ergeben die gleiche Kurve.

### Phase 3 — Puls steuert die Simulation ✔ gebaut (13.11.2026), Test auf dem iPhone offen

Umgesetzt: `mobile/src/belt.ts` (Verbindung, gemerkt, still beim Start) und `mobile/src/belt-engine.js` (`BeltEngine extends Engine`, ohne `app/adapter.js` anzufassen). Ein Minutenmittel wird zum `heartRate`-Ereignis ab jetzt; bei Gurt gelten Alltag und Training aus dem Plan nicht, das Bewegungsblatt ist gesperrt. Rückfall auf simuliert nach mehr als 2 Minuten ohne Ereignis, im Rechenschritt selbst, damit Nachholen nach einer Pause bitgleich bleibt (Test `tests/belt-engine.test.mjs`). Die Bewegungskarte zeigt „Quelle: Pulsgurt · NN bpm“ oder „Quelle: simuliert“. Der Puls wird nicht auf die Person umgerechnet (Ruhe-/Maximalpuls der Person bleiben die des Datensatzes). Im Hintergrund kommen noch keine Werte (Phase 4).

- Gurt-Werte als ein `heartRate`-Ereignis pro Minute. Ohne Gurt (länger als 2 min kein Wert) gelten die simulierten Trainingsmuster.
- Anzeige, welche Quelle gerade gilt (Gurt / simuliert).
- Puls-Rohwerte werden nicht dauerhaft gespeichert, nur die Minutenereignisse der Sitzung.
- **Abnahme:** Zwei Minuten Treppe, die Bewegungslinie in der Wirkungskarte steigt, die Kurve reagiert. Gurt ablegen: App fällt auf simuliert zurück.

### Phase 4 — Alarme und Hintergrund — Teil 1 gebaut (13.11.2026), Test auf dem iPhone offen

Teil 1 umgesetzt: vorausberechnete Alarme (`mobile/src/alarm-plan.js`: Kopie des Laufs 12 h ohne Eingaben weiterrechnen, Sensor unter 80 oder über 280, Wiederholung alle 30 min, Test `tests/alarm-plan.test.mjs` gegen den echten Lauf) als lokale Mitteilungen (`@capacitor/local-notifications` 8.3.1, `src/alarms.ts`). Neu geplant nach jeder Eingabe, alle 5 min und beim Verlassen der App. Standardmäßig an: Das Hinweisfenster kündigt sie an, danach fragt iOS; abschaltbar über „Alarme: an/aus“. „Schlafen gehen“ fragt vorher ausdrücklich (Blatt „Schlafen gehen“), hält den Bildschirm nicht mehr an, und eine offene Nacht kommt nach dem Öffnen zurück. Grenzen der Nachtansicht jetzt ebenfalls 80/280. `UIBackgroundModes: bluetooth-central` gesetzt; der Pulsgurt-Test zählt Werte pro Minute (Hintergrund-Test).

Teil 2 hängt am Hintergrund-Test: Kommen bei gesperrtem Handy etwa 60 Werte pro Minute im JavaScript an, kann die WebView selbst rechnen und neu planen. Kommen keine oder alle erst beim Entsperren, braucht es eigenes Bluetooth und die Engine in JavaScriptCore (Swift).

Erst einen Test-Spike: bekommt die App bei gesperrtem Handy weiter Pulswerte, und kann sie in JavaScriptCore das Engine-Bündel rechnen? Für diese Phase lieber Opus statt Sonnet.

- Vorausberechnete lokale Mitteilungen für Grenzen (80/280 wie Training, Werte aus dem Adapter).
- Nachtmodus mit ausdrücklicher Abfrage vor dem Start (Doc 06, „Die Nacht“).
- `UIBackgroundModes: bluetooth-central`, Engine im Hintergrund über JavaScriptCore.
- **Abnahme:** eine Nacht mit Alarm; eine Stunde Alltag mit gesperrtem Handy, danach stimmt der Verlauf.

### Phase 5 — Weitere Quellen und Verteilung

- Apple Health (HealthKit), Garmin über Haze.
- Datenschutztext der App (Pulsdaten), bevor die App an andere geht.
- Entscheidung Developer Program und TestFlight.

## Offene Fragen

- Teilt iOS das Band zwischen Zepp und Nebel? (Phase 1)
- Lizenz bei App-Verteilung: Repo Apache-2.0, Parametersätze aus GPL-3.0-Datei. Für SideStore und TestFlight unkritisch, vor dem App Store prüfen.
- App Store ist kein Ziel. Apple prüft Medizin-Apps streng (Richtlinie 1.4.1).

## Übergabe an einen neuen Chat

Diesen Text in den neuen Chat kopieren:

> Wir bauen Nebel als iPhone-App. Lies zuerst `D:\Dev\nebel\docs\50_App_Plan.md` vollständig, dann `docs/06_Echtzeit_Modus.md` und `D:\Dev\helio\README.md`. Arbeite nur an Phase 1, halte dich an „Gilt in jeder Phase“ und ende mit der Testanleitung für mich. Commit erst, wenn ich es sage.
