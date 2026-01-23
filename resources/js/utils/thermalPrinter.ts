import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

// ESC/POS Commands for thermal printers
const ESC = '\x1B';
const GS = '\x1D';

export class ThermalPrinter {
    private device: BleDevice | null = null;
    private isWeb = !Capacitor.isNativePlatform();
    
    // Service and characteristic UUIDs for thermal printers
    // These are common for most ESC/POS thermal printers
    private readonly PRINTER_SERVICE = '000018f0-0000-1000-8000-00805f9b34fb';
    private readonly PRINTER_CHARACTERISTIC = '00002af1-0000-1000-8000-00805f9b34fb';

    async initialize() {
        if (!this.isWeb) {
            await BleClient.initialize();
        }
    }

    async scan(): Promise<BleDevice[]> {
        if (this.isWeb) {
            throw new Error('Bluetooth printing not supported in web browser');
        }

        const devices: BleDevice[] = [];
        
        await BleClient.requestLEScan(
            {
                // Common printer name patterns
                namePrefix: 'PT',
            },
            (result) => {
                if (!devices.find(d => d.deviceId === result.device.deviceId)) {
                    devices.push(result.device);
                }
            }
        );

        // Scan for 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        await BleClient.stopLEScan();

        return devices;
    }

    async connect(deviceId: string): Promise<boolean> {
        if (this.isWeb) {
            throw new Error('Bluetooth printing not supported in web browser');
        }

        try {
            await BleClient.connect(deviceId, () => {
                console.log('Printer disconnected');
                this.device = null;
            });

            this.device = { deviceId, name: 'Thermal Printer' } as BleDevice;
            
            // Save connected device
            localStorage.setItem('thermal_printer_id', deviceId);
            
            return true;
        } catch (error) {
            console.error('Connection error:', error);
            return false;
        }
    }

    async disconnect() {
        if (this.device && !this.isWeb) {
            await BleClient.disconnect(this.device.deviceId);
            this.device = null;
            localStorage.removeItem('thermal_printer_id');
        }
    }

    isConnected(): boolean {
        return this.device !== null;
    }

    getConnectedDevice(): BleDevice | null {
        return this.device;
    }

    private async write(data: string) {
        if (!this.device || this.isWeb) {
            throw new Error('Printer not connected');
        }

        const encoder = new TextEncoder();
        const bytes = encoder.encode(data);
        
        try {
            // Try to write to the printer characteristic
            await BleClient.write(
                this.device.deviceId,
                this.PRINTER_SERVICE,
                this.PRINTER_CHARACTERISTIC,
                bytes.buffer as DataView
            );
        } catch (error) {
            console.error('Write error:', error);
            throw error;
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
            '\n\n\n',
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
    }) {
        const sideDisplay = ticketData.side.toUpperCase();
        
        const commands = [
            `${ESC}@`, // Initialize
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            `${ESC}!${String.fromCharCode(16)}`, // Double width
            'EVENTITLE\n',
            `${ESC}!${String.fromCharCode(0)}`, // Normal
            '================================\n',
            `${ESC}a${String.fromCharCode(0)}`, // Left align
            `Fight #: ${ticketData.fight_number}\n`,
            `Receipt: ${ticketData.ticket_id.substring(0, 12)}\n`,
            `Date: ${new Date().toLocaleDateString()}\n`,
            `Time: ${new Date().toLocaleTimeString()}\n`,
            '--------------------------------\n',
            `${ESC}!${String.fromCharCode(8)}`, // Emphasized
            `${sideDisplay} - P${ticketData.amount.toLocaleString()}\n`,
            `${ESC}!${String.fromCharCode(0)}`, // Normal
            `Odds: x${ticketData.odds}\n`,
            `Potential Win: P${ticketData.potential_payout.toLocaleString()}\n`,
            '================================\n',
            `${ESC}a${String.fromCharCode(1)}`, // Center align
            'OFFICIAL BETTING RECEIPT\n',
            'Keep this receipt\n',
            '\n\n\n',
            `${GS}V${String.fromCharCode(65)}${String.fromCharCode(0)}`, // Cut paper
        ].join('');

        await this.write(commands);
    }
}

export const thermalPrinter = new ThermalPrinter();
