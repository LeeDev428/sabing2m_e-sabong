package com.sumbo.esabong.plugins;

import android.content.Context;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.lang.reflect.Method;

/**
 * UrovoPrinterPlugin — Capacitor plugin for built-in POS thermal printers.
 *
 * Strategy (tried in order):
 *   1. Urovo SDK via reflection (works on Urovo i9100, i6310, i6350, etc.)
 *   2. Direct serial device file write (works on many Android POS terminals
 *      where the manufacturer has set world-writable permissions on the device)
 *
 * Usage from JS/TS:
 *   UrovoPrinter.isSupported()       → { supported, manufacturer, model, devicePath, method }
 *   UrovoPrinter.printRaw({ data })  → { success, method, devicePath }
 *       where `data` is a base64-encoded string of ESC/POS bytes
 */
@CapacitorPlugin(name = "UrovoPrinter")
public class UrovoPrinterPlugin extends Plugin {

    private static final String TAG = "UrovoPrinterPlugin";

    /**
     * Ordered list of serial device paths to probe.
     * /dev/ttyS4  — Urovo i9100 (confirmed primary path)
     * /dev/prndev — Urovo i9100 alternative / some Urovo variants
     * /dev/rmdev  — Urovo i9100 alternative on some firmware versions
     * /dev/ttyS1  — PAX, Ingenico and generic POS terminals
     * /dev/ttyS2, /dev/ttyS0 — other generic ones
     * /dev/printer, /dev/ttyPRN0 — miscellaneous POS
     * /dev/ttyUSB0, /dev/usb/lp0 — USB-attached printers
     */
    private static final String[] SERIAL_PATHS = {
        "/dev/ttyS4",      // ✅ Urovo i9100 confirmed primary path
        "/dev/prndev",     // Urovo i9100 alternative
        "/dev/rmdev",      // Urovo i9100 alternative (some firmware)
        "/dev/urovo_printer",
        "/dev/ttyS1",
        "/dev/ttyS2",
        "/dev/ttyS0",
        "/dev/ttyS3",
        "/dev/printer",
        "/dev/ttyPRN0",
        "/dev/ttyUSB0",
        "/dev/usb/lp0",
    };

    // -------------------------------------------------------------------------
    // isSupported
    // -------------------------------------------------------------------------

    @PluginMethod
    public void isSupported(PluginCall call) {
        // 1. Check android.device.PrinterManager (Urovo i9100 / UBX platform)
        if (isAndroidDevicePrinterAvailable()) {
            JSObject result = new JSObject();
            result.put("supported",    true);
            result.put("manufacturer", android.os.Build.MANUFACTURER);
            result.put("model",        android.os.Build.MODEL);
            result.put("devicePath",   "android.device.PrinterManager");
            result.put("method",       "sdk");
            call.resolve(result);
            return;
        }

        // 2. Check legacy Urovo SDK class names via reflection
        if (isUrovoSdkAvailable()) {
            JSObject result = new JSObject();
            result.put("supported",    true);
            result.put("manufacturer", android.os.Build.MANUFACTURER);
            result.put("model",        android.os.Build.MODEL);
            result.put("devicePath",   "urovo-sdk");
            result.put("method",       "sdk");
            call.resolve(result);
            return;
        }

        // 2. Check serial device files
        String foundPath = findWritableSerialPath();

        JSObject result = new JSObject();
        result.put("supported",    foundPath != null);
        result.put("manufacturer", android.os.Build.MANUFACTURER);
        result.put("model",        android.os.Build.MODEL);
        result.put("devicePath",   foundPath != null ? foundPath : "none");
        result.put("method",       foundPath != null ? "serial" : "none");
        call.resolve(result);
    }

    // -------------------------------------------------------------------------
    // printRaw
    // -------------------------------------------------------------------------

    @PluginMethod
    public void printRaw(PluginCall call) {
        String base64Data = call.getString("data");
        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("No ESC/POS data provided");
            return;
        }

        byte[] data;
        try {
            data = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
        } catch (Exception e) {
            call.reject("Invalid base64 data: " + e.getMessage());
            return;
        }

