import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import characterService from '../../../services/characterService';
import { CharacterSection } from './components/CharacterSection';
import { TimeInput, TextArea, SelectInput, SearchableSelect } from './components/FormControls';
import { worshipOptions, exerciseOptions, learningOptions } from './components/options';
import ConfirmationModal from './components/ConfirmationModal';
import Spinner from './components/Spinner';

interface CharacterLog {
  id: number | null;
  log_date: string;
  wake_up_time: string;
  sleep_time: string;
  worship_activities: string[];
  worship_notes: string;
  exercise_type: string;
  exercise_details: string;
  healthy_food_notes: string;
  learning_subject: string;
  learning_details: string;
  social_activity_notes: string;
}

const createEmptyLog = (): CharacterLog => ({
  id: null,
  log_date: new Date().toISOString().slice(0, 10),
  wake_up_time: '',
  sleep_time: '',
  worship_activities: [],
  worship_notes: '',
  exercise_type: '',
  exercise_details: '',
  healthy_food_notes: '',
  learning_subject: '',
  learning_details: '',
  social_activity_notes: '',
});

// --- Komponen Baru: Tampilan Tugas Selesai ---
const TaskCompletedView: React.FC = () => (
  <div className="bg-white p-8 rounded-xl shadow-lg text-center flex flex-col items-center justify-center animate-fade-in" style={{minHeight: '500px'}}>
    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
      <svg className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 className="text-3xl font-bold text-gray-800">Tugas Selesai!</h2>
    <p className="text-gray-600 mt-3 text-lg">
      Anda telah berhasil mencatat karakter untuk hari ini. Sampai jumpa besok!
    </p>
  </div>
);

