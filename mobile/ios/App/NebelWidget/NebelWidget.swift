import ActivityKit
import SwiftUI
import WidgetKit

/// Widget-Erweiterung von nebel.: nur die Live-Aktivitaet, keine Home-Widgets.
@main
struct NebelWidgets: WidgetBundle {
    var body: some Widget { NebelLive() }
}

// Farben der App (app/template.html, :root und html[data-theme="dark"]), nach ihrer Einstellung.
private func rgb(_ r: Double, _ g: Double, _ b: Double) -> Color { Color(red: r / 255, green: g / 255, blue: b / 255) }
struct Pal {
    let paper, ink, ink2, ink3, low, high: Color
    static let dark = Pal(paper: rgb(14, 18, 19), ink: rgb(233, 239, 239), ink2: rgb(163, 174, 174),
                          ink3: rgb(126, 138, 138), low: rgb(255, 112, 99), high: rgb(232, 180, 74))
    static let light = Pal(paper: rgb(237, 241, 241), ink: rgb(10, 13, 13), ink2: rgb(87, 98, 98),
                           ink3: rgb(95, 106, 106), low: rgb(184, 54, 43), high: rgb(142, 100, 16))
    func tone(_ t: String) -> Color { t == "low" ? low : t == "high" ? high : ink }
    func tone(mg v: Double) -> Color { v < 70 ? low : v > 180 ? high : ink }
}
// Schriften der App: Plus Jakarta Sans -> SF, DM Mono -> SF Mono.
private func mono(_ size: CGFloat, _ w: Font.Weight = .medium) -> Font { .system(size: size, weight: w, design: .monospaced) }

struct NebelLive: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: NebelActivityAttributes.self) { ctx in
            let c = ctx.state.dark ? Pal.dark : Pal.light
            LockView(s: ctx.state, stale: ctx.isStale, c: c)
                .activityBackgroundTint(c.paper)
                .activitySystemActionForegroundColor(c.ink)
        } dynamicIsland: { ctx in
            let s = ctx.state, c = Pal.dark   // die Insel ist immer schwarz
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 4) {
                        Text(s.value).font(.system(size: 28, weight: .heavy)).tracking(-1.4)
                        Arrow(a: s.arrow).font(.system(size: 14, weight: .bold))
                    }
                    .foregroundStyle(c.tone(s.tone)).padding(.leading, 6)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Pulse(bpm: s.bpm, hard: s.hard, c: c).padding(.trailing, 6)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Graph(g: s.points, c: c).frame(height: 46).padding(.horizontal, 6)
                }
            } compactLeading: {
                Text(s.value).font(.system(size: 15, weight: .heavy)).foregroundStyle(c.tone(s.tone))
            } compactTrailing: {
                Arrow(a: s.arrow).font(.system(size: 12, weight: .bold)).foregroundStyle(c.tone(s.tone))
            } minimal: {
                Text(s.value).font(.system(size: 12, weight: .heavy)).foregroundStyle(c.tone(s.tone))
            }
        }
    }
}

struct LockView: View {
    let s: NebelActivityAttributes.ContentState
    let stale: Bool
    let c: Pal

    var body: some View {
        // iOS erlaubt hoechstens 160 pt Hoehe; so sind es etwa 150.
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text("nebel.").font(.system(size: 17, weight: .heavy)).tracking(-0.6).foregroundStyle(c.ink)
                Spacer(minLength: 8)
                Text("SIMULATION · \(s.name.uppercased())").font(mono(10)).tracking(1.6).foregroundStyle(c.ink3).lineLimit(1)
            }
            // Mitte des Graphen auf Hoehe der Mitte des Werts
            HStack(alignment: .valueMid, spacing: 14) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .center, spacing: 6) {
                        Text(s.value).font(.system(size: 56, weight: .bold)).tracking(-2.8).monospacedDigit()
                        Arrow(a: s.arrow).font(.system(size: 22, weight: .semibold))
                        VStack(alignment: .leading, spacing: 3) {
                            Text(s.delta).font(mono(17)).foregroundStyle(c.ink2)
                            Text(s.unit.uppercased()).font(mono(10)).tracking(1.8).foregroundStyle(c.ink3)
                        }
                    }
                    .foregroundStyle(c.tone(s.tone))
                    .alignmentGuide(.valueMid) { $0[VerticalAlignment.center] }
                    HStack(spacing: 10) {
                        Pulse(bpm: s.bpm, hard: s.hard, c: c)
                        // Timer-Text nimmt sonst alle Breite und quetscht "vor" um
                        (Text("vor ") + Text(timerInterval: s.at...s.at.addingTimeInterval(8 * 3600), countsDown: false, showsHours: false))
                            .font(mono(12)).foregroundStyle(c.ink3).lineLimit(1).frame(width: 82, alignment: .leading)
                    }
                }
                .fixedSize()
                Graph(g: s.points, c: c).frame(height: 72)
                    .alignmentGuide(.valueMid) { $0[VerticalAlignment.center] }
            }
        }
        .padding(.horizontal, 18).padding(.vertical, 15)
        .opacity(stale ? 0.5 : 1)   // kein neuer Wert seit 15 min: App zu oder Gurt weg
    }
}

