import UIKit
import Capacitor
import SwiftUI
import HealthKit
import ActivityKit
import WidgetKit
#if canImport(AlarmKit)
import AlarmKit
#endif

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = NebelBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

// nebel.: eigene Plugins der App. Steht hier statt in einer eigenen Datei, damit
// die Xcode-Projektdatei unangetastet bleibt.
class NebelBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(NebelAlarmPlugin())
        bridge?.registerPluginInstance(NebelHealthPlugin())
        bridge?.registerPluginInstance(NebelLivePlugin())
        bridge?.registerPluginInstance(NebelSharePlugin())
    }
}

/// Teilen-Blatt von iOS fuer die Klarsicht-Karte: Bild und Text. Die WebView kann
/// navigator.share mit Dateien nicht verlaesslich. JS: NebelShare.share({ text, png: base64 })
/// -> { done }. Nur was der Nutzer selbst teilt, verlaesst das Geraet.
@objc(NebelSharePlugin)
public class NebelSharePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NebelSharePlugin"
    public let jsName = "NebelShare"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise)]

    @objc func share(_ call: CAPPluginCall) {
        var items: [Any] = []
        if let b = call.getString("png"), let d = Data(base64Encoded: b), let img = UIImage(data: d) { items.append(img) }
        if let t = call.getString("text"), !t.isEmpty { items.append(t) }
        DispatchQueue.main.async {
            guard let vc = self.bridge?.viewController, !items.isEmpty else { return call.resolve(["done": false]) }
            let a = UIActivityViewController(activityItems: items, applicationActivities: nil)
            a.popoverPresentationController?.sourceView = vc.view   // iPad: sonst Absturz
            a.popoverPresentationController?.sourceRect = CGRect(x: vc.view.bounds.midX, y: vc.view.bounds.maxY - 80, width: 1, height: 1)
            a.completionWithItemsHandler = { _, done, _, _ in call.resolve(["done": done]) }
            vc.present(a, animated: true)
        }
    }
}

#if canImport(AlarmKit)
@available(iOS 26.0, *)
struct NebelAlarmData: AlarmMetadata {}
#endif

/// Wecker über AlarmKit (ab iOS 26): klingelt wie der iPhone-Wecker, auch im
/// Lautlos-Modus und im Fokus. JS: window.Capacitor.Plugins.NebelAlarm.
/// alarms: [{ at: ms seit Epoche, title }]. replace ersetzt alle Wecker von nebel.
@objc(NebelAlarmPlugin)
public class NebelAlarmPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NebelAlarmPlugin"
    public let jsName = "NebelAlarm"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "state", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ask", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "replace", returnType: CAPPluginReturnPromise),
    ]

    @objc func state(_ call: CAPPluginCall) {
        #if canImport(AlarmKit)
        if #available(iOS 26.0, *) {
            return call.resolve(["state": Self.name(AlarmManager.shared.authorizationState)])
        }
        #endif
        call.resolve(["state": "unsupported"])
    }

    @objc func ask(_ call: CAPPluginCall) {
        #if canImport(AlarmKit)
        if #available(iOS 26.0, *) {
            Task {
                do { call.resolve(["state": Self.name(try await AlarmManager.shared.requestAuthorization())]) }
                catch { call.resolve(["state": "denied", "error": "\(error)"]) }
            }
            return
        }
        #endif
        call.resolve(["state": "unsupported"])
    }

    @objc func replace(_ call: CAPPluginCall) {
        #if canImport(AlarmKit)
        if #available(iOS 26.0, *) {
            let items = call.getArray("alarms", JSObject.self) ?? []
            Task {
                let m = AlarmManager.shared
                for a in (try? m.alarms) ?? [] { try? m.cancel(id: a.id) }
                var n = 0, lastError = ""
                for item in items {
                    guard let at = item["at"] as? Double, let title = item["title"] as? String else { continue }
                    let alert = AlarmPresentation.Alert(
                        title: LocalizedStringResource(stringLiteral: title),
                        stopButton: AlarmButton(text: "Aus", textColor: .white, systemImageName: "stop.circle"))
                    let attrs = AlarmAttributes<NebelAlarmData>(
                        presentation: AlarmPresentation(alert: alert), metadata: NebelAlarmData(), tintColor: .blue)
                    let cfg = AlarmManager.AlarmConfiguration<NebelAlarmData>(
                        schedule: .fixed(Date(timeIntervalSince1970: at / 1000)), attributes: attrs)
                    do { _ = try await m.schedule(id: UUID(), configuration: cfg); n += 1 }
                    catch { lastError = "\(error)" }
                }
                call.resolve(["scheduled": n, "error": lastError])
            }
            return
        }
        #endif
        call.reject("unsupported")
    }

    #if canImport(AlarmKit)
    @available(iOS 26.0, *)
    static func name(_ s: AlarmManager.AuthorizationState) -> String {
        switch s {
        case .authorized: return "authorized"
        case .denied: return "denied"
        case .notDetermined: return "notDetermined"
        @unknown default: return "denied"
        }
    }
    #endif
}

