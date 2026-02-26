package com.sumbo.esabong.plugins;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;

/**
 * UrovoPrinterPlugin — Capacitor plugin for built-in POS thermal printers.
 *
 * Tries to write ESC/POS bytes directly to the device's serial printer
 * interface without requiring an external SDK. Works on Urovo i9100 and
 * most Android POS terminals that expose a serial printer device file.
 *
 * Usage from JS/TS:
 *   UrovoPrinter.isSupported()          → { supported: boolean, model: string }
 *   UrovoPrinter.printRaw({ data })     → { success: boolean, method: string }
 *       where `data` is a base64-encoded string of ESC/POS bytes
 */
@CapacitorPlugin(name = "UrovoPrinter")
public class UrovoPrinterPlugin extends Plugin {

    private static final String TAG = "UrovoPrinterPlugin";

    // Known serial printer device paths on Android POS terminals
    private static final String[] SERIAL_PATHS = {
        "/dev/ttyS1",      // Urovo i9100 primary
        "/dev/ttyS2",
        "/dev/ttyS0",
        "/dev/printer",
        "/dev/ttyPRN0",
        "/dev/ttyUSB0",
        "/dev/usb/lp0",
    };

    @PluginMethod
    public void isSupported(PluginCall call) {
        String manufacturer = android.os.Build.MANUFACTURER.toLowerCase();
        String model        = android.os.Build.MODEL.toLowerCase();

        boolean isPosPrinter = false;
        String foundPath     = null;

        for (String path : SERIAL_PATHS) {
            File f = new File(path);
            if (f.exists()) {
                isPosPrinter = true;
                foundPath    = path;
                break;
            }
        }

        JSObject result = new JSObject();
        result.put("supported",    isPosPrinter);
        result.put("manufacturer", android.os.Build.MANUFACTURER);
        result.put("model",        android.os.Build.MODEL);
        result.put("devicePath",   foundPath != null ? foundPath : "none");
        call.resolve(result);
    }

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

        // Try each known serial device path
        for (String path : SERIAL_PATHS) {
            File device = new File(path);
            if (!device.exists()) continue;

            try (FileOutputStream fos = new FileOutputStream(device, true)) {
                fos.write(data);
                fos.flush();
                Log.i(TAG, "✅ Printed via serial device: " + path
                        + " (" + data.length + " bytes)");

                JSObject result = new JSObject();
                result.put("success",    true);
                result.put("method",     "serial");
                result.put("devicePath", path);
                call.resolve(result);
                return;
            } catch (Exception e) {
                Log.w(TAG, "⚠️ Failed on " + path + ": " + e.getMessage());
            }
        }

        call.reject("No writable printer device found. "
                + "Make sure the app has storage/device permission."
                + " Checked: " + String.join(", ", SERIAL_PATHS));
    }
}
