import axios from 'axios';

// Cette instance servira ├á communiquer avec ton futur backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Le port d├®pendra de ton futur backend
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // On laisse 10 secondes car l'IA peut prendre du temps ├á r├®pondre
});

export default api;
