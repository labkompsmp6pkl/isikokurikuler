import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../../services/authService';
import characterService from '../../services/characterService';
import Spinner from './student/components/Spinner';

// Import Options
import { 
  worshipOptions, 
  exerciseOptions, 
  learningOptions, 
  socialOptions 
} from './student/components/options';

const StudentDashboard: React.FC = () => {
  useAuth();
  
  // State Utama
  const [activeTab, setActiveTab] = useState<'plan' | 'execution'>('plan');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  
  // State Data Mentah dari API (untuk mencegah fetch berulang/glitch)
  const [apiData, setApiData] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    wake_up_time: '',
    worship_activities: [],
    worship_detail: '', // NEW
    sport_activities: '',
    sport_detail: '',
    meal_text: '',
    study_activities: [],
    study_detail: '', // NEW
    social_activities: [],
    social_detail: '', // NEW
    sleep_time: '',
  });

  // Status Submission
  const [isPlanSubmitted, setIsPlanSubmitted] = useState(false);
  const [isExecutionSubmitted, setIsExecutionSubmitted] = useState(false);

  // 1. Fetch Data saat tanggal berubah
  useEffect(() => {
    fetchLog();
  }, [date]);

  const fetchLog = async () => {
    setLoading(true);
    try {
      const data = await characterService.getLogByDate(date);
      setApiData(data); // Simpan data mentah
      
      if (data) {
        setIsPlanSubmitted(!!data.is_plan_submitted);
        setIsExecutionSubmitted(!!data.is_execution_submitted);
      } else {
        setIsPlanSubmitted(false);
        setIsExecutionSubmitted(false);
      }
    } catch (error) {
      console.error("Gagal mengambil data log:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Update Form saat Tab berubah atau ApiData berubah (Tanpa Fetch Ulang)
  useEffect(() => {
    if (!apiData) {
      resetForm();
      return;
    }

    if (activeTab === 'plan') {
      // Load Data Rencana
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
      // Load Data Eksekusi
      // Jika belum submit eksekusi, biarkan kosong atau copy dari plan (sesuai preferensi)
      // Di sini kita load apa adanya dari DB, kalau null ya kosong.
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
      if (typeof data === 'string') {
          try { return JSON.parse(data); } catch { return []; }
      }
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

    // Mapping payload agar sesuai dengan backend yang baru
    // Kita kirim dua set key tergantung mode, tapi controller handle mappingnya
    // Untuk simplifikasi, kita kirim data form ke field yang sesuai mode
    const payload: any = {
        log_date: date,
        mode: activeTab,
    };

    // Mapping dinamis ke field Plan atau Execution
    if (activeTab === 'plan') {
        payload.plan_wake_up_time = formData.wake_up_time;
        payload.plan_worship_activities = formData.worship_activities;
        payload.plan_worship_detail = formData.worship_detail;
        payload.plan_sport_activities = formData.sport_activities;
        payload.plan_sport_detail = formData.sport_detail; // Opsional di plan
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
      fetchLog(); // Refresh data dari server
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

  // Render Label Rencana (Hanya muncul di Tab Eksekusi)
  const renderPlanLabel = (field: string, isArray = false) => {
    if (activeTab !== 'execution') return null;
    if (!apiData) return <span className="text-red-500 text-xs italic ml-2">⚠️ Rencana belum diisi!</span>;
    
    // Mapping nama field form ke nama field database PLAN
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

  const isLocked = activeTab === 'execution' && !isPlanSubmitted;

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      
      {/* Header & Date Picker */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Input Karakter</h2>
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-600">Tanggal:</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

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

      {/* Status Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex justify-between items-center border border-gray-100">
        <div>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Status Harian</span>
            <div className="flex gap-4 font-bold mt-1 text-sm">
                <span className={isPlanSubmitted ? "text-blue-600" : "text-gray-400"}>
                    Rencana: {isPlanSubmitted ? "Tersimpan ✅" : "Belum ❌"}
                </span>
                <span className="text-gray-300">|</span>
                <span className={isExecutionSubmitted ? "text-green-600" : "text-gray-400"}>
                    Eksekusi: {isExecutionSubmitted ? "Tersimpan ✅" : "Belum ❌"}
                </span>
            </div>
        </div>
      </div>

      {/* FORM CONTENT */}
      <div className={`space-y-6 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        
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
              className="border p-2 rounded-lg w-full max-w-xs focus:ring-2 focus:ring-orange-200 outline-none"
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
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {/* Form Tambahan: Catatan Ibadah */}
          <label className="block text-sm font-bold text-gray-600 mb-1">Catatan Tambahan:</label>
          <textarea 
            placeholder="Contoh: Hafalan surat pendek, sedekah..."
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none text-sm"
            rows={2}
            value={formData.worship_detail}
            onChange={(e) => handleChange('worship_detail', e.target.value)}
          />
        </div>

        {/* 3. Olahraga */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-400">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏃</span>
            <h3 className="text-xl font-bold text-gray-800">Berolahraga</h3>
          </div>
          {renderPlanLabel('sport_activities')}
          
          <select 
            className="w-full border p-3 rounded-lg mb-3 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
            value={formData.sport_activities}
            onChange={(e) => handleChange('sport_activities', e.target.value)}
          >
            <option value="">Pilih Olahraga...</option>
            {exerciseOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          {/* Detail Aktivitas (Selalu muncul di Plan & Eksekusi sesuai request) */}
          <label className="block text-sm font-bold text-gray-600 mb-1">Detail Aktivitas:</label>
          <textarea 
            placeholder="Contoh: Lari 30 menit, Push up 20x..."
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm"
            rows={2}
            value={formData.sport_detail}
            onChange={(e) => handleChange('sport_detail', e.target.value)}
          />
        </div>

        {/* 4. Makan Sehat */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-400">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🥗</span>
            <h3 className="text-xl font-bold text-gray-800">Makan Sehat</h3>
          </div>
          {renderPlanLabel('meal_text')}
          <textarea 
            placeholder="Apa menu sehatmu hari ini?"
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-200 outline-none text-sm"
            rows={2}
            value={formData.meal_text}
            onChange={(e) => handleChange('meal_text', e.target.value)}
          />
        </div>

        {/* 5. Belajar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-400">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📚</span>
            <h3 className="text-xl font-bold text-gray-800">Gemar Belajar</h3>
          </div>
          {renderPlanLabel('study_activities', true)}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {learningOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.study_activities.includes(opt.value)}
                  onChange={() => handleCheckbox('study_activities', opt.value)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {/* Form Tambahan: Wawasan Baru */}
          <label className="block text-sm font-bold text-gray-600 mb-1">Wawasan Baru / Detail Belajar:</label>
          <textarea 
            placeholder="Apa hal baru yang kamu pelajari hari ini?"
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
            rows={2}
            value={formData.study_detail}
            onChange={(e) => handleChange('study_detail', e.target.value)}
          />
        </div>

        {/* 6. Bermasyarakat */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-teal-400">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🌍</span>
            <h3 className="text-xl font-bold text-gray-800">Bermasyarakat</h3>
          </div>
          {renderPlanLabel('social_activities', true)}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {socialOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.social_activities.includes(opt.value)}
                  onChange={() => handleCheckbox('social_activities', opt.value)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {/* Form Tambahan: Catatan Kebaikan */}
          <label className="block text-sm font-bold text-gray-600 mb-1">Catatan Kebaikan:</label>
          <textarea 
            placeholder="Ceritakan kebaikan yang kamu lakukan..."
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-teal-200 outline-none text-sm"
            rows={2}
            value={formData.social_detail}
            onChange={(e) => handleChange('social_detail', e.target.value)}
          />
        </div>

        {/* 7. Tidur Cepat */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-400">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🌙</span>
            <h3 className="text-xl font-bold text-gray-800">Tidur Cepat</h3>
          </div>
          {renderPlanLabel('sleep_time')}
          <div className="flex items-center gap-2">
            <input 
              type="time" 
              value={formData.sleep_time}
              onChange={(e) => handleChange('sleep_time', e.target.value)}
              className="border p-2 rounded-lg w-full max-w-xs focus:ring-2 focus:ring-indigo-200 outline-none"
            />
            <span className="font-bold text-gray-500">WIB</span>
          </div>
        </div>

      </div>

      {isLocked && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-xl mt-6 text-center animate-pulse shadow-md">
          <p className="font-bold text-lg mb-1">⚠️ Akses Dikunci</p>
          <p>Silakan isi tab <strong>Rencana</strong> terlebih dahulu sebelum mengisi Eksekusi!</p>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isLocked}
          className={`px-8 py-4 rounded-2xl font-black text-white shadow-xl transform transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
            activeTab === 'plan' ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600' : 
            isLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
          }`}
        >
          <span>💾</span> Simpan {activeTab === 'plan' ? 'Rencana' : 'Eksekusi'}
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;