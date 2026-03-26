import { Platform } from 'react-native';

// Production backend URL (Render.com)
// After connecting a custom domain, update this value.
const PROD_API_URL = 'https://braincoin.onrender.com/api';

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3001/api'
  : __DEV__
    ? 'http://192.168.1.100:3001/api' // local dev: replace with your PC's IP
    : PROD_API_URL;

export default API_URL;
