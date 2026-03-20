import { FiDollarSign, FiPercent, FiTrendingUp } from 'react-icons/fi';

interface StatsPanelProps {
    totalPot: number;
    commission: number;
    commissionPercentage?: number;
    netPot: number;
}

export default function StatsPanel({ totalPot, commission, commissionPercentage = 7.5, netPot }: StatsPanelProps) {
    const items = [
        {
            key: 'pot',
            label: 'Total Pot',
            value: `P${totalPot.toLocaleString()}`,
            icon: <FiDollarSign className="text-amber-300" />,
        },
        {
            key: 'commission',
            label: `Commission (${commissionPercentage}%)`,
            value: `P${commission.toLocaleString()}`,
            icon: <FiPercent className="text-rose-300" />,
        },
        {
            key: 'net',
            label: 'Net Pot',
            value: `P${netPot.toLocaleString()}`,
            icon: <FiTrendingUp className="text-emerald-300" />,
        },
    ];

    return (
        <div className="mb-2 sm:mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {items.map((item) => (
                    <div
                        key={item.key}
                        className="rounded-2xl border border-slate-700/80 bg-slate-900/45 backdrop-blur-sm px-3 py-2.5 sm:px-4 sm:py-3"
                    >
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.18em] text-slate-400">
                            {item.icon}
                            {item.label}
                        </div>
                        <div className="mt-1 text-lg sm:text-2xl font-black text-slate-100 leading-none">{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
