#!/bin/bash
# Builds dist/Karakterlapok-Android.apk without Gradle, using the Android SDK command-line tools.
# Needs: JDK 17 and an Android SDK with platforms;android-35 and build-tools;35.0.0
#   ANDROID_SDK (default ~/.local/android/sdk), JAVA_HOME (default: the Temurin 17 in ~/.local/jdk)
# Signing key: sajat/android-release.keystore (created on first run; keep it – updates must be signed with the same key)
set -euo pipefail
cd "$(dirname "$0")/.."
SDK="${ANDROID_SDK:-$HOME/.local/android/sdk}"; BT="$SDK/build-tools/35.0.0"; JAR="$SDK/platforms/android-35/android.jar"
export JAVA_HOME="${JAVA_HOME:-$(ls -d "$HOME"/.local/jdk/jdk-17*/Contents/Home | head -1)}"; export PATH="$JAVA_HOME/bin:$PATH"
VERSION=$(sed -n "s/.*const APP_VERSION='\([^']*\)'.*/\1/p" src/app.html | head -1); CODE=$(echo "$VERSION" | awk -F. '{print $1*100+$2}')
python3 build.py >/dev/null
B=build/android; rm -rf "$B"; mkdir -p "$B/res" "$B/assets/web/data" "$B/gen" "$B/obj" dist
for d in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do mkdir -p "$B/res/mipmap-${d%%:*}"; sips -z ${d##*:} ${d##*:} macos/icon-1024.png --out "$B/res/mipmap-${d%%:*}/ic_launcher.png" >/dev/null; done
cp index.html dnd.js gm.js icon.svg "$B/assets/web/"; cp data/*.js "$B/assets/web/data/"
"$BT/aapt2" compile --dir "$B/res" -o "$B/res.zip"
"$BT/aapt2" link -o "$B/unsigned.apk" -I "$JAR" --manifest android/AndroidManifest.xml -R "$B/res.zip" -A "$B/assets" --java "$B/gen" \
  --min-sdk-version 24 --target-sdk-version 34 --version-code "$CODE" --version-name "$VERSION"
javac -nowarn -source 11 -target 11 -classpath "$JAR" -d "$B/obj" $(find android/src "$B/gen" -name '*.java') 2>&1 | grep -v "bootstrap classpath\|^1 warning\|^warning: \[options\]" || true
"$BT/d8" --release --lib "$JAR" --min-api 24 --output "$B" $(find "$B/obj" -name '*.class')
(cd "$B" && zip -q unsigned.apk classes.dex)
"$BT/zipalign" -p -f 4 "$B/unsigned.apk" "$B/aligned.apk"
KS=sajat/android-release.keystore; PW=sajat/android-keystore-jelszo.txt
if [ ! -f "$KS" ]; then mkdir -p sajat; python3 -c "import secrets;print(secrets.token_urlsafe(24))" > "$PW"
  keytool -genkeypair -keystore "$KS" -alias karakterlapok -keyalg RSA -keysize 2048 -validity 12000 -storepass "$(cat $PW)" -keypass "$(cat $PW)" -dname "CN=Karakterlapok, O=ombolidadi" >/dev/null 2>&1; fi
"$BT/apksigner" sign --ks "$KS" --ks-key-alias karakterlapok --ks-pass "file:$PW" --out dist/Karakterlapok-Android.apk "$B/aligned.apk"
"$BT/apksigner" verify dist/Karakterlapok-Android.apk && echo "kész: dist/Karakterlapok-Android.apk (v$VERSION, code $CODE)" && du -h dist/Karakterlapok-Android.apk
