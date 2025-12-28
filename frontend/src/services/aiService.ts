import axios from 'axios';

const API_URL = 'https://backendkokurikuler.smpn6pekalongan.org/api/ai';

const getFeedback = (journalText: string) => {
  return axios.post(`${API_URL}/feedback`, { journalText });
};

export default {
  getFeedback,
};
