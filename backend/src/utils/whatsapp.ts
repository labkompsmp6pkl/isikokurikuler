import axios from 'axios';

// Mengambil token dari environment variables
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

export const sendWhatsApp = async (to: string, message: string) => {
  // Pastikan nomor telepon bersih dari karakter selain angka
  const target = to.replace(/[^0-9]/g, '');

  // Periksa apakah token sudah diatur
  if (!FONNTE_TOKEN) {
    console.error('FONNTE_TOKEN environment variable is not set.');
    return; // Hentikan eksekusi jika token tidak ada
  }

  try {
    await axios.post('https://api.fonnte.com/send', 
      {
        target: target,
        message: message
      },
      {
        headers: {
          'Authorization': FONNTE_TOKEN
        }
      }
    );
    console.log(`WhatsApp message sent to ${target}`);
  } catch (error) {
    const errorMessage = (error as any).response ? (error as any).response.data : error;
    console.error('Error sending WhatsApp message via FONNTE:', errorMessage);
  }
};
