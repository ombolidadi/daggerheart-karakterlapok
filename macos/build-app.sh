#!/bin/bash
# Builds "dist/Daggerheart Karakterlapok.app" (Apple Silicon, plus Intel when the toolchain can) and a zip of it.
# Needs the Xcode Command Line Tools (swiftc). Run from anywhere:  bash macos/build-app.sh
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="Daggerheart Karakterlapok"
VERSION=$(sed -n "s/.*const APP_VERSION='\([^']*\)'.*/\1/p" src/app.html | head -1)
TMP=$(mktemp -d); APP="$TMP/$NAME.app"      # assembled and signed outside the project folder, then copied to dist/

python3 build.py
mkdir -p dist "$APP/Contents/MacOS" "$APP/Contents/Resources/web/data"

swiftc -O -swift-version 5 -target arm64-apple-macos11.0 macos/main.swift -o "$TMP/dh-arm64"
# Intel build: newer toolchains only ship the x86_64 runtime shims for recent macOS, so it targets macOS 14+
if swiftc -O -swift-version 5 -target x86_64-apple-macos14.0 macos/main.swift -o "$TMP/dh-x86_64" 2>"$TMP/x86.log"; then
  lipo -create "$TMP/dh-arm64" "$TMP/dh-x86_64" -output "$APP/Contents/MacOS/DaggerheartKarakterlapok"
else
  echo "figyelem: az Intel (x86_64) változat nem fordult le, csak Apple Silicon készül"; cp "$TMP/dh-arm64" "$APP/Contents/MacOS/DaggerheartKarakterlapok"
fi

cp index.html dnd.js icon.svg "$APP/Contents/Resources/web/"
cp data/*.js "$APP/Contents/Resources/web/data/"

# app icon from macos/icon-1024.png (written by build.py)
ICONSET="$TMP/AppIcon.iconset"; mkdir "$ICONSET"
for S in 16 32 128 256 512; do
  sips -z $S $S macos/icon-1024.png --out "$ICONSET/icon_${S}x${S}.png" >/dev/null
  sips -z $((S*2)) $((S*2)) macos/icon-1024.png --out "$ICONSET/icon_${S}x${S}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>$NAME</string>
  <key>CFBundleDisplayName</key><string>$NAME</string>
  <key>CFBundleIdentifier</key><string>io.github.ombolidadi.daggerheart-karakterlapok</string>
  <key>CFBundleExecutable</key><string>DaggerheartKarakterlapok</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>CFBundleDevelopmentRegion</key><string>hu</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.role-playing-games</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSPrincipalClass</key><string>NSApplication</string>
  <key>NSHumanReadableCopyright</key><string>Nem hivatalos rajongói eszköz. Daggerheart SRD 1.0 © Critical Role, LLC – DPCGL.</string>
</dict></plist>
PLIST

xattr -cr "$APP"                             # Finder metadata would make codesign refuse the bundle
codesign --force --deep -s - "$APP"          # ad-hoc signature (no Apple Developer ID)
codesign --verify --deep --strict "$APP"
rm -rf "dist/$NAME.app" "dist/Daggerheart-Karakterlapok-macOS.zip"
ditto -c -k --keepParent "$APP" "dist/Daggerheart-Karakterlapok-macOS.zip"
ditto "$APP" "dist/$NAME.app"
echo "kész: dist/$NAME.app (v$VERSION)"; lipo -archs "$APP/Contents/MacOS/DaggerheartKarakterlapok"; du -sh "dist/$NAME.app" dist/*.zip
rm -rf "$TMP"
