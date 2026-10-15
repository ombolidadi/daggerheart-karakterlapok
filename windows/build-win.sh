#!/bin/bash
# Builds dist/Karakterlapok-Windows.zip: the Neutralinojs runtime (Windows, WebView2) + the web app as a portable folder.
# Needs the Neutralinojs v6.10.0 release files in ~/.local/neutralino (neutralino-win_x64.exe, neutralino.js).
#   Optional: TEST_MAC=1 builds the same folder with the macOS runtime into build/win-test for a local trial run.
set -euo pipefail
cd "$(dirname "$0")/.."
NEU="${NEUTRALINO_DIR:-$HOME/.local/neutralino}"
VERSION=$(sed -n "s/.*const APP_VERSION='\([^']*\)'.*/\1/p" src/app.html | head -1)
python3 build.py >/dev/null
OUT="build/win/Karakterlapok"; [ "${TEST_MAC:-}" = 1 ] && OUT="build/win-test/Karakterlapok"
rm -rf "$OUT"; mkdir -p "$OUT/resources/data" dist
cp dnd.js gm.js icon.svg icon-192.png "$OUT/resources/"; cp data/*.js "$OUT/resources/data/"
cp "$NEU/neutralino.js" windows/win-bridge.js "$OUT/resources/"
python3 - "$OUT/resources/index.html" <<'PY'
import sys
s=open('index.html',encoding='utf-8').read()
tag='<script src="data/srd-data.js"></script>'
assert s.count(tag)==1
open(sys.argv[1],'w',encoding='utf-8').write(s.replace(tag,'<script src="neutralino.js"></script>\n<script src="win-bridge.js"></script>\n'+tag))
PY
cat > "$OUT/neutralino.config.json" <<JSON
{
  "applicationId": "io.github.ombolidadi.karakterlapok",
  "version": "$VERSION",
  "defaultMode": "window",
  "port": 53817,
  "documentRoot": "/resources/",
  "url": "/",
  "enableServer": true,
  "enableNativeAPI": true,
  "tokenSecurity": "one-time",
  "logging": { "enabled": false, "writeToLogFile": false },
  "nativeAllowList": ["app.*", "os.*", "filesystem.*", "events.*"],
  "modes": {
    "window": {
      "title": "Karakterlapok",
      "width": 1200, "height": 860, "minWidth": 400, "minHeight": 500,
      "center": true, "resizable": true, "enableInspector": false,
      "icon": "/resources/icon-192.png",
      "exitProcessOnClose": false
    }
  }
}
JSON
if [ "${TEST_MAC:-}" = 1 ]; then cp "$NEU/neutralino-mac_arm64" "$OUT/karakterlapok"; chmod +x "$OUT/karakterlapok"; echo "teszt: $OUT"; exit 0; fi
cp "$NEU/neutralino-win_x64.exe" "$OUT/Karakterlapok.exe"
cat > "$OUT/OLVASS EL.txt" <<TXT
Karakterlapok $VERSION – Windows

Indítás: kattints duplán a Karakterlapok.exe fájlra. A mappát (Karakterlapok) egyben tartsd,
a resources mappa és a neutralino.config.json is kell a működéshez.

Az első indításnál a Windows SmartScreen figyelmeztethet, mert a program nincs aláírva:
„További információ” → „Futtatás mindenképp”.

A karakterek automatikusan mentődnek ide: %APPDATA%\Karakterlapok\karakterek.json
(naponta biztonsági másolattal a backups mappában).

A program a Windowsba épített Microsoft Edge WebView2-t használja (Windows 10/11-en alapból megvan).

Nem hivatalos rajongói eszköz. Daggerheart SRD 1.0 © Critical Role, LLC (DPCGL).
D&D: SRD 5.2.1 by Wizards of the Coast LLC, CC BY 4.0. Neutralinojs (MIT).
TXT
rm -f dist/Karakterlapok-Windows.zip
(cd build/win && zip -qr -X ../../dist/Karakterlapok-Windows.zip Karakterlapok)
echo "kész: dist/Karakterlapok-Windows.zip (v$VERSION)"; du -h dist/Karakterlapok-Windows.zip