        // 1. Try android.device.PrinterManager SDK (Urovo i9100)
        if (isAndroidDevicePrinterAvailable()) {
            // Strip ESC/POS control bytes and print readable text via SDK
            String plainText = stripEscPos(data);
            try {
                JSONArray lines = new JSONArray();
                for (String line : plainText.split("\n")) {
                    JSONObject obj = new JSONObject();
                    obj.put("text", line.trim());
                    obj.put("size", "normal");
                    obj.put("bold", false);
                    obj.put("align", "left");
                    lines.put(obj);
                }
                printViaAndroidDevice(lines);
                JSObject result = new JSObject();
                result.put("success",    true);
                result.put("method",     "sdk");
                result.put("devicePath", "android.device.PrinterManager");
                call.resolve(result);
                return;
            } catch (Exception e) {
                Log.w(TAG, "⚠️ android.device.PrinterManager printRaw fallback failed: " + e.getMessage());
            }
        }

        // 2. Try legacy Urovo SDK (reflection)
        if (printViaUrovoSdk(data)) {
            JSObject result = new JSObject();
            result.put("success",    true);
            result.put("method",     "sdk");
            result.put("devicePath", "urovo-sdk");
            call.resolve(result);
            return;
        }

        // 2. Try serial device file
        String path = findWritableSerialPath();
        if (path != null && printViaSerial(path, data)) {
            JSObject result = new JSObject();
            result.put("success",    true);
            result.put("method",     "serial");
            result.put("devicePath", path);
            call.resolve(result);
            return;
        }

