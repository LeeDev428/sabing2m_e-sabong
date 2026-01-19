import { Head, router } from '@inertiajs/react';
import TellerLayout from '@/layouts/teller-layout';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface PayoutScanProps {
    message?: string;
    claimData?: {
        amount: number;
        bet_by: string;
        claimed_by: string;
        status: string;
        already_claimed?: boolean;
    };
}

export default function PayoutScan({ message, claimData }: PayoutScanProps) {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanning = async () => {
        try {
            setCameraError(null);
            setResult(null);
            
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
                    setResult(decodedText);
                    html5QrCode.stop();
                    setScanning(false);
                    
                    // Send claim request to backend
                    router.post('/teller/payout-scan/claim', {
                        bet_id: decodedText
                    }, {
                        preserveScroll: true,
                        preserveState: true,
                    });
                },
                (errorMessage) => {
                    // Ignore scanning errors (happens continuously)
                }
            );

            setScanning(true);
        } catch (error: any) {
            setCameraError(error.message || 'Failed to start camera');
            setScanning(false);
        }
    };

    const stopScanning = () => {
        if (html5QrCodeRef.current) {
            html5QrCodeRef.current.stop()
                .then(() => {
                    setScanning(false);
                    html5QrCodeRef.current = null;
                })
                .catch(console.error);
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
                {claimData && !claimData.already_claimed && (
                    <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-6 mb-4">
                        <div className="text-center mb-6">
                            <div className="text-7xl mb-4">✅</div>
                            <h2 className="text-3xl font-bold text-green-400 mb-2">Success!</h2>
                            <p className="text-white text-xl">Claimed Successfully</p>
                        </div>

                        <div className="space-y-4 bg-[#1a1a1a] rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Claimed Amount:</span>
                                <span className="text-3xl font-bold text-yellow-400">₱{claimData.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                                <span className="text-gray-400">Bet By:</span>
                                <span className="text-white font-semibold">{claimData.bet_by}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Claimed By:</span>
                                <span className="text-white font-semibold">{claimData.claimed_by}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Status:</span>
                                <span className="text-green-400 font-bold">{claimData.status}</span>
                            </div>
                        </div>

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
