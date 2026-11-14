import SwiftUI
import WidgetKit

/// Startbildschirm-Widgets: letzter Stand aus Reality, abgelegt vom NebelLivePlugin
/// (NebelShared). Kein eigener Takt: Die App stoesst bei jedem neuen Sensorwert ein
/// Neuzeichnen an, iOS entscheidet, wann. Deshalb steht das Alter immer dabei.
/// Hell und dunkel als eigene Widgets in der Auswahl, fest und ohne Umschalten.
struct NebelHomeDark: Widget {
    var body: some WidgetConfiguration { homeConfig(kind: "NebelHomeDark", name: "nebel. dunkel", dark: true) }
}
struct NebelHomeLight: Widget {
    var body: some WidgetConfiguration { homeConfig(kind: "NebelHomeLight", name: "nebel. hell", dark: false) }
}

private func homeConfig(kind: String, name: String, dark: Bool) -> some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: HomeProvider()) { HomeView(e: $0, c: dark ? .black : .light) }
        .configurationDisplayName(name)
        .description("Letzter simulierter Sensorwert aus Reality.")
        .supportedFamilies([.systemSmall, .systemMedium])
}

struct HomeEntry: TimelineEntry {
    let date: Date
    let s: NebelActivityAttributes.ContentState?
}

struct HomeProvider: TimelineProvider {
    func placeholder(in context: Context) -> HomeEntry { HomeEntry(date: .now, s: nil) }
    func getSnapshot(in context: Context, completion: @escaping (HomeEntry) -> Void) {
        completion(HomeEntry(date: .now, s: .load()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<HomeEntry>) -> Void) {
        let s = NebelActivityAttributes.ContentState.load()
        var entries = [HomeEntry(date: .now, s: s)]
        // 15 min ohne neuen Wert: einmal blass zeichnen, wie die Live-Aktivitaet
        if let s, s.at.addingTimeInterval(15 * 60) > .now { entries.append(HomeEntry(date: s.at.addingTimeInterval(15 * 60), s: s)) }
        completion(Timeline(entries: entries, policy: .never))
    }
}

struct HomeView: View {
    @Environment(\.widgetFamily) private var family
    let e: HomeEntry
    let c: Pal

    var body: some View {
        Group {
            if let s = e.s {
                let stale = e.date >= s.at.addingTimeInterval(15 * 60)
                Group {
                    if family == .systemMedium { medium(s) } else { small(s) }
                }
                .opacity(stale ? 0.5 : 1)
            } else {
                VStack(alignment: .leading) {
                    logo
                    Spacer(minLength: 0)
                    Text("Starte Reality in der App.").font(.system(size: 13, weight: .medium)).foregroundStyle(c.ink2)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
        }
        .containerBackground(c.paper, for: .widget)
    }

    private var logo: some View {
        Text("nebel.").font(.system(size: 15, weight: .heavy)).tracking(-0.5).foregroundStyle(c.ink)
    }

    private func small(_ s: NebelActivityAttributes.ContentState) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            logo
            Spacer(minLength: 0)
            value(s, size: 54)
            Text(s.unit.uppercased()).font(mono(9)).tracking(1.6).foregroundStyle(c.ink3)
            age(s)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private func medium(_ s: NebelActivityAttributes.ContentState) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                logo
                Spacer(minLength: 8)
                Text("SIMULATION · \(s.name.uppercased())").font(mono(9)).tracking(1.5).foregroundStyle(c.ink3).lineLimit(1)
            }
            HStack(alignment: .center, spacing: 14) {
                VStack(alignment: .leading, spacing: 3) {
                    value(s, size: 50)
                    Text(s.unit.uppercased()).font(mono(9)).tracking(1.6).foregroundStyle(c.ink3)
                    age(s)
                }
                .frame(width: 128, alignment: .leading)
                Graph(g: s.points, c: c)
            }
            .frame(maxHeight: .infinity)
        }
    }

    /// Wert dicht gesetzt, rechts daneben die Differenz ueber dem Pfeil.
    private func value(_ s: NebelActivityAttributes.ContentState, size: CGFloat) -> some View {
        HStack(alignment: .center, spacing: 5) {
            Text(s.value).font(.system(size: size, weight: .heavy)).tracking(-size * 0.075).monospacedDigit()
                .minimumScaleFactor(0.6).lineLimit(1)
                .foregroundStyle(c.tone(s.tone))
            VStack(alignment: .leading, spacing: 1) {
                Text(s.delta).font(mono(13)).foregroundStyle(c.ink2).lineLimit(1)
                Arrow(a: s.arrow).font(.system(size: 18, weight: .semibold)).foregroundStyle(c.tone(s.tone))
            }
            .fixedSize()
        }
    }

    // Feste Breite: Ein Timer-Text nimmt sonst so viel Platz, wie er bekommt.
    private func age(_ s: NebelActivityAttributes.ContentState) -> some View {
        (Text("vor ") + Text(timerInterval: s.at...s.at.addingTimeInterval(8 * 3600), countsDown: false, showsHours: false))
            .font(mono(11)).foregroundStyle(c.ink3).lineLimit(1)
            .frame(width: 90, alignment: .leading)
    }
}
