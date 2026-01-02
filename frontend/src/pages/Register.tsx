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
  Trophy,
  CheckCircle2
} from 'lucide-react';

// ==========================================
// 1. KOMPONEN UI PENDUKUNG
// ==========================================

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
      className="appearance-none block w-full pl-11 pr-4 py-4 border-2 border-slate-50 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all font-bold text-sm"
    />
  </div>
);

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
      className={`appearance-none block w-full pl-11 pr-10 py-4 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all font-bold text-sm cursor-pointer ${!value ? 'text-slate-400' : 'text-slate-900'}`}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-focus-within:text-indigo-600">
      <ChevronDown size={20} />
    </div>
  </div>
);

// ==========================================
// 2. TIPE DATA
// ==========================================

type Role = 'student' | 'teacher' | 'contributor' | 'parent';

interface ClassData {
  id: number;
  name: string;
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

const Register: React.FC = () => {
  const { register: authRegister } = useAuth(); 
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [classList, setClassList] = useState<ClassData[]>([]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    nisn: '',
    nip: '',
    whatsappNumber: '',
    classId: '', 
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isClassLoading, setIsClassLoading] = useState<boolean>(true);

  // --- Fetch Data Kelas ---
  useEffect(() => {
    const fetchClasses = async () => {
      setIsClassLoading(true);
      try {
        const response = await authApi.get('/auth/classes-list');
        const data = response.data.data || response.data;
        if (Array.isArray(data)) setClassList(data);
      } catch (err) {
        console.error("Gagal load kelas:", err);
      } finally {
        setIsClassLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const mappedClassOptions = useMemo(() => {
    return classList.map(c => ({ value: c.id, label: `Kelas ${c.name}` }));
  }, [classList]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      setLoading(false);
      return;
    }

    const loadingToast = toast.loading('Mendaftarkan akun...');

    try {
      // Auto-generate email unik
      const namePrefix = formData.fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedEmail = `${namePrefix}${randomSuffix}@isokurikuler.id`;

      const registrationData = {
        role: selectedRole,
        fullName: formData.fullName.trim(),
        email: generatedEmail,
        password: formData.password,
        nisn: selectedRole === 'student' ? formData.nisn : undefined,
        nip: (selectedRole === 'teacher' || selectedRole === 'contributor') ? formData.nip : undefined,
        whatsappNumber: selectedRole === 'parent' ? formData.whatsappNumber : undefined,
        classId: (selectedRole === 'student' || selectedRole === 'teacher') ? (formData.classId || undefined) : undefined,
      };
      
      const response = await authRegister(registrationData);
      
      toast.dismiss(loadingToast);
      toast.success('Pendaftaran Berhasil!', { icon: '🎉' });
      
      if (response.user) {
        const target = response.user.role === 'student' ? '/student/beranda' : `/${response.user.role}/dashboard`;
        navigate(target, { replace: true });
      } else {
        navigate('/login');
      }

    } catch (err: any) {
      toast.dismiss(loadingToast);
      const msg = err.response?.data?.message || 'Gagal mendaftar. Data mungkin sudah ada.';
      setError(msg);
      toast.error("Registrasi Gagal");
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <InputField 
          name="fullName" 
          placeholder="Nama Lengkap (Sesuai Identitas)" 
          value={formData.fullName} 
          onChange={handleFormChange}
          icon={<User size={20}/>}
        />

        {selectedRole === 'student' && (
          <>
            <InputField 
              name="nisn" 
              placeholder="NISN (10 Digit)" 
              value={formData.nisn} 
              onChange={handleFormChange}
              icon={<ShieldCheck size={20}/>}
            />
            <SelectField 
              name="classId" 
              value={formData.classId} 
              options={mappedClassOptions} 
              placeholder={isClassLoading ? "Memuat kelas..." : "Pilih Kelas"} 
              onChange={handleFormChange}
              icon={<GraduationCap size={20}/>}
            />
          </>
        )}

        {selectedRole === 'teacher' && (
          <>
            <InputField 
              name="nip" 
              placeholder="NIP / Identitas Pegawai" 
              value={formData.nip} 
              onChange={handleFormChange}
              icon={<ShieldCheck size={20}/>}
            />
            <SelectField 
              name="classId" 
              value={formData.classId} 
              options={mappedClassOptions} 
              placeholder="Wali Kelas (Opsional)" 
              required={false}
              onChange={handleFormChange}
              icon={<GraduationCap size={20}/>}
            />
          </>
        )}

        {selectedRole === 'contributor' && (
          <InputField 
            name="nip" 
            placeholder="NIP / Kode Identitas" 
            value={formData.nip} 
            onChange={handleFormChange}
            icon={<ShieldCheck size={20}/>}
          />
        )}

        {selectedRole === 'parent' && (
          <InputField 
            name="whatsappNumber" 
            placeholder="No. WhatsApp (08xxx)" 
            value={formData.whatsappNumber} 
            onChange={handleFormChange}
            icon={<Smartphone size={20}/>}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      {/* Background Decor */}
      <div className="fixed top-[-10%] right-[-5%] w-[30%] h-[30%] bg-indigo-100 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-100 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>

      <div className="w-full max-w-xl bg-white p-10 md:p-14 rounded-[3rem] shadow-2xl border border-slate-100 relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-indigo-50 rounded-[2rem] mb-6 shadow-sm">
            <img src="/logo-smpn6.png" alt="Logo SMPN 6" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">KOKURIKULER</h1>
          <p className="text-sm font-bold text-indigo-600 tracking-[0.2em] uppercase">SMPN 6 PEKALONGAN</p>
        </div>

        {/* GOOGLE REGISTER */}
        <div className="mb-10">
          <a 
            href={`${API_HOST}/api/auth/google`} 
            className="group w-full flex items-center justify-center gap-4 py-4 px-6 border-2 border-slate-100 rounded-2xl bg-white hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98] shadow-sm"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              className="w-6 h-6 group-hover:scale-110 transition-transform" 
            />
            <span className="font-bold text-slate-700 text-sm">Daftar Cepat dengan Google</span>
          </a>

          <div className="relative flex items-center justify-center mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative bg-white px-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Atau Daftar Manual</span>
            </div>
          </div>
        </div>

        {/* FORM REGISTER */}
        <form onSubmit={handleRegister} className="space-y-8">
          
          {/* Role Selector Grid */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <UserPlus size={14}/> Pilih Peran Anda
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['student', 'teacher', 'parent', 'contributor'] as Role[]).map(role => (
                <button 
                  key={role} 
                  type="button" 
                  onClick={() => {
                    setSelectedRole(role);
                    setFormData(prev => ({ ...prev, classId: '', nisn: '', nip: '', whatsappNumber: '' }));
                    setError('');
                  }} 
                  className={`
                    w-full flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all duration-300
                    ${selectedRole === role 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-105' 
                      : 'bg-slate-50 text-slate-400 border-slate-50 hover:border-slate-200 hover:text-slate-600'}
                  `}
                >
                  {role === 'student' && <GraduationCap size={20}/>}
                  {role === 'teacher' && <ShieldCheck size={20}/>}
                  {role === 'parent' && <Heart size={20}/>}
                  {role === 'contributor' && <Trophy size={20}/>}
                  <span className="text-[10px] font-black uppercase tracking-wider">{role}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Fields */}
          <div className="space-y-4">
            {renderRoleSpecificFields()}
            
            <div className="h-px bg-slate-100 w-full my-2"></div>

            <InputField 
              name="password" 
              placeholder="Buat Password" 
              type="password" 
              value={formData.password} 
              onChange={handleFormChange}
              icon={<Lock size={20}/>}
            />
            <InputField 
              name="confirmPassword" 
              placeholder="Konfirmasi Password" 
              type="password" 
              value={formData.confirmPassword} 
              onChange={handleFormChange}
              icon={<CheckCircle2 size={20}/>}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 text-rose-600 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 border border-rose-100 animate-shake">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading} 
            className="group w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                <span>MEMPROSES...</span>
              </>
            ) : (
              <>
                <span>DAFTAR SEKARANG</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
              </>
            )}
          </button>

          {/* Footer Link */}
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">
              Sudah punya akun?{' '}
              <Link 
                to="/login" 
                className="text-indigo-600 font-black hover:text-indigo-800 hover:underline transition-all"
              >
                Masuk di sini
              </Link>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;