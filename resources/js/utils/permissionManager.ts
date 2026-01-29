import { Camera } from '@capacitor/camera';
import { BleClient } from '@capacitor-community/bluetooth-le';

export class PermissionManager {
    private static permissionsRequested = false;

    /**
     * Request all necessary permissions on app startup
     * Call this once when the app initializes
     */
    static async requestAllPermissions(): Promise<void> {
        if (this.permissionsRequested) {
            console.log('⏭️ Permissions already requested this session');
            return;
        }

        console.log('🔐 Requesting all app permissions...');

        try {
            // Request Camera Permission
            await this.requestCameraPermission();
            
            // Request Bluetooth Permission (BLE library handles this)
            await this.requestBluetoothPermission();
            
            // Request Location Permission (needed for Bluetooth scanning)
            await this.requestLocationPermission();
            
            this.permissionsRequested = true;
            console.log('✅ All permissions requested successfully');
        } catch (error) {
            console.error('❌ Error requesting permissions:', error);
        }
    }

    /**
     * Request camera permission
     */
    static async requestCameraPermission(): Promise<boolean> {
        try {
            console.log('📷 Requesting camera permission...');
            
            // Use getUserMedia to request camera permission
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: "environment" } 
                });
                // Stop the stream immediately, we just needed permission
                stream.getTracks().forEach(track => track.stop());
                console.log('✅ Camera permission granted');
                return true;
            }
            
            return false;
        } catch (error) {
            console.log('❌ Camera permission denied:', error);
            return false;
        }
    }

    /**
     * Request Bluetooth permission (handled by BLE library)
     */
    static async requestBluetoothPermission(): Promise<boolean> {
        try {
            console.log('📡 Initializing Bluetooth...');
            await BleClient.initialize();
            console.log('✅ Bluetooth initialized');
            return true;
        } catch (error) {
            console.log('❌ Bluetooth initialization failed:', error);
            return false;
        }
    }

    /**
     * Request location permission (needed for Bluetooth scanning on Android)
     */
    static async requestLocationPermission(): Promise<boolean> {
        try {
            console.log('📍 Requesting location permission...');
            
            // Use geolocation API to request location permission
            if (navigator.geolocation) {
                await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            console.log('✅ Location permission granted');
                            resolve(position);
                        },
                        (error) => {
                            console.log('⚠️ Location permission denied (may be ok):', error);
                            resolve(null); // Don't fail if location denied
                        },
                        { timeout: 5000 }
                    );
                });
                return true;
            }
            
            return false;
        } catch (error) {
            console.log('❌ Location permission error:', error);
            return false;
        }
    }

    /**
     * Check if camera permission is granted
     */
    static async hasCameraPermission(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Request camera permission with user-friendly error handling
     */
    static async ensureCameraPermission(): Promise<{ granted: boolean; error?: string }> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            stream.getTracks().forEach(track => track.stop());
            return { granted: true };
        } catch (error: any) {
            if (error.name === 'NotAllowedError') {
                return { 
                    granted: false, 
                    error: 'Camera permission denied. Please go to Settings > Apps > eSabong > Permissions and enable Camera.' 
                };
            } else if (error.name === 'NotFoundError') {
                return { 
                    granted: false, 
                    error: 'No camera found on this device.' 
                };
            } else {
                return { 
                    granted: false, 
                    error: `Camera error: ${error.message || 'Unknown error'}` 
                };
            }
        }
    }
}
