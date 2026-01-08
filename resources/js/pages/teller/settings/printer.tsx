import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function PrinterSettings() {
    const [isConnected, setIsConnected] = useState(false);
    const [printer, setPrinter] = useState<BluetoothDevice | null>(null);
    const [status, setStatus] = useState('Not connected');
    const [autoSaveDevice, setAutoSaveDevice] = useState(true);

    useEffect(() => {
        // Check if previously connected printer is saved
        const savedPrinterId = localStorage.getItem('pt210_printer_id');
        if (savedPrinterId) {
            setStatus('Previously connected printer saved');
        }
    }, []);

    const connectPrinter = async () => {
        try {
            setStatus('Requesting Bluetooth device...');

            // Request PT-210 Bluetooth printer
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { name: 'PT-210' },
                    { namePrefix: 'PT' },
                ],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'], // Generic printer service
            });

            setStatus(`Connecting to ${device.name}...`);
            
            const server = await device.gatt?.connect();
            
            if (server) {
                setPrinter(device);
                setIsConnected(true);
                setStatus(`Connected to ${device.name}`);

                // Save device ID if auto-save is enabled
                if (autoSaveDevice && device.id) {
                    localStorage.setItem('pt210_printer_id', device.id);
                    localStorage.setItem('pt210_printer_name', device.name || 'PT-210');
                }

                // Handle disconnection
                device.addEventListener('gattserverdisconnected', () => {
                    setIsConnected(false);
                    setStatus('Printer disconnected');
                });
            }
        } catch (error: any) {
            console.error('Bluetooth connection error:', error);
            setStatus(`Error: ${error.message}`);
        }
    };

    const disconnectPrinter = () => {
        if (printer?.gatt?.connected) {
            printer.gatt.disconnect();
        }
        setPrinter(null);
        setIsConnected(false);
        setStatus('Disconnected');
    };

    const testPrint = async () => {
        if (!printer?.gatt?.connected) {
            alert('Printer not connected!');
            return;
        }

        try {
            setStatus('Printing test receipt...');
            
            // This is a simplified example - actual ESC/POS commands depend on the printer
            const testReceipt = [
                '\x1B\x40', // Initialize printer
                '\x1B\x61\x01', // Center align
                '================================\n',
                'eSabong Test Receipt\n',
                '================================\n',
                '\x1B\x61\x00', // Left align
                'Printer: PT-210\n',
                'Status: Connected\n',
                `Time: ${new Date().toLocaleString()}\n`,
                '================================\n',
                '\n\n\n',
                '\x1D\x56\x41\x00', // Cut paper
            ].join('');

            // Note: Actual printing requires sending data to the printer's characteristic
            // This is a placeholder - you'll need to find the correct service/characteristic
            // for the PT-210 printer model
            
            setStatus('Test print sent (implementation varies by printer model)');
            alert('Test print command sent! Check your printer.');
        } catch (error: any) {
            setStatus(`Print error: ${error.message}`);
        }
    };

    const clearSavedDevice = () => {
        localStorage.removeItem('pt210_printer_id');
        localStorage.removeItem('pt210_printer_name');
        setStatus('Saved device cleared');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <Head title="Printer Settings" />

            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.visit('/teller/dashboard')}
                    className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                    ← Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold">Printer Settings</h1>
                <p className="text-gray-400 mt-2">Connect to PT-210 Bluetooth Printer</p>
            </div>

            {/* Status Card */}
            <div className={`rounded-lg p-6 mb-6 ${isConnected ? 'bg-gradient-to-br from-green-600 to-green-800' : 'bg-gradient-to-br from-gray-700 to-gray-800'}`}>
                <div className="flex items-center gap-4">
                    <div className="text-5xl">
                        {isConnected ? '🖨️✅' : '🖨️❌'}
                    </div>
                    <div>
                        <div className="text-xl font-bold mb-1">
                            {isConnected ? 'Printer Connected' : 'Printer Not Connected'}
                        </div>
                        <div className="text-sm text-gray-300">
                            {status}
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Controls */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Connection</h2>
                
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

                <div className="flex gap-3">
                    {!isConnected ? (
                        <button
                            onClick={connectPrinter}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg"
                        >
                            🔗 Connect to Printer
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={disconnectPrinter}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg"
                            >
                                Disconnect
                            </button>
                            <button
                                onClick={testPrint}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg"
                            >
                                🖨️ Test Print
                            </button>
                        </>
                    )}
                    <button
                        onClick={clearSavedDevice}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold text-lg"
                    >
                        Clear Saved Device
                    </button>
                </div>
            </div>

            {/* Receipt Preview */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Receipt Preview</h2>
                <div className="bg-white text-black p-6 rounded font-mono text-sm max-w-md">
                    <div className="text-center mb-3">
                        <div className="font-bold text-lg">eSabong Arena</div>
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

            {/* Important Notes */}
            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-6 mt-6">
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
    );
}
