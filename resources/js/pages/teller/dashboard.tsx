import { Head, router } from '@inertiajs/react';
import { Fight } from '@/types';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import TellerLayout from '@/layouts/teller-layout';
import { QRCodeSVG } from 'qrcode.react';
import { showToast } from '@/components/toast';
import { thermalPrinter } from '@/utils/thermalPrinter';

interface TellerDashboardProps {
    fights?: Fight[];
    summary?: {
        total_bets: number;
        total_bet_amount: number;
        total_payouts: number;
        active_bets: number;
        meron_bets: number;
        wala_bets: number;
        draw_bets: number;
    };
    tellerBalance?: number;
}

export default function TellerDashboard({ fights = [], summary, tellerBalance = 0 }: TellerDashboardProps) {
    const [amount, setAmount] = useState('0');
    const [selectedFight, setSelectedFight] = useState<Fight | null>(fights.find(f => f.status === 'open' || f.status === 'lastcall') || null);
    const [betSide, setBetSide] = useState<'meron' | 'wala' | 'draw' | null>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [liveOdds, setLiveOdds] = useState<Fight | null>(null);
    const [liveBalance, setLiveBalance] = useState(tellerBalance);
    const [liveBetTotals, setLiveBetTotals] = useState<{
        meron_total: number;
        wala_total: number;
        draw_total: number;
        total_pot: number;
    } | null>(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketData, setTicketData] = useState<any>(null);
    const ticketRef = useRef<HTMLDivElement>(null);
    const [isPrinterConnected, setIsPrinterConnected] = useState(false);

    // Check printer connection and request camera permission on mount
    useEffect(() => {
        // Request camera permission when app opens
        const requestCameraPermission = async () => {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: "environment" } 
                    }).then(stream => {
                        // Stop the stream immediately, we just needed permission
                        stream.getTracks().forEach(track => track.stop());
                        console.log('✅ Camera permission granted');
                    });
                }
            } catch (error) {
                console.log('Camera permission denied or not available:', error);
            }
        };

        requestCameraPermission();

        thermalPrinter.initialize().then(() => {
            setIsPrinterConnected(thermalPrinter.isConnected());
        });

        // Listen for connection changes
        const handleConnectionChange = (connected: boolean) => {
            setIsPrinterConnected(connected);
        };

        thermalPrinter.addConnectionListener(handleConnectionChange);

        return () => {
            thermalPrinter.removeConnectionListener(handleConnectionChange);
        };
    }, []);

    // Real-time balance and bet totals polling
    useEffect(() => {
        const fetchLiveData = async () => {
            try {
                const response = await axios.get('/teller/api/teller/live-data');
                setLiveBalance(response.data.balance);
            } catch (error) {
                console.error('Failed to fetch live data:', error);
            }
        };

        fetchLiveData();
        const interval = setInterval(fetchLiveData, 2000);
        return () => clearInterval(interval);
    }, []);

    // Real-time bet totals for current fight
    useEffect(() => {
        if (!selectedFight) return;

        const fetchBetTotals = async () => {
            try {
                const response = await axios.get(`/teller/api/fights/${selectedFight.id}/bet-totals`);
                setLiveBetTotals(response.data);
            } catch (error) {
                console.error('Failed to fetch bet totals:', error);
            }
        };

        fetchBetTotals();
        const interval = setInterval(fetchBetTotals, 2000);
        return () => clearInterval(interval);
    }, [selectedFight?.id]);

    // Real-time odds and status polling
    useEffect(() => {
        if (!selectedFight) return;

        const fetchOdds = async () => {
            try {
                const response = await axios.get(`/teller/api/fights/${selectedFight.id}/odds`);
                setLiveOdds(response.data);
                
                // Update selectedFight status if it changed
                if (response.data.status !== selectedFight.status) {
                    setSelectedFight(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch odds:', error);
            }
        };

        // Initial fetch
        fetchOdds();

        // Poll every 2 seconds
        const interval = setInterval(fetchOdds, 2000);

        return () => clearInterval(interval);
    }, [selectedFight?.id]);

    // Use live odds if available, otherwise use initial fight data
    const currentFightData = liveOdds || selectedFight;

    // Auto-refresh: Poll for new open fights
    useEffect(() => {
        const checkForNewFights = async () => {
            try {
                const response = await axios.get('/teller/api/fights/open');
                const openFights = response.data;
                
                // If no fight is selected and there's an open fight, select it
                if (!selectedFight && openFights.length > 0) {
                    setSelectedFight(openFights[0]);
                    // DON'T reset amount - keep it continuous
                    setBetSide(null); // Reset bet side
                }
                // If selected fight is closed and there's a new open fight, switch to it
                else if (selectedFight && selectedFight.status === 'closed' && openFights.length > 0) {
                    const newFight = openFights.find((f: Fight) => f.id !== selectedFight.id);
                    if (newFight) {
                        setSelectedFight(newFight);
                        // DON'T reset amount - keep it continuous
                        setBetSide(null); // Reset bet side
                    }
                }
            } catch (error) {
                console.error('Failed to check for new fights:', error);
            }
        };

        // Check every 3 seconds
        const interval = setInterval(checkForNewFights, 3000);
        return () => clearInterval(interval);
    }, [selectedFight]);

    const handleNumberClick = (num: string) => {
        // Start fresh if amount is 0, otherwise append
        if (amount === '0') {
            setAmount(num);
        } else {
            setAmount(amount + num);
        }
    };

    const handleClear = () => {
        setAmount('0');
    };

    const handleQuickAmount = (quickAmount: number) => {
        setAmount(quickAmount.toString());
    };

    const handleIncrement = () => {
        const current = parseInt(amount) || 0;
        setAmount((current + 1).toString());
    };

    const handleDecrement = () => {
        const current = parseInt(amount) || 0;
        if (current > 0) {
            setAmount((current - 1).toString());
        }
    };

    // Auto-print function that runs OUTSIDE Inertia callback
    const autoPrintTicket = async (ticketData: any) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🖨️  AUTO-PRINT START (Direct Function Call)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('📊 Checking printer connection...');
        const printerConnected = thermalPrinter.isConnected();
        const printerDevice = thermalPrinter.getConnectedDevice();
        
        console.log('Printer Status:');
        console.log('  - isConnected():', printerConnected);
        console.log('  - device:', printerDevice);
        console.log('  - device name:', printerDevice?.name || 'N/A');
        console.log('  - device ID:', printerDevice?.deviceId || 'N/A');
        
        if (!printerConnected) {
            console.warn('⚠️  PRINTER NOT CONNECTED - Aborting print');
            showToast('⚠️ Printer not connected', 'warning', 2000);
            return;
        }
        
        console.log('✅ PRINTER IS CONNECTED');
        console.log('📄 Ticket Data:', ticketData);
        
        try {
            console.log('⏳ Calling thermalPrinter.printTicket()...');
            
            await thermalPrinter.printTicket({
                ticket_id: ticketData.ticket_id,
                fight_number: ticketData.fight_number,
                side: ticketData.side,
                amount: ticketData.amount,
                odds: ticketData.odds,
                potential_payout: ticketData.potential_payout,
            });
            
            console.log('✅✅✅ PRINT COMPLETED SUCCESSFULLY! ✅✅✅');
            showToast('✓ Receipt printed!', 'success', 2000);
            
        } catch (error: any) {
            console.error('❌❌❌ PRINT ERROR ❌❌❌');
            console.error('Error:', error);
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
            showToast(`❌ Print failed: ${error.message}`, 'error', 4000);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🖨️  AUTO-PRINT END');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    };

    const handleSubmit = () => {
        if (!selectedFight || !betSide || !amount) return;

        console.log('🎯 Submitting bet...');

        const betAmount = parseFloat(amount);
        const toastMessage = `Bet placed successfully! ₱${betAmount.toLocaleString()}`;
        
        router.post('/teller/bets', {
            fight_id: selectedFight.id,
            side: betSide,
            amount: betAmount,
        }, {
            onSuccess: (page) => {
                console.log('✅ BET SUCCESSFUL - onSuccess callback fired');
                console.log('📦 Page props:', page.props);
                console.log('📦 Flash data:', (page.props as any).flash);
                
                showToast(toastMessage, 'success', 5000);
                
                // Get ticket from lastTicket prop
                const ticket = (page.props as any).lastTicket;
                console.log('🎫 Ticket data from server (lastTicket):', ticket);
                console.log('🎫 Ticket exists?', !!ticket);
                
                if (ticket) {
                    console.log('✅ TICKET EXISTS - Creating newTicketData...');
                    console.log('🔍 ticket.event_name:', ticket.event_name);
                    console.log('🔍 selectedFight.event_name:', selectedFight?.event_name);
                    console.log('🔍 selectedFight:', selectedFight);
                    
                    // Fallback chain: ticket.event_name -> selectedFight.event_name -> 'SABONG EVENT'
                    const eventName = ticket.event_name || selectedFight?.event_name || 'SABONG EVENT';
                    console.log('🔍 Final event_name:', eventName);
                    
                    const newTicketData = {
                        ticket_id: ticket.ticket_id,
                        fight_number: selectedFight.fight_number,
                        side: betSide,
                        amount: betAmount,
                        odds: currentFightData?.meron_odds || currentFightData?.wala_odds || currentFightData?.draw_odds,
                        potential_payout: ticket.potential_payout,
                        created_at: new Date().toLocaleString(),
                        meron_fighter: selectedFight.meron_fighter,
                        wala_fighter: selectedFight.wala_fighter,
                        event_name: eventName,
                    };
                    
                    console.log('📄 New ticket data created:', newTicketData);
                    console.log('🖨️ CALLING autoPrintTicket()...');
                    
                    // Call auto-print function IMMEDIATELY (fire and forget)
                    autoPrintTicket(newTicketData).catch(err => {
                        console.error('Auto-print promise rejected:', err);
                    });
                    
                    // Show modal
                    setTicketData(newTicketData);
                    setShowTicketModal(true);
                } else {
                    console.error('❌ NO TICKET DATA from server!');
                }
                setAmount('0');
                setBetSide(null);
            },
            onError: (errors) => {
                console.error('Bet error:', errors); // Debug log
                showToast('Failed to place bet. Please try again.', 'error', 4000);
            },
            preserveScroll: true,
        });
    };

    const handlePrintTicket = async () => {
        if (ticketRef.current) {
            // Try to print to thermal printer first if connected
            if (thermalPrinter.isConnected() && ticketData) {
                try {
                    await thermalPrinter.printTicket({
                        ticket_id: ticketData.ticket_id,
                        fight_number: ticketData.fight_number,
                        side: ticketData.side,
                        amount: ticketData.amount,
                        odds: ticketData.odds,
                        potential_payout: ticketData.potential_payout,
                    });
                    showToast('Receipt printed to thermal printer!', 'success', 3000);
                    return;
                } catch (error: any) {
                    console.error('Thermal print error:', error);
                    showToast(`Thermal printer error: ${error.message}`, 'error', 4000);
                    // Fall back to browser print
                }
            }

            // Fallback: Browser print dialog
            const printWindow = window.open('', '', 'width=300,height=600');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Print Ticket</title>
                        <style>
                            body { font-family: monospace; padding: 10px; }
                            .ticket { max-width: 250px; margin: 0 auto; }
                            .qr-code { text-align: center; margin: 15px 0; }
                        </style>
                    </head>
                    <body>${ticketRef.current.innerHTML}</body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
        }
    };

    const currentFight = selectedFight;

    const getSubmitButtonClass = () => {
        if (!betSide) return 'bg-gray-600 cursor-not-allowed';
        if (betSide === 'meron') return 'bg-red-600 hover:bg-red-700';
        if (betSide === 'draw') return 'bg-green-600 hover:bg-green-700';
        return 'bg-blue-600 hover:bg-blue-700';
    };

    return (
        <TellerLayout currentPage="dashboard">
            <Head title="Teller - Sabing2m" />

            {/* Header with Balance */}
            <div className="bg-[#1a1a1a] px-4 py-2 border-b border-gray-700">
                <div className="flex justify-between items-center max-w-md mx-auto">
                    <div>
                        <h1 className="text-lg font-bold text-orange-500">Dashboard</h1>
                        <div className="text-xs text-gray-400">BET TERMINAL</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400">Cash Balance</div>
                        <div className="text-lg font-bold text-green-400 transition-all duration-300">₱{liveBalance.toLocaleString()}</div>
                        {/* Printer Status Indicator */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isPrinterConnected ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                            <span className={`text-[10px] ${isPrinterConnected ? 'text-green-400' : 'text-gray-500'}`}>
                                {isPrinterConnected ? 'Printer OK' : 'No Printer'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bet Status Indicator */}
            {selectedFight && (
                <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-b border-purple-500/30 py-1">
                    <div className="max-w-md mx-auto px-4 flex justify-between items-center">
                        <div className="text-xs">
                            <span className="text-gray-300">Fight #{selectedFight.fight_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${(selectedFight.status === 'open' || selectedFight.status === 'lastcall') ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                            <span className={`text-xs font-bold ${(selectedFight.status === 'open' || selectedFight.status === 'lastcall') ? 'text-green-400' : 'text-red-400'}`}>
                                {selectedFight.status === 'open' ? 'BETTING OPEN' : selectedFight.status === 'lastcall' ? 'LAST CALL' : 'BETTING CLOSED'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Betting Interface - Always show UI */}
            {selectedFight && (
                <div className="p-3 max-w-md mx-auto"
                    style={{ opacity: (selectedFight.status === 'open' || selectedFight.status === 'lastcall') ? 1 : 0.6 }}
                >
                    {/* Fighter Selection Buttons - Compact */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {/* MERON Button */}
                        <button
                            onClick={() => currentFightData?.meron_betting_open && setBetSide('meron')}
                            disabled={!currentFightData?.meron_betting_open}
                            className={`relative rounded-lg overflow-hidden transition-all ${
                                betSide === 'meron' ? 'ring-2 ring-red-400' : ''
                            } ${!currentFightData?.meron_betting_open ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="bg-red-600 pt-2 pb-1 px-2">
                                <div className="text-white text-xs font-bold mb-0.5">MERON</div>
                                <div className="text-white text-2xl font-bold">{currentFightData?.meron_odds ? Number(currentFightData.meron_odds).toFixed(2) : '1.57'}</div>
                                <div className="text-white text-xs truncate">{currentFightData?.meron_fighter || 'Meron'}</div>
                            </div>
                            <div className="bg-red-700 py-0.5 text-xs text-white">
                                {!currentFightData?.meron_betting_open ? '🔒 CLOSED' : 'OPEN'}
                            </div>
                        </button>

                        {/* DRAW Button */}
                        <button
                            onClick={() => setBetSide('draw')}
                            className={`relative rounded-lg overflow-hidden transition-all ${
                                betSide === 'draw' ? 'ring-2 ring-green-400' : ''
                            }`}
                        >
                            <div className="bg-green-600 pt-2 pb-1 px-2">
                                <div className="text-white text-xs font-bold mb-0.5">DRAW</div>
                                <div className="text-white text-2xl font-bold">{currentFightData?.draw_odds ? Number(currentFightData.draw_odds).toFixed(2) : '9.00'}</div>
                                <div className="text-white text-xs">Equal</div>
                            </div>
                            <div className="bg-green-700 py-0.5 text-xs text-white">OPEN</div>
                        </button>

                        {/* WALA Button */}
                        <button
                            onClick={() => currentFightData?.wala_betting_open && setBetSide('wala')}
                            disabled={!currentFightData?.wala_betting_open}
                            className={`relative rounded-lg overflow-hidden transition-all ${
                                betSide === 'wala' ? 'ring-2 ring-blue-400' : ''
                            } ${!currentFightData?.wala_betting_open ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="bg-blue-600 pt-2 pb-1 px-2">
                                <div className="text-white text-xs font-bold mb-0.5">WALA</div>
                                <div className="text-white text-2xl font-bold">{currentFightData?.wala_odds ? Number(currentFightData.wala_odds).toFixed(2) : '2.00'}</div>
                                <div className="text-white text-xs truncate">{currentFightData?.wala_fighter || 'Wala'}</div>
                            </div>
                            <div className="bg-blue-700 py-0.5 text-xs text-white">
                                {!currentFightData?.wala_betting_open ? '🔒 CLOSED' : 'OPEN'}
                            </div>
                        </button>
                    </div>

                    {/* Amount Input with +/- buttons - Compact */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <button
                            onClick={handleDecrement}
                            disabled={selectedFight.status !== 'open' && selectedFight.status !== 'lastcall'}
                            className="bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-2xl rounded-lg py-3 flex items-center justify-center"
                        >
                            −
                        </button>
                        <div className="bg-white text-black rounded-lg py-3 flex items-center justify-center">
                            <div className="text-3xl font-bold tracking-wider">{amount}</div>
                        </div>
                        <button
                            onClick={handleIncrement}
                            disabled={selectedFight.status !== 'open' && selectedFight.status !== 'lastcall'}
                            className="bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-2xl rounded-lg py-3 flex items-center justify-center"
                        >
                            +
                        </button>
                    </div>

                    {/* Number Pad - Compact */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num.toString())}
                                className="bg-white hover:bg-gray-200 text-black rounded-lg py-3 text-xl font-bold"
                            >
                                {num}
                            </button>
                        ))}
                        <button className="bg-white text-black rounded-lg py-3 text-xl font-bold opacity-50 cursor-default">
                            .
                        </button>
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="bg-white hover:bg-gray-200 text-black rounded-lg py-3 text-xl font-bold"
                        >
                            0
                        </button>
                        <button
                            onClick={handleClear}
                            className="bg-white hover:bg-gray-200 text-black rounded-lg py-3 text-sm font-bold"
                        >
                            CLR
                        </button>
                    </div>

                    {/* Quick Amount Buttons - Compact */}
                    <div className="grid grid-cols-5 gap-1 mb-2">
                        {[50, 100, 200, 500, 1000].map((quickAmount) => (
                            <button
                                key={quickAmount}
                                onClick={() => handleQuickAmount(quickAmount)}
                                className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white rounded py-2 text-xs font-semibold border border-gray-600"
                            >
                                {quickAmount}
                            </button>
                        ))}
                    </div>

                    {/* Submit Button - Compact */}
                    <button
                        onClick={handleSubmit}
                        disabled={!betSide || (selectedFight.status !== 'open' && selectedFight.status !== 'lastcall')}
                        className={`w-full py-3 rounded-lg text-lg font-bold mb-2 transition-all ${
                            betSide && (selectedFight.status === 'open' || selectedFight.status === 'lastcall')
                                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg'
                                : 'bg-gray-600 cursor-not-allowed text-gray-400'
                        }`}
                    >
                        {(selectedFight.status !== 'open' && selectedFight.status !== 'lastcall')
                            ? 'BETTING CLOSED'
                            : betSide ? 'SUBMIT BET' : 'SELECT SIDE'
                        }
                    </button>

                    {/* Action Button */}
                    <button
                        onClick={() => setShowSummary(true)}
                        className="w-full bg-[#2a3544] hover:bg-[#3a4554] py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-1"
                    >
                        <span>📊</span> SUMMARY
                    </button>

                </div>
            )}

            {/* Summary Modal */}
            {showSummary && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1a2332] rounded-lg w-full max-w-md border-2 border-gray-600">
                        {/* Modal Header */}
                        <div className="bg-[#2a3544] px-6 py-3 flex justify-between items-center rounded-t-lg border-b border-gray-700">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <span>📊</span> VIEW SUMMARY
                            </h2>
                            <button onClick={() => setShowSummary(false)} className="text-white hover:text-gray-200 text-3xl leading-none">
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-3">
                            <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-800">
                                <div className="text-sm text-gray-400 mb-2">Fight Summary</div>
                                <div className="text-2xl font-bold flex gap-4">
                                    <span className="text-red-400">M: {summary?.meron_bets || 0}</span>
                                    <span className="text-blue-400">W: {summary?.wala_bets || 0}</span>
                                    <span className="text-green-400">D: {summary?.draw_bets || 0}</span>
                                </div>
                            </div>

                            <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-800">
                                <div className="text-sm text-gray-400 mb-2">Total Bets</div>
                                <div className="text-3xl font-bold">{summary?.total_bets || 0}</div>
                            </div>

                            <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-800">
                                <div className="text-sm text-gray-400 mb-2">Total Bet Amount</div>
                                <div className="text-3xl font-bold text-yellow-400">
                                    ₱ {summary?.total_bet_amount ? Number(summary.total_bet_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}
                                </div>
                            </div>

                            <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-800">
                                <div className="text-sm text-gray-400 mb-2">Total Payouts</div>
                                <div className="text-3xl font-bold text-green-400">
                                    ₱ {summary?.total_payouts ? Number(summary.total_payouts).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}
                                </div>
                            </div>

                            <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-800">
                                <div className="text-sm text-gray-400 mb-2">Active Bets</div>
                                <div className="text-3xl font-bold text-orange-400">{summary?.active_bets || 0}</div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 pt-0">
                            <button
                                onClick={() => setShowSummary(false)}
                                className="w-full bg-[#2a3544] hover:bg-[#3a4554] py-4 rounded-lg font-bold text-lg"
                            >
                                BACK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* No Open Fights - Always show message when no fight */}
            {!selectedFight && !showSummary && (
                <div className="text-center text-gray-400 mt-20 px-4">
                    <div className="text-6xl mb-4">🐓</div>
                    <h2 className="text-2xl font-bold mb-2 text-white">No Open Fights</h2>
                    <p className="text-gray-500">Waiting for next fight to open...</p>
                </div>
            )}

            {/* Ticket Modal with QR Code */}
            {showTicketModal && ticketData && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
                    <div className="bg-white text-black rounded-lg w-full max-w-sm">
                        {/* Ticket Content for Printing */}
                        <div ref={ticketRef} className="ticket p-3">
                            {/* Header */}
                            <div className="text-center border-b-2 border-dashed border-gray-800 pb-1 mb-2">
                                <h1 className="text-lg font-bold tracking-wide uppercase">
                                    {ticketData.event_name}
                                </h1>
                            </div>

                            {/* Main Content: QR Code LEFT, Details RIGHT */}
                            <div className="flex gap-2 mb-2">
                                {/* QR Code - LEFT SIDE */}
                                <div className="flex-shrink-0">
                                    <QRCodeSVG 
                                        value={ticketData.ticket_id}
                                        size={100}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>

                                {/* Details - RIGHT SIDE (Abbreviated) */}
                                <div className="flex-1 space-y-0 text-xs leading-tight">
                                    <div className="flex gap-1">
                                        <span className="font-bold">Fight#:</span>
                                        <span>{ticketData.fight_number}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <span className="font-bold">Teller:</span>
                                        <span>Teller</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <span className="font-bold">Receipt:</span>
                                        <span className="font-mono text-[10px]">{ticketData.ticket_id.substring(0, 13)}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <span className="font-bold">Date:</span>
                                        <span>{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <span className="font-bold">Time:</span>
                                        <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bet Info - BELOW, CENTERED */}
                            <div className="border-t-2 border-dashed border-gray-800 pt-2 mb-2 text-center">
                                <div className={`text-2xl font-bold mb-0.5 ${
                                    ticketData.side === 'meron' ? 'text-red-600' : 
                                    ticketData.side === 'wala' ? 'text-blue-600' : 
                                    'text-green-600'
                                }`}>
                                    {ticketData.side.toUpperCase()} - ₱{ticketData.amount.toLocaleString()}
                                </div>
                                <div className="text-sm font-bold">
                                    Win: ₱{ticketData.potential_payout.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center border-t-2 border-dashed border-gray-800 pt-1">
                                <p className="text-[10px] font-bold tracking-widest">OFFICIAL BETTING RECEIPT</p>
                            </div>
                        </div>

                        {/* Action Buttons (Not printed) */}
                        <div className="p-4 bg-gray-100 flex gap-3 rounded-b-lg print:hidden">
                            <button
                                onClick={handlePrintTicket}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold"
                            >
                                🖨️ PRINT
                            </button>
                            <button
                                onClick={() => {
                                    setShowTicketModal(false);
                                    setTicketData(null);
                                }}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TellerLayout>
    );
}
