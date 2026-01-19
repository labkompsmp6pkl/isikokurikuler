import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import toast from 'react-hot-toast'; 
import { useAuth, authApi } from '../../services/authService'; 
import characterService from '../../services/characterService';
import Spinner from './student/components/Spinner';
import PersonalEmailAlert from '../../components/PersonalEmailAlert'; // Komponen Alert Email

import { 
  Trophy, 
  BarChart3, 
  Archive, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  CalendarDays,
  CheckCircle2,
  Edit3,
  AlertCircle,
  Save,
  Filter // Icon Filter
} from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // --- STATE CORE ---
  // Inisialisasi dengan data user dari context (localStorage), nanti di-update via API
  const [studentData, setStudentData] = useState<any>(user || {});
  const [className, setClassName] = useState<string>(user?.class_name || '-'); 
  
  const [searchParams] = useSearchParams();
  const urlDate = searchParams.get('date');

  // --- HELPER DATES ---
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();
  const [date, setDate] = useState(urlDate || todayStr); 
  
  // Logic Waktu
  const isFutureDate = date > todayStr;
  const isPastDate = date < todayStr;

  const [activeTab, setActiveTab] = useState<'plan' | 'execution'>('plan');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [dashData, setDashData] = useState<any>(null);
  
  // Mode Edit
  const [isEditing, setIsEditing] = useState(false);

  // Filter Statistik Kebiasaan
  const [statsFilter, setStatsFilter] = useState<'current' | 'all'>('current');

  const isAlumni = studentData?.role === 'alumni';

  // State Form
  const [formData, setFormData] = useState<any>({
    wake_up_time: '',
    worship_activities: [], 
    worship_detail: '',
    sport_activities: [], 
    sport_detail: '',
    meal_text: '',
    study_activities: [],
    study_detail: '',
    social_activities: [],
    social_detail: '',
    sleep_time: '',
  });

  const [isPlanSubmitted, setIsPlanSubmitted] = useState(false);
  const [isExecutionSubmitted, setIsExecutionSubmitted] = useState(false);

  // --- OPTIONS CONSTANTS ---
  const sholatOptions = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
  const ibadahSunnah = ['Dhuha', 'Tahajud', 'Baca Al-Quran', 'Puasa Sunnah'];
  const sportOptionsList = [
      'Jalan Santai', 'Lari / Jogging', 'Senam', 
      'Sepak Bola', 'Futsal', 'Voli', 'Basket', 
      'Badminton', 'Renang', 'Bela Diri'
  ];
  const learningOptionsList = ['Mengerjakan PR', 'Membaca Buku', 'Les / Bimbel', 'Belajar Kelompok', 'Menonton Video Edukasi'];
  const socialOptionsList = ['Membantu Orang Tua', 'Gotong Royong', 'Infaq / Sedekah', 'Menjenguk Teman', 'Membersihkan Lingkungan'];

  // --- 1. FETCH DATA DASHBOARD & KELAS ---
  const fetchDashboardData = async () => {
      try {
          const data = await characterService.getStudentDashboard();
          if (data) {
            setDashData(data);
            
            // [FIX] Update studentData dengan data terbaru dari API (termasuk start_period/end_period)
            if (data.student) {
                setStudentData((prev: any) => ({ 
                    ...prev, 
                    ...data.student 
                }));
            }
            
            // LOGIKA CARI NAMA KELAS (Robust)
            let foundName = 
                data.studentClass || 
                data.class_name || 
                data.student?.class_name || 
                user?.class_name;

            // Jika masih kosong/strip, cari manual via API list kelas
            if (!foundName || foundName === '-') {
                const classId = data.student?.class_id || user?.class_id || user?.classId;
                if (classId) {
                    try {
                        const classRes = await authApi.get('/auth/classes-list');
                        const classes = classRes.data.data || classRes.data;
                        const matched = classes.find((c:any) => c.id == classId);
                        if (matched) foundName = matched.name;
                    } catch (e) { console.error("Gagal cari kelas:", e); }
                }
            }
            
            if (foundName) setClassName(foundName);
          }
      } catch (error) { console.error(error); }
  };

  useEffect(() => {
    setDate(urlDate || todayStr); 
  }, [urlDate]);

  // --- 2. LOGIC TAB OTOMATIS ---
  useEffect(() => {
    fetchLog(date);
    fetchDashboardData();
    setIsEditing(false); 

    if (isFutureDate) {
        setActiveTab('plan');
    } else if (isPastDate) {
        // Hari lalu: Langsung ke Eksekusi
        setActiveTab('execution');
    } else {
        // Hari ini: Default Plan
        setActiveTab('plan');
    }
  }, [date, statsFilter]); // Re-fetch jika filter berubah

  const fetchLog = async (currentDate: string) => {
    setLoading(true);
    try {
      const data = await characterService.getLogByDate(currentDate);
      setApiData(data);
      
      if (data) {
        const planDone = !!data.is_plan_submitted;
        const execDone = !!data.is_execution_submitted;
        setIsPlanSubmitted(planDone);
        setIsExecutionSubmitted(execDone);

        // Auto-switch tab jika hari ini dan plan sudah selesai
        if (currentDate === todayStr && planDone && !execDone) {
            setActiveTab('execution');
        }
      } else {
        setIsPlanSubmitted(false);
        setIsExecutionSubmitted(false);
      }
    } catch (error) { console.error("Gagal log:", error); } 
    finally { setLoading(false); }
  };

  // --- 3. MAPPING DATA KE FORM ---
  useEffect(() => {
    if (!apiData) { resetForm(); return; }
    
    const parseList = (val: any) => {
        if (Array.isArray(val)) return val;
        try { return JSON.parse(val) || []; } catch { return []; }
    };

    const getData = (key: string) => {
        // Ambil data sesuai tab aktif (Plan vs Execution)
        const dbKey = activeTab === 'plan' ? `plan_${key}` : key;
        return apiData[dbKey];
    };

    setFormData({
      wake_up_time: getData('wake_up_time') || '',
      worship_activities: parseList(getData('worship_activities')),
      worship_detail: getData('worship_detail') || '',
      sport_activities: parseList(getData('sport_activities')),
      sport_detail: getData('sport_detail') || '',
      meal_text: getData('meal_text') || '',
      study_activities: parseList(getData('study_activities')),
      study_detail: getData('study_detail') || '',
      social_activities: parseList(getData('social_activities')),
      social_detail: getData('social_detail') || '',
      sleep_time: getData('sleep_time') || '',
    });
  }, [activeTab, apiData, isEditing]); 

  const resetForm = () => {
    setFormData({ 
        wake_up_time: '', worship_activities: [], worship_detail: '', 
        sport_activities: [], sport_detail: '', meal_text: '', 
        study_activities: [], study_detail: '', social_activities: [], social_detail: '', sleep_time: '' 
    });
  };

  const handleSave = async () => {
    if (isAlumni) { toast.error("Alumni tidak dapat mengubah data."); return; }
    
    // Validasi Hari Lalu: Tidak boleh simpan Plan
    if (activeTab === 'plan' && isPastDate) {
        toast.error("Tidak bisa mengisi Rencana untuk hari yang sudah lewat.");
        return;
    }

    const toastId = 'save-journal'; 
    
    // Validasi Hari Ini: Harus isi Rencana dulu
    if (!isPastDate && activeTab === 'execution' && !isPlanSubmitted) { 
        toast.error('Isi Rencana terlebih dahulu untuk hari ini!', { id: toastId }); 
        return; 
    }

    const payload: any = { log_date: date, mode: activeTab };
    const prefix = activeTab === 'plan' ? 'plan_' : '';
    
    const fields = [
        'wake_up_time', 'worship_activities', 'worship_detail', 
        'sport_activities', 'sport_detail', 'meal_text', 
        'study_activities', 'study_detail', 'social_activities', 'social_detail', 'sleep_time'
    ];

    fields.forEach(field => {
        payload[`${prefix}${field}`] = formData[field];
    });

    try {
      toast.loading('Menyimpan...', { id: toastId });
      await characterService.saveCharacterLog(payload);
      toast.success('Berhasil disimpan!', { id: toastId });
      setIsEditing(false); 
      fetchLog(date); 
    } catch (error) { toast.error('Gagal menyimpan.', { id: toastId }); }
  };

  const handleChange = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));
  
  const handleCheckbox = (field: string, value: string) => {
    const current = formData[field] || [];
    if (current.includes(value)) handleChange(field, current.filter((item: string) => item !== value));
    else handleChange(field, [...current, value]);
  };

  // --- HELPER RENDER ---
  const currentProgress = Object.values(formData).filter(v => Array.isArray(v) ? v.length > 0 : !!v).length;
  const progressPercent = Math.min((currentProgress / 11) * 100, 100);
  
  const displayDateStr = new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Academic Info
  const getAcademicInfo = () => {
      const now = new Date();
      if (now.getMonth() >= 6) return { semester: 'Ganjil', academicYear: `${now.getFullYear()}/${now.getFullYear() + 1}` };
      return { semester: 'Genap', academicYear: `${now.getFullYear() - 1}/${now.getFullYear()}` };
  };
  const autoAcademic = getAcademicInfo();
  const academicYear = dashData?.academic_year || autoAcademic.academicYear;
  
  // Tampilkan Nama Lengkap (Tanpa Split)
  const fullName = studentData?.full_name || user?.full_name || user?.name || 'Siswa';

  // [FIX] Ambil Masa Studi dari state studentData yang sudah di-merge dengan API
  // Gunakan optional chaining (?.) untuk menghindari error jika null
  const userStartPeriod = studentData?.start_period || '-';
  const userEndPeriod = studentData?.end_period || 'Selesai';

  const renderPlanLabel = (field: string, _isArray = false) => {
    if (activeTab !== 'execution' || !apiData) return null;
    
    const planVal = apiData['plan_' + field];
    const isEmpty = Array.isArray(planVal) ? planVal.length === 0 : !planVal;

    if (isPastDate && isEmpty) {
        return <div className="mb-2 p-2 bg-gray-100 border-l-4 border-gray-300 rounded text-xs text-gray-500 italic">Rencana tidak diisi (Lupa).</div>;
    }

    if (isEmpty) return null;

    return (
        <div className="mb-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded text-xs text-yellow-800">
            <b>Rencana:</b> {Array.isArray(planVal) ? planVal.join(', ') : planVal}
        </div>
    );
  };

  // --- LOGIC DISABLED / LOCKED ---
  let isFormLocked = false;
  let statusMessage = "";
  let canEdit = true;

  // Cek jika sudah divalidasi guru/ortu (Simulasi batas waktu edit)
  if (apiData?.status === 'Disahkan' || apiData?.status === 'Disetujui') {
      canEdit = false; 
  }

  if (isAlumni) {
    isFormLocked = true;
    statusMessage = `🔒 ARSIP ALUMNI.`;
    canEdit = false;
  } 
  else if (activeTab === 'plan') {
      if (isPastDate) {
          isFormLocked = true;
          statusMessage = "⛔ Hari sudah berlalu. Rencana dikunci.";
          canEdit = false;
      } else if (isPlanSubmitted && !isEditing) {
          isFormLocked = true;
          statusMessage = "✅ Rencana tersimpan.";
      }
  } 
  else if (activeTab === 'execution') {
      if (!isPlanSubmitted && !isPastDate) {
          isFormLocked = true;
          statusMessage = "⚠️ Isi Rencana dulu.";
          canEdit = false;
      } else if (isExecutionSubmitted && !isEditing) {
          isFormLocked = true;
          statusMessage = "✅ Eksekusi tersimpan.";
      }
  }

  if (loading && !apiData) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
        
        {/* --- ALERT EMAIL PRIBADI --- */}
        <PersonalEmailAlert />

        {/* HEADER & INFO AKADEMIK */}
        <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight mb-1">
                        Halo, {fullName}! 👋
                    </h1>
                    <p className="text-gray-500 font-medium flex items-center gap-2 text-sm">
                        <CalendarDays size={16} className="text-violet-500"/> {displayDateStr}
                    </p>
                    
                    {/* [FIX] INFO MASA STUDI - Muncul jika datanya ada */}
                    {(userStartPeriod !== '-' || userEndPeriod !== 'Selesai') && (
                        <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                            <span>Masa Studi: {userStartPeriod} — {userEndPeriod}</span>
                        </div>
                    )}
                </div>

                {/* FILTER STATISTIK KEBIASAAN */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm self-start md:self-auto">
                    <Filter size={14} className="text-slate-400" />
                    <select 
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
                        value={statsFilter}
                        onChange={(e) => setStatsFilter(e.target.value as 'current' | 'all')}
                    >
                        <option value="current">Semester {dashData?.semester || 'Ganjil'} {academicYear}</option>
                        <option value="all">Semua Waktu (All Time)</option>
                    </select>
                </div>
            </div>

            {/* STATUS BANNER */}
            <div className={`mb-6 p-4 rounded-xl border-l-4 shadow-sm flex items-start gap-3 ${isAlumni ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-blue-50 border-blue-500 text-blue-800'}`}>
                <div className="mt-0.5">{isAlumni ? <GraduationCap size={20} /> : <CheckCircle2 size={20} />}</div>
                <div>
                    <h3 className="font-bold text-sm uppercase mb-1">{isAlumni ? 'Status: LULUS / ALUMNI' : 'Status: SISWA AKTIF'}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">
                        {isAlumni ? `Selamat! Anda telah lulus.` : `Kelas ${className} • TA ${academicYear}`}
                    </p>
                </div>
            </div>

            {/* STATS CARDS */}
            {!urlDate && dashData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* KELAS SAYA */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-blue-100 text-xs font-bold uppercase mb-1">Kelas Saya</p>
                            <p className="text-2xl font-black">{className}</p>
                            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">{academicYear}</span>
                        </div>
                        <BookOpen className="absolute right-[-10px] bottom-[-10px] text-white/20 w-20 h-20 group-hover:scale-110 transition-transform" />
                    </div>
                    {/* POIN SIKAP */}
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-orange-100 text-xs font-bold uppercase mb-1">Poin Sikap</p>
                            <p className="text-2xl font-black">{dashData.stats?.behaviorScore || 0}</p>
                        </div>
                        <Trophy className="absolute right-[-10px] bottom-[-10px] text-white/20 w-20 h-20 group-hover:scale-110 transition-transform" />
                    </div>
                    {/* JURNAL SELESAI */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-emerald-100 text-xs font-bold uppercase mb-1">Jurnal Selesai</p>
                            <p className="text-2xl font-black">{dashData.stats?.completedTasks || 0}</p>
                        </div>
                        <Archive className="absolute right-[-10px] bottom-[-10px] text-white/20 w-20 h-20 group-hover:scale-110 transition-transform" />
                    </div>
                    {/* MINGGU EFEKTIF */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-gray-400 text-xs font-bold uppercase mb-1">Minggu Efektif</p>
                            <p className="text-2xl font-black text-gray-800">Ke-4</p>
                        </div>
                        <Calendar className="absolute right-[-10px] bottom-[-10px] text-gray-100 w-20 h-20 group-hover:scale-110 transition-transform" />
                    </div>
                </div>
            )}
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-6">
            <button 
                onClick={() => !isPastDate && setActiveTab('plan')} 
                disabled={isPastDate}
                className={`flex-1 py-3 rounded-xl font-bold shadow-sm transition-all flex flex-col items-center justify-center 
                    ${activeTab === 'plan' ? 'bg-blue-600 text-white ring-2 ring-blue-300' : isPastDate ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
                <span className="text-sm">Rencana</span>
                {isPastDate && <span className="text-[9px] mt-1 opacity-70">(Terkunci)</span>}
            </button>
            <button 
                onClick={() => !isFutureDate && setActiveTab('execution')} 
                disabled={isFutureDate}
                className={`flex-1 py-3 rounded-xl font-bold shadow-sm transition-all flex flex-col items-center justify-center 
                    ${activeTab === 'execution' ? 'bg-green-600 text-white ring-2 ring-green-300' : isFutureDate ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
                <span className="text-sm">Eksekusi</span>
                {isFutureDate && <span className="text-[9px] mt-1 opacity-70">(Belum dibuka)</span>}
            </button>
        </div>

        {/* PROGRESS BAR & ALERT */}
        <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <BarChart3 size={18} className={activeTab === 'plan' ? 'text-blue-600' : 'text-green-600'} />
                    <span className="text-sm font-bold text-slate-700 capitalize">{activeTab === 'plan' ? 'Progress Rencana' : 'Progress Eksekusi'}</span>
                </div>
                <span className={`text-lg font-black ${activeTab === 'plan' ? 'text-blue-600' : 'text-green-600'}`}>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-700 ease-out ${activeTab === 'plan' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${progressPercent}%` }}></div>
            </div>
        </div>

        {isFormLocked && (
            <div className={`p-4 rounded-xl mb-6 text-center border-l-4 font-medium shadow-sm flex flex-col items-center gap-2 ${statusMessage.includes('✅') ? 'bg-green-50 border-green-500 text-green-800' : 'bg-yellow-50 border-yellow-500 text-yellow-800'}`}>
                <div className="flex items-center gap-2">
                    {statusMessage.includes('✅') ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                    {statusMessage}
                </div>
                {/* TOMBOL EDIT */}
                {canEdit && (isPlanSubmitted || isExecutionSubmitted) && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="mt-1 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        <Edit3 size={14}/> Edit Kembali
                    </button>
                )}
            </div>
        )}

        {/* --- FORM INPUT --- */}
        <fieldset disabled={isFormLocked} className={`space-y-6 transition-all duration-300 ${isFormLocked ? 'opacity-70 pointer-events-none' : ''}`}>
            
            {/* 1. BANGUN PAGI */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-400">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><span className="text-2xl">☀️</span> Bangun Pagi</h3>
                {renderPlanLabel('wake_up_time')}
                <div className="flex items-center gap-2">
                    <input type="time" value={formData.wake_up_time} onChange={(e) => handleChange('wake_up_time', e.target.value)} className="border p-2 rounded w-full max-w-xs outline-none focus:ring-2 focus:ring-orange-200"/>
                    <span className="font-bold text-gray-500">WIB</span>
                </div>
            </div>

            {/* 2. BERIBADAH (AUTO OPTIONS 5 WAKTU) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-400">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><span className="text-2xl">🙏</span> Beribadah</h3>
                {renderPlanLabel('worship_activities', true)}
                
                <div className="mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Wajib:</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {sholatOptions.map(opt => (
                            <label key={opt} className={`flex items-center justify-center p-2 rounded border cursor-pointer transition-all ${formData.worship_activities.includes(opt) ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold' : 'hover:bg-gray-50'}`}>
                                <input type="checkbox" className="hidden" checked={formData.worship_activities.includes(opt)} onChange={() => handleCheckbox('worship_activities', opt)}/>
                                <span className="text-sm">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div className="mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Sunnah / Lainnya:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {ibadahSunnah.map(opt => (
                            <label key={opt} className="flex items-center gap-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" className="rounded text-emerald-600" checked={formData.worship_activities.includes(opt)} onChange={() => handleCheckbox('worship_activities', opt)}/>
                                <span className="text-xs">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <textarea placeholder="Catatan ibadah (hafalan, dll)..." className="w-full border p-3 rounded-lg text-sm focus:ring-2 focus:ring-emerald-200 outline-none" rows={2} value={formData.worship_detail} onChange={(e) => handleChange('worship_detail', e.target.value)}/>
            </div>

            {/* 3. OLAHRAGA (MULTI SELECT + VARIASI) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-400">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><span className="text-2xl">🏃</span> Berolahraga</h3>
                {renderPlanLabel('sport_activities', true)}
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {sportOptionsList.map(opt => (
                        <label key={opt} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${formData.sport_activities.includes(opt) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>
                            <input type="checkbox" className="rounded text-blue-600" checked={formData.sport_activities.includes(opt)} onChange={() => handleCheckbox('sport_activities', opt)}/>
                            <span className="text-sm">{opt}</span>
                        </label>
                    ))}
                </div>
                <textarea placeholder="Detail olahraga (durasi, lokasi, dll)..." className="w-full border p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" rows={2} value={formData.sport_detail} onChange={(e) => handleChange('sport_detail', e.target.value)}/>
            </div>

            {/* 4. MAKAN SEHAT */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-400">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><span className="text-2xl">🥗</span> Makan Sehat</h3>
                {renderPlanLabel('meal_text')}
                <textarea placeholder="Menu sehat hari ini (Sayur, Buah, Lauk)..." className="w-full border p-3 rounded-lg text-sm focus:ring-2 focus:ring-green-200 outline-none" rows={2} value={formData.meal_text} onChange={(e) => handleChange('meal_text', e.target.value)}/>
            </div>

            {/* 5. BELAJAR */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-400">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><span className="text-2xl">📚</span> Gemar Belajar</h3>
                {renderPlanLabel('study_activities', true)}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    {learningOptionsList.map(opt => (
                        <label key={opt} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" className="rounded text-purple-600" checked={formData.study_activities.includes(opt)} onChange={() => handleCheckbox('study_activities', opt)}/>
                            <span className="text-xs">{opt}</span>
                        </label>
                    ))}
                </div>
                <textarea placeholder="Materi yang dipelajari..." className="w-full border p-3 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 outline-none" rows={2} value={formData.study_detail} onChange={(e) => handleChange('study_detail', e.target.value)}/>
            </div>

            {/* 6. BERMASYARAKAT */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-teal-400">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><span className="text-2xl">🌍</span> Bermasyarakat</h3>
                {renderPlanLabel('social_activities', true)}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    {socialOptionsList.map(opt => (
                        <label key={opt} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" className="rounded text-teal-600" checked={formData.social_activities.includes(opt)} onChange={() => handleCheckbox('social_activities', opt)}/>
                            <span className="text-xs">{opt}</span>
                        </label>
                    ))}
                </div>
                <textarea placeholder="Ceritakan kebaikan hari ini..." className="w-full border p-3 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 outline-none" rows={2} value={formData.social_detail} onChange={(e) => handleChange('social_detail', e.target.value)}/>
            </div>

            {/* 7. TIDUR CEPAT */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-400">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><span className="text-2xl">🌙</span> Tidur Cepat</h3>
                {renderPlanLabel('sleep_time')}
                <div className="flex items-center gap-2">
                    <input type="time" value={formData.sleep_time} onChange={(e) => handleChange('sleep_time', e.target.value)} className="border p-2 rounded w-full max-w-xs outline-none focus:ring-2 focus:ring-indigo-200"/>
                    <span className="font-bold text-gray-500">WIB</span>
                </div>
            </div>
        </fieldset>

        {/* SAVE BUTTON */}
        {!isFormLocked && (
            <div className="mt-8 flex justify-end sticky bottom-4 z-20">
                <button onClick={handleSave} className="px-8 py-4 rounded-2xl font-black text-white shadow-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-105 transition-all flex items-center gap-2">
                    <Save size={20} /> {isEditing ? 'Update Perubahan' : 'Simpan Jurnal'}
                </button>
            </div>
        )}
    </div>
  );
};

export default StudentDashboard;