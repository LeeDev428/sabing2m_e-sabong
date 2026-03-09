import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { Capacitor, registerPlugin } from '@capacitor/core';

// ESC/POS Commands for thermal printers
const ESC = '\x1B';
const GS  = '\x1D';

/** Native plugin interface for built-in POS thermal printers (e.g. Urovo i9100) */
interface UrovoPrinterPlugin {
    isSupported(): Promise<{ supported: boolean; manufacturer: string; model: string; devicePath: string; method: string }>;
    printRaw(options: { data: string }): Promise<{ success: boolean; method: string; devicePath: string }>;
    /** Structured layout print — each line carries its own size/alignment/bold. */
    printText(options: { lines: string }): Promise<{ success: boolean }>;
}

/** A single printable line for the Urovo i9100 SDK layout API. */
interface PrintLine {
    text: string;
    size: 'small' | 'normal' | 'large';
    bold: boolean;
    align: 'left' | 'center' | 'right';
}

const UrovoPrinter = registerPlugin<UrovoPrinterPlugin>('UrovoPrinter');

/**
 * Try to print ESC/POS bytes via the native UrovoPrinterPlugin (built-in POS printer).
 * Returns true on success, false if not supported or failed.
 */
async function printViaNativePlugin(commands: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
        // base64-encode the raw ESC/POS bytes
        const bytes = new TextEncoder().encode(commands);
        const base64 = btoa(String.fromCharCode(...Array.from(bytes)));
        const result = await UrovoPrinter.printRaw({ data: base64 });
        console.log(`[NativePrinter] Printed via ${result.method} at ${result.devicePath}`);
        return true;
    } catch (err) {
        console.warn('[NativePrinter] printRaw failed:', err);
        return false;
    }
}

/**
 * Print an array of structured lines via android.device.PrinterManager (Urovo i9100 SDK).
 * Returns true on success, false if the plugin call fails.
 */
async function printViaSdkLines(lines: PrintLine[]): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
        await UrovoPrinter.printText({ lines: JSON.stringify(lines) });
        console.log('[NativePrinter] ✅ Printed via android.device.PrinterManager SDK');
        return true;
    } catch (err) {
        console.warn('[NativePrinter] printText failed:', err);
        return false;
    }
}

export class ThermalPrinter {
    private device: BleDevice | null = null;
    private isWeb = !Capacitor.isNativePlatform();
    private printerService: string | null = null;
    private printerCharacteristic: string | null = null;
    private connectionListeners: Array<(connected: boolean) => void> = [];
    private nativePosAvailable = false; // true when Urovo/POS built-in printer is found

    async initialize() {
        if (!this.isWeb) {
            // Check if device has a built-in POS printer (Urovo i9100, etc.)
            try {
                const info = await UrovoPrinter.isSupported();
                if (info.supported) {
                    this.nativePosAvailable = true;
                    console.log(`✅ [NativePrinter] Built-in POS printer detected on ${info.model} at ${info.devicePath}`);
                    this.notifyConnectionChange(true);
                    return; // No need to init BLE
                }
            } catch (e) {
                console.warn('[NativePrinter] Could not check native printer:', e);
            }

            await BleClient.initialize();
            // Try to restore previous BLE connection
            await this.restoreConnection();
        }
    }

    // Add listener for connection status changes
    addConnectionListener(callback: (connected: boolean) => void) {
        this.connectionListeners.push(callback);
    }

    removeConnectionListener(callback: (connected: boolean) => void) {
        this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
    }

    private notifyConnectionChange(connected: boolean) {
        this.connectionListeners.forEach(cb => cb(connected));
    }

