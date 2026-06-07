import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/services/logger';

const STORAGE_KEY = '@neuralkey:v2:appstate';

export async function loadState<T>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error('Failed to load state from storage', { err: String(err) });
    return null;
  }
}

export async function saveState<T>(state: T): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    logger.error('Failed to save state to storage', { err: String(err) });
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    logger.error('Failed to clear state from storage', { err: String(err) });
  }
}
