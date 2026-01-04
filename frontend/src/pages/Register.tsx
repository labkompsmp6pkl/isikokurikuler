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
  CheckCircle2,
} from 'lucide-react';

// ==========================================
// KOMPONEN UI PENDUKUNG
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
    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600 transition-colors">
      {icon}
    </div>
    <input 
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={onChange}
      className="appearance-none block w-full pl-16 pr-6 py-5 border-2 border-transparent bg-slate-50 hover:border-violet-100 focus:border-violet-500 rounded-[2rem] focus:outline-none focus:bg-white text-slate-900 transition-all font-bold text-sm shadow-inner focus:shadow-violet-100/50 placeholder:text-slate-300"
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
  disabled?: boolean;
};

const SelectField: React.FC<SelectFieldProps> = ({ 
  name, value, options, placeholder, onChange, required = true, icon, disabled = false
}) => (
  <div className={`relative group ${disabled ? 'opacity-50' : ''}`}>
    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600 transition-colors">
      {icon}
    </div>
    <select 
      name={name}
      value={value}
      required={required}
      onChange={onChange}
      disabled={disabled}
      className={`appearance-none block w-full pl-16 pr-12 py-5 border-2 border-transparent bg-slate-50 hover:border-violet-100 focus:border-violet-500 rounded-[2rem] focus:outline-none focus:bg-white transition-all font-bold text-sm shadow-inner focus:shadow-violet-100/50 ${!value ? 'text-slate-400' : 'text-slate-900'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-slate-400 group-focus-within:text-violet-600">
      <ChevronDown size={20} />
    </div>
  </div>
);

// ==========================================
// KOMPONEN UTAMA
// ==========================================

const Register: React.FC = () => {
  const { register: authRegister } = useAuth(); 
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'contributor' | 'parent'>('student');
  const [classList, setClassList] = useState<any[]>([]);
  
  const roleOptions = [
    { id: 'student', label: 'Siswa', icon: <GraduationCap size={24}/> },
    { id: 'teacher', label: 'Guru', icon: <ShieldCheck size={24}/> },
    { id: 'parent', label: 'Orang Tua', icon: <Heart size={24}/> },
    { id: 'contributor', label: 'Kontributor', icon: <Trophy size={24}/> }
  ] as const;

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

  useEffect(() => {
    const fetchClasses = async () => {
      setIsClassLoading(true);
      try {
        const response = await authApi.get('/auth/classes-list');
        const data = response.data.data || response.data;
        if (Array.isArray(data)) {
          // Filter kelas yang masih memiliki kapasitas
          const availableClasses = data.filter(c => (c.kapasitas || 0) > (c.terisi || 0));
          setClassList(availableClasses);
        }
      } catch (err) {
        console.error("Gagal memuat daftar kelas:", err);
      } finally {
        setIsClassLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const mappedClassOptions = useMemo(() => {
    // Menambahkan informasi sisa kursi pada label
    return classList.map(c => ({ 
        value: c.id, 
        label: `Kelas ${c.name} (Sisa ${c.kapasitas - c.terisi})` 
    }));
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
          icon={<User size={22}/>}
        />

        {selectedRole === 'student' && (
          <>
            <InputField 
              name="nisn" 
              placeholder="NISN (Nomor Induk Siswa Nasional)" 
              value={formData.nisn} 
              onChange={handleFormChange}
              icon={<ShieldCheck size={22}/>}
            />
            <SelectField 
              name="classId" 
              value={formData.classId} 
              options={mappedClassOptions} 
              placeholder={isClassLoading ? "Memuat kelas..." : (mappedClassOptions.length > 0 ? "Pilih Kelas" : "Semua kelas sudah penuh")}
              onChange={handleFormChange}
              icon={<GraduationCap size={22}/>}
              disabled={isClassLoading || mappedClassOptions.length === 0}
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
              icon={<ShieldCheck size={22}/>}
            />
            <SelectField 
              name="classId" 
              value={formData.classId} 
              options={mappedClassOptions} 
              placeholder="Wali Kelas (Opsional)" 
              required={false}
              onChange={handleFormChange}
              icon={<GraduationCap size={22}/>}
            />
          </>
        )}

        {selectedRole === 'contributor' && (
          <InputField 
            name="nip" 
            placeholder="NIP / Kode Identitas" 
            value={formData.nip} 
            onChange={handleFormChange}
            icon={<ShieldCheck size={22}/>}
          />
        )}

        {selectedRole === 'parent' && (
          <InputField 
            name="whatsappNumber" 
            placeholder="No. WhatsApp (08xxx)" 
            value={formData.whatsappNumber} 
            onChange={handleFormChange}
            icon={<Smartphone size={22}/>}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 selection:bg-violet-100 selection:text-violet-900 font-sans relative overflow-hidden">
      
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-fuchsia-100/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl p-10 md:p-14 rounded-[4rem] shadow-2xl shadow-slate-200/50 border border-white/60 relative z-10 my-10">
        
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-gradient-to-tr from-violet-50 to-white rounded-[2.5rem] mb-6 shadow-sm ring-4 ring-white">
            <img src="/logo-smpn6.png" alt="Logo SMPN 6" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Buat Akun Baru</h1>
          <p className="text-slate-500 font-bold">Bergabung bersama komunitas belajar <span className="text-violet-600">SMPN 6 Pekalongan</span>.</p>
        </div>

        <div className="mb-12">
          <a 
            href={`${API_HOST}/api/auth/google`} 
            className="group w-full flex items-center justify-center gap-4 py-5 px-6 border-2 border-slate-100 rounded-[2.5rem] bg-white hover:bg-slate-50 hover:border-violet-100 hover:shadow-xl hover:shadow-violet-100/30 transition-all active:scale-[0.98]"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" 
            />
            <span className="font-bold text-slate-700 text-base">Daftar Cepat dengan Google</span>
          </a>
          <div className="relative flex items-center justify-center mt-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-100 rounded-full"></div>
            </div>
            <div className="relative bg-white px-6 py-1 rounded-full border border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pendaftaran Manual</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-10">
          
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
              <UserPlus size={14} className="text-violet-500"/> Pilih Peran Anda
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {roleOptions.map((role) => (
                <button 
                  key={role.id} 
                  type="button" 
                  onClick={() => {
                    setSelectedRole(role.id as any);
                    setFormData(prev => ({ ...prev, classId: '', nisn: '', nip: '', whatsappNumber: '' }));
                    setError('');
                  }} 
                  className={`
                    w-full flex flex-col items-center justify-center gap-3 py-5 px-2 rounded-[2rem] border-2 transition-all duration-300
                    ${selectedRole === role.id 
                      ? 'bg-violet-600 text-white border-violet-600 shadow-xl shadow-violet-200 scale-105' 
                      : 'bg-white text-slate-400 border-slate-100 hover:border-violet-100 hover:text-violet-500 hover:shadow-md'}
                  `}
                >
                  {role.icon}
                  <span className="text-[10px] font-black uppercase tracking-wider">{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {renderRoleSpecificFields()}
            
            <div className="h-px bg-slate-100 w-full my-4"></div>

            <InputField 
              name="password" 
              placeholder="Buat Password" 
              type="password" 
              value={formData.password} 
              onChange={handleFormChange}
              icon={<Lock size={22}/>}
            />
            <InputField 
              name="confirmPassword" 
              placeholder="Konfirmasi Password" 
              type="password" 
              value={formData.confirmPassword} 
              onChange={handleFormChange}
              icon={<CheckCircle2 size={22}/>}
            />
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 text-xs font-bold p-5 rounded-[2rem] flex items-center gap-3 border border-rose-100 animate-shake">
              <AlertCircle size={20} className="shrink-0" />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="group w-full py-5 bg-violet-600 text-white font-black text-lg rounded-[2.5rem] shadow-xl shadow-violet-200 hover:bg-violet-700 hover:shadow-2xl hover:shadow-violet-300 hover:-translate-y-1 active:scale-[0.98] transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={24} />
                <span className="tracking-widest text-sm">MEMPROSES DATA...</span>
              </>
            ) : (
              <>
                <span>DAFTAR SEKARANG</span>
                <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                    <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform"/>
                </div>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm font-bold text-slate-500">
              Sudah punya akun?{' '}
              <Link 
                to="/login" 
                className="text-violet-600 font-black hover:text-violet-800 transition-all relative group"
              >
                Masuk di sini
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-violet-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;
