import React, { useState } from 'react';
import aiService from '../../services/aiService'; // Diperbaiki: Menggunakan aiService

const StudentDashboard: React.FC = () => {
  const [journalText, setJournalText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFeedback('');

    try {
      // Diperbaiki: Memanggil aiService.getFeedback
      const response = await aiService.getFeedback(journalText);
      setFeedback(response.data.feedback);
    } catch (err) {
      setError('Gagal mendapatkan umpan balik. Silakan coba lagi.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Dasbor Siswa</h2>
          <p className="text-gray-600 mt-2">Tulis entri jurnal Anda di bawah ini dan kirimkan untuk menerima umpan balik dari pelatih AI kami.</p>
        </header>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <form onSubmit={handleSubmit}>
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Mulai menulis jurnal Anda di sini..."
              rows={15}
              required
              className="w-full p-4 text-base text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-4">
              <button 
                type="submit" 
                disabled={isLoading} 
                className="py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Mengirim...' : 'Kirim untuk Umpan Balik'}
              </button>
            </div>
          </form>
        </div>

        {error && 
          <div className="mt-6 p-4 bg-red-100 text-red-700 border border-red-200 rounded-lg">
            {error}
          </div>
        }

        {feedback && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Umpan Balik AI:</h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
