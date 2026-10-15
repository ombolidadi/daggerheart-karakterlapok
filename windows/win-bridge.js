// Karakterlapok – Windows shell bridge (Neutralinojs). Speaks the same message protocol as the macOS and Android shells:
// keeps the save file in %APPDATA%\Karakterlapok, saves exports through a save dialog, prints with the webview.
(function () {
  if (!window.Neutralino || !window.NL_PORT) return;
  Neutralino.init();
  const fs = Neutralino.filesystem;
  let dir = null, file = null;
  const ready = (async () => {
    const base = await Neutralino.os.getPath('data');
    dir = base.replace(/[\\/]+$/, '') + '/Karakterlapok';
    try { await fs.createDirectory(dir); } catch (e) { }
    file = dir + '/karakterek.json';
    window.DH_NATIVE_PATH = file;
    try { return await fs.readFile(file); } catch (e) { return ''; }
  })();
  window.DH_NATIVE_PROMISE = ready;
  async function backup() {
    try { await fs.getStats(file); } catch (e) { return; }
    const bd = dir + '/backups', day = new Date().toISOString().slice(0, 10), t = bd + '/karakterek-' + day + '.json';
    try { await fs.createDirectory(bd); } catch (e) { }
    try { await fs.getStats(t); } catch (e) { try { await fs.copy(file, t); } catch (e2) { } }
  }
  window.DHBridge = {
    post: async (m) => {
      try {
        if (m.type === 'save') {
          await ready; await backup(); await fs.writeFile(file, m.json);
          window.dhNativeSaved && window.dhNativeSaved(true);
        } else if (m.type === 'download') {
          const p = await Neutralino.os.showSaveDialog('Mentés', { defaultPath: m.name });
          if (p) await fs.writeFile(p, m.data);
        } else if (m.type === 'print') {
          window.print();
        } else if (m.type === 'reveal') {
          await ready; await Neutralino.os.open(dir);
        }
      } catch (e) {
        if (m.type === 'save' && window.dhNativeSaved) window.dhNativeSaved(false, String((e && e.message) || e));
      }
    }
  };
  // write a pending save before the window closes
  Neutralino.events.on('windowClose', () => {
    try { window.dhFlushNow && window.dhFlushNow(); } catch (e) { }
    setTimeout(() => Neutralino.app.exit(), 500);
  });
})();
