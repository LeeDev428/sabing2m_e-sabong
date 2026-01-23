import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import TellerLayout from '@/layouts/teller-layout';
import { thermalPrinter } from '@/utils/thermalPrinter';
import { BleDevice } from '@capacitor-community/bluetooth-le';

export default function PrinterSettings() {
    const [isConnected, setIsConnected] = useState(false);
    const [printer, setPrinter] = useState<BleDevice | null>(null);
    const [status, setStatus] = useState('Not connected');
    const [autoSaveDevice, setAutoSaveDevice] = useState(true);
    const [availableDevices, setAvailableDevices] = useState<BleDevice[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        // Initialize Bluetooth
        thermalPrinter.initialize().then(() => {
            // Check if previously connected printer is saved
            const savedPrinterId = localStorage.getItem('thermal_printer_id');
            if (savedPrinterId) {
                setStatus('Previously connected printer saved');
            }
        });
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
            
            const success = await thermalPrinter.connect(device.deviceId);
            
            if (success) {
                setPrinter(device);
                setIsConnected(true);
                setStatus(`Connected to ${device.name || 'Thermal Printer'}`);
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
        <TellerLayout>
            <Head title="Printer Settings" />

            <div className="p-4 max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-700">
                <h1 className="text-2xl font-bold text-orange-500">Printer Settings</h1>
                <p className="text-sm text-gray-400">Connect to Bluetooth Thermal Printer</p>
                <p className="text-xs text-gray-500 mt-1">Compatible: PT-210, POS Printers, ESC/POS Thermal Printers</p>
            </div>

            {/* Status Card */}
            <div className={`rounded-lg p-6 mb-4 border ${isConnected ? 'bg-green-900/30 border-green-500/30' : 'bg-red-900/30 border-red-500/30'}`}>
                <div className="flex items-center gap-4">
                    <div className="text-5xl">
                        {isConnected ? '🖨️✅' : '🖨️❌'}
                    </div>
                    <div>
                        <div className="text-xl font-bold mb-1 text-white">
                            {isConnected ? 'Printer Connected' : 'Printer Not Connected'}
                        </div>
                        <div className="text-sm text-gray-300">
                            {status}
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Controls */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 mb-4 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Connection</h2>
                
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

                <div className="flex flex-col sm:flex-row gap-3">
                    {!isConnected ? (
                        <button
                            onClick={connectPrinter}
                            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-base sm:text-lg"
                        >
                            🔗 Connect to Printer
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
            </div>

            {/* Receipt Preview */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 mb-4 border border-gray-700">
                <h2 className="text-xl font-bold text-orange-500 mb-4">Receipt Preview</h2>
                <div className="bg-white text-black p-6 rounded font-mono text-sm max-w-md">
                    <div className="text-center mb-3">
                        <div className="font-bold text-lg">Sabing2m Arena</div>
                        <div className="text-xs">BET RECEIPT</div>
                        <div className="border-t border-b border-black my-2 py-1">
                            <div className="font-bold">TICKET #12345</div>
                        </div>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                        <div className="flex justify-between">
                            <span>Fight:</span>
                            <span className="font-bold">#42</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Side:</span>
                            <span className="font-bold">MERON</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="font-bold">₱500.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Odds:</span>
                            <span className="font-bold">1.57x</span>
                        </div>
                    </div>

                    <div className="border-t border-black pt-2 mb-3">
                        <div className="flex justify-between font-bold text-base">
                            <span>Potential Win:</span>
                            <span>₱785.00</span>
                        </div>
                    </div>

                    <div className="text-xs text-center border-t border-black pt-2">
                        <div>{new Date().toLocaleString()}</div>
                        <div className="mt-2">Good Luck!</div>
                    </div>
                </div>
                <p className="text-sm text-gray-400 mt-4">
                    This receipt will be printed automatically after each bet placement
                </p>
            </div>

            {/* Account Actions */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 mb-4 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Account</h2>
                <button
                    onClick={() => {
                        if (confirm('Are you sure you want to logout?')) {
                            router.post('/logout');
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
                    <li>• Make sure Bluetooth is enabled on your device</li>
                    <li>• The PT-210 printer must be turned on and in pairing mode</li>
                    <li>• Keep the printer within Bluetooth range (approximately 10 meters)</li>
                    <li>• Receipts will print automatically after each bet is placed</li>
                    <li>• This feature requires a browser with Web Bluetooth API support (Chrome/Edge recommended)</li>
                </ul>
            </div>
            </div>
        </TellerLayout>
    );
}
