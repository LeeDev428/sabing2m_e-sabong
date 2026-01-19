import { PropsWithChildren } from 'react';
import { router } from '@inertiajs/react';

interface DeclaratorLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function DeclaratorLayout({ children, title }: DeclaratorLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Sidebar */}
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-gray-800 border-r border-gray-700 p-6">
                <div className="mb-8">
                    <h2 className="text-xl font-bold">Sabing2m</h2>
                    <p className="text-xs text-gray-400">Declarator Panel</p>
                </div>
                
                <nav className="space-y-2">
                    <button
                        onClick={() => router.visit('/declarator/dashboard')}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-gray-300"
                    >
                        📊 Dashboard
                    </button>
                    <button
                        onClick={() => router.visit('/declarator/pending')}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-gray-300"
                    >
                        🏆 Pending Results
                    </button>
                    <button
                        onClick={() => router.visit('/declarator/declared')}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-gray-300"
                    >
                        ✅ Declared Fights
                    </button>
                    <button
                        onClick={() => router.visit('/declarator/history')}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-gray-300"
                    >
                        📈 History
                    </button>
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-gray-700 rounded-lg p-3 mb-3">
                        <div className="text-sm font-medium">Declarator</div>
                        <div className="text-xs text-gray-400">declarator@esabong.com</div>
                    </div>
                    <button
                        onClick={() => router.post('/logout')}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-64 p-8">
                {children}
            </div>
        </div>
    );
}
