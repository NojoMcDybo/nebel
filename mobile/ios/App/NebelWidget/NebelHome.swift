import SwiftUI
import WidgetKit

/// Startbildschirm-Widget: letzter Stand aus Reality, abgelegt vom NebelLivePlugin
/// (NebelShared). Kein eigener Takt: Die App stoesst bei jedem neuen Sensorwert ein
/// Neuzeichnen an, iOS entscheidet, wann. Deshalb steht das Alter immer dabei.
struct NebelHome: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "NebelHome", provider: HomeProvider()) { HomeView(e: $0) }
            .configurationDisplayName("nebel.")
            .description("Letzter simulierter Sensorwert aus Reality.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
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

    var body: some View {
        let c = (e.s?.dark ?? true) ? Pal.dark : Pal.light
        Group {
            if let s = e.s {
                let stale = e.date >= s.at.addingTimeInterval(15 * 60)
                (family == .systemMedium ? AnyView(medium(s, c)) : AnyView(reading(s, c, header: true)))
                    .opacity(stale ? 0.5 : 1)
            } else {
                VStack(alignment: .leading) {
                    Text("nebel.").font(.system(size: 15, weight: .heavy)).tracking(-0.5).foregroundStyle(c.ink)
                    Spacer(minLength: 0)
                    Text("Starte Reality in der App.").font(.system(size: 13, weight: .medium)).foregroundStyle(c.ink2)
                    Text(NebelShared.diag).font(mono(7)).foregroundStyle(c.ink3).lineLimit(4)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
        }
        .containerBackground(c.paper, for: .widget)
    }

    private func medium(_ s: NebelActivityAttributes.ContentState, _ c: Pal) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text("nebel.").font(.system(size: 15, weight: .heavy)).tracking(-0.5).foregroundStyle(c.ink)
                Spacer(minLength: 8)
                Text("SIMULATION · \(s.name.uppercased())").font(mono(9)).tracking(1.5).foregroundStyle(c.ink3).lineLimit(1)
            }
            HStack(alignment: .center, spacing: 14) {
                reading(s, c, header: false).fixedSize()
                Graph(g: s.points, c: c)
            }
        }
    }

    /// Wert mit Pfeil, Differenz und Einheit, darunter das Alter des Werts.
    private func reading(_ s: NebelActivityAttributes.ContentState, _ c: Pal, header: Bool) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            if header {
                Text("nebel.").font(.system(size: 15, weight: .heavy)).tracking(-0.5).foregroundStyle(c.ink)
                Spacer(minLength: 0)
            }
            HStack(alignment: .center, spacing: 4) {
                Text(s.value).font(.system(size: 44, weight: .bold)).tracking(-2.2).monospacedDigit()
                    .minimumScaleFactor(0.6).lineLimit(1)
                Arrow(a: s.arrow).font(.system(size: 18, weight: .semibold))
            }
            .foregroundStyle(c.tone(s.tone))
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(s.delta).font(mono(13)).foregroundStyle(c.ink2)
                Text(s.unit.uppercased()).font(mono(9)).tracking(1.6).foregroundStyle(c.ink3)
            }
            (Text("vor ") + Text(timerInterval: s.at...s.at.addingTimeInterval(8 * 3600), countsDown: false, showsHours: false))
                .font(mono(11)).foregroundStyle(c.ink3).lineLimit(1)
        }
        .frame(maxWidth: header ? .infinity : nil, maxHeight: header ? .infinity : nil, alignment: .topLeading)
    }
}
