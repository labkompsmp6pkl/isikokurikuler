import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import toast from 'react-hot-toast'; 
import { useAuth } from '../../services/authService';
import characterService from '../../services/characterService';
import Spinner from './student/components/Spinner';
import { 
  worshipOptions, 
  exerciseOptions, 
  learningOptions, 
  socialOptions 
} from './student/components/options';
import { Trophy, BarChart3, CalendarClock, Archive, GraduationCap } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  // State untuk data siswa (digabung dari user auth + data terbaru dari DB)
  const [studentData, setStudentData] = useState<any>(user || {});
  
  const [searchParams] = useSearchParams();
  const urlDate = searchParams.get('date');

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [activeTab, setActiveTab] = useState<'plan' | 'execution'>('plan');
  const [date, setDate] = useState(urlDate || getLocalDateString()); 
  const isFutureDate = date > getLocalDateString();

  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [dashData, setDashData] = useState<any>(null);

  // Cek Role Alumni
  const isAlumni = studentData?.role === 'alumni';

  const [formData, setFormData] = useState<any>({
    wake_up_time: '',
    worship_activities: [],
    worship_detail: '',
    sport_activities: '',
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

  // --- HITUNG PROGRESS ---
  const calculateProgress = () => {
    let count = 0;
    if (formData.wake_up_time) count++;
    if ((formData.worship_activities && formData.worship_activities.length > 0) || formData.worship_detail) count++;
    if (formData.sport_activities || formData.sport_detail) count++;
    if (formData.meal_text) count++;
    if ((formData.study_activities && formData.study_activities.length > 0) || formData.study_detail) count++;
    if ((formData.social_activities && formData.social_activities.length > 0) || formData.social_detail) count++;
    if (formData.sleep_time) count++;
    return count;
  };

  const currentProgress = calculateProgress();
  const progressPercent = (currentProgress / 7) * 100;

  // --- EFFECTS ---
  useEffect(() => {
    const targetDate = urlDate || getLocalDateString();
    setDate(targetDate); 
    fetchLog(targetDate);
    fetchDashboardData();
  }, [urlDate]); 

  useEffect(() => {
    if (isFutureDate) setActiveTab('plan');
  }, [isFutureDate]);

  useEffect(() => {
    if (!apiData) { resetForm(); return; }
    
    // Mapping Data API -> Form
    const sourceData = activeTab === 'plan' ? {
      wake_up_time: apiData.plan_wake_up_time,
      worship_activities: apiData.plan_worship_activities,
      worship_detail: apiData.plan_worship_detail,
      sport_activities: apiData.plan_sport_activities,
      sport_detail: apiData.plan_sport_detail,
      meal_text: apiData.plan_meal_text,
      study_activities: apiData.plan_study_activities,
      study_detail: apiData.plan_study_detail,
      social_activities: apiData.plan_social_activities,
      social_detail: apiData.plan_social_detail,
      sleep_time: apiData.plan_sleep_time,
    } : {
      wake_up_time: apiData.wake_up_time,
      worship_activities: apiData.worship_activities,
      worship_detail: apiData.worship_detail,
      sport_activities: apiData.sport_activities,
      sport_detail: apiData.sport_detail,
      meal_text: apiData.meal_text,
      study_activities: apiData.study_activities,
      study_detail: apiData.study_detail,
      social_activities: apiData.social_activities,
      social_detail: apiData.social_detail,
      sleep_time: apiData.sleep_time,
    };

    setFormData({
      wake_up_time: sourceData.wake_up_time || '',
      worship_activities: parseJsonIfNeeded(sourceData.worship_activities),
      worship_detail: sourceData.worship_detail || '',
      sport_activities: sourceData.sport_activities || '',
      sport_detail: sourceData.sport_detail || '',
      meal_text: sourceData.meal_text || '',
      study_activities: parseJsonIfNeeded(sourceData.study_activities),
      study_detail: sourceData.study_detail || '',
      social_activities: parseJsonIfNeeded(sourceData.social_activities),
      social_detail: sourceData.social_detail || '',
      sleep_time: sourceData.sleep_time || '',
    });

  }, [activeTab, apiData]);

  // --- API CALLS ---
  const fetchLog = async (currentDate: string) => {
    setLoading(true);
    try {
      const data = await characterService.getLogByDate(currentDate);
      setApiData(data);
      if (data) {
        setIsPlanSubmitted(!!data.is_plan_submitted);
        setIsExecutionSubmitted(!!data.is_execution_submitted);
        
        // Auto-switch tab logic
        if (currentDate > getLocalDateString()) {
             setActiveTab('plan');
        } else if (data.is_plan_submitted && !data.is_execution_submitted) {
            setActiveTab('execution');
        } else {
            setActiveTab('plan'); 
        }
      } else {
        setIsPlanSubmitted(false);
        setIsExecutionSubmitted(false);
        setActiveTab('plan');
      }
    } catch (error) {
      console.error("Gagal mengambil data log:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
      try {
          const data = await characterService.getStudentDashboard();
          if (data) {
            setDashData(data);
            // Update data siswa (termasuk graduation_year & last_class_name)
            if (data.student) setStudentData(data.student);
          }
      } catch (error) { console.error(error); }
  };

  // --- HELPERS ---
  const parseJsonIfNeeded = (data: any) => {
      if (Array.isArray(data)) return data;
      if (typeof data === 'string') { try { return JSON.parse(data); } catch { return []; } }
      return [];
  };

  const resetForm = () => {
    setFormData({
      wake_up_time: '',
      worship_activities: [],
      worship_detail: '',
      sport_activities: '',
      sport_detail: '',
      meal_text: '',
      study_activities: [],
      study_detail: '',
      social_activities: [],
      social_detail: '',
      sleep_time: '',
    });
  };

  const handleSave = async () => {
    // Proteksi di Frontend
    if (isAlumni) {
        toast.error("Alumni tidak dapat mengubah data (Arsip).");
        return;
    }

    const toastId = 'save-journal'; 
    if (activeTab === 'execution' && !isPlanSubmitted) {
        toast.error('Isi Rencana terlebih dahulu!', { id: toastId });
        return;
    }

    const payload: any = { log_date: date, mode: activeTab };
    
    // Mapping field sesuai tab
    // Manual mapping untuk memastikan nama field sesuai API backend
    if (activeTab === 'plan') {
        payload.plan_wake_up_time = formData.wake_up_time;
        payload.plan_worship_activities = formData.worship_activities;
        payload.plan_worship_detail = formData.worship_detail;
        payload.plan_sport_activities = formData.sport_activities;
        payload.plan_sport_detail = formData.sport_detail;
        payload.plan_meal_text = formData.meal_text;
        payload.plan_study_activities = formData.study_activities;
        payload.plan_study_detail = formData.study_detail;
        payload.plan_social_activities = formData.social_activities;
        payload.plan_social_detail = formData.social_detail;
        payload.plan_sleep_time = formData.sleep_time;
    } else {
        payload.wake_up_time = formData.wake_up_time;
        payload.worship_activities = formData.worship_activities;
        payload.worship_detail = formData.worship_detail;
        payload.sport_activities = formData.sport_activities;
        payload.sport_detail = formData.sport_detail;
        payload.meal_text = formData.meal_text;
        payload.study_activities = formData.study_activities;
        payload.study_detail = formData.study_detail;
        payload.social_activities = formData.social_activities;
        payload.social_detail = formData.social_detail;
        payload.sleep_time = formData.sleep_time;
    }

    try {
      toast.loading('Menyimpan data...', { id: toastId });
      await characterService.saveCharacterLog(payload);
      const typeText = activeTab === 'plan' ? 'Rencana' : 'Eksekusi';
      toast.success(`Data ${typeText} berhasil disimpan!`, { id: toastId });
      fetchLog(date); 
    } catch (error) {
      toast.error('Gagal menyimpan data.', { id: toastId });
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCheckbox = (field: string, value: string) => {
    const current = formData[field] || [];
    if (current.includes(value)) {
      handleChange(field, current.filter((item: string) => item !== value));
    } else {
      handleChange(field, [...current, value]);
    }
  };

  // --- RENDER HELPERS ---
  const renderPlanLabel = (field: string, isArray = false) => {
    if (activeTab !== 'execution') return null;
    if (!apiData) return <span className="text-gray-400 text-xs italic ml-2">(Rencana kosong)</span>;
    const planKey = 'plan_' + field;
    let val = apiData[planKey];
    if (isArray && Array.isArray(val)) val = val.join(', ');
    return (
      <div className="mb-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded text-sm text-yellow-800 flex flex-col justify-start">
        <span className="text-xs font-bold uppercase text-yellow-600">📝 Rencana kamu:</span>
        <span className="font-bold text-gray-800 mt-1">{val || '-'}</span>
      </div>
    );
  };

  // --- LOGIC TAMPILAN (DISABLED/LOCKED) ---
  let isFormDisabled = false;
  let disabledMessage = "";

  if (isAlumni) {
    isFormDisabled = true;
    disabledMessage = `🔒 ARSIP ALUMNI ${studentData?.graduation_year || ''}. Data ko-kurikuler telah dibekukan.`;
  } else if (activeTab === 'plan') {
    if (isPlanSubmitted) {
      isFormDisabled = true;
      disabledMessage = "✅ Laporan Rencana hari ini sudah disimpan.";
    }
  } else { 
    if (!isPlanSubmitted) {
      isFormDisabled = true;
      disabledMessage = "⚠️ Silakan isi laporan Rencana terlebih dahulu.";
    } else if (isExecutionSubmitted) {
      isFormDisabled = true;
      disabledMessage = "✅ Laporan Eksekusi hari ini sudah disimpan.";
    }
  }

  const displayDateObj = new Date(date);
  const displayDateStr = displayDateObj.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      
      {/* HEADER UTAMA */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                    {isAlumni && <Archive size={24} className="text-blue-500" />}
                    {isAlumni ? 'Arsip Jurnal' : (urlDate ? `Jurnal Tanggal ${urlDate}` : 'Input Karakter Harian')}
                </h2>
                <div className="text-sm text-gray-500 flex flex-col gap-1">
                    {isAlumni ? (
                        <div className="flex items-center gap-2 mt-1">
                           {/* Badge Alumni (Biru Tua/Elegan) */}
                           <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                               <GraduationCap size={14} /> Alumni {studentData?.graduation_year || '-'}
                           </span>
                           <span className="text-blue-600 text-xs border border-blue-200 bg-blue-50 px-2 py-0.5 rounded">
                               Asal: {studentData?.last_class_name || 'Tidak ada data kelas'}
                           </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                                Kelas: {studentData?.class || '-'}
                            </span>
                            {isFutureDate && (
                                <span className="text-indigo-600 font-bold flex items-center gap-1 text-xs">
                                    <CalendarClock size={12} /> Mode Rencana
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                isFutureDate 
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                  : 'bg-blue-50 border-blue-100 text-gray-600'
            }`}>
                <span className="text-xl">📅</span>
                <span className="font-bold text-lg">{displayDateStr}</span>
            </div>
        </div>
      </div>

      {/* STATS CARD */}
      {!urlDate && dashData && (
          <div className="mb-8 space-y-4">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-lg flex items-center justify-between">
                  <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-100">
                          Total Poin Sikap {isAlumni ? '(Final)' : ''}
                      </p>
                      <h3 className="text-4xl font-black mt-1">{dashData.stats.behaviorScore}</h3>
                  </div>
                  <Trophy size={48} className="text-orange-200 opacity-50"/>
              </div>
          </div>
      )}
      
      {/* TABS & PROGRESS */}
      <div className="flex gap-4 mb-6 relative">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-sm ${
            activeTab === 'plan' 
              ? 'bg-blue-600 text-white scale-105 shadow-lg'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Rencana {isPlanSubmitted ? '✅' : '○'}
        </button>
        
        <button
          onClick={() => !isFutureDate && setActiveTab('execution')}
          disabled={isFutureDate}
          className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
            activeTab === 'execution' 
              ? 'bg-green-600 text-white scale-105 shadow-lg'
              : isFutureDate 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {isFutureDate && <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-500">Terkunci</span>}
          Eksekusi {isExecutionSubmitted ? '✅' : '○'}
        </button>
      </div>

      <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                  <BarChart3 size={18} className={activeTab === 'plan' ? 'text-blue-600' : 'text-green-600'} />
                  <span className="text-sm font-bold text-slate-700 capitalize">
                      {activeTab === 'plan' ? 'Progress Rencana' : 'Progress Eksekusi'}
                  </span>
              </div>
              <span className={`text-lg font-black ${activeTab === 'plan' ? 'text-blue-600' : 'text-green-600'}`}>
                  {currentProgress}/7
              </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                  className={`h-3 rounded-full transition-all duration-700 ease-out ${activeTab === 'plan' ? 'bg-blue-500' : 'bg-green-500'}`}
                  style={{ width: `${progressPercent}%` }}
              ></div>
          </div>
      </div>

      {/* ALERT MESSAGE */}
      {isFormDisabled && (
        <div className={`p-4 rounded-xl mb-6 text-center border-l-4 font-medium shadow-sm flex items-center justify-center gap-2 ${
          isAlumni 
            ? 'bg-blue-50 border-blue-400 text-blue-800' // Alert Alumni (Tetap Biru)
            : disabledMessage.includes('✅') 
                ? 'bg-green-100 border-green-500 text-green-800' 
                : 'bg-yellow-100 border-yellow-500 text-yellow-800'
        }`}>
          {isAlumni ? <Archive size={18} /> : null}
          {disabledMessage}
        </div>
      )}

      {/* FORM AREA */}
      {/* Warna tetap cerah (tidak grayscale), hanya opacity sedikit turun jika disabled */}
      <fieldset disabled={isFormDisabled} className={`space-y-6 transition-all duration-300 ${isFormDisabled ? 'opacity-90' : ''}`}>
        
        {/* 1. Bangun Pagi */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-400">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">☀️</span>
            <h3 className="text-xl font-bold text-gray-800">Bangun Pagi</h3>
          </div>
          {renderPlanLabel('wake_up_time')}
          <div className="flex items-center gap-2">
            <input 
              type="time" 
              value={formData.wake_up_time}
              onChange={(e) => handleChange('wake_up_time', e.target.value)}
              className="border p-2 rounded-lg w-full max-w-xs focus:ring-2 focus:ring-orange-200 outline-none disabled:bg-gray-50"
            />
            <span className="font-bold text-gray-500">WIB</span>
          </div>
        </div>

        {/* 2. Beribadah */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-400">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🙏</span>
            <h3 className="text-xl font-bold text-gray-800">Beribadah</h3>
          </div>
          {renderPlanLabel('worship_activities', true)}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {worshipOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.worship_activities.includes(opt.value)}
                  onChange={() => handleCheckbox('worship_activities', opt.value)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 disabled:bg-gray-100"
                />
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          <textarea placeholder="Contoh: Hafalan surat pendek..." className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none text-sm disabled:bg-gray-50" rows={2} value={formData.worship_detail} onChange={(e) => handleChange('worship_detail', e.target.value)}/>
        </div>

        {/* 3. Olahraga */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-400">
          <div className="flex items-center gap-3 mb-4"><span className="text-3xl">🏃</span><h3 className="text-xl font-bold text-gray-800">Berolahraga</h3></div>
          {renderPlanLabel('sport_activities')}
          <select className="w-full border p-3 rounded-lg mb-3 focus:ring-2 focus:ring-blue-200 outline-none bg-white disabled:bg-gray-50" value={formData.sport_activities} onChange={(e) => handleChange('sport_activities', e.target.value)}>
            <option value="">Pilih Olahraga (Opsional)...</option>
            {exerciseOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          <textarea placeholder="Contoh: Lari 30 menit..." className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm disabled:bg-gray-50" rows={2} value={formData.sport_detail} onChange={(e) => handleChange('sport_detail', e.target.value)}/>
        </div>

        {/* 4. Makan Sehat */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-400">
          <div className="flex items-center gap-3 mb-4"><span className="text-3xl">🥗</span><h3 className="text-xl font-bold text-gray-800">Makan Sehat</h3></div>
          {renderPlanLabel('meal_text')}
          <textarea placeholder="Apa menu sehatmu hari ini?" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-200 outline-none text-sm disabled:bg-gray-50" rows={2} value={formData.meal_text} onChange={(e) => handleChange('meal_text', e.target.value)}/>
        </div>

        {/* 5. Belajar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-400">
          <div className="flex items-center gap-3 mb-4"><span className="text-3xl">📚</span><h3 className="text-xl font-bold text-gray-800">Gemar Belajar</h3></div>
          {renderPlanLabel('study_activities', true)}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {learningOptions.map(opt => (<label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"><input type="checkbox" checked={formData.study_activities.includes(opt.value)} onChange={() => handleCheckbox('study_activities', opt.value)} className="rounded text-purple-600 focus:ring-purple-500 w-5 h-5 disabled:bg-gray-100"/><span className="text-sm font-medium text-gray-700">{opt.label}</span></label>))}
          </div>
          <textarea placeholder="Apa hal baru yang kamu pelajari hari ini?" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm disabled:bg-gray-50" rows={2} value={formData.study_detail} onChange={(e) => handleChange('study_detail', e.target.value)}/>
        </div>

        {/* 6. Bermasyarakat */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-teal-400">
          <div className="flex items-center gap-3 mb-4"><span className="text-3xl">🌍</span><h3 className="text-xl font-bold text-gray-800">Bermasyarakat</h3></div>
          {renderPlanLabel('social_activities', true)}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {socialOptions.map(opt => (<label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"><input type="checkbox" checked={formData.social_activities.includes(opt.value)} onChange={() => handleCheckbox('social_activities', opt.value)} className="rounded text-teal-600 focus:ring-teal-500 w-5 h-5 disabled:bg-gray-100"/><span className="text-sm font-medium text-gray-700">{opt.label}</span></label>))}
          </div>
          <textarea placeholder="Ceritakan kebaikan yang kamu lakukan..." className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-teal-200 outline-none text-sm disabled:bg-gray-50" rows={2} value={formData.social_detail} onChange={(e) => handleChange('social_detail', e.target.value)}/>
        </div>

        {/* 7. Tidur Cepat */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-400">
          <div className="flex items-center gap-3 mb-4"><span className="text-3xl">🌙</span><h3 className="text-xl font-bold text-gray-800">Tidur Cepat</h3></div>
          {renderPlanLabel('sleep_time')}
          <div className="flex items-center gap-2"><input type="time" value={formData.sleep_time} onChange={(e) => handleChange('sleep_time', e.target.value)} className="border p-2 rounded-lg w-full max-w-xs focus:ring-2 focus:ring-indigo-200 outline-none disabled:bg-gray-50"/><span className="font-bold text-gray-500">WIB</span></div>
        </div>

      </fieldset>

      {/* SAVE BUTTON */}
      {!isFormDisabled && !isAlumni && (
        <div className="mt-8 flex justify-end">
            <button 
                onClick={handleSave}
                className="px-8 py-4 rounded-2xl font-black text-white shadow-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-105 transition-all"
            >
                <span>💾</span> Simpan
            </button>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;