import React, { useState } from 'react';
import { 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    User, 
    ArrowLeft,
    CheckCircle2,
    Users
} from 'lucide-react';

interface StudentSelectorViewProps {
    students: any[];
    onSelect: (studentId: string) => void;
    onBack: () => void;
}

const StudentSelectorView: React.FC<StudentSelectorViewProps> = ({ students, onSelect, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const ITEMS_PER_PAGE = 8;

    // Filter siswa
    const filteredStudents = students.filter(s => 
        s.full_name.toLowerCase().includes(appliedSearch.toLowerCase())
    );

    // Logic Paginasi
    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(searchTerm);
        setCurrentPage(1); 
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-rose-100 overflow-hidden animate-fade-in min-h-[600px] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-rose-50 bg-rose-50/30 sticky top-0 z-10 backdrop-blur-md flex items-center gap-4">
                <button 
                    onClick={onBack} 
                    className="p-2 bg-white border border-rose-100 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h3 className="text-xl font-black text-gray-800">Pilih Target Siswa</h3>
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                        {filteredStudents.length} Siswa Ditemukan
                    </p>
                </div>
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col">
                
                {/* Search Bar & Broadcast */}
                <div className="space-y-4 mb-8">
                    {/* Opsi Broadcast */}
                    <button 
                        onClick={() => onSelect('all')}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-rose-200 hover:scale-[1.01] transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Users size={20} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-black text-lg">Semua Siswa (Broadcast)</h4>
                                <p className="text-rose-100 text-xs font-medium">Kirim bukti sikap ke seluruh siswa</p>
                            </div>
                        </div>
                        <ChevronRight className="opacity-70 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px bg-gray-100 flex-1"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Atau Cari Siswa</span>
                        <div className="h-px bg-gray-100 flex-1"></div>
                    </div>

                    {/* Input Pencarian */}
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                className="w-full pl-5 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 transition-all placeholder:text-gray-300"
                                placeholder="Cari nama siswa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            className="px-6 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2"
                        >
                            <Search size={20} /> <span className="hidden md:inline">Cari</span>
                        </button>
                    </form>
                </div>

                {/* List Siswa Grid */}
                {currentStudents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {currentStudents.map((student) => (
                            <button
                                key={student.id}
                                onClick={() => onSelect(student.id.toString())}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-rose-300 hover:shadow-md hover:bg-rose-50 transition-all group text-left"
                            >
                                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                    {student.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 group-hover:text-rose-900 line-clamp-1">{student.full_name}</h4>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider group-hover:text-rose-500">
                                        {student.class_name || 'Tanpa Kelas'} - {student.teacher_name || 'Tanpa Wali'}
                                    </p>
                                </div>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-rose-600">
                                    <CheckCircle2 size={24} />
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-60">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <User size={40} className="text-gray-400" />
                        </div>
                        <p className="font-bold text-gray-500">Siswa tidak ditemukan</p>
                        <p className="text-sm text-gray-400">Coba kata kunci pencarian lain.</p>
                    </div>
                )}

                {/* Pagination Controls */}
                {filteredStudents.length > ITEMS_PER_PAGE && (
                    <div className="mt-auto flex justify-between items-center pt-6 border-t border-gray-100">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all font-bold text-sm flex items-center gap-2"
                        >
                            <ChevronLeft size={16} /> Sebelumnya
                        </button>
                        
                        <span className="font-bold text-gray-400 text-sm">
                            Halaman <span className="text-rose-600">{currentPage}</span> dari {totalPages}
                        </span>

                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all font-bold text-sm flex items-center gap-2"
                        >
                            Selanjutnya <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentSelectorView;