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

/// Gemeinsamer Speicher von App und Startbildschirm-Widget (App Group). SideStore benennt
/// Gruppe und Bundle-ID beim Signieren um (Team-ID angehaengt). Deshalb mehrere Kandidaten;
/// es gilt der erste, fuer den iOS wirklich einen gemeinsamen Ordner hat.
enum NebelShared {
    static let candidates: [String] = {
        var ids = (Bundle.main.object(forInfoDictionaryKey: "ALTAppGroups") as? [String]) ?? []
        if var app = Bundle.main.bundleIdentifier {
            if app.hasSuffix(".NebelWidget") { app.removeLast(".NebelWidget".count) }
            ids.append("group." + app)
        }
        return ids + ["group.de.nojo.nebel"]
    }()
    static let group = candidates.first { FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: $0) != nil }
    static let defaults = group.flatMap { UserDefaults(suiteName: $0) }
}

@available(iOS 16.1, *)
extension NebelActivityAttributes.ContentState {
    static func load() -> Self? {
        NebelShared.defaults?.data(forKey: "last").flatMap { try? JSONDecoder().decode(Self.self, from: $0) }
    }
    func save() { NebelShared.defaults?.set(try? JSONEncoder().encode(self), forKey: "last") }
}
