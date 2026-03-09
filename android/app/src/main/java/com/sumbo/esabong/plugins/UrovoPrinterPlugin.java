package com.sumbo.esabong.plugins;

import android.content.Context;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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
        // 1. Try Urovo SDK via reflection
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

        // 1. Try Urovo SDK (reflection)
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
    // Private helpers
    // -------------------------------------------------------------------------

    /** Returns the first existing & writable serial device path, or null. */
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
}
