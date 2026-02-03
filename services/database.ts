
import { AppState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';
const SUPABASE_TABLE = 'project_state';
const CONFIG_ID = 'current_omega_config';

export interface DbResult {
  state: AppState | null;
  error?: string;
  code?: string;
}

export const dbService = {
  saveState: async (state: AppState): Promise<{ success: boolean; error?: any }> => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (supabase) {
      try {
        const { error } = await supabase
          .from(SUPABASE_TABLE)
          .upsert({ 
            id: CONFIG_ID, 
            data: state, 
            updated_at: new Date().toISOString() 
          }, { onConflict: 'id' });
        
        if (error) {
          console.warn('Erro Supabase:', error.message);
          return { success: false, error };
        }
        return { success: true };
      } catch (e) {
        return { success: false, error: e };
      }
    }
    return { success: true };
  },

  loadState: async (): Promise<DbResult> => {
    const localData = localStorage.getItem(STORAGE_KEY);
    const fallbackState = localData ? JSON.parse(localData) : null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(SUPABASE_TABLE)
          .select('data')
          .eq('id', CONFIG_ID)
          .single();

        if (error) {
          // Código 42P01 é "tabela não existe" no Postgres/Supabase
          if (error.code === '42P01' || error.message.includes('not find the table')) {
            return { state: fallbackState, error: 'TABLE_NOT_FOUND', code: error.code };
          }
          return { state: fallbackState, error: error.message };
        }

        if (data && data.data) {
          return { state: data.data as AppState };
        }
      } catch (e: any) {
        return { state: fallbackState, error: e.message };
      }
    }

    return { state: fallbackState };
  }
};
