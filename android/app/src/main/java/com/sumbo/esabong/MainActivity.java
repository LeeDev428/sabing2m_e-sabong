package com.sumbo.esabong;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import com.sumbo.esabong.plugins.UrovoPrinterPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UrovoPrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
