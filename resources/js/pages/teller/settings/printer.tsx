import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import TellerLayout from '@/layouts/teller-layout';
import { thermalPrinter } from '@/utils/thermalPrinter';
import { BleDevice } from '@capacitor-community/bluetooth-le';

export default function PrinterSettings() {
    const [isConnected, setIsConnected] = useState(false);
    const [isBuiltIn, setIsBuiltIn] = useState(false); // true = Urovo/POS built-in printer found
    const [printer, setPrinter] = useState<BleDevice | null>(null);
    const [status, setStatus] = useState('Initializing...');
    const [autoSaveDevice, setAutoSaveDevice] = useState(true);
    const [availableDevices, setAvailableDevices] = useState<BleDevice[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        // Initialize printer — detects built-in POS printer first, then BLE
        thermalPrinter.initialize().then(() => {
            const builtIn = thermalPrinter.isBuiltInPrinter();
            setIsBuiltIn(builtIn);

            if (builtIn) {
                setIsConnected(true);
                setStatus('Built-in printer ready');
                return;
            }

            // BLE fallback
            const device = thermalPrinter.getConnectedDevice();
            if (device) {
                setPrinter(device);
                setIsConnected(true);
                setStatus(`Connected to ${device.name || 'Bluetooth Printer'}`);
            } else {
                const savedId = localStorage.getItem('thermal_printer_id');
                setStatus(savedId ? 'Reconnecting to Bluetooth printer...' : 'No printer connected');
            }
        });

        const handleConnectionChange = (connected: boolean) => {
            setIsConnected(connected);
            if (!connected && !thermalPrinter.isBuiltInPrinter()) {
                setPrinter(null);
                setStatus('Printer disconnected');
            }
        };

        thermalPrinter.addConnectionListener(handleConnectionChange);

        return () => {
            thermalPrinter.removeConnectionListener(handleConnectionChange);
        };
    }, []);

    const scanForPrinters = async () => {
        try {
            setIsScanning(true);
            setStatus('Scanning for Bluetooth printers...');
            setAvailableDevices([]);

            const devices = await thermalPrinter.scan();
            setAvailableDevices(devices);
            
            if (devices.length === 0) {
                setStatus('No printers found. Make sure your printer is on and in pairing mode.');
            } else {
                setStatus(`Found ${devices.length} device(s). Tap to connect.`);
            }
        } catch (error: any) {
            console.error('Scan error:', error);
            setStatus(`Scan error: ${error.message}`);
        } finally {
            setIsScanning(false);
        }
    };

    const connectPrinter = async (device: BleDevice) => {
        try {
            setStatus(`Connecting to ${device.name || device.deviceId}...`);
            
            const success = await thermalPrinter.connect(device.deviceId, device.name);
            
            if (success) {
                setPrinter(device);
                setIsConnected(true);
                setStatus(`✓ Connected to ${device.name || 'Thermal Printer'}`);
                setAvailableDevices([]);
            } else {
                setStatus('Failed to connect. Please try again.');
            }
        } catch (error: any) {
            console.error('Connection error:', error);
            setStatus(`Error: ${error.message}`);
        }
    };

    const disconnectPrinter = async () => {
        try {
            await thermalPrinter.disconnect();
            setPrinter(null);
            setIsConnected(false);
            setStatus('Disconnected');
        } catch (error: any) {
            console.error('Disconnect error:', error);
        }
    };

    const testPrint = async () => {
        if (!thermalPrinter.isConnected()) {
            alert('Printer not connected!');
            return;
        }

        try {
            setStatus('Printing test receipt...');
            await thermalPrinter.printTest();
            setStatus('Test print sent successfully!');
        } catch (error: any) {
            console.error('Print error:', error);
            setStatus(`Print error: ${error.message}`);
            alert(`Print failed: ${error.message}\n\nMake sure the printer is on and connected.`);
        }
    };

    const clearSavedDevice = () => {
        localStorage.removeItem('thermal_printer_id');
        localStorage.removeItem('thermal_printer_name');
        setStatus('Saved device cleared');
    };

    return (
        <TellerLayout currentPage="settings">
            <Head title="Printer Settings" />

            <div className="p-4 max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-700">
                    <h1 className="text-2xl font-bold text-orange-500">Printer Settings</h1>
                    <p className="text-sm text-gray-400">
                        {isBuiltIn ? 'Built-in POS Thermal Printer' : 'Connect to Bluetooth Thermal Printer'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {isBuiltIn ? 'Urovo i9100 — No Bluetooth setup required' : 'Compatible: PT-210, POS Printers, ESC/POS Thermal Printers'}
                    </p>
                </div>

                {/* Status Card */}
                <div className={`rounded-lg p-6 mb-4 border ${isConnected ? 'bg-green-900/30 border-green-500/30' : 'bg-red-900/30 border-red-500/30'}`}>
                    <div className="flex items-center gap-4">
                        <div className="text-5xl">
                            {isConnected ? '🖨️✅' : '🖨️❌'}
                        </div>
                        <div>
                            <div className="text-xl font-bold mb-1 text-white">
                                {isConnected ? 'Printer Ready' : 'Printer Not Connected'}
                            </div>
                            <div className="text-sm text-gray-300">{status}</div>
                            {isBuiltIn && (
                                <div className="text-xs text-green-400 mt-1 font-semibold">
                                    🔌 Built-in printer — no pairing needed
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Built-in Printer Controls */}
                {isBuiltIn ? (
                    <div className="bg-[#1a1a1a] rounded-lg p-6 mb-4 border border-green-700/50">
                        <h2 className="text-xl font-bold text-green-400 mb-2">Built-in Printer (Urovo i9100)</h2>
                        <p className="text-sm text-gray-400 mb-4">
                            This device has a built-in thermal printer. Receipts will print automatically after each bet.
                        </p>
                        <button
                            onClick={testPrint}
                            className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg"
                        >
                            🖨️ Test Print
                        </button>
                    </div>
                ) : (
                    /* Bluetooth Connection Controls */
                    <div className="bg-[#1a1a1a] rounded-lg p-6 mb-4 border border-gray-700">
                        <h2 className="text-xl font-bold text-white mb-4">Bluetooth Connection</h2>

                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoSaveDevice}
                                    onChange={(e) => setAutoSaveDevice(e.target.checked)}
                                    className="w-5 h-5"
                                />
                                <span className="text-white">Remember this printer</span>
                            </label>
                            <p className="text-sm text-gray-400 mt-1 ml-7">
                                Automatically reconnect to this printer next time
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            {!isConnected ? (
                                <button
                                    onClick={scanForPrinters}
                                    disabled={isScanning}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg font-bold text-base sm:text-lg"
                                >
                                    {isScanning ? '🔍 Scanning...' : '🔗 Scan for Printers'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={disconnectPrinter}
                                        className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-base sm:text-lg"
                                    >
                                        Disconnect
                                    </button>
                                    <button
                                        onClick={testPrint}
                                        className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-base sm:text-lg"
                                    >
                                        🖨️ Test Print
                                    </button>
                                </>
                            )}
                            <button
                                onClick={clearSavedDevice}
                                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold text-base sm:text-lg"
                            >
                                Clear Saved Device
                            </button>
                        </div>

                        {/* Available Devices List */}
                        {availableDevices.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-semibold text-gray-300 mb-2">Available Printers:</h3>
                                <div className="space-y-2">
                                    {availableDevices.map((device, index) => (
                                        <button
                                            key={device.deviceId || index}
                                            onClick={() => connectPrinter(device)}
                                            className="w-full bg-[#2a3544] hover:bg-[#3a4554] text-left p-3 rounded-lg border border-gray-600 transition-colors"
                                        >
                                            <div className="font-semibold text-white">
                                                {device.name || 'Unknown Device'}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">
                                                {device.deviceId}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Account Actions */}
                <div className="bg-[#1a1a1a] rounded-lg p-6 mb-4 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">Account</h2>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to logout?')) {
                                sessionStorage.clear();
                                router.post('/logout', {}, {
                                    onSuccess: () => {
                                        window.location.href = '/login';
                                    },
                                    onError: () => {
                                        window.location.href = '/login';
                                    }
                                });
                            }
                        }}
                        className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
                    >
                        🚪 Logout
                    </button>
                </div>

                {/* Important Notes */}
                <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-yellow-400 mb-3">⚠️ Important Notes</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        {isBuiltIn ? (
                            <>
                                <li>• Built-in printer is ready — no Bluetooth setup needed</li>
                                <li>• Receipts print automatically after each bet is placed</li>
                                <li>• Use Test Print to verify the printer is working</li>
                                <li>• If no receipt prints, restart the app and try again</li>
                            </>
                        ) : (
                            <>
                                <li>• Make sure Bluetooth is enabled on your device</li>
                                <li>• The PT-210 printer must be turned on and in pairing mode</li>
                                <li>• Keep the printer within Bluetooth range (approximately 10 meters)</li>
                                <li>• Receipts will print automatically after each bet is placed</li>
                                <li>• This feature requires a browser with Web Bluetooth API support (Chrome/Edge recommended)</li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </TellerLayout>
    );
}
