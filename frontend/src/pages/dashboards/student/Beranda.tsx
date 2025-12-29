import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import characterService from '../../../services/characterService';
import { CharacterSection } from './components/CharacterSection';
import { TimeInput, TextArea, SelectInput, SearchableSelect } from './components/FormControls';
import { worshipOptions, exerciseOptions, learningOptions } from './components/options';
import ConfirmationModal from './components/ConfirmationModal';
import Spinner from './components/Spinner';

// Definisikan tipe data untuk log karakter
interface CharacterLog {
  id: number | null; // ID bisa null saat pembuatan awal
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

// Fungsi untuk membuat state log kosong
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

const Beranda: React.FC = () => {
  const [logData, setLogData] = useState<CharacterLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State baru untuk validasi form
  const [isFormValid, setIsFormValid] = useState(false);

  // Memuat data log yang ada atau menginisialisasi yang baru
  useEffect(() => {
    const fetchLogData = async () => {
      setIsLoading(true);
      try {
        const data = await characterService.getTodayLog();
        // Jika data ada, gunakan itu. Jika tidak (null), buat objek log kosong baru.
        setLogData(data || createEmptyLog());
      } catch (error) {
        toast.error('Gagal memuat data. Coba muat ulang halaman.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogData();
  }, []);

  // Validasi form setiap kali logData berubah
  useEffect(() => {
    if (!logData) {
      setIsFormValid(false);
      return;
    }
    // Cek semua field yang required. Tambahkan validasi sesuai kebutuhan.
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

  // Menangani perubahan input form
  const handleChange = useCallback((field: keyof CharacterLog, value: any) => {
    setLogData(prev => (prev ? { ...prev, [field]: value } : null));
  }, []);

  // Menangani checkbox aktivitas ibadah
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
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!logData || !isFormValid) return;
    setIsSaving(true);
    setIsModalOpen(false);
    const toastId = toast.loading('Menyimpan progress Anda...');

    try {
      await characterService.saveCharacterLog(logData);
      toast.success('Progress berhasil disimpan!', { id: toastId });
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

  if (!logData) {
    return <div className="text-center text-red-500">Gagal memuat data pencatatan.</div>;
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
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
        
        {/* Bug yang disebutkan sebelumnya telah diperbaiki di sini */}
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
            disabled={isSaving || !isFormValid} // Dinonaktifkan jika menyimpan atau form tidak valid
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
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleSave}
        title="Konfirmasi Penyimpanan"
        message="Apakah Anda yakin ingin menyimpan progress Anda untuk hari ini? Pastikan semua data sudah benar."
      />
    </div>
  );
}

export default Beranda;
