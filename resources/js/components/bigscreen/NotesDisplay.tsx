import { FiAlertTriangle, FiFileText } from 'react-icons/fi';

interface NotesDisplayProps {
    notes?: string;
    specialConditions?: string;
}

export default function NotesDisplay({ notes, specialConditions }: NotesDisplayProps) {
    if (!notes && !specialConditions) return null;

    return (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/45 backdrop-blur-sm p-3 mb-2 sm:mb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {notes && (
                    <div>
                        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-cyan-200 mb-1 inline-flex items-center gap-1.5">
                            <FiFileText /> Notes
                        </div>
                        <div className="text-sm text-slate-100">{notes}</div>
                    </div>
                )}
                {specialConditions && (
                    <div>
                        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-200 mb-1 inline-flex items-center gap-1.5">
                            <FiAlertTriangle /> Special Conditions
                        </div>
                        <div className="text-sm text-slate-100">{specialConditions}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