/// Puls aus Apple Health (Phase 5): fuellt Luecken, in denen der Gurt nicht verbunden
/// war, etwa wenn das Handy beim Sport auf der Bank lag und Zepp das Training
/// spaeter nach Health schreibt. Nur lesen, nur Herzfrequenz, alles bleibt auf dem iPhone.
/// JS: NebelHealth.heartRate({ from, to }) -> { samples: [{ t: ms seit Epoche, bpm }] }
/// NebelHealth.restingHeartRate({ days }) -> { bpm: Mittel der Tageswerte oder 0, n }
/// (Ruhepuls schreibt meist nur die Apple Watch; ohne sie misst die App selbst.)
@objc(NebelHealthPlugin)
public class NebelHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NebelHealthPlugin"
    public let jsName = "NebelHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "ask", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "heartRate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restingHeartRate", returnType: CAPPluginReturnPromise),
    ]
    private let store = HKHealthStore()
    private let hr = HKObjectType.quantityType(forIdentifier: .heartRate)!
    private let rest = HKObjectType.quantityType(forIdentifier: .restingHeartRate)!

    @objc func ask(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.resolve(["ok": false, "error": "unavailable"]) }
        store.requestAuthorization(toShare: nil, read: [hr, rest]) { ok, err in
            call.resolve(["ok": ok, "error": err.map { "\($0)" } ?? ""])
        }
    }

    @objc func heartRate(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.resolve(["samples": [JSObject]()]) }
        let from = Date(timeIntervalSince1970: (call.getDouble("from") ?? 0) / 1000)
        let to = Date(timeIntervalSince1970: (call.getDouble("to") ?? 0) / 1000)
        let pred = HKQuery.predicateForSamples(withStart: from, end: to, options: [])
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let unit = HKUnit.count().unitDivided(by: .minute())
        let q = HKSampleQuery(sampleType: hr, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, results, err in
            if let err = err { return call.reject("\(err)") }
            let out: [JSObject] = (results as? [HKQuantitySample] ?? []).map {
                ["t": $0.startDate.timeIntervalSince1970 * 1000, "bpm": $0.quantity.doubleValue(for: unit)]
            }
            call.resolve(["samples": out])
        }
        store.execute(q)
    }

    @objc func restingHeartRate(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.resolve(["bpm": 0, "n": 0]) }
        let days = Double(call.getInt("days") ?? 7)
        let pred = HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-days * 86400), end: Date(), options: [])
        let unit = HKUnit.count().unitDivided(by: .minute())
        let q = HKSampleQuery(sampleType: rest, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, results, _ in
            let v = (results as? [HKQuantitySample] ?? []).map { $0.quantity.doubleValue(for: unit) }
            call.resolve(["bpm": v.isEmpty ? 0 : v.reduce(0, +) / Double(v.count), "n": v.count])
        }
        store.execute(q)
    }
}

/// Live-Aktivitaet auf dem Sperrbildschirm (Typ in NebelWidget/NebelActivity.swift).
/// update startet sie, wenn keine laeuft; starten darf iOS nur die geoeffnete App,
/// aktualisieren auch die gesperrte. Nach 8 h beendet iOS sie, beim naechsten
/// Oeffnen startet eine neue. JS: NebelLive.update({ value, unit, arrow, tone, name,
/// delta, bpm, hard, at: ms, points: [mg/dL], dark }) -> { state }, NebelLive.end()
@objc(NebelLivePlugin)
public class NebelLivePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NebelLivePlugin"
    public let jsName = "NebelLive"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
    ]

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { return call.resolve(["state": "unsupported"]) }
        let at = (call.getDouble("at") ?? Date().timeIntervalSince1970 * 1000) / 1000
        let s = NebelActivityAttributes.ContentState(
            value: call.getString("value") ?? "", unit: call.getString("unit") ?? "",
            arrow: call.getString("arrow") ?? "", delta: call.getString("delta") ?? "", tone: call.getString("tone") ?? "ok",
            name: call.getString("name") ?? "", bpm: call.getInt("bpm") ?? 0, hard: call.getBool("hard") ?? false,
            at: Date(timeIntervalSince1970: at),
            points: (call.getArray("points") ?? []).compactMap { ($0 as? NSNumber)?.doubleValue },
            dark: call.getBool("dark") ?? true)
        // Startbildschirm-Widget: Stand immer ablegen, neu zeichnen nur bei neuem Wert,
        // nicht bei jedem Pulswert (iOS teilt die Neuladungen zu).
        let old = NebelActivityAttributes.ContentState.load()
        s.save()
        if old?.at != s.at { WidgetCenter.shared.reloadAllTimelines() }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return call.resolve(["state": "off"]) }
        let content = ActivityContent(state: s, staleDate: s.at.addingTimeInterval(15 * 60))
        Task {
            let all = Activity<NebelActivityAttributes>.activities
            if let a = all.first(where: { $0.activityState == .active || $0.activityState == .stale }) {
                await a.update(content)
                return call.resolve(["state": "updated"])
            }
            for a in all { await a.end(nil, dismissalPolicy: .immediate) }   // abgelaufene weg
            do {
                _ = try Activity.request(attributes: NebelActivityAttributes(), content: content, pushType: nil)
                call.resolve(["state": "started"])
            } catch { call.resolve(["state": "failed", "error": "\(error)"]) }
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        NebelShared.defaults?.removeObject(forKey: "last")   // Reality vorbei: Widget zeigt den Hinweis
        WidgetCenter.shared.reloadAllTimelines()
        guard #available(iOS 16.2, *) else { return call.resolve() }
        Task {
            for a in Activity<NebelActivityAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
            call.resolve()
        }
    }
}
