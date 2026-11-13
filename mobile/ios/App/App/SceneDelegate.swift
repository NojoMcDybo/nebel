import UIKit
import Capacitor
import SwiftUI
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
