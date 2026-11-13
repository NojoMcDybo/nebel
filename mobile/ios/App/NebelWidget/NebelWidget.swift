import ActivityKit
import SwiftUI
import WidgetKit

/// Widget-Erweiterung von nebel.: nur die Live-Aktivitaet, keine Home-Widgets.
@main
struct NebelWidgets: WidgetBundle {
    var body: some Widget { NebelLive() }
}

// Dunkles Schema der App (app/template.html, html[data-theme="dark"]).
private func rgb(_ r: Double, _ g: Double, _ b: Double) -> Color { Color(red: r / 255, green: g / 255, blue: b / 255) }
private let paper = rgb(14, 18, 19), card = rgb(25, 30, 32)
private let ink = rgb(233, 239, 239), ink2 = rgb(163, 174, 174), ink3 = rgb(126, 138, 138)
private let low = rgb(255, 112, 99), high = rgb(232, 180, 74)

private func toneColor(_ t: String) -> Color { t == "low" ? low : t == "high" ? high : ink }
private func toneColor(mg v: Double) -> Color { v < 70 ? low : v > 180 ? high : ink }
// Schriften der App: Plus Jakarta Sans -> SF, DM Mono -> SF Mono.
private func mono(_ size: CGFloat, _ w: Font.Weight = .medium) -> Font { .system(size: size, weight: w, design: .monospaced) }

struct NebelLive: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: NebelActivityAttributes.self) { ctx in
            LockView(s: ctx.state, stale: ctx.isStale)
                .activityBackgroundTint(paper)
                .activitySystemActionForegroundColor(ink)
        } dynamicIsland: { ctx in
            let s = ctx.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 4) {
                        Text(s.value).font(.system(size: 28, weight: .heavy)).tracking(-1.4)
                        Arrow(a: s.arrow).font(.system(size: 14, weight: .bold))
                    }
                    .foregroundStyle(toneColor(s.tone)).padding(.leading, 6)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Pulse(bpm: s.bpm).padding(.trailing, 6)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Graph(g: s.points, hr: s.pulse).frame(height: 46).padding(.horizontal, 6)
                }
            } compactLeading: {
                Text(s.value).font(.system(size: 15, weight: .heavy)).foregroundStyle(toneColor(s.tone))
            } compactTrailing: {
                Arrow(a: s.arrow).font(.system(size: 12, weight: .bold)).foregroundStyle(toneColor(s.tone))
            } minimal: {
                Text(s.value).font(.system(size: 12, weight: .heavy)).foregroundStyle(toneColor(s.tone))
            }
        }
    }
}

struct LockView: View {
    let s: NebelActivityAttributes.ContentState
    let stale: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text("nebel.").font(.system(size: 15, weight: .heavy)).tracking(-0.5).foregroundStyle(ink)
                Spacer(minLength: 8)
                Text("SIMULATION · \(s.name.uppercased())").font(mono(9)).tracking(1.6).foregroundStyle(ink3).lineLimit(1)
            }
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 5) {
                    HStack(alignment: .center, spacing: 5) {
                        Text(s.value).font(.system(size: 44, weight: .heavy)).tracking(-2.6).monospacedDigit()
                        Arrow(a: s.arrow).font(.system(size: 18, weight: .bold))
                    }
                    .foregroundStyle(toneColor(s.tone))
                    Text(s.unit.uppercased()).font(mono(9)).tracking(1.8).foregroundStyle(ink3)
                    HStack(spacing: 8) {
                        Pulse(bpm: s.bpm)
                        Text(s.at, style: .time).font(mono(11)).foregroundStyle(ink3)
                    }
                }
                .fixedSize()
                Graph(g: s.points, hr: s.pulse)
                    .padding(8)
                    .background(card, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .frame(height: 86)
            }
        }
        .padding(14)
        .opacity(stale ? 0.5 : 1)   // kein neuer Wert seit 15 min: App zu oder Gurt weg
    }
}

struct Pulse: View {
    let bpm: Int
    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: "heart.fill").font(.system(size: 9))
            Text("\(bpm)").font(mono(11)) + Text(" BPM").font(mono(8)).tracking(1)
        }
        .foregroundStyle(ink2)
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
/// 40–400 mit Zielband 70–180, Puls als Linie (40–190 bpm). Ganz rechts die
/// Nebelzone: Der Sensor zeigt den Zucker von vor fuenf Minuten, der Puls reicht bis jetzt.
struct Graph: View {
    let g: [Double]
    let hr: [Double]

    var body: some View {
        Canvas { c, size in
            let n = g.count
            guard n > 1 else { return }
            let w = size.width, h = size.height
            let r: CGFloat = 3                           // Rand, damit Punkte am Rand ganz bleiben
            let slot = (w - r) / CGFloat(n)              // n-1 Abstaende plus ein Feld Nebel
            let x = { (i: Int) -> CGFloat in r + CGFloat(i) * slot }
            let gy = { (v: Double) -> CGFloat in r + (h - 2 * r) * CGFloat(1 - log(min(max(v, 40), 400) / 40) / log(10)) }
            let py = { (b: Double) -> CGFloat in r + (h - 2 * r) * CGFloat(1 - (min(max(b, 40), 190) - 40) / 150) }
            let now = x(n - 1)

            c.fill(Path(CGRect(x: 0, y: gy(180), width: now + 3, height: gy(70) - gy(180))), with: .color(ink.opacity(0.06)))
            for (v, col, a) in [(70.0, low, 0.9), (180.0, high, 0.78)] {
                var l = Path(); l.move(to: CGPoint(x: 0, y: gy(v))); l.addLine(to: CGPoint(x: w, y: gy(v)))
                c.stroke(l, with: .color(col.opacity(a)), lineWidth: 1)
            }

            c.fill(Path(CGRect(x: now, y: 0, width: w - now, height: h)),
                   with: .linearGradient(Gradient(colors: [card.opacity(0), card.opacity(0.98)]),
                                         startPoint: CGPoint(x: now, y: 0), endPoint: CGPoint(x: w, y: 0)))
            var fog = Path(); fog.move(to: CGPoint(x: now, y: 0)); fog.addLine(to: CGPoint(x: now, y: h))
            c.stroke(fog, with: .color(ink.opacity(0.22)), style: StrokeStyle(lineWidth: 1, dash: [2, 3]))

            if hr.count > 1 {
                var p = Path()
                for (i, b) in hr.enumerated() {
                    let pt = CGPoint(x: x(i + 1), y: py(b))   // eine Stelle rechts: Puls ohne Verzoegerung
                    if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
                }
                var area = p
                area.addLine(to: CGPoint(x: x(hr.count), y: h)); area.addLine(to: CGPoint(x: x(1), y: h)); area.closeSubpath()
                c.fill(area, with: .color(ink.opacity(0.07)))
                c.stroke(p, with: .color(ink.opacity(0.5)), style: StrokeStyle(lineWidth: 1.5, lineCap: .round, lineJoin: .round))
            }

            for (i, v) in g.enumerated() {
                c.fill(Path(ellipseIn: CGRect(x: x(i) - 2.5, y: gy(v) - 2.5, width: 5, height: 5)), with: .color(toneColor(mg: v)))
            }
        }
    }
}
