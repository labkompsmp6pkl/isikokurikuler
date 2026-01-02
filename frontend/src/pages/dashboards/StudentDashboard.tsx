import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../../services/authService';
import characterService from '../../services/characterService';
import Spinner from './student/components/Spinner';
import { 
  worshipOptions, 
  exerciseOptions, 
  learningOptions, 
  socialOptions 
} from './student/components/options';
import { Star, CheckCircle2, Trophy, CalendarDays } from 'lucide-react'; // Icon Baru

const StudentDashboard: React.FC = () => {
  useAuth();
  
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State Lama
  const [activeTab, setActiveTab] = useState<'plan' | 'execution'>('plan');
  const [date, setDate] = useState(getLocalDateString()); 
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  
  // State Baru (Dashboard & Misi)
  const [dashData, setDashData] = useState<any>(null);

  // Form State (Tetap)
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

  useEffect(() => {
    const today = getLocalDateString();
    setDate(today); 
    fetchLog(today);
    fetchDashboardData(); // Ambil Misi & Poin
  }, []);

  const fetchLog = async (currentDate: string) => {
    setLoading(true);
    try {
      const data = await characterService.getLogByDate(currentDate);
      setApiData(data);
      if (data) {
        setIsPlanSubmitted(!!data.is_plan_submitted);
        setIsExecutionSubmitted(!!data.is_execution_submitted);
        if (data.is_plan_submitted && !data.is_execution_submitted) {
            setActiveTab('execution');
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

  // [BARU] Ambil Data Misi & Poin
  const fetchDashboardData = async () => {
      try {
          const data = await characterService.getStudentDashboard();
          if (data) setDashData(data);
      } catch (error) { console.error(error); }
  };

  // [BARU] Handler Selesaikan Misi
  const handleCompleteMission = async (missionId: number) => {
      const success = await characterService.completeMission(missionId);
      if (success) {
          Swal.fire('Kerja Bagus!', 'Misi berhasil diselesaikan.', 'success');
          fetchDashboardData(); // Refresh agar misi hilang dari list
      }
  };

  // ... (SISA KODE FORM LOGIC LAMA TETAP SAMA) ...
  useEffect(() => {
    if (!apiData) { resetForm(); return; }
    if (activeTab === 'plan') {
      setFormData({
        wake_up_time: apiData.plan_wake_up_time || '',
        worship_activities: parseJsonIfNeeded(apiData.plan_worship_activities),
        worship_detail: apiData.plan_worship_detail || '',
        sport_activities: apiData.plan_sport_activities || '',
        sport_detail: apiData.plan_sport_detail || '',
        meal_text: apiData.plan_meal_text || '',
        study_activities: parseJsonIfNeeded(apiData.plan_study_activities),
        study_detail: apiData.plan_study_detail || '',
        social_activities: parseJsonIfNeeded(apiData.plan_social_activities),
        social_detail: apiData.plan_social_detail || '',
        sleep_time: apiData.plan_sleep_time || '',
      });
    } else {
      setFormData({
        wake_up_time: apiData.wake_up_time || '',
        worship_activities: parseJsonIfNeeded(apiData.worship_activities),
        worship_detail: apiData.worship_detail || '',
        sport_activities: apiData.sport_activities || '',
        sport_detail: apiData.sport_detail || '',
        meal_text: apiData.meal_text || '',
        study_activities: parseJsonIfNeeded(apiData.study_activities),
        study_detail: apiData.study_detail || '',
        social_activities: parseJsonIfNeeded(apiData.social_activities),
        social_detail: apiData.social_detail || '',
        sleep_time: apiData.sleep_time || '',
      });
    }
  }, [activeTab, apiData]);

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
    if (activeTab === 'execution' && !isPlanSubmitted) {
        Swal.fire('Gagal', 'Anda harus mengisi Rencana terlebih dahulu!', 'error');
        return;
    }
    const payload: any = { log_date: date, mode: activeTab };
    // Mapping field sesuai mode (Plan vs Execution)
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
      await characterService.saveCharacterLog(payload);
      Swal.fire('Sukses', `Data ${activeTab === 'plan' ? 'Rencana' : 'Eksekusi'} berhasil disimpan!`, 'success');
      fetchLog(date); 
    } catch (error) {
      Swal.fire('Error', 'Gagal menyimpan data', 'error');
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

  const renderPlanLabel = (field: string, isArray = false) => {
    if (activeTab !== 'execution') return null;
    if (!apiData) return <span className="text-red-500 text-xs italic ml-2">⚠️ Rencana belum diisi!</span>;
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

  let isFormDisabled = false;
  let disabledMessage = "";
  if (activeTab === 'plan') {
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

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      
      {/* Header & Info Tanggal */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Input Karakter Harian</h2>
        <div className="flex items-center gap-2 text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
          <span className="text-xl">📅</span>
          <span className="font-bold text-lg">{formattedDate}</span>
        </div>
      </div>

      {/* --- FITUR KREASI: MISI & STATISTIK --- */}
      {dashData && (
          <div className="mb-8 space-y-4">
              {/* Statistik Poin */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-lg flex items-center justify-between">
                  <div>
                      <p className="text-xs font-bold text-orange-100 uppercase tracking-wider">Total Poin Sikap</p>
                      <h3 className="text-4xl font-black mt-1">{dashData.stats.behaviorScore}</h3>
                  </div>
                  <Trophy size={48} className="text-orange-200 opacity-50"/>
              </div>

              {/* Daftar Misi */}
              {dashData.missions.length > 0 ? (
                  <div className="bg-white border-2 border-orange-100 rounded-2xl p-5 shadow-sm">
                      <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
                          <Star className="text-orange-500" fill="currentColor"/> Misi & Tantangan
                      </h3>
                      <div className="space-y-3">
                          {dashData.missions.map((m: any) => (
                              <div key={m.id} className="p-4 bg-orange-50 rounded-xl border border-orange-200 flex justify-between items-center gap-4">
                                  <div>
                                      <span className="text-[10px] font-bold bg-white text-orange-600 px-2 py-0.5 rounded border border-orange-100 mb-1 inline-block">
                                          {m.habit_category} • {m.contributor_name}
                                      </span>
                                      <h4 className="font-bold text-gray-800 text-sm">{m.title}</h4>
                                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                          <CalendarDays size={12}/> Deadline: {new Date(m.due_date).toLocaleDateString('id-ID')}
                                      </div>
                                  </div>
                                  <button 
                                      onClick={() => handleCompleteMission(m.id)}
                                      className="shrink-0 bg-white text-orange-600 p-2 rounded-full border-2 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
                                      title="Tandai Selesai"
                                  >
                                      <CheckCircle2 size={20}/>
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm">
                      Belum ada misi aktif saat ini.
                  </div>
              )}
          </div>
      )}
      {/* --------------------------------------- */}

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-sm ${
            activeTab === 'plan' 
              ? 'bg-blue-600 text-white shadow-lg scale-105' 
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Rencana {isPlanSubmitted ? '✅' : '○'}
        </button>
        <button
          onClick={() => setActiveTab('execution')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-sm ${
            activeTab === 'execution' 
              ? 'bg-green-600 text-white shadow-lg scale-105' 
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Eksekusi {isExecutionSubmitted ? '✅' : '○'}
        </button>
      </div>

      {/* Pesan Status Disabled */}
      {isFormDisabled && (
        <div className={`p-4 rounded-xl mb-6 text-center border-l-4 font-medium shadow-sm animate-pulse ${
          disabledMessage.includes('✅') 
            ? 'bg-green-100 border-green-500 text-green-800' 
            : 'bg-yellow-100 border-yellow-500 text-yellow-800'
        }`}>
          {disabledMessage}
        </div>
      )}

      {/* FORM CONTENT (SAMA SEPERTI SEBELUMNYA) */}
      <fieldset disabled={isFormDisabled} className={`space-y-6 ${isFormDisabled ? 'opacity-70 grayscale-[0.5]' : ''}`}>
        
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
              className="border p-2 rounded-lg w-full max-w-xs focus:ring-2 focus:ring-orange-200 outline-none disabled:bg-gray-100"
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
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 disabled:bg-gray-200"
                />
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          <textarea placeholder="Contoh: Hafalan surat pendek..." className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none text-sm disabled:bg-gray-100" rows={2} value={formData.worship_detail} onChange={(e) => handleChange('worship_detail', e.target.value)}/>
        </div>

        {/* 3. Olahraga */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-400">
          <div className="flex items-center gap-3 mb-4"><span className="text-3xl">🏃</span><h3 className="text-xl font-bold text-gray-800">Berolahraga</h3></div>
          {renderPlanLabel('sport_activities')}
          <select className="w-full border p-3 rounded-lg mb-3 focus:ring-2 focus:ring-blue-200 outline-none bg-white disabled:bg-gray-100" value={formData.sport_activities} onChange={(e) => handleChange('sport_activities', e.target.value)}>
            <option value="">Pilih Olahraga...</option>
            {exerciseOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          <textarea placeholder="Contoh: Lari 30 menit..." className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm disabled:bg-gray-100" rows={2} value={formData.sport_detail} onChange={(e) => handleChange('sport_detail', e.target.value)}/>
        </div>

        {/* 4. Makan Sehat */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-400">
          <div className="flex items-center gap-3 mb-4"><span className="text-3xl">🥗</span><h3 className="text-xl font-bold text-gray-800">Makan Sehat</h3></div>
          {renderPlanLabel('meal_text')}
          <textarea placeholder="Apa menu sehatmu hari ini?" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-200 outline-none text-sm disabled:bg-gray-100" rows={2} value={formData.meal_text} onChange={(e) => handleChange('meal_text', e.target.value)}/>
        </div>

        {/* 5. Belajar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-400">
          <div className="flex items-center gap-3 mb-4"><span className="text-3xl">📚</span><h3 className="text-xl font-bold text-gray-800">Gemar Belajar</h3></div>
          {renderPlanLabel('study_activities', true)}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {learningOptions.map(opt => (<label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"><input type="checkbox" checked={formData.study_activities.includes(opt.value)} onChange={() => handleCheckbox('study_activities', opt.value)} className="rounded text-purple-600 focus:ring-purple-500 w-5 h-5 disabled:bg-gray-200"/><span className="text-sm font-medium text-gray-700">{opt.label}</span></label>))}
          </div>
          <textarea placeholder="Apa hal baru yang kamu pelajari hari ini?" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm disabled:bg-gray-100" rows={2} value={formData.study_detail} onChange={(e) => handleChange('study_detail', e.target.value)}/>
        </div>

        {/* 6. Bermasyarakat */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-teal-400">
          <div className="flex items-center gap-3 mb-4"><span className="text-3xl">🌍</span><h3 className="text-xl font-bold text-gray-800">Bermasyarakat</h3></div>
          {renderPlanLabel('social_activities', true)}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {socialOptions.map(opt => (<label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"><input type="checkbox" checked={formData.social_activities.includes(opt.value)} onChange={() => handleCheckbox('social_activities', opt.value)} className="rounded text-teal-600 focus:ring-teal-500 w-5 h-5 disabled:bg-gray-200"/><span className="text-sm font-medium text-gray-700">{opt.label}</span></label>))}
          </div>
          <textarea placeholder="Ceritakan kebaikan yang kamu lakukan..." className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-teal-200 outline-none text-sm disabled:bg-gray-100" rows={2} value={formData.social_detail} onChange={(e) => handleChange('social_detail', e.target.value)}/>
        </div>

        {/* 7. Tidur Cepat */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-400">
          <div className="flex items-center gap-3 mb-4"><span className="text-3xl">🌙</span><h3 className="text-xl font-bold text-gray-800">Tidur Cepat</h3></div>
          {renderPlanLabel('sleep_time')}
          <div className="flex items-center gap-2"><input type="time" value={formData.sleep_time} onChange={(e) => handleChange('sleep_time', e.target.value)} className="border p-2 rounded-lg w-full max-w-xs focus:ring-2 focus:ring-indigo-200 outline-none disabled:bg-gray-100"/><span className="font-bold text-gray-500">WIB</span></div>
        </div>

      </fieldset>

      {/* Save Button */}
      {!isFormDisabled && (
        <div className="mt-8 flex justify-end">
            <button 
            onClick={handleSave}
            className={`px-8 py-4 rounded-2xl font-black text-white shadow-xl transform transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
                activeTab === 'plan' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600' 
                : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
            }`}
            >
            <span>💾</span> Simpan {activeTab === 'plan' ? 'Rencana' : 'Eksekusi'}
            </button>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;