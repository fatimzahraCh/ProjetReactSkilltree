import axios from 'axios';

// Cette instance servira à communiquer avec ton futur backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Le port dépendra de ton futur backend
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // On laisse 10 secondes car l'IA peut prendre du temps à répondre
});

export default api;
