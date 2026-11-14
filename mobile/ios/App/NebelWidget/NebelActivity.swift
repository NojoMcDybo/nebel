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

/// Gemeinsamer Speicher von App und Startbildschirm-Widget (App Group). SideStore haengt
/// beim Signieren die Team-ID an den Gruppennamen und schreibt den echten nach ALTAppGroups.
enum NebelShared {
    static let defaults: UserDefaults? = {
        let g = (Bundle.main.object(forInfoDictionaryKey: "ALTAppGroups") as? [String])?.first ?? "group.de.nojo.nebel"
        return UserDefaults(suiteName: g)
    }()
}

@available(iOS 16.1, *)
extension NebelActivityAttributes.ContentState {
    static func load() -> Self? {
        NebelShared.defaults?.data(forKey: "last").flatMap { try? JSONDecoder().decode(Self.self, from: $0) }
    }
    func save() { NebelShared.defaults?.set(try? JSONEncoder().encode(self), forKey: "last") }
}
