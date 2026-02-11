import { Head, router } from '@inertiajs/react';
import TellerLayout from '@/layouts/teller-layout';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { showToast } from '@/components/toast';
import { PermissionManager } from '@/utils/permissionManager';
import { thermalPrinter } from '@/utils/thermalPrinter';

interface PayoutScanProps {
    message?: string;
    claimData?: {
        amount: number;
        bet_by: string;
        claimed_by: string;
        status: string;
        already_claimed?: boolean;
        ticket_id?: string;
        fight_number?: number;
        side?: string;
        bet_amount?: number;
        odds?: number;
        event_name?: string;
        is_refund?: boolean;
        refund_reason?: string;
    };
}

export default function PayoutScan({ message, claimData }: PayoutScanProps) {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isPrinterConnected, setIsPrinterConnected] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);

    // Check printer connection on mount
    useEffect(() => {
        thermalPrinter.initialize().then(() => {
            setIsPrinterConnected(thermalPrinter.isConnected());
        });

        const handleConnectionChange = (connected: boolean) => {
            setIsPrinterConnected(connected);
        };

        thermalPrinter.addConnectionListener(handleConnectionChange);

        return () => {
            thermalPrinter.removeConnectionListener(handleConnectionChange);
        };
    }, []);

    // Auto-print receipt when claim/refund is successful
    useEffect(() => {
        if (claimData && !claimData.already_claimed && isPrinterConnected) {
            if (claimData.is_refund) {
                handlePrintRefund();
            } else {
                handlePrintPayout();
            }
        }
    }, [claimData, isPrinterConnected]);

    useEffect(() => {
        return () => {
            // Cleanup on unmount - only stop if scanner is actively running
            if (html5QrCodeRef.current && isScanningRef.current) {
                html5QrCodeRef.current.stop().catch((err) => {
                    console.log('Scanner cleanup:', err.message);
                });
            }
        };
    }, []);

    const handlePrintPayout = async () => {
        if (!isPrinterConnected) {
            showToast('❌ Printer not connected', 'error', 3000);
            return;
        }

        if (!claimData) {
            showToast('❌ No claim data available', 'error', 3000);
            return;
        }

        try {
            await thermalPrinter.printPayoutReceipt({
                ticket_id: claimData.ticket_id || 'N/A',
                fight_number: claimData.fight_number || 0,
                side: claimData.side || 'N/A',
                bet_amount: claimData.bet_amount || 0,
                odds: claimData.odds || 1.0,
                payout_amount: claimData.amount,
                bet_by: claimData.bet_by,
                claimed_by: claimData.claimed_by,
                event_name: claimData.event_name,
            });
            showToast('✅ Payout receipt printed!', 'success', 2000);
        } catch (error: any) {
            console.error('Print error:', error);
            showToast(`❌ Print failed: ${error.message}`, 'error', 3000);
        }
    };

    const handlePrintRefund = async () => {
        if (!isPrinterConnected) {
            showToast('❌ Printer not connected', 'error', 3000);
            return;
        }

        if (!claimData) {
            showToast('❌ No claim data available', 'error', 3000);
            return;
        }

        try {
            await thermalPrinter.printRefundReceipt({
                ticket_id: claimData.ticket_id || 'N/A',
                fight_number: claimData.fight_number || 0,
                side: claimData.side || 'N/A',
                bet_amount: claimData.bet_amount || 0,
                refund_amount: claimData.amount,
                bet_by: claimData.bet_by,
                claimed_by: claimData.claimed_by,
                event_name: claimData.event_name,
                refund_reason: claimData.refund_reason || 'DRAW',
            });
            showToast('✅ Refund receipt printed!', 'success', 2000);
        } catch (error: any) {
            console.error('Print error:', error);
            showToast(`❌ Print failed: ${error.message}`, 'error', 3000);
        }
    };

    const startScanning = async () => {
        try {
            setCameraError(null);
            setResult(null);
            setScanning(true); // Set scanning to true FIRST so div is visible
            
            // Wait a bit for the div to be rendered
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Request camera permission with proper error handling
            const permissionResult = await PermissionManager.ensureCameraPermission();
            if (!permissionResult.granted) {
                setCameraError(permissionResult.error || 'Camera permission denied');
                setScanning(false);
                showToast('⚠️ ' + (permissionResult.error || 'Camera permission denied'), 'error', 5000);
                return;
            }
            
            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    // QR Code scanned successfully
                    console.log('🎯 Payout QR Code scanned:', decodedText);
                    setResult(decodedText);
                    isScanningRef.current = false;
                    html5QrCode.stop();
                    setScanning(false);
                    
                    // Send claim request to backend
                    console.log('💰 Sending payout claim request...');
                    router.post('/teller/payout-scan/claim', {
                        ticket_id: decodedText
                    }, {
                        preserveScroll: false,
                        onSuccess: (page) => {
                            console.log('✅ Payout claim successful:', page.props);
                            // Page will reload and show success message
                        },
                        onError: (errors) => {
                            console.error('❌ Payout claim failed:', errors);
                            const errorMsg = typeof errors === 'object' ? JSON.stringify(errors) : String(errors);
                            setCameraError(errorMsg);
                            showToast(`❌ Failed to claim: ${errorMsg}`, 'error', 5000);
                        }
                    });
                },
                (errorMessage) => {
                    // Ignore scanning errors (happens continuously)
                }
            );
            
            isScanningRef.current = true;
            console.log('✅ Payout scanner started successfully');

        } catch (error: any) {
            console.error('❌ Payout scanner failed to start:', error);
            const errorMsg = error.message || 'Failed to start camera';
            setCameraError(errorMsg);
            setScanning(false);
            isScanningRef.current = false;
            showToast(`⚠️ Camera error: ${errorMsg}`, 'error', 5000);
        }
    };

    const stopScanning = () => {
        if (html5QrCodeRef.current && isScanningRef.current) {
            isScanningRef.current = false;
            html5QrCodeRef.current.stop()
                .then(() => {
                    setScanning(false);
                    html5QrCodeRef.current = null;
                })
                .catch((err) => {
                    console.log('Stop scanner error:', err.message);
                    setScanning(false);
                });
        }
    };

    return (
        <TellerLayout currentPage="payout">
            <Head title="Payout Scanning" />

            <div className="p-4 max-w-md mx-auto">
                {/* Header */}
                <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-700">
                    <h1 className="text-2xl font-bold text-orange-500 mb-1">Payout Scanning</h1>
                    <p className="text-sm text-gray-400">Scan QR code on bet ticket to claim winnings</p>
                </div>

                {/* Camera Display */}
                {!claimData && !message && (
                    <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-700">
                        <div id="qr-reader" className={`rounded-lg overflow-hidden ${scanning ? '' : 'hidden'}`}></div>
                        
                        {!scanning && !cameraError && (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📷</div>
                                <p className="text-gray-400 mb-4">Ready to scan QR code</p>
                                <button
                                    onClick={startScanning}
                                    className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-bold"
                                >
                                    Start Camera
                                </button>
                            </div>
                        )}

                        {cameraError && (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">⚠️</div>
                                <p className="text-red-400 mb-4">{cameraError}</p>
                                <button
                                    onClick={startScanning}
                                    className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-bold"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {scanning && (
                            <div className="text-center mt-4">
                                <button
                                    onClick={stopScanning}
                                    className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-bold"
                                >
                                    Stop Scanning
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Success Message - Win */}
                {claimData && !claimData.already_claimed && !claimData.is_refund && (
                    <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-6 mb-4">
                        <div className="text-center mb-6">
                            <div className="text-7xl mb-4">✅</div>
                            <h2 className="text-3xl font-bold text-green-400 mb-2">Success!</h2>
                            <p className="text-white text-xl">Claimed Successfully</p>
                        </div>

                        <div className="space-y-3 bg-[#1a1a1a] rounded-lg p-4">
                            {/* Fight Number */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Fight#:</span>
                                <span className="text-white font-semibold">{(claimData as any).fight_number || 'N/A'}</span>
                            </div>
                            
                            {/* Teller */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Teller:</span>
                                <span className="text-white font-semibold">{claimData.bet_by}</span>
                            </div>
                            
                            {/* Receipt/Ticket ID */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Receipt:</span>
                                <span className="text-white font-semibold text-xs">{(claimData as any).ticket_id || 'N/A'}</span>
                            </div>
                            
                            {/* Date and Time */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Date:</span>
                                <span className="text-white font-semibold">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Time:</span>
                                <span className="text-white font-semibold">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                            </div>
                            
                            {/* Divider */}
                            <div className="border-t-2 border-gray-700 my-2"></div>
                            
                            {/* Side and Amount - BIG */}
                            <div className="text-center py-4">
                                <div className="text-4xl font-bold text-yellow-400">
                                    {((claimData as any).side || 'N/A').toUpperCase()} - ₱{claimData.amount.toLocaleString()}
                                </div>
                            </div>
                            
                            {/* Divider */}
                            <div className="border-t-2 border-gray-700 my-2"></div>
                            
                            {/* Claimed By */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Claimed By:</span>
                                <span className="text-white font-semibold">{claimData.claimed_by}</span>
                            </div>
                            
                            {/* Status */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Status:</span>
                                <span className="text-green-400 font-bold">{claimData.status}</span>
                            </div>
                            
                            {/* Official Receipt Badge */}
                            <div className="text-center pt-2">
                                <div className="text-sm font-bold text-gray-400">OFFICIAL BETTING RECEIPT</div>
                            </div>
                        </div>

                        <button
                            onClick={handlePrintPayout}
                            disabled={!isPrinterConnected}
                            className={`w-full mt-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
                                isPrinterConnected
                                    ? 'bg-purple-600 hover:bg-purple-700'
                                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                        >
                            <span>🖨️</span> Print Payout Receipt
                        </button>

                        <button
                            onClick={() => router.visit('/teller/payout-scan')}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold"
                        >
                            Scan Another
                        </button>
                    </div>
                )}

                {/* Refund Success - Draw/Cancelled */}
                {claimData && !claimData.already_claimed && claimData.is_refund && (
                    <div className="bg-orange-900/30 border-2 border-orange-500 rounded-lg p-6 mb-4">
                        <div className="text-center mb-6">
                            <div className="text-7xl mb-4">💰</div>
                            <h2 className="text-3xl font-bold text-orange-400 mb-2">Refund Processed!</h2>
                            <p className="text-white text-xl">Fight {claimData.refund_reason || 'DRAW'} — Full Refund</p>
                        </div>

                        <div className="space-y-3 bg-[#1a1a1a] rounded-lg p-4">
                            {/* Fight Number */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Fight#:</span>
                                <span className="text-white font-semibold">{claimData.fight_number || 'N/A'}</span>
                            </div>
                            
                            {/* Teller */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Teller:</span>
                                <span className="text-white font-semibold">{claimData.bet_by}</span>
                            </div>
                            
                            {/* Receipt/Ticket ID */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Receipt:</span>
                                <span className="text-white font-semibold text-xs">{claimData.ticket_id || 'N/A'}</span>
                            </div>

                            {/* Reason */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Reason:</span>
                                <span className="text-orange-400 font-bold">{claimData.refund_reason || 'DRAW'}</span>
                            </div>
                            
                            {/* Date and Time */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Date:</span>
                                <span className="text-white font-semibold">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Time:</span>
                                <span className="text-white font-semibold">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                            </div>
                            
                            {/* Divider */}
                            <div className="border-t-2 border-gray-700 my-2"></div>
                            
                            {/* Refund Amount - BIG */}
                            <div className="text-center py-4">
                                <div className="text-lg text-gray-400 mb-1">REFUND AMOUNT</div>
                                <div className="text-4xl font-bold text-orange-400">
                                    ₱{claimData.amount.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                    ({(claimData.side || 'N/A').toUpperCase()} — Bet: ₱{(claimData.bet_amount || 0).toLocaleString()})
                                </div>
                            </div>
                            
                            {/* Divider */}
                            <div className="border-t-2 border-gray-700 my-2"></div>
                            
                            {/* Claimed By */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Refunded By:</span>
                                <span className="text-white font-semibold">{claimData.claimed_by}</span>
                            </div>
                            
                            {/* Status */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Status:</span>
                                <span className="text-orange-400 font-bold">{claimData.status}</span>
                            </div>
                            
                            {/* Official Refund Badge */}
                            <div className="text-center pt-2">
                                <div className="text-sm font-bold text-gray-400">OFFICIAL REFUND RECEIPT</div>
                            </div>
                        </div>

                        <button
                            onClick={handlePrintRefund}
                            disabled={!isPrinterConnected}
                            className={`w-full mt-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
                                isPrinterConnected
                                    ? 'bg-purple-600 hover:bg-purple-700'
                                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                        >
                            <span>🖨️</span> Print Refund Receipt
                        </button>

                        <button
                            onClick={() => router.visit('/teller/payout-scan')}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold"
                        >
                            Scan Another
                        </button>
                    </div>
                )}

                {/* Already Claimed */}
                {claimData && claimData.already_claimed && (
                    <div className="bg-yellow-900/30 border-2 border-yellow-500 rounded-lg p-6 mb-4">
                        <div className="text-center mb-4">
                            <div className="text-7xl mb-4">⚠️</div>
                            <h2 className="text-3xl font-bold text-yellow-400 mb-2">Already Claimed!</h2>
                            <p className="text-white">This ticket has already been redeemed</p>
                        </div>

                        <button
                            onClick={() => router.visit('/teller/payout-scan')}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold"
                        >
                            Scan Another
                        </button>
                    </div>
                )}

                {/* Error Message - Lost */}
                {message && message.includes('Lost') && (
                    <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-6 mb-4">
                        <div className="text-center mb-4">
                            <div className="text-7xl mb-4">❌</div>
                            <h2 className="text-3xl font-bold text-red-400 mb-2">Cannot Claim</h2>
                            <p className="text-white text-xl">{message}</p>
                        </div>

                        <button
                            onClick={() => router.visit('/teller/payout-scan')}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold"
                        >
                            Scan Another
                        </button>
                    </div>
                )}

                {/* General Error */}
                {message && !message.includes('Lost') && !claimData && (
                    <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-6 mb-4">
                        <div className="text-center mb-4">
                            <div className="text-7xl mb-4">⚠️</div>
                            <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
                            <p className="text-white">{message}</p>
                        </div>

                        <button
                            onClick={() => router.visit('/teller/payout-scan')}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
                    <h3 className="font-bold text-lg mb-2">📋 Instructions</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">1.</span>
                            <span>Click "Start Camera" to activate the QR scanner</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">2.</span>
                            <span>Position the bet ticket QR code within the camera view</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">3.</span>
                            <span>Wait for automatic detection and claim validation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">4.</span>
                            <span>View claim status and payout amount</span>
                        </li>
                    </ul>
                </div>
            </div>
        </TellerLayout>
    );
}
