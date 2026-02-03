
import { AppState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';
const SUPABASE_TABLE = 'project_state';
const CONFIG_ID = 'current_omega_config';

export interface DbResult {
  state: AppState | null;
  error?: string;
  code?: string;
  details?: string;
}

export const dbService = {
  saveState: async (state: AppState): Promise<{ success: boolean; error?: any }> => {
    // Backup local apenas para contingência extrema
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (!supabase) return { success: false, error: 'Supabase não inicializado' };
    
    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .upsert({ 
          id: CONFIG_ID, 
          data: state, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });
      
      if (error) {
        console.error('Erro de Sincronização Cloud:', error);
        return { success: false, error };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  },

  loadState: async (): Promise<DbResult> => {
    if (!supabase) return { state: null, error: 'Supabase Offline' };

    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('data')
        .eq('id', CONFIG_ID)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          return { state: null, error: 'TABLE_NOT_FOUND', details: 'A tabela project_state não existe no banco de dados.' };
        }
        return { state: null, error: error.message };
      }

      if (data && data.data) {
        return { state: data.data as AppState };
      }
    } catch (e: any) {
      return { state: null, error: e.message };
    }

    return { state: null };
  }
};
