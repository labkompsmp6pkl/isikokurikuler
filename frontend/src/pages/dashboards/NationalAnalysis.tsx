import React, { useState } from 'react';
import { 
    BrainCircuit, Sparkles, AlertTriangle, Play,
    BarChart3, Lightbulb, CheckCircle2, ArrowRight, AlertCircle
} from 'lucide-react';
import adminService from '../../services/adminService';

const NationalAnalysis: React.FC = () => {
    // --- STATE ANALISIS ---
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // --- HANDLER ---
    const handleStartAnalysis = async () => {
        setLoading(true);
        try {
            const result = await adminService.generateAIAnalysis();
            setAnalysis(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- HELPER: FORMATTER TEKS AI (UPDATED STYLE) ---
    // Sekarang menerima parameter 'variant' untuk styling warna yang spesifik
    const formatContent = (input: any, variant: 'success' | 'warning' | 'info' = 'info') => {
        if (!input) return null;

        let lines: string[] = [];

        // 1. Parsing Input agar jadi Array of String
        if (Array.isArray(input)) {
            lines = input.map(item => String(item));
        } else if (typeof input === 'string') {
            lines = input.split('\n');
        } else {
            lines = String(input).split('\n');
        }

        lines = lines.filter(line => line.trim() !== '');

        // 2. Tentukan Warna Berdasarkan Variant
        const styles = {
            success: {
                box: "bg-white border-l-4 border-emerald-500 text-slate-800",
                icon: <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />,
                text: "text-slate-800"
            },
            warning: {
                box: "bg-white border-l-4 border-amber-500 text-slate-800",
                icon: <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />,
                text: "text-slate-800"
            },
            info: { // Untuk rekomendasi di background gelap
                box: "bg-white/10 border border-white/20 text-indigo-50 backdrop-blur-sm",
                icon: <ArrowRight size={20} className="text-yellow-400 mt-0.5 shrink-0" />,
                text: "text-indigo-50"
            }
        };

        const currentStyle = styles[variant];

        return (
            <div className="space-y-3">
                {lines.map((line, index) => {
                    const cleanLine = line.trim();
                    // Deteksi bullet point
                    const isList = cleanLine.startsWith('-') || cleanLine.startsWith('*') || /^\d+\./.test(cleanLine);
                    const content = isList ? cleanLine.replace(/^[-*\d\.]+\s*/, '') : cleanLine;

                    // Hapus karakter markdown bold (**) jika ada, biar bersih
                    const cleanContent = content.replace(/\*\*/g, '');

                    if (isList) {
                        return (
                            <div key={index} className={`flex items-start gap-3 p-3 rounded-r-lg shadow-sm transition-all hover:translate-x-1 ${currentStyle.box}`}>
                                {currentStyle.icon}
                                <span className={`text-sm md:text-base font-medium leading-relaxed ${currentStyle.text}`}>
                                    {cleanContent}
                                </span>
                            </div>
                        );
                    }
                    
                    // Paragraf biasa
                    return (
                        <p key={index} className={`mb-3 text-sm md:text-base leading-relaxed font-medium ${currentStyle.text} opacity-90`}>
                            {cleanContent}
                        </p>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            
            {/* HEADER SECTION */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-100">
                        <Sparkles size={14}/> AI Powered Analysis
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-3">
                        Sintesis Karakter Nasional
                    </h1>
                    <p className="text-slate-500 text-lg leading-relaxed font-medium">
                        Analisis mendalam berbasis kecerdasan buatan untuk memetakan pola perilaku dan karakter siswa secara menyeluruh.
                    </p>
                    
                    {!analysis && !loading && (
                        <button 
                            onClick={handleStartAnalysis}
                            className="mt-8 px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-3"
                        >
                            <BrainCircuit size={20} /> Mulai Analisis Data
                        </button>
                    )}
                </div>
                
                {/* Dekorasi Visual */}
                <div className="hidden md:block opacity-10">
                    <BrainCircuit size={200} className="text-indigo-600"/>
                </div>
            </div>

            {/* LOADING STATE */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-200 border-dashed">
                    <div className="relative mb-4">
                        <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles size={24} className="text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Sedang Menganalisis...</h3>
                    <p className="text-slate-400 font-medium">Menghubungkan pola data lintas kelas</p>
                </div>
            )}

            {/* RESULT SECTION */}
            {analysis && !loading && (
                <div className="space-y-8 animate-fade-in-up">
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* 1. KEKUATAN KOLEKTIF (Style: Success/Emerald) */}
                        <div className="bg-emerald-50/50 rounded-[2rem] p-8 border border-emerald-100 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600 border border-emerald-100">
                                        <BarChart3 size={24}/>
                                    </div>
                                    <h2 className="text-xl font-black text-emerald-900">Kekuatan Utama</h2>
                                </div>
                                {/* Panggil formatContent dengan variant 'success' */}
                                {formatContent(analysis.strengths, 'success')}
                            </div>
                        </div>

                        {/* 2. AREA INTERVENSI (Style: Warning/Amber) */}
                        <div className="bg-amber-50/50 rounded-[2rem] p-8 border border-amber-100 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-amber-600 border border-amber-100">
                                        <AlertTriangle size={24}/>
                                    </div>
                                    <h2 className="text-xl font-black text-amber-900">Area Perhatian</h2>
                                </div>
                                {/* Panggil formatContent dengan variant 'warning' */}
                                {formatContent(analysis.interventions, 'warning')}
                            </div>
                        </div>
                    </div>

                    {/* 3. REKOMENDASI KEBIJAKAN (Style: Info/Dark Theme) */}
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-white relative overflow-hidden border border-slate-700">
                        {/* Decorative Blob */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-20"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
                                        <Lightbulb size={32} className="text-yellow-300"/>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Rekomendasi Kebijakan</h2>
                                        <p className="text-indigo-200 text-sm font-medium">Langkah strategis berbasis data</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleStartAnalysis} 
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/50"
                                >
                                    <Play size={12} fill="currentColor"/> Refresh
                                </button>
                            </div>
                            
                            {/* Panggil formatContent dengan variant 'info' */}
                            <div className="text-lg">
                                {formatContent(analysis.recommendations, 'info')}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-2 text-slate-400 text-xs font-medium">
                                <Sparkles size={12}/>
                                <span>Hasil analisis dihasilkan oleh AI. Harap tinjau kembali sebelum penerapan kebijakan.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NationalAnalysis;