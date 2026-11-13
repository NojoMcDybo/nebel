import UIKit
import Capacitor
import SwiftUI
import HealthKit
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
@objc(NebelHealthPlugin)
public class NebelHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NebelHealthPlugin"
    public let jsName = "NebelHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "ask", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "heartRate", returnType: CAPPluginReturnPromise),
    ]
    private let store = HKHealthStore()
    private let hr = HKObjectType.quantityType(forIdentifier: .heartRate)!

    @objc func ask(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { return call.resolve(["ok": false, "error": "unavailable"]) }
        store.requestAuthorization(toShare: nil, read: [hr]) { ok, err in
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
}