    // Restore previous connection from localStorage
    private async restoreConnection() {
        const savedDeviceId = localStorage.getItem('thermal_printer_id');
        if (savedDeviceId && !this.isWeb) {
            try {
                // Check if device is still connected
                await BleClient.connect(savedDeviceId, () => {
                    console.log('Printer disconnected');
                    this.device = null;
                    this.printerService = null;
                    this.printerCharacteristic = null;
                    this.notifyConnectionChange(false);
                });
                
                const savedName = localStorage.getItem('thermal_printer_name') || 'Thermal Printer';
                this.device = { deviceId: savedDeviceId, name: savedName } as BleDevice;
                
                // Discover services and characteristics
                await this.discoverPrinterCharacteristics(savedDeviceId);
                this.notifyConnectionChange(true);
                console.log('Restored printer connection:', savedName);
            } catch (error) {
                console.log('Could not restore previous connection:', error);
                localStorage.removeItem('thermal_printer_id');
                localStorage.removeItem('thermal_printer_name');
            }
        }
    }

    async scan(): Promise<BleDevice[]> {
        if (this.isWeb) {
            throw new Error('Bluetooth printing not supported in web browser');
        }

        const devices: BleDevice[] = [];
        console.log('🔍 Starting BLE scan for thermal printers...');
        
        await BleClient.requestLEScan(
            {},
            (result) => {
                // Accept ALL BLE devices that have a name — the writable-characteristic
                // discovery step is the real printer filter, not the device name.
                const name = result.device.name || '';
                console.log(`📡 Found BLE device: ${name} (${result.device.deviceId})`);

                if (name && !devices.find(d => d.deviceId === result.device.deviceId)) {
                    devices.push(result.device);
                }
            }
        );

        // Scan for 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        await BleClient.stopLEScan();

        console.log(`🔍 Scan complete. Found ${devices.length} device(s):`, devices.map(d => d.name));
        return devices;
    }

