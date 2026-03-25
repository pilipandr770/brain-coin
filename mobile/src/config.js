import { Platform } from 'react-native';

// Web browser (localhost testing) vs native device (needs real IP)
const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3001/api'
  : 'http://192.168.1.100:3001/api'; // ← для телефона замени на свой IP

export default API_URL;
