
import { AppState, User, MonthlyData } from '../types';

// Este serviço simula o comportamento do Supabase usando LocalStorage.
// Para migrar para o Supabase real, substitua as chamadas de LocalStorage por chamadas do @supabase/supabase-js.

const STORAGE_KEY = 'omega_v2_data';

export const dbService = {
  saveState: (state: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  loadState: (): AppState | null => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Exemplo de como seria com Supabase:
  // async syncUser(user: User) {
  //   const { data, error } = await supabase.from('users').upsert(user);
  //   return data;
  // }
};
