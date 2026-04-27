import { Head, router } from '@inertiajs/react';
import TellerLayout from '@/layouts/teller-layout';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { showToast } from '@/components/toast';
import { PermissionManager } from '@/utils/permissionManager';
import { thermalPrinter } from '@/utils/thermalPrinter';

interface PayoutScanProps {
    message?: string;
    payoutTracking?: {
        winning_tickets: number;
        winning_amount: number;
        unclaimed_tickets: number;
        unclaimed_amount: number;
        paid_out_tickets: number;
        paid_out_amount: number;
    };
    unclaimedWinningTickets?: Array<{
        ticket_id: string;
        fight_number?: number;
        event_name?: string;
        side: string;
        payout_amount: number;
        sold_by?: string;
        created_at?: string;
    }>;
    paidOutWinningTickets?: Array<{
        ticket_id: string;
        fight_number?: number;
        event_name?: string;
        side: string;
        payout_amount: number;
        sold_by?: string;
        claimed_by?: string;
        claimed_at?: string;
    }>;
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

export default function PayoutScan({
    message,
    claimData,
    payoutTracking,
    unclaimedWinningTickets = [],
    paidOutWinningTickets = [],
}: PayoutScanProps) {
    const QR_READER_ID = 'payout-qr-reader';
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isPrinterConnected, setIsPrinterConnected] = useState(false);
    const [manualTicketId, setManualTicketId] = useState('');
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
        const autoPrint = async () => {
            if (claimData && !claimData.already_claimed && isPrinterConnected) {
                try {
                    if (claimData.is_refund) {
                        await handlePrintRefund();
                    } else {
                        await handlePrintPayout();
                    }
                } catch (error) {
                    console.error('Auto-print failed:', error);
                    // Don't show toast on auto-print failure, user can manually print
                }
            }
        };
        
        autoPrint();
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
            const betAmount = claimData.bet_amount ?? claimData.amount ?? 0;
            const odds = claimData.odds ?? 1.0;
            
            await thermalPrinter.printPayoutReceipt({
                ticket_id: claimData.ticket_id || 'N/A',
                fight_number: claimData.fight_number || 0,
                side: claimData.side || 'N/A',
                bet_amount: Number(betAmount),
                odds: Number(odds),
                payout_amount: Number(claimData.amount),
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

            // Wait a bit for the scanner container to render
            await new Promise(resolve => setTimeout(resolve, 150));

            // Ensure any previous scanner instance is fully cleaned up
            if (html5QrCodeRef.current) {
                try {
                    await html5QrCodeRef.current.stop();
                } catch {
                    // Ignore stop errors for stale scanner instances
                }
                try {
                    await html5QrCodeRef.current.clear();
                } catch {
                    // Ignore clear errors
                }
                html5QrCodeRef.current = null;
            }
            
            // Request camera permission with proper error handling
            const permissionResult = await PermissionManager.ensureCameraPermission();
            if (!permissionResult.granted) {
                setCameraError(permissionResult.error || 'Camera permission denied');
                setScanning(false);
                showToast('⚠️ ' + (permissionResult.error || 'Camera permission denied'), 'error', 5000);
                return;
            }
            
            const html5QrCode = new Html5Qrcode(QR_READER_ID);
            html5QrCodeRef.current = html5QrCode;
            isScanningRef.current = true;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    disableFlip: true,
                },
                async (decodedText) => {
                    // QR Code scanned successfully
                    console.log('🎯 Payout QR Code scanned:', decodedText);
                    setResult(decodedText);
                    isScanningRef.current = false;
                    try {
                        await html5QrCode.stop();
                    } catch {
                        // Ignore stop errors if stream already ended
                    }
                    try {
                        await html5QrCode.clear();
                    } catch {
                        // Ignore clear errors
                    }
                    html5QrCodeRef.current = null;
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
                .then(async () => {
                    try {
                        await html5QrCodeRef.current?.clear();
                    } catch {
                        // Ignore clear errors
                    }
                    setScanning(false);
                    html5QrCodeRef.current = null;
                })
                .catch((err) => {
                    console.log('Stop scanner error:', err.message);
                    setScanning(false);
                });
        }
    };

