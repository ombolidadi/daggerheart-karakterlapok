// Daggerheart Karakterlapok – native macOS shell.
// A window with a WKWebView that runs the bundled web app, plus what a web page cannot do in WebKit:
// keeping the save file on disk, save dialogs for exports, printing, and file pickers.
import Cocoa
import WebKit

let appName = "Daggerheart Karakterlapok"

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKUIDelegate, WKNavigationDelegate {
    var window: NSWindow!
    var web: WKWebView!
    let fm = FileManager.default

    lazy var dataDir: URL = {
        let d = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent(appName, isDirectory: true)
        try? fm.createDirectory(at: d, withIntermediateDirectories: true)
        return d
    }()
    var saveURL: URL { dataDir.appendingPathComponent("karakterek.json") }

    /// A Swift string as a JavaScript string literal.
    func jsString(_ s: String) -> String {
        let d = try! JSONSerialization.data(withJSONObject: [s])
        return String(String(data: d, encoding: .utf8)!.dropFirst().dropLast())
    }
    func js(_ code: String) { web.evaluateJavaScript(code, completionHandler: nil) }

    func applicationDidFinishLaunching(_ note: Notification) {
        buildMenu()
        let cfg = WKWebViewConfiguration()
        let ucc = WKUserContentController()
        ucc.add(self, name: "dh")
        let saved = (try? String(contentsOf: saveURL, encoding: .utf8)) ?? ""
        let boot = "window.DH_NATIVE_DATA=\(jsString(saved));window.DH_NATIVE_PATH=\(jsString(saveURL.path));"
            + "window.addEventListener('error',function(e){try{webkit.messageHandlers.dh.postMessage({type:'log',msg:String(e.message)+' @'+e.lineno})}catch(x){}});"
        ucc.addUserScript(WKUserScript(source: boot, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        cfg.userContentController = ucc

        web = WKWebView(frame: .zero, configuration: cfg)
        web.uiDelegate = self
        web.navigationDelegate = self

        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1180, height: 860),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = appName
        window.minSize = NSSize(width: 380, height: 520)
        window.contentView = web
        window.center()
        window.setFrameAutosaveName("main")
        window.makeKeyAndOrderFront(nil)

        let dir = Bundle.main.resourceURL!.appendingPathComponent("web", isDirectory: true)
        web.loadFileURL(dir.appendingPathComponent("index.html"), allowingReadAccessTo: dir)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    // Give a pending save a moment to reach the disk before quitting.
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        web.evaluateJavaScript("window.dhFlushNow&&window.dhFlushNow()") { _, _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { NSApp.reply(toApplicationShouldTerminate: true) }
        }
        return .terminateLater
    }

    // MARK: messages from the page

    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "save":
            guard let json = body["json"] as? String, !json.isEmpty else { return }
            do {
                backupOncePerDay()
                try json.write(to: saveURL, atomically: true, encoding: .utf8)
                js("window.dhNativeSaved&&window.dhNativeSaved(true)")
            } catch {
                js("window.dhNativeSaved&&window.dhNativeSaved(false,\(jsString(error.localizedDescription)))")
            }
        case "download":
            guard let name = body["name"] as? String, let data = body["data"] as? String else { return }
            let panel = NSSavePanel()
            panel.nameFieldStringValue = name
            panel.beginSheetModal(for: window) { r in
                if r == .OK, let url = panel.url { try? data.write(to: url, atomically: true, encoding: .utf8) }
            }
        case "print":
            printPage(nil)
        case "log":
            NSLog("page error: %@", body["msg"] as? String ?? "")
        case "reveal":
            if fm.fileExists(atPath: saveURL.path) { NSWorkspace.shared.activateFileViewerSelecting([saveURL]) }
            else { NSWorkspace.shared.open(dataDir) }
        default:
            break
        }
    }

    /// Keeps yesterday's state: the first save of each day first copies the existing file into backups/ (newest 14 kept).
    func backupOncePerDay() {
        guard fm.fileExists(atPath: saveURL.path) else { return }
        let dir = dataDir.appendingPathComponent("backups", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
        let target = dir.appendingPathComponent("karakterek-\(f.string(from: Date())).json")
        if !fm.fileExists(atPath: target.path) { try? fm.copyItem(at: saveURL, to: target) }
        let all = ((try? fm.contentsOfDirectory(atPath: dir.path)) ?? []).filter { $0.hasPrefix("karakterek-") }.sorted()
        for old in all.dropLast(14) { try? fm.removeItem(at: dir.appendingPathComponent(old)) }
    }

    // MARK: things WebKit asks the host app to do

    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping ([URL]?) -> Void) {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = parameters.allowsMultipleSelection
        panel.canChooseDirectories = false
        panel.beginSheetModal(for: window) { r in completionHandler(r == .OK ? panel.urls : nil) }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url { NSWorkspace.shared.open(url) }   // target=_blank links open in the browser
        return nil
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if action.navigationType == .linkActivated, let url = action.request.url, url.scheme == "http" || url.scheme == "https" {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { NSLog("page loaded") }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { NSLog("page failed: %@", error.localizedDescription) }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { NSLog("page failed to start: %@", error.localizedDescription) }

    // MARK: menu

    @objc func saveNow(_ sender: Any?) { js("A.saveNow()") }
    @objc func printSheet(_ sender: Any?) { js("A.print()") }
    @objc func revealSave(_ sender: Any?) { js("A.natReveal()") }
    @objc func reloadPage(_ sender: Any?) { web.reload() }
    @objc func printPage(_ sender: Any?) {
        let info = NSPrintInfo.shared
        info.horizontalPagination = .fit
        info.isVerticallyCentered = false
        let op = web.printOperation(with: info)
        op.view?.frame = NSRect(x: 0, y: 0, width: info.paperSize.width, height: info.paperSize.height)
        op.runModal(for: window, delegate: nil, didRun: nil, contextInfo: nil)
    }

    func buildMenu() {
        let main = NSMenu()
        func add(_ title: String, _ items: [NSMenuItem]) {
            let m = NSMenu(title: title)
            items.forEach { m.addItem($0) }
            let top = NSMenuItem(); top.submenu = m; main.addItem(top)
        }
        func item(_ title: String, _ sel: Selector?, _ key: String = "", target: AnyObject? = nil) -> NSMenuItem {
            let i = NSMenuItem(title: title, action: sel, keyEquivalent: key); i.target = target; return i
        }
        add(appName, [
            item("A \(appName) névjegye", #selector(NSApplication.orderFrontStandardAboutPanel(_:))),
            .separator(),
            item("A \(appName) elrejtése", #selector(NSApplication.hide(_:)), "h"),
            .separator(),
            item("Kilépés", #selector(NSApplication.terminate(_:)), "q"),
        ])
        add("Fájl", [
            item("Mentés most", #selector(saveNow(_:)), "s", target: self),
            item("Mentésfájl megmutatása a Finderben", #selector(revealSave(_:)), target: self),
            .separator(),
            item("Karakterlap nyomtatása…", #selector(printSheet(_:)), "p", target: self),
            .separator(),
            item("Ablak bezárása", #selector(NSWindow.performClose(_:)), "w"),
        ])
        add("Szerkesztés", [
            item("Visszavonás", Selector(("undo:")), "z"),
            item("Újra", Selector(("redo:")), "Z"),
            .separator(),
            item("Kivágás", #selector(NSText.cut(_:)), "x"),
            item("Másolás", #selector(NSText.copy(_:)), "c"),
            item("Beillesztés", #selector(NSText.paste(_:)), "v"),
            item("Összes kijelölése", #selector(NSText.selectAll(_:)), "a"),
        ])
        add("Nézet", [
            item("Újratöltés", #selector(reloadPage(_:)), "r", target: self),
            item("Teljes képernyő", #selector(NSWindow.toggleFullScreen(_:)), "f"),
        ])
        add("Ablak", [
            item("Kis méret", #selector(NSWindow.performMiniaturize(_:)), "m"),
            item("Nagyítás", #selector(NSWindow.performZoom(_:))),
        ])
        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
