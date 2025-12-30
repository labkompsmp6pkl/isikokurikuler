
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import parentService, { ParentDashboardData, CharacterLog } from '../../services/parentService';
import Spinner from './student/components/Spinner';
import ApprovalPanel from './parent/ApprovalPanel';

const ParentDashboard: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { fullName: 'Orang Tua' };

    useEffect(() => {
        const fetchDashboardData = async () => {
            // ... (logika fetch data tidak berubah) ...
            setIsLoading(true);
            setError(null);
            const loadingToast = toast.loading('Memuat data perkembangan anak...');

            try {
                const data = await parentService.getDashboardData();
                setDashboardData(data);
                toast.success('Data berhasil dimuat!', { id: loadingToast });
            } catch (err: any) {
                setError(err.message || 'Gagal memuat data. Silakan coba lagi nanti.');
                toast.error(err.message || 'Gagal memuat data.', { id: loadingToast });
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // --- [PENAMBAHAN] FUNGSI UNTUK MEMPERBARUI STATE SECARA LOKAL --- 
    const handleApprovalSuccess = (updatedLog: CharacterLog) => {
        setDashboardData(prevData => {
            if (!prevData) return null;

            const updatedLogs = prevData.logs.map(log => 
                log.id === updatedLog.id ? updatedLog : log
            );

            return {
                ...prevData,
                logs: updatedLogs
            };
        });
    };

    // ... (kondisi isLoading, error, dan !dashboardData tidak berubah) ...

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
                    <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition">
                        Coba Muat Ulang Halaman
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboardData || !dashboardData.student) {
        return <div className="text-center p-8">Tidak ada data yang dapat ditampilkan.</div>;
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
                        {/* [PERUBAHAN] Melewatkan fungsi onApproveSuccess ke ApprovalPanel */}
                        <ApprovalPanel logs={dashboardData.logs} onApproveSuccess={handleApprovalSuccess} />
                    </div>

                    <div className="space-y-8">
                        {/* ... (kolom kanan tidak berubah) ... */}
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
