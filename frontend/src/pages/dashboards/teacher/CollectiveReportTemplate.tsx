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

// Interface untuk Props komponen
interface CollectiveReportProps {
  analysis: ClassAnalysisData;
  startDate: string;
  endDate: string;
  onClose: () => void;
  teacherName: string;
  teacherNIP: string;
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex justify-center py-4 md:py-10 print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* Container A4 Responsif: Scroll horizontal di HP, Fixed width di Desktop/Print */}
      <div className="relative w-full md:w-auto overflow-x-auto md:overflow-visible px-4 md:px-0">
        
        {/* Kertas A4 */}
        {/* min-h-[297mm] memastikan kertas bisa memanjang (multi-page) jika konten banyak */}
        <div className="bg-white w-[210mm] min-h-[297mm] mx-auto shadow-2xl relative flex flex-col print:shadow-none print:w-full print:min-h-0 print:mx-0">
          
          {/* Tombol Aksi (Tidak ikut tercetak) */}
          <div className="absolute top-0 right-[-60px] md:right-[-80px] flex flex-col gap-2 print:hidden z-50">
            <button onClick={handlePrint} className="bg-slate-900 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-slate-800 transition-all transform hover:scale-110" title="Cetak PDF">
              🖨️
            </button>
            <button onClick={onClose} className="bg-red-500 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-red-600 transition-all transform hover:scale-110" title="Tutup">
              ❌
            </button>
          </div>

          {/* Konten Dokumen */}
          <div className="p-8 md:p-12 flex-grow flex flex-col text-slate-900">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6 mb-8">
              <div className="flex items-center gap-4 md:gap-5">
                {/* Logo */}
                <img src="/logo-smpn6.png" alt="SMPN 6 Logo" className="h-16 md:h-20 w-auto object-contain" />
                <div>
                  <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 mb-1">SMP NEGERI 6 PEKALONGAN</h1>
                  <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">Laporan Analisis Kolektif</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Periode Laporan</p>
                <p className="text-sm font-black">{formatDate(startDate)}</p>
                <p className="text-xs font-bold text-slate-400">s/d</p>
                <p className="text-sm font-black">{formatDate(endDate)}</p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8 md:mb-10">
              <h2 className="text-lg md:text-xl font-black uppercase underline decoration-4 decoration-indigo-500 underline-offset-4">8 Profil Karakter Lulusan</h2>
              <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Rekapitulasi Periodik Kokurikuler</p>
            </div>

            {/* Grid 8 Profil */}
            {/* break-inside-avoid pada anak elemen mencegah grid terpotong jelek saat print */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {profiles.map((profile, idx) => (
                <div key={idx} className="break-inside-avoid page-break-item mb-4">
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

            {/* Spacer agar footer turun ke bawah jika konten sedikit, tapi fleksibel jika konten banyak */}
            <div className="flex-grow"></div>

            {/* Footer / Tanda Tangan */}
            {/* break-inside-avoid memastikan tanda tangan tidak terpisah ke halaman baru sendirian */}
            <div className="mt-12 grid grid-cols-2 gap-20 break-inside-avoid print:mt-16">
              {/* Bagian Kepala Sekolah */}
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-16">Mengetahui, Kepala Sekolah</p>
                
                {/* Placeholder Nama Kepala Sekolah */}
                <p className="font-bold text-sm mb-1">( ................................... )</p>
                
                <div className="border-b-2 border-slate-900 w-2/3 mx-auto mb-2"></div>
                <p className="text-xs font-black uppercase">NIP. .......................</p>
              </div>

              {/* Bagian Wali Kelas */}
              <div className="text-center">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-16">Wali Kelas / Guru Pembimbing</p>
                
                <p className="font-bold text-sm mb-1 uppercase text-slate-900">
                  {teacherName}
                </p>
                
                <div className="border-b-2 border-slate-900 w-2/3 mx-auto mb-2"></div>
                
                <p className="text-xs font-black uppercase">
                  NIP. {teacherNIP}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Style Khusus Print untuk Memaksa Page Break yang Rapih */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default CollectiveReportTemplate;