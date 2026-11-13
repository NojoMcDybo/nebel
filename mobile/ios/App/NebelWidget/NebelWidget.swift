import ActivityKit
import SwiftUI
import WidgetKit

/// Widget-Erweiterung von nebel.: nur die Live-Aktivitaet, keine Home-Widgets.
@main
struct NebelWidgets: WidgetBundle {
    var body: some Widget { NebelLive() }
}

private let ink = Color(red: 0.93, green: 0.95, blue: 0.95)
private func toneColor(_ t: String) -> Color {
    switch t {
    case "low": return Color(red: 1.0, green: 0.44, blue: 0.39)    // --low dunkel
    case "high": return Color(red: 0.91, green: 0.71, blue: 0.29)  // --high dunkel
    default: return ink
    }
}

struct NebelLive: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: NebelActivityAttributes.self) { ctx in
            LockView(s: ctx.state, stale: ctx.isStale)
                .activityBackgroundTint(Color(red: 0.04, green: 0.05, blue: 0.05))
                .activitySystemActionForegroundColor(ink)
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text("\(ctx.state.value) \(ctx.state.arrow)").font(.title2.bold())
                        .foregroundStyle(toneColor(ctx.state.tone))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(ctx.state.unit) · simuliert").font(.caption).foregroundStyle(.secondary)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Spark(points: ctx.state.points).frame(height: 36)
                }
            } compactLeading: {
                Text(ctx.state.value).foregroundStyle(toneColor(ctx.state.tone))
            } compactTrailing: {
                Text(ctx.state.arrow)
            } minimal: {
                Text(ctx.state.value).font(.caption2)
            }
        }
    }
}

struct LockView: View {
    let s: NebelActivityAttributes.ContentState
    let stale: Bool

    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text("nebel. · Simulation").font(.caption2.weight(.semibold)).foregroundStyle(ink.opacity(0.6))
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(s.value).font(.system(size: 40, weight: .semibold, design: .rounded))
                    Text(s.arrow).font(.title2.weight(.semibold))
                    Text(s.unit).font(.caption).foregroundStyle(ink.opacity(0.6))
                }
                .foregroundStyle(toneColor(s.tone))
                (Text(s.name + " · ") + Text(s.at, style: .time) + Text(s.bpm > 0 ? " · \(s.bpm) bpm" : ""))
                    .font(.caption).foregroundStyle(ink.opacity(0.75))
            }
            Spacer(minLength: 0)
            Spark(points: s.points).frame(width: 120, height: 52)
        }
        .padding(16)
        .opacity(stale ? 0.5 : 1)   // kein neuer Wert seit 15 min: App zu oder Gurt weg
        .foregroundStyle(ink)
    }
}

/// Verlauf der letzten Stunde, Zielbereich 70–180 als Band.
struct Spark: View {
    let points: [Double]

    var body: some View {
        GeometryReader { g in
            let lo = 40.0, hi = 300.0
            let y = { (v: Double) -> CGFloat in g.size.height * CGFloat(1 - (min(max(v, lo), hi) - lo) / (hi - lo)) }
            ZStack {
                Rectangle().fill(ink.opacity(0.08))
                    .frame(height: y(70) - y(180)).position(x: g.size.width / 2, y: (y(70) + y(180)) / 2)
                if points.count > 1 {
                    Path { p in
                        for (i, v) in points.enumerated() {
                            let pt = CGPoint(x: g.size.width * CGFloat(i) / CGFloat(points.count - 1), y: y(v))
                            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
                        }
                    }
                    .stroke(ink, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
                }
            }
        }
    }
}
