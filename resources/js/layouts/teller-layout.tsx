import { router } from '@inertiajs/react';
import { ReactNode } from 'react';

interface TellerLayoutProps {
    children: ReactNode;
    currentPage: 'dashboard' | 'payout' | 'history' | 'cash' | 'settings';
}

export default function TellerLayout({ children, currentPage }: TellerLayoutProps) {
    const navItems = [
        {
            id: 'dashboard',
            icon: '🏠',
            label: 'Dashboard',
            route: '/teller/dashboard'
        },
        {
            id: 'payout',
            icon: '📷',
            label: 'Payout',
            route: '/teller/payout-scan'
        },
        {
            id: 'history',
            icon: '📊',
            label: 'History',
            route: '/teller/history'
        },
        {
            id: 'cash',
            icon: '💰',
            label: 'Cash',
            route: '/teller/cash-transfer'
        },
        {
            id: 'settings',
            icon: '⚙️',
            label: 'Settings',
            route: '/teller/settings/printer'
        }
    ];

    return (
        <div className="min-h-screen bg-[#2d2d2d] text-white pb-20">
            {/* Main Content */}
            <div className="h-full">
                {children}
            </div>

            {/* Bottom Navigation - Fixed */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-700 z-50">
                <div className="grid grid-cols-5 max-w-2xl mx-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => router.visit(item.route)}
                            className={`flex flex-col items-center justify-center py-3 transition-colors ${
                                currentPage === item.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            <span className="text-2xl mb-1">{item.icon}</span>
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
