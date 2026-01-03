import React, { useState } from 'react';
import { PenTool, Target } from 'lucide-react';
import MissionInputView from './MissionInputView';
import MissionScheduleView from './MissionScheduleView';

const MissionMainView: React.FC = () => {
    const [subTab, setSubTab] = useState<'sikap' | 'jadwal'>('sikap');

    return (
        // PERUBAHAN: max-w-4xl agar form cukup lebar, TANPA mx-auto agar rata kiri dengan judul
        <div className="space-y-6 w-full max-w-4xl">
            
            {/* Tab Switcher */}
            <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-200 w-full">
                <button
                    onClick={() => setSubTab('sikap')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                        subTab === 'sikap' 
                        ? 'bg-rose-700 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <PenTool size={18} /> 
                    <span>Penilaian Sikap</span>
                </button>
                
                <button
                    onClick={() => setSubTab('jadwal')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                        subTab === 'jadwal' 
                        ? 'bg-rose-700 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <Target size={18} /> 
                    <span>Target Misi</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="animate-fade-in">
                {subTab === 'sikap' ? (
                    <MissionInputView /> 
                ) : (
                    <MissionScheduleView />
                )}
            </div>
        </div>
    );
};

export default MissionMainView;