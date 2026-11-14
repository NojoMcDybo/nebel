import ActivityKit
import Foundation

/// Live-Aktivitaet auf dem Sperrbildschirm. Gehoert zu beiden Programmteilen:
/// die App startet und aktualisiert sie (NebelLivePlugin), die Widget-Erweiterung
/// zeichnet sie (NebelWidget.swift). mobile/scripts/add-widget.rb traegt die Datei
/// in beide Ziele ein.
@available(iOS 16.1, *)
struct NebelActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var value: String      // fertig formatiert, mg/dL oder mmol/L
        var unit: String
        var arrow: String
        var delta: String      // zum vorigen Wert, mit Vorzeichen, wie in der App
        var tone: String       // "low" | "high" | "ok"
        var name: String       // simulierte Person
        var bpm: Int           // Puls jetzt: Gurt, sonst simuliert
        var hard: Bool         // Puls ueber der ventilatorischen Schwelle (anaerob)
        var at: Date           // Zeit des Sensorwerts
        var points: [Double]   // letzte Stunde in mg/dL, alle 5 min
        var dark: Bool         // Farbschema der App
    }
}
