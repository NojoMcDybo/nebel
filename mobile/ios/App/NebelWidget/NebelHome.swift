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
    @Environment(\.widgetFamily) private var envFamily
    let e: HomeEntry
    let c: Pal
    var size: WidgetFamily? = nil   // fuer scripts/snapshots.swift, sonst von iOS
    private var family: WidgetFamily { size ?? envFamily }

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
            HStack(alignment: .firstTextBaseline) {
                logo
                Spacer(minLength: 6)
                Text("SIMULATION").font(mono(9)).tracking(1.5).foregroundStyle(c.ink3).lineLimit(1)
            }
            Spacer(minLength: 0)
            value(s)
            footer(s)
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
                    value(s)
                    footer(s)
                }
                .frame(width: 150, alignment: .leading)
                Graph(g: s.points, c: c)
            }
            .frame(maxHeight: .infinity)
        }
    }

    /// Wert so gross wie die Breite erlaubt, rechts daneben die Differenz ueber dem Pfeil.
    /// Groesse nach Stellenzahl statt nur minimumScaleFactor: Der Zeichenabstand schrumpft
    /// beim Verkleinern nicht mit, dreistellig stiessen die Ziffern sonst aneinander.
    private func value(_ s: NebelActivityAttributes.ContentState) -> some View {
        let size: CGFloat = s.value.count >= 3 ? 54 : 80
        return HStack(alignment: .center, spacing: 6) {
            Text(s.value).font(.system(size: size, weight: .heavy)).tracking(-size * 0.055).monospacedDigit()
                .minimumScaleFactor(0.5).lineLimit(1).layoutPriority(1)
                .foregroundStyle(c.tone(s.tone))
            VStack(alignment: .leading, spacing: 4) {
                Text(s.delta).font(mono(15)).foregroundStyle(c.ink2).lineLimit(1)
                Arrow(a: s.arrow).font(.system(size: 24, weight: .semibold)).foregroundStyle(c.tone(s.tone))
            }
            .fixedSize()
        }
    }

    /// Einheit und Alter in einer Zeile. Feste Breite fuer den Timer-Text: Er nimmt sonst
    /// so viel Platz, wie er bekommt.
    private func footer(_ s: NebelActivityAttributes.ContentState) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text(s.unit.uppercased()).font(mono(9)).tracking(1.4).fixedSize()
            (Text("vor ") + Text(timerInterval: s.at...s.at.addingTimeInterval(8 * 3600), countsDown: false, showsHours: false))
                .font(mono(11)).lineLimit(1)
                .frame(width: 66, alignment: .leading)
        }
        .foregroundStyle(c.ink3)
    }
}