        call.reject(
            "Built-in printer not found. "
            + "Device: " + android.os.Build.MANUFACTURER + " " + android.os.Build.MODEL + ". "
            + "Checked serial paths: " + String.join(", ", SERIAL_PATHS) + ". "
            + "If this is a Urovo i9100, the Urovo Device SDK JAR is required — "
            + "contact Urovo Technology (developer.urovo.com) to obtain it."
        );
    }

    // -------------------------------------------------------------------------
    // printText  — structured layout printing via android.device.PrinterManager
    // -------------------------------------------------------------------------

    /**
     * Print an array of styled text lines using android.device.PrinterManager
     * (the layout-based SDK present on Urovo i9100 and similar UBX devices).
     *
     * Expects call param "lines" = JSON string of Array<{
     *   text: string,
     *   size: "small" | "normal" | "large",
     *   bold: boolean,
     *   align: "left" | "center" | "right"
     * }>
     *
     * drawTextEx signature (from dexdump of com.ubx.platform.jar):
     *   drawTextEx(String text, int x, int y, int width, int height,
     *              String fontName, int fontSize, int align, int bold, int italic) → int
     *   align: 0=left, 1=center, 2=right
     *   bold/italic: 0=off, 1=on
     */
    @PluginMethod
    public void printText(PluginCall call) {
        String linesJson = call.getString("lines", "[]");

        try {
            JSONArray lines = new JSONArray(linesJson);

            if (isAndroidDevicePrinterAvailable()) {
                printViaAndroidDevice(lines);
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
                return;
            }

            // Fallback: strip formatting, write plain text to serial device
            String path = findWritableSerialPath();
            if (path != null) {
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < lines.length(); i++) {
                    sb.append(lines.getJSONObject(i).optString("text", "")).append("\n");
                }
                sb.append("\n\n\n");
                if (printViaSerial(path, sb.toString().getBytes("UTF-8"))) {
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                    return;
                }
            }

            call.reject("Built-in printer not found on "
                    + android.os.Build.MANUFACTURER + " " + android.os.Build.MODEL);

        } catch (Exception e) {
            Log.e(TAG, "printText failed: " + e.getMessage(), e);
            call.reject("Print error: " + e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static final int PAGE_WIDTH = 384; // print head width in dots (48mm @ 8dpi)

    /** Returns true when android.device.PrinterManager is on the bootclasspath (Urovo i9100). */
    private boolean isAndroidDevicePrinterAvailable() {
        try {
            Class.forName("android.device.PrinterManager");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }

    /**
     * Draw lines and print one copy using android.device.PrinterManager via reflection.
     * This is the page-layout API on UBX/Urovo devices — it does NOT accept raw ESC/POS bytes.
     */
    private void printViaAndroidDevice(JSONArray lines) throws Exception {
        Class<?> pmCls = Class.forName("android.device.PrinterManager");
        Object pm = pmCls.newInstance();

        Method open       = pmCls.getMethod("open");
        Method setupPage  = pmCls.getMethod("setupPage", int.class, int.class);
        Method clearPage  = pmCls.getMethod("clearPage");
        Method drawTextEx = pmCls.getMethod("drawTextEx",
                String.class, int.class, int.class, int.class, int.class,
                String.class, int.class, int.class, int.class, int.class);
        Method paperFeed  = pmCls.getMethod("paperFeed", int.class);
        Method printPage  = pmCls.getMethod("printPage", int.class);
        Method close      = pmCls.getMethod("close");

        // Resolve drawBarcode once — used for QR lines. Not fatal if absent.
        Method drawBarcode = null;
        try {
            drawBarcode = pmCls.getMethod("drawBarcode",
                    String.class, int.class, int.class, int.class, int.class, int.class, int.class);
        } catch (NoSuchMethodException e) {
            Log.w(TAG, "drawBarcode() not available on this device — QR lines will be skipped");
        }

        int openResult = (int) open.invoke(pm);
        Log.d(TAG, "PrinterManager.open() = " + openResult);

        setupPage.invoke(pm, PAGE_WIDTH, 1200);
        clearPage.invoke(pm);

        int y = 5; // small top margin

        for (int i = 0; i < lines.length(); i++) {
            JSONObject lineObj = lines.getJSONObject(i);
            String lineType = lineObj.optString("type", "text");

            if ("qr".equals(lineType)) {
                // QR code — drawn as a 2D barcode centred on the page
                String qrData = lineObj.optString("qrData", "");
                if (!qrData.isEmpty() && drawBarcode != null) {
                    int qrSize = 180; // square, pixels
                    int qrX    = (PAGE_WIDTH - qrSize) / 2;
                    // Barcode type 31 = QR Code in Urovo/UBX SDK. Rotation 0 = normal.
                    drawBarcode.invoke(pm, qrData, qrX, y, qrSize, qrSize, 31, 0);
                    y += qrSize + 6;
                }
                continue;
            }

            // ── text line ──
            String text   = lineObj.optString("text", "");
            String sizeS  = lineObj.optString("size", "normal");
            boolean bold  = lineObj.optBoolean("bold", false);
            String alignS = lineObj.optString("align", "left");

            int fontSize;
            switch (sizeS) {
                case "large":  fontSize = 40; break;
                case "small":  fontSize = 20; break;
                default:       fontSize = 26; break; // "normal"
            }

            int alignInt;
            switch (alignS) {
                case "center": alignInt = 1; break;
                case "right":  alignInt = 2; break;
                default:       alignInt = 0; break; // "left"
            }

            int lineH = fontSize + 4; // tighter line spacing vs the old +8
            drawTextEx.invoke(pm, text, 0, y, PAGE_WIDTH, lineH, "", fontSize, alignInt, bold ? 1 : 0, 0);
            y += lineH;
        }

        paperFeed.invoke(pm, 20); // advance paper just enough to clear the cutter
        printPage.invoke(pm, 1);  // print 1 copy
        close.invoke(pm);

        Log.i(TAG, "✅ Printed via android.device.PrinterManager — total height: " + y + "px");
    }

    /** Returns the first existing serial device path, or null. */
    private String findWritableSerialPath() {
        for (String path : SERIAL_PATHS) {
            File f = new File(path);
            if (f.exists()) {
                Log.d(TAG, "Found device file: " + path
                        + "  canWrite=" + f.canWrite()
                        + "  canRead=" + f.canRead());
                // Accept if the file exists — even if canWrite() returns false,
                // a FileOutputStream write attempt may still succeed on POS
                // devices where the manufacturer sets group/world-write perms.
                return path;
            }
        }
        return null;
    }

    /** Write ESC/POS bytes to a serial device file. Returns true on success. */
    private boolean printViaSerial(String path, byte[] data) {
        try (FileOutputStream fos = new FileOutputStream(path, true)) {
            fos.write(data);
            fos.flush();
            Log.i(TAG, "✅ Printed via serial: " + path + " (" + data.length + " bytes)");
            return true;
        } catch (Exception e) {
            Log.w(TAG, "⚠️ Serial write failed on " + path + ": " + e.getMessage());
            return false;
        }
    }

    /**
     * Check whether the Urovo Device SDK is available on this device.
     * The SDK is a system library on genuine Urovo hardware and can be
     * accessed via reflection without requiring the JAR at compile time.
     */
    private boolean isUrovoSdkAvailable() {
        try {
            // Urovo SDK v2+: com.urovo.sdk.printerservice.Manager
            Class.forName("com.urovo.sdk.printerservice.Manager");
            Log.d(TAG, "Urovo SDK (com.urovo.sdk.printerservice.Manager) found");
            return true;
        } catch (ClassNotFoundException ignored) {}

        try {
            // Urovo SDK v1: com.urovo.i9000.api.PrinterManager
            Class.forName("com.urovo.i9000.api.PrinterManager");
            Log.d(TAG, "Urovo SDK v1 (com.urovo.i9000.api.PrinterManager) found");
            return true;
        } catch (ClassNotFoundException ignored) {}

        try {
            // Some Urovo firmware exposes it as a system service
            Object svc = getActivity().getSystemService("PrinterManager");
            if (svc != null) {
                Log.d(TAG, "Urovo PrinterManager system service found");
                return true;
            }
        } catch (Exception ignored) {}

        return false;
    }

    /**
     * Print via Urovo SDK using reflection.
     * Supports both Urovo SDK v1 and v2 APIs.
     */
    private boolean printViaUrovoSdk(byte[] data) {
        Context ctx = getActivity().getApplicationContext();

        // --- Try SDK v2: com.urovo.sdk.printerservice.Manager ---
        try {
            Class<?> managerClass = Class.forName("com.urovo.sdk.printerservice.Manager");
            Method getInstance = managerClass.getMethod("getInstance", Context.class);
            Object manager = getInstance.invoke(null, ctx);

            Method openPrinter = managerClass.getMethod("openPrinter");
            openPrinter.invoke(manager);

            // Try printData(byte[]) first, then writePrinter(byte[])
            try {
                Method printData = managerClass.getMethod("printData", byte[].class);
                printData.invoke(manager, data);
            } catch (NoSuchMethodException e) {
                Method writePrinter = managerClass.getMethod("writePrinter", byte[].class);
                writePrinter.invoke(manager, data);
            }

            try {
                Method closePrinter = managerClass.getMethod("closePrinter");
                closePrinter.invoke(manager);
            } catch (Exception ignored) {}

            Log.i(TAG, "✅ Printed via Urovo SDK v2");
            return true;
        } catch (ClassNotFoundException ignored) {
            // SDK v2 not available
        } catch (Exception e) {
            Log.w(TAG, "⚠️ Urovo SDK v2 print failed: " + e.getMessage());
        }

        // --- Try SDK v1: com.urovo.i9000.api.PrinterManager ---
        try {
            Class<?> pmClass = Class.forName("com.urovo.i9000.api.PrinterManager");
            Object pm = pmClass.getConstructor(Context.class).newInstance(ctx);

            Method open = pmClass.getMethod("openPrinter");
            open.invoke(pm);

            Method write = pmClass.getMethod("writePrinter", byte[].class);
            write.invoke(pm, data);

            try {
                Method close = pmClass.getMethod("closePrinter");
                close.invoke(pm);
            } catch (Exception ignored) {}

            Log.i(TAG, "✅ Printed via Urovo SDK v1");
            return true;
        } catch (ClassNotFoundException ignored) {
            // SDK v1 not available
        } catch (Exception e) {
            Log.w(TAG, "⚠️ Urovo SDK v1 print failed: " + e.getMessage());
        }

        // --- Try system service "PrinterManager" ---
        try {
            Object svc = getActivity().getSystemService("PrinterManager");
            if (svc != null) {
                Class<?> cls = svc.getClass();

                try {
                    cls.getMethod("openPrinter").invoke(svc);
                } catch (Exception ignored) {}

                try {
                    cls.getMethod("printData", byte[].class).invoke(svc, data);
                } catch (NoSuchMethodException e2) {
                    cls.getMethod("writePrinter", byte[].class).invoke(svc, data);
                }

                try {
                    cls.getMethod("closePrinter").invoke(svc);
                } catch (Exception ignored) {}

                Log.i(TAG, "✅ Printed via system PrinterManager service");
                return true;
            }
        } catch (Exception e) {
            Log.w(TAG, "⚠️ System PrinterManager service failed: " + e.getMessage());
        }

        return false;
    }

    /**
     * Strip ESC/POS control sequences from a byte array, leaving only printable ASCII + newlines.
     * Used as a last-resort when printRaw() is called on a device whose SDK only accepts layout API.
     */
    private String stripEscPos(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int i = 0;
        while (i < data.length) {
            byte b = data[i];
            if (b == 0x1B || b == 0x1D) {
                // ESC or GS — skip this byte and the next 1–2 bytes (command bytes)
                // Heuristic: skip exactly 2 more bytes for the most common commands.
                i += 3;
                continue;
            }
            if (b == 0x0A) { sb.append('\n'); i++; continue; } // LF
            if (b == 0x0D) { i++; continue; }                  // CR (ignore standalone CR)
            if (b >= 0x20 && b < 0x7F) { sb.append((char) b); } // printable ASCII
            i++;
        }
        return sb.toString();
    }
}
