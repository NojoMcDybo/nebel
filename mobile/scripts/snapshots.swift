// Rendert Live-Aktivitaet und Startbildschirm-Widgets mit Beispielwerten als PNG, damit
// man das Aussehen ohne iPhone sieht. Laeuft im CI auf dem Mac (.github/workflows/mobile.yml)
// mit denselben Ansichten wie die Widget-Erweiterung. Masse wie iPhone 16 Pro.
// Grenze: ImageRenderer statt echtem Sperr- und Startbildschirm, also ohne die
// Transparenz und den Verlauf, den iOS darueberlegt; der Timer zeigt einen festen Stand.
import SwiftUI
import WidgetKit
import ImageIO
import UniformTypeIdentifiers

#if !canImport(ActivityKit)
protocol ActivityAttributes {}   // ActivityKit gibt es auf dem Mac nicht
#endif

@main
struct Snapshots {
    @MainActor static func main() throws {
        let out = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first ?? "shots")
        try FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)
        let flat: [Double] = [86, 85, 84, 84, 83, 83, 82, 82, 81, 81, 80, 80, 81]
        let rise: [Double] = [150, 158, 166, 175, 184, 193, 202, 210, 218, 226, 233, 239, 245]
        save(sheet(state("81", "ok", "→", "+2", flat, bpm: 72, hard: false)), out, "uebersicht-81")
        save(sheet(state("245", "high", "⇈", "+12", rise, bpm: 164, hard: true)), out, "uebersicht-245")
    }

    static func state(_ v: String, _ tone: String, _ arrow: String, _ delta: String, _ pts: [Double],
                      bpm: Int, hard: Bool) -> NebelActivityAttributes.ContentState {
        .init(value: v, unit: "mg/dL", arrow: arrow, delta: delta, tone: tone, name: "Lena", bpm: bpm, hard: hard,
              at: Date().addingTimeInterval(-234), points: pts, dark: true)
    }

    /// Alles auf einem Blatt: Live-Aktivitaet hell und dunkel, darunter die Widgets.
    @MainActor static func sheet(_ s: NebelActivityAttributes.ContentState) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            lock(s, .dark)
            lock(s, .light)
            HStack(spacing: 16) { widget(s, .black, .systemSmall); widget(s, .light, .systemSmall) }
            widget(s, .black, .systemMedium)
            widget(s, .light, .systemMedium)
        }
        .padding(16)
        .background(Color(white: 0.72))
    }

    @MainActor static func lock(_ s: NebelActivityAttributes.ContentState, _ c: Pal) -> some View {
        LockView(s: s, stale: false, c: c)
            .frame(width: 364)
            .background(c.paper)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    @MainActor static func widget(_ s: NebelActivityAttributes.ContentState, _ c: Pal, _ f: WidgetFamily) -> some View {
        HomeView(e: HomeEntry(date: .now, s: s), c: c, size: f)
            .padding(16)   // Standardrand von WidgetKit
            .frame(width: f == .systemMedium ? 364 : 170, height: 170)
            .background(c.paper)
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    @MainActor static func save<V: View>(_ v: V, _ dir: URL, _ name: String) {
        let r = ImageRenderer(content: v)
        r.scale = 3
        guard let img = r.cgImage,
              let d = CGImageDestinationCreateWithURL(dir.appendingPathComponent(name + ".png") as CFURL,
                                                      UTType.png.identifier as CFString, 1, nil)
        else { print("Bild fehlgeschlagen: \(name)"); exit(1) }
        CGImageDestinationAddImage(d, img, nil)
        CGImageDestinationFinalize(d)
        print("geschrieben: \(name).png")
    }
}
