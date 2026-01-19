interface NotesDisplayProps {
    notes?: string;
    specialConditions?: string;
}

export default function NotesDisplay({ notes, specialConditions }: NotesDisplayProps) {
    if (!notes && !specialConditions) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl p-6 mb-8 border-2 border-indigo-500/30">
            {notes && (
                <div className="mb-4">
                    <div className="text-2xl font-bold text-indigo-300 mb-2">📝 Notes</div>
                    <div className="text-xl text-white">{notes}</div>
                </div>
            )}
            {specialConditions && (
                <div>
                    <div className="text-2xl font-bold text-yellow-300 mb-2">⚠️ Special Conditions</div>
                    <div className="text-xl text-white">{specialConditions}</div>
                </div>
            )}
        </div>
    );
}
