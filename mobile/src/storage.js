import { Platform } from 'react-native';

// expo-secure-store can hang on web — use localStorage directly
const isWeb = Platform.OS === 'web';

export async function getItem(key) {
  if (isWeb) return localStorage.getItem(key);
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(key);
}

export async function setItem(key, value) {
  if (isWeb) { localStorage.setItem(key, value); return; }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key) {
  if (isWeb) { localStorage.removeItem(key); return; }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.deleteItemAsync(key);
}
