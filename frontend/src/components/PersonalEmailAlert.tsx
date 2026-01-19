import React, { useState, useEffect } from 'react';
import { AlertCircle, Save, X, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, useAuth } from '../services/authService';

const PersonalEmailAlert: React.FC = () => {
    const { user, updateUserContext } = useAuth(); 
    
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false); // State cek ke server
    const [isVisible, setIsVisible] = useState(true);

    // --- 1. FITUR AUTO-SYNC (PERBAIKAN UTAMA) ---
    useEffect(() => {
        // Jika user login TAPI personal_email di local kosong, cek ke database
        if (user && !user.personal_email) {
            setIsChecking(true);
            authApi.get('/auth/me')
                .then((res) => {
                    const serverEmail = res.data?.personal_email;
                    // Jika di database ternyata ada isinya...
                    if (serverEmail && serverEmail.length > 3) {
                        // ...Update data local browser agar sinkron
                        updateUserContext({ personal_email: serverEmail });
                        // Alert akan otomatis hilang karena komponen me-render ulang
                    }
                })
                .catch((err) => console.error("Gagal sync user:", err))
                .finally(() => setIsChecking(false));
        }
    }, []); // Jalan sekali saat mount

    // --- 2. LOGIC TAMPILAN ---
    // Jangan render jika:
    // a. User belum login
    // b. User SUDAH punya email pribadi (Baik dari awal atau setelah Auto-Sync)
    // c. User menutup alert manual
    const hasPersonalEmail = user?.personal_email && user.personal_email.length > 3 && user.personal_email.includes('@');
    
    if (!user || hasPersonalEmail || !isVisible) {
        return null; 
    }

    const handleSave = async () => {
        if (!email) return toast.error("Email wajib diisi");
        if (!email.includes('@') || !email.includes('.')) return toast.error("Format email tidak valid");

        setLoading(true);
        try {
            // Simpan ke Database
            await authApi.post('/auth/update-email', { personal_email: email });
            
            // Update Local State (Agar alert hilang permanen tanpa reload)
            updateUserContext({ personal_email: email });

            toast.success("Email tersimpan permanen!", { icon: <CheckCircle2 className="text-emerald-500"/> });
            setIsVisible(false);
            
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan. Coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-6 rounded-r-xl shadow-sm animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-start justify-between">
                <div className="flex gap-4 w-full">
                    <div className="text-rose-500 mt-0.5 shrink-0">
                        {isChecking ? <RefreshCw size={24} className="animate-spin"/> : <AlertCircle size={24} />}
                    </div>
                    <div className="w-full">
                        <h4 className="font-bold text-rose-800 text-sm uppercase tracking-wide mb-1 flex items-center gap-2">
                            Keamanan Akun: Email Pribadi Belum Diatur
                            {isChecking && <span className="text-[10px] font-normal lowercase italic text-rose-600">(mengecek data...)</span>}
                        </h4>
                        <p className="text-sm text-rose-700 mb-3 leading-relaxed max-w-3xl">
                            Untuk keamanan pemulihan akun (Lupa Password) dan notifikasi penting, mohon daftarkan email pribadi aktif Anda (Gmail/Yahoo/dll) yang berbeda dari email login sistem.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full max-w-lg">
                            <div className="relative w-full">
                                <input 
                                    type="email" 
                                    placeholder="contoh: nama.anda@gmail.com" 
                                    className="w-full px-4 py-2.5 text-sm border-2 border-rose-200 rounded-lg focus:ring-4 focus:ring-rose-100 focus:border-rose-500 outline-none text-slate-800 placeholder:text-slate-400 bg-white transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isChecking}
                                />
                            </div>
                            <button 
                                onClick={handleSave} 
                                disabled={loading || isChecking}
                                className="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 flex items-center gap-2 transition-all disabled:opacity-70 whitespace-nowrap shadow-md shadow-rose-200 active:scale-95"
                            >
                                {loading ? 'Menyimpan...' : <><Save size={16} /> Simpan Permanen</>}
                            </button>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsVisible(false)} 
                    className="text-rose-300 hover:text-rose-600 transition-colors p-1"
                    title="Sembunyikan sementara"
                >
                    <X size={20}/>
                </button>
            </div>
        </div>
    );
};

export default PersonalEmailAlert;