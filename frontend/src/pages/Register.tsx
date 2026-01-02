import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  useAuth, 
  API_HOST, 
  authApi 
} from '../services/authService'; 
import { 
  User, 
  UserPlus, 
  GraduationCap, 
  ShieldCheck, 
  Heart, 
  Smartphone, 
  Lock,  
  ArrowRight, 
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle2,
  Trophy
} from 'lucide-react';

// ==========================================
// 1. KOMPONEN UI PENDUKUNG (UI COMPONENTS)
// ==========================================

/**
 * InputField dengan integrasi Lucide Icon untuk UX lebih modern
 */
type InputFieldProps = {
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
};

const InputField: React.FC<InputFieldProps> = ({ 
  name, placeholder, value, onChange, type = 'text', required = true, icon 
}) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
      {icon}
    </div>
    <input 
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={onChange}
      className="appearance-none block w-full pl-11 pr-4 py-4 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all sm:text-sm bg-slate-50/50 hover:bg-white"
    />
  </div>
);

/**
 * SelectField custom untuk pemilihan kelas relasional berdasarkan ID
 */
type SelectFieldProps = {
  name: string;
  value: string | number;
  options: {value: string | number, label: string}[];
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  icon?: React.ReactNode;
};

const SelectField: React.FC<SelectFieldProps> = ({ 
  name, value, options, placeholder, onChange, required = true, icon 
}) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
      {icon}
    </div>
    <select 
      name={name}
      value={value}
      required={required}
      onChange={onChange}
      className={`appearance-none block w-full pl-11 pr-10 py-4 border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all sm:text-sm bg-slate-50/50 hover:bg-white cursor-pointer ${!value ? 'text-slate-400' : 'text-slate-900'}`}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(opt => <option key={opt.value} value={opt.value} className="text-slate-900">{opt.label}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-focus-within:text-indigo-600">
      <ChevronDown size={20} />
    </div>
  </div>
);

// ==========================================
// 2. TIPE DATA & INTERFACES
// ==========================================

type Role = 'student' | 'teacher' | 'contributor' | 'parent';

interface ClassData {
  id: number;
  name: string;
}

// ==========================================
// 3. KOMPONEN UTAMA REGISTER
// ==========================================