    const handleManualClaim = () => {
        const ticketId = manualTicketId.trim();
        if (!ticketId) {
            showToast('⚠️ Please enter a ticket ID', 'error', 3000);
            return;
        }
        router.post('/teller/payout-scan/claim', { ticket_id: ticketId }, {
            preserveScroll: false,
            onError: (errors) => {
                const errorMsg = typeof errors === 'object' ? Object.values(errors).join(', ') : String(errors);
                showToast(`❌ ${errorMsg}`, 'error', 5000);
            }
        });
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
                        <div className="relative rounded-lg overflow-hidden min-h-[320px] bg-black/20 border border-gray-700/60">
                            <div
                                id={QR_READER_ID}
                                className={`h-[320px] w-full transition-opacity duration-200 ${scanning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            ></div>

                            {!scanning && !cameraError && (
                                <div className="absolute inset-0 text-center py-12 flex flex-col items-center justify-center">
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
                                <div className="absolute inset-0 text-center py-12 flex flex-col items-center justify-center">
                                    <div className="text-6xl mb-4">⚠️</div>
                                    <p className="text-red-400 mb-4 px-4">{cameraError}</p>
                                    <button
                                        onClick={startScanning}
                                        className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-bold"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>

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

                {/* Manual Ticket Search */}
                {!claimData && !message && (
                    <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-700">
                        <h3 className="font-bold text-sm text-gray-300 mb-3">🔍 Manual Search (Type Ticket ID)</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualTicketId}
                                onChange={(e) => setManualTicketId(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleManualClaim()}
                                placeholder="e.g. TKT-XXXXXXXX"
                                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleManualClaim}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap"
                            >
                                Claim
                            </button>
                        </div>
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
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Date/Time:</span>
                                <span className="text-white font-semibold">{new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                            </div>
                            
                            {/* Divider */}
                            <div className="border-t-2 border-gray-700 my-2"></div>
                            
                            {/* Side and Amount - BIG */}
                            <div className="text-center py-4">
                                <div className="text-lg text-gray-400 mb-1">CLAIM AMOUNT</div>
                                <div className="text-4xl font-bold text-yellow-400 mb-1">
                                    ₱{claimData.amount.toLocaleString()}
                                </div>
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
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Date/Time:</span>
                                <span className="text-white font-semibold">{new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
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

                {/* Payout Tracking Stats */}
                {payoutTracking && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-3">
                                <div className="text-xs text-blue-200 uppercase tracking-wide mb-1">Winning Tickets</div>
                                <div className="text-2xl font-bold text-white">{payoutTracking.winning_tickets}</div>
                                <div className="text-sm text-blue-300">₱{Number(payoutTracking.winning_amount || 0).toLocaleString()}</div>
                            </div>

                            <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-3">
                                <div className="text-xs text-yellow-200 uppercase tracking-wide mb-1">Not Claimed / Scanned</div>
                                <div className="text-2xl font-bold text-white">{payoutTracking.unclaimed_tickets}</div>
                                <div className="text-sm text-yellow-300">₱{Number(payoutTracking.unclaimed_amount || 0).toLocaleString()}</div>
                            </div>

                            <div className="bg-green-900/30 border border-green-500 rounded-lg p-3">
                                <div className="text-xs text-green-200 uppercase tracking-wide mb-1">Already Paid Out</div>
                                <div className="text-2xl font-bold text-white">{payoutTracking.paid_out_tickets}</div>
                                <div className="text-sm text-green-300">₱{Number(payoutTracking.paid_out_amount || 0).toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-700">
                            <h3 className="text-base font-bold text-white mb-3">Unclaimed Winning Tickets</h3>
                            {unclaimedWinningTickets.length === 0 ? (
                                <p className="text-sm text-gray-400">No unclaimed winning tickets.</p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {unclaimedWinningTickets.map((ticket) => (
                                        <div key={ticket.ticket_id} className="bg-gray-800/70 rounded-md p-2 border border-gray-700">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-400">{ticket.ticket_id}</span>
                                                <span className="text-yellow-300 font-semibold">₱{Number(ticket.payout_amount || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs text-gray-300 mt-1">
                                                Fight #{ticket.fight_number || '-'} • {(ticket.side || '').toUpperCase()} • {ticket.sold_by || 'N/A'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-700">
                            <h3 className="text-base font-bold text-white mb-3">Recently Paid Out Tickets</h3>
                            {paidOutWinningTickets.length === 0 ? (
                                <p className="text-sm text-gray-400">No paid out winning tickets yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {paidOutWinningTickets.map((ticket) => (
                                        <div key={`${ticket.ticket_id}-${ticket.claimed_at || ''}`} className="bg-gray-800/70 rounded-md p-2 border border-gray-700">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-400">{ticket.ticket_id}</span>
                                                <span className="text-green-300 font-semibold">₱{Number(ticket.payout_amount || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs text-gray-300 mt-1">
                                                Fight #{ticket.fight_number || '-'} • {(ticket.side || '').toUpperCase()} • Claimed by {ticket.claimed_by || 'N/A'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
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