private extension VerticalAlignment {
    enum ValueMid: AlignmentID { static func defaultValue(in d: ViewDimensions) -> CGFloat { d[VerticalAlignment.center] } }
    static let valueMid = VerticalAlignment(ValueMid.self)
}

/// Puls mit Zone: ueber der ventilatorischen Schwelle (anaerob) Herz mit Blitz in der
/// Farbe fuer "hoch", weil die Leber dann Zucker freigibt; darunter (aerob) ruhig grau.
struct Pulse: View {
    let bpm: Int
    let hard: Bool
    let c: Pal
    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: hard ? "bolt.heart.fill" : "heart.fill").font(.system(size: hard ? 12 : 10))
            Text("\(bpm)").font(mono(12)) + Text(" BPM").font(mono(9)).tracking(1)
        }
        .foregroundStyle(hard ? c.high : c.ink2)
    }
}

/// Pfeile wie in der App: sieben Stufen, doppelt ab 3 mg/dL pro Minute.
struct Arrow: View {
    let a: String
    var body: some View {
        let m: [String: (String, Int)] = ["⇈": ("arrow.up", 2), "↑": ("arrow.up", 1), "↗": ("arrow.up.right", 1),
                                          "→": ("arrow.right", 1), "↘": ("arrow.down.right", 1), "↓": ("arrow.down", 1),
                                          "⇊": ("arrow.down", 2)]
        let e = m[a] ?? ("arrow.right", 1)
        HStack(spacing: -3) { ForEach(0..<e.1, id: \.self) { _ in Image(systemName: e.0) } }
    }
}

/// Letzte Stunde wie der Verlauf in der App: Sensorwerte als Punkte auf log. Skala
/// 40–400 mit Zielband 70–180. Ganz rechts die Nebelzone: Der Sensor zeigt den
/// Zucker von vor fuenf Minuten.
struct Graph: View {
    let g: [Double]
    let c: Pal

    var body: some View {
        Canvas { cv, size in
            let n = g.count
            guard n > 1 else { return }
            let w = size.width, h = size.height
            let r: CGFloat = 3                           // Rand, damit Punkte am Rand ganz bleiben
            let slot = (w - r) / CGFloat(n)              // n-1 Abstaende plus ein Feld Nebel
            let x = { (i: Int) -> CGFloat in r + CGFloat(i) * slot }
            let gy = { (v: Double) -> CGFloat in r + (h - 2 * r) * CGFloat(1 - log(min(max(v, 40), 400) / 40) / log(10)) }
            let now = x(n - 1)

            cv.fill(Path(CGRect(x: 0, y: gy(180), width: now + 3, height: gy(70) - gy(180))), with: .color(c.ink.opacity(0.06)))
            for (v, col, a) in [(70.0, c.low, 0.9), (180.0, c.high, 0.78)] {
                var l = Path(); l.move(to: CGPoint(x: 0, y: gy(v))); l.addLine(to: CGPoint(x: w, y: gy(v)))
                cv.stroke(l, with: .color(col.opacity(a)), lineWidth: 1)
            }

            cv.fill(Path(CGRect(x: now, y: 0, width: w - now, height: h)),
                   with: .linearGradient(Gradient(colors: [c.paper.opacity(0), c.paper.opacity(0.98)]),
                                         startPoint: CGPoint(x: now, y: 0), endPoint: CGPoint(x: w, y: 0)))
            var fog = Path(); fog.move(to: CGPoint(x: now, y: 0)); fog.addLine(to: CGPoint(x: now, y: h))
            cv.stroke(fog, with: .color(c.ink.opacity(0.22)), style: StrokeStyle(lineWidth: 1, dash: [2, 3]))

            for (i, v) in g.enumerated() {
                cv.fill(Path(ellipseIn: CGRect(x: x(i) - 2.5, y: gy(v) - 2.5, width: 5, height: 5)), with: .color(c.tone(mg: v)))
            }
        }
    }
}
