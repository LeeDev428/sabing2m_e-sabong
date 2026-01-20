import { PropsWithChildren, useState } from 'react';
import { router } from '@inertiajs/react';

interface DeclaratorLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function DeclaratorLayout({ children, title }: DeclaratorLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 z-50">
                <div className="flex items-center justify-between p-4">
                    <div>
                        <h2 className="text-lg font-bold">Sabing2m</h2>
                        <p className="text-xs text-gray-400">Declarator Panel</p>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-700"
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {sidebarOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed left-0 top-0 bottom-0 bg-gray-800 border-r border-gray-700 flex flex-col z-50
                w-64
                lg:translate-x-0
                transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 hidden lg:block">
                    <h2 className="text-xl font-bold">Sabing2m</h2>
                    <p className="text-xs text-gray-400">Declarator Panel</p>
                </div>
                
                <div className="p-6 lg:hidden">
                    <h2 className="text-xl font-bold">Sabing2m</h2>
                    <p className="text-xs text-gray-400">Declarator Panel</p>
                </div>
                
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => {
                            router.visit('/declarator/dashboard');
                            setSidebarOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-gray-300"
                    >
                        📊 Dashboard
                    </button>
                    <button
                        onClick={() => {
                            router.visit('/declarator/pending');
                            setSidebarOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-gray-300"
                    >
                        🏆 Pending Results
                    </button>
                    <button
                        onClick={() => {
                            router.visit('/declarator/declared');
                            setSidebarOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-gray-300"
                    >
                        ✅ Declared Fights
                    </button>
                    <button
                        onClick={() => {
                            router.visit('/declarator/history');
                            setSidebarOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-gray-300"
                    >
                        📈 History
                    </button>
                    <button
                        onClick={() => {
                            router.visit('/declarator/cash-transfer');
                            setSidebarOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-gray-300"
                    >
                        💰 Cash Transfers
                    </button>
                    {/* <button
                        onClick={() => {
                            router.visit('/declarator/bet-controls');
                            setSidebarOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-gray-300"
                    >
                        🎛️ Bet Controls
                    </button> */}
                </nav>

                <div className="p-4 lg:p-6 mt-auto border-t border-gray-700">
                    <div className="bg-gray-700 rounded-lg p-3 mb-3">
                        <div className="text-sm font-medium">Declarator</div>
                        <div className="text-xs text-gray-400">declarator@esabong.com</div>
                    </div>
                    <button
                        onClick={() => {
                            router.post('/logout');
                            setSidebarOpen(false);
                        }}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:ml-64 pt-20 lg:pt-8 p-4 lg:p-8">
                {children}
            </div>
        </div>
    );
}
