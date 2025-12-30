import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import parentService, { ParentDashboardData, CharacterLog } from '../../services/parentService';
import Spinner from './student/components/Spinner';
import ApprovalPanel from './parent/ApprovalPanel';

// [FITUR BARU] Komponen Form untuk Menautkan Akun Siswa
const LinkStudentForm: React.FC<{ onLinkSuccess: (data: ParentDashboardData) => void }> = ({ onLinkSuccess }) => {
    const [nisn, setNisn] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    const [linkError, setLinkError] = useState<string | null>(null);

    const handleLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nisn.trim()) {
            setLinkError('NISN tidak boleh kosong.');
            return;
        }
        setIsLinking(true);
        setLinkError(null);
        const toastId = toast.loading('Menghubungkan dengan data siswa...');

        try {
            const result = await parentService.linkStudent(nisn);
            toast.success(result.message || 'Siswa berhasil ditautkan!', { id: toastId });
            // Panggil callback untuk memperbarui state di ParentDashboard
            // Kita buat objek ParentDashboardData palsu karena API hanya mengembalikan student
            onLinkSuccess({ student: result.student, logs: [] }); 
        } catch (err: any) {
            const message = err.response?.data?.message || 'Gagal menautkan siswa.';
            setLinkError(message);
            toast.error(message, { id: toastId });
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-xl text-center">
                <img src="/vectors/collaboration.svg" alt="Hubungkan Akun" className="mx-auto h-32 w-auto"/>
                <h2 className="text-2xl font-bold text-gray-800">Hubungkan dengan Akun Anak</h2>
                <p className="text-gray-600">
                    Untuk mulai memantau, masukkan Nomor Induk Siswa Nasional (NISN) anak Anda.
                </p>
                <form onSubmit={handleLink} className="space-y-4">
                    <input
                        type="text"
                        value={nisn}
                        onChange={(e) => setNisn(e.target.value)}
                        placeholder="Masukkan NISN di sini"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLinking}
                    />
                    <button 
                        type="submit" 
                        className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 transition"
                        disabled={isLinking}
                    >
                        {isLinking ? 'Menautkan...' : 'Tautkan Akun'}
                    </button>
                    {linkError && <p className="text-red-500 text-sm mt-2">{linkError}</p>}
                </form>
                 <p className="text-xs text-gray-500 pt-4">
                    Pastikan NISN sudah benar. Jika terjadi masalah, silakan hubungi pihak sekolah.
                </p>
            </div>
        </div>
    );
};


const ParentDashboard: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { fullName: 'Orang Tua' };

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await parentService.getDashboardData();
            setDashboardData(data);
        } catch (err: any) {
            // Jika error 404 (siswa tidak ditemukan), jangan set error global, biarkan form ditampilkan
            if (err.response?.status !== 404) {
                 setError(err.message || 'Gagal memuat data.');
            }
            setDashboardData(null); // Pastikan data kosong jika ada error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadingToast = toast.loading('Memuat data dasbor...');
        fetchData().finally(() => toast.dismiss(loadingToast));
    }, []);

    const handleApprovalSuccess = (updatedLog: CharacterLog) => {
        setDashboardData(prevData => {
            if (!prevData) return null;
            const updatedLogs = prevData.logs.map(log => 
                log.id === updatedLog.id ? updatedLog : log
            );
            return { ...prevData, logs: updatedLogs };
        });
    };

    // [FITUR BARU] Callback untuk memperbarui data setelah penautan berhasil
    const handleLinkSuccess = async (linkedData: ParentDashboardData) => {
        setDashboardData(linkedData); // Tampilkan data siswa yg baru ditautkan
        // Muat ulang data lengkap (termasuk logs) dari server
        await fetchData(); 
    };
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <Spinner />
                <p className="mt-4 text-lg text-gray-600">Menyiapkan Dasbor Anda...</p>
            </div>
        );
    }

    if (error) {
        return (
             <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-8">
                 <div className="text-center">
                     <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <h2 className="mt-4 text-2xl font-bold text-red-800">Terjadi Kesalahan</h2>
                     <p className="mt-2 text-md text-red-600">{error}</p>
                     <button onClick={fetchData} className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition">
                         Coba Muat Ulang
                     </button>
                 </div>
             </div>
        );
    }

    // [FITUR BARU] Tampilkan form jika tidak ada siswa yang terhubung
    if (!dashboardData?.student) {
        return <LinkStudentForm onLinkSuccess={handleLinkSuccess} />;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white shadow-md rounded-xl p-6 mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Selamat Datang, {user.fullName}!</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Anda memantau progres ananda <span className="font-bold text-blue-700">{dashboardData.student.fullName}</span> dari kelas <span className="font-bold text-blue-700">{dashboardData.student.class}</span>.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                        <ApprovalPanel logs={dashboardData.logs} onApproveSuccess={handleApprovalSuccess} />
                    </div>

                    <div className="space-y-8">
                         <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Analisis Mingguan</h2>
                            <p className='text-gray-500'>Segera hadir: Grafik visual untuk memantau konsistensi kebiasaan.</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Riwayat Lengkap</h2>
                            <p className='text-gray-500'>Segera hadir: Kalender interaktif untuk melihat riwayat log.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;