const Beranda: React.FC = () => {
  const [logData, setLogData] = useState<CharacterLog | null>(null);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false); // <-- State untuk melacak status tugas
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // --- Logika Diperbarui: Memeriksa apakah tugas sudah selesai saat memuat ---
  useEffect(() => {
    const fetchLogData = async () => {
      setIsLoading(true);
      try {
        const data = await characterService.getTodayLog();
        if (data) {
          // Jika data untuk hari ini sudah ada, tandai tugas sebagai selesai
          setIsTaskCompleted(true);
        } else {
          // Jika tidak, siapkan formulir kosong
          setIsTaskCompleted(false);
          setLogData(createEmptyLog());
        }
      } catch (error) {
        toast.error('Gagal memuat data. Coba muat ulang halaman.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogData();
  }, []);

  useEffect(() => {
    if (!logData) {
      setIsFormValid(false);
      return;
    }
    const isValid = 
        logData.wake_up_time !== '' &&
        logData.sleep_time !== '' &&
        logData.worship_activities.length > 0 &&
        logData.worship_notes.trim() !== '' &&
        logData.exercise_type.trim() !== '' &&
        logData.exercise_details.trim() !== '' &&
        logData.healthy_food_notes.trim() !== '' &&
        logData.learning_subject.trim() !== '' &&
        logData.learning_details.trim() !== '' &&
        logData.social_activity_notes.trim() !== '';
    setIsFormValid(isValid);
  }, [logData]);

  const handleChange = useCallback((field: keyof CharacterLog, value: any) => {
    setLogData(prev => (prev ? { ...prev, [field]: value } : null));
  }, []);

  const handleWorshipChange = (activity: string) => {
    const currentActivities = logData?.worship_activities || [];
    const newActivities = currentActivities.includes(activity)
      ? currentActivities.filter(a => a !== activity)
      : [...currentActivities, activity];
    handleChange('worship_activities', newActivities);
  };

  const openConfirmationModal = () => {
    if (!isFormValid) {
        toast.error('Harap lengkapi semua isian sebelum menyimpan.');
        return;
    }
    setIsConfirmModalOpen(true);
  };

  // --- Logika Diperbarui: Mengalihkan tampilan setelah menyimpan ---
  const handleSave = async () => {
    if (!logData || !isFormValid) return;
    setIsSaving(true);
    setIsConfirmModalOpen(false);
    const toastId = toast.loading('Menyimpan progress Anda...');

    try {
      await characterService.saveCharacterLog(logData);
      toast.success('Progress berhasil disimpan!', { id: toastId });
      setIsTaskCompleted(true); // <-- Langsung ubah tampilan ke "Tugas Selesai"
    } catch (error) {
      toast.error('Gagal menyimpan progress. Coba lagi.', { id: toastId });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  // --- Logika Diperbarui: Menampilkan formulir atau tampilan "Tugas Selesai" ---
  if (isTaskCompleted) {
    return <TaskCompletedView />;
  }

  if (!logData) {
    return <div className="text-center text-red-500">Gagal memuat data pencatatan.</div>;
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pencatatan Karakter Harian</h1>
        <p className="text-gray-500">Lengkapi jurnal harianmu untuk membangun kebiasaan baik.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <CharacterSection title="Bangun Pagi" subtitle="Jam bangun pagi Anda">
            <TimeInput value={logData.wake_up_time} onChange={e => handleChange('wake_up_time', e.target.value)} />
          </CharacterSection>

          <CharacterSection title="Beribadah" subtitle="Aktivitas ibadah hari ini (Islam)">
              <SelectInput options={worshipOptions} selected={logData.worship_activities} onChange={handleWorshipChange} />
              <TextArea value={logData.worship_notes} onChange={e => handleChange('worship_notes', e.target.value)} placeholder="Detail ibadah khusus hari ini..." />
          </CharacterSection>

          <CharacterSection title="Berolahraga" subtitle="Jenis olahraga yang dilakukan">
              <SearchableSelect options={exerciseOptions} value={logData.exercise_type} onChange={value => handleChange('exercise_type', value)} placeholder="Cari jenis olahraga..." />
              <TextArea value={logData.exercise_details} onChange={e => handleChange('exercise_details', e.target.value)} placeholder="Ceritakan detail olahraga Anda..." />
          </CharacterSection>

          <CharacterSection title="Makan Sehat & Bergizi" subtitle="Menu nutrisi seimbang harian">
            <TextArea value={logData.healthy_food_notes} onChange={e => handleChange('healthy_food_notes', e.target.value)} placeholder="Tuliskan menu makan sehat & bergizi harianmu..." />
          </CharacterSection>

          <CharacterSection title="Gemar Belajar" subtitle="Eksplorasi potensi & 8 Dimensi Profil Lulusan">
              <SearchableSelect options={learningOptions} value={logData.learning_subject} onChange={value => handleChange('learning_subject', value)} placeholder="Cari pelajaran..." />
              <TextArea value={logData.learning_details} onChange={e => handleChange('learning_details', e.target.value)} placeholder="Apa hal baru yang Anda pelajari hari ini?" />
          </CharacterSection>
          
          <CharacterSection title="Bermasyarakat" subtitle="Aksi sosial atau kebaikan publik">
              <TextArea value={logData.social_activity_notes} onChange={e => handleChange('social_activity_notes', e.target.value)} placeholder="Kebaikan apa yang Anda lakukan hari ini?" />
          </CharacterSection>

          <CharacterSection title="Tidur Cepat" subtitle="Jam tidur malam">
            <TimeInput value={logData.sleep_time} onChange={e => handleChange('sleep_time', e.target.value)} />
          </CharacterSection>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end items-center">
         <span className="text-sm text-gray-600 mr-4">Progress untuk tanggal: <span className="font-semibold">{new Date(logData.log_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></span>
        <button
            onClick={openConfirmationModal}
            disabled={isSaving || !isFormValid}
            className={`px-8 py-3 font-bold rounded-lg shadow-md transition-colors duration-300 ${
                isFormValid 
                ? 'bg-blue-700 text-white hover:bg-blue-800' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
            title={!isFormValid ? 'Harap lengkapi semua isian terlebih dahulu' : 'Simpan Progress Anda'}
        >
            {isSaving ? 'Menyimpan...' : 'Simpan Progress'}
        </button>
      </div>

      <ConfirmationModal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setIsConfirmModalOpen(false)} 
        onConfirm={handleSave}
        title="Konfirmasi Penyimpanan"
        message="Apakah Anda yakin ingin menyimpan progress Anda untuk hari ini? Pastikan semua data sudah benar."
      />
    </div>
  );
}

export default Beranda;