    // Discover printer services and characteristics dynamically
    private async discoverPrinterCharacteristics(deviceId: string) {
        try {
            const services = await BleClient.getServices(deviceId);
            console.log('Discovered services:', services);

            // Look for writable characteristic in any service
            for (const service of services) {
                for (const characteristic of service.characteristics) {
                    // Check if characteristic is writable
                    if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
                        console.log('Found writable characteristic:', {
                            service: service.uuid,
                            characteristic: characteristic.uuid
                        });
                        this.printerService = service.uuid;
                        this.printerCharacteristic = characteristic.uuid;
                        return;
                    }
                }
            }

            throw new Error('No writable characteristic found on printer');
        } catch (error) {
            console.error('Service discovery error:', error);
            throw error;
        }
    }

    async connect(deviceId: string, deviceName?: string): Promise<boolean> {
        if (this.isWeb) {
            throw new Error('Bluetooth printing not supported in web browser');
        }

        try {
            await BleClient.connect(deviceId, () => {
                console.log('Printer disconnected');
                this.device = null;
                this.printerService = null;
                this.printerCharacteristic = null;
                localStorage.removeItem('thermal_printer_id');
                localStorage.removeItem('thermal_printer_name');
                this.notifyConnectionChange(false);
            });

            this.device = { deviceId, name: deviceName || 'Thermal Printer' } as BleDevice;
            
            // Discover services and characteristics
            await this.discoverPrinterCharacteristics(deviceId);
            
            // Save connected device
            localStorage.setItem('thermal_printer_id', deviceId);
            localStorage.setItem('thermal_printer_name', deviceName || 'Thermal Printer');
            
            this.notifyConnectionChange(true);
            return true;
        } catch (error) {
            console.error('Connection error:', error);
            this.device = null;
            return false;
        }
    }

    async disconnect() {
        if (this.device && !this.isWeb) {
            try {
                await BleClient.disconnect(this.device.deviceId);
            } catch (error) {
                console.error('Disconnect error:', error);
            }
            this.device = null;
            this.printerService = null;
            this.printerCharacteristic = null;
            localStorage.removeItem('thermal_printer_id');
            localStorage.removeItem('thermal_printer_name');
            this.notifyConnectionChange(false);
        }
    }

    isConnected(): boolean {
        // Native POS built-in printer counts as connected
        if (this.nativePosAvailable) return true;
        return this.device !== null && this.printerService !== null && this.printerCharacteristic !== null;
    }

    isBuiltInPrinter(): boolean {
        return this.nativePosAvailable;
    }

    /**
     * Auto-detect: silently scan for a short period and connect to the first
     * printer found. Intended to be called on app startup when no saved device
     * is present. Safe to fire-and-forget — it never throws.
     */
    async autoDetect(): Promise<void> {
        // If native POS printer is already available, nothing to do
        if (this.isWeb || this.nativePosAvailable || this.isConnected()) return;

        try {
            console.log('🔍 [AutoDetect] Scanning all BLE devices (5s)...');
            const found: import('@capacitor-community/bluetooth-le').BleDevice[] = [];

            // Accept ALL named BLE devices — no name filter.
            // We try connecting to each one; discoverPrinterCharacteristics
            // confirms it's actually a printer (has a writable characteristic).
            await BleClient.requestLEScan({}, (result) => {
                const name = result.device.name || '';
                if (name && !found.find(d => d.deviceId === result.device.deviceId)) {
                    found.push(result.device);
                    console.log('📡 [AutoDetect] Device found:', name, result.device.deviceId);
                }
            });

            await new Promise(resolve => setTimeout(resolve, 5000));
            await BleClient.stopLEScan();

            if (found.length === 0) {
                console.log('⚠️ [AutoDetect] No BLE devices found during auto-scan.');
                return;
            }

            console.log(`🔗 [AutoDetect] Trying ${found.length} device(s)...`);

            // Try each device until one successfully connects as a printer
            for (const device of found) {
                console.log(`🔗 [AutoDetect] Trying: ${device.name} (${device.deviceId})`);
                const success = await this.connect(device.deviceId, device.name ?? undefined);
                if (success) {
                    console.log('✅ [AutoDetect] Connected to printer:', device.name);
                    return;
                }
                console.log(`↩️ [AutoDetect] ${device.name} has no printer characteristics, skipping.`);
            }

            console.log('⚠️ [AutoDetect] No compatible printer found among scanned devices.');
        } catch (err) {
            console.warn('⚠️ [AutoDetect] Silent failure:', err);
        }
    }

    getConnectedDevice(): BleDevice | null {
        return this.device;
    }

    private async write(data: string) {
        // 1. Try built-in POS printer (Urovo i9100, etc.) first — no BLE pairing needed
        const printedViaNative = await printViaNativePlugin(data);
        if (printedViaNative) return;

        // 2. Fall back to BLE if we have a connected external printer
        if (!this.device || this.isWeb) {
            throw new Error('Printer not connected. No built-in POS printer found and no BLE printer paired.');
        }

        if (!this.printerService || !this.printerCharacteristic) {
            throw new Error('Printer characteristics not discovered. Please reconnect.');
        }

        const encoder = new TextEncoder();
        const bytes = encoder.encode(data);
        const dataView = new DataView(bytes.buffer);

        try {
            console.log('Writing to BLE printer:', {
                service: this.printerService,
                characteristic: this.printerCharacteristic,
                dataLength: bytes.length
            });

            await BleClient.write(
                this.device.deviceId,
                this.printerService,
                this.printerCharacteristic,
                dataView
            );
            
            console.log('Write successful');
        } catch (error: any) {
            console.error('Write error:', error);
            throw new Error(`Failed to write to printer: ${error.message}`);
        }
    }

    async printTest() {
        // SDK path: Urovo i9100 layout API
        if (this.nativePosAvailable) {
            const lines: PrintLine[] = [
                { text: '================================', size: 'small',  bold: false, align: 'center' },
                { text: 'Sabing2m Test Receipt',          size: 'normal', bold: true,  align: 'center' },
                { text: '================================', size: 'small',  bold: false, align: 'center' },
                { text: `Date: ${new Date().toLocaleDateString()}`,  size: 'normal', bold: false, align: 'left' },
                { text: `Time: ${new Date().toLocaleTimeString()}`,  size: 'normal', bold: false, align: 'left' },
                { text: '================================', size: 'small',  bold: false, align: 'center' },
                { text: 'Built-in Printer: OK',           size: 'normal', bold: false, align: 'left' },
                { text: 'Printer Status: Connected',      size: 'normal', bold: false, align: 'left' },
                { text: '================================', size: 'small',  bold: false, align: 'center' },
                { text: '', size: 'normal', bold: false, align: 'left' },
            ];
            const ok = await printViaSdkLines(lines);
            if (ok) return;
        }

        // ESC/POS path: BLE printer
        const commands = [
            `${ESC}@`, // Initialize
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            '================================\n',
            'Sabing2m Test Receipt\n',
            '================================\n',
            `${ESC}a${String.fromCharCode(0)}`, // Left align
            `Date: ${new Date().toLocaleDateString()}\n`,
            `Time: ${new Date().toLocaleTimeString()}\n`,
            '================================\n',
            'Bluetooth Connection: OK\n',
            'Printer Status: Connected\n',
            '================================\n',
            '\n',
            `${GS}V${String.fromCharCode(65)}${String.fromCharCode(0)}`, // Cut paper
        ].join('');

        await this.write(commands);
    }

    async printTicket(ticketData: {
        ticket_id: string;
        fight_number: number;
        side: string;
        amount: number;
        odds: number;
        potential_payout: number;
        event_name?: string;
    }) {
        console.log('[ThermalPrinter] printTicket() called with data:', ticketData);

        const sideDisplay = ticketData.side.toUpperCase();
        const eventName   = ticketData.event_name || 'SABONG EVENT';
        const dateStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        // SDK path: Urovo i9100 layout API
        if (this.nativePosAvailable) {
            const lines: PrintLine[] = [
                { text: eventName,                                         size: 'normal', bold: true,  align: 'center' },
                { text: '================================',                 size: 'small',  bold: false, align: 'center' },
                { text: `Fight: #${ticketData.fight_number}`,              size: 'normal', bold: false, align: 'left'   },
                { text: `Receipt: ${ticketData.ticket_id}`,                size: 'normal', bold: false, align: 'left'   },
                { text: `Date: ${dateStr}`,                                size: 'normal', bold: false, align: 'left'   },
                { text: `Time: ${timeStr}`,                                size: 'normal', bold: false, align: 'left'   },
                { text: '================================',                 size: 'small',  bold: false, align: 'center' },
                { text: `${sideDisplay} - P${ticketData.amount.toLocaleString()}`, size: 'large', bold: true, align: 'center' },
                { text: '================================',                 size: 'small',  bold: false, align: 'center' },
                { text: 'OFFICIAL BETTING RECEIPT',                        size: 'normal', bold: false, align: 'center' },
                { text: '',                                                 size: 'normal', bold: false, align: 'left'   },
            ];
            console.log('[ThermalPrinter] Sending to SDK print path...');
            const ok = await printViaSdkLines(lines);
            if (ok) {
                console.log('[ThermalPrinter] ✅ SDK print completed');
                return;
            }
            console.warn('[ThermalPrinter] SDK print failed, falling through to ESC/POS path');
        }

        console.log('[ThermalPrinter] Building ESC/POS commands...');
        const commands = [
            `${ESC}@`, // Initialize

            // Event Title (centered, smaller)
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            `${eventName}\n`,
            '--------------------------------\n',

            // Print QR Code (size 2 - smaller)
            `${ESC}a${String.fromCharCode(0)}`, // Left align
            `${GS}(k${String.fromCharCode(4)}${String.fromCharCode(0)}${String.fromCharCode(49)}${String.fromCharCode(65)}${String.fromCharCode(50)}${String.fromCharCode(0)}`, // QR Model 2
            `${GS}(k${String.fromCharCode(3)}${String.fromCharCode(0)}${String.fromCharCode(49)}${String.fromCharCode(67)}${String.fromCharCode(2)}`, // QR Size: 2 (smaller)
            `${GS}(k${String.fromCharCode(3)}${String.fromCharCode(0)}${String.fromCharCode(49)}${String.fromCharCode(69)}${String.fromCharCode(48)}`, // QR Error correction: L
            `${GS}(k${String.fromCharCode(ticketData.ticket_id.length + 3)}${String.fromCharCode(0)}${String.fromCharCode(49)}${String.fromCharCode(80)}${String.fromCharCode(48)}${ticketData.ticket_id}`, // QR Data
            `${GS}(k${String.fromCharCode(3)}${String.fromCharCode(0)}${String.fromCharCode(49)}${String.fromCharCode(81)}${String.fromCharCode(48)}`, // Print QR
            '\n',

            // Receipt details (compact format)
            `${ESC}a${String.fromCharCode(0)}`, // Left align
            `#${ticketData.fight_number} | ${ticketData.ticket_id}\n`,
            `${dateStr} ${timeStr}\n`,
            '--------------------------------\n',
            // Bet Info (BIGGER)
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            `${ESC}!${String.fromCharCode(48)}`, // Double height and width + Bold
            `${sideDisplay} - P${ticketData.amount.toLocaleString()}\n`,
            `${ESC}!${String.fromCharCode(0)}`, // Normal
            '--------------------------------\n',
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            'OFFICIAL RECEIPT\n',
            '\n',
            `${GS}V${String.fromCharCode(65)}${String.fromCharCode(0)}`, // Cut paper
        ].join('');

        console.log('[ThermalPrinter] Commands built, length:', commands.length);
        await this.write(commands);
        console.log('[ThermalPrinter] ✅ write() completed');
    }

    async printPayoutReceipt(payoutData: {
        ticket_id: string;
        fight_number: number;
        side: string;
        bet_amount: number;
        odds: number;
        payout_amount: number;
        bet_by: string;
        claimed_by: string;
        event_name?: string;
    }) {
        console.log('[ThermalPrinter] printPayoutReceipt() called with data:', payoutData);

        const sideDisplay = payoutData.side.toUpperCase();
        const eventName   = payoutData.event_name || 'SABONG EVENT';
        const dateStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        // SDK path: Urovo i9100 layout API
        if (this.nativePosAvailable) {
            const lines: PrintLine[] = [
                { text: eventName,                                                    size: 'normal', bold: true,  align: 'center' },
                { text: '================================',                            size: 'small',  bold: false, align: 'center' },
                { text: 'PAYOUT RECEIPT',                                             size: 'normal', bold: true,  align: 'center' },
                { text: '================================',                            size: 'small',  bold: false, align: 'center' },
                { text: `Fight#: ${payoutData.fight_number}`,                         size: 'normal', bold: false, align: 'left'   },
                { text: `Bet By: ${payoutData.bet_by}`,                               size: 'normal', bold: false, align: 'left'   },
                { text: `Claimed By: ${payoutData.claimed_by}`,                       size: 'normal', bold: false, align: 'left'   },
                { text: `Receipt: ${payoutData.ticket_id}`,                           size: 'normal', bold: false, align: 'left'   },
                { text: `Date: ${dateStr}`,                                           size: 'normal', bold: false, align: 'left'   },
                { text: `Time: ${timeStr}`,                                           size: 'normal', bold: false, align: 'left'   },
                { text: '================================',                            size: 'small',  bold: false, align: 'center' },
                { text: `Side: ${sideDisplay}`,                                       size: 'normal', bold: false, align: 'left'   },
                { text: `Bet Amount: P${payoutData.bet_amount.toLocaleString()}`,     size: 'normal', bold: false, align: 'left'   },
                { text: `Odds: ${payoutData.odds}x`,                                  size: 'normal', bold: false, align: 'left'   },
                { text: '================================',                            size: 'small',  bold: false, align: 'center' },
                { text: `PAYOUT: P${payoutData.payout_amount.toLocaleString()}`,      size: 'large',  bold: true,  align: 'center' },
                { text: '================================',                            size: 'small',  bold: false, align: 'center' },
                { text: 'WINNER - CLAIM RECEIPT',                                     size: 'normal', bold: false, align: 'center' },
                { text: '',                                                            size: 'normal', bold: false, align: 'left'   },
            ];
            console.log('[ThermalPrinter] Sending payout to SDK print path...');
            const ok = await printViaSdkLines(lines);
            if (ok) {
                console.log('[ThermalPrinter] ✅ SDK payout print completed');
                return;
            }
            console.warn('[ThermalPrinter] SDK print failed, falling through to ESC/POS path');
        }

        console.log('[ThermalPrinter] Building payout receipt ESC/POS commands...');
        const commands = [
            `${ESC}@`, // Initialize

            // Event Title (centered, BOLD)
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            `${ESC}!${String.fromCharCode(16)}`, // Double width only
            `${eventName}\n`,
            `${ESC}!${String.fromCharCode(0)}`, // Normal font
            '================================\n',

            // Receipt Type
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            `${ESC}!${String.fromCharCode(8)}`, // Bold
            'PAYOUT RECEIPT\n',
            `${ESC}!${String.fromCharCode(0)}`, // Normal
            '================================\n',

            // Receipt details
            `${ESC}a${String.fromCharCode(0)}`, // Left align
            `Fight#: ${payoutData.fight_number}\n`,
            `Bet By: ${payoutData.bet_by}\n`,
            `Claimed By: ${payoutData.claimed_by}\n`,
            `Receipt: ${payoutData.ticket_id}\n`,
            `Date: ${dateStr}\n`,
            `Time: ${timeStr}\n`,
            '================================\n',
            '\n',
            // Bet Info
            `${ESC}a${String.fromCharCode(0)}`, // Left align
            `Side: ${sideDisplay}\n`,
            `Bet Amount: P${payoutData.bet_amount.toLocaleString()}\n`,
            `Odds: ${payoutData.odds}x\n`,
            '================================\n',
            '\n',
            // Payout Amount (BIGGER)
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            `${ESC}!${String.fromCharCode(48)}`, // Double height and width + Bold
            `PAYOUT: P${payoutData.payout_amount.toLocaleString()}\n`,
            `${ESC}!${String.fromCharCode(0)}`, // Normal
            '\n',
            '================================\n',
            '\n',
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            'WINNER - CLAIM RECEIPT\n',
            '\n',
            `${GS}V${String.fromCharCode(65)}${String.fromCharCode(0)}`, // Cut paper
        ].join('');

        console.log('[ThermalPrinter] Commands built, length:', commands.length);
        await this.write(commands);
        console.log('[ThermalPrinter] ✅ Payout receipt printed successfully');
    }

    async printRefundReceipt(refundData: {
        ticket_id: string;
        fight_number: number;
        side: string;
        bet_amount: number;
        refund_amount: number;
        bet_by: string;
        claimed_by: string;
        event_name?: string;
        refund_reason?: string;
    }) {
        console.log('[ThermalPrinter] printRefundReceipt() called with data:', refundData);

        const sideDisplay = refundData.side.toUpperCase();
        const eventName   = refundData.event_name || 'SABONG EVENT';
        const reason      = refundData.refund_reason || 'DRAW';
        const dateStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        // SDK path: Urovo i9100 layout API
        if (this.nativePosAvailable) {
            const lines: PrintLine[] = [
                { text: eventName,                                                    size: 'normal', bold: true,  align: 'center' },
                { text: '================================',                            size: 'small',  bold: false, align: 'center' },
                { text: 'REFUND RECEIPT',                                             size: 'normal', bold: true,  align: 'center' },
                { text: `Reason: ${reason}`,                                          size: 'normal', bold: false, align: 'center' },
                { text: '================================',                            size: 'small',  bold: false, align: 'center' },
                { text: `Fight#: ${refundData.fight_number}`,                         size: 'normal', bold: false, align: 'left'   },
                { text: `Bet By: ${refundData.bet_by}`,                               size: 'normal', bold: false, align: 'left'   },
                { text: `Refunded By: ${refundData.claimed_by}`,                      size: 'normal', bold: false, align: 'left'   },
                { text: `Receipt: ${refundData.ticket_id}`,                           size: 'normal', bold: false, align: 'left'   },
                { text: `Date: ${dateStr}`,                                           size: 'normal', bold: false, align: 'left'   },
                { text: `Time: ${timeStr}`,                                           size: 'normal', bold: false, align: 'left'   },
                { text: '================================',                            size: 'small',  bold: false, align: 'center' },
                { text: `Side: ${sideDisplay}`,                                       size: 'normal', bold: false, align: 'left'   },
                { text: `Bet Amount: P${refundData.bet_amount.toLocaleString()}`,     size: 'normal', bold: false, align: 'left'   },
                { text: '================================',                            size: 'small',  bold: false, align: 'center' },
                { text: `REFUND: P${refundData.refund_amount.toLocaleString()}`,      size: 'large',  bold: true,  align: 'center' },
                { text: '================================',                            size: 'small',  bold: false, align: 'center' },
                { text: `${reason} - REFUND RECEIPT`,                                 size: 'normal', bold: false, align: 'center' },
                { text: '',                                                            size: 'normal', bold: false, align: 'left'   },
            ];
            console.log('[ThermalPrinter] Sending refund to SDK print path...');
            const ok = await printViaSdkLines(lines);
            if (ok) {
                console.log('[ThermalPrinter] ✅ SDK refund print completed');
                return;
            }
            console.warn('[ThermalPrinter] SDK print failed, falling through to ESC/POS path');
        }

        console.log('[ThermalPrinter] Building refund receipt ESC/POS commands...');
        const commands = [
            `${ESC}@`, // Initialize

            // Event Title (centered, BOLD)
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            `${ESC}!${String.fromCharCode(16)}`, // Double width only
            `${eventName}\n`,
            `${ESC}!${String.fromCharCode(0)}`, // Normal font
            '================================\n',

            // Receipt Type
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            `${ESC}!${String.fromCharCode(8)}`, // Bold
            'REFUND RECEIPT\n',
            `${ESC}!${String.fromCharCode(0)}`, // Normal
            `Reason: ${reason}\n`,
            '================================\n',

            // Receipt details
            `${ESC}a${String.fromCharCode(0)}`, // Left align
            `Fight#: ${refundData.fight_number}\n`,
            `Bet By: ${refundData.bet_by}\n`,
            `Refunded By: ${refundData.claimed_by}\n`,
            `Receipt: ${refundData.ticket_id}\n`,
            `Date: ${dateStr}\n`,
            `Time: ${timeStr}\n`,
            '================================\n',
            '\n',
            // Bet Info
            `${ESC}a${String.fromCharCode(0)}`, // Left align
            `Side: ${sideDisplay}\n`,
            `Bet Amount: P${refundData.bet_amount.toLocaleString()}\n`,
            '================================\n',
            '\n',
            // Refund Amount (BIGGER)
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            `${ESC}!${String.fromCharCode(48)}`, // Double height and width + Bold
            `REFUND: P${refundData.refund_amount.toLocaleString()}\n`,
            `${ESC}!${String.fromCharCode(0)}`, // Normal
            '\n',
            '================================\n',
            '\n',
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            `${reason} - REFUND RECEIPT\n`,
            '\n',
            `${GS}V${String.fromCharCode(65)}${String.fromCharCode(0)}`, // Cut paper
        ].join('');

        console.log('[ThermalPrinter] Commands built, length:', commands.length);
        await this.write(commands);
        console.log('[ThermalPrinter] ✅ Refund receipt printed successfully');
    }
}

export const thermalPrinter = new ThermalPrinter();

