import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONNECTED_KEY = '@lifevault:google_tasks_connected';

export async function markConnected(): Promise<void> {
  await AsyncStorage.setItem(CONNECTED_KEY, '1');
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(CONNECTED_KEY);
}

export async function isConnected(): Promise<boolean> {
  const flag = await AsyncStorage.getItem(CONNECTED_KEY);
  if (!flag) return false;
  try {
    return GoogleSignin.hasPreviousSignIn();
  } catch {
    return false;
  }
}

// GoogleSignin gestiona el refresh automáticamente via Google Play Services
export async function getValidAccessToken(): Promise<string | null> {
  try {
    const { accessToken } = await GoogleSignin.getTokens();
    return accessToken ?? null;
  } catch {
    return null;
  }
}
