import React from 'react';

// Interface untuk data analisis
export interface ClassAnalysisData {
  keimanan: string;
  kewargaan: string;
  penalaranKritis: string;
  kreativitas: string;
  kolaborasi: string;
  kemandirian: string;
  kesehatan: string;
  komunikasi: string;
}

// Interface untuk Props komponen (ditambah teacherName & teacherNIP)
interface CollectiveReportProps {
  analysis: ClassAnalysisData;
  startDate: string;
  endDate: string;
  onClose: () => void;
  teacherName: string; // Data Nama Guru
  teacherNIP: string;  // Data NIP Guru
}

const CollectiveReportTemplate: React.FC<CollectiveReportProps> = ({ 
  analysis, 
  startDate, 
  endDate, 
  onClose,
  teacherName,
  teacherNIP
}) => {
  
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { dateStyle: 'long' });
  };

  const profiles = [
    { title: "Keimanan & Ketakwaan", content: analysis.keimanan, color: "border-emerald-600" },
    { title: "Kewargaan & Berkebinekaan", content: analysis.kewargaan, color: "border-blue-600" },
    { title: "Penalaran Kritis", content: analysis.penalaranKritis || "Data aktivitas akademik belum cukup untuk dianalisis.", color: "border-indigo-600" },
    { title: "Kreativitas", content: analysis.kreativitas, color: "border-purple-600" },
    { title: "Kolaborasi / Gotong Royong", content: analysis.kolaborasi, color: "border-orange-600" },
    { title: "Kemandirian", content: analysis.kemandirian, color: "border-slate-600" },
    { title: "Kesehatan Fisik & Mental", content: analysis.kesehatan, color: "border-rose-600" },
    { title: "Komunikasi", content: analysis.komunikasi, color: "border-teal-600" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex justify-center py-10">
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-2xl relative animate-in slide-in-from-bottom-4">
        
        {/* Tombol Aksi (Tidak ikut tercetak) */}
        <div className="absolute top-4 right-[-80px] flex flex-col gap-2 no-print">
            <button onClick={handlePrint} className="bg-slate-900 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-all" title="Cetak PDF">
                🖨️
            </button>
            <button onClick={onClose} className="bg-red-500 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-all" title="Tutup">
                ❌
            </button>
        </div>

        {/* Konten Dokumen */}
        <div className="p-12 h-full flex flex-col bg-white text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6 mb-8">
                <div className="flex items-center gap-5">
                    {/* Logo SMPN 6 - Pastikan path gambar benar */}
                    <img src="/logo-smpn6.png" alt="SMPN 6 Logo" className="h-20 w-auto" />
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-1">SMP NEGERI 6 PEKALONGAN</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Laporan Analisis Kolektif</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Periode Laporan</p>
                    <p className="text-sm font-black">{formatDate(startDate)}</p>
                    <p className="text-xs font-bold text-slate-400">s/d</p>
                    <p className="text-sm font-black">{formatDate(endDate)}</p>
                </div>
            </div>

            {/* Title */}
            <div className="text-center mb-10">
                <h2 className="text-xl font-black uppercase underline decoration-4 decoration-indigo-500 underline-offset-4">8 Profil Karakter Lulusan</h2>
                <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Rekapitulasi Periodik Kokurikuler</p>
            </div>

            {/* Grid 8 Profil */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 flex-grow">
                {profiles.map((profile, idx) => (
                    <div key={idx} className="break-inside-avoid">
                        <div className={`flex items-center gap-2 mb-2 pb-1 border-b-2 ${profile.color}`}>
                            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-black text-xs">{idx + 1}</div>
                            <h3 className="text-xs font-black uppercase tracking-wider">{profile.title}</h3>
                        </div>
                        <p className="text-[11px] leading-relaxed text-justify font-medium text-slate-700">
                            {profile.content}
                        </p>
                    </div>
                ))}
            </div>

            {/* Footer / Tanda Tangan */}
            <div className="mt-12 grid grid-cols-2 gap-20 break-inside-avoid">
                {/* Bagian Kepala Sekolah */}
                <div className="text-center">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-16">Mengetahui, Kepala Sekolah</p>
                    
                    {/* Placeholder Nama Kepala Sekolah */}
                    <p className="font-bold text-sm mb-1">(Nama Kepala Sekolah)</p>
                    
                    <div className="border-b-2 border-slate-900 w-2/3 mx-auto mb-2"></div>
                    <p className="text-xs font-black uppercase">NIP. -</p>
                </div>

                {/* Bagian Wali Kelas (Dinamis) */}
                <div className="text-center">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-16">Wali Kelas / Guru Pembimbing</p>
                    
                    {/* Nama Guru dari Props */}
                    <p className="font-bold text-sm mb-1 uppercase text-slate-900">
                        {teacherName}
                    </p>
                    
                    <div className="border-b-2 border-slate-900 w-2/3 mx-auto mb-2"></div>
                    
                    {/* NIP Guru dari Props */}
                    <p className="text-xs font-black uppercase">
                        NIP. {teacherNIP}
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CollectiveReportTemplate;