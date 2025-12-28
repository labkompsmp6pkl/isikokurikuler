import React, { useState } from 'react';
import aiService from '../services/aiService'; // Diperbaiki: Menggunakan aiService

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
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Dasbor Siswa</h2>
      <p>Tulis entri jurnal Anda di bawah ini dan kirimkan untuk menerima umpan balik dari pelatih AI kami.</p>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="Mulai menulis jurnal Anda di sini..."
          rows={15}
          required
          style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <br />
        <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
          {isLoading ? 'Mengirim...' : 'Kirim untuk Umpan Balik'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}

      {feedback && (
        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
          <h3>Umpan Balik AI:</h3>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{feedback}</p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
