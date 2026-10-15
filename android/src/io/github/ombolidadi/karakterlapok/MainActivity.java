package io.github.ombolidadi.karakterlapok;

// Karakterlapok – Android shell: a WebView that serves the bundled web app from the APK's assets
// and does what WebView pages cannot do themselves: keep the save file, save exports, print, pick files.

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;

public class MainActivity extends Activity {
    static final String HOST = "karakterlapok.local", BASE = "https://" + HOST + "/";
    static final int REQ_FILE = 1, REQ_SAVE = 2;
    WebView web;
    ValueCallback<Uri[]> fileCb;
    String saveData;

    File dataFile() { return new File(getFilesDir(), "karakterek.json"); }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setTextZoom(100);
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String p = u.getPath();
                if (p == null || p.equals("/")) p = "/index.html";
                try {
                    InputStream in = getAssets().open("web" + p);
                    return new WebResourceResponse(mime(p), "utf-8", in);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<String, String>(), new ByteArrayInputStream(new byte[0]));
                }
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                String[] acc = p.getAcceptTypes();
                i.setType(acc != null && acc.length == 1 && "image/*".equals(acc[0]) ? "image/*" : "*/*");
                if (p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try { startActivityForResult(Intent.createChooser(i, null), REQ_FILE); } catch (Exception e) { fileCb = null; return false; }
                return true;
            }
        });
        web.loadUrl(BASE + "index.html");
    }

    static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE) {
            Uri[] r = null;
            if (res == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int n = data.getClipData().getItemCount();
                    r = new Uri[n];
                    for (int k = 0; k < n; k++) r[k] = data.getClipData().getItemAt(k).getUri();
                } else if (data.getData() != null) r = new Uri[]{data.getData()};
            }
            if (fileCb != null) fileCb.onReceiveValue(r);
            fileCb = null;
        } else if (req == REQ_SAVE) {
            if (res == RESULT_OK && data != null && data.getData() != null && saveData != null) {
                try (OutputStream o = getContentResolver().openOutputStream(data.getData())) {
                    o.write(saveData.getBytes(StandardCharsets.UTF_8));
                    toast("Elmentve");
                } catch (Exception e) { toast("A mentés nem sikerült"); }
            }
            saveData = null;
        } else super.onActivityResult(req, res, data);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.evaluateJavascript("window.dhFlushNow&&window.dhFlushNow()", null);
    }

    // Back goes to the app's home screen first, then leaves the app.
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(function(){try{if(ui.view!=='home'){A.home();return 1}}catch(e){}return 0})()", v -> {
            if (!"1".equals(v)) MainActivity.super.onBackPressed();
        });
    }

    void toast(String t) { runOnUiThread(() -> Toast.makeText(this, t, Toast.LENGTH_LONG).show()); }
    void js(String code) { runOnUiThread(() -> web.evaluateJavascript(code, null)); }

    class Bridge {
        @JavascriptInterface
        public String load() {
            File f = dataFile();
            if (!f.exists()) return "";
            try (FileInputStream in = new FileInputStream(f)) {
                byte[] b = new byte[(int) f.length()];
                int off = 0, n;
                while (off < b.length && (n = in.read(b, off, b.length - off)) > 0) off += n;
                return new String(b, StandardCharsets.UTF_8);
            } catch (Exception e) { return ""; }
        }

        @JavascriptInterface
        public String path() { return dataFile().getAbsolutePath(); }

        @JavascriptInterface
        public void post(String msg) {
            try {
                JSONObject m = new JSONObject(msg);
                String type = m.optString("type");
                if ("save".equals(type)) {
                    String json = m.optString("json");
                    if (json.isEmpty()) return;
                    backup();
                    File tmp = new File(getFilesDir(), "karakterek.json.tmp");
                    try (FileOutputStream o = new FileOutputStream(tmp)) { o.write(json.getBytes(StandardCharsets.UTF_8)); }
                    if (!tmp.renameTo(dataFile())) throw new IOException("rename failed");
                    js("window.dhNativeSaved&&window.dhNativeSaved(true)");
                } else if ("download".equals(type)) {
                    saveData = m.optString("data");
                    String name = m.optString("name", "karakter.txt");
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType(name.endsWith(".json") ? "application/json" : name.endsWith(".html") ? "text/html" : "text/plain");
                    i.putExtra(Intent.EXTRA_TITLE, name);
                    runOnUiThread(() -> { try { startActivityForResult(i, REQ_SAVE); } catch (Exception e) { toast("Nincs fájlkezelő a mentéshez"); } });
                } else if ("print".equals(type)) {
                    runOnUiThread(() -> {
                        PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                        pm.print("Karakterlap", web.createPrintDocumentAdapter("Karakterlap"), new PrintAttributes.Builder().build());
                    });
                } else if ("reveal".equals(type)) {
                    toast("A mentésfájl az app saját tárhelyén van; másik eszközre a JSON-exporttal viheted át.");
                }
            } catch (Exception e) {
                js("window.dhNativeSaved&&window.dhNativeSaved(false," + JSONObject.quote(String.valueOf(e.getMessage())) + ")");
            }
        }

        // the first save of each day keeps a copy of the previous state (newest 14 kept)
        void backup() throws IOException {
            File f = dataFile();
            if (!f.exists()) return;
            File dir = new File(getFilesDir(), "backups");
            dir.mkdirs();
            File t = new File(dir, "karakterek-" + new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()) + ".json");
            if (!t.exists()) {
                try (InputStream in = new FileInputStream(f); OutputStream out = new FileOutputStream(t)) {
                    byte[] buf = new byte[8192]; int n;
                    while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                }
            }
            File[] all = dir.listFiles();
            if (all != null && all.length > 14) {
                Arrays.sort(all);
                for (int k = 0; k < all.length - 14; k++) all[k].delete();
            }
        }
    }
}
