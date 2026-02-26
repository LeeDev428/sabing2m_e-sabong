import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

// ESC/POS Commands for thermal printers
const ESC = '\x1B';
const GS = '\x1D';

export class ThermalPrinter {
    private device: BleDevice | null = null;
    private isWeb = !Capacitor.isNativePlatform();
    private printerService: string | null = null;
    private printerCharacteristic: string | null = null;
    private connectionListeners: Array<(connected: boolean) => void> = [];

    async initialize() {
        if (!this.isWeb) {
            await BleClient.initialize();
            // Try to restore previous connection
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
            {
                // Scan for all devices (PT-210, PT0-CA95, and others)
                // namePrefix: 'PT', // Removed filter to find all devices
            },
            (result) => {
                // Filter for printer-like devices by name
                const name = result.device.name?.toLowerCase() || '';
                console.log(`📡 Found BLE device: ${result.device.name} (${result.device.deviceId})`);
                
                const isPrinter = name.includes('pt') || 
                                 name.includes('printer') || 
                                 name.includes('thermal') ||
                                 name.includes('pos') ||
                                 name.includes('rpp') ||
                                 name.includes('xp') ||    // XP series (XP-MTP2)
                                 name.includes('t58') ||   // T58 model
                                 name.includes('mtp') ||   // Mobile Thermal Printer
                                 name.includes('bt') ||    // Bluetooth printers
                                 name.includes('58mm') ||  // 58mm thermal printers
                                 name.includes('80mm');    // 80mm thermal printers
                
                if (isPrinter && !devices.find(d => d.deviceId === result.device.deviceId)) {
                    console.log(`✅ Detected thermal printer: ${result.device.name}`);
                    devices.push(result.device);
                }
            }
        );

        // Scan for 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        await BleClient.stopLEScan();

        console.log(`🔍 Scan complete. Found ${devices.length} printer(s):`, devices.map(d => d.name));
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
        return this.device !== null && this.printerService !== null && this.printerCharacteristic !== null;
    }

    /**
     * Auto-detect: silently scan for a short period and connect to the first
     * printer found. Intended to be called on app startup when no saved device
     * is present. Safe to fire-and-forget — it never throws.
     */
    async autoDetect(): Promise<void> {
        if (this.isWeb || this.isConnected()) return;

        try {
            console.log('🔍 [AutoDetect] Scanning for printers (3s)...');
            const found: import('@capacitor-community/bluetooth-le').BleDevice[] = [];

            await BleClient.requestLEScan({}, (result) => {
                const name = (result.device.name ?? '').toLowerCase();
                const isPrinter =
                    name.includes('pt') || name.includes('printer') ||
                    name.includes('thermal') || name.includes('pos') ||
                    name.includes('rpp') || name.includes('xp') ||
                    name.includes('t58') || name.includes('mtp') ||
                    name.includes('bt') || name.includes('58mm') ||
                    name.includes('80mm');
                if (isPrinter && !found.find(d => d.deviceId === result.device.deviceId)) {
                    found.push(result.device);
                    console.log('🖨️ [AutoDetect] Printer candidate:', result.device.name);
                }
            });

            await new Promise(resolve => setTimeout(resolve, 3000));
            await BleClient.stopLEScan();

            if (found.length === 0) {
                console.log('⚠️ [AutoDetect] No printers found during auto-scan.');
                return;
            }

            const target = found[0];
            console.log(`🔗 [AutoDetect] Auto-connecting to ${target.name}...`);
            await this.connect(target.deviceId, target.name ?? undefined);
            console.log('✅ [AutoDetect] Connected to', target.name);
        } catch (err) {
            console.warn('⚠️ [AutoDetect] Silent failure:', err);
        }
    }

    getConnectedDevice(): BleDevice | null {
        return this.device;
    }

    private async write(data: string) {
        if (!this.device || this.isWeb) {
            throw new Error('Printer not connected');
        }

        if (!this.printerService || !this.printerCharacteristic) {
            throw new Error('Printer characteristics not discovered. Please reconnect.');
        }

        const encoder = new TextEncoder();
        const bytes = encoder.encode(data);
        
        // Convert to DataView
        const dataView = new DataView(bytes.buffer);
        
        try {
            console.log('Writing to printer:', {
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
        const eventName = ticketData.event_name || 'SABONG EVENT';
        
        console.log('[ThermalPrinter] Building ESC/POS commands with QR code...');
        console.log('[ThermalPrinter] Event name to print:', eventName);
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
            `${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}\n`,
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
        console.log('[ThermalPrinter] Calling write()...');
        
        try {
            await this.write(commands);
            console.log('[ThermalPrinter] ✅ write() completed successfully');
        } catch (error) {
            console.error('[ThermalPrinter] ❌ write() failed:', error);
            throw error;
        }
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
        const eventName = payoutData.event_name || 'SABONG EVENT';
        
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
            `Date: ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}\n`,
            `Time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}\n`,
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
        console.log('[ThermalPrinter] Calling write()...');
        
        try {
            await this.write(commands);
            console.log('[ThermalPrinter] ✅ Payout receipt printed successfully');
        } catch (error) {
            console.error('[ThermalPrinter] ❌ Payout receipt print failed:', error);
            throw error;
        }
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
        const eventName = refundData.event_name || 'SABONG EVENT';
        const reason = refundData.refund_reason || 'DRAW';
        
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
            `Date: ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}\n`,
            `Time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}\n`,
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
        console.log('[ThermalPrinter] Calling write()...');
        
        try {
            await this.write(commands);
            console.log('[ThermalPrinter] ✅ Refund receipt printed successfully');
        } catch (error) {
            console.error('[ThermalPrinter] ❌ Refund receipt print failed:', error);
            throw error;
        }
    }
}

export const thermalPrinter = new ThermalPrinter();
