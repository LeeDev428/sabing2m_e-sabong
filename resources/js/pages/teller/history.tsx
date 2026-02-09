import { Head, router } from '@inertiajs/react';
import TellerLayout from '@/layouts/teller-layout';
import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { thermalPrinter } from '@/utils/thermalPrinter';
import { showToast } from '@/components/toast';
import { PermissionManager } from '@/utils/permissionManager';
import Pagination from '@/components/pagination';

interface Bet {
    id: number;
    ticket_id?: string;
    fight: {
        fight_number: number;
        meron_fighter: string;
        wala_fighter: string;
        event_name?: string;
    };
    side: string;
    amount: number;
    odds?: number;
    potential_payout: number;
    actual_payout: number | null;
    status: string;
    created_at: string;
}

interface Transaction {
    id: number;
    type: string;
    amount: number;
    description: string;
    created_at: string;
}

interface PaginatedBets {
    data: Bet[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface HistoryProps {
    bets: PaginatedBets;
    summary: {
        total_bets: number;
        total_amount: number;
        won_bets: number;
        lost_bets: number;
        claimed_bets: number;
        voided_bets: number;
    };
}

export default function History({ bets, summary }: HistoryProps) {
    const [activeTab, setActiveTab] = useState<'bets' | 'summary'>('summary');
    const [showVoidScanner, setShowVoidScanner] = useState(false);
    const [scanning, setScanning] = useState(false);
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

    const startVoidScanning = async () => {
        try {
            console.log('Starting void scanner...');
            setScanning(true); // Set scanning to true FIRST so div is visible
            
            // Wait a bit for the div to be rendered
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Request camera permission with proper error handling
            const permissionResult = await PermissionManager.ensureCameraPermission();
            if (!permissionResult.granted) {
                setScanning(false);
                showToast('⚠️ ' + (permissionResult.error || 'Camera permission denied'), 'error', 5000);
                return;
            }
            
            const html5QrCode = new Html5Qrcode("void-qr-reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    // QR Code scanned successfully - decodedText is the ticket_id
                    console.log('🎯 QR Code scanned:', decodedText);
                    isScanningRef.current = false;
                    html5QrCode.stop();
                    setScanning(false);
                    
                    // Confirm void action
                    console.log('⏸️ Showing void confirmation dialog');
                    if (confirm(`Void ticket ${decodedText}? This action cannot be undone.`)) {
                        console.log('✅ User confirmed void, sending request...');
                        router.post('/teller/bets/void', {
                            ticket_id: decodedText
                        }, {
                            preserveScroll: true,
                            onSuccess: (page) => {
                                console.log('✅ Void request successful:', page.props);
                                setShowVoidScanner(false);
                                showToast('✅ Ticket voided successfully!', 'success', 3000);
                            },
                            onError: (errors) => {
                                console.error('❌ Void request failed:', errors);
                                setShowVoidScanner(false);
                                const errorMsg = typeof errors === 'object' ? JSON.stringify(errors) : errors;
                                showToast(`❌ Failed to void: ${errorMsg}`, 'error', 5000);
                            }
                        });
                    } else {
                        console.log('❌ User cancelled void');
                        setShowVoidScanner(false);
                    }
                },
                (errorMessage) => {
                    // Ignore scanning errors
                }
            );
            
            isScanningRef.current = true;
            console.log('✅ Scanner started successfully');
        } catch (error: any) {
            console.error('❌ Scanner failed to start:', error);
            showToast(`Scanner error: ${error.message || 'Camera permission denied?'}`, 'error', 5000);
            setScanning(false);
            setShowVoidScanner(false);
            isScanningRef.current = false;
        }
    };

    const stopVoidScanning = () => {
        if (html5QrCodeRef.current && isScanningRef.current) {
            isScanningRef.current = false;
            html5QrCodeRef.current.stop()
                .then(() => {
                    setScanning(false);
                    setShowVoidScanner(false);
                    html5QrCodeRef.current = null;
                })
                .catch((err) => {
                    console.log('Stop scanner error:', err.message);
                    setScanning(false);
                    setShowVoidScanner(false);
                });
        }
    };

    const handlePrintReceipt = async (bet: Bet) => {
        if (!isPrinterConnected) {
            showToast('❌ Printer not connected. Connect printer first.', 'error', 3000);
            return;
        }

        try {
            await thermalPrinter.printTicket({
                ticket_id: bet.ticket_id || `TKT-${bet.id}`,
                fight_number: bet.fight.fight_number,
                side: bet.side,
                amount: bet.amount,
                odds: bet.odds || 1.95,
                potential_payout: bet.potential_payout,
                event_name: bet.fight.event_name,
            });
            showToast('✅ Receipt reprinted successfully!', 'success', 2000);
        } catch (error: any) {
            console.error('Print error:', error);
            showToast(`❌ Print failed: ${error.message}`, 'error', 3000);
        }
    };

    const getSideColor = (side: string) => {
        switch (side.toLowerCase()) {
            case 'meron': return 'text-red-400';
            case 'wala': return 'text-blue-400';
            case 'draw': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'won': return 'bg-green-600';
            case 'lost': return 'bg-red-600';
            case 'refunded': return 'bg-yellow-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <TellerLayout currentPage="history">
            <Head title="History & Summary" />

            <div className="p-4 max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-orange-500">History & Summary</h1>
                            <p className="text-sm text-gray-400">Transaction logs and betting summary</p>
                        </div>
                        <button
                            onClick={() => setShowVoidScanner(true)}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                        >
                            <span>❌</span> Void Ticket
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`py-3 rounded-lg font-semibold transition-colors ${
                            activeTab === 'summary'
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                        }`}
                    >
                        📊 Summary
                    </button>
                    <button
                        onClick={() => setActiveTab('bets')}
                        className={`py-3 rounded-lg font-semibold transition-colors ${
                            activeTab === 'bets'
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                        }`}
                    >
                        🎰 Bets
                    </button>
                </div>

                {/* Summary Tab */}
                {activeTab === 'summary' && (
                    <div className="space-y-3">
                        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 border border-blue-500/30">
                            <div className="text-center">
                                <div className="text-sm text-gray-300 mb-2">Total Bets Today</div>
                                <div className="text-4xl font-bold text-white">{summary.total_bets}</div>
                            </div>
                        </div>

                        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                            <div className="text-center">
                                <div className="text-sm text-gray-400 mb-2">Total Bet Amount</div>
                                <div className="text-3xl font-bold text-yellow-400">₱{summary.total_amount.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                                <div className="text-center">
                                    <div className="text-xs text-green-300 mb-1">Won Bets</div>
                                    <div className="text-2xl font-bold text-white">{summary.won_bets}</div>
                                </div>
                            </div>
                            <div className="bg-red-900/30 rounded-lg p-4 border border-red-500/30">
                                <div className="text-center">
                                    <div className="text-xs text-red-300 mb-1">Lost Bets</div>
                                    <div className="text-2xl font-bold text-white">{summary.lost_bets}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
                                <div className="text-center">
                                    <div className="text-xs text-blue-300 mb-1">Claimed</div>
                                    <div className="text-2xl font-bold text-white">{summary.claimed_bets}</div>
                                </div>
                            </div>
                            <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30">
                                <div className="text-center">
                                    <div className="text-xs text-purple-300 mb-1">Voided</div>
                                    <div className="text-2xl font-bold text-white">{summary.voided_bets}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bets Tab */}
                {activeTab === 'bets' && (
                    <div className="space-y-3">
                        {bets.data.length === 0 ? (
                            <div className="bg-[#1a1a1a] rounded-lg p-8 text-center border border-gray-700">
                                <div className="text-6xl mb-4">🎰</div>
                                <p className="text-gray-400">No bets yet</p>
                            </div>
                        ) : (
                            <>
                                {bets.data.map((bet) => (
                                    <div key={bet.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
                                        {/* Event Name Header */}
                                        {bet.fight.event_name && (
                                            <div className="text-center mb-3 pb-2 border-b border-gray-700">
                                                <div className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                                                    {bet.fight.event_name}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="text-sm text-gray-400">Fight #{bet.fight.fight_number}</div>
                                                <div className="text-lg font-bold">{bet.fight.meron_fighter} vs {bet.fight.wala_fighter}</div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(bet.status)}`}>
                                                {bet.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Print Button - Always show for active bets */}
                                        {bet.status === 'active' && (
                                            <button
                                                onClick={() => handlePrintReceipt(bet)}
                                                className="w-full mt-3 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                                            >
                                                <span>🖨️</span> PRINT
                                            </button>
                                        )}
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <div className="text-xs text-gray-400">Bet Side</div>
                                                <div className={`text-lg font-bold ${getSideColor(bet.side)}`}>
                                                    {bet.side.toUpperCase()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Amount</div>
                                                <div className="text-lg font-bold text-white">₱{bet.amount.toLocaleString()}</div>
                                            </div>
                                        </div>

                                        {bet.status === 'won' && (
                                            <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/30">
                                                <div className="text-xs text-green-300 mb-1">Payout</div>
                                                <div className="text-2xl font-bold text-green-400">₱{bet.actual_payout?.toLocaleString()}</div>
                                            </div>
                                        )}

                                        <div className="text-xs text-gray-500 mt-2">
                                            {new Date(bet.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination */}
                                {bets.last_page > 1 && (
                                    <div className="mt-6">
                                        <Pagination
                                            currentPage={bets.current_page}
                                            lastPage={bets.last_page}
                                            from={bets.from || 0}
                                            to={bets.to || 0}
                                            total={bets.total}
                                            links={bets.links}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Void Scanner Modal */}
            {showVoidScanner && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1a2332] rounded-lg w-full max-w-md border-2 border-red-500">
                        <div className="bg-red-600 px-6 py-3 flex justify-between items-center rounded-t-lg">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <span>❌</span> Void Ticket
                            </h2>
                            <button onClick={() => {
                                stopVoidScanning();
                                setShowVoidScanner(false);
                            }} className="text-white hover:text-gray-200 text-3xl leading-none">
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <div id="void-qr-reader" className={`rounded-lg overflow-hidden mb-4 ${scanning ? '' : 'hidden'}`}></div>
                            
                            {!scanning && (
                                <div className="text-center py-8">
                                    <div className="text-6xl mb-4">📷</div>
                                    <p className="text-gray-300 mb-4">Scan QR code to void ticket</p>
                                    <p className="text-sm text-red-400 mb-2">⚠️ This action cannot be undone</p>
                                    <p className="text-xs text-gray-400 mb-4">👇 Click "Start Scanner" below to scan the QR code on the printed receipt</p>
                                    <button
                                        onClick={startVoidScanning}
                                        className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-bold mb-3"
                                    >
                                        Start Scanner
                                    </button>
                                </div>
                            )}

                            {scanning && (
                                <button
                                    onClick={stopVoidScanning}
                                    className="w-full bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-bold"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </TellerLayout>
    );
}