const Register: React.FC = () => {
  const { register: authRegister } = useAuth(); 
  const navigate = useNavigate();

  // --- A. STATE: FORM & DATA ---
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [classList, setClassList] = useState<ClassData[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    nisn: '',
    nip: '',
    whatsappNumber: '',
    classId: '', // Ini akan menyimpan ID numerik dari database
    password: '',
    confirmPassword: ''
  });

  // --- B. STATE: UI CONTROL ---
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isClassLoading, setIsClassLoading] = useState<boolean>(true);

  // --- C. INITIALIZATION ---
  useEffect(() => {
    const fetchClasses = async () => {
      setIsClassLoading(true);
      try {
        // Mengambil daftar kelas dari database relasional
        const response = await authApi.get('/auth/classes-list');
        const data = response.data.data || response.data;
        if (Array.isArray(data)) {
            setClassList(data);
        }
      } catch (err) {
        console.error("Database Error: Gagal mengambil daftar class_id", err);
        toast.error("Gagal sinkronisasi daftar kelas.");
      } finally {
        setIsClassLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // --- D. LOGIKA FILTER OPTION ---
  const mappedClassOptions = useMemo(() => {
    return classList.map(c => ({ 
      value: c.id, // Value adalah ID (Integer)
      label: `Kelas ${c.name}` // Label adalah Nama Teks
    }));
  }, [classList]);

  // --- E. HANDLERS ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Pre-Validation
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter demi keamanan akun.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak sesuai.');
      setLoading(false);
      toast.error('Cek kembali password Anda.');
      return;
    }

    const loadingToast = toast.loading('Mendaftarkan akun Anda...');

    try {
      /**
       * AUTOMATIC EMAIL GENERATOR SYSTEM
       * Sistem ini membuat email unik agar user tidak perlu input manual.
       * Menggunakan prefix nama + random suffix.
       */
      const namePrefix = formData.fullName.toLowerCase().replace(/\s+/g, '').slice(0, 10);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedEmail = `${namePrefix}${randomSuffix}@kokurikuler.id`;

      // Menyiapkan payload sesuai struktur database relasional (class_id)
      const registrationData = {
        role: selectedRole,
        fullName: formData.fullName.trim(),
        email: generatedEmail,
        password: formData.password,
        nisn: selectedRole === 'student' ? formData.nisn : undefined,
        nip: (selectedRole === 'teacher' || selectedRole === 'contributor') ? formData.nip : undefined,
        whatsappNumber: selectedRole === 'parent' ? formData.whatsappNumber : undefined,
        // PENTING: Mengirim classId (ID Database), bukan teks nama kelas
        classId: (selectedRole === 'student' || selectedRole === 'teacher') ? (formData.classId || undefined) : undefined,
      };
      
      const response = await authRegister(registrationData);
      
      toast.dismiss(loadingToast);
      toast.success('Selamat! Akun Anda berhasil dibuat.', { duration: 4000 });
      
      // Auto-Redirect ke Dashboard berdasarkan Role
      if (response.user) {
        const path = response.user.role === 'student' ? '/student/beranda' : `/${response.user.role}/dashboard`;
        navigate(path, { replace: true });
      } else {
        navigate('/login');
      }

    } catch (err: any) {
      toast.dismiss(loadingToast);
      const msg = err.response?.data?.message || 'Gagal mendaftar. NISN/NIP mungkin sudah digunakan.';
      setError(msg);
      toast.error("Registrasi Gagal");
      setLoading(false);
    }
  };

  // --- F. RENDER ROLE SPECIFIC FIELDS ---
  const renderRoleSpecificFields = () => {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-700">
        <InputField 
          name="fullName" 
          placeholder="Nama Lengkap Sesuai Ijazah" 
          value={formData.fullName} 
          onChange={handleFormChange}
          icon={<User size={20}/>}
        />

        {selectedRole === 'student' && (
          <>
            <InputField 
              name="nisn" 
              placeholder="Masukkan 10 Digit NISN" 
              value={formData.nisn} 
              onChange={handleFormChange}
              icon={<ShieldCheck size={20}/>}
            />
            <SelectField 
              name="classId" 
              value={formData.classId} 
              options={mappedClassOptions} 
              placeholder={isClassLoading ? "Memuat daftar kelas..." : "Pilih Kelas Anda"} 
              onChange={handleFormChange}
              icon={<GraduationCap size={20}/>}
            />
          </>
        )}

        {selectedRole === 'teacher' && (
          <>
            <InputField 
              name="nip" 
              placeholder="Nomor Induk Pegawai (NIP)" 
              value={formData.nip} 
              onChange={handleFormChange}
              icon={<ShieldCheck size={20}/>}
            />
            <SelectField 
              name="classId" 
              value={formData.classId} 
              options={mappedClassOptions} 
              placeholder="Pilih Kelas Wali (Jika Ada)" 
              required={false}
              onChange={handleFormChange}
              icon={<GraduationCap size={20}/>}
            />
          </>
        )}

        {selectedRole === 'contributor' && (
          <InputField 
            name="nip" 
            placeholder="NIP / Identitas Pegawai" 
            value={formData.nip} 
            onChange={handleFormChange}
            icon={<ShieldCheck size={20}/>}
          />
        )}

        {selectedRole === 'parent' && (
          <InputField 
            name="whatsappNumber" 
            placeholder="No. WhatsApp Aktif (08xxx)" 
            value={formData.whatsappNumber} 
            onChange={handleFormChange}
            icon={<Smartphone size={20}/>}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center py-16 px-4 selection:bg-indigo-100">
      <div className="w-full max-w-xl p-8 md:p-14 space-y-12 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] border border-slate-100 relative overflow-hidden">
        
        {/* Dekorasi Latar Belakang */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-50 rounded-full blur-3xl opacity-50"></div>

        {/* --- HEADER SECTION --- */}
        <div className="text-center space-y-5 relative z-10">
          <div className="inline-flex p-5 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-200 mb-2 rotate-3 hover:rotate-0 transition-transform duration-500">
            <img className="h-14 w-auto" src="/logo-smpn6.png" alt="SMPN 6 Pekalongan" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Mulai Perjalanan Karaktermu</h2>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">Bergabunglah dengan ribuan civitas SMPN 6 Pekalongan dalam pembiasaan positif.</p>
        </div>

        {/* --- GOOGLE REGISTER BUTTON --- */}
        <div className="space-y-8 relative z-10">
          <a 
            href={`${API_HOST}/api/auth/google`} 
            className="w-full flex items-center justify-center gap-4 px-8 py-5 border-2 border-slate-100 shadow-sm text-base font-bold rounded-[1.5rem] text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.97] group"
          >
            <img 
              className="h-6 w-6 group-hover:scale-110 transition-transform" 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google Icon" 
            />
            <span>Daftar Cepat via Google</span>
          </a>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-6 text-slate-400 uppercase tracking-[0.25em] text-[10px] font-black">Pendaftaran Manual</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>
        </div>

        {/* --- FORM SECTION --- */}
        <form onSubmit={handleRegister} className="space-y-10 relative z-10">
          
          {/* ROLE SELECTOR GRID */}
          <div className="space-y-5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <UserPlus size={14}/> Pilih Peran Anda:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['student', 'teacher', 'parent', 'contributor'] as Role[]).map(role => (
                <button 
                  key={role} 
                  type="button" 
                  onClick={() => {
                    setSelectedRole(role);
                    setFormData(prev => ({ ...prev, classId: '', nisn: '', nip: '', whatsappNumber: '' }));
                    setError('');
                  }} 
                  className={`w-full text-center px-2 py-4 text-[11px] font-black rounded-2xl border-2 transition-all duration-500 ${selectedRole === role ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200 scale-105' : 'bg-slate-50 text-slate-400 border-slate-50 hover:border-slate-200 hover:text-slate-600'}`}
                >
                  <div className="mb-2 flex justify-center">
                    {role === 'student' && <GraduationCap size={20}/>}
                    {role === 'teacher' && <ShieldCheck size={20}/>}
                    {role === 'parent' && <Heart size={20}/>}
                    {role === 'contributor' && <Trophy size={20}/>}
                  </div>
                  {role.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC FORM FIELDS */}
          <div className="space-y-5">
            {renderRoleSpecificFields()}
            
            <div className="h-px bg-slate-100 w-full my-6"></div>

            <InputField 
              name="password" 
              placeholder="Buat Password Akun" 
              type="password" 
              value={formData.password} 
              onChange={handleFormChange}
              icon={<Lock size={20}/>}
            />
            <InputField 
              name="confirmPassword" 
              placeholder="Ulangi Password Anda" 
              type="password" 
              value={formData.confirmPassword} 
              onChange={handleFormChange}
              icon={<CheckCircle2 size={20}/>}
            />
          </div>

          {/* ERROR MESSAGES */}
          {error && (
            <div className="bg-rose-50 text-rose-600 text-xs font-bold p-5 rounded-[1.5rem] flex items-center gap-4 border border-rose-100 animate-bounce-short">
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading} 
              className="group relative w-full flex justify-center py-5 px-8 border border-transparent text-sm font-black rounded-[1.5rem] text-white bg-slate-900 hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:bg-slate-300 transition-all shadow-2xl active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <RefreshCw className="animate-spin" size={20}/>
                  <span>SEDANG MEMPROSES...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>DAFTAR SEKARANG</span>
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-300"/>
                </div>
              )}
            </button>
          </div>

          {/* FOOTER LINK */}
          <div className="text-center pt-4">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 border-dashed inline-block w-full">
              <p className="text-sm text-slate-500 font-medium">
                Sudah punya akun resmi?{' '}
                <Link 
                  to="/login" 
                  className="font-black text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-8 transition-all"
                >
                  Masuk di Sini
                </Link>
              </p>
            </div>
          </div>
        </form>

        {/* SISTEM INFO */}
        <div className="text-center pb-2 opacity-30">
            <div className="flex justify-center items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                <Info size={10}/>
                <span>kokurikuler Data Protection System v2.0</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Register;