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
    auth?: {
        user: {
            name: string;
        };
    };
}

export default function TellerDashboard({ fights = [], summary, tellerBalance = 0, auth }: TellerDashboardProps) {
    const [amount, setAmount] = useState('50');
    const [selectedFight, setSelectedFight] = useState<Fight | null>(fights.find(f => f.status === 'open' || f.status === 'lastcall') || null);
    const [betSide, setBetSide] = useState<'meron' | 'wala' | null>(null);
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
    const [recentBets, setRecentBets] = useState<{ id: string; side: string; amount: number; fight_number: number }[]>([]);
    const [summaryTab, setSummaryTab] = useState<'current' | 'today'>('current');

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
                    
                    // Track recent bets for summary panel
                    setRecentBets(prev => [{
                        id: ticket.ticket_id,
                        side: betSide as string,
                        amount: betAmount,
                        fight_number: selectedFight.fight_number,
                    }, ...prev].slice(0, 10));
                    
                    // Show modal
                    setTicketData(newTicketData);
                    setShowTicketModal(true);
                } else {
                    console.error('❌ NO TICKET DATA from server!');
                }
                setAmount('50');
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
        return 'bg-blue-600 hover:bg-blue-700';
    };


    return (
        <TellerLayout currentPage="dashboard">
            <Head title="Teller - Sabing2m" />

            {/* Full screen dynamic gradient background */}
            <div
                className="min-h-screen transition-all duration-500"
                style={{
                    background: betSide === 'meron'
                        ? 'linear-gradient(to top, #7f1212 0%, #2a0808 30%, #1a1a1a 60%)'
                        : betSide === 'wala'
                            ? 'linear-gradient(to top, #0d3a7a 0%, #050e22 30%, #1a1a1a 60%)'
                            : 'linear-gradient(to bottom, #1a1a1a, #0d0d0d)',
                }}
            >
                {/* Main Layout - Responsive: Mobile (single column) / Tablet (two columns) */}
                <div className="flex flex-col lg:flex-row">

                    {/* LEFT PANEL - Betting Interface */}
                    <div className="flex-1 lg:max-w-md mx-auto w-full">

                        {/* Header with Balance */}
                        <div className="px-4 py-2 border-b border-gray-800/60 bg-black/30 backdrop-blur-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-lg font-bold text-orange-400 tracking-wide">Dashboard</h1>
                                    <div className="text-xs text-gray-400">{auth?.user?.name || 'Teller User'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Cash Balance</div>
                                    <div className="text-xl font-black text-green-400 transition-all duration-300 tabular-nums">
                                        ₱{liveBalance.toLocaleString()}
                                    </div>
                                    {/* Printer Status Indicator */}
                                    <div className="flex items-center justify-end gap-1 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isPrinterConnected ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                                        <span className={`text-[10px] ${isPrinterConnected ? 'text-green-400' : 'text-gray-600'}`}>
                                            {isPrinterConnected ? 'Printer OK' : 'No Printer'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bet Status Indicator */}
                        {selectedFight && (
                            <div className="bg-black/40 border-b border-gray-800/50 py-1.5">
                                <div className="px-4 flex justify-between items-center">
                                    <div className="text-xs text-gray-400">
                                        Fight #{selectedFight.fight_number}
                                        {selectedFight.event_name && (
                                            <span className="text-gray-600 ml-2">· {selectedFight.event_name}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${(selectedFight.status === 'open' || selectedFight.status === 'lastcall') ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                                        <span className={`text-xs font-bold tracking-wider ${(selectedFight.status === 'open' || selectedFight.status === 'lastcall') ? 'text-green-400' : 'text-red-400'}`}>
                                            {selectedFight.status === 'open' ? 'BETTING OPEN' : selectedFight.status === 'lastcall' ? 'LAST CALL' : 'BETTING CLOSED'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Betting Interface */}
                        <div className="px-3 pt-4 pb-4">

                            {/* ── FIGHTER CARDS with overlapping hexagon ── */}
                            <div className="relative mb-4">
                                {/* Hexagon Fight Badge - positioned at top center, overlapping cards */}
                                <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20">
                                    <div
                                        className="w-[72px] h-[82px] bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-500 flex flex-col items-center justify-center shadow-lg"
                                        style={{
                                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                        }}
                                    >
                                        <span className="text-[9px] font-black text-red-900 uppercase tracking-wider leading-none">FIGHT</span>
                                        <span className="text-[26px] font-black text-red-900 leading-none">
                                            {selectedFight?.fight_number || '--'}
                                        </span>
                                    </div>
                                </div>

                                {/* Cards Row */}
                                <div className="grid grid-cols-2 gap-0 pt-8">
                                    {/* ── MERON CARD ── */}
                                    <button
                                        onClick={() => selectedFight && currentFightData?.meron_betting_open && setBetSide('meron')}
                                        disabled={!selectedFight || !currentFightData?.meron_betting_open}
                                        className={`relative overflow-hidden flex flex-col items-center justify-center py-4 px-3 min-h-[110px] transition-all duration-200
                                            ${betSide === 'meron' ? 'ring-2 ring-yellow-400 ring-inset' : ''}
                                            ${!selectedFight || !currentFightData?.meron_betting_open ? 'cursor-not-allowed opacity-60' : 'active:brightness-110'}
                                        `}
                                        style={{
                                            borderRadius: '6px 0 0 6px',
                                            background: 'linear-gradient(135deg, #ef5350 0%, #b71c1c 100%)',
                                        }}
                                    >
                                        {/* Silhouette image */}
                                        <img
                                            src="/silhouette/meron.png"
                                            alt=""
                                            className="absolute bottom-0 left-0 w-full h-full object-contain object-bottom opacity-20 pointer-events-none"
                                        />

                                        {/* Content */}
                                        <div className="relative z-10 text-center">
                                            <div className="text-white text-2xl font-black tracking-wide mb-2">MERON</div>
                                            <div className="w-14 h-[2px] bg-white/40 mx-auto mb-2"></div>
                                            <div className="text-white/70 text-[10px] uppercase tracking-widest font-medium">ODDS</div>
                                            <div className="text-white text-3xl font-black tabular-nums">
                                                {currentFightData?.meron_odds ? Number(currentFightData.meron_odds).toFixed(2) : '--'}
                                            </div>
                                            <div className="mt-2 bg-black/30 rounded px-3 py-0.5 text-white/90 text-xs font-semibold tabular-nums">
                                                {(liveBetTotals?.meron_total ?? 0).toLocaleString()}
                                            </div>
                                        </div>

                                        {/* Closed overlay */}
                                        {selectedFight && !currentFightData?.meron_betting_open && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20" style={{ borderRadius: '6px 0 0 6px' }}>
                                                <span className="text-white text-sm font-bold">🔒 CLOSED</span>
                                            </div>
                                        )}
                                    </button>

                                    {/* ── WALA CARD ── */}
                                    <button
                                        onClick={() => selectedFight && currentFightData?.wala_betting_open && setBetSide('wala')}
                                        disabled={!selectedFight || !currentFightData?.wala_betting_open}
                                        className={`relative overflow-hidden flex flex-col items-center justify-center py-4 px-3 min-h-[110px] transition-all duration-200
                                            ${betSide === 'wala' ? 'ring-2 ring-yellow-400 ring-inset' : ''}
                                            ${!selectedFight || !currentFightData?.wala_betting_open ? 'cursor-not-allowed opacity-60' : 'active:brightness-110'}
                                        `}
                                        style={{
                                            borderRadius: '0 6px 6px 0',
                                            background: 'linear-gradient(135deg, #42a5f5 0%, #0d47a1 100%)',
                                        }}
                                    >
                                        {/* Silhouette image */}
                                        <img
                                            src="/silhouette/wala.png"
                                            alt=""
                                            className="absolute bottom-0 right-0 w-full h-full object-contain object-bottom opacity-20 pointer-events-none"
                                        />

                                        {/* Content */}
                                        <div className="relative z-10 text-center">
                                            <div className="text-white text-2xl font-black tracking-wide mb-2">WALA</div>
                                            <div className="w-14 h-[2px] bg-white/40 mx-auto mb-2"></div>
                                            <div className="text-white/70 text-[10px] uppercase tracking-widest font-medium">ODDS</div>
                                            <div className="text-white text-3xl font-black tabular-nums">
                                                {currentFightData?.wala_odds ? Number(currentFightData.wala_odds).toFixed(2) : '--'}
                                            </div>
                                            <div className="mt-2 bg-black/30 rounded px-3 py-0.5 text-white/90 text-xs font-semibold tabular-nums">
                                                {(liveBetTotals?.wala_total ?? 0).toLocaleString()}
                                            </div>
                                        </div>

                                        {/* Closed overlay */}
                                        {selectedFight && !currentFightData?.wala_betting_open && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20" style={{ borderRadius: '0 6px 6px 0' }}>
                                                <span className="text-white text-sm font-bold">🔒 CLOSED</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* ── MIN / MAX / TOTAL ROW ── */}
                            <div className="flex justify-between items-center px-1 py-2 mb-2">
                                <div className="text-gray-400 text-xs">
                                    <span>Min: <span className="text-white font-semibold">20</span></span>
                                    <span className="mx-3">Max: <span className="text-white font-semibold">5,000</span></span>
                                </div>
                                <div className="bg-gray-800/80 border border-gray-700 rounded px-4 py-1 text-xs text-gray-400 flex gap-1.5 tabular-nums">
                                    Total <span className="text-white font-bold">{parseInt(amount) || 0}</span>
                                </div>
                            </div>

                            {/* ── AMOUNT INPUT with BLUE +/- ── */}
                            <div className="flex items-center gap-0 mb-3">
                                <button
                                    onClick={handleDecrement}
                                    className="w-14 h-14 bg-[#1565c0] hover:bg-[#1976d2] active:bg-[#0d47a1] text-white text-3xl font-black flex items-center justify-center transition-colors flex-shrink-0"
                                    style={{ borderRadius: '6px 0 0 6px' }}
                                >
                                    −
                                </button>
                                <div className="flex-1 bg-white py-3 px-3 border-y-2 border-gray-200">
                                    <div className="text-black text-4xl font-bold text-center tabular-nums">
                                        {amount}
                                    </div>
                                </div>
                                <button
                                    onClick={handleIncrement}
                                    className="w-14 h-14 bg-[#1565c0] hover:bg-[#1976d2] active:bg-[#0d47a1] text-white text-3xl font-black flex items-center justify-center transition-colors flex-shrink-0"
                                    style={{ borderRadius: '0 6px 6px 0' }}
                                >
                                    +
                                </button>
                            </div>

                            {/* ── NUMBER PAD ── */}
                            <div className="grid grid-cols-3 gap-1.5 mb-3">
                                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleNumberClick(num.toString())}
                                        className="bg-[#f0f0f0] hover:bg-[#e5e5e5] active:bg-[#d5d5d5] text-black py-4 text-2xl font-semibold border border-gray-300 transition-colors"
                                        style={{ borderRadius: '6px' }}
                                    >
                                        {num}
                                    </button>
                                ))}
                                {/* Row 4: . / 0 / CLEAR */}
                                <button
                                    className="bg-[#f0f0f0] text-gray-400 py-4 text-2xl font-semibold border border-gray-300 cursor-not-allowed"
                                    style={{ borderRadius: '6px' }}
                                    disabled
                                >
                                    .
                                </button>
                                <button
                                    onClick={() => handleNumberClick('0')}
                                    className="bg-[#f0f0f0] hover:bg-[#e5e5e5] active:bg-[#d5d5d5] text-black py-4 text-2xl font-semibold border border-gray-300 transition-colors"
                                    style={{ borderRadius: '6px' }}
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="bg-[#f0f0f0] hover:bg-[#e5e5e5] active:bg-[#d5d5d5] text-black py-4 text-sm font-bold border border-gray-300 transition-colors tracking-wide"
                                    style={{ borderRadius: '6px' }}
                                >
                                    CLEAR
                                </button>
                            </div>

                            {/* ── QUICK AMOUNTS — 4 buttons (100-1000) ── */}
                            <div className="grid grid-cols-4 gap-1.5 mb-3">
                                {[100, 200, 500, 1000].map((quickAmount) => (
                                    <button
                                        key={quickAmount}
                                        onClick={() => handleQuickAmount(quickAmount)}
                                        className="bg-[#1a1f35] hover:bg-[#252b45] active:bg-[#151929] border border-[#3a4060] text-white py-2.5 px-2 flex flex-row items-center justify-center gap-2 transition-colors"
                                        style={{ borderRadius: '6px' }}
                                    >
                                        {/* Ticket icon - left */}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-gray-400 flex-shrink-0">
                                            <path d="M20 12V6a1 1 0 00-1-1H5a1 1 0 00-1 1v6a2 2 0 010 4v6a1 1 0 001 1h14a1 1 0 001-1v-6a2 2 0 010-4z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        {/* Amount - right */}
                                        <span className="text-xs font-bold tabular-nums">
                                            {quickAmount >= 1000 ? '1K' : quickAmount}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* ── SUBMIT BUTTON ── */}
                            <button
                                onClick={handleSubmit}
                                disabled={!betSide || !selectedFight || (selectedFight.status !== 'open' && selectedFight.status !== 'lastcall')}
                                className={`w-full py-3 text-lg font-black mb-3 uppercase tracking-wider transition-all border-2 ${
                                    betSide && selectedFight && (selectedFight.status === 'open' || selectedFight.status === 'lastcall')
                                        ? 'bg-[#c62828] hover:bg-[#d32f2f] active:bg-[#b71c1c] text-white border-[#ff4444]'
                                        : 'bg-gray-800 cursor-not-allowed text-gray-500 border-gray-600'
                                }`}
                                style={{ borderRadius: '6px' }}
                            >
                                {!selectedFight
                                    ? 'NO FIGHT'
                                    : (selectedFight.status !== 'open' && selectedFight.status !== 'lastcall')
                                        ? 'BETTING CLOSED'
                                        : 'SUBMIT'
                                }
                            </button>

                            {/* ── VIEW SUMMARY BUTTON ── */}
                            <button
                                onClick={() => setShowSummary(true)}
                                className="w-full bg-[#1e2d3d] hover:bg-[#2a3d52] active:bg-[#162330] py-3.5 font-bold text-base flex items-center justify-center gap-2 text-white transition-colors border border-gray-700/50"
                                style={{ borderRadius: '6px' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                VIEW SUMMARY
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL - Bet Summary (Tablet/Desktop only) */}
                    <div className="hidden lg:block w-96 bg-[#111111] border-l border-gray-800/60 min-h-screen">
                        <div className="p-4">
                            {/* Header */}
                            <h2 className="text-xl font-bold text-white mb-4 tracking-wider">BET SUMMARY</h2>

                            {/* Event Name */}
                            <div className="bg-[#1e1e1e] rounded-xl p-3 mb-4 border border-gray-800/50">
                                <div className="text-white font-semibold text-center">
                                    {selectedFight?.event_name || 'No Event'}
                                </div>
                            </div>

                            {/* Current Bet Info */}
                            {betSide && (
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm">SIDE</span>
                                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                            betSide === 'meron' ? 'bg-red-700 text-white' :
                                            'bg-blue-700 text-white'
                                        }`}>
                                            {betSide.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm">AMOUNT</span>
                                        <span className="text-white font-bold tabular-nums">₱{parseInt(amount || '0').toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm">FIGHT NUMBER</span>
                                        <span className="text-white font-bold">{selectedFight?.fight_number || '--'}</span>
                                    </div>
                                </div>
                            )}

                            {/* Location/Venue */}
                            {selectedFight?.venue && (
                                <div className="text-gray-600 text-xs text-center mb-4">
                                    {selectedFight.venue}
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setSummaryTab('current')}
                                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-colors ${
                                        summaryTab === 'current'
                                            ? 'bg-[#2a2a2a] text-white'
                                            : 'bg-transparent text-gray-600 hover:text-gray-300'
                                    }`}
                                >
                                    Current Bets
                                </button>
                                <button
                                    onClick={() => setSummaryTab('today')}
                                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-colors ${
                                        summaryTab === 'today'
                                            ? 'bg-[#2a2a2a] text-white'
                                            : 'bg-transparent text-gray-600 hover:text-gray-300'
                                    }`}
                                >
                                    Today's Report
                                </button>
                            </div>

                            {/* Bets List */}
                            <div className="border-t border-gray-800 pt-4">
                                <div className="flex justify-between text-xs text-gray-600 mb-3 px-2">
                                    <span>Item</span>
                                    <span>Bet Amount</span>
                                </div>

                                {summaryTab === 'current' ? (
                                    recentBets.length > 0 ? (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {recentBets.map((bet) => (
                                                <div key={bet.id} className="flex justify-between items-center bg-[#1e1e1e] rounded-xl p-3 border border-gray-800/40">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${
                                                            bet.side === 'meron' ? 'bg-red-500' :
                                                            bet.side === 'draw' ? 'bg-green-500' :
                                                            'bg-blue-500'
                                                        }`}></span>
                                                        <span className="text-white text-sm">
                                                            Fight #{bet.fight_number} - {bet.side.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="text-white font-bold text-sm tabular-nums">
                                                        ₱{bet.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="text-orange-400 text-4xl mb-2">🐓</div>
                                            <div className="text-gray-600 text-sm">Current Bets Will Show Here</div>
                                        </div>
                                    )
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-[#1e1e1e] rounded-xl p-3 border border-gray-800/40">
                                            <span className="text-gray-500 text-sm">Total Bets</span>
                                            <span className="text-white font-bold">{summary?.total_bets || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-[#1e1e1e] rounded-xl p-3 border border-gray-800/40">
                                            <span className="text-gray-500 text-sm">Total Amount</span>
                                            <span className="text-yellow-400 font-bold tabular-nums">
                                                ₱{(summary?.total_bet_amount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-[#1e1e1e] rounded-xl p-3 border border-gray-800/40">
                                            <span className="text-gray-500 text-sm">Meron</span>
                                            <span className="text-red-400 font-bold">{summary?.meron_bets || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-[#1e1e1e] rounded-xl p-3 border border-gray-800/40">
                                            <span className="text-gray-500 text-sm">Wala</span>
                                            <span className="text-blue-400 font-bold">{summary?.wala_bets || 0}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Balance Info */}
                            <div className="mt-6 pt-4 border-t border-gray-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-500 text-sm">Cash Balance</span>
                                    <span className="text-green-400 font-bold text-lg tabular-nums">₱{liveBalance.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${isPrinterConnected ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                                    <span className={`text-xs ${isPrinterConnected ? 'text-green-400' : 'text-gray-600'}`}>
                                        {isPrinterConnected ? 'Printer Connected' : 'No Printer'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Modal */}
            {showSummary && (
                <div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50">
                    <div className="bg-[#1c1c1c] w-full sm:max-w-sm sm:rounded-xl overflow-hidden" style={{ maxHeight: '92vh' }}>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-[#252525] border-b border-gray-700/60">
                            <h2 className="text-base font-bold tracking-widest text-white uppercase">Summary Reports</h2>
                            <button
                                onClick={() => setShowSummary(false)}
                                className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-lg leading-none transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 48px)' }}>

                            {/* Summary rows */}
                            <div className="divide-y divide-gray-800/70">
                                {/* Username */}
                                <div className="flex justify-between items-center px-4 py-2.5 bg-[#1c1c1c]">
                                    <span className="text-gray-500 text-sm">Username</span>
                                    <span className="text-white text-sm font-semibold">{auth?.user?.name || '—'}</span>
                                </div>
                                {/* Cash In (current balance) */}
                                <div className="flex justify-between items-center px-4 py-2.5 bg-[#222222]">
                                    <span className="text-gray-500 text-sm">Cash In</span>
                                    <span className="text-white text-sm font-semibold tabular-nums">
                                        {Number(liveBalance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {/* Total Bets (amount) */}
                                <div className="flex justify-between items-center px-4 py-2.5 bg-[#1c1c1c]">
                                    <span className="text-gray-500 text-sm">Total Bets</span>
                                    <span className="text-white text-sm font-semibold tabular-nums">
                                        {Number(summary?.total_bet_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {/* Total Bet Count */}
                                <div className="flex justify-between items-center px-4 py-2.5 bg-[#222222]">
                                    <span className="text-gray-500 text-sm">Total Bet Count</span>
                                    <span className="text-white text-sm font-semibold tabular-nums">{summary?.total_bets || 0}</span>
                                </div>
                                {/* Total Payout Paid */}
                                <div className="flex justify-between items-center px-4 py-2.5 bg-[#1c1c1c]">
                                    <span className="text-gray-500 text-sm">Total Payout Paid</span>
                                    <span className="text-white text-sm font-semibold tabular-nums">
                                        {Number(summary?.total_payouts || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {/* Active Bets Amount */}
                                <div className="flex justify-between items-center px-4 py-2.5 bg-[#222222]">
                                    <span className="text-gray-500 text-sm">Active Bets Amount</span>
                                    <span className="text-white text-sm font-semibold tabular-nums">
                                        {Number(summary?.active_bets || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {/* Meron Bets */}
                                <div className="flex justify-between items-center px-4 py-2.5 bg-[#1c1c1c]">
                                    <span className="text-gray-500 text-sm">Meron Bets</span>
                                    <span className="text-red-400 text-sm font-semibold tabular-nums">{summary?.meron_bets || 0}</span>
                                </div>
                                {/* Wala Bets */}
                                <div className="flex justify-between items-center px-4 py-2.5 bg-[#222222]">
                                    <span className="text-gray-500 text-sm">Wala Bets</span>
                                    <span className="text-blue-400 text-sm font-semibold tabular-nums">{summary?.wala_bets || 0}</span>
                                </div>
                                {/* Draw Bets */}
                                <div className="flex justify-between items-center px-4 py-2.5 bg-[#1c1c1c]">
                                    <span className="text-gray-500 text-sm">Draw Bets</span>
                                    <span className="text-green-400 text-sm font-semibold tabular-nums">{summary?.draw_bets || 0}</span>
                                </div>
                            </div>

                            {/* Footer note */}
                            <div className="px-4 py-3 border-t border-gray-700/60">
                                <p className="text-gray-600 text-xs text-center italic">
                                    Total bets display amount will not reflect until graded
                                </p>
                            </div>

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
